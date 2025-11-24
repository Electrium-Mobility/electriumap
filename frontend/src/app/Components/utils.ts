export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export interface Bounds {
  sw: [number, number]; // southwest [lng, lat]
  ne: [number, number]; // northeast [lng, lat]
}

export interface PinData {
  id: string;
  lng: number;
  lat: number;
  title: string;
  description: string;
  category: string;
  /**
   * Indicates the pin originated from Firestore.  Sample or fallback pins will leave this false/undefined.
   */
  fromDb?: boolean;
}

export function isPointInBounds(
  point: { lng: number; lat: number },
  bounds: Bounds
): boolean {
  return (
    point.lng >= bounds.sw[0] &&
    point.lng <= bounds.ne[0] &&
    point.lat >= bounds.sw[1] &&
    point.lat <= bounds.ne[1]
  );
}

/**
 * Calculate bounds for a radius (in km) around a point
 * Returns bounds that encompass a square area around the center point
 */
export function calculateBoundsForRadius(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): Bounds {
  // Earth's radius in km
  const R = 6371;
  
  // Convert radius to degrees (approximate)
  // At the equator: 1 degree lat ≈ 111 km, 1 degree lng ≈ 111 km
  // Adjust for latitude
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(centerLat * Math.PI / 180));
  
  return {
    sw: [centerLng - lngDelta, centerLat - latDelta],
    ne: [centerLng + lngDelta, centerLat + latDelta]
  };
} 