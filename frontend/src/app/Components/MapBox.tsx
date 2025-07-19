"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { FeatureCollection, Point, Feature } from "geojson";
import { debounce, Bounds, PinData, isPointInBounds } from "./utils";
import pinsData from "./pins.json";
import { isOnLand } from "../utils/addOutlet";


// Helper: Convert pinsData to GeoJSON FeatureCollection
const pinsToGeoJSON = (pins: PinData[]): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: pins.map<Feature<Point>>((pin) => ({
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [pin.lng, pin.lat],
    },
    properties: {}, 
  })),
});

const HEATMAP_SOURCE_ID = "pins-heatmap-source";
const HEATMAP_LAYER_ID = "pins-heatmap-layer";
const HEATMAP_MAX_ZOOM = 11; // Show heatmap at zoom <= 10, heatmap fades out fully before zoom 11

interface MapBoxProps {
  width?: string;
  height?: string;
  onPinDrop?: (lat: number, lng: number) => void;
  onMapLoad?: () => void;
  flyTo?: { lng: number; lat: number } | null;
}

const MapBox = ({ width = "100vw", height = "100vh", onPinDrop, flyTo }: MapBoxProps) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Store current bounds and visible pins
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const [visiblePins, setVisiblePins] = useState<PinData[]>([]);
  const [ outlets, setOutlets ] = useState<PinData[]>([]); 

  // Effect to handle flying to searched location
  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: 14,
        essential: true
      });
    }
  }, [flyTo]);

  // Fetch outlets data from the backend
  useEffect(() => {
    fetch("/api/outlets")
      .then(res => res.json())
      .then((data) => {
            setOutlets(data);
            console.log("Fetched outlets:", data);
      })
      .catch(console.error);
  }, []);

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
      if (!mapRef.current) return;
      const zoom = mapRef.current.getZoom();
      const bounds = getBounds();
      if (!bounds) return;

      setCurrentBounds(bounds);
      const filteredPins = filterPinsByBounds(bounds);
      setVisiblePins(filteredPins);

      if (zoom > HEATMAP_MAX_ZOOM) {
        renderPins(filteredPins);
      } else {
        clearAllMarkers(); // Ensure pins are hidden when heatmap is visible
      }
    }, 300), // 300ms debounce
    [getBounds, filterPinsByBounds, renderPins, clearAllMarkers]
  );

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-74.5, 40],
        zoom: 9,
        style: "mapbox://styles/hannahwiens/cmcj9t5wf000v01p6chg0e07a",
      });

      // Add heatmap source and layer
      mapRef.current.on("load", () => {
        if (!mapRef.current) return;
        // Add GeoJSON source for pins
        if (!mapRef.current.getSource(HEATMAP_SOURCE_ID)) {
          mapRef.current.addSource(HEATMAP_SOURCE_ID, {
            type: "geojson",
            data: pinsToGeoJSON(pinsData),
          });
        }
        // Add heatmap layer
        if (!mapRef.current.getLayer(HEATMAP_LAYER_ID)) {
          mapRef.current.addLayer({
            id: HEATMAP_LAYER_ID,
            type: "heatmap",
            source: HEATMAP_SOURCE_ID,
            maxzoom: HEATMAP_MAX_ZOOM,
            paint: {
              // Heatmap color and intensity config (tweak as needed)
              "heatmap-weight": 1,
              "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 9, 3],
              "heatmap-color": [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0, "rgba(33,102,172,0)",
                0.2, "rgb(103,169,207)",
                0.4, "rgb(209,229,240)",
                0.6, "rgb(253,219,199)",
                0.8, "rgb(239,138,98)",
                1, "rgb(178,24,43)"
              ],
              // adjust radius of heatmap locations 
              "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 
              0, 2, 
              4, 8,
              8, 15],
              // fade heatmap between zoom 9 and 11 before rendering pins 
              "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 9, 1, 11, 0]
            },
          });
        }

        // Set initial visibility of heatmap 
        if (mapRef.current.getLayer(HEATMAP_LAYER_ID)) {
          mapRef.current.setLayoutProperty(
            HEATMAP_LAYER_ID,
            "visibility",
            mapRef.current!.getZoom() <= HEATMAP_MAX_ZOOM ? "visible" : "none"
          );
        }
      });

      // Add moveend and zoomend event listeners
      mapRef.current.on("moveend", debouncedUpdatePins);
      mapRef.current.on("zoomend", debouncedUpdatePins);

      // Toggle heatmap/marker visibility on zoom
      mapRef.current.on("zoom", () => {
        if (!mapRef.current) return;
        const zoom = mapRef.current.getZoom();
        const showHeatmap = zoom <11; // fade heatmap out gradually 
        const showPins = zoom >= HEATMAP_MAX_ZOOM; // show pins staring at zoom 10

        // Toggle heatmap layer visibility
        if (mapRef.current.getLayer(HEATMAP_LAYER_ID)) {
          mapRef.current.setLayoutProperty(
            HEATMAP_LAYER_ID,
            "visibility",
            showHeatmap ? "visible" : "none"
          );
        }

        // manage marker visibility
        if (showHeatmap) {
          // Hide all pins
          clearAllMarkers();
        } else {
          // Hide heatmap (already done above), show pins
          renderPins(visiblePins);
        }
      });

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
        const land =  isOnLand(lat, lng);
        if (!land) {
          console.log("Dropped point is in water — ignoring.");
          return; //  prevent pin drop
        }
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
    </>
  );
};
export default MapBox;
