/**
 * Performance Test Runner
 * 
 * Simple script to run performance tests for spatial indexing
 */

import { SpatialPerformanceTester } from './performanceTest';

// Auto-detect port from current URL or default to 3004
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3004';
};

/**
 * Run quick performance test
 */
export async function runQuickTest(): Promise<void> {
  console.log('🚀 Running Quick Performance Test...\n');
  
  const tester = new SpatialPerformanceTester(getBaseUrl());
  
  try {
    // Test all query types
    await tester.testAllQueryTypes();
    
    // Test caching
    await tester.testCaching();
    
    console.log('\n✅ Quick test completed!');
  } catch (error) {
    console.error('❌ Quick test failed:', error);
  }
}

/**
 * Run full benchmark suite
 */
export async function runFullBenchmark(): Promise<void> {
  console.log('🏁 Running Full Benchmark Suite...\n');
  
  const tester = new SpatialPerformanceTester(getBaseUrl());
  
  try {
    await tester.runFullBenchmark();
    console.log('\n🎉 Full benchmark completed!');
  } catch (error) {
    console.error('❌ Full benchmark failed:', error);
  }
}

/**
 * Run caching test only
 */
export async function testCaching(): Promise<void> {
  console.log('🔄 Testing Caching Performance...\n');
  
  const tester = new SpatialPerformanceTester(getBaseUrl());
  
  try {
    const result = await tester.testCaching();
    console.log('\n📊 Caching test results:');
    console.log(`Average Time: ${result.averageTime.toFixed(1)}ms`);
    console.log(`Cache Hits: ${result.results.filter(r => r.cacheHit).length}/${result.results.length}`);
    
    const firstCall = result.results[0];
    const secondCall = result.results[1];
    const improvement = ((firstCall.responseTime - secondCall.responseTime) / firstCall.responseTime) * 100;
    console.log(`Performance Improvement: ${improvement.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Caching test failed:', error);
  }
}

/**
 * Run concurrent load test
 */
export async function testConcurrentLoad(concurrency: number = 10): Promise<void> {
  console.log(`🔥 Testing Concurrent Load (${concurrency} requests)...\n`);
  
  const tester = new SpatialPerformanceTester(getBaseUrl());
  
  try {
    const result = await tester.testConcurrentLoad(concurrency);
    console.log('\n📊 Concurrent load test results:');
    console.log(`Average Time: ${result.averageTime.toFixed(1)}ms`);
    console.log(`Min Time: ${result.minTime}ms`);
    console.log(`Max Time: ${result.maxTime}ms`);
    console.log(`Success Rate: ${result.successRate.toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Concurrent load test failed:', error);
  }
}

/**
 * Single API call test
 */
export async function testSingleCall(
  type: 'all' | 'radius' | 'bounds' | 'nearest' = 'radius',
  params: any = {}
): Promise<void> {
  console.log(`⏱️  Testing single ${type} call...\n`);
  
  const tester = new SpatialPerformanceTester(getBaseUrl());
  
  let endpoint = '';
  
  switch (type) {
    case 'all':
      endpoint = '/api/outlets?type=all';
      break;
    case 'radius':
      const lat = params.centerLat || 40.7128;
      const lng = params.centerLng || -74.0060;
      const radius = params.radius || 50;
      endpoint = `/api/outlets?type=radius&centerLat=${lat}&centerLng=${lng}&radius=${radius}`;
      break;
    case 'bounds':
      const swLat = params.southWestLat || 35;
      const swLng = params.southWestLng || -85;
      const neLat = params.northEastLat || 45;
      const neLng = params.northEastLng || -70;
      endpoint = `/api/outlets?type=bounds&southWestLat=${swLat}&southWestLng=${swLng}&northEastLat=${neLat}&northEastLng=${neLng}`;
      break;
    case 'nearest':
      const centerLat = params.centerLat || 40.7128;
      const centerLng = params.centerLng || -74.0060;
      const limit = params.limit || 5;
      endpoint = `/api/outlets?type=nearest&centerLat=${centerLat}&centerLng=${centerLng}&limit=${limit}`;
      break;
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch(getBaseUrl() + endpoint);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Success: ${responseTime}ms`);
      console.log(`   Results: ${data.meta?.count || data.data?.length || 0}`);
      console.log(`   Cache Hit: ${responseTime < 100 ? 'Yes' : 'No'}`);
    } else {
      const error = await response.json();
      console.log(`❌ Error: ${responseTime}ms`);
      console.log(`   Message: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Single call test failed:', error);
  }
}

// Browser console functions
if (typeof window !== 'undefined') {
  // Make functions available in browser console
  (window as any).spatialPerformance = {
    runQuickTest,
    runFullBenchmark,
    testCaching,
    testConcurrentLoad,
    testSingleCall
  };
  
  console.log(`
🚀 Spatial Performance Testing Available!

Run these commands in the browser console:
- spatialPerformance.runQuickTest()
- spatialPerformance.runFullBenchmark()
- spatialPerformance.testCaching()
- spatialPerformance.testConcurrentLoad(10)
- spatialPerformance.testSingleCall('radius', {centerLat: 40.7128, centerLng: -74.0060, radius: 50})
  `);
}

// Export for Node.js usage
export default {
  runQuickTest,
  runFullBenchmark,
  testCaching,
  testConcurrentLoad,
  testSingleCall
}; 