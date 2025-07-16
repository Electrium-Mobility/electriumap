import React, { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import pinsData from './pins.json';

function pinsToGeoJSON(pins: any[]) {
  return {
    type: 'FeatureCollection' as const,
    features: pins.map(pin => ({
      type: 'Feature' as const,
      properties: {
        id: pin.id,
        title: pin.title,
        description: pin.description,
        category: pin.category
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [pin.lng, pin.lat]
      }
    }))
  };
}

// Debounce helper function
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

const Heatmap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const updateHeatmapVisibility = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const bounds = map.getBounds();
    if (!bounds) return;

    // Get all features from the source
    const features = map.getSource('pins-geojson')?.serialize()?.data?.features || [];
    
    // Count pins that are within the current bounds
    const visiblePinsCount = features.filter((feature: any) => {
      const [lng, lat] = feature.geometry.coordinates;
      return lng >= bounds.getWest() &&
             lng <= bounds.getEast() &&
             lat >= bounds.getSouth() &&
             lat <= bounds.getNorth();
    }).length;

    console.log('Visible pins:', visiblePinsCount);

    // Toggle heatmap layer visibility based on pin count
    map.setLayoutProperty(
      'pins-heatmap',
      'visibility',
      visiblePinsCount >= 50 ? 'visible' : 'none'
    );
  }, []);

  // Create debounced version of the update function
  const debouncedUpdateHeatmap = useCallback(
    debounce(updateHeatmapVisibility, 300), // 300ms delay
    [updateHeatmapVisibility]
  );

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const geojson = pinsToGeoJSON(pinsData);
    console.log('GeoJSON for heatmap:', geojson);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40.7], // Center on NY/NJ
      zoom: 3
    });

    mapRef.current = map;

    map.on('load', () => {
      map.addSource('pins-geojson', {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: 'pins-heatmap',
        type: 'heatmap',
        source: 'pins-geojson',
        minzoom: 0,
        maxzoom: 24,
        layout: {
          visibility: 'none' // Start with heatmap hidden
        },
        paint: {
          // Increase weight with zoom level
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,
            20, 1
          ],
          // Increase intensity with zoom level
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.2,
            9, 1
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.1, 'rgb(103,169,207)',
            0.3, 'rgb(209,229,240)',
            0.5, 'rgb(253,219,199)',
            0.7, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          // Adjust radius based on zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 10,
            10, 25,
            15, 40
          ],
          // Decrease opacity with zoom
          'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            7, 1,
            18, 0.5
          ]
        }
      });

      // Initial visibility check (not debounced)
      updateHeatmapVisibility();

      // Update visibility on map move (debounced)
      map.on('moveend', debouncedUpdateHeatmap);
    });

    return () => {
      if (map) {
        map.off('moveend', debouncedUpdateHeatmap);
        map.remove();
      }
    };
  }, [debouncedUpdateHeatmap, updateHeatmapVisibility]);

  return <div ref={mapContainerRef} style={{ height: '100vh', width: '100vw' }} />;
};

export default Heatmap;
