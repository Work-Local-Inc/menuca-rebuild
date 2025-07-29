import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Star, Eye, Calendar, TrendingUp, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HelpArticle {
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

interface SearchResult extends HelpArticle {
  relevance_score: number;
  matched_terms: string[];
}

interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  search_time_ms: number;
  suggestions: string[];
}

interface SearchFilters {
  category?: string;
  tags?: string[];
  minRating?: number;
  sortBy?: 'relevance' | 'rating' | 'views' | 'date';
}

export const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularArticles, setPopularArticles] = useState<HelpArticle[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'views' | 'date'>('relevance');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Feedback states
  const [feedbackArticleId, setFeedbackArticleId] = useState<string>('');
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  // Load initial data
  useEffect(() => {
    loadPopularArticles();
    loadCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.length >= 3) {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      
      return () => clearTimeout(timer);
    } else if (query.length === 0) {
      setResults([]);
      setSuggestions([]);
      setTotalCount(0);
    }
    return undefined;
  }, [query, selectedCategory, minRating, sortBy, currentPage]);

  const loadPopularArticles = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-tenant-id': 'default-tenant'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/v1/search/help/popular/top?limit=5', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setPopularArticles(data.data);
      }
    } catch (error) {
      console.error('Failed to load popular articles:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('jwt_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-tenant-id': 'default-tenant'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/v1/search/help/categories', {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const performSearch = async () => {
    if (query.length < 3) return;

    setLoading(true);
    
    try {
      const token = localStorage.getItem('jwt_token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'x-tenant-id': 'default-tenant'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const params = new URLSearchParams({
        q: query,
        sortBy,
        limit: itemsPerPage.toString(),
        offset: ((currentPage - 1) * itemsPerPage).toString()
      });

      if (selectedCategory) {
        params.append('category', selectedCategory);
      }

      if (minRating > 0) {
        params.append('minRating', minRating.toString());
      }

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await fetch(`/api/v1/search/help?${params}`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const searchData: SearchResponse = data.data;
        
        setResults(searchData.results);
        setTotalCount(searchData.total_count);
        setSearchTime(searchData.search_time_ms);
        setSuggestions(searchData.suggestions);
      } else {
        console.error('Search failed:', response.statusText);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (articleId: string, rating: number, comment: string) => {
    try {
      const token = localStorage.getItem('jwt_token');
      
      if (!token) {
        alert('Please log in to submit feedback');
        return;
      }

      const response = await fetch(`/api/v1/search/help/${articleId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': 'default-tenant'
        },
        body: JSON.stringify({ rating, comment })
      });

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setFeedbackArticleId('');
        setFeedbackRating(0);
        setFeedbackComment('');
      } else {
        const error = await response.json();
        alert(`Failed to submit feedback: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const highlightSearchTerms = (text: string, terms: string[]): string => {
    if (!terms.length) return text;
    
    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    });
    
    return highlightedText;
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
        <p className="text-gray-600">Find answers to your questions and get help with common issues</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search for help articles..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Did you mean:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {query.length >= 3 && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">
                Search Results {totalCount > 0 && `(${totalCount} found)`}
              </h2>
              {searchTime > 0 && (
                <p className="text-sm text-gray-500">
                  Search completed in {searchTime}ms
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Results */}
          {!loading && results.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      <span 
                        dangerouslySetInnerHTML={{
                          __html: highlightSearchTerms(article.title, article.matched_terms)
                        }}
                      />
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{article.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{article.view_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatTimeAgo(article.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{article.category}</Badge>
                    <div className="text-xs text-gray-500">
                      Relevance: {(article.relevance_score * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Content Preview */}
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightSearchTerms(
                        article.content.substring(0, 300) + (article.content.length > 300 ? '...' : ''),
                        article.matched_terms
                      )
                    }}
                  />

                  {/* Tags */}
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2 border-t">
                    <Button variant="outline" size="sm">
                      View Full Article
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFeedbackArticleId(article.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Rate This Article
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* No Results */}
          {!loading && results.length === 0 && query.length >= 3 && (
            <Card>
              <CardContent className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search terms or browse popular articles below
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Popular Articles (shown when no search) */}
      {query.length < 3 && popularArticles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Popular Articles</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-base">{article.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{article.rating.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{article.view_count}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    {article.content.substring(0, 100)}...
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {article.category}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackArticleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Rate This Article</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedbackArticleId('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rating *</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFeedbackRating(rating)}
                      className={`p-1 rounded ${
                        feedbackRating >= rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Comment (optional)</label>
                <textarea
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="Tell us what you think about this article..."
                  className="w-full p-2 border rounded-md resize-none"
                  rows={3}
                  maxLength={1000}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {feedbackComment.length}/1000 characters
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (feedbackRating > 0) {
                      submitFeedback(feedbackArticleId, feedbackRating, feedbackComment);
                    }
                  }}
                  disabled={feedbackRating === 0}
                  className="flex-1"
                >
                  Submit Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setFeedbackArticleId('')}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};