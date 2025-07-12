/**
 * GeoFirestore Spatial Indexing Examples
 * 
 * This file demonstrates how to use the new spatial indexing features
 * implemented with GeoFirestore for efficient location-based queries.
 */

import { 
  fetchAllOutlets, 
  fetchOutletsWithinRadius, 
  fetchOutletsWithinBounds, 
  fetchNearestOutlets,
  fetchOutletsInViewport,
  fetchOutletsNearUser,
  calculateDistance
} from './spatialQueries';

import { addOutlet } from './addOutlet';
import { Outlet } from './geoFirestore';

/**
 * Example 1: Add a new outlet with spatial indexing
 */
export async function exampleAddOutlet() {
  const newOutlet: Outlet = {
    latitude: 40.7128,
    longitude: -74.0060,
    userName: "John Doe",
    userId: "user123",
    locationName: "Manhattan Charging Station",
    chargerType: "Tesla Supercharger",
    description: "Fast charging station in downtown Manhattan"
  };

  try {
    const outletId = await addOutlet(newOutlet);
    console.log('New outlet added with ID:', outletId);
    return outletId;
  } catch (error) {
    console.error('Error adding outlet:', error);
  }
}

/**
 * Example 2: Find all outlets within 5km of Times Square
 */
export async function exampleFindOutletsNearTimesSquare() {
  const timesSquareLat = 40.7580;
  const timesSquareLng = -73.9855;
  const radiusKm = 5;

  try {
    const outlets = await fetchOutletsWithinRadius(timesSquareLat, timesSquareLng, radiusKm);
    console.log(`Found ${outlets.length} outlets within ${radiusKm}km of Times Square:`, outlets);
    return outlets;
  } catch (error) {
    console.error('Error fetching outlets near Times Square:', error);
  }
}

/**
 * Example 3: Find outlets within Manhattan bounds
 */
export async function exampleFindOutletsInManhattan() {
  // Approximate bounds for Manhattan
  const manhattanBounds = {
    southWestLat: 40.7047,
    southWestLng: -74.0479,
    northEastLat: 40.8176,
    northEastLng: -73.9099
  };

  try {
    const outlets = await fetchOutletsWithinBounds(
      manhattanBounds.southWestLat,
      manhattanBounds.southWestLng,
      manhattanBounds.northEastLat,
      manhattanBounds.northEastLng
    );
    console.log(`Found ${outlets.length} outlets in Manhattan:`, outlets);
    return outlets;
  } catch (error) {
    console.error('Error fetching outlets in Manhattan:', error);
  }
}

/**
 * Example 4: Find the 10 nearest outlets to a specific location
 */
export async function exampleFindNearestOutlets() {
  const centralParkLat = 40.7829;
  const centralParkLng = -73.9654;
  const limit = 10;

  try {
    const outlets = await fetchNearestOutlets(centralParkLat, centralParkLng, limit);
    console.log(`Found ${outlets.length} nearest outlets to Central Park:`, outlets);
    
    // Sort by distance and show distances
    outlets.forEach((outlet, index) => {
      console.log(`${index + 1}. ${outlet.locationName} - ${outlet.distance?.toFixed(2)}km away`);
    });
    
    return outlets;
  } catch (error) {
    console.error('Error fetching nearest outlets:', error);
  }
}

/**
 * Example 5: Find outlets in the current map viewport
 * (Useful for MapBox integration)
 */
export async function exampleFindOutletsInViewport() {
  // Example map bounds (could come from MapBox getBounds())
  const mapBounds = {
    sw: { lat: 40.7000, lng: -74.0200 },
    ne: { lat: 40.8000, lng: -73.9000 }
  };

  try {
    const outlets = await fetchOutletsInViewport(mapBounds);
    console.log(`Found ${outlets.length} outlets in current viewport:`, outlets);
    return outlets;
  } catch (error) {
    console.error('Error fetching outlets in viewport:', error);
  }
}

/**
 * Example 6: Find outlets near user's current location
 */
export async function exampleFindOutletsNearUser() {
  const radiusKm = 10;
  const limit = 20;

  try {
    const outlets = await fetchOutletsNearUser(radiusKm, limit);
    console.log(`Found ${outlets.length} outlets near user location:`, outlets);
    return outlets;
  } catch (error) {
    console.error('Error fetching outlets near user:', error);
  }
}

/**
 * Example 7: Calculate distances between outlets
 */
export async function exampleCalculateDistances() {
  try {
    const outlets = await fetchAllOutlets();
    
    if (outlets.length >= 2) {
      const outlet1 = outlets[0];
      const outlet2 = outlets[1];
      
      const distance = calculateDistance(
        outlet1.lat, 
        outlet1.lng, 
        outlet2.lat, 
        outlet2.lng
      );
      
      console.log(`Distance between ${outlet1.locationName} and ${outlet2.locationName}: ${distance.toFixed(2)}km`);
      return distance;
    }
  } catch (error) {
    console.error('Error calculating distances:', error);
  }
}

/**
 * Example 8: Advanced usage - Find outlets by type within radius
 */
export async function exampleFindSpecificChargerTypes() {
  const centerLat = 40.7128;
  const centerLng = -74.0060;
  const radiusKm = 20;
  const desiredChargerType = "Tesla Supercharger";

  try {
    const outlets = await fetchOutletsWithinRadius(centerLat, centerLng, radiusKm);
    
    // Filter by charger type
    const teslaOutlets = outlets.filter(outlet => 
      outlet.chargerType?.toLowerCase().includes(desiredChargerType.toLowerCase())
    );
    
    console.log(`Found ${teslaOutlets.length} Tesla Superchargers within ${radiusKm}km:`, teslaOutlets);
    return teslaOutlets;
  } catch (error) {
    console.error('Error fetching Tesla outlets:', error);
  }
}

/**
 * Example 9: Real-time search as user moves the map
 * (Debounced function for map movement)
 */
export function createMapMoveHandler() {
  let timeout: NodeJS.Timeout;

  return function debouncedMapSearch(bounds: {
    sw: { lat: number; lng: number };
    ne: { lat: number; lng: number };
  }) {
    clearTimeout(timeout);
    
    timeout = setTimeout(async () => {
      try {
        const outlets = await fetchOutletsInViewport(bounds);
        console.log('Map moved - found outlets:', outlets);
        
        // Here you would update your map markers or state
        // updateMapMarkers(outlets);
        
      } catch (error) {
        console.error('Error updating outlets for map movement:', error);
      }
    }, 300); // 300ms debounce
  };
}

/**
 * Example 10: Usage in a React component
 */
export const ReactComponentExample = `
import React, { useState, useEffect } from 'react';
import { fetchOutletsNearUser, fetchOutletsWithinRadius } from './utils/spatialQueries';

function OutletMap() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadNearbyOutlets();
  }, []);

  const loadNearbyOutlets = async () => {
    try {
      setLoading(true);
      const nearbyOutlets = await fetchOutletsNearUser(10, 20);
      setOutlets(nearbyOutlets);
    } catch (error) {
      console.error('Error loading nearby outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchInRadius = async (lat, lng, radius) => {
    try {
      setLoading(true);
      const outlets = await fetchOutletsWithinRadius(lat, lng, radius);
      setOutlets(outlets);
    } catch (error) {
      console.error('Error searching outlets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading outlets...</div>;

  return (
    <div>
      <h2>Nearby Charging Stations</h2>
      {outlets.map(outlet => (
        <div key={outlet.id}>
          <h3>{outlet.locationName}</h3>
          <p>{outlet.description}</p>
          <p>Distance: {outlet.distance?.toFixed(2)}km</p>
          <p>Charger Type: {outlet.chargerType}</p>
        </div>
      ))}
    </div>
  );
}
`;

// Export all examples for easy testing
export const allExamples = {
  exampleAddOutlet,
  exampleFindOutletsNearTimesSquare,
  exampleFindOutletsInManhattan,
  exampleFindNearestOutlets,
  exampleFindOutletsInViewport,
  exampleFindOutletsNearUser,
  exampleCalculateDistances,
  exampleFindSpecificChargerTypes,
  createMapMoveHandler
}; 