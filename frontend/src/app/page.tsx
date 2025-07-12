'use client';

import { useState, useEffect } from 'react';
import MapBox from './Components/MapBox';
import Overlay from './Components/Overlay';

// Load performance testing suite
import './utils/runPerformanceTest';

export default function Home() {
  const [showPinOverlay, setShowPinOverlay] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  //displays last coordinates on pin drop overlay
  const [coords, setCoords] = useState<{lng: number; lat: number} | null>(null);

  // Show dev panel in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setShowDevPanel(true);
    }
  }, []);

  return (
    <div className="relative w-full h-screen">
      <MapBox 
        onPinDrop={(lat, lng) => {
          setCoords({ lat, lng });
          setShowPinOverlay(true);
        }}
      />
      <Overlay 
        showPinOverlay={showPinOverlay}
        coords={coords}
        onClose={() => setShowPinOverlay(false)}
      />
      
      {/* Development Performance Testing Panel */}
      {showDevPanel && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">🚀 Performance Testing</span>
            <button 
              onClick={() => setShowDevPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="text-gray-300">
            <p>Open browser console and run:</p>
            <div className="mt-1 space-y-1">
              <code className="block bg-gray-800 p-1 rounded">spatialPerformance.runQuickTest()</code>
              <code className="block bg-gray-800 p-1 rounded">spatialPerformance.testCaching()</code>
              <code className="block bg-gray-800 p-1 rounded">spatialPerformance.runFullBenchmark()</code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}