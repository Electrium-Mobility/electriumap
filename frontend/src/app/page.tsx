'use client';

import { useRef, useState } from 'react';
import MapBox from './Components/MapBox';
import { PinData } from './Components/utils';
import Overlay from './Components/Overlay';

export default function Home() {
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [lightMode, setLightMode] = useState(false);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [purgeTempSignal, setPurgeTempSignal] = useState(0);
  const [searchCoords, setSearchCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [selectedPortTypes, setSelectedPortTypes] = useState<string[]>([]);
  const [isLocatingToggle, setIsLocatingToggle] = useState(false);


  const mapRef = useRef<any>(null);

  const handleSearchSelect = (lng: number, lat: number) => {
    setSearchCoords({lng, lat});
    setFlyToLocation({ lng, lat });
  };

  const handlePortTypeFilterChange = (portTypes: string[]) => {
    setSelectedPortTypes(portTypes);
  };

  return (
    <div className="relative w-full h-screen">
      <MapBox
        ref={mapRef}
        flyTo={flyToLocation}
        onPinDrop={(lat, lng) => {
          setCoords({ lat, lng });
          setSelectedPin(null);
          setShowPinOverlay(true);
        }}
        onPinClick={(pin) => {
          setPurgeTempSignal(Date.now());
          setSelectedPin(pin);
          setCoords({ lat: pin.lat, lng: pin.lng });
          setShowPinOverlay(true);
        }}
        onCurrentLocation={(lat, lng) => {
          setCoords({ lat, lng });
          setSearchCoords({lng, lat});
          setShowPinOverlay(true);
        }}
        onStartFollow={() => setIsLocatingToggle(true)}
        onStopFollow={() => setIsLocatingToggle(false)}
        onMapLoad={() => {
          // Auto-locate once on first page load (acts like pressing the locate button)
          try {
            mapRef.current?.handleGeoLocate?.();
            mapRef.current?.startFollowing?.();
          } catch (e) {
            /* ignore */
          }
        }}
        lightMode={lightMode}
        purgeTempPinsSignal={purgeTempSignal}
        selectedPortTypes={selectedPortTypes}
      />

      <Overlay
        showPinOverlay={showPinOverlay}
        coords={coords}
        searchCoords={searchCoords}
        selectedPin={selectedPin}
        onClose={() => {
          setShowPinOverlay(false);
          setSelectedPin(null);
        }}
        onSearchSelect={handleSearchSelect}
        lightMode={lightMode}
        setLightMode={setLightMode}
        onCancelTempPin={() => setPurgeTempSignal(Date.now())}
        onGeoLocateClick={() => mapRef.current?.handleGeoLocate()}
        onStartFollow={() => { mapRef.current?.startFollowing?.(); }}
        onStopFollow={() => { mapRef.current?.stopFollowing?.(); }}
        isLocatingToggle={isLocatingToggle}
        setIsLocatingToggle={setIsLocatingToggle}
        selectedPortTypes={selectedPortTypes}
        onPortTypeFilterChange={handlePortTypeFilterChange}
      />
    </div>
  );
}
