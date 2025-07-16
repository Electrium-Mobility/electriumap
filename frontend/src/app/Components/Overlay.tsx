"use client";

import React, {useState, useEffect} from 'react';
import { addOutletFrontend } from "../utils/addOutlet";
import { isOnLand } from "../utils/addOutlet";
import { LucideZap, LucideBookmark, LucideClock, LucidePlus, LucideSearch, LucideUpload } from 'lucide-react';

interface OverlayProps {
  showPinOverlay: boolean;
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
  lightMode: boolean;
  setLightMode: (value: boolean) => void;
  onSearchSelect?: (lng: number, lat: number) => void;
}

const portOptions = ["Triple Peg", "Double Peg", "USB", "HDMI"];
const conditionOptions = ["New", "Worn", "Slightly Damaged", "Damaged"];

const AddOutlet: React.FC<OverlayProps> = ({
  showPinOverlay,
  coords,
  onClose, 
  lightMode, 
  setLightMode,
  onSearchSelect,
}) => {
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [address, setAddress] = useState("");
  const [outletCount, setOutletCount] = useState(1);
  const [powerType, setPowerType] = useState("");
  const [selectedPort, setSelectedPort] = useState("Triple Peg");
  const [selectedCondition, setSelectedCondition] = useState("New");
  const [extraDetails, setExtraDetails] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{place_name: string, center: [number, number]}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

    //if coordinates exist, will fill them in for address
    useEffect(() =>{
      if (coords) {
        setAddress(`${coords?.lng.toFixed(5)} ${coords?.lat.toFixed(5)}`);
      }
    }, [coords]);


  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      setSearchResults(data.features.map((feature: any) => ({
        place_name: feature.place_name,
        center: feature.center
      })));
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleSearchResultClick = (result: {place_name: string, center: [number, number]}) => {
    setSearchValue(result.place_name);
    setShowSearchResults(false);
    onSearchSelect?.(result.center[0], result.center[1]);
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

    return (
      <div className="fixed top-4 left-0 w-full flex items-center justify-between px-8 z-50 h-14">
        <div className={`relative flex items-center px-4 h-full backdrop-blur-sm border-2 rounded-full shadow-lg w-[360px]
          ${lightMode
          ? "bg-white/5 border-white/80"
          : "bg-white/15 border-white/40"
          }`}>
          <input
            type="text"
            placeholder="Search Electriumap"
            value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-transparent outline-none text-white placeholder-white w-full text-md"
          />
          <LucideSearch className="w-5 h-5 font-semibold text-white" />
          
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-black/80 backdrop-blur-md rounded-lg shadow-lg max-h-60 overflow-y-auto border border-white/20">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-white/20 cursor-pointer text-white border-b border-white/10 last:border-b-0"
                onClick={() => handleSearchResultClick(result)}
              >
                {result.place_name}
              </div>
            ))}
          </div>
        )}
      </div>

        <div className="flex items-center gap-6">
          <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border-2 rounded-full shadow-md text-white
          ${lightMode
          ? "bg-white/5 border-white/80"
          : "bg-white/15 border-white/40"
          }`}>
            <button className="flex flex-col items-center justify-center  w-20 h-14">
              <LucideZap className="w-6 h-6 " />
              <span className="text-[10px] mt-1 whitespace-nowrap">Outlets Near Me</span>
            </button>

          <button className="flex flex-col items-center justify-center  w-14 h-14">
            <LucideBookmark className="w-6 h-6 " />
            <span className="text-[10px] mt-1 whitespace-nowrap">Saved</span>
          </button>

          <button className="flex flex-col items-center justify-center  w-14 h-14">
            <LucideClock className="w-6 h-6 " />
            <span className="text-[10px] mt-1 whitespace-nowrap">Recents</span>
          </button>

          <button
            onClick={() => setShowAddOutlet((prev) => !prev)}
            className="flex flex-col items-center justify-center text-lime-600 w-16 h-14"
          >
            <LucidePlus className="w-7 h-7 text-lime-600" />
            <span className="text-[10px] mt-0 whitespace-nowrap">
              Add Outlet
            </span>
          </button>
        </div>

          <div className={`flex items-center justify-center h-14 aspect-square rounded-full backdrop-blur-sm border-2 shadow-md text-white font-semibold text-sm w-14 cursor-pointer
            ${lightMode
          ? "bg-white/5 border-white/80"
          : "bg-white/15 border-white/40"
          }`}
          onClick={() => setShowSettings(true)}
          title="Settings">
            AG
          </div>
        </div>

        <div className="fixed top-53 left-10">
          <button
            onClick={() => setLightMode(!lightMode)}
            className={`w-16 h-8 rounded-full p-1 transition-colors duration-300 ${
              lightMode ? 'bg-gray-300' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            lightMode ? 'translate-x-8' : 'translate-x-0'
          }`}
            />
          </button>
        </div>

        {showAddOutlet && (
          <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm  text-white border-2 border-white rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode
          ? "bg-white/5 border-white/80"
          : "bg-white/15 border-white/40"
          }`}>
            <div className="flex-grow">
              <h2 className="font-semibold text-lg pb-1 pt-0 p-1 pl-0">
                Address <span className="text-red-500">*</span>
              </h2>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-lg bg-white/35 rounded-md shadow-lg w-99 h-7 p-1 pb-1">
              </input>
              <div className="flex items-center space-x-1 p-2 pl-0 pb-1">
                <h2 className="font-semibold text-lg  p-1 pb-1 pt-2 pr-1 pl-0">
                  Number of Outlets <span className="text-red-500">*</span>
                </h2>
                <div className="flex items-center bg-white/35 rounded-md px-0 py-0">
                  <button
                    onClick={() => setOutletCount((prev) => Math.max(prev - 1, 0))}
                    className="text-lg px-1"
                  >
                    &lt;
                  </button>
                  <span className="text-lg font-semibold px-1">{outletCount}</span>
                  <button
                    onClick={() => setOutletCount((prev) => prev + 1)}
                    className="text-lg px-1"
                  >
                    &gt;
                  </button>
                </div>
              </div>
              <h2 className="font-semibold text-lg  p-1 pb-1 pt-0 pl-0">
                Power Type
              </h2>
              <input
                type="text"
                value={powerType}
                onChange={(e) => setPowerType(e.target.value)}
                className="text-lg bg-white/35 rounded-md shadow-lg w-99 h-7 p-1">
              </input>
              <div className="flex w-full">
                <div className="w-1/2">
                  <h2 className="font-semibold text-lg p-1 pb-0 pl-0">
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
                          <span className={`text-md ${lightMode ? "text-lime-600": "text-lime-500"}`}>✔</span>
                        )}
                      </div>
                      <span className="text-md">{option}</span>
                    </div>
                  ))}
                </div>
                <div className="w-1/2">
                  <h2 className="font-semibold text-lg p-1 pb-0 pl-0">
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
                          <span className={`text-md ${lightMode ? "text-lime-600": "text-lime-500"}`}>✔</span>
                        )}
                      </div>
                      <span className="text-md">{option}</span>
                    </div>
                  ))}
                </div>

              </div>
              <h2 className="font-semibold text-lg p-1 pb-0 pl-0">
                Extra Details
              </h2>
              <input
                type="text"
                value={extraDetails}
                onChange={(e) => setExtraDetails(e.target.value)}
                className="text-lg bg-white/35 rounded-md shadow-lg w-99 h-7 p-1">
              </input>
            </div>
            <div className={`relative p-7 mt-4 w-full flex-grow flex-shrink min-h-[80px] max-h-[25vh] overflow-hidden backdrop-blur-sm bg-white/1 border-2 border-dotted border-white rounded-2xl shadow-lg flex items-center justify-center text-center
              ${lightMode
                ? "text-white/80 bg-white/20 border-white/80"
                : "text-white/40 bg-white/15 border-white/40"
                }`}>

              <div>
                <LucideUpload className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] w-12 h-12 text-lime-600" />
              </div>
              <div>
                <h2 className="font-semibold text-sm p-4 pt-14">
                  Choose a file or drag it in here.
                </h2>
              </div>
            </div>
            <div className="flex justify-end w-full">

                <button
                  onClick={() => {
                    if (address != "" && outletCount != 0){
                      try {
                        await addOutletFrontend({
                          userName: "TestUser", 
                          userId: "user123",     
                          locationName: address, 
                          chargerType: powerType || selectedPort,
                          description: `Condition: ${selectedCondition}. ${extraDetails}`,
                        });
                    
                        setShowAddOutlet(false);
                      } catch (err) {
                        console.error("Error submitting outlet:", err);
                      }
                    }}
                  }
                  className="text-md font-semibold bg-lime-700 rounded-4xl mt-3 relative z-60 pl-4 pr-4 p-1.5">
                    Submit
              </button>
            </div>
          </div>
        )}

      {!showAddOutlet && showPinOverlay && (
        <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm border-2 bg-white/5 text-lg text-white border-white/40 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode
          ? "bg-white/5 border-white/80"
          : "bg-white/15 border-white/40"
          }`}>
          <div className="flex-grow">
            <h2 className="font-semibold pt-0 p-1 pl-0">
              You dropped a pin!
            </h2>
            <p className="pt-0 p-1 pl-0">
              Longitude: {coords?.lng.toFixed(5)}
            </p>
            <p className="pt-0 p-1 pl-0">
              Latitude: {coords?.lat.toFixed(5)}
            </p>
            <button
              onClick={onClose}
              className="font-semibold bg-lime-700 rounded-4xl pl-5 pr-5 p-1 flex justify-center"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed top-1/2 left-1/2 z-50 w-[400px] max-w-full p-0 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative bg-gradient-to-br from-white/30 via-lime-100/20 to-white/10 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl px-8 pt-8 pb-6 flex flex-col items-center">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 bg-white/15 border-2 border-white/40 text-white hover:bg-white/25 transition-colors rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              aria-label="Close"
            >
              <span className="text-2xl font-bold leading-none">×</span>
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-white/15 border-2 border-white/40 flex items-center justify-center shadow-lg mb-2">
                <span className="text-white text-2xl font-bold">AG</span>
              </div>
              <div className="text-lg font-semibold text-neutral-100">
                [Insert User Name Here]
              </div>
              <div className="text-sm text-neutral-400">
                [Insert User Email Here]
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              <button className="flex items-center gap-3 text-md font-semibold bg-neutral-800 hover:bg-lime-900 transition-colors rounded-xl text-lime-400 px-5 py-3 w-full shadow border border-white/10">
                <LucidePlus className="w-5 h-5 text-lime-400" />
                Change Password
              </button>
              <button className="flex items-center gap-3 text-md font-semibold bg-neutral-800 hover:bg-red-900 transition-colors rounded-xl text-red-400 px-5 py-3 w-full shadow border border-white/10">
                <LucideUpload className="w-5 h-5 text-red-400" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOutlet;
