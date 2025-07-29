import express, { Request, Response, NextFunction } from 'express';
import { searchService } from '@/services/SearchService';
import { authenticateToken, optionalAuth } from '@/middleware/auth';
import { UserRole } from '@/types/auth';
import winston from 'winston';

const router = express.Router();
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// =========================================
// SEARCH ROUTES
// =========================================

// Search help articles
router.get('/help', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      q: query = '',
      category,
      tags,
      minRating,
      sortBy = 'relevance',
      limit = 20,
      offset = 0
    } = req.query;

    // Validate query parameters
    if (typeof query !== 'string') {
      res.status(400).json({
        error: 'Query parameter must be a string'
      });
      return;
    }

    if (query.length > 200) {
      res.status(400).json({
        error: 'Query too long (max 200 characters)'
      });
      return;
    }

    const filters: any = {
      sortBy: sortBy as 'relevance' | 'rating' | 'views' | 'date',
      limit: Math.min(parseInt(limit as string) || 20, 50), // Max 50 results
      offset: parseInt(offset as string) || 0
    };

    if (category) {
      filters.category = category as string;
    }

    if (typeof tags === 'string') {
      filters.tags = tags.split(',');
    }

    if (minRating) {
      filters.minRating = parseFloat(minRating as string);
    }

    const searchResults = await searchService.searchHelpArticles(
      req.tenantContext!.tenantId,
      query,
      filters
    );

    logger.info('Help search performed', {
      tenantId: req.tenantContext!.tenantId,
      query: query.substring(0, 50), // Log first 50 chars only
      resultsCount: searchResults.results.length,
      searchTime: searchResults.search_time_ms
    });

    res.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    logger.error('Help search failed:', error);
    next(error);
  }
});

// Get specific help article
router.get('/help/:articleId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleId } = req.params;

    if (!articleId || typeof articleId !== 'string') {
      res.status(400).json({
        error: 'Valid article ID is required'
      });
      return;
    }

    const article = await searchService.getHelpArticle(
      req.tenantContext!.tenantId,
      articleId
    );

    if (!article) {
      res.status(404).json({
        error: 'Help article not found'
      });
      return;
    }

    res.json({
      success: true,
      data: article
    });

  } catch (error) {
    logger.error('Failed to get help article:', error);
    next(error);
  }
});

// Get popular help articles
router.get('/help/popular/top', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = Math.min(parseInt(limit as string) || 10, 20); // Max 20 results

    const popularArticles = await searchService.getPopularArticles(
      req.tenantContext!.tenantId,
      limitNum
    );

    res.json({
      success: true,
      data: popularArticles
    });

  } catch (error) {
    logger.error('Failed to get popular articles:', error);
    next(error);
  }
});

// Get help article categories
router.get('/help/categories', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await searchService.getCategories(req.tenantContext!.tenantId);

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Failed to get help categories:', error);
    next(error);
  }
});

// =========================================
// FEEDBACK ROUTES
// =========================================

// Submit feedback for help article
router.post('/help/:articleId/feedback', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { articleId } = req.params;
    const { rating, comment } = req.body;

    // Validation
    if (!articleId || typeof articleId !== 'string') {
      res.status(400).json({
        error: 'Valid article ID is required'
      });
      return;
    }

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Rating must be a number between 1 and 5'
      });
      return;
    }

    if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
      res.status(400).json({
        error: 'Comment must be a string with max 1000 characters'
      });
      return;
    }

    // Check if article exists first
    const article = await searchService.getHelpArticle(
      req.tenantContext!.tenantId,
      articleId
    );

    if (!article) {
      res.status(404).json({
        error: 'Help article not found'
      });
      return;
    }

    const success = await searchService.submitFeedback(
      req.tenantContext!.tenantId,
      req.user!.id,
      articleId,
      rating,
      comment
    );

    if (success) {
      logger.info('Help article feedback submitted', {
        tenantId: req.tenantContext!.tenantId,
        userId: req.user!.id,
        articleId,
        rating
      });

      res.json({
        success: true,
        message: 'Feedback submitted successfully'
      });
    } else {
      res.status(500).json({
        error: 'Failed to submit feedback'
      });
    }

  } catch (error) {
    logger.error('Failed to submit feedback:', error);
    
    if (error instanceof Error && error.message.includes('Rating must be between')) {
      res.status(400).json({
        error: error.message
      });
      return;
    }
    
    next(error);
  }
});

// =========================================
// ADMIN ROUTES (Future Implementation)
// =========================================

// Clear search cache (admin only)
router.delete('/cache', authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if user has admin privileges
    if (!req.user || ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(req.user.role)) {
      res.status(403).json({
        error: 'Admin privileges required'
      });
      return;
    }

    await searchService.clearSearchCache(req.tenantContext!.tenantId);

    logger.info('Search cache cleared', {
      tenantId: req.tenantContext!.tenantId,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Search cache cleared successfully'
    });

  } catch (error) {
    logger.error('Failed to clear search cache:', error);
    next(error);
  }
});

// Health check for search service
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple test search
    const testResult = await searchService.searchHelpArticles(
      req.tenantContext!.tenantId,
      'test',
      { limit: 1 }
    );

    res.json({
      status: 'healthy',
      service: 'search',
      timestamp: new Date().toISOString(),
      search_time_ms: testResult.search_time_ms
    });

  } catch (error) {
    logger.error('Search health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      service: 'search',
      timestamp: new Date().toISOString(),
      error: 'Search service unavailable'
    });
  }
});

export default router;