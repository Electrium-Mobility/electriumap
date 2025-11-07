// @ts-nocheck
import { NextResponse } from "next/server";
import { readOutlets, readOutletsByBounds } from "../readOutlets";
// This file is used to fetch outlet data from the backend and format it for the frontend
// It reads from the Firestore database and returns the data in a format that the frontend expects

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const swLat = searchParams.get("swLat");
    const swLng = searchParams.get("swLng");
    const neLat = searchParams.get("neLat");
    const neLng = searchParams.get("neLng");

    let outlets;
    
    //if bounds are provided, filter by bounds; otherwise fetch all
    if (swLat && swLng && neLat && neLng) {
      outlets = await readOutletsByBounds({
        swLat: parseFloat(swLat),
        swLng: parseFloat(swLng),
        neLat: parseFloat(neLat),
        neLng: parseFloat(neLng),
      });
    } else {
      outlets = await readOutlets();
    }

    const formatted = outlets?.map((outlet: any) => ({
      id: outlet.id,
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      chargerType: outlet.chargerType,
      description: outlet.description,
      locationName: outlet.locationName,
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch outlets" }, { status: 500 });
  }
}