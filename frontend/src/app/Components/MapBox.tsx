"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { debounce, Bounds, isPointInBounds } from "./utils";
import pinsData from "./pins.json";            // fallback sample pins – replaced when Firestore loads
import { isOnLand } from "../utils/addOutlet";
import type { GeoOutlet } from "../models/index";

import type { Feature, FeatureCollection, Point } from "geojson";

// Convert plain pins to a GeoJSON FeatureCollection
const pinsToGeoJSON = (pins: GeoOutlet[]): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: pins.map<Feature<Point>>((pin) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [pin.longitude, pin.latitude] }, // Fixed: use longitude/latitude
    properties: {
      id: pin.id,
      description: pin.description,
      locationName: pin.locationName,
      chargerType: pin.chargerType
    },
  })),
});

const HEATMAP_SOURCE_ID = "pins-heatmap-source";
const HEATMAP_LAYER_ID = "pins-heatmap-layer";
const HEATMAP_MAX_ZOOM = 11; // heatmap visible up to zoom 10

interface MapBoxProps {
  width?: string;
  height?: string;
  onPinDrop?: (lat: number, lng: number) => void;
  lightMode?: boolean;
  onMapLoad?: () => void;
  flyTo?: { lng: number; lat: number } | null;
}

const MapBox = ({ width = "100vw", height = "100vh", onPinDrop, lightMode, flyTo }: MapBoxProps) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Store current bounds and visible pins
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const [visiblePins, setVisiblePins] = useState<GeoOutlet[]>([]);
  // All pins available to render (starts with sample data, replaced by Firestore)
  const [allPins, setAllPins] = useState<GeoOutlet[]>([]);
  const [currentStyleMode, setCurrentStyleMode] = useState(lightMode);

  const getBounds = useCallback((): Bounds | null => {
    if (!mapRef.current) return null;

    const bounds = mapRef.current.getBounds();
    if (!bounds) return null;

    return {
      sw: [bounds.getWest(), bounds.getSouth()],
      ne: [bounds.getEast(), bounds.getNorth()],
    };
  }, []);

  // Function to filter pins based on bounds
  const filterPinsByBounds = useCallback((bounds: Bounds): GeoOutlet[] => {
    return allPins.filter((pin) =>
      isPointInBounds({ lng: pin.longitude, lat: pin.latitude }, bounds)
    );
  }, [allPins]);

  // Function to clear all markers
  const clearAllMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  const renderPins = useCallback((pins: GeoOutlet[]) => {
    if (!mapRef.current) return;

    clearAllMarkers();

    pins.forEach((pin) => {
      const el = document.createElement("div");
      el.innerHTML = `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
      el.style.cursor = "pointer";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
        `<div>
          <h3 style=\"margin:0;font-weight:600;\">${pin.title}</h3>
          ${pin.description ? `<p style=\"margin:4px 0;\">${pin.description}</p>` : ""}
          ${pin.category ? `<p style=\"margin:0;font-size:12px;\">Type: ${pin.category}</p>` : ""}
        </div>`
      );

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(popup)
        .addTo(mapRef.current!);

      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        console.log("Pin clicked:", pin);
      });

      markersRef.current.push(marker);
    });
  }, [clearAllMarkers]);

  const debouncedUpdatePinsFirebase = useCallback(
    debounce(async () => {
      const bounds = getBounds();
      if (!bounds) return;

      const params = new URLSearchParams({
        southWestLat: bounds.sw[1].toString(),
        southWestLng: bounds.sw[0].toString(),
        northEastLat: bounds.ne[1].toString(),
        northEastLng: bounds.ne[0].toString(),
        type: 'bounds'
      });

      try {
        const response = await fetch(`/api/outlets?${params.toString()}`);
        if (!response.ok) {
          console.error("Failed to fetch outlets:", response.status, response.statusText);
          return;
        }

        const result = await response.json();

        if (!Array.isArray(result)) {
          console.warn("Expected array but got:", result);
          return;
        }

        // Map the API response to GeoOutlet format
        const mapped: GeoOutlet[] = result
          .filter((d: any) => typeof d.latitude === "number" && typeof d.longitude === "number")
          .map((d: any) => ({
            id: d.id ?? String(Math.random()),
            latitude: d.latitude,
            longitude: d.longitude,
            userName: d.userName ?? "",
            userId: d.userId ?? "",
            locationName: d.locationName ?? "Outlet",
            description: d.description ?? "",
            chargerType: d.chargerType ?? "",
          }));


        setVisiblePins(mapped);
        renderPins(mapped);


        // Update heatmap data
        if (mapRef.current?.getSource(HEATMAP_SOURCE_ID)) {
          (mapRef.current.getSource(HEATMAP_SOURCE_ID) as mapboxgl.GeoJSONSource)
            .setData(pinsToGeoJSON(mapped));
        }

        // Only render pins if we're at a zoom level where they should be visible
        if (mapRef.current && mapRef.current.getZoom() >= HEATMAP_MAX_ZOOM) {
          renderPins(mapped);
        }

        console.log("Fetched outlets:", mapped.length, "outlets loaded");
      } catch (error) {
        console.error("Error fetching outlets:", error);
      }
    }, 300),
    [getBounds, filterPinsByBounds, renderPins]
  );

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

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      console.error("NEXT_PUBLIC_MAPBOX_TOKEN is not set");
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [-74.5, 40],
        zoom: 9,
        style: lightMode
          ? "mapbox://styles/hannahwiens/cmcjq7lyu003l01p6a93lhg38"
          : "mapbox://styles/hannahwiens/cmcj9t5wf000v01p6chg0e07a",
      });

      // Add heatmap source and layer
      mapRef.current.on("load", () => {
        if (!mapRef.current) return;

        // Add GeoJSON source for pins
        if (!mapRef.current.getSource(HEATMAP_SOURCE_ID)) {
          mapRef.current.addSource(HEATMAP_SOURCE_ID, {
            type: "geojson",
            data: pinsToGeoJSON(allPins),
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

        // Initial data fetch
        debouncedUpdatePinsFirebase();
      });

      // Add moveend and zoomend event listeners
      mapRef.current.on("moveend", debouncedUpdatePinsFirebase);
      mapRef.current.on("zoomend", debouncedUpdatePinsFirebase);

       // Toggle heatmap/marker visibility on zoom
      mapRef.current.on("zoom", () => {
        if (!mapRef.current) return;
        const zoom = mapRef.current.getZoom();
        const showHeatmap = zoom < 11; // fade heatmap out gradually 
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
        const land = isOnLand(lat, lng);
        if (!land) {
          console.log("Dropped point is in water — ignoring.");
          return; //  prevent pin drop
        }

        const el = document.createElement("div");
        el.innerHTML = `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
        el.style.cursor = "pointer";

        // Create a marker
        const marker = new mapboxgl.Marker(el)
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
      try {
        mapRef.current?.remove();
      } catch (err) {
        // Swallow Mapbox GL indoor manager bug in dev Strict Mode
        console.warn('Mapbox remove error (ignored):', err);
      }
      mapRef.current = null; // ensure we can recreate the map on remount (e.g. in React Strict Mode)
    };
  }, []);

  // Fetch outlets data from the backend and map to PinData shape
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

  useEffect(() => {
    if (!mapRef.current || currentStyleMode === lightMode) return;

    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();
    const currentBearing = mapRef.current.getBearing();
    const currentPitch = mapRef.current.getPitch();

    const newStyle = lightMode
      ? "mapbox://styles/hannahwiens/cmcjq7lyu003l01p6a93lhg38"
      : "mapbox://styles/hannahwiens/cmcj9t5wf000v01p6chg0e07a";

    mapRef.current.setStyle(newStyle);
    setCurrentStyleMode(lightMode);

    const onStyleLoad = () => {
      if (!mapRef.current) return;

      mapRef.current.jumpTo({
        center: currentCenter,
        zoom: currentZoom,
        bearing: currentBearing,
        pitch: currentPitch
      });

      mapRef.current.off('styledata', onStyleLoad);
    };

    mapRef.current.on('styledata', onStyleLoad);
  }, [lightMode, currentStyleMode]);

  return (
    <>
      <div
        style={{ width, height }}
        ref={mapContainerRef}
        className="map-container"
      />
      <div className="fixed top-22 left-10 backdrop-blur-lg bg-white/30 border border-white/60 rounded-2xl shadow-lg p-4 text-black">
        <p className="font-semibold text-sm">Viewport Info</p>
        <p className="text-xs">Visible Pins: {visiblePins.length}</p>
        <p className="text-xs">Total Pins: {allPins.length}</p>
        {currentBounds && (
          <>
            <p className="text-xs">
              SW: [{currentBounds.sw[0].toFixed(3)}, {currentBounds.sw[1].toFixed(3)}]
            </p>
            <p className="text-xs">
              NE: [{currentBounds.ne[0].toFixed(3)}, {currentBounds.ne[1].toFixed(3)}]
            </p>
          </>
        )}
      </div>
    </>
  );
};
export default MapBox;