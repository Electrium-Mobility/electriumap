/**
 * Spatial Query Analytics & Monitoring
 * 
 * This module provides monitoring and analytics for spatial queries
 * to help optimize performance and understand usage patterns.
 */

interface QueryMetrics {
  queryType: string;
  parameters: any;
  responseTime: number;
  resultCount: number;
  timestamp: Date;
  cacheHit: boolean;
  error?: string;
}

interface PerformanceStats {
  totalQueries: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  popularQueryTypes: Record<string, number>;
  slowQueries: QueryMetrics[];
}

class SpatialAnalytics {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 queries
  private slowQueryThreshold = 5000; // 5 seconds

  /**
   * Record a query execution
   */
  recordQuery(metric: QueryMetrics): void {
    this.metrics.push(metric);
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow queries
    if (metric.responseTime > this.slowQueryThreshold) {
      console.warn('Slow spatial query detected:', {
        queryType: metric.queryType,
        responseTime: metric.responseTime,
        parameters: metric.parameters,
        timestamp: metric.timestamp
      });
    }

    // Log errors
    if (metric.error) {
      console.error('Spatial query error:', {
        queryType: metric.queryType,
        error: metric.error,
        parameters: metric.parameters,
        timestamp: metric.timestamp
      });
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        popularQueryTypes: {},
        slowQueries: []
      };
    }

    const totalQueries = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalQueries;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const errors = this.metrics.filter(m => m.error).length;
    const cacheHitRate = (cacheHits / totalQueries) * 100;
    const errorRate = (errors / totalQueries) * 100;

    // Count query types
    const popularQueryTypes: Record<string, number> = {};
    this.metrics.forEach(m => {
      popularQueryTypes[m.queryType] = (popularQueryTypes[m.queryType] || 0) + 1;
    });

    // Get slow queries
    const slowQueries = this.metrics
      .filter(m => m.responseTime > this.slowQueryThreshold)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 10); // Top 10 slowest

    return {
      totalQueries,
      averageResponseTime,
      cacheHitRate,
      errorRate,
      popularQueryTypes,
      slowQueries
    };
  }

  /**
   * Get query patterns by time
   */
  getQueryPatterns(hours: number = 24): Record<string, number> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    
    const patterns: Record<string, number> = {};
    recentMetrics.forEach(m => {
      const hour = m.timestamp.getHours();
      patterns[hour] = (patterns[hour] || 0) + 1;
    });

    return patterns;
  }

  /**
   * Get most common query parameters
   */
  getCommonParameters(): Record<string, any> {
    const paramCounts: Record<string, Record<string, number>> = {};
    
    this.metrics.forEach(m => {
      Object.keys(m.parameters).forEach(key => {
        if (!paramCounts[key]) paramCounts[key] = {};
        const value = m.parameters[key];
        paramCounts[key][value] = (paramCounts[key][value] || 0) + 1;
      });
    });

    // Get most common value for each parameter
    const commonParams: Record<string, any> = {};
    Object.keys(paramCounts).forEach(key => {
      const values = paramCounts[key];
      const mostCommon = Object.keys(values).reduce((a, b) => 
        values[a] > values[b] ? a : b
      );
      commonParams[key] = mostCommon;
    });

    return commonParams;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const stats = this.getStats();
    const patterns = this.getQueryPatterns();
    const commonParams = this.getCommonParameters();

    return `
=== Spatial Query Performance Report ===
Generated: ${new Date().toISOString()}

OVERALL STATISTICS:
- Total Queries: ${stats.totalQueries}
- Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms
- Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%
- Error Rate: ${stats.errorRate.toFixed(1)}%

POPULAR QUERY TYPES:
${Object.entries(stats.popularQueryTypes)
  .sort(([,a], [,b]) => b - a)
  .map(([type, count]) => `- ${type}: ${count} queries`)
  .join('\n')}

SLOW QUERIES (> ${this.slowQueryThreshold}ms):
${stats.slowQueries.length > 0 ? 
  stats.slowQueries.map(q => 
    `- ${q.queryType}: ${q.responseTime}ms at ${q.timestamp.toISOString()}`
  ).join('\n') : 
  'None detected'
}

QUERY PATTERNS (24h):
${Object.entries(patterns)
  .sort(([a], [b]) => parseInt(a) - parseInt(b))
  .map(([hour, count]) => `- ${hour}:00: ${count} queries`)
  .join('\n')}

COMMON PARAMETERS:
${Object.entries(commonParams)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

RECOMMENDATIONS:
${this.generateRecommendations(stats)}
`;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(stats: PerformanceStats): string {
    const recommendations: string[] = [];

    if (stats.cacheHitRate < 50) {
      recommendations.push('- Consider increasing cache duration or implementing more aggressive caching');
    }

    if (stats.errorRate > 5) {
      recommendations.push('- High error rate detected - review error handling and validation');
    }

    if (stats.averageResponseTime > 2000) {
      recommendations.push('- Average response time is high - consider adding database indexes or optimizing queries');
    }

    if (stats.slowQueries.length > 5) {
      recommendations.push('- Multiple slow queries detected - review query optimization and consider pagination');
    }

    const radiusQueries = stats.popularQueryTypes.radius || 0;
    const boundsQueries = stats.popularQueryTypes.bounds || 0;
    if (radiusQueries > boundsQueries * 2) {
      recommendations.push('- Radius queries are much more common than bounds queries - consider optimizing radius query performance');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Performance looks good! No immediate optimizations needed.';
  }

  /**
   * Clear old metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): QueryMetrics[] {
    return [...this.metrics];
  }
}

// Global analytics instance
export const spatialAnalytics = new SpatialAnalytics();

// Helper function to wrap queries with analytics
export function withAnalytics<T extends any[], R>(
  queryType: string,
  queryFn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    let error: string | undefined;
    let result: R;
    let cacheHit = false;

    try {
      result = await queryFn(...args);
      // Check if result came from cache (simple heuristic)
      cacheHit = Date.now() - startTime < 50; // Very fast response likely from cache
      return result;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      throw e;
    } finally {
      const responseTime = Date.now() - startTime;
      
      spatialAnalytics.recordQuery({
        queryType,
        parameters: args.length > 0 ? args[0] : {},
        responseTime,
        resultCount: Array.isArray(result) ? result.length : 1,
        timestamp: new Date(),
        cacheHit,
        error
      });
    }
  };
}

// Export utility functions for monitoring
export const monitoringUtils = {
  /**
   * Set up periodic reporting
   */
  setupPeriodicReporting(intervalMinutes: number = 60): void {
    setInterval(() => {
      const report = spatialAnalytics.generateReport();
      console.log('=== SPATIAL QUERY PERFORMANCE REPORT ===');
      console.log(report);
    }, intervalMinutes * 60 * 1000);
  },

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceStats {
    return spatialAnalytics.getStats();
  },

  /**
   * Check if performance is healthy
   */
  isPerformanceHealthy(): boolean {
    const stats = spatialAnalytics.getStats();
    return (
      stats.averageResponseTime < 2000 &&
      stats.cacheHitRate > 30 &&
      stats.errorRate < 10
    );
  }
}; 