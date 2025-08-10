import { doc, setDoc, getDoc, collection, addDoc, getDocs, updateDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import { geohashForLocation, geohashQueryBounds, distanceBetween } from "geofire-common";
import { point } from "@turf/helpers";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
// @ts-ignore
import geometryCollection from "../landpolygon/ne_10m_land_geojson.json";
import { FeatureCollection, Feature, Geometry, Polygon, MultiPolygon } from "geojson";
const landPolygons: FeatureCollection<Polygon | MultiPolygon> = {
  type: "FeatureCollection",
  features: geometryCollection.geometries.map((geometry: Geometry) => ({
    type: "Feature",
    properties: {},
    geometry,
  })),
};

//interface for data describing an outlet
interface Outlet {
  latitude: number;
  longitude: number;
  userName: string; 
  userId: string;
  locationName: string;     
  chargerType: string;      
  description: string; 
}

//function to add outlate to database
export async function addOutlet(outlet: Outlet) {
  try {
    const geohash = geohashForLocation([outlet.latitude, outlet.longitude]);
    //add outlet data with timestamp
    const docRef = await addDoc(collection(db, "Outlets"), {
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      userName: outlet.userName,
      userid: outlet.userId,
      geohash:geohash,
      locationName: outlet.locationName,
      chargerType: outlet.chargerType,
      description: outlet.description,
      createdAt: serverTimestamp() 
    });
    //log document id
    console.log("Outlet added to database with ID: ", docRef.id);

    // add outlet reference under the user's document
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    
    if (userId) {
      const outletRefInUserDoc = doc(db, "Users", userId, "Outlets", docRef.id);

      // Only add empty document (to comply with Firestore rules)
      await setDoc(outletRefInUserDoc, {});

      console.log("Added reference to outlet in user's subcollection.");
    } else {
      console.error("No authenticated user found.");
    }
    
  } catch (e) {
    //log errorss
    console.error("Error adding outlet to database: ", e);
  }
}
interface FrontendOutletInput {
  locationName: string;
  chargerType: string;
  description: string;
  userName: string;
  userId: string;
}

// Geocoding helper
async function getLatLngFromAddress(address: string): Promise<{ lat: number; lng: number }> {
  const encoded = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Geocoding service is currently unavailable.");
    }
    
    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error("Address not found. Please enter a valid address (e.g., '123 Main St, City, State' or 'Central Park, New York').");
    }

    const result = data[0];
    
    // Check if the result has proper coordinates
    if (!result.lat || !result.lon || isNaN(parseFloat(result.lat)) || isNaN(parseFloat(result.lon))) {
      throw new Error("Invalid address coordinates returned. Please try a more specific address.");
    }

    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to validate address. Please check your internet connection and try again.");
  }
}
export async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error("Reverse geocoding service unavailable");
    }
    
    const data = await response.json();

    if (!data || !data.display_name) {
      return `${lng.toFixed(5)}, ${lat.toFixed(5)}`; // fallback to coordinates
    }

    return data.display_name;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    return `${lng.toFixed(5)}, ${lat.toFixed(5)}`; // fallback to coordinates
  }
}

// Frontend wrapper function
export async function addOutletFrontend(input: FrontendOutletInput): Promise<void> {
  try {
    const locationName = input.locationName.trim();
    const chargerType = input.chargerType.trim();
    const userName = input.userName.trim();
    const userId = input.userId.trim();
    const description = input.description.trim();

    // --- Enhanced Address Validation ---
    if (!locationName || locationName.length < 3) {
      throw new Error("Please enter a valid address (at least 3 characters).");
    }

    // Check for obviously invalid addresses
    if (/^[0-9\s\-\.]+$/.test(locationName)) {
      throw new Error("Please enter a complete address, not just coordinates or numbers.");
    }

    // Check for common invalid patterns
    const invalidPatterns = [
      /^test$/i,
      /^abc+$/i,
      /^123+$/i,
      /^[a-z]$/i, // single letter
      /^\s*$/, // only whitespace
      /^\.+$/, // only dots
      /^-+$/, // only dashes
    ];

    if (invalidPatterns.some(pattern => pattern.test(locationName))) {
      throw new Error("Please enter a real address (e.g., '123 Main St, City' or 'Times Square, NYC').");
    }

    if (!chargerType || chargerType.length < 2) {
      throw new Error("Please enter a valid charger type.");
    }

    if (!userName || userName.length < 2) {
      throw new Error("Please enter a valid user name.");
    }

    if (!userId || userId.length < 3) {
      throw new Error("Invalid user ID.");
    }

    if (!description || description.trim().length === 0) {
      throw new Error("Please provide a description.");
    }

    // --- Geocoding with enhanced error handling ---
    let lat: number, lng: number;
    
    try {
      const coords = await getLatLngFromAddress(locationName);
      lat = coords.lat;
      lng = coords.lng;
    } catch (geocodingError) {
      // Re-throw geocoding errors with user-friendly messages
      throw geocodingError;
    }

    // Validate coordinate ranges
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error("Invalid location coordinates. Please enter a valid address.");
    }

    // Check if location is on land
    if (!isOnLand(lat, lng)) {
      throw new Error("The location appears to be in water. Please enter an address on land.");
    }

    await addOutlet({
      latitude: lat,
      longitude: lng,
      userName: input.userName,
      userId: input.userId,
      locationName: input.locationName,
      chargerType: input.chargerType,
      description: input.description,
    });
  } catch (error) {
    console.error("Failed to add outlet from frontend:", error);
    throw error;
  }
}
export async function fetchNearbyOutlets(center: [number, number], radiusInMeters: number) {
  const bounds = geohashQueryBounds(center, radiusInMeters);
  const promises = [];

  for (const b of bounds) {
    
    const q = query(
      collection(db, "Outlets"),
      orderBy("geohash"),
      where("geohash", ">=", b[0]),
      where("geohash", "<=", b[1])
    );
    promises.push(getDocs(q));
  }

  const snapshots = await Promise.all(promises);

  const matchingDocs: any[] = [];

  for (const snap of snapshots) {
    for (const doc of snap.docs) {
      const location = doc.data();
      if (location.geohash="") {
        console.log("Skipping document without geohash:", doc.id);
        continue;
      }
      const lat = location.latitude;
      const lng = location.longitude;

      // Check actual distance to avoid false positives
      const distance = distanceBetween([lat, lng], center);
      if (distance * 1000 <= radiusInMeters) {
        matchingDocs.push({ id: doc.id, ...location });
      }
    }
  }

  return matchingDocs;
}
export async function addGeohashToExistingOutlets() {
  try {
    const snapshot = await getDocs(collection(db, "Outlets"));
    
    const batch = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.geohash && data.latitude && data.longitude) {
        const geohash = geohashForLocation([data.latitude, data.longitude]);
        batch.push(updateDoc(doc.ref, { geohash }));
      }
    });
    
    await Promise.all(batch);
    console.log(' Added geohash to existing outlets');
  } catch (error) {
    console.error(' Error adding geohash:', error);
  }
}

export function isOnLand(lat: number, lng: number): boolean {
  if (!landPolygons?.features) {
    console.error("GeoJSON is missing or malformed");
    return false;
  }

  const pt = point([lng, lat]);
  return landPolygons.features.some((feature) =>
    booleanPointInPolygon(pt, feature)
  );
}
interface FrontendOutletInput {
  locationName: string;
  chargerType: string;
  description: string;
  userName: string;
  userId: string;
}
