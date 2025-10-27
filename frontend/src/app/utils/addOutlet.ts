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
  features: geometryCollection.geometries.map((geometry: any) => ({
    type: "Feature",
    properties: {},
    geometry: geometry as Polygon | MultiPolygon,
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
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!data || data.length === 0) {
    throw new Error("Unable to geocode address.");
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// Frontend wrapper function
export async function addOutletFrontend(input: FrontendOutletInput): Promise<void> {
  try {

    const locationName = input.locationName.trim();
    const chargerType = input.chargerType.trim();
    const userName = input.userName.trim();
    const userId = input.userId.trim();
    const description = input.description.trim();

    // --- Basic Validation ---
    if (!locationName || locationName.length < 5) {
      throw new Error("Please enter a valid address (5+ characters).");
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
    if(!description){
      throw new Error("No Description.");
    }

    const { lat, lng } = await getLatLngFromAddress(input.locationName);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      throw new Error("Geocoding returned invalid coordinates.");
    }
    
    if (!isOnLand(lat, lng)) {
      throw new Error("The selected location is not on land.");
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
      if (location.geohash === "") {
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
