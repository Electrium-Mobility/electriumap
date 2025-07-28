// Fixed api/outlets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readOutlets } from "../readOutlets";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get query parameters
    const type = searchParams.get('type') || 'all';
    const southWestLat = searchParams.get('southWestLat');
    const southWestLng = searchParams.get('southWestLng');
    const northEastLat = searchParams.get('northEastLat');
    const northEastLng = searchParams.get('northEastLng');
    const centerLat = searchParams.get('centerLat');
    const centerLng = searchParams.get('centerLng');
    const radius = searchParams.get('radius');
    const limit = searchParams.get('limit');

    // Build props based on query type
    let props: any = { type };

    if (type === 'bounds' && southWestLat && southWestLng && northEastLat && northEastLng) {
      props = {
        type: 'bounds',
        southWestLat: parseFloat(southWestLat),
        southWestLng: parseFloat(southWestLng),
        northEastLat: parseFloat(northEastLat),
        northEastLng: parseFloat(northEastLng),
        limit: limit ? parseInt(limit) : undefined
      };
    } else if (type === 'radius' && centerLat && centerLng && radius) {
      props = {
        type: 'radius',
        centerLat: parseFloat(centerLat),
        centerLng: parseFloat(centerLng),
        radius: parseFloat(radius),
        limit: limit ? parseInt(limit) : undefined
      };
    }

    console.log('API request props:', props);

    const outlets = await readOutlets(props);
    
    // Format the data consistently
    const formatted = outlets?.map((outlet: any) => ({
      id: outlet.id,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      chargerType: outlet.chargerType || '',
      description: outlet.description || '',
      locationName: outlet.locationName || 'Outlet',
      userName: outlet.userName || '',
      userId: outlet.userId || '',
    })) || [];

    console.log(`Returning ${formatted.length} outlets`);
    
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch outlets", 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}