'use client';

import { useState} from 'react';
import MapBox from './Components/MapBox';
import Overlay from './Components/Overlay';

export default function Home() {
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  //displays last coordinates on pin drop overlay
  const [coords, setCoords] = useState<{lng: number; lat: number} | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<{lng: number; lat: number} | null>(null);

  const handleSearchSelect = (lng: number, lat: number) => {
    setFlyToLocation({ lng, lat });
  };
  const [lightMode, setLightMode] = useState(false);

  return (
    <div className="relative w-full h-screen">
      <MapBox 
        onPinDrop={(lat, lng) => {
          setCoords({ lat, lng });
          setShowPinOverlay(true);
        }}
        lightMode={lightMode}
        flyTo={flyToLocation}
      />
      <Overlay 
        showPinOverlay={showPinOverlay}
        coords={coords}
        onClose={() => setShowPinOverlay(false)}
        onSearchSelect={handleSearchSelect}
        lightMode={lightMode}
        setLightMode={setLightMode}
      />
    </div>
  );
}