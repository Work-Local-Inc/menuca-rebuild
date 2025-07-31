import db from '@/database/connection';
import cache from '@/cache/memory';
import { Pool } from 'pg';

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  rating: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface SearchResult extends HelpArticle {
  relevance_score: number;
  matched_terms: string[];
}

export interface SearchFilters {
  category?: string;
  tags?: string[];
  minRating?: number;
  sortBy?: 'relevance' | 'rating' | 'views' | 'date';
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
  suggestions: string[];
}

export class SearchService {
  private pool: Pool;
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly SEARCH_CACHE_PREFIX = 'search:';
  private readonly ARTICLE_CACHE_PREFIX = 'article:';
  private readonly SUGGESTION_CACHE_PREFIX = 'suggestions:';

  constructor() {
    this.pool = db.getPool();
  }

  // =========================================
  // SEARCH METHODS
  // =========================================

  async searchHelpArticles(
    tenantId: string,
    query: string,
    filters: SearchFilters = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const cacheKey = this.getSearchCacheKey(tenantId, query, filters);

    try {
      // Try to get cached results
      const cached = await cache.get(cacheKey);
      if (cached) {
        const result = JSON.parse(cached) as SearchResponse;
        result.search_time_ms = Date.now() - startTime;
        return result;
      }

      // Perform database search
      const searchResults = await this.performDatabaseSearch(tenantId, query, filters);
      
      // Get search suggestions
      const suggestions = await this.generateSearchSuggestions(tenantId, query);

      const response: SearchResponse = {
        results: searchResults.results,
        total_count: searchResults.total_count,
        search_time_ms: Date.now() - startTime,
        suggestions
      };

      // Cache the results
      await cache.set(cacheKey, JSON.stringify(response), this.CACHE_TTL);

      return response;
    } catch (error) {
      console.error('Search failed:', error);
      throw new Error('Search service unavailable');
    }
  }

  private async performDatabaseSearch(
    tenantId: string,
    query: string,
    filters: SearchFilters
  ): Promise<{ results: SearchResult[]; total_count: number }> {
    const client = await this.pool.connect();

    try {
      // Set tenant context for RLS
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Prepare search terms
      const searchTerms = this.prepareSearchTerms(query);
      const tsQuery = searchTerms.map(term => `${term}:*`).join(' & ');

      // Build dynamic WHERE clause
      const whereConditions: string[] = [];
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      // Full-text search condition
      if (query.trim()) {
        whereConditions.push(`(
          to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')) 
          @@ to_tsquery('english', $${paramIndex})
        )`);
        queryParams.push(tsQuery);
        paramIndex++;
      }

      // Category filter
      if (filters.category) {
        whereConditions.push(`category = $${paramIndex}`);
        queryParams.push(filters.category);
        paramIndex++;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        whereConditions.push(`tags && $${paramIndex}`);
        queryParams.push(filters.tags);
        paramIndex++;
      }

      // Rating filter
      if (filters.minRating) {
        whereConditions.push(`rating >= $${paramIndex}`);
        queryParams.push(filters.minRating);
        paramIndex++;
      }

      // Build ORDER BY clause
      let orderBy = 'ORDER BY ';
      switch (filters.sortBy) {
        case 'rating':
          orderBy += 'rating DESC, view_count DESC';
          break;
        case 'views':
          orderBy += 'view_count DESC, rating DESC';
          break;
        case 'date':
          orderBy += 'updated_at DESC';
          break;
        case 'relevance':
        default:
          if (query.trim()) {
            orderBy += `ts_rank(
              to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')),
              to_tsquery('english', $2)
            ) DESC, rating DESC`;
          } else {
            orderBy += 'rating DESC, view_count DESC';
          }
          break;
      }

      const whereClause = whereConditions.length > 0 
        ? 'WHERE ' + whereConditions.join(' AND ')
        : '';

      // Main search query
      const searchQuery = `
        SELECT 
          id,
          title,
          content,
          category,
          tags,
          rating,
          view_count,
          created_at,
          updated_at,
          ${query.trim() ? `
            ts_rank(
              to_tsvector('english', title || ' ' || content || ' ' || array_to_string(tags, ' ')),
              to_tsquery('english', $2)
            ) as relevance_score,
            ts_headline('english', content, to_tsquery('english', $2)) as highlighted_content
          ` : '1.0 as relevance_score, content as highlighted_content'}
        FROM help_articles
        ${whereClause}
        ${orderBy}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(filters.limit || 20);
      queryParams.push(filters.offset || 0);

      const searchResult = await client.query(searchQuery, queryParams);

      // Count query
      const countQuery = `
        SELECT COUNT(*) as total
        FROM help_articles
        ${whereClause}
      `;

      const countResult = await client.query(countQuery, queryParams.slice(0, paramIndex - 2));

      // Process results
      const results: SearchResult[] = searchResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.highlighted_content || row.content,
        category: row.category,
        tags: row.tags,
        rating: parseFloat(row.rating),
        view_count: row.view_count,
        created_at: row.created_at,
        updated_at: row.updated_at,
        relevance_score: parseFloat(row.relevance_score),
        matched_terms: this.extractMatchedTerms(query, row.title + ' ' + row.content)
      }));

      return {
        results,
        total_count: parseInt(countResult.rows[0].total)
      };

    } finally {
      client.release();
    }
  }

  private prepareSearchTerms(query: string): string[] {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2)
      .slice(0, 10); // Limit to 10 terms to prevent overly complex queries
  }

  private extractMatchedTerms(query: string, content: string): string[] {
    const searchTerms = this.prepareSearchTerms(query);
    const contentLower = content.toLowerCase();
    
    return searchTerms.filter(term => 
      contentLower.includes(term.toLowerCase())
    );
  }

  // =========================================
  // SUGGESTION METHODS
  // =========================================

  private async generateSearchSuggestions(tenantId: string, query: string): Promise<string[]> {
    if (!query || query.length < 3) return [];

    const cacheKey = `${this.SUGGESTION_CACHE_PREFIX}${tenantId}:${query.toLowerCase()}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const client = await this.pool.connect();

      try {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);

        const suggestionsQuery = `
          SELECT DISTINCT title
          FROM help_articles
          WHERE title ILIKE $1
          ORDER BY view_count DESC, rating DESC
          LIMIT 5
        `;

        const result = await client.query(suggestionsQuery, [`%${query}%`]);
        const suggestions = result.rows.map(row => row.title);

        await cache.set(cacheKey, JSON.stringify(suggestions), this.CACHE_TTL);

        return suggestions;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  // =========================================
  // ARTICLE MANAGEMENT METHODS
  // =========================================

  async getHelpArticle(tenantId: string, articleId: string): Promise<HelpArticle | null> {
    const cacheKey = `${this.ARTICLE_CACHE_PREFIX}${tenantId}:${articleId}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        // Increment view count asynchronously
        this.incrementViewCount(tenantId, articleId);
        return JSON.parse(cached);
      }

      const client = await this.pool.connect();

      try {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);

        const query = `
          SELECT id, title, content, category, tags, rating, view_count, created_at, updated_at
          FROM help_articles
          WHERE id = $1
        `;

        const result = await client.query(query, [articleId]);

        if (result.rows.length === 0) {
          return null;
        }

        const article: HelpArticle = {
          id: result.rows[0].id,
          title: result.rows[0].title,
          content: result.rows[0].content,
          category: result.rows[0].category,
          tags: result.rows[0].tags,
          rating: parseFloat(result.rows[0].rating),
          view_count: result.rows[0].view_count,
          created_at: result.rows[0].created_at,
          updated_at: result.rows[0].updated_at
        };

        // Cache the article
        await cache.set(cacheKey, JSON.stringify(article), this.CACHE_TTL);

        // Increment view count asynchronously
        this.incrementViewCount(tenantId, articleId);

        return article;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to get help article:', error);
      return null;
    }
  }

  private async incrementViewCount(tenantId: string, articleId: string): Promise<void> {
    try {
      const client = await this.pool.connect();

      try {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);
        await client.query(
          'UPDATE help_articles SET view_count = view_count + 1 WHERE id = $1',
          [articleId]
        );

        // Invalidate cache
        const cacheKey = `${this.ARTICLE_CACHE_PREFIX}${tenantId}:${articleId}`;
        await cache.del(cacheKey);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  }

  // =========================================
  // FEEDBACK METHODS
  // =========================================

  async submitFeedback(
    tenantId: string,
    userId: string,
    articleId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query('SET app.current_tenant_id = $1', [tenantId]);

      // Insert feedback
      await client.query(`
        INSERT INTO help_article_feedback (tenant_id, user_id, article_id, rating, comment, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (tenant_id, user_id, article_id) 
        DO UPDATE SET rating = $4, comment = $5, updated_at = NOW()
      `, [tenantId, userId, articleId, rating, comment]);

      // Update article rating
      await client.query(`
        UPDATE help_articles 
        SET rating = (
          SELECT AVG(rating) 
          FROM help_article_feedback 
          WHERE article_id = $1
        )
        WHERE id = $1
      `, [articleId]);

      await client.query('COMMIT');

      // Invalidate caches
      const articleCacheKey = `${this.ARTICLE_CACHE_PREFIX}${tenantId}:${articleId}`;
      await cache.del(articleCacheKey);

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to submit feedback:', error);
      throw new Error('Failed to submit feedback');
    } finally {
      client.release();
    }
  }

  // =========================================
  // POPULAR CONTENT METHODS
  // =========================================

  async getPopularArticles(tenantId: string, limit: number = 10): Promise<HelpArticle[]> {
    const cacheKey = `popular_articles:${tenantId}:${limit}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const client = await this.pool.connect();

      try {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);

        const query = `
          SELECT id, title, content, category, tags, rating, view_count, created_at, updated_at
          FROM help_articles
          ORDER BY view_count DESC, rating DESC
          LIMIT $1
        `;

        const result = await client.query(query, [limit]);

        const articles: HelpArticle[] = result.rows.map(row => ({
          id: row.id,
          title: row.title,
          content: row.content,
          category: row.category,
          tags: row.tags,
          rating: parseFloat(row.rating),
          view_count: row.view_count,
          created_at: row.created_at,
          updated_at: row.updated_at
        }));

        await cache.set(cacheKey, JSON.stringify(articles), this.CACHE_TTL);

        return articles;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to get popular articles:', error);
      return [];
    }
  }

  async getCategories(tenantId: string): Promise<string[]> {
    const cacheKey = `categories:${tenantId}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const client = await this.pool.connect();

      try {
        await client.query('SET app.current_tenant_id = $1', [tenantId]);

        const query = `
          SELECT DISTINCT category
          FROM help_articles
          WHERE category IS NOT NULL
          ORDER BY category
        `;

        const result = await client.query(query);
        const categories = result.rows.map(row => row.category);

        await cache.set(cacheKey, JSON.stringify(categories), this.CACHE_TTL * 2); // Cache longer

        return categories;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  // =========================================
  // UTILITY METHODS
  // =========================================

  private getSearchCacheKey(tenantId: string, query: string, filters: SearchFilters): string {
    const filterString = JSON.stringify(filters);
    const queryHash = Buffer.from(query + filterString).toString('base64');
    return `${this.SEARCH_CACHE_PREFIX}${tenantId}:${queryHash}`;
  }

  async clearSearchCache(tenantId: string): Promise<void> {
    try {
      const pattern = `${this.SEARCH_CACHE_PREFIX}${tenantId}:*`;
      // For now, we'll skip the keys operation since it's not critical
      // This would be implemented with a proper Redis scanning method in production
      console.log(`Would clear cache for pattern: ${pattern}`);
    } catch (error) {
      console.error('Failed to clear search cache:', error);
    }
  }
}

export const searchService = new SearchService();