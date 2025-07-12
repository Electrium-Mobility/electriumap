import { 
  getAllGeoOutlets, 
  getOutletsWithinRadius, 
  getOutletsWithinBounds, 
  getNearestOutlets,
  type GeoOutlet 
} from '../utils/geoFirestore';

//interface for query parameters
interface SpatialQueryParams {
  type?: 'all' | 'radius' | 'bounds' | 'nearest';
  centerLat?: number;
  centerLng?: number;
  radius?: number;
  southWestLat?: number;
  southWestLng?: number;
  northEastLat?: number;
  northEastLng?: number;
  limit?: number;
}

//function to read outlets from database with spatial query support
export const readOutlets = async (params?: SpatialQueryParams): Promise<GeoOutlet[]> => {
  try {
    // Default to getting all outlets if no parameters provided
    if (!params || params.type === 'all') {
      return await getAllGeoOutlets();
    }

    // Handle different query types
    switch (params.type) {
      case 'radius':
        if (params.centerLat && params.centerLng && params.radius) {
          return await getOutletsWithinRadius(
            params.centerLat, 
            params.centerLng, 
            params.radius
          );
        }
        throw new Error('Missing required parameters for radius query: centerLat, centerLng, radius');

      case 'bounds':
        if (params.southWestLat && params.southWestLng && params.northEastLat && params.northEastLng) {
          return await getOutletsWithinBounds(
            params.southWestLat,
            params.southWestLng,
            params.northEastLat,
            params.northEastLng
          );
        }
        throw new Error('Missing required parameters for bounds query: southWestLat, southWestLng, northEastLat, northEastLng');

      case 'nearest':
        if (params.centerLat && params.centerLng) {
          return await getNearestOutlets(
            params.centerLat, 
            params.centerLng, 
            params.limit || 10
          );
        }
        throw new Error('Missing required parameters for nearest query: centerLat, centerLng');

      default:
        return await getAllGeoOutlets();
    }
  } catch (error) {
    console.error("Error reading outlets from database: ", error);
    throw error;
  }
}