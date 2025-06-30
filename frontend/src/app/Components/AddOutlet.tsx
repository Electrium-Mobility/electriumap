"use client"

import React, {useState} from "react";

const portOptions = ["Triple Peg", "Double Peg", "USB", "HDMI"];
const conditionOptions = ["New", "Worn", "Damaged", "Destroyed"];

function AddOutlet() {
    const [showAddOutlet, setShowAddOutlet] = useState(false);
    const [address, setAddress] = useState("");
    const [powerType, setPowerType] = useState("");
    const [selectedPort, setSelectedPort] = useState("Triple Peg");
    const [selectedCondition, setSelectedCondition] = useState("New");
    const [extraDetails, setExtraDetails] = useState("");

    return (
      <div>
        <button
        onClick={() => setShowAddOutlet(prev => !prev)} //toggles overlay on and off
        className="fixed top-4 right-30 z-50 backdrop-blur-sm bg-black/30 border border-white/20 rounded-4xl font-semibold text-sm text-lime-600 px-5 py-5 shadow">
          Add Outlet
        </button>

        {showAddOutlet && (
          <div className="fixed top-[90px] right-10 z-50 p-4 backdrop-blur-sm bg-black/30 border border-white/20 rounded-2xl shadow-lg w-100 h-140 text-whit ">
            <h2 className="font-semibold text-lg text-white pt-0 p-3 pl-0">
              Address
            </h2>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-91 h-8 p-3">
            </input>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-lg text-white p-3 pl-0">
                Number of Outlets
              </h2>
              <select className="bg-white/35 w-7 h-6 rounded-md text-white">
                {[1, 2, 3, 4, 5].map((num) => (
                  <option key={num} value={num}>{num}</option>
                )
                )}
              </select>
            </div>


            <h2 className="font-semibold text-lg text-white p-3 pt-0 pl-0">
              Power Type
            </h2>
            <input
              type="text"
              value={powerType}
              onChange={(e) => setPowerType(e.target.value)}
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-91 h-8 p-3">
            </input>
            <div className="flex w-full">
              <div className="w-1/2">
                <h2 className="font-semibold text-lg text-white p-3 pb-1.5 pl-0">
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
                        <span className="text-lime-600 text-md">✔</span>
                      )}
                    </div>
                    <span className="text-md">{option}</span>
                  </div>
                ))}
              </div>
              <div className="w-1/2">
                <h2 className="font-semibold text-lg text-white p-3 pb-1.5 pl-0">
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
                        <span className="text-lime-600 text-md">✔</span>
                      )}
                    </div>
                    <span className="text-md">{option}</span>
                  </div>
                ))}
              </div>

            </div>
            <h2 className="font-semibold text-lg text-white p-3 pl-0">
              Extra Details
            </h2>
            <input
              type="text"
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
              className="text-lg bg-white/35 text-white rounded-md shadow-lg w-91 h-8 p-3">
            </input>
            <h2 className="font-semibold text-lg text-white p-3 pl-0 flex justify-center">
              Upload an Image
            </h2>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAddOutlet(prev => !prev)}
                className="text-md font-semibold bg-lime-700 rounded-4xl text-white pl-5 pr-5 p-2 flex justify-center">
                  Submit
              </button>
            </div>
          </div>
        )}
      </div>
    );
}

export default AddOutlet;