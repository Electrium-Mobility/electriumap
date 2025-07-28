// Fixed readOutlets.ts
import { db } from "../firebase/firebase";
import { collection, DocumentData, QueryDocumentSnapshot, limit as firestoreLimit, query, orderBy, startAt, endAt, getDocs } from "firebase/firestore";
import { GeoOutlet } from "../models";
import * as geofire from 'geofire-common';
import {
  getAllGeoOutlets,
  getGeoOutletsByRadius,
  getGeoOutletsByBounds,
} from '../utils/geoFirestore';

interface GeoOutletProps {
  type?: 'all' | 'radius' | 'bounds';
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  southWestLat?: number;
  southWestLng?: number;
  northEastLat?: number;
  northEastLng?: number;
  limit?: number;
}

export const readOutlets = async (props?: GeoOutletProps): Promise<GeoOutlet[]> => {
  try {
    console.log('readOutlets called with props:', props);

    // If no props or type is 'all', get all outlets
    if (!props || props.type === 'all') {
      console.log('Fetching all outlets');
      return await getAllGeoOutlets();
    }

    switch (props.type) {
      case 'radius':
        if (props.centerLat !== undefined && props.centerLng !== undefined && props.radius !== undefined) {
          console.log(`Fetching outlets by radius: center(${props.centerLat}, ${props.centerLng}), radius: ${props.radius}km`);
          return await getGeoOutletsByRadius(
            props.centerLat,
            props.centerLng,
            props.radius
          );
        }
        throw new Error('Missing required parameters for radius query: centerLat, centerLng, radius');

      case 'bounds':
        if (props.southWestLat !== undefined && props.southWestLng !== undefined &&
            props.northEastLat !== undefined && props.northEastLng !== undefined) {
          console.log(`Fetching outlets by bounds: SW(${props.southWestLat}, ${props.southWestLng}), NE(${props.northEastLat}, ${props.northEastLng})`);
          return await getGeoOutletsByBounds(
            props.southWestLat,
            props.southWestLng,
            props.northEastLat,
            props.northEastLng
          );
        }
        throw new Error('Missing required parameters for bounds query: southWestLat, southWestLng, northEastLat, northEastLng');

      default:
        console.log('Default case: fetching all outlets');
        return await getAllGeoOutlets();
    }
  } catch (error) {
    console.error("Error reading outlets from firebase: ", error);
    throw error;
  }
};