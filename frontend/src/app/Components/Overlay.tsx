"use client";

import React, { useState, useEffect } from "react";
import {
  LucideZap,
  LucideBookmark,
  LucideClock,
  LucidePlus,
  LucideSearch,
  LucideUpload,
} from "lucide-react";

interface OverlayProps {
  showPinOverlay: boolean;
  coords: { lat: number; lng: number } | null;
  onClose: () => void;
}

const portOptions = ["Triple Peg", "Double Peg", "USB", "HDMI"];
const conditionOptions = ["New", "Worn", "Slightly Damaged", "Damaged"];

const AddOutlet: React.FC<OverlayProps> = ({
  showPinOverlay,
  coords,
  onClose,
}) => {
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [address, setAddress] = useState("");
  const [outletCount, setOutletCount] = useState(1);
  const [powerType, setPowerType] = useState("");
  const [selectedPort, setSelectedPort] = useState("Triple Peg");
  const [selectedCondition, setSelectedCondition] = useState("New");
  const [extraDetails, setExtraDetails] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  //if coordinates exist, will fill them in for address
  useEffect(() => {
    if (coords) {
      setAddress(`${coords?.lng.toFixed(5)} ${coords?.lat.toFixed(5)}`);
    }
  }, [coords]);

  return (
    <div className="fixed top-4 left-0 w-full flex items-center justify-between px-8 z-50 h-14">
      <div className="flex items-center px-4 h-full backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-full shadow-lg w-[360px]">
        <input
          type="text"
          placeholder="Search Electriumap"
          className="bg-transparent outline-none text-white placeholder-white/60 w-full text-md"
        />
        <LucideSearch className="w-5 h-5 font-semibold text-white" />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm bg-white/15 font-semibold border-2 border-white/40 rounded-full shadow-md text-white">
          <button className="flex flex-col items-center justify-center  w-20 h-14">
            <LucideZap className="w-6 h-6 " />
            <span className="text-[10px] mt-1 whitespace-nowrap">
              Outlets Near Me
            </span>
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

        <div
          className="flex items-center justify-center h-14 aspect-square rounded-full backdrop-blur-sm bg-white/15 border-2 border-white/40 shadow-md text-white font-semibold text-sm w-14 cursor-pointer"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          AG
        </div>
      </div>

      {showAddOutlet && (
        <div className="fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col">
          <div className="flex-grow">
            <h2 className="font-semibold text-lg text-white pb-1 pt-0 p-1 pl-0">
              Address <span className="text-red-500">*</span>
            </h2>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1 pb-1"
            ></input>
            <div className="flex items-center space-x-1 p-2 pl-0 pb-1">
              <h2 className="font-semibold text-lg text-white p-1 pb-1 pt-2 pr-1 pl-0">
                Number of Outlets <span className="text-red-500">*</span>
              </h2>
              <div className="flex items-center bg-white/35 text-white rounded-md px-0 py-0">
                <button
                  onClick={() =>
                    setOutletCount((prev) => Math.max(prev - 1, 0))
                  }
                  className="text-lg px-1"
                >
                  &lt;
                </button>
                <span className="text-lg font-semibold px-1">
                  {outletCount}
                </span>
                <button
                  onClick={() => setOutletCount((prev) => prev + 1)}
                  className="text-lg px-1"
                >
                  &gt;
                </button>
              </div>
            </div>
            <h2 className="font-semibold text-lg text-white p-1 pb-1 pt-0 pl-0">
              Power Type
            </h2>
            <input
              type="text"
              value={powerType}
              onChange={(e) => setPowerType(e.target.value)}
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1"
            ></input>
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
                        selectedCondition === option
                          ? "bg-white/35"
                          : "bg-white/50"
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
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-99 h-7 p-1"
            ></input>
          </div>
          <div className="relative p-7 mt-4 w-full flex-grow flex-shrink min-h-[80px] max-h-[25vh] overflow-hidden backdrop-blur-sm bg-white/10 border-2 border-dotted border-white rounded-2xl shadow-lg flex items-center justify-center text-center">
            <div>
              <LucideUpload className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] w-12 h-12 text-lime-600" />
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
                if (address != "" && outletCount != 0) {
                  setShowAddOutlet((prev) => !prev);
                }
              }}
              className="text-md font-semibold bg-lime-700 rounded-4xl mt-3 relative z-60 text-white pl-4 pr-4 p-1.5"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      {!showAddOutlet && showPinOverlay && (
        <div className="fixed top-[195px] right-6 z-50 p-6 backdrop-blur-sm bg-white/15 border-2 border-white/40 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col">
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
              className="text-lg font-semibold bg-lime-700 rounded-4xl text-white pl-5 pr-5 p-1 flex justify-center"
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
