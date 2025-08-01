'use client';

import { useState} from 'react';
import MapBox from './Components/MapBox';
import { PinData } from './Components/utils';
import Overlay from './Components/Overlay';


export default function Home() {
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  //displays last coordinates on pin drop overlay
  const [coords, setCoords] = useState<{lng: number; lat: number} | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{lng: number; lat: number} | null>(null);
  const handleSearchSelect = (lng: number, lat: number) => {
    setFlyToLocation({ lng, lat });
  };
    const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [lightMode, setLightMode] = useState(false);
  const [purgeTempSignal, setPurgeTempSignal] = useState(0);

  return (
    <div className="relative w-full h-screen">
      <MapBox 
        onPinDrop={(lat, lng) => {
          setCoords({ lat, lng });
          // Clear any previously selected pin so we open the Add-Outlet popup instead of the
          // read-only pin details card.
          setSelectedPin(null);
          // Ensure the deprecated dropped-pin overlay stays hidden.
          setShowPinOverlay(false);
        }}
        onPinClick={(pin) => {
          // Remove any temporary pin and close the Add-Outlet form
          setPurgeTempSignal(Date.now());
          setCoords(null);
          setSelectedPin(pin);
        }}
        onCurrentLocation={(lat, lng) => {
          setCoords({ lat, lng});
        }}
        lightMode={lightMode}
        purgeTempPinsSignal={purgeTempSignal}
      />
      <Overlay 
        showPinOverlay={showPinOverlay}
        coords={coords}
        selectedPin={selectedPin}
        onClose={() => {
          setShowPinOverlay(false);
          setSelectedPin(null);
        }}
        onSearchSelect={handleSearchSelect}
        lightMode={lightMode}
        setLightMode={setLightMode}
        onCancelTempPin={() => setPurgeTempSignal(Date.now())}
      />
    </div>
  );
}