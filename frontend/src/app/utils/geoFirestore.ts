import { collection, DocumentData, endAt, getDocs, limit, orderBy, query, QueryDocumentSnapshot, startAt } from 'firebase/firestore';
import * as geofire from 'geofire-common';
import { GeoOutlet } from '../models';
import { db } from '../firebase/firebase';

export const getAllGeoOutlets = async (): Promise<GeoOutlet[]> => {
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
  };

export const getGeoOutletsByRadius = async (
  centerLat: number, 
  centerLng: number, 
  radiusKm: number,
): Promise<GeoOutlet[]> => {
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
        limit(100) // Limit to prevent overwhelming results
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
    return matchingDocs;

    } catch (error) {
    console.error("Error querying outlets within radius: ", error);
    throw error;
  }
}

export const getGeoOutletsByBounds = async (
  southWestLat: number,
  southWestLng: number,
  northEastLat: number,
  northEastLng: number
): Promise<GeoOutlet[]> => {
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

    const outlets = await getGeoOutletsByRadius(centerLat, centerLng, radiusKm);


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
};