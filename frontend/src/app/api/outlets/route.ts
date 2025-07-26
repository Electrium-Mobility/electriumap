// @ts-nocheck
import { NextResponse } from "next/server";
import { readOutlets } from "../readOutlets";
// This file is used to fetch outlet data from the backend and format it for the frontend
// It reads from the Firestore database and returns the data in a format that the frontend expects

export async function GET() {
  try {
    const outlets = await readOutlets();
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