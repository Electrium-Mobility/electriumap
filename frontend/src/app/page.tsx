'use client';

import { useState } from 'react';
import MapBox from './Components/MapBox';
import AddOutlet from './Components/AddOutlet';

export default function Home() {
  const [showOverlay, setShowOverlay] = useState(false);
    //displays last coordinates on pin drop overlay
  const [coords, setCoords] = useState<{lng: number; lat: number} | null>(null);

  return (
    <div className="relative w-full h-screen">
      <MapBox 
        onPinDrop={(lat, lng) => {
          setCoords({ lat, lng });
          setShowOverlay(true);
        }}
      />
      <AddOutlet 
        showOverlay={showOverlay}
        coords={coords}
        onClose={() => setShowOverlay(false)}
      />
    </div>
  );
}