"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapBoxProps = {
  width?: string;
  height?: string;
};

const MapBox = ({ width = "100vw", height = "100vh" }: MapBoxProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-74.5, 40],
        zoom: 9,
        style: "mapbox://styles/mapbox/streets-v11",
      });
    }

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div
      style={{ width, height }}
      ref={mapContainerRef}
      className="map-container"
    />
  );
};

export default MapBox;
