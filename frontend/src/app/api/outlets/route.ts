import { NextResponse } from "next/server";
import { readOutlets } from "../readOutlets";
// This file is used to fetch outlet data from the backend with spatial indexing support
// It reads from the GeoFirestore database and returns the data in a format that the frontend expects
// Supports various spatial queries: all, radius, bounds, nearest

export async function GET(request: Request) {
  try {
    // Parse URL parameters for spatial queries
    const { searchParams } = new URL(request.url);
    const queryType = searchParams.get('type') || 'all';
    
    // Parse query parameters based on type
    const params: any = { type: queryType };
    
    switch (queryType) {
      case 'radius':
        params.centerLat = parseFloat(searchParams.get('centerLat') || '0');
        params.centerLng = parseFloat(searchParams.get('centerLng') || '0');
        params.radius = parseFloat(searchParams.get('radius') || '10');
        break;
        
      case 'bounds':
        params.southWestLat = parseFloat(searchParams.get('southWestLat') || '0');
        params.southWestLng = parseFloat(searchParams.get('southWestLng') || '0');
        params.northEastLat = parseFloat(searchParams.get('northEastLat') || '0');
        params.northEastLng = parseFloat(searchParams.get('northEastLng') || '0');
        break;
        
      case 'nearest':
        params.centerLat = parseFloat(searchParams.get('centerLat') || '0');
        params.centerLng = parseFloat(searchParams.get('centerLng') || '0');
        params.limit = parseInt(searchParams.get('limit') || '10');
        break;
        
      default:
        // For 'all' type, no additional parameters needed
        break;
    }

    // Fetch outlets using spatial queries
    const outlets = await readOutlets(params);
    
    // Format the response to maintain consistency with frontend expectations
    const formatted = outlets?.map((outlet: any) => ({
      ...outlet,
      lat: outlet.latitude,
      lng: outlet.longitude,
    }));
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching outlets:', error);
    return NextResponse.json({ 
      error: "Failed to fetch outlets",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}