"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect,  useState, useCallback} from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { debounce, Bounds, PinData, isPointInBounds, calculateBoundsForRadius } from "./utils";
import pinsData from "./pins.json";            // fallback sample pins – replaced when Firestore loads
import { isOnLand } from "../utils/addOutlet";

import type { Feature, FeatureCollection, Point } from "geojson";

// Convert plain pins to a GeoJSON FeatureCollection
const pinsToGeoJSON = (pins: PinData[]): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: pins.map<Feature<Point>>((pin) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [pin.lng, pin.lat] },
    properties: {},
  })),
});

const HEATMAP_SOURCE_ID = "pins-heatmap-source";
const HEATMAP_LAYER_ID  = "pins-heatmap-layer";
const HEATMAP_MAX_ZOOM  = 9; // heatmap visible up to zoom 9

// Helper function to map API data to PinData format
const mapApiDataToPins = (data: any[]): PinData[] => {
  return data
    .filter((d: any) => typeof d.latitude === "number" && typeof d.longitude === "number")
    .map((d: any, idx: number) => ({
      id: d.id ?? String(idx),
      lat: d.latitude,
      lng: d.longitude,
      title: d.locationName ?? "Outlet",
      description: d.description ?? "",
      category: d.chargerType ?? "",
      fromDb: true,
    }));
};

// Helper function to create marker element HTML
const createMarkerElement = (): string => {
  return `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
};

// Helper function to merge new pins with existing pins, avoiding duplicates
const mergePinsWithoutDuplicates = (existingPins: PinData[], newPins: PinData[]): PinData[] => {
  const existingIds = new Set(existingPins.map(p => p.id));
  const uniqueNewPins = newPins.filter(p => !existingIds.has(p.id));
  return [...existingPins, ...uniqueNewPins];
};

const PINDROP_MIN_ZOOM = 14;

interface MapBoxProps {
  width?: string;
  height?: string;
  onPinDrop?: (lat: number, lng: number) => void;
  /** Called when an existing map pin is clicked */
  onPinClick?: (pin: PinData) => void;
  lightMode?: boolean;
  onMapLoad?: () => void;
  flyTo?: { lng: number; lat: number } | null;
  /** Signal to purge temporary pins (increments every cancel) */
  purgeTempPinsSignal?: number;
  onCurrentLocation?: (lat: number, lng: number) => void;
  selectedPortTypes?: string[];
}

const MapBox = forwardRef<{
    handleGeoLocate: () => void
 }, MapBoxProps>(
  ({ width = "100vw", height = "100vh", onPinDrop, onPinClick, lightMode, flyTo, purgeTempPinsSignal, onCurrentLocation, selectedPortTypes = [] }, ref) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const debouncedUpdatePinsRef = useRef<(() => void) | null>(null); //ref to store debouncedUpdatePins func to access flyTo effect
  // Store current bounds and visible pins
  const [currentBounds, setCurrentBounds] = useState<Bounds | null>(null);
  const [visiblePins, setVisiblePins] = useState<PinData[]>([]);
  // All pins available to render (starts with sample data, replaced by Firestore)
  const [allPins, setAllPins] = useState<PinData[]>(
    pinsData.map((p: any) => ({ ...p, fromDb: false }))
  );
  //error message when failing to get current users position
  const [errorMessage, setErrorMessage] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  //gets current location for user centering
  useImperativeHandle(ref, () => ({
    handleGeoLocate
  }));
  
  //Drops pin at current location 
  const dropPinAt = (lat: number, lng: number) => {
    const land = isOnLand(lng, lat);
    if (!land) {
      console.log("Dropped point is in water — ignoring.");
      return;
    }

    const el = document.createElement("div");
    el.innerHTML = createMarkerElement();
    el.style.cursor = "pointer";

    const marker = new mapboxgl.Marker(el)
      .setLngLat([lng, lat])
      .addTo(mapRef.current!);

    markersRef.current.push(marker);

    marker.getElement().addEventListener("click", function (ev) {
      ev.stopPropagation(); // Prevent map click event
      marker.remove();
      markersRef.current = markersRef.current.filter((m) => m !== marker);
    });

    console.log("Dropped pin at:", { lng, lat });
    onPinDrop?.(lat, lng);
  };

  //flys to current location and drops pin
  const handleGeoLocate = () => {
    setErrorMessage('');
    
    if (!navigator.geolocation) {
      setErrorMessage('Get current location not supported.');
      return;
    }
    if (!mapRef.current) {
      console.log("Map not initialized yet");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const fly = () => {
          console.log(`Flying to ${longitude} and ${latitude}`);
          if ( mapLoaded && mapRef.current) {
            mapRef.current?.flyTo({
              center: [longitude, latitude],
              zoom: 15,
              essential: true
          });
          }
          
          onCurrentLocation?.(latitude, longitude);

          mapRef.current?.once("idle", () => {
            dropPinAt(latitude, longitude);
          });
        };

        // If style isn’t loaded yet, waits for styledata event
        if (mapRef.current?.isStyleLoaded()) {
          fly();
        } else {
          console.log("Map style not loaded yet, waiting...");
          mapRef.current?.once("styledata", fly);
        }
      },
      //if retrival unsuccessful, displays error
      (error) => {
        setErrorMessage('Unable to retrieve your location.');
      },
      { enableHighAccuracy: true }
    );
  };


  // Remove any temporary pins that were added by a map click but later cancelled
  useEffect(() => {
    if (!purgeTempPinsSignal) return;

    // Filter out temporary pins from state
    setAllPins((prev) => prev.filter((p) => !p.id.startsWith("temp-")));

    // Also remove associated marker elements
    markersRef.current.forEach((marker) => {
      const el = marker.getElement();
      if (el?.dataset?.tempId === "true") {
        marker.remove();
      }
    });
    // Clean ref array of removed markers
    markersRef.current = markersRef.current.filter((m) => {
      const el = m.getElement();
      return el?.dataset?.tempId !== "true";
    });
  }, [purgeTempPinsSignal]);

    // Fetch outlets data from the backend
  useEffect(() => {
    fetch("/api/outlets")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const mapped = mapApiDataToPins(data);

        if (mapped.length) {
          setAllPins(mapped);
        }
        console.log("Fetched outlets:", mapped);
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
    return allPins.filter((pin) => isPointInBounds(pin, bounds));
  }, [allPins]);

// Function to check if a pin matches the selected port filters
  const matchesPortFilters = useCallback((pin: PinData): boolean => {
    // If no filters selected, show all pins
    if (selectedPortTypes.length === 0) return true;
    
    // Check if pin's category matches any selected port type
    const portType = pin.category?.trim();
    return portType ? selectedPortTypes.includes(portType) : false;
  }, [selectedPortTypes]);

  // Function to filter pins by port type
  const filterPinsByPortType = useCallback((pins: PinData[]): PinData[] => {
    return pins.filter(matchesPortFilters);
  }, [matchesPortFilters]);

  //function to fetch outlets from backend by bounds (returns pins without updating state)
  const fetchOutletsByBounds = useCallback(async (bounds: Bounds): Promise<PinData[]> => {
    try {
      setIsLoadingPins(true);
      
      // Validate bounds to prevent invalid API calls
      const { sw, ne } = bounds;
      if (!isFinite(sw[0]) || !isFinite(sw[1]) || !isFinite(ne[0]) || !isFinite(ne[1])) {
        console.warn("Invalid bounds provided to fetchOutletsByBounds:", bounds);
        return [];
      }
      
      const url = `/api/outlets?swLat=${bounds.sw[1]}&swLng=${bounds.sw[0]}&neLat=${bounds.ne[1]}&neLng=${bounds.ne[0]}`;
      
      const response = await fetch(url);
      
      // Check if response is ok before parsing
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        return [];
      }
      
      const data = await response.json();
      
      // Check if response contains an error
      if (data?.error) {
        console.error("API returned error:", data.error);
        return [];
      }
      
      if (!Array.isArray(data)) {
        console.warn("API response is not an array:", data);
        return [];
      }
      
      const mapped = mapApiDataToPins(data);
      
      console.log("Fetched outlets for bounds:", mapped);
      return mapped;
    } catch (error) {
      console.error("Error fetching outlets by bounds:", error);
      // Log more details about the error
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.error("Network error: Check if the Next.js dev server is running and the API route is accessible");
      }
      return [];
    } finally {
      setIsLoadingPins(false);
    }
  }, []);

  // Effect to handle flying to searched location
  useEffect(() => {
    if (flyTo && mapLoaded && mapRef.current) {
      console.log("Flying to searched location:", flyTo);
      
      // Calculate bounds for 10km radius around search location
      const searchBounds = calculateBoundsForRadius(flyTo.lat, flyTo.lng, 10);
      console.log("Fetching pins within 10km of search location");
      
      // Fetch all pins within 10km radius before flying
      fetchOutletsByBounds(searchBounds).then((fetchedPins) => {
        console.log(`Fetched ${fetchedPins.length} pins within 10km of search location`);
        
        // Update allPins with fetched pins
        setAllPins((prev) => mergePinsWithoutDuplicates(prev, fetchedPins));
      });
      
      mapRef.current.flyTo({
        center: [flyTo.lng, flyTo.lat],
        zoom: 14,
        essential: true
      });

      //update pins for new viewport after fly animation
      mapRef.current.once("moveend", () => { //only fires once per search, not on next drags
        console.log("Fly completed, updating pins for search location");
        if (debouncedUpdatePinsRef.current) {
          debouncedUpdatePinsRef.current();
        }
      });
    }
  }, [flyTo, mapLoaded, fetchOutletsByBounds]);

  // Function to clear all markers
  const clearAllMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  }, []);

  // Function to render pins
  const renderPins = useCallback((pins: PinData[]) => {
    if (!mapRef.current) return;

    clearAllMarkers();

    pins.forEach((pin) => {
      const finalHtml = (() => {
        const desc = pin.description?.trim();
        const cat = pin.category?.trim();

        if (pin.fromDb && !desc && !cat) {
          return `<div>
            <h3 style="margin:0;font-weight:600;">${pin.title}</h3>
            <p style="margin:4px 0;color:#666;">No information found.</p>
          </div>`;
        }

        return `<div>
          <h3 style="margin:0;font-weight:600;">${pin.title}</h3>
          ${desc ? `<p style="margin:4px 0;">${desc}</p>` : ""}
          ${cat ? `<p style="margin:4px 0;color:#666;">${cat}</p>` : ""}
        </div>`;
      })();

      const el = document.createElement("div");
      el.innerHTML = `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
      el.style.cursor = "pointer";
      
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(finalHtml);

      // Use custom element for the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      //handle clicks on the custom element
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onPinClick?.(pin);
      });
      
      markersRef.current.push(marker);
    });
  }, [clearAllMarkers, onPinClick]);

  // Debounced function to update visible pins
  const debouncedUpdatePins = useCallback(
    debounce(async () => {
      if (!mapRef.current) return;
      const zoom = mapRef.current.getZoom();
      const bounds = getBounds();
      if (!bounds) return;

      setCurrentBounds(bounds);
      
      //fetch extra pins from backend for current bounds/new regions first
      const fetchedPins = await fetchOutletsByBounds(bounds);
      
      // Get current allPins state and merge with newly fetched pins
      setAllPins((prev) => {
        const updatedPins = mergePinsWithoutDuplicates(prev, fetchedPins);
        
        // Filter pins that are in the current viewport bounds
        const pinsInBounds = updatedPins.filter((pin) => isPointInBounds(pin, bounds));
        const filteredPins = filterPinsByPortType(pinsInBounds);
        setVisiblePins(filteredPins);

        if (zoom > HEATMAP_MAX_ZOOM) {
          renderPins(filteredPins);
        } else {
          clearAllMarkers(); // Ensure pins are hidden when heatmap is visible
        }
        
        return updatedPins;
      });
    }, 300), // 300ms debounce
    [getBounds, renderPins, clearAllMarkers, fetchOutletsByBounds, filterPinsByPortType]
  );

  //update ref when debouncedUpdatePins changes
  useEffect(() => {
    debouncedUpdatePinsRef.current = debouncedUpdatePins;
  }, [debouncedUpdatePins]);

  // Auto-updates the heatmap layer when filters change
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    
    const map = mapRef.current;
    const source = map.getSource(HEATMAP_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;
    
    // Filter pins that match the port type filters
    const pinsForHeatmap = allPins.filter(matchesPortFilters);
    
    // Fallback to pinsData if no pins available
    const dataToShow = pinsForHeatmap.length > 0 ? pinsForHeatmap : 
                       allPins.length > 0 ? allPins : 
                       pinsData;
    
    source.setData(pinsToGeoJSON(dataToShow));
    console.log(`🗺️ Heatmap updated: ${dataToShow.length} pins (${selectedPortTypes.length} filters active)`);
    
    // Also update visible markers if we're zoomed in
    const zoom = map.getZoom();
    if (zoom > HEATMAP_MAX_ZOOM) {
      const bounds = getBounds();
      if (bounds) {
        const pinsInBounds = allPins.filter((pin) => isPointInBounds(pin, bounds));
        const visibleFilteredPins = pinsInBounds.filter(matchesPortFilters);
        renderPins(visibleFilteredPins);
      }
    }
  }, [allPins, matchesPortFilters, mapLoaded, getBounds, renderPins, selectedPortTypes]);
  

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: flyTo ? [flyTo.lng, flyTo.lat] : [-74.5, 40],
      zoom: 9,
      style: "mapbox://styles/hannahwiens/cmcj9t5wf000v01p6chg0e07a",
    });

    const map = mapRef.current;

    // Track temp markers separately
    const tempMarkersRef = { current: [] as mapboxgl.Marker[] };

    map.on("load", () => {
      setMapLoaded(true);

      // Add heatmap source and layer
      if (!map.getSource(HEATMAP_SOURCE_ID)) {
        map.addSource(HEATMAP_SOURCE_ID, {
          type: "geojson",
          data: pinsToGeoJSON(pinsData),
          cluster : false
        });
      }

      if (!map.getLayer(HEATMAP_LAYER_ID)) {
        map.addLayer({
          id: HEATMAP_LAYER_ID,
          type: "heatmap",
          source: HEATMAP_SOURCE_ID,
          maxzoom: HEATMAP_MAX_ZOOM,
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 5,1.5, 9, 2, 11, 3],
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
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 1, 2, 4, 3, 8, 4, 12],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0.8, 10, 0.5, 11, 0]
          },
        });
      }

      // Initial rendering of persistent pins
      const initialBounds = getBounds();
      if (initialBounds) {
        const initialPins = filterPinsByBounds(initialBounds);
        setCurrentBounds(initialBounds);
        setVisiblePins(initialPins);
        renderPins(initialPins);
      }

      // Zoom/heatmap toggle
      map.on("zoom", () => {
        const zoom = map.getZoom();
        console.log(zoom)
        const showHeatmap = zoom < HEATMAP_MAX_ZOOM;

        if (map.getLayer(HEATMAP_LAYER_ID)) {
          map.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", showHeatmap ? "visible" : "none");
        }

        if (showHeatmap) {
          clearAllMarkers();
        } else {
          // Use debouncedUpdatePins to ensure we have the latest pins
          if (debouncedUpdatePinsRef.current) {
            debouncedUpdatePinsRef.current();
          }
        }
        });

      //update pins when map is dragged
      map.on("moveend", () => {
        if (debouncedUpdatePinsRef.current) {
          debouncedUpdatePinsRef.current();
        }
      });

      // Click to drop a temporary pin
      map.on("click", (e: mapboxgl.MapMouseEvent) => {
        const targetEl = (e.originalEvent as MouseEvent).target as HTMLElement | null;
        if (targetEl && targetEl.closest(".mapboxgl-marker")) return;

        const { lng, lat } = e.lngLat;
        if (!isOnLand(lng, lat)) return;

        const zoom = map.getZoom();

        map.flyTo({ center: [lng, lat], zoom: PINDROP_MIN_ZOOM, essential: true });

        const dropPins = zoom > PINDROP_MIN_ZOOM;
        console.log(dropPins);
        if (zoom < PINDROP_MIN_ZOOM) return;

        // Remove previous temp markers
        tempMarkersRef.current.forEach((m) => m.remove());
        tempMarkersRef.current = [];

        // Create new temp pin
        let tempPin: PinData;
        tempPin = {
          id: `temp-${Date.now()}`,
          lat,
          lng,
          title: "New Outlet",
          description: "",
          category: "",
          fromDb: false,
        };
        setAllPins((prev) => [...prev.filter((p) => !p.id.startsWith("temp-")), tempPin]);
        
        // Marker element
        const el = document.createElement("div");
        el.innerHTML = `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
        el.style.cursor = "pointer";
        
        const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]).addTo(map);
        tempMarkersRef.current.push(marker);
        
        // Click to remove temp pin
        marker.getElement().addEventListener("click", (ev) => {
          ev.stopPropagation();
          marker.remove();
          tempMarkersRef.current = tempMarkersRef.current.filter((m) => m !== marker);
          setAllPins((pins) => pins.filter((p) => p !== tempPin));
        });
          
        onPinDrop?.(lat, lng);
      });
    });

    return () => {
      clearAllMarkers();
      try {
        map.remove();
      } catch (err) {
        console.warn("Mapbox remove error (ignored):", err);
      }
      mapRef.current = null;
    };
  }, []);

  //toggles map from dark to light
  useEffect(() => {
    if (!mapRef.current) return;

    const newStyle = lightMode
      ? "mapbox://styles/hannahwiens/cmcjq7lyu003l01p6a93lhg38"
      : "mapbox://styles/hannahwiens/cmcj9t5wf000v01p6chg0e07a";

    mapRef.current.setStyle(newStyle);

    //Readding heatmap after setting newStyle
    mapRef.current.once('style.load', () => {
      if (!mapRef.current) return;

    if (!mapRef.current.getSource(HEATMAP_SOURCE_ID)) {
      mapRef.current.addSource(HEATMAP_SOURCE_ID, {
        type: "geojson",
        data: pinsToGeoJSON(pinsData), 
        cluster: false
      });
    }

    if (!mapRef.current.getLayer(HEATMAP_LAYER_ID)) {
        mapRef.current.addLayer({
          id: HEATMAP_LAYER_ID,
          type: "heatmap",
          source: HEATMAP_SOURCE_ID,
          maxzoom: HEATMAP_MAX_ZOOM,
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 3, 1.2, 5, 1.5, 7, 1.8, 9, 2,],
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
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 1, 1, 2, 2, 3, 4, 4, 6, 5, 8, 6, 12, 7, 16, 8, 18, 9, 20],
            "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 1, 9, 0.8, 10, 0.5, 11, 0]
          },
        });
      }

    const zoom = mapRef.current.getZoom();
    if (zoom >= HEATMAP_MAX_ZOOM) {
      const bounds = getBounds();
      if (bounds) {
        const pinsInView = filterPinsByBounds(bounds);
        renderPins(pinsInView);
      }
    }
  });
  }, [lightMode]);
  

  return (
    <>
      <div
        style={{ width, height }}
        ref={mapContainerRef}
        className="map-container"
      />

      {errorMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '10px 16px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            zIndex: 10000,
          }}
        >
          {errorMessage}
        </div>
      )}
    </>
    );
  }
);
MapBox.displayName = "MapBox";

export default MapBox;

