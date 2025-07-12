#!/usr/bin/env node

/**
 * Command-line Performance Testing Script
 *
 * Usage: node test-spatial-performance.js [test-type] [options]
 *
 * Examples:
 *   node test-spatial-performance.js quick
 *   node test-spatial-performance.js full
 *   node test-spatial-performance.js single radius
 *   node test-spatial-performance.js cache
 *   node test-spatial-performance.js concurrent 10
 */

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Default base URL
const BASE_URL = process.env.API_BASE_URL || "http://localhost:3004";

// Simple performance tester
class CommandLinePerformanceTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async timeApiCall(endpoint, description) {
    console.log(`⏱️  Testing: ${description}`);

    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const resultCount = data.meta?.count || data.data?.length || 0;
        const cacheHit = responseTime < 100;

        console.log(
          `   ✅ ${responseTime}ms (${resultCount} results)${
            cacheHit ? " [CACHE]" : ""
          }`
        );
        return { success: true, responseTime, resultCount, cacheHit };
      } else {
        const error = await response.json();
        console.log(`   ❌ ${responseTime}ms (Error: ${error.message})`);
        return { success: false, responseTime, error: error.message };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.log(`   ❌ ${responseTime}ms (Network Error: ${error.message})`);
      return { success: false, responseTime, error: error.message };
    }
  }

  async runQuickTest() {
    console.log("🚀 Running Quick Performance Test...\n");

    const tests = [
      { endpoint: "/api/outlets?type=all", description: "All Outlets" },
      {
        endpoint:
          "/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=50",
        description: "Radius Query (NYC)",
      },
      {
        endpoint:
          "/api/outlets?type=nearest&centerLat=40.7128&centerLng=-74.0060&limit=5",
        description: "Nearest Query (NYC)",
      },
    ];

    const results = [];

    for (const test of tests) {
      const result = await this.timeApiCall(test.endpoint, test.description);
      results.push(result);

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("\n📊 Quick Test Summary:");
    const avgTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const successRate =
      (results.filter((r) => r.success).length / results.length) * 100;

    console.log(`   Average Response Time: ${avgTime.toFixed(1)}ms`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  }

  async runCacheTest() {
    console.log("🔄 Testing Caching Performance...\n");

    const endpoint =
      "/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=25";

    console.log("   📡 First call (cache miss expected)");
    const firstCall = await this.timeApiCall(endpoint, "First Call");

    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log("   ⚡ Second call (cache hit expected)");
    const secondCall = await this.timeApiCall(endpoint, "Second Call");

    const improvement =
      ((firstCall.responseTime - secondCall.responseTime) /
        firstCall.responseTime) *
      100;
    console.log(`\n📊 Cache Performance:`);
    console.log(`   First Call: ${firstCall.responseTime}ms`);
    console.log(`   Second Call: ${secondCall.responseTime}ms`);
    console.log(`   Improvement: ${improvement.toFixed(1)}%`);
  }

  async runSingleTest(type = "radius", params = {}) {
    console.log(`⏱️  Testing single ${type} call...\n`);

    let endpoint = "";

    switch (type) {
      case "all":
        endpoint = "/api/outlets?type=all";
        break;
      case "radius":
        const lat = params.centerLat || 40.7128;
        const lng = params.centerLng || -74.006;
        const radius = params.radius || 50;
        endpoint = `/api/outlets?type=radius&centerLat=${lat}&centerLng=${lng}&radius=${radius}`;
        break;
      case "bounds":
        const swLat = params.southWestLat || 35;
        const swLng = params.southWestLng || -85;
        const neLat = params.northEastLat || 45;
        const neLng = params.northEastLng || -70;
        endpoint = `/api/outlets?type=bounds&southWestLat=${swLat}&southWestLng=${swLng}&northEastLat=${neLat}&northEastLng=${neLng}`;
        break;
      case "nearest":
        const centerLat = params.centerLat || 40.7128;
        const centerLng = params.centerLng || -74.006;
        const limit = params.limit || 5;
        endpoint = `/api/outlets?type=nearest&centerLat=${centerLat}&centerLng=${centerLng}&limit=${limit}`;
        break;
    }

    const result = await this.timeApiCall(endpoint, `Single ${type} query`);

    console.log(`\n📊 Single Test Result:`);
    console.log(`   Response Time: ${result.responseTime}ms`);
    console.log(`   Success: ${result.success}`);
    if (result.success) {
      console.log(`   Results: ${result.resultCount}`);
      console.log(`   Cache Hit: ${result.cacheHit ? "Yes" : "No"}`);
    }
  }

  async runConcurrentTest(concurrency = 5) {
    console.log(`🔥 Testing Concurrent Load (${concurrency} requests)...\n`);

    const queries = [
      "/api/outlets?type=radius&centerLat=40.7128&centerLng=-74.0060&radius=30",
      "/api/outlets?type=radius&centerLat=39.9526&centerLng=-75.1652&radius=40",
      "/api/outlets?type=nearest&centerLat=40.7128&centerLng=-74.0060&limit=5",
    ];

    const promises = [];

    for (let i = 0; i < concurrency; i++) {
      const query = queries[i % queries.length];
      promises.push(this.timeApiCall(query, `Concurrent Request ${i + 1}`));
    }

    const results = await Promise.all(promises);

    console.log(`\n📊 Concurrent Test Summary:`);
    const avgTime =
      results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const minTime = Math.min(...results.map((r) => r.responseTime));
    const maxTime = Math.max(...results.map((r) => r.responseTime));
    const successRate =
      (results.filter((r) => r.success).length / results.length) * 100;

    console.log(`   Average Time: ${avgTime.toFixed(1)}ms`);
    console.log(`   Min Time: ${minTime}ms`);
    console.log(`   Max Time: ${maxTime}ms`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "quick";

  const tester = new CommandLinePerformanceTester(BASE_URL);

  console.log(`🔗 Testing API at: ${BASE_URL}\n`);

  try {
    switch (command) {
      case "quick":
        await tester.runQuickTest();
        break;

      case "cache":
        await tester.runCacheTest();
        break;

      case "single":
        const type = args[1] || "radius";
        await tester.runSingleTest(type);
        break;

      case "concurrent":
        const concurrency = parseInt(args[1]) || 5;
        await tester.runConcurrentTest(concurrency);
        break;

      case "full":
        await tester.runQuickTest();
        console.log("\n" + "=".repeat(50));
        await tester.runCacheTest();
        console.log("\n" + "=".repeat(50));
        await tester.runConcurrentTest(5);
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        console.log(`\nUsage: node test-spatial-performance.js [command]`);
        console.log(`\nCommands:`);
        console.log(`  quick      - Run quick performance test`);
        console.log(`  cache      - Test caching performance`);
        console.log(`  single     - Test single API call`);
        console.log(`  concurrent - Test concurrent load`);
        console.log(`  full       - Run all tests`);
        process.exit(1);
    }

    console.log("\n✅ Testing completed!");
  } catch (error) {
    console.error("❌ Testing failed:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
