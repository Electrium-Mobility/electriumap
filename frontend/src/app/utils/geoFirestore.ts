import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  startAt, 
  endAt, 
  serverTimestamp,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import * as geofire from 'geofire-common';

//interface for data describing an outlet
export interface Outlet {
  latitude: number;
  longitude: number;
  userName: string; 
  userId: string;
  locationName: string;     
  chargerType: string;      
  description: string; 
}

//interface for outlet with geospatial data
export interface GeoOutlet extends Outlet {
  id?: string;
  geohash?: string;
  createdAt?: any;
  distance?: number; // distance from query point in km
}

//function to add outlet to database with spatial indexing using geohash
export async function addGeoOutlet(outlet: Outlet): Promise<string> {
  try {
    // Generate geohash for the outlet's location
    const geohash = geofire.geohashForLocation([outlet.latitude, outlet.longitude]);
    
    // Add outlet data with geohash for spatial indexing
    const docRef = await addDoc(collection(db, "Outlets"), {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      geohash: geohash,
      userName: outlet.userName,
      userId: outlet.userId,
      locationName: outlet.locationName,
      chargerType: outlet.chargerType,
      description: outlet.description,
      createdAt: serverTimestamp()
    });
    
    console.log("Outlet added to database with spatial indexing, ID: ", docRef.id);
    return docRef.id;
  } catch (e) {
    console.error("Error adding outlet to database: ", e);
    throw e;
  }
}

//function to get outlets within a specified radius of a center point
export async function getOutletsWithinRadius(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number
): Promise<GeoOutlet[]> {
  try {
    const center: [number, number] = [centerLat, centerLng];
    const radiusInM = radiusKm * 1000;
    
    // Generate geohash query bounds
    const bounds = geofire.geohashQueryBounds(center, radiusInM);
    
    // Create promises for all geohash range queries
    const promises: Promise<QueryDocumentSnapshot<DocumentData>[]>[] = [];
    for (const b of bounds) {
      const q = query(
        collection(db, 'Outlets'),
        orderBy('geohash'),
        startAt(b[0]),
        endAt(b[1])
      );
      promises.push(getDocs(q).then(snapshot => snapshot.docs));
    }
    
    // Execute all queries in parallel
    const snapshots = await Promise.all(promises);
    
    // Combine results from all queries
    const matchingDocs: GeoOutlet[] = [];
    for (const docsArray of snapshots) {
      for (const doc of docsArray) {
        const data = doc.data() as GeoOutlet;
        const lat = data.latitude;
        const lng = data.longitude;
        
        // Filter out false positives due to geohash accuracy
        const distanceInKm = geofire.distanceBetween([lat, lng], center);
        const distanceInM = distanceInKm * 1000;
        
        if (distanceInM <= radiusInM) {
          matchingDocs.push({
            id: doc.id,
            ...data,
            distance: distanceInKm
          });
        }
      }
    }
    
    return matchingDocs;
  } catch (error) {
    console.error("Error querying outlets within radius: ", error);
    throw error;
  }
}

//function to get outlets within a bounding box
export async function getOutletsWithinBounds(
  southWestLat: number,
  southWestLng: number,
  northEastLat: number,
  northEastLng: number
): Promise<GeoOutlet[]> {
  try {
    // Calculate center point and radius for the bounding box
    const centerLat = (southWestLat + northEastLat) / 2;
    const centerLng = (southWestLng + northEastLng) / 2;
    
    // Calculate radius needed to cover the bounding box
    const radiusKm = Math.max(
      geofire.distanceBetween([centerLat, centerLng], [southWestLat, southWestLng]),
      geofire.distanceBetween([centerLat, centerLng], [northEastLat, northEastLng])
    );
    
    // Get outlets within the calculated radius
    const outlets = await getOutletsWithinRadius(centerLat, centerLng, radiusKm);
    
    // Filter to only include outlets within the exact bounding box
    const filteredOutlets = outlets.filter(outlet => {
      return outlet.latitude >= southWestLat && 
             outlet.latitude <= northEastLat &&
             outlet.longitude >= southWestLng && 
             outlet.longitude <= northEastLng;
    });
    
    return filteredOutlets;
  } catch (error) {
    console.error("Error querying outlets within bounds: ", error);
    throw error;
  }
}

//function to get all outlets (fallback for when no spatial filtering is needed)
export async function getAllGeoOutlets(): Promise<GeoOutlet[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "Outlets"));
    
    const outlets: GeoOutlet[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as GeoOutlet
    }));
    
    return outlets;
  } catch (error) {
    console.error("Error reading all outlets from database: ", error);
    throw error;
  }
}

//function to find the nearest outlets to a given point
export async function getNearestOutlets(
  centerLat: number,
  centerLng: number,
  limit: number = 10
): Promise<GeoOutlet[]> {
  try {
    // Start with a reasonable search radius (50km)
    let searchRadius = 50;
    let outlets: GeoOutlet[] = [];
    
    // Expand search radius until we find enough outlets or reach maximum radius
    while (outlets.length < limit && searchRadius <= 500) {
      outlets = await getOutletsWithinRadius(centerLat, centerLng, searchRadius);
      if (outlets.length < limit) {
        searchRadius *= 2; // Double the search radius
      }
    }
    
    // Sort by distance and return only the requested number
    outlets.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return outlets.slice(0, limit);
  } catch (error) {
    console.error("Error finding nearest outlets: ", error);
    throw error;
  }
}

//helper function to calculate distance between two points using the geofire-common library
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return geofire.distanceBetween([lat1, lng1], [lat2, lng2]);
}

//function to generate geohash for a location (useful for debugging)
export function generateGeohash(latitude: number, longitude: number): string {
  return geofire.geohashForLocation([latitude, longitude]);
}

//function to check if we need to add geohash to existing documents
export async function migrateExistingOutlets(): Promise<void> {
  try {
    console.log("Starting migration of existing outlets to add geohash...");
    
    const querySnapshot = await getDocs(collection(db, "Outlets"));
    const batch = [];
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Check if geohash already exists
      if (!data.geohash && data.latitude && data.longitude) {
        const geohash = geofire.geohashForLocation([data.latitude, data.longitude]);
        
        // Add to batch update
        batch.push({
          id: doc.id,
          geohash: geohash
        });
      }
    }
    
    console.log(`Found ${batch.length} outlets to migrate`);
    
    // Update documents with geohash
    // Note: In a real application, you might want to use batch writes for better performance
    for (const update of batch) {
      await addDoc(collection(db, "Outlets"), {
        ...querySnapshot.docs.find(doc => doc.id === update.id)?.data(),
        geohash: update.geohash
      });
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration: ", error);
    throw error;
  }
} 