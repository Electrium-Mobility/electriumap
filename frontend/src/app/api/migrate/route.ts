import { NextResponse } from "next/server";
import { migrateExistingOutlets } from "../../utils/geoFirestore";

export async function POST(request: Request) {
  try {
    console.log("Starting migration of existing outlets...");
    
    await migrateExistingOutlets();
    
    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error during migration:', error);
    
    return NextResponse.json({
      success: false,
      error: "Migration failed",
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 