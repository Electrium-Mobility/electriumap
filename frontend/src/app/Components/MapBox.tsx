"use client";

import React, { forwardRef, useImperativeHandle, useRef, useEffect,  useState, useCallback} from "react";
import { createRoot, Root } from "react-dom/client";
import { Navigation } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { debounce, Bounds, PinData, isPointInBounds } from "./utils";
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
const HEATMAP_MAX_ZOOM  = 11; // heatmap visible up to zoom 10

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
}

const MapBox = forwardRef<{
    handleGeoLocate: () => void
 }, MapBoxProps>(
  ({ width = "100vw", height = "100vh", onPinDrop, onPinClick, lightMode, flyTo, purgeTempPinsSignal, onCurrentLocation }, ref) => {
  // Store marker references outside useEffect
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
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
  // Live location tracking state
  const [isLocating, setIsLocating] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastFollowCenterRef = useRef<[number, number] | null>(null);
  const programmaticMoveRef = useRef(false);
  const isFollowingRef = useRef(isFollowing);
  const isLocatingRef = useRef(isLocating);

  // Cancel follow if user moves map further than this (meters)
  const FOLLOW_CANCEL_METERS = 50;

  // Simple haversine distance (meters) between two [lng, lat]
  const distanceMeters = (a: [number, number], b: [number, number]) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const [lng1, lat1] = a;
    const [lng2, lat2] = b;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lng2 - lng1);
    const rLat1 = toRad(lat1);
    const rLat2 = toRad(lat2);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(rLat1) * Math.cos(rLat2);
    const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
    return R * c;
  };
  const userMarkerRootRef = useRef<Root | null>(null);
  const userMarkerElRef = useRef<HTMLDivElement | null>(null);

  // Color for user pointer: black in light mode, white in dark mode
  const pointerColor = lightMode ? '#000000' /* black for light mode */ : '#ffffff' /* white for dark mode */;

  //gets current location for user centering
  useImperativeHandle(ref, () => ({
    handleGeoLocate,
    startFollowing,
    stopFollowing,
    toggleFollowing: () => {
      if (isLocatingRef.current) {
        stopFollowing();
      } else {
        handleGeoLocate();
        startFollowing();
      }
    },
    getIsLocating: () => !!isLocatingRef.current,
    getIsFollowing: () => !!isFollowingRef.current,
  }));

  //Drops pin at current location
  const dropPinAt = (lat: number, lng: number) => {
    const land = isOnLand(lng, lat);
    if (!land) {
      console.log("Dropped point is in water — ignoring.");
      return;
    }

    const el = document.createElement("div");
    el.innerHTML = `<img src="/images/pin_lightning.webp" style="width: 50px; height: 50px;" />`;
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
    setLoadingLocation(true);
    if (!navigator.geolocation) {
      setErrorMessage('Get current location not supported.');
      setLoadingLocation(false);
      return;
    }
    if (!mapRef.current) {
      console.log("Map not initialized yet");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        const fly = () => {
          console.log(`Flying to ${longitude} and ${latitude}`);
          if ( mapLoaded && mapRef.current) {
            try {
              programmaticMoveRef.current = true;
              mapRef.current?.flyTo({
                center: [longitude, latitude],
                zoom: 15,
                essential: true
              });
              mapRef.current.once('idle', () => { programmaticMoveRef.current = false; });
            } catch (e) {
              programmaticMoveRef.current = false;
            }
          }

          onCurrentLocation?.(latitude, longitude);
          mapRef.current?.once("idle", () => {
            // Place or update user marker
            placeOrUpdateUserMarker(latitude, longitude);
            dropPinAt(latitude, longitude);
            // start following by default when user clicks locate
            setIsFollowing(true);
            isFollowingRef.current = true;
            lastFollowCenterRef.current = [longitude, latitude];
          });
          setLoadingLocation(false);
        };

        // If style isn't loaded yet, waits for styledata event
        if (mapRef.current && mapRef.current?.isStyleLoaded()) {
          fly();
        } else if (mapRef.current) {
          console.log("Map style not loaded yet, waiting...");
          mapRef.current?.once("styledata", fly);
        }
      },
      //if retrival unsuccessful, displays error
      (error) => {
        setErrorMessage('Unable to retrieve your location.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Places or moves the user's navigation marker
  const placeOrUpdateUserMarker = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    // If marker already exists, update position and re-render the icon with current color
    if (userMarkerRef.current && userMarkerElRef.current && userMarkerRootRef.current) {
      userMarkerRef.current.setLngLat([lng, lat]);
      try {
        userMarkerRootRef.current.render(
          <Navigation color={pointerColor} size={36} />
        );
      } catch (e) {
        console.warn("Failed to re-render user marker icon:", e);
      }
      return;
    }

    // Create element and mount the lucide icon into it
    const el = document.createElement("div");
    el.style.transform = "translate(-50%, -50%)";
    el.style.cursor = "default";

    // Render React icon into the DOM node
    try {
      const root = createRoot(el);
      root.render(<Navigation color={pointerColor} size={36} />);
      userMarkerRootRef.current = root;
      userMarkerElRef.current = el;
    } catch (e) {
      // Fallback to simple innerHTML if createRoot isn't available
      el.innerHTML = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"36\" height=\"36\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"${pointerColor}\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M21 3 11 13\"/><path d=\"M21 3 14 21 11 13 3 10 21 3z\"/></svg>`;
      userMarkerElRef.current = el;
    }

    userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(mapRef.current);
  };

  // Start watching the user's location and optionally follow
  const startFollowing = () => {
    if (!navigator.geolocation || !mapRef.current) {
      setErrorMessage("Geolocation not available");
      return;
    }

    setIsLocating(true);
    setIsFollowing(true);
    // keep refs in sync immediately
    isLocatingRef.current = true;
    isFollowingRef.current = true;

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeOrUpdateUserMarker(latitude, longitude);
        onCurrentLocation?.(latitude, longitude);
        // update last-follow center
        lastFollowCenterRef.current = [longitude, latitude];

        if (isFollowingRef.current && mapRef.current) {
          try {
            programmaticMoveRef.current = true;
            mapRef.current.easeTo({ center: [longitude, latitude], zoom: 16, duration: 500 });
            mapRef.current.once('idle', () => {
              programmaticMoveRef.current = false;
            });
          } catch (e) {
            programmaticMoveRef.current = false;
          }
        }
      },
      (err) => {
        setErrorMessage("Unable to retrieve live location.");
        console.error(err);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    );

    watchIdRef.current = id as unknown as number;
  };

  const stopFollowing = () => {
    setIsLocating(false);
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) {
        try { userMarkerRef.current.remove(); } catch (e) {}
        userMarkerRef.current = null;
      }
      if (userMarkerRootRef.current) {
        try { userMarkerRootRef.current.unmount(); } catch (e) {}
        userMarkerRootRef.current = null;
      }
      userMarkerElRef.current = null;
    };
  }, []);

  // Update existing user marker color when pointerColor (theme) changes
  useEffect(() => {
    // Prefer re-rendering via react root when available
    if (userMarkerRootRef.current) {
      try {
        userMarkerRootRef.current.render(<Navigation color={pointerColor} size={36} />);
        return;
      } catch (e) {
        console.warn('Failed to update user marker via root render', e);
      }
    }

    // Fallback: update the element innerHTML directly
    if (userMarkerElRef.current) {
      try {
        userMarkerElRef.current.innerHTML = `\n<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"36\\" height=\\"36\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"${pointerColor}\\" stroke-width=\\"1.5\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\">\n  <path d=\\"M21 3 11 13\\"/>\n  <path d=\\"M21 3 14 21 11 13 3 10 21 3z\\"/>\n</svg>`;
      } catch (e) {
        // ignore
      }
    }
  }, [pointerColor]);


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


  // Effect to handle flying to searched location
  useEffect(() => {
    console.log("Flying to searched location")
    if (flyTo && mapLoaded && mapRef.current) {
      try {
        programmaticMoveRef.current = true;
        mapRef.current.flyTo({
          center: [flyTo.lng, flyTo.lat],
          zoom: 14,
          essential: true
        });
        mapRef.current.once('idle', () => { programmaticMoveRef.current = false; });
      } catch (e) {
        programmaticMoveRef.current = false;
      }
    }
  }, [flyTo, mapLoaded]);

  // Fetch outlets data from the backend
  useEffect(() => {
    fetch("/api/outlets")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const mapped: PinData[] = data
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
        const showHeatmap = zoom < HEATMAP_MAX_ZOOM;

        if (map.getLayer(HEATMAP_LAYER_ID)) {
          map.setLayoutProperty(HEATMAP_LAYER_ID, "visibility", showHeatmap ? "visible" : "none");
        }

        if (showHeatmap) {
          clearAllMarkers();
        } else {
          const bounds = getBounds();
          if (bounds) {
            const pinsInView = filterPinsByBounds(bounds);
            renderPins(pinsInView);
          }
        }
        });

      // Cancel follow if user moves the map manually beyond threshold
      map.on('moveend', () => {
        if (programmaticMoveRef.current) return; // ignore programmatic moves
        if (!isFollowingRef.current) return;
        if (!mapRef.current) return;

        const center = mapRef.current.getCenter();
        const centerArr: [number, number] = [center.lng, center.lat];
        if (lastFollowCenterRef.current) {
          const dist = distanceMeters(lastFollowCenterRef.current, centerArr);
          if (dist > FOLLOW_CANCEL_METERS) {
            // user moved map — stop following
            setIsFollowing(false);
            isFollowingRef.current = false;
          }
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
  }
);
MapBox.displayName = "MapBox";

export default MapBox;
