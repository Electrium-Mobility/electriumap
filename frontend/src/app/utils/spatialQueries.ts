import { GeoOutlet } from './geoFirestore';

// Base URL for the outlets API
const API_BASE_URL = '/api/outlets';

// Interface for API response
interface OutletApiResponse extends Omit<GeoOutlet, 'latitude' | 'longitude'> {
  lat: number;
  lng: number;
}

// Client-side utility functions for spatial queries

/**
 * Fetch all outlets without spatial filtering
 */
export async function fetchAllOutlets(): Promise<OutletApiResponse[]> {
  try {
    const response = await fetch(`${API_BASE_URL}?type=all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching all outlets:', error);
    throw error;
  }
}

/**
 * Fetch outlets within a specified radius of a center point
 * @param centerLat - Latitude of the center point
 * @param centerLng - Longitude of the center point
 * @param radiusKm - Radius in kilometers
 */
export async function fetchOutletsWithinRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Promise<OutletApiResponse[]> {
  try {
    const params = new URLSearchParams({
      type: 'radius',
      centerLat: centerLat.toString(),
      centerLng: centerLng.toString(),
      radius: radiusKm.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching outlets within radius:', error);
    throw error;
  }
}

/**
 * Fetch outlets within a bounding box
 * @param southWestLat - Southwest corner latitude
 * @param southWestLng - Southwest corner longitude
 * @param northEastLat - Northeast corner latitude
 * @param northEastLng - Northeast corner longitude
 */
export async function fetchOutletsWithinBounds(
  southWestLat: number,
  southWestLng: number,
  northEastLat: number,
  northEastLng: number
): Promise<OutletApiResponse[]> {
  try {
    const params = new URLSearchParams({
      type: 'bounds',
      southWestLat: southWestLat.toString(),
      southWestLng: southWestLng.toString(),
      northEastLat: northEastLat.toString(),
      northEastLng: northEastLng.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching outlets within bounds:', error);
    throw error;
  }
}

/**
 * Fetch the nearest outlets to a given point
 * @param centerLat - Latitude of the center point
 * @param centerLng - Longitude of the center point
 * @param limit - Maximum number of outlets to return (default: 10)
 */
export async function fetchNearestOutlets(
  centerLat: number,
  centerLng: number,
  limit: number = 10
): Promise<OutletApiResponse[]> {
  try {
    const params = new URLSearchParams({
      type: 'nearest',
      centerLat: centerLat.toString(),
      centerLng: centerLng.toString(),
      limit: limit.toString()
    });
    
    const response = await fetch(`${API_BASE_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching nearest outlets:', error);
    throw error;
  }
}

/**
 * Fetch outlets within the current map viewport
 * Useful for MapBox integration
 * @param bounds - Map bounds object with sw and ne properties
 */
export async function fetchOutletsInViewport(bounds: {
  sw: { lat: number; lng: number };
  ne: { lat: number; lng: number };
}): Promise<OutletApiResponse[]> {
  return fetchOutletsWithinBounds(
    bounds.sw.lat,
    bounds.sw.lng,
    bounds.ne.lat,
    bounds.ne.lng
  );
}

/**
 * Fetch outlets near user's current location
 * @param radiusKm - Search radius in kilometers (default: 10)
 * @param limit - Maximum number of outlets to return (default: 20)
 */
export async function fetchOutletsNearUser(
  radiusKm: number = 10,
  limit: number = 20
): Promise<OutletApiResponse[]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use nearest query for better performance with limit
          const outlets = await fetchNearestOutlets(latitude, longitude, limit);
          
          // Filter by radius if needed (GeoFirestore's nearest query doesn't guarantee radius)
          const filteredOutlets = outlets.filter(outlet => {
            const distance = outlet.distance || 0;
            return distance <= radiusKm;
          });
          
          resolve(filteredOutlets);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
}

/**
 * Utility function to calculate distance between two points
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
} 