import React, { useEffect, useRef } from 'react';
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

const Heatmap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const geojson = pinsToGeoJSON(pinsData);
    console.log('GeoJSON for heatmap:', geojson);

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-74.5, 40.7], // Center on NY/NJ
      zoom: 3
    });

    mapRef.current.on('load', () => {
      mapRef.current!.addSource('pins-geojson', {
        type: 'geojson',
        data: geojson
      });

      mapRef.current!.addLayer({
        id: 'pins-heatmap',
        type: 'heatmap',
        source: 'pins-geojson',
        minzoom: 0,
        maxzoom: 24,
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': 1,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': 30,
          'heatmap-opacity': 1
        }
      });
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '100vh', width: '100vw' }} />;
};

export default Heatmap;
