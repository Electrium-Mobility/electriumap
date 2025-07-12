import { GeoOutlet } from './geoFirestore';

// Base URL for the outlets API
const API_BASE_URL = '/api/outlets';

// Interface for API response
interface OutletApiResponse extends Omit<GeoOutlet, 'latitude' | 'longitude'> {
  lat: number;
  lng: number;
}

// Enhanced API response with metadata
interface ApiResponse {
  data: OutletApiResponse[];
  meta: {
    count: number;
    queryType: string;
    responseTime: string;
    timestamp: string;
  };
}

// Error response interface
interface ApiError {
  error: string;
  message: string;
  timestamp: string;
  responseTime: string;
}

// Client-side utility functions for spatial queries

/**
 * Enhanced fetch function with error handling and retries
 */
async function fetchWithRetry(url: string, retries: number = 3): Promise<ApiResponse> {
  let lastError: Error;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(`API Error (${response.status}): ${errorData.message}`);
      }
      
      const data = await response.json();
      
      // Handle both old and new response formats
      if (data.data && data.meta) {
        return data as ApiResponse;
      } else {
        // Legacy format compatibility
        return {
          data: data as OutletApiResponse[],
          meta: {
            count: data.length,
            queryType: 'unknown',
            responseTime: '0ms',
            timestamp: new Date().toISOString()
          }
        };
      }
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof Error && error.message.includes('API Error (4')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError!;
}

/**
 * Fetch all outlets without spatial filtering
 */
export async function fetchAllOutlets(): Promise<OutletApiResponse[]> {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}?type=all`);
    console.log(`Fetched ${response.meta.count} outlets in ${response.meta.responseTime}`);
    return response.data;
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
    // Input validation
    if (typeof centerLat !== 'number' || typeof centerLng !== 'number' || typeof radiusKm !== 'number') {
      throw new Error('Invalid input: all parameters must be numbers');
    }
    
    if (centerLat < -90 || centerLat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    
    if (centerLng < -180 || centerLng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
    
    if (radiusKm <= 0 || radiusKm > 1000) {
      throw new Error('Invalid radius: must be between 0 and 1000 km');
    }
    
    const params = new URLSearchParams({
      type: 'radius',
      centerLat: centerLat.toString(),
      centerLng: centerLng.toString(),
      radius: radiusKm.toString()
    });
    
    const response = await fetchWithRetry(`${API_BASE_URL}?${params}`);
    console.log(`Fetched ${response.meta.count} outlets within ${radiusKm}km in ${response.meta.responseTime}`);
    return response.data;
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
    // Input validation
    if (typeof southWestLat !== 'number' || typeof southWestLng !== 'number' || 
        typeof northEastLat !== 'number' || typeof northEastLng !== 'number') {
      throw new Error('Invalid input: all parameters must be numbers');
    }
    
    if (southWestLat >= northEastLat || southWestLng >= northEastLng) {
      throw new Error('Invalid bounding box: southwest corner must be southwest of northeast corner');
    }
    
    const params = new URLSearchParams({
      type: 'bounds',
      southWestLat: southWestLat.toString(),
      southWestLng: southWestLng.toString(),
      northEastLat: northEastLat.toString(),
      northEastLng: northEastLng.toString()
    });
    
    const response = await fetchWithRetry(`${API_BASE_URL}?${params}`);
    console.log(`Fetched ${response.meta.count} outlets within bounds in ${response.meta.responseTime}`);
    return response.data;
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
    // Input validation
    if (typeof centerLat !== 'number' || typeof centerLng !== 'number' || typeof limit !== 'number') {
      throw new Error('Invalid input: all parameters must be numbers');
    }
    
    if (centerLat < -90 || centerLat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    
    if (centerLng < -180 || centerLng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
    
    if (limit <= 0 || limit > 100) {
      throw new Error('Invalid limit: must be between 1 and 100');
    }
    
    const params = new URLSearchParams({
      type: 'nearest',
      centerLat: centerLat.toString(),
      centerLng: centerLng.toString(),
      limit: limit.toString()
    });
    
    const response = await fetchWithRetry(`${API_BASE_URL}?${params}`);
    console.log(`Fetched ${response.meta.count} nearest outlets in ${response.meta.responseTime}`);
    return response.data;
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
  try {
    if (!bounds || !bounds.sw || !bounds.ne) {
      throw new Error('Invalid bounds: must provide sw and ne coordinates');
    }
    
    return await fetchOutletsWithinBounds(
      bounds.sw.lat,
      bounds.sw.lng,
      bounds.ne.lat,
      bounds.ne.lng
    );
  } catch (error) {
    console.error('Error fetching outlets in viewport:', error);
    throw error;
  }
}

/**
 * Enhanced function to fetch outlets near user's current location
 * @param radiusKm - Search radius in kilometers (default: 10)
 * @param limit - Maximum number of outlets to return (default: 20)
 * @param useHighAccuracy - Use high accuracy GPS (default: false)
 */
export async function fetchOutletsNearUser(
  radiusKm: number = 10,
  limit: number = 20,
  useHighAccuracy: boolean = false
): Promise<OutletApiResponse[]> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: useHighAccuracy,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 300000 // 5 minutes cache
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          console.log(`User location: ${latitude}, ${longitude} (accuracy: ${position.coords.accuracy}m)`);
          
          // Use radius query for better performance when we have a specific radius
          const outlets = await fetchOutletsWithinRadius(latitude, longitude, radiusKm);
          
          // Sort by distance if distance is available
          const sortedOutlets = outlets.sort((a, b) => {
            const distA = a.distance || 0;
            const distB = b.distance || 0;
            return distA - distB;
          });
          
          // Apply limit
          const limitedOutlets = sortedOutlets.slice(0, limit);
          
          resolve(limitedOutlets);
        } catch (error) {
          reject(error);
        }
      },
      (error) => {
        let errorMessage = 'Geolocation error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'The request to get user location timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        reject(new Error(errorMessage));
      },
      options
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

/**
 * Utility function to check if a point is within a bounding box
 * @param point - Point with lat and lng properties
 * @param bounds - Bounding box with sw and ne properties
 * @returns True if point is within bounds
 */
export function isPointInBounds(
  point: { lat: number; lng: number },
  bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }
): boolean {
  return (
    point.lat >= bounds.sw.lat &&
    point.lat <= bounds.ne.lat &&
    point.lng >= bounds.sw.lng &&
    point.lng <= bounds.ne.lng
  );
}

/**
 * Utility function to create a bounding box around a center point
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusKm - Radius in kilometers
 * @returns Bounding box object
 */
export function createBoundingBox(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } {
  // Approximate degrees per kilometer
  const latDegPerKm = 1 / 111.32;
  const lngDegPerKm = 1 / (111.32 * Math.cos(centerLat * Math.PI / 180));
  
  const latOffset = radiusKm * latDegPerKm;
  const lngOffset = radiusKm * lngDegPerKm;
  
  return {
    sw: {
      lat: centerLat - latOffset,
      lng: centerLng - lngOffset
    },
    ne: {
      lat: centerLat + latOffset,
      lng: centerLng + lngOffset
    }
  };
} 