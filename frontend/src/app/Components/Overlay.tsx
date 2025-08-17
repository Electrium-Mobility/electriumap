"use client";

import React, {useState, useEffect} from 'react';
import { addOutletFrontend } from "../utils/addOutlet";
import { isOnLand } from "../utils/addOutlet";
import { LucideBookmark, LucideClock, LucidePlus, LucideSearch, LucideUpload, SunMedium, Moon, ChevronDown, Plus, Bike, PlugZap, User, ArrowRight } from 'lucide-react';
import { auth, db } from "../firebase/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { setIsAuthenticated, getIsAuthenticated } from '../globals';
import { useRouter } from 'next/navigation';

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
  const [showProfile, setProfile ] = useState("")

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [vehicles, setVehicles] = useState<Array<{id: string, title: string, type: string}>>([]);
  const [userOutlets, setUserOutlets] = useState<Array<{id: string, locationName: string}>>([]);


  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (getIsAuthenticated()) {
          const user = auth.currentUser;
          if (user) {
            // Fetch user profile data
            const userDocRef = doc(db, "Users", user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              const userData = userDoc.data();
              const firstName = userData.firstName || "Anonymous";
              const lastName = userData.lastName || "";
              setUserName(`${firstName} ${lastName}`.trim());
              setUserEmail(userData.email || "No Email Provided");

              // Fetch vehicles
              const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
              const vehiclesSnap = await getDocs(vehiclesRef);
              const vehiclesData = vehiclesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              })) as Array<{id: string, title: string, type: string}>;
              setVehicles(vehiclesData);

              // Fetch user's outlet references
              const userOutletsRef = collection(db, "Users", user.uid, "Outlets");
              const userOutletsSnap = await getDocs(userOutletsRef);
              
              // Fetch the actual outlet documents
              const outletPromises = userOutletsSnap.docs.map(async (docSnap) => {
                const outletRef = doc(db, "Outlets", docSnap.id);
                const outletSnap = await getDoc(outletRef);
                if (outletSnap.exists()) {
                  return {
                    id: outletSnap.id,
                    locationName: outletSnap.data().locationName || "Unknown Location",
                    ...outletSnap.data()
                  };
                }
                return null;
              });

              const outlets = (await Promise.all(outletPromises)).filter(outlet => outlet !== null);
              setUserOutlets(outlets);
            }
          }
        } else {
          setUserName("");
          setUserEmail("");
          setVehicles([]); // Clear vehicles when logged out
          setUserOutlets([]); // Clear outlets when logged out
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  //if coordinates exist, will fill them in for address
  useEffect(() => {
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

        {/* search bar section */}
        <div className={`flex items-center px-4 h-full backdrop-blur-sm border-1 font-semibold rounded-full shadow-lg w-[360px]
          ${lightMode
          ? "bg-white/5 border-white/60 text-black"
          : "bg-white/15 border-white/60 text-white "
          }`}>
          <input
            type="text"
            placeholder="Search Electriumap"
            value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className={`bg-transparent outline-none  w-full text-md ${lightMode ? "placeholder-black/60" : "placeholder-white/60"}`}
          />
          <LucideSearch className={`w-5 h-5 font-semibold`} />
          
        {/* search results dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className={`absolute top-full left-0 w-full mt-2 bg-white/10 font-semibold rounded-lg shadow-lg max-h-60 overflow-y-auto border-1 backdrop-blur-sm
            ${lightMode
          ? " border-white/60 text-black"
          : " border-white/60 text-white "
          }`}>
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-white/20 backdrop-blur-sm cursor-pointer border-b border-white/10 last:border-b-0"
                onClick={() => handleSearchResultClick(result)}
              >
                {result.place_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* dark/light mode switch */}
      <div className="flex items-center gap-6"> 
        <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border-1 rounded-xl shadow-md 
          ${lightMode
          ? "bg-white/5 border-white/60 text-black"
          : "bg-white/15 border-white/60 text-white "
          }`}>
            {/* sliding indictor for which mode user is currently on */}
            <div
              className={`absolute top-0 h-full w-1/2 rounded-xl transition-all duration-300 ${
                lightMode ? 'left-0 bg-lime-600/40' : 'left-1/2 bg-lime-900/70'
              }`}
            />
            <button
              onClick={() => setLightMode(true)}
              className="z-10 w-1/2 h-full flex items-center justify-center"
            >
              <SunMedium  className="w-8 h-8"/>
            </button>
            <button
              onClick={() => setLightMode(false)}
              className="z-10 w-1/2 h-full flex items-center justify-center"
            >
              <Moon className="w-7 h-7" />
            </button>
          </div>

          {/* filter button section */}
          <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border-1 rounded-xl shadow-md 
            ${lightMode
            ? "bg-white/5 border-white/60 text-black"
            : "bg-white/15 border-white/60 text-white "
            }`}>
              <button className="flex items-center gap-3 text-base">
                <span>Filter</span> <ChevronDown className="w-4 h-4 bold"/> 
              </button>
          </div>
       
          {/* tool bar section */}
          <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border-1 rounded-xl shadow-md 
            ${lightMode
            ? "bg-white/5 border-white/60 text-black"
            : "bg-white/15 border-white/60 text-white "
            }`}>
            <button className="flex flex-col items-center justify-center  w-14 h-14">
              <LucideBookmark className="w-6 h-6 "/>
              <span className="text-[10px] mt-1 whitespace-nowrap">Saved</span>
            </button>

            <button className="flex flex-col items-center justify-center  w-14 h-14">
              <LucideClock className="w-6 h-6 "/>
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

          {/* display user's profile when authenticated (logged in), else display Sign In button when logged out */}
          {getIsAuthenticated() ? ( 
            <div className={`flex items-center justify-center h-14 aspect-square rounded-xl backdrop-blur-sm border-1  shadow-md font-semibold text-sm w-14 cursor-pointer
              ${lightMode
            ? "bg-white/5 border-white/60 text-black"
            : "bg-white/15 border-white/60 text-white"
            }`}
              onClick={() => setShowSettings(true)}
              title="Settings">
                {userName ? `${userName.split(' ')[0][0]}${userName.split(' ')[1]?.[0] || ''}` : ''}
            </div>
          ) : ( 
            // displaying Sign In button at top right corner (logged out)
            <div
              className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border-1 rounded-xl shadow-md bg-lime-700
                  ? "bg-white/5 border-white/60 text-black"
                  : "bg-white/15 border-white/60 text-white"
                }`}> 
              <button 
                onClick={() => router.push('/login')} // routes to login page
                className="flex items-center gap-3 text-base"
              >
                <span>Sign In</span> 
              </button> 
            </div> 
          )}

        </div>

        {showAddOutlet && (
          <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm border-1  rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode
          ? "bg-white/5 border-white/60 text-black"
          : "bg-white/15 border-white/60 text-white"
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
                ? "text-black/60 bg-white/20 border-white/60"
                : "text-white/40 bg-white/15 border-white/60"
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
                  onClick={async () => {
                    if (address !== "" && outletCount !== 0) {
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
                    }
                  }}
                  className="text-md font-semibold bg-lime-700 rounded-4xl mt-3 relative z-60 pl-4 pr-4 p-1.5">
                    Submit
              </button>
            </div>
          </div>
        )}
      {!showAddOutlet && showPinOverlay && (
        <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm border-1  text-lg   rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode
          ? "bg-white/5 border-white/60 text-black"
          : "bg-white/15 border-white/60 text-white "
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
          <div className={`relative bg-gradient-to-br from-white/30 via-black-100/20 to-white/10 backdrop-blur-xl border-1 border-white/60 rounded-3xl shadow-2xl px-8 pt-8 pb-6 flex flex-col items-center ${lightMode ? "text-black" : "text-white"}`}>
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 bg-white/15 border-white/60  hover:bg-white/25 transition-colors rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              aria-label="Close"
            >
              <span className="text-2xl font-bold leading-none">×</span>
            </button>

            {/* display user's profile picture*/}
            <div className="flex items-start mb-6 w-full">
              <div className="relative">
                {/* display user's profile circle */}
                <div className="w-16 h-16 rounded-full bg-white/15 border-white/60  flex items-center justify-center shadow-lg mb-2">
                  <span className=" text-2xl font-bold">
                    {userName ? `${userName.split(' ')[0][0]}${userName.split(' ')[1]?.[0] || ''}` : ''}
                  </span>
                </div>

                {/* upload user's profile button  */}
                <button 
                  onClick={() => { 
                    setProfile("testing"); 
                    console.log('add profile button clicked');
                  }} 
                  className="absolute -bottom-0 -right-0 z-10 flex items-center justify-center h-5 w-5 rounded-full bg-lime-600 text-white shadow-md"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div> 

              {/* display user's name and email */} 
              <div className="ml-4 flex flex-col w-full min-w-0"> 
                <div className={`text-lg font-semibold  ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  {userName || ''}
                </div>
                <div className={`text-sm ${lightMode ? "text-black/40" : "text-neutral-400"}`}>
                  {userEmail || ''}
                </div>
              </div> 
            </div>

            {/* user's vehicles */}
            <div className="w-full flex flex-col gap-2"> 
              <div className="flex items-center gap-2"> 
                <Bike className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  My Vehicles
                </div>
              </div> 
              
              <div className="rounded-xl backdrop-blur-md max-h-[96px] overflow-y-auto"> 
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <button 
                      key={vehicle.id}
                      className={`flex items-center justify-between w-full px-4 py-2 rounded-md h-12
                        ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                    >
                      <span>{vehicle.title}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ))
                ) : (
                  <div className={`px-4 py-2 ${lightMode ? "text-black/40" : "text-neutral-100"}`}>
                    No vehicles added yet
                  </div>
                )}
              </div>
            </div>
            
            {/* user's shared outlets */}
            <div className="w-full flex flex-col gap-2 pt-3"> 
              <div className="flex items-center gap-2"> 
                <PlugZap className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  My Shared Outlets
                </div>
              </div> 
              
              <div className="rounded-xl backdrop-blur-md max-h-[96px] overflow-y-auto"> 
                {userOutlets.length > 0 ? (
                  userOutlets.map((outlet) => (
                    <button 
                      key={outlet.id}
                      className={`flex items-center justify-between w-full px-4 py-2 rounded-md h-12
                        ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                    >
                      <span className="truncate max-w-[280px]" title={outlet.locationName}>
                        {outlet.locationName}
                      </span>
                      <ArrowRight className="w-5 h-5 flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className={`px-4 py-2 ${lightMode ? "text-black/40" : "text-neutral-100"}`}>
                    No outlets shared yet
                  </div>
                )}
              </div>
            </div>
            {/* <div className="w-full flex flex-col gap-2 pt-3"> 
              <div className="flex items-center gap-2"> 
                <PlugZap className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  My Shared Outlets
                </div>
              </div> 
              
              <div className="rounded-xl backdrop-blur-md"> 
                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                  ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                >
                  <span>Outlet 1</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                  ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                >
                  <span>Outlet 2</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                  ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                >
                  <span>Outlet 3</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>  
            </div>  */}

            {/* user's account setting - logout, change password, delete account */}
            <div className="w-full flex flex-col pt-3 pb-1"> 
              <div className="flex items-center gap-2"> 
                <User className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold  ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  Account
                </div>
              </div> 
                
              {/* change password */}
              <div className="rounded-xl backdrop-blur-md">
                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                  ${lightMode ? "hover:bg-lime-600/40" : "hover:bg-lime-900"}`}
                >
                  Change Password
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button 
                  onClick={() => {
                    signOut(auth)
                      .then(() => {
                        console.log("User signed out");
                        setIsAuthenticated(false); // logouts user, triggering the Sign In button to appear
                        setShowSettings(false);
                        console.log("isAuthenticated set to false");
                      })
                      .catch((error) => {
                        console.error("Sign-out error:", error);
                      });
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                    ${lightMode ? "hover:bg-lime-600/40": "hover:bg-lime-900"}`} 
                >
                  Logout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md
                  ${lightMode ? "hover:bg-red-600/40": "hover:bg-red-900"}`} 
                >
                  Delete Account
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div> 
            </div> 

            {/* old code */}
            {/* <div className="w-full flex flex-col gap-2"> 
              <button className={`flex items-center justify-between text-md hover:bg-lime-900 transition-colors rounded-xl px-5 py-2 w-full shadow border border-white/10
                ${lightMode
                  ? "bg-neutral-200"
                  : "bg-neutral-800"
                }`}>
                  Change Password
                <ArrowRight className="w-5 h-5" />
              </button>

              <button 
                onClick={() => {
                  signOut(auth)
                    .then(() => {
                      console.log("User signed out");
                      setIsAuthenticated(false); // logouts user, triggering the Sign In button to appear
                      setShowSettings(false);
                      console.log("isAuthenticated set to false");
                    })
                    .catch((error) => {
                      console.error("Sign-out error:", error);
                    });
                }}
                className={`flex items-center justify-between text-md hover:bg-lime-900 transition-colors rounded-xl px-5 py-2 w-full shadow border border-white/10
                  ${lightMode
                    ? "bg-neutral-200"
                    : "bg-neutral-800"
                  }`}>
                  Logout
                  <ArrowRight className="w-5 h-5" />
              </button>
              
              <button className={`flex items-center justify-between text-md hover:bg-red-900 transition-colors rounded-xl px-5 py-2 w-full shadow border border-white/10
                ${lightMode
                  ? "bg-neutral-200"
                  : "bg-neutral-800"
                }`}>
                  Delete Account
                  <ArrowRight className="w-5 h-5" />
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddOutlet;

