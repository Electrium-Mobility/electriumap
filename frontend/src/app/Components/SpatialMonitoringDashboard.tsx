'use client';

import React, { useState, useEffect } from 'react';
import { spatialAnalytics, monitoringUtils } from '../utils/spatialAnalytics';

interface DashboardProps {
  refreshInterval?: number; // in seconds
  className?: string;
}

const SpatialMonitoringDashboard: React.FC<DashboardProps> = ({ 
  refreshInterval = 30, 
  className = ''
}) => {
  const [stats, setStats] = useState(spatialAnalytics.getStats());
  const [patterns, setPatterns] = useState<Record<string, number>>({});
  const [isHealthy, setIsHealthy] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      const newStats = spatialAnalytics.getStats();
      setStats(newStats);
      setPatterns(spatialAnalytics.getQueryPatterns());
      setIsHealthy(monitoringUtils.isPerformanceHealthy());
    };

    updateStats();
    const interval = setInterval(updateStats, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getHealthColor = () => {
    if (isHealthy) return 'text-green-600';
    if (stats.errorRate > 20) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getHealthStatus = () => {
    if (isHealthy) return 'Healthy';
    if (stats.errorRate > 20) return 'Critical';
    return 'Warning';
  };

  if (stats.totalQueries === 0) {
    return (
      <div className={`p-4 bg-gray-100 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Spatial Query Monitor
        </h3>
        <p className="text-gray-600">No query data available yet.</p>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white rounded-lg shadow-lg border ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Spatial Query Monitor
        </h3>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${getHealthColor()}`}>
            <div className="w-2 h-2 bg-current rounded-full"></div>
            <span className="text-sm font-medium">{getHealthStatus()}</span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats.totalQueries}
          </div>
          <div className="text-sm text-blue-700">Total Queries</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {formatTime(stats.averageResponseTime)}
          </div>
          <div className="text-sm text-green-700">Avg Response</div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatPercentage(stats.cacheHitRate)}
          </div>
          <div className="text-sm text-purple-700">Cache Hit Rate</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {formatPercentage(stats.errorRate)}
          </div>
          <div className="text-sm text-orange-700">Error Rate</div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Query Types */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Query Types</h4>
            <div className="space-y-2">
              {Object.entries(stats.popularQueryTypes)
                .sort(([,a], [,b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700 capitalize">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ 
                            width: `${(count / stats.totalQueries) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Slow Queries */}
          {stats.slowQueries.length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-3">
                Slow Queries (>{formatTime(5000)})
              </h4>
              <div className="space-y-2">
                {stats.slowQueries.slice(0, 5).map((query, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-red-700 capitalize">
                      {query.queryType}
                    </span>
                    <span className="text-red-600 font-medium">
                      {formatTime(query.responseTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Patterns */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">
              Query Patterns (24h)
            </h4>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, i) => i).map(hour => {
                const count = patterns[hour] || 0;
                const maxCount = Math.max(...Object.values(patterns), 1);
                const height = Math.max((count / maxCount) * 40, 2);
                
                return (
                  <div key={hour} className="flex flex-col items-center">
                    <div
                      className="bg-blue-500 rounded-sm w-4 mb-1"
                      style={{ height: `${height}px` }}
                      title={`${hour}:00 - ${count} queries`}
                    ></div>
                    <div className="text-xs text-gray-600">
                      {hour}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => {
                console.log(spatialAnalytics.generateReport());
                alert('Performance report logged to console');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Generate Report
            </button>
            <button
              onClick={() => {
                const data = spatialAnalytics.exportMetrics();
                const blob = new Blob([JSON.stringify(data, null, 2)], {
                  type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `spatial-metrics-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
            >
              Export Data
            </button>
            <button
              onClick={() => {
                spatialAnalytics.clearMetrics();
                setStats(spatialAnalytics.getStats());
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              Clear Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpatialMonitoringDashboard; 