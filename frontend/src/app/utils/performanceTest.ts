/**
 * Performance Testing Suite for Spatial Indexing
 * 
 * This module provides comprehensive benchmarking tools to test
 * the speed and efficiency of spatial queries.
 */

interface TestResult {
  queryType: string;
  parameters: any;
  responseTime: number;
  resultCount: number;
  cacheHit: boolean;
  timestamp: Date;
  error?: string;
}

interface BenchmarkSuite {
  name: string;
  totalTests: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  results: TestResult[];
}

class SpatialPerformanceTester {
  private baseUrl: string;
  private results: TestResult[] = [];

  constructor(baseUrl: string = 'http://localhost:3004') {
    this.baseUrl = baseUrl;
  }

  /**
   * Single API call with timing
   */
  private async timeApiCall(
    endpoint: string,
    queryType: string,
    parameters: any
  ): Promise<TestResult> {
    const startTime = Date.now();
    let error: string | undefined;
    let resultCount = 0;
    let cacheHit = false;

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json();
        error = errorData.message || `HTTP ${response.status}`;
      } else {
        const data = await response.json();
        resultCount = data.meta?.count || data.data?.length || 0;
        cacheHit = responseTime < 100; // Simple heuristic for cache detection
      }

      return {
        queryType,
        parameters,
        responseTime: Date.now() - startTime,
        resultCount,
        cacheHit,
        timestamp: new Date(),
        error
      };
    } catch (err) {
      return {
        queryType,
        parameters,
        responseTime: Date.now() - startTime,
        resultCount: 0,
        cacheHit: false,
        timestamp: new Date(),
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }

  /**
   * Test all query types
   */
  async testAllQueryTypes(): Promise<BenchmarkSuite> {
    console.log('🚀 Testing all query types...');
    
    const tests = [
      {
        name: 'All Outlets',
        endpoint: '/api/outlets?type=all',
        type: 'all',
        params: {}
      },
      {
        name: 'Radius Query (NYC)',
        endpoint: '/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=50',
        type: 'radius',
        params: { centerLat: 40.7128, centerLng: -74.0060, radius: 50 }
      },
      {
        name: 'Radius Query (Philly)',
        endpoint: '/api/outlets?type=radius&centerLat=39.9526&centerLng=-75.1652&radius=100',
        type: 'radius',
        params: { centerLat: 39.9526, centerLng: -75.1652, radius: 100 }
      },
      {
        name: 'Bounds Query (East Coast)',
        endpoint: '/api/outlets?type=bounds&southWestLat=35&southWestLng=-85&northEastLat=45&northEastLng=-70',
        type: 'bounds',
        params: { southWestLat: 35, southWestLng: -85, northEastLat: 45, northEastLng: -70 }
      },
      {
        name: 'Nearest Query (NYC)',
        endpoint: '/api/outlets?type=nearest&centerLat=40.7128&centerLng=-74.0060&limit=5',
        type: 'nearest',
        params: { centerLat: 40.7128, centerLng: -74.0060, limit: 5 }
      },
      {
        name: 'Nearest Query (Philly)',
        endpoint: '/api/outlets?type=nearest&centerLat=39.9526&centerLng=-75.1652&limit=10',
        type: 'nearest',
        params: { centerLat: 39.9526, centerLng: -75.1652, limit: 10 }
      }
    ];

    const results: TestResult[] = [];
    
    for (const test of tests) {
      console.log(`⏱️  Testing: ${test.name}`);
      const result = await this.timeApiCall(test.endpoint, test.type, test.params);
      results.push(result);
      
      console.log(`   ✅ ${result.responseTime}ms (${result.resultCount} results)${result.cacheHit ? ' [CACHE]' : ''}`);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return this.analyzeBenchmark('All Query Types', results);
  }

  /**
   * Test caching effectiveness
   */
  async testCaching(): Promise<BenchmarkSuite> {
    console.log('🔄 Testing caching effectiveness...');
    
    const testQuery = '/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=25';
    const results: TestResult[] = [];
    
    // First call (should miss cache)
    console.log('   📡 First call (cache miss expected)');
    const firstCall = await this.timeApiCall(testQuery, 'radius', { centerLat: 40.7128, centerLng: -74.0060, radius: 25 });
    results.push(firstCall);
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Second call (should hit cache)
    console.log('   ⚡ Second call (cache hit expected)');
    const secondCall = await this.timeApiCall(testQuery, 'radius', { centerLat: 40.7128, centerLng: -74.0060, radius: 25 });
    results.push(secondCall);
    
    // Third call (should hit cache)
    console.log('   ⚡ Third call (cache hit expected)');
    const thirdCall = await this.timeApiCall(testQuery, 'radius', { centerLat: 40.7128, centerLng: -74.0060, radius: 25 });
    results.push(thirdCall);
    
    const improvement = ((firstCall.responseTime - secondCall.responseTime) / firstCall.responseTime) * 100;
    console.log(`   📊 Cache improvement: ${improvement.toFixed(1)}% faster`);
    
    return this.analyzeBenchmark('Caching Test', results);
  }

  /**
   * Load test with concurrent requests
   */
  async testConcurrentLoad(concurrency: number = 10): Promise<BenchmarkSuite> {
    console.log(`🔥 Testing concurrent load (${concurrency} requests)...`);
    
    const testQueries = [
      '/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=30',
      '/api/outlets?type=radius&centerLat=39.9526&centerLng=-75.1652&radius=40',
      '/api/outlets?type=nearest&centerLat=40.7128&centerLng=-74.0060&limit=5',
      '/api/outlets?type=nearest&centerLat=39.9526&centerLng=-75.1652&limit=8'
    ];
    
    const promises: Promise<TestResult>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      const query = testQueries[i % testQueries.length];
      const promise = this.timeApiCall(query, 'concurrent', { requestId: i });
      promises.push(promise);
    }
    
    const results = await Promise.all(promises);
    
    console.log(`   ✅ Completed ${results.length} concurrent requests`);
    
    return this.analyzeBenchmark('Concurrent Load Test', results);
  }

  /**
   * Test different radius sizes
   */
  async testRadiusSizes(): Promise<BenchmarkSuite> {
    console.log('📏 Testing different radius sizes...');
    
    const centerLat = 40.7128;
    const centerLng = -74.0060;
    const radii = [1, 5, 10, 25, 50, 100, 250, 500];
    
    const results: TestResult[] = [];
    
    for (const radius of radii) {
      console.log(`   📍 Testing radius: ${radius}km`);
      const endpoint = `/api/outlets?type=radius&centerLat=${centerLat}&centerLng=${centerLng}&radius=${radius}`;
      const result = await this.timeApiCall(endpoint, 'radius', { centerLat, centerLng, radius });
      results.push(result);
      
      console.log(`      ⏱️  ${result.responseTime}ms (${result.resultCount} results)`);
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return this.analyzeBenchmark('Radius Size Test', results);
  }

  /**
   * Test error handling performance
   */
  async testErrorHandling(): Promise<BenchmarkSuite> {
    console.log('❌ Testing error handling performance...');
    
    const errorTests = [
      {
        name: 'Invalid Latitude',
        endpoint: '/api/outlets?type=radius&centerLat=91&centerLng=-74.0060&radius=10',
        type: 'error',
        params: { centerLat: 91, centerLng: -74.0060, radius: 10 }
      },
      {
        name: 'Invalid Longitude',
        endpoint: '/api/outlets?type=radius&centerLat=40.7128&centerLng=181&radius=10',
        type: 'error',
        params: { centerLat: 40.7128, centerLng: 181, radius: 10 }
      },
      {
        name: 'Invalid Radius',
        endpoint: '/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=-10',
        type: 'error',
        params: { centerLat: 40.7128, centerLng: -74.0060, radius: -10 }
      },
      {
        name: 'Invalid Query Type',
        endpoint: '/api/outlets?type=invalid&centerLat=40.7128&centerLng=-74.0060',
        type: 'error',
        params: { type: 'invalid' }
      }
    ];
    
    const results: TestResult[] = [];
    
    for (const test of errorTests) {
      console.log(`   ⚠️  Testing: ${test.name}`);
      const result = await this.timeApiCall(test.endpoint, test.type, test.params);
      results.push(result);
      
      console.log(`      ⏱️  ${result.responseTime}ms (Error: ${result.error})`);
    }
    
    return this.analyzeBenchmark('Error Handling Test', results);
  }

  /**
   * Analyze benchmark results
   */
  private analyzeBenchmark(name: string, results: TestResult[]): BenchmarkSuite {
    const times = results.map(r => r.responseTime);
    const successfulResults = results.filter(r => !r.error);
    
    return {
      name,
      totalTests: results.length,
      totalTime: times.reduce((sum, time) => sum + time, 0),
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      successRate: (successfulResults.length / results.length) * 100,
      results
    };
  }

  /**
   * Run comprehensive benchmark suite
   */
  async runFullBenchmark(): Promise<BenchmarkSuite[]> {
    console.log('🏁 Starting comprehensive performance benchmark...\n');
    
    const suites: BenchmarkSuite[] = [];
    
    try {
      // Test all query types
      suites.push(await this.testAllQueryTypes());
      
      // Test caching
      suites.push(await this.testCaching());
      
      // Test concurrent load
      suites.push(await this.testConcurrentLoad(5));
      
      // Test different radius sizes
      suites.push(await this.testRadiusSizes());
      
      // Test error handling
      suites.push(await this.testErrorHandling());
      
      console.log('\n📊 Benchmark completed!');
      this.printBenchmarkReport(suites);
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
    }
    
    return suites;
  }

  /**
   * Print detailed benchmark report
   */
  private printBenchmarkReport(suites: BenchmarkSuite[]): void {
    console.log('\n' + '='.repeat(60));
    console.log('📈 SPATIAL INDEXING PERFORMANCE REPORT');
    console.log('='.repeat(60));
    
    for (const suite of suites) {
      console.log(`\n🔍 ${suite.name.toUpperCase()}`);
      console.log('-'.repeat(40));
      console.log(`Total Tests: ${suite.totalTests}`);
      console.log(`Average Time: ${suite.averageTime.toFixed(1)}ms`);
      console.log(`Min Time: ${suite.minTime}ms`);
      console.log(`Max Time: ${suite.maxTime}ms`);
      console.log(`Success Rate: ${suite.successRate.toFixed(1)}%`);
      console.log(`Total Time: ${suite.totalTime.toFixed(1)}ms`);
      
      if (suite.name === 'Caching Test') {
        const cacheHits = suite.results.filter(r => r.cacheHit).length;
        console.log(`Cache Hits: ${cacheHits}/${suite.results.length}`);
      }
    }
    
    // Overall statistics
    const allResults = suites.flatMap(s => s.results);
    const overallAverage = allResults.reduce((sum, r) => sum + r.responseTime, 0) / allResults.length;
    const errors = allResults.filter(r => r.error).length;
    
    console.log('\n🏆 OVERALL STATISTICS');
    console.log('-'.repeat(40));
    console.log(`Total API Calls: ${allResults.length}`);
    console.log(`Overall Average: ${overallAverage.toFixed(1)}ms`);
    console.log(`Error Rate: ${((errors / allResults.length) * 100).toFixed(1)}%`);
    console.log(`Cache Hit Rate: ${((allResults.filter(r => r.cacheHit).length / allResults.length) * 100).toFixed(1)}%`);
    
    // Performance grades
    console.log('\n📝 PERFORMANCE GRADES');
    console.log('-'.repeat(40));
    console.log(`Response Time: ${this.gradeResponseTime(overallAverage)}`);
    console.log(`Error Rate: ${this.gradeErrorRate((errors / allResults.length) * 100)}`);
    console.log(`Cache Efficiency: ${this.gradeCacheEfficiency((allResults.filter(r => r.cacheHit).length / allResults.length) * 100)}`);
  }

  private gradeResponseTime(avgTime: number): string {
    if (avgTime < 100) return '🟢 A+ (Excellent)';
    if (avgTime < 300) return '🟢 A (Very Good)';
    if (avgTime < 500) return '🟡 B (Good)';
    if (avgTime < 1000) return '🟡 C (Average)';
    if (avgTime < 2000) return '🟠 D (Slow)';
    return '🔴 F (Very Slow)';
  }

  private gradeErrorRate(errorRate: number): string {
    if (errorRate < 1) return '🟢 A+ (Excellent)';
    if (errorRate < 5) return '🟢 A (Very Good)';
    if (errorRate < 10) return '🟡 B (Good)';
    if (errorRate < 20) return '🟠 C (Average)';
    return '🔴 F (Poor)';
  }

  private gradeCacheEfficiency(cacheRate: number): string {
    if (cacheRate > 80) return '🟢 A+ (Excellent)';
    if (cacheRate > 60) return '🟢 A (Very Good)';
    if (cacheRate > 40) return '🟡 B (Good)';
    if (cacheRate > 20) return '🟠 C (Average)';
    return '🔴 F (Poor)';
  }
}

// Export the tester class
export { SpatialPerformanceTester };
export type { TestResult, BenchmarkSuite }; 