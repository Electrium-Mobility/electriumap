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
  title?: string;
  category?: string;
  id?: string;
  geohash?: string;
  createdAt?: any;
  distance?: number; // distance from query point in km
}