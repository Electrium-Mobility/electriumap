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
  QueryDocumentSnapshot,
  limit as firestoreLimit
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import * as geofire from 'geofire-common';
import { withAnalytics } from './spatialAnalytics';

// Add caching for frequently accessed data
interface QueryCache {
  [key: string]: {
    data: GeoOutlet[];
    timestamp: number;
    expiresAt: number;
  };
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let queryCache: QueryCache = {};

// Cache key generator
function generateCacheKey(type: string, params: any): string {
  return `${type}_${JSON.stringify(params)}`;
}

// Cache utilities
function getCachedData(key: string): GeoOutlet[] | null {
  const cached = queryCache[key];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: GeoOutlet[]): void {
  queryCache[key] = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + CACHE_DURATION
  };
}

// Clean expired cache entries
function cleanCache(): void {
  const now = Date.now();
  Object.keys(queryCache).forEach(key => {
    if (queryCache[key].expiresAt < now) {
      delete queryCache[key];
    }
  });
}

// Run cache cleanup every 10 minutes
setInterval(cleanCache, 10 * 60 * 1000);

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

// Internal function without monitoring (for internal use)
async function _getOutletsWithinRadius(
  centerLat: number, 
  centerLng: number, 
  radiusKm: number,
  useCache: boolean = true
): Promise<GeoOutlet[]> {
  const cacheKey = generateCacheKey('radius', { centerLat, centerLng, radiusKm });
  
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached radius query results');
      return cached;
    }
  }

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
        endAt(b[1]),
        firestoreLimit(100) // Limit to prevent overwhelming results
      );
      promises.push(getDocs(q).then(snapshot => snapshot.docs));
    }
    
    // Execute all queries in parallel
    const snapshots = await Promise.all(promises);
    
    // Combine results from all queries
    const matchingDocs: GeoOutlet[] = [];
    const seenIds = new Set<string>(); // Prevent duplicates
    
    for (const docsArray of snapshots) {
      for (const doc of docsArray) {
        if (seenIds.has(doc.id)) continue;
        seenIds.add(doc.id);
        
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
    
    // Sort by distance for consistent results
    matchingDocs.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    if (useCache) {
      setCachedData(cacheKey, matchingDocs);
    }
    
    return matchingDocs;
  } catch (error) {
    console.error("Error querying outlets within radius: ", error);
    throw error;
  }
}

// Internal function without monitoring (for internal use)
async function _getOutletsWithinBounds(
  southWestLat: number,
  southWestLng: number,
  northEastLat: number,
  northEastLng: number,
  useCache: boolean = true
): Promise<GeoOutlet[]> {
  const cacheKey = generateCacheKey('bounds', { southWestLat, southWestLng, northEastLat, northEastLng });
  
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached bounds query results');
      return cached;
    }
  }

  try {
    // Input validation
    if (southWestLat >= northEastLat || southWestLng >= northEastLng) {
      throw new Error('Invalid bounding box: southwest corner must be southwest of northeast corner');
    }

    // Calculate center point and radius for the bounding box
    const centerLat = (southWestLat + northEastLat) / 2;
    const centerLng = (southWestLng + northEastLng) / 2;
    
    // Calculate radius needed to cover the bounding box
    const radiusKm = Math.max(
      geofire.distanceBetween([centerLat, centerLng], [southWestLat, southWestLng]),
      geofire.distanceBetween([centerLat, centerLng], [northEastLat, northEastLng])
    );
    
    // Get outlets within the calculated radius (don't use cache for this intermediate call)
    const outlets = await _getOutletsWithinRadius(centerLat, centerLng, radiusKm, false);
    
    // Filter to only include outlets within the exact bounding box
    const filteredOutlets = outlets.filter(outlet => {
      return outlet.latitude >= southWestLat && 
             outlet.latitude <= northEastLat &&
             outlet.longitude >= southWestLng && 
             outlet.longitude <= northEastLng;
    });
    
    if (useCache) {
      setCachedData(cacheKey, filteredOutlets);
    }
    
    return filteredOutlets;
  } catch (error) {
    console.error("Error querying outlets within bounds: ", error);
    throw error;
  }
}

// Internal function without monitoring (for internal use)
async function _getNearestOutlets(
  centerLat: number,
  centerLng: number,
  limit: number = 10,
  useCache: boolean = true
): Promise<GeoOutlet[]> {
  const cacheKey = generateCacheKey('nearest', { centerLat, centerLng, limit });
  
  if (useCache) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      console.log('Returning cached nearest query results');
      return cached;
    }
  }

  try {
    // Input validation
    if (limit <= 0 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    // Start with a reasonable search radius (50km)
    let searchRadius = 50;
    let outlets: GeoOutlet[] = [];
    
    // Expand search radius until we find enough outlets or reach maximum radius
    while (outlets.length < limit && searchRadius <= 500) {
      outlets = await _getOutletsWithinRadius(centerLat, centerLng, searchRadius, false);
      if (outlets.length < limit) {
        searchRadius *= 2; // Double the search radius
      }
    }
    
    // Sort by distance and return only the requested number
    outlets.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    const result = outlets.slice(0, limit);
    
    if (useCache) {
      setCachedData(cacheKey, result);
    }
    
    return result;
  } catch (error) {
    console.error("Error finding nearest outlets: ", error);
    throw error;
  }
}

// Public functions with monitoring
export const getOutletsWithinRadius = withAnalytics('radius', 
  (centerLat: number, centerLng: number, radiusKm: number, useCache: boolean = true) => 
    _getOutletsWithinRadius(centerLat, centerLng, radiusKm, useCache)
);

export const getOutletsWithinBounds = withAnalytics('bounds',
  (southWestLat: number, southWestLng: number, northEastLat: number, northEastLng: number, useCache: boolean = true) =>
    _getOutletsWithinBounds(southWestLat, southWestLng, northEastLat, northEastLng, useCache)
);

export const getNearestOutlets = withAnalytics('nearest',
  (centerLat: number, centerLng: number, limit: number = 10, useCache: boolean = true) =>
    _getNearestOutlets(centerLat, centerLng, limit, useCache)
);

//function to add outlet to database with spatial indexing using geohash
export const addGeoOutlet = withAnalytics('add',
  async (outlet: Outlet): Promise<string> => {
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
);

//function to get all outlets (fallback for when no spatial filtering is needed)
export const getAllGeoOutlets = withAnalytics('all',
  async (): Promise<GeoOutlet[]> => {
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
);

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
          docRef: doc.ref,
          geohash: geohash
        });
      }
    }
    
    console.log(`Found ${batch.length} outlets to migrate`);
    
    // Update documents with geohash using updateDoc
    const { updateDoc } = await import("firebase/firestore");
    
    for (const update of batch) {
      await updateDoc(update.docRef, {
        geohash: update.geohash
      });
    }
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Error during migration: ", error);
    throw error;
  }
} 