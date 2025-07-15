import { NextResponse } from "next/server";
import { readOutlets } from "../readOutlets";

// Rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(request: Request): string {
  // Use IP address or user agent as key for rate limiting
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (current.count >= RATE_LIMIT) {
    return false;
  }
  
  current.count++;
  return true;
}

// Input validation functions
function validateCoordinate(coord: number, name: string): void {
  if (isNaN(coord) || coord < -180 || coord > 180) {
    throw new Error(`Invalid ${name}: must be a number between -180 and 180`);
  }
}

function validateLatitude(lat: number): void {
  if (isNaN(lat) || lat < -90 || lat > 90) {
    throw new Error("Invalid latitude: must be a number between -90 and 90");
  }
}

function validateRadius(radius: number): void {
  if (isNaN(radius) || radius <= 0 || radius > 1000) {
    throw new Error("Invalid radius: must be a positive number up to 1000 km");
  }
}

function validateLimit(limit: number): void {
  if (isNaN(limit) || limit <= 0 || limit > 100) {
    throw new Error("Invalid limit: must be a positive integer up to 100");
  }
}

// This file is used to fetch outlet data from the backend with spatial indexing support
// It reads from the GeoFirestore database and returns the data in a format that the frontend expects
// Supports various spatial queries: all, radius, bounds, nearest

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json({ 
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later."
      }, { status: 429 });
    }

    // Parse URL parameters for spatial queries
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type') || 'all';
    
    // Validate query type
    const validTypes = ['all', 'radius', 'bounds', 'nearest'];
    if (!validTypes.includes(queryType)) {
      return NextResponse.json({ 
        error: "Invalid query type",
        message: `Query type must be one of: ${validTypes.join(', ')}`,
        validTypes
      }, { status: 400 });
    }
    
    // Parse query parameters based on type
    const params: any = { type: queryType };
    
    try {
      switch (queryType) {
        case 'radius':
          params.centerLat = parseFloat(searchParams.get('centerLat') || '0');
          params.centerLng = parseFloat(searchParams.get('centerLng') || '0');
          params.radius = parseFloat(searchParams.get('radius') || '10');
          
          // Validate parameters
          validateLatitude(params.centerLat);
          validateCoordinate(params.centerLng, 'longitude');
          validateRadius(params.radius);
          break;
          
        case 'bounds':
          params.southWestLat = parseFloat(searchParams.get('southWestLat') || '0');
          params.southWestLng = parseFloat(searchParams.get('southWestLng') || '0');
          params.northEastLat = parseFloat(searchParams.get('northEastLat') || '0');
          params.northEastLng = parseFloat(searchParams.get('northEastLng') || '0');
          
          // Validate parameters
          validateLatitude(params.southWestLat);
          validateCoordinate(params.southWestLng, 'longitude');
          validateLatitude(params.northEastLat);
          validateCoordinate(params.northEastLng, 'longitude');
          
          // Validate bounds relationship
          if (params.southWestLat >= params.northEastLat) {
            throw new Error("southWestLat must be less than northEastLat");
          }
          if (params.southWestLng >= params.northEastLng) {
            throw new Error("southWestLng must be less than northEastLng");
          }
          break;
          
        case 'nearest':
          params.centerLat = parseFloat(searchParams.get('centerLat') || '0');
          params.centerLng = parseFloat(searchParams.get('centerLng') || '0');
          params.limit = parseInt(searchParams.get('limit') || '10');
          
          // Validate parameters
          validateLatitude(params.centerLat);
          validateCoordinate(params.centerLng, 'longitude');
          validateLimit(params.limit);
          break;
          
        default:
          // For 'all' type, no additional parameters needed
          break;
      }
    } catch (validationError) {
      return NextResponse.json({ 
        error: "Invalid parameters",
        message: validationError instanceof Error ? validationError.message : 'Parameter validation failed',
        queryType,
        receivedParams: Object.fromEntries(searchParams.entries())
      }, { status: 400 });
    }

    // Fetch outlets using spatial queries
    const outlets = await readOutlets(params);
    
    // Format the response to maintain consistency with frontend expectations
    const formatted = outlets?.map((outlet: any) => ({
      ...outlet,
      lat: outlet.latitude,
      lng: outlet.longitude,
    }));
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      data: formatted,
      meta: {
        count: formatted?.length || 0,
        queryType,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.error('Error fetching outlets:', error);
    
    // Determine error type for better error responses
    let statusCode = 500;
    let errorType = "Internal Server Error";
    
    if (error instanceof Error) {
      if (error.message.includes('permission') || error.message.includes('auth')) {
        statusCode = 403;
        errorType = "Permission Denied";
      } else if (error.message.includes('not found')) {
        statusCode = 404;
        errorType = "Not Found";
      } else if (error.message.includes('timeout')) {
        statusCode = 408;
        errorType = "Request Timeout";
      }
    }
    
    return NextResponse.json({ 
      error: errorType,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`
    }, { status: statusCode });
  }
}