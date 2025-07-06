"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { debounce, Bounds, PinData, isPointInBounds } from "./utils";
import pinsData from "./pins.json";

type MapBoxProps = {
  width?: string;
  height?: string;
  onPinDrop?: (lat: number, lng:number) => void;
};

const MapBox = ({ width = "100vw", height = "100vh", onPinDrop}: MapBoxProps) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Store current bounds and visible pins
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const [visiblePins, setVisiblePins] = useState<PinData[]>([]);

  // Function to get current map bounds
  const getBounds = useCallback((): Bounds | null => {
    if (!mapRef.current) return null;
    
    const bounds = mapRef.current.getBounds();
    if (!bounds) return null;
    
    return {
      sw: [bounds.getWest(), bounds.getSouth()],
      ne: [bounds.getEast(), bounds.getNorth()]
    };
  }, []);

  // Function to filter pins based on bounds
  const filterPinsByBounds = useCallback((bounds: Bounds): PinData[] => {
    return pinsData.filter(pin => isPointInBounds(pin, bounds));
  }, []);

  // Function to clear all markers
  const clearAllMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Function to render pins
  const renderPins = useCallback((pins: PinData[]) => {
    if (!mapRef.current) return;

    clearAllMarkers();

    pins.forEach(pin => {
      const marker = new mapboxgl.Marker()
        .setLngLat([pin.lng, pin.lat])
        .addTo(mapRef.current!);

      // Add click event to show pin info
      marker.getElement().addEventListener("click", function (ev) {
        ev.stopPropagation(); // Prevent map click event
        console.log("Pin clicked:", pin);
        // You can add a popup or tooltip here
      });

      markersRef.current.push(marker);
    });
  }, [clearAllMarkers]);

  // Debounced function to update visible pins
  const debouncedUpdatePins = useCallback(
    debounce(() => {
      const bounds = getBounds();
      if (!bounds) return;

      setCurrentBounds(bounds);
      const filteredPins = filterPinsByBounds(bounds);
      setVisiblePins(filteredPins);
      renderPins(filteredPins);
    }, 300), // 300ms debounce
    [getBounds, filterPinsByBounds, renderPins]
  );

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-74.5, 40],
        zoom: 9,
        style: "mapbox://styles/hannahwiens/cmcgjpr31008v01ry30byd0d4",
      });

      // Add moveend and zoomend event listeners
      mapRef.current.on("moveend", debouncedUpdatePins);
      mapRef.current.on("zoomend", debouncedUpdatePins);

      // Initial pin rendering
      const initialBounds = getBounds();
      if (initialBounds) {
        const initialPins = filterPinsByBounds(initialBounds);
        setCurrentBounds(initialBounds);
        setVisiblePins(initialPins);
        renderPins(initialPins);
      }

      // Add click event to drop a pin and log coordinates
      mapRef.current.on("click", (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        // Create a marker
        const marker = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(mapRef.current!);
        // Add to marker refs
        markersRef.current.push(marker);
        // Add click event to remove marker
        marker.getElement().addEventListener("click", function (ev) {
          ev.stopPropagation(); // Prevent map click event
          marker.remove();
          // Remove from marker refs
          markersRef.current = markersRef.current.filter((m) => m !== marker);
        });
        // Log coordinates
        console.log("Dropped pin at:", { lng, lat });

        //Shows white overlay when pin is dropped
        //setPinOverlay(true);
        onPinDrop?.(lat, lng);
      });
    }

    return () => {
      // Remove all markers
      clearAllMarkers();
      mapRef.current?.remove();
    };
  }, [debouncedUpdatePins, getBounds, filterPinsByBounds, renderPins, clearAllMarkers]);

  return (
    <>
      <div
        style={{ width, height }}
        ref={mapContainerRef}
        className="map-container"
      />

      {/* Debug info overlay */}
      <div className="fixed top-4 left-4 backdrop-blur-lg bg-white/30 border border-white/60 rounded-2xl shadow-lg p-4 text-black">
        <p className="font-semibold text-sm">Viewport Info</p>
        <p className="text-xs">Visible Pins: {visiblePins.length}</p>
        <p className="text-xs">Total Pins: {pinsData.length}</p>
        {currentBounds && (
          <>
            <p className="text-xs">SW: [{currentBounds.sw[0].toFixed(3)}, {currentBounds.sw[1].toFixed(3)}]</p>
            <p className="text-xs">NE: [{currentBounds.ne[0].toFixed(3)}, {currentBounds.ne[1].toFixed(3)}]</p>
          </>
        )}
      </div>
    </>
  );
};
export default MapBox;
