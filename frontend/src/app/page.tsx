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


  const mapRef = useRef<{ handleGeoLocate: () => void }>(null);

  const handleSearchSelect = (lng: number, lat: number) => {
    setSearchCoords({lng, lat});
    setFlyToLocation({ lng, lat });
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
          setCoords(null);
          setSelectedPin(pin);
        }}
        onCurrentLocation={(lat, lng) => {
          setCoords({ lat, lng });
          setSearchCoords({lng, lat});
          setShowPinOverlay(true);
        }}
        lightMode={lightMode}
        purgeTempPinsSignal={purgeTempSignal}
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
      />
    </div>
  );
}
