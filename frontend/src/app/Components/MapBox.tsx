"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapBoxProps = {
  width?: string;
  height?: string;
};

const MapBox = ({ width = "100vw", height = "100vh" }: MapBoxProps) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  //controls whether pin drop overlay is showing
  const [showPinOverlay, setPinOverlay] = useState(false);
  //displays last coordinates on pin drop overlay
  const [lastCoords, setLastCoords] = useState<{ lng: number; lat: number} | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-74.5, 40],
        zoom: 9,
        style: "mapbox://styles/mapbox/streets-v11",
      });

      // Add click event to drop a pin and log coordinates
      mapRef.current.on('click', (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        // Create a marker
        const marker = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
        // Add to marker refs
        markersRef.current.push(marker);
        // Add click event to remove marker
        marker.getElement().addEventListener('click', function(ev) {
          ev.stopPropagation(); // Prevent map click event
          marker.remove();
          // Remove from marker refs
          markersRef.current = markersRef.current.filter(m => m !== marker);
          //Removes pin drop overlay
          setPinOverlay(false);
          setLastCoords(null);
        });
        // Log coordinates
        console.log('Dropped pin at:', { lng, lat });

        //Shows white overlay when pin is dropped
        setPinOverlay(true);
        setLastCoords({lng, lat});
      });
    }

    return () => {
      // Remove all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
    };
  }, []);

  return (
    <>
      <div
        style={{ width, height }}
        ref={mapContainerRef}
        className="map-container"
      />

      {showPinOverlay && ( //Text inside pin drop overlay
        <div className="fixed bottom-10 p-4 right-10 backdrop-blur bg-white/30 border border-white/60 rounded-2xl shadow-lg w-80 h-100 text-white">
          <p className="font-semibold text-lg">You dropped a pin!</p>
          <p className="font-sm"> Longitude: {lastCoords.lng.toFixed(5)}</p>
          <p className="font-sm"> Latitude: {lastCoords.lat.toFixed(5)}</p>
        </div>
      )}
    </>
  );
};

export default MapBox;
