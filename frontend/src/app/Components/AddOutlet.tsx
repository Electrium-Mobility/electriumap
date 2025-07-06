'use client';

import React, {useState, useEffect} from 'react';

interface AddOutletProps {
  showOverlay: boolean;
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}

const portOptions = ["Triple Peg", "Double Peg", "USB", "HDMI"];
const conditionOptions = ["New", "Worn", "Slightly Damaged", "Damaged"];

const AddOutlet: React.FC<AddOutletProps> = ({showOverlay, coords, onClose }) => {
    const [showAddOutlet, setShowAddOutlet] = useState(false);
    const [address, setAddress] = useState("");
    const [powerType, setPowerType] = useState("");
    const [selectedPort, setSelectedPort] = useState("Triple Peg");
    const [selectedCondition, setSelectedCondition] = useState("New");
    const [extraDetails, setExtraDetails] = useState("");

    //if coordinates exist, will fill them in for address
    useEffect(() =>{
      if (coords) {
        setAddress(`${coords?.lng.toFixed(5)} ${coords?.lat.toFixed(5)}`);
      }
    }, [coords]);

    return (
      <div>
        <button
        onClick={() => setShowAddOutlet(prev => !prev)} //toggles overlay on and off
        className="fixed top-5 right-30 z-50 backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-4xl font-semibold text-xs text-lime-600 px-6.5 py-2.5 shadow-lg flex items-center justify-center text-center">
          <div>
            <img
                src="/images/add.png"
                alt="Upload"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] w-9 h-9"
              />
          </div>
          <div>
            <h2 className="pt-8">
              Add Outlet
            </h2>
          </div>
        </button>

        {showAddOutlet && (
          <div className="fixed top-[110px] right-6 z-50 p-6 backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col">
            <div className="flex-grow">
              <h2 className="font-semibold text-lg text-white pb-1 pt-0 p-1 pl-0">
                Address <span className="text-red-500">*</span>
              </h2>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1 pb-1">
              </input>
              <div className="flex items-center space-x-2">
                <h2 className="font-semibold text-lg text-white p-1 pb-1 pt-2 pr-1 pl-0">
                  Number of Outlets <span className="text-red-500">*</span>
                </h2>
                <select className="bg-white/35 w-8 h-7 pl-0 rounded-md text-lg text-white">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>{num}</option>
                  )
                  )}
                </select>
              </div>


              <h2 className="font-semibold text-lg text-white p-1 pb-1 pt-0 pl-0">
                Power Type
              </h2>
              <input
                type="text"
                value={powerType}
                onChange={(e) => setPowerType(e.target.value)}
                className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1">
              </input>
              <div className="flex w-full">
                <div className="w-1/2">
                  <h2 className="font-semibold text-lg text-white p-1 pb-0 pl-0">
                    Port Type
                  </h2>
                  {portOptions.map((option) => (
                    <div
                      key={option}
                      className="flex items-center mb-0.5 cursor-pointer text-md"
                      onClick={() => setSelectedPort(option)}
                    >
                      <div
                        className={`w-5 h-5 mr-2 flex items-center justify-center rounded-md ${
                          selectedPort === option ? "bg-white/35" : "bg-white/50"
                        }`}
                      >
                        {selectedPort === option && (
                          <span className="text-lime-500 text-md">✔</span>
                        )}
                      </div>
                      <span className="text-md">{option}</span>
                    </div>
                  ))}
                </div>
                <div className="w-1/2">
                  <h2 className="font-semibold text-lg text-white p-1 pb-0 pl-0">
                    Condition
                  </h2>
                  {conditionOptions.map((option) => (
                    <div
                      key={option}
                      className="flex items-center mb-0.5 cursor-pointer text-md"
                      onClick={() => setSelectedCondition(option)}
                    >
                      <div
                        className={`w-5 h-5 mr-2 flex items-center justify-center rounded-sm ${
                          selectedCondition === option ? "bg-white/35" : "bg-white/50"
                        }`}
                      >
                        {selectedCondition === option && (
                          <span className="text-lime-500 text-md">✔</span>
                        )}
                      </div>
                      <span className="text-md">{option}</span>
                    </div>
                  ))}
                </div>

              </div>
              <h2 className="font-semibold text-lg text-white p-1 pb-0 pl-0">
                Extra Details
              </h2>
              <input
                type="text"
                value={extraDetails}
                onChange={(e) => setExtraDetails(e.target.value)}
                className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1">
              </input>
            </div>
            <div className="relative p-7 mt-4 w-full flex-grow flex-shrink min-h-[80px] max-h-[25vh] overflow-hidden backdrop-blur-sm bg-white/10 border-2 border-dotted border-white rounded-2xl shadow-lg flex items-center justify-center text-center">

              <div>
                <img
                  src="/images/upload.png"
                  alt="Upload"
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] w-12 h-12"
                />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-white/40 p-4 pt-14">
                  Choose a file or drag it in here.
                </h2>
              </div>
            </div>
            <div className="flex justify-end w-full">

                <button
                  onClick={() => {
                    if (address != ""){
                      setShowAddOutlet(prev => !prev)
                    }}
                  }
                  className="text-md font-semibold bg-lime-700 rounded-4xl mt-3 relative z-60 text-white pl-4 pr-4 p-1.5">
                    Submit
              </button>
            </div>
          </div>
        )}

        {!showAddOutlet && showOverlay && (
          <div className="fixed top-[110px] right-6 z-50 p-6 backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col">
            <div className="flex-grow">
              <h2 className="font-semibold text-lg text-white pt-0 p-1 pl-0">
                You dropped a pin!
              </h2>
              <p className="text-lg text-white pt-0 p-1 pl-0">
                Longitude: {coords?.lng.toFixed(5)}
              </p>
              <p className="text-lg text-white pt-0 p-1 pl-0">
                Latitude: {coords?.lat.toFixed(5)}
              </p>
              <button
                onClick={onClose}
                  className="text-lg font-semibold bg-lime-700 rounded-4xl text-white pl-5 pr-5 p-1 flex justify-center">
                    Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
}

export default AddOutlet;