"use client";

import React, { useState, useEffect } from 'react';
import { PinData } from "./utils";
import { addOutletFrontend, addOutlet, isOnLand } from "../utils/addOutlet";
import {
  LucideBookmark, LucideClock, LucidePlus, LucideLocateFixed, LucideSearch,
  LucideUpload, SunMedium, Moon, ChevronDown, Plus, Bike, PlugZap, User,
  ArrowRight, MapPin, LucideX, Save, LucidePlugZap, LucideStar, LucideNavigation, LucidePlayCircle, Cable
} from 'lucide-react';
import { auth, db } from "../firebase/firebase";
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, getDoc, getDocs, collection, updateDoc } from "firebase/firestore";
import { setIsAuthenticated, getIsAuthenticated } from '../globals';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { useUserData } from '../create-account/UserDataContext';

interface OverlayProps {
  showPinOverlay: boolean;
  coords: { lat: number; lng: number } | null;
  searchCoords?: { lat: number; lng: number } | null;
  selectedPin?: PinData | null;
  onClose: () => void;
  lightMode: boolean;
  setLightMode: (value: boolean) => void;
  onSearchSelect?: (lng: number, lat: number) => void;
  /** Called when the user cancels adding a new outlet so the temporary pin can be removed */
  onCancelTempPin?: () => void;
  onGeoLocateClick?: () => void;
    /** Port types selected for filtering */
  selectedPortTypes?: string[];
  /** Callback when port type filter changes */
  onPortTypeFilterChange?: (portTypes: string[]) => void;

  onStartFollow?: () => void;
  onStopFollow?: () => void;
  isLocatingToggle?: boolean;
  setIsLocatingToggle?: (val: boolean) => void;
}

const portOptions = ["Triple Peg", "Double Peg", "USB", "HDMI"];
const conditionOptions = ["New", "Worn", "Slightly Damaged", "Damaged"];

// Step 1: Welcome & Location
const Step1: React.FC<{
  address: string;
  onAddressChange: (address: string) => void;
  lightMode: boolean;
  isExisting: boolean;
  onGeoLocateClick?: () => void;
}> = ({ address, onAddressChange, lightMode, isExisting, onGeoLocateClick }) => (
  <div className="step-content">
    <h2 className="font-semibold text-xl mb-5 text-center">Let's get started with the outlet's location</h2>
    <div className="form-group">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          readOnly={isExisting}
          disabled={isExisting}
          placeholder="Enter the address"
          className={`w-full p-4 rounded-xl border-2 text-lg ${
            lightMode 
              ? 'border-gray-300 bg-white/50 text-black placeholder-gray-500' 
              : 'border-white/40 bg-white/20 text-white placeholder-white/60'
          } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        {!isExisting && onGeoLocateClick && (
          <button
            onClick={onGeoLocateClick}
            title="Find my location"
            className={`p-4 rounded-xl border-2 transition-all hover:opacity-80 ${
              lightMode ? 'border-gray-300 bg-white/50 text-black' : 'border-white/40 bg-white/20 text-white'}`}>
            <LucideLocateFixed className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  </div>
);

// Step 2: Outlet Count & Power Type
const Step2: React.FC<{
  outletCount: number;
  onOutletCountChange: (count: number) => void;
  powerType: string;
  onPowerTypeChange: (value: string) => void;
  lightMode: boolean;
  isExisting: boolean;
}> = ({ outletCount, onOutletCountChange, powerType, onPowerTypeChange, lightMode, isExisting }) => (
  <div className="step-content">
    <h2 className="font-semibold text-xl mb-5 text-center">How many outlets are located here?</h2>
    <div className="form-group">
      <div className="flex items-center justify-center gap-6 mb-5">
        <button
          onClick={() => !isExisting && onOutletCountChange(Math.max(0, outletCount - 1))}
          disabled={isExisting || outletCount <= 0}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
            lightMode 
              ? 'bg-white/50 border-2 border-gray-300 text-black hover:bg-white/70' 
              : 'bg-white/20 border-2 border-white/40 text-white hover:bg-white/30'
          } ${(isExisting || outletCount <= 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          -
        </button>
        
        <div className={`w-22 h-22 rounded-full flex items-center justify-center text-3xl font-bold ${
          lightMode ? 'bg-lime-100 text-lime-800' : 'bg-lime-600 text-white'
        }`}>
          {outletCount}
        </div>
        
        <button
          onClick={() => !isExisting && onOutletCountChange(outletCount + 1)}
          disabled={isExisting}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
            lightMode 
              ? 'bg-white/50 border-2 border-gray-300 text-black hover:bg-white/70' 
              : 'bg-white/20 border-2 border-white/40 text-white hover:bg-white/30'
          } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          +
        </button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-lg opacity-70">
          {outletCount === 1 ? '1 outlet' : `${outletCount} outlets`} selected
        </p>
      </div>

      {/* Power Type Section - Shows after outlet count is selected */}
      {outletCount > 0 && (
        <div>
          <h3 className="font-semibold text-xl mb-4 text-center">Describe the Power Type</h3>
          <input
            type="text"
            value={powerType}
            onChange={(e) => onPowerTypeChange(e.target.value)}
            readOnly={isExisting}
            disabled={isExisting}
            placeholder="Describe the power type"
            className={`w-full p-4 rounded-xl border-2 text-lg ${
              lightMode 
                ? 'border-gray-300 bg-white/50 text-black placeholder-gray-500' 
                : 'border-white/40 bg-white/20 text-white placeholder-white/60'
            } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      )}
    </div>
  </div>
);

// Step 3: Port Type & Condition
const Step3: React.FC<{
  selectedPort: string;
  onPortChange: (port: string) => void;
  otherPort: string;
  onOtherPortChange: (value: string) => void;
  condition: string;
  onConditionChange: (condition: string) => void;
  lightMode: boolean;
  isExisting: boolean;
}> = ({ selectedPort, onPortChange, otherPort, onOtherPortChange, condition, onConditionChange, lightMode, isExisting }) => {
  const portOptions = [
    { id: 'triple-peg', name: 'Triple Peg', icon: <img src="/images/port2.png.webp" className="w-full h-auto"></img> },
    { id: 'double-peg', name: 'Double Peg', icon: <img src="/images/port1.png.webp" className="w-full h-auto"></img> },
    { id: 'usb', name: 'USB', icon: <img src="/images/port3.png.webp" className="w-full h-auto"></img> },
    { id: 'hdmi', name: 'HDMI', icon: <Cable className="w-6 h-6" /> },
  ];

  const conditionOptions = [
    { id: 'perfect', name: 'Perfect'},
    { id: 'slightly-worn', name: 'Slightly Worn'},
    { id: 'partially-damaged', name: 'Partially Damaged'},
    { id: 'damaged', name: 'Damaged'},
  ];

  return (
    <div className="step-content">
      <h2 className="font-semibold text-xl mb-4 text-center">What is the type of port?</h2>
      
      {/* Port Type Selection */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {portOptions.map((port) => (
          <button
            key={port.id}
            type="button"
            onClick={() => !isExisting && onPortChange(port.name)}
            disabled={isExisting}
            className={`p-3 rounded-lg border-2 transition-all text-center ${
              selectedPort === port.name
                ? lightMode
                  ? 'border-lime-500 bg-lime-100 text-lime-800'
                  : 'border-lime-500 bg-lime-600 text-white'
                : lightMode
                  ? 'border-gray-300 bg-white/50 text-black hover:border-lime-400'
                  : 'border-white/40 bg-white/20 text-white hover:border-lime-400'
            } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center gap-1">
              <div className={`p-1 rounded ${
                selectedPort === port.name ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {port.icon}
              </div>
              <div className="font-semibold text-sm">{port.name}</div>
            </div>
          </button>
        ))}
      </div>
      
      {/* Other Port Option */}
      <button
        type="button"
        onClick={() => !isExisting && onPortChange('Other')}
        disabled={isExisting}
        className={`w-full p-3 rounded-lg border-2 transition-all text-center mb-3 ${
          selectedPort === 'Other'
            ? lightMode
              ? 'border-lime-500 bg-lime-100 text-lime-800'
              : 'border-lime-500 bg-lime-600 text-white'
            : lightMode
              ? 'border-gray-300 bg-white/50 text-black hover:border-lime-400'
              : 'border-white/40 bg-white/20 text-white hover:border-lime-400'
        } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <div className="font-semibold text-m">Other</div>
        </div>
      </button>
      
      {/* Other Port Text Input */}
      {selectedPort === 'Other' && !isExisting && (
        <div className="mb-4">
          <input
            type="text"
            value={otherPort}
            onChange={(e) => onOtherPortChange(e.target.value)}
            placeholder="Port Type"
            className={`w-full p-3 rounded-lg border-2 text-sm ${
              lightMode 
                ? 'border-gray-300 bg-white/50 text-black placeholder-gray-500' 
                : 'border-white/40 bg-white/20 text-white placeholder-white/60'
            }`}
          />
        </div>
      )}

      {/* Condition Section - Shows after port type is selected */}
      {(selectedPort || otherPort) && (
        <div className="mt-6">
          <h3 className="font-semibold text-xl mb-4 text-center">Describe the condition</h3>
          <div className="grid grid-cols-4 gap-2">
            {conditionOptions.map((cond) => (
              <button
                key={cond.id}
                type="button"
                onClick={() => !isExisting && onConditionChange(cond.name)}
                disabled={isExisting}
                className={`w-full p-3 rounded-lg border-2 transition-all text-center ${
                  condition === cond.name
                    ? lightMode
                      ? 'border-lime-500 bg-lime-100 text-lime-800'
                      : 'border-lime-500 bg-lime-600 text-white'
                    : lightMode
                      ? 'border-gray-300 bg-white/50 text-black hover:border-lime-400'
                      : 'border-white/40 bg-white/20 text-white hover:border-lime-400'
                } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className="font-semibold text-sm">{cond.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Step 4: Extra Details & File Upload
const Step4: React.FC<{
  extraDetails: string;
  onExtraDetailsChange: (details: string) => void;
  images: File[];
  onImageUpload: (files: FileList) => void;
  onRemoveImage: (index: number) => void;
  lightMode: boolean;
  isExisting: boolean;
}> = ({ extraDetails, onExtraDetailsChange, images, onImageUpload, onRemoveImage, lightMode, isExisting }) => {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isExisting && e.dataTransfer.files) {
      onImageUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isExisting && e.target.files) {
      onImageUpload(e.target.files);
    }
  };

  return (
    <div className="step-content">
      <h2 className="font-semibold text-xl mb-5 text-center">Any other details?</h2>
      <div className="form-group">
        {/* Extra Details Text Area */}
        <div className="mb-5">
          <textarea
            value={extraDetails}
            onChange={(e) => onExtraDetailsChange(e.target.value)}
            readOnly={isExisting}
            disabled={isExisting}
            placeholder="Additional Details"
            className={`w-full p-4 rounded-xl border-2 resize-none ${
              lightMode 
                ? 'border-gray-300 bg-white/50 text-black placeholder-gray-500' 
                : 'border-white/40 bg-white/20 text-white placeholder-white/60'
            } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* File Upload Section */}
        <div className="mb-4">
          <div 
            className={`relative p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
              lightMode
                ? 'border-gray-300 bg-white/20 hover:border-lime-400'
                : 'border-white/40 bg-white/10 hover:border-lime-400'
            } ${isExisting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isExisting && document.getElementById('file-input')?.click()}
          >
            <LucideUpload className="mx-auto w-12 h-12 text-lime-600 mb-4" />
            <p className="text-m">Choose a file or drag it in here</p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              disabled={isExisting}
              className="hidden"
              id="file-input"
            />
          </div>
        </div>
        
        {/* Image Previews */}
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <img 
                  src={URL.createObjectURL(image)} 
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {!isExisting && (
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                    onClick={() => onRemoveImage(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Review Step
const ReviewStep: React.FC<{
  formData: any;
  lightMode: boolean;
}> = ({ formData, lightMode }) => (
  <div className="step-content">
    <h2 className="font-semibold text-2xl mb-6 text-center">Review Your Outlet</h2>
    <div className="form-group">
      <div className={`p-6 rounded-2xl ${
        lightMode ? 'bg-white/20 border-2 border-white/30' : 'bg-white/10 border-2 border-white/20'
      }`}>
        <div className="space-y-4">
          <div className="flex justify-between items-start pb-3 border-b border-white/20">
            <strong className="text-lg">Location:</strong>
            <span className="text-right text-lg">{formData.address || 'Not specified'}</span>
          </div>
          
          <div className="flex justify-between items-start pb-3 border-b border-white/20">
            <strong className="text-lg">Outlet Count:</strong>
            <span className="text-lg">{formData.outletCount}</span>
          </div>
          
          <div className="flex justify-between items-start pb-3 border-b border-white/20">
            <strong className="text-lg">Power Type:</strong>
            <span className="text-right text-lg">{formData.powerType || 'Not specified'}</span>
          </div>
          
          <div className="flex justify-between items-start pb-3 border-b border-white/20">
            <strong className="text-lg">Port Type:</strong>
            <span className="text-right text-lg">
              {formData.selectedPort === 'Other' ? formData.otherPort : formData.selectedPort || 'Not specified'}
            </span>
          </div>
          
          <div className="flex justify-between items-start pb-3 border-b border-white/20">
            <strong className="text-lg">Condition:</strong>
            <span className="text-right text-lg">{formData.condition || 'Not specified'}</span>
          </div>
          
          {formData.extraDetails && (
            <div className="flex justify-between items-start pb-3 border-b border-white/20">
              <strong className="text-lg">Extra Details:</strong>
              <span className="text-right text-lg max-w-[60%]">{formData.extraDetails}</span>
            </div>
          )}
          
          <div className="flex justify-between items-start">
            <strong className="text-lg">Photos:</strong>
            <span className="text-right text-lg">{formData.images.length} uploaded</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-lg opacity-70">
          Confirm all details are correct before submitting.
        </p>
      </div>
    </div>
  </div>
);

const AddOutlet: React.FC<OverlayProps> = ({
  showPinOverlay,
  coords,
  searchCoords,
  selectedPin,
  onClose,
  lightMode,
  setLightMode,
  onSearchSelect,
  onCancelTempPin,
  onGeoLocateClick,
  onStartFollow,
  onStopFollow,
  isLocatingToggle,
  setIsLocatingToggle,
  selectedPortTypes = [],
  onPortTypeFilterChange
}) => {
  // use locating toggle from parent when provided (lifted state)
  const isLocatingToggleProp = isLocatingToggle;
  const setIsLocatingToggleProp = setIsLocatingToggle;
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state for 5-step wizard (4 steps + review)
  const [address, setAddress] = useState("");
  const [outletCount, setOutletCount] = useState(0);
  const [powerType, setPowerType] = useState("");
  const [selectedPort, setSelectedPort] = useState("");
  const [otherPort, setOtherPort] = useState("");
  const [condition, setCondition] = useState("");
  const [extraDetails, setExtraDetails] = useState("");
  const [images, setImages] = useState<File[]>([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ place_name: string, center: [number, number] }>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showProfile, setProfile] = useState("");
  const { setUserData } = useUserData();
  const justSelectedRef = React.useRef(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [vehicles, setVehicles] = useState<Array<{ id: string, title: string, type: string }>>([]);
  const [userOutlets, setUserOutlets] = useState<Array<{ id: string, locationName: string }>>([]);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);
  
  // Filter dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Saved Outlets state
  const [showSavedOutlets, setShowSavedOutlets] = useState(false)

  // Nearby pins state
  const [nearbyPinsMessage, setNearbyPinsMessage] = useState<string>("");
  const [hasNearbyPins, setHasNearbyPins] = useState<boolean | null>(null);
  const [isCheckingNearbyPins, setIsCheckingNearbyPins] = useState<boolean>(false);

  const router = useRouter();

  // Treat presence of selectedPin as "existing outlet view" mode
  const isExisting = Boolean(selectedPin);

  // Form data for summary
  const formData = {
    address,
    outletCount,
    powerType,
    selectedPort,
    otherPort,
    condition,
    extraDetails,
    images
  };

  // Handlers for form fields
  const handleOutletCountChange = (count: number) => {
    setOutletCount(count);
  };

  const handleImageUpload = (files: FileList) => {
    const newImages = Array.from(files).slice(0, 4 - images.length);
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (address && outletCount > 0) {
      try {
        const portType = selectedPort === 'Other' ? otherPort : selectedPort;
        if (coords) {
          await addOutlet({
            latitude: coords.lat,
            longitude: coords.lng,
            userName: userName || "Anonymous",
            userId: userEmail || "unknown",
            locationName: address,
            chargerType: `${powerType}, ${portType}`,
            description: `Condition: ${condition}. ${extraDetails}`,
          });
        } else {
          await addOutletFrontend({
            userName: userName || "Anonymous",
            userId: userEmail || "unknown",
            locationName: address,
            chargerType: `${powerType}, ${portType}`,
            description: `Condition: ${condition}. ${extraDetails}`,
          });
        }
        setShowAddOutlet(false);
        setCurrentStep(1);
        // Reset form
        setAddress("");
        setOutletCount(1);
        setPowerType("");
        setSelectedPort("");
        setOtherPort("");
        setCondition("");
        setExtraDetails("");
        setImages([]);
      } catch (err) {
        console.error("Error submitting outlet:", err);
      }
    }
  };

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
              setProfileImageUrl("");

              if (userData.profileImage) {
                try {
                  if (userData.profileImage.startsWith('data:image')) {
                    setProfileImageUrl(userData.profileImage);
                  } else {
                    const imageData = `data:image/jpeg;base64,${userData.profileImage}`;
                    setProfileImageUrl(imageData);
                  }
                } catch (imageError) {
                  console.error("Error processing profile image:", imageError);
                }
              }

              // Fetch vehicles
              const vehiclesRef = collection(db, "Users", user.uid, "Vehicles");
              const vehiclesSnap = await getDocs(vehiclesRef);
              const vehiclesData = vehiclesSnap.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as any),
              })) as Array<{ id: string, title: string, type: string }>;
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
                    locationName: (outletSnap.data() as any).locationName || "Unknown Location",
                    ...(outletSnap.data() as any),
                  };
                }
                return null;
              });

              const outlets = (await Promise.all(outletPromises)).filter(Boolean) as any[];
              setUserOutlets(outlets);
            }
          }
        } else {
          setUserName("");
          setUserEmail("");
          setVehicles([]);
          setUserOutlets([]);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  // If new coordinates are provided (e.g. map click), pre-fill address and auto-open the form
  useEffect(() => {
    if (!selectedPin) {
      if (!coords) return;
      setAddress(`${coords.lng.toFixed(5)} ${coords.lat.toFixed(5)}`);
      setShowAddOutlet(true);
    } else {
      setShowAddOutlet(false);                // <— key line
      setAddress(selectedPin.title || "");
      setPowerType(selectedPin.category || "");
      setExtraDetails(selectedPin.description || "");
    }
  }, [coords, selectedPin]);

  const handleProfileImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUpdatingProfileImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64String = e.target?.result as string;
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "Users", user.uid);
          await updateDoc(userDocRef, { profileImage: base64String });
          setProfileImageUrl(base64String);
        }
        setIsUpdatingProfileImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error updating profile image:", error);
      setIsUpdatingProfileImage(false);
    }
  };

  // Check if user has email/password provider
  const hasEmailPasswordProvider = () => {
    const user = auth.currentUser;
    if (!user) return false;
    // Check if user has password provider linked
    const providers = user.providerData;
    return providers.some(provider => provider.providerId === 'password');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    const user = auth.currentUser;
    if (!user || !user.email) {
      setPasswordError("You must be logged in to change your password");
      return;
    }

    // Check if user has email/password provider
    if (!hasEmailPasswordProvider()) {
      setPasswordError("Password change is not available for accounts signed in with Google. Please use your Google account settings to manage your account.");
      return;
    }
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from current password");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Reauthenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (error: any) {
      console.error("Error changing password:", error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setPasswordError("Current password is incorrect. Please check your password and try again.");
      } else if (error.code === "auth/weak-password") {
        setPasswordError("New password is too weak. Please choose a stronger password.");
      } else if (error.code === "auth/requires-recent-login") {
        setPasswordError("For security reasons, please log out and log back in before changing your password.");
      } else if (error.code === "auth/operation-not-allowed") {
        setPasswordError("Password change is not enabled for this account. Please contact support.");
      } else {
        setPasswordError(error.message || "Failed to change password. Please try again.");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

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
      setSearchResults(
        (data.features || []).map((feature: any) => ({
          place_name: feature.place_name,
          center: feature.center as [number, number],
        }))
      );
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
  };

  const handleSearchResultClick = (result: { place_name: string, center: [number, number] }) => {
    justSelectedRef.current = true;
    setSearchValue(result.place_name);
    setSearchResults([]);
    setShowSearchResults(false);
    onSearchSelect?.(result.center[0], result.center[1]);
  };

  // Enter key selects first result
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      handleSearchResultClick(searchResults[0]);
    }
  };

  // Debounce search
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    const timeoutId = setTimeout(() => {
      handleSearch(searchValue);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

    // --- Filter handlers ---
  const handlePortTypeToggle = (portType: string) => {
    const newSelectedTypes = selectedPortTypes.includes(portType)
      ? selectedPortTypes.filter(t => t !== portType)
      : [...selectedPortTypes, portType];

    onPortTypeFilterChange?.(newSelectedTypes);
  };

  // --- Nearby Pins helpers ---
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const checkNearbyPins = async (latitude: number, longitude: number): Promise<void> => {
    try {
      setIsCheckingNearbyPins(true);
      const outletsRef = collection(db, "Outlets");
      const outletsSnap = await getDocs(outletsRef);
      const allPins: PinData[] = outletsSnap.docs.map(docSnap => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          lat: data.latitude ?? data.lat,
          lng: data.longitude ?? data.lng,
          title: data.locationName || "",
          description: data.description || "",
          category: data.chargerType || "",
          fromDb: true
        };
      });
      // within 10km, exclude essentially same point (< ~10m)
      const nearbyPins = allPins.filter((pin: PinData) => {
        if (pin.lat == null || pin.lng == null) return false;
        const distance = calculateDistance(latitude, longitude, pin.lat, pin.lng);
        return distance <= 10 && distance > 0.01;
      });

      if (nearbyPins.length === 0) {
        setNearbyPinsMessage("No charging outlets found within 10km of this location.");
        setHasNearbyPins(false);
      } else {
        setNearbyPinsMessage(`Found ${nearbyPins.length} outlet(s) within 10km.`);
        setHasNearbyPins(true);
      }
      setTimeout(() => setNearbyPinsMessage(""), 7000);
    } catch (error) {
      console.error("Error checking nearby pins:", error);
      setNearbyPinsMessage("");
      setHasNearbyPins(null);
    } finally {
      setIsCheckingNearbyPins(false);
    }
  };

  useEffect(() => {
    if (searchCoords?.lat != null && searchCoords?.lng != null) {
      checkNearbyPins(searchCoords.lat, searchCoords.lng);
    }
  }, [searchCoords, isExisting]);

  return (
    <>
      <div className="fixed top-4 left-0 w-full flex items-center justify-between px-8 z-50 h-14">
        {/* search bar */}
        <div className={`relative flex items-center px-4 h-full backdrop-blur-sm border font-semibold rounded-full shadow-lg w-[360px]
          ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
          <input
            type="text"
            placeholder="Search Electriumap"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={`bg-transparent outline-none w-full text-md ${lightMode ? "placeholder-black/60" : "placeholder-white/60"}`}
          />
          <LucideSearch className="w-5 h-5 font-semibold" />
          {/* search results dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className={`absolute top-full left-0 w-full mt-2 bg-white/10 font-semibold rounded-lg shadow-lg max-h-60 overflow-y-auto border backdrop-blur-sm
              ${lightMode ? "border-white/60 text-black" : "border-white/60 text-white"}`}>
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
          <div className={`relative flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border rounded-xl shadow-md
            ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
            <div
              className={`absolute top-0 h-full w-1/2 rounded-xl transition-all duration-300 ${lightMode ? 'left-0 bg-lime-600/40' : 'left-1/2 bg-lime-900/70'}`}
            />
            <button onClick={() => setLightMode(true)} className="z-10 w-1/2 h-full flex items-center justify-center">
              <SunMedium className="w-8 h-8" />
            </button>
            <button onClick={() => setLightMode(false)} className="z-10 w-1/2 h-full flex items-center justify-center">
              <Moon className="w-7 h-7" />
            </button>
          </div>

          {/* filter button with dropdown */}
          <div className="relative">
            <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border rounded-xl shadow-md
              ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
              <button
                className="flex items-center gap-3 text-base"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <span>Filter</span>
                <ChevronDown className={`w-4 h-4 bold transition-transform ${showFilterDropdown ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Filter dropdown - matches existing button style */}
            {showFilterDropdown && (
              <div className={`absolute top-full right-0 mt-2 w-52 backdrop-blur-sm border rounded-2xl shadow-lg overflow-hidden z-50
                ${lightMode ? "bg-white/5 border-white/60" : "bg-white/15 border-white/60"}`}>

                {/* Header */}
                <div className={`px-4 py-3 border-b font-semibold text-base
                  ${lightMode ? "border-white/30 text-black" : "border-white/20 text-white"}`}>
                  Port Types
                </div>

                {/* Port type options - stacked list */}
                <div className="py-2">
                  {portOptions.map((portType) => (
                    <button
                      key={portType}
                      className={`w-full px-4 py-3 text-left font-semibold transition-all text-base
                        ${selectedPortTypes.includes(portType)
                          ? (lightMode
                              ? "bg-lime-600/40 text-black border-l-4 border-lime-600"
                              : "bg-lime-900/70 text-white border-l-4 border-lime-500")
                          : (lightMode
                              ? "text-black hover:bg-white/20"
                              : "text-white hover:bg-white/10")
                        }`}
                      onClick={() => handlePortTypeToggle(portType)}
                    >
                      {portType}
                    </button>
                  ))}
                </div>

                {/* Clear filters button */}
                {selectedPortTypes.length > 0 && (
                  <div className={`px-3 py-3 border-t ${lightMode ? "border-white/30" : "border-white/20"}`}>
                    <button
                      onClick={() => onPortTypeFilterChange?.([])}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all text-white
                        ${lightMode ? "bg-lime-600 hover:bg-lime-700" : "bg-lime-700 hover:bg-lime-800"}`}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* toolbar */}
          <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border rounded-xl shadow-md
            ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
            <button 
              onClick={() => setShowSavedOutlets((prev) => !prev)}
              className={`flex flex-col items-center justify-center w-14 h-14 ${
                showSavedOutlets ?  'text-lime-600' : ''
              }`}
            >
              <LucideBookmark className="w-6 h-6" />
              <span className="text-[10px] mt-1 whitespace-nowrap">Saved</span>
            </button>

            <button className="flex flex-col items-center justify-center w-14 h-14">
              <LucideClock className="w-6 h-6" />
              <span className="text-[10px] mt-1 whitespace-nowrap">Recents</span>
            </button>

            <button
              onClick={() => setShowAddOutlet((prev) => !prev)}
              className="flex flex-col items-center justify-center text-lime-600 w-16 h-14"
            >
              <LucidePlus className="w-7 h-7 text-lime-600" />
              <span className="text-[10px] whitespace-nowrap">Add Outlet</span>
            </button>

            {/* locate / follow button */}
            <button
              onClick={() => {
                const current = !!isLocatingToggleProp;
                if (current) {
                  // stop following
                  onStopFollow?.();
                } else {
                  // trigger a locate and start following (MapBox will notify page on success)
                  onGeoLocateClick?.();
                  onStartFollow?.();
                }
              }}
              title={isLocatingToggleProp ? 'Stop tracking' : 'Show my location'}
              className={`flex flex-col items-center justify-center w-14 h-14 ${isLocatingToggleProp ? 'text-lime-600' : ''}`}
            >
              <LucideNavigation className="w-6 h-6" />
              <span className="text-[10px] mt-1 whitespace-nowrap">Locate</span>
            </button>
          </div>

          {/* profile / sign in */}
          {getIsAuthenticated() ? (
            <div
              className={`flex items-center justify-center h-14 aspect-square rounded-xl backdrop-blur-sm border shadow-md font-semibold text-sm w-14 cursor-pointer overflow-hidden
                ${lightMode ? "bg-white/5 border-white/60" : "bg-white/15 border-white/60"}`}
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              {profileImageUrl ? (
                <Image
                  src={profileImageUrl}
                  alt="Profile"
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                  unoptimized
                  priority
                  loading="eager"
                />
              ) : (
                <span className={`${lightMode ? "text-black" : "text-white"}`}>
                  {userName ? `${userName.split(' ')[0][0]}${userName.split(' ')[1]?.[0] || ''}` : ''}
                </span>
              )}
            </div>
          ) : (
            <div className={`flex items-stretch justify-between gap-6 px-6 h-14 backdrop-blur-sm font-semibold border rounded-xl shadow-md bg-lime-700`}>
              <button onClick={() => router.push('/login')} className="flex items-center gap-3 text-base">
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Saved Outlets Modal */}
      {showSavedOutlets && (
        <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm border-1 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
          
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Saved Outlets</h2>
            <button 
              onClick={() => setShowSavedOutlets(false)}
              className="text-2xl hover:opacity-70"
            >
              ×
            </button>
          </div>

          {/* Placeholder Cards */}
          <div className="space-y-3">
            {/* Card 1 */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
              <img
                src="/images/pin_lightning.webp"
                alt="Outlet pin"
                loading="lazy"
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div>
                <div className="font-medium">User Named Title</div>
                <div className="text-sm opacity-70">123 University Ave, Waterloo, ON LH387H</div>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
              <img
                src="/images/pin_lightning.webp"
                alt="Outlet pin"
                loading="lazy"
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div>
                <div className="font-medium">User Named Title</div>
                <div className="text-sm opacity-70">123 University Ave, Waterloo, ON LH387H</div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/10">
              <img
                src="/images/pin_lightning.webp"
                alt="Outlet pin"
                loading="lazy"
                className="w-16 h-16 object-contain rounded-lg"
              />
              <div>
                <div className="font-medium">User Named Title</div>
                <div className="text-sm opacity-70">123 University Ave, Waterloo, ON LH387H</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Outlet 5-Step Wizard Modal */}
      {showAddOutlet && (
        <div className={`fixed top-[95px] right-6 z-50 p-6 backdrop-blur-sm border-1 rounded-4xl shadow-lg w-112 max-h-[calc(100vh-140px)] min-h-[140px] overflow-auto overflow-x-hidden scrollbar-hide custom-scrollbar flex flex-col
          ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}>
          
          {/* Progress Bar */}
          <div className="flex justify-between mb-4 relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/20 -translate-y-1/2 z-0"></div>
            {[1, 2, 3, 4, 5].map(step => (
              <div key={step} className="relative z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep 
                        ? (lightMode ? 'bg-lime-600 text-white' : 'bg-lime-600 text-white')
                        : (lightMode ? 'bg-gray-200 text-black/60' : 'bg-white/30 text-white/60')
                }`}>
                  {step}
                </div>
              </div>
            ))}
          </div>

          {/* Step Indicator */}
          {/*<div className="text-center mb-6 text-sm opacity-70">
            Step {currentStep} of 5
          </div>*/}

          {/* electrium logo */}
          <div className="flex justify-center mb-4">
            <div className="w-1/3">
              <img src="/images/electrium.png" className="w-full h-auto"></img>
            </div>
          </div>
            
          {/* Step Content */}
          <div className="flex-grow mb-6">
            {/* Step 1: Welcome & Location */}
            {currentStep === 1 && (
              <Step1
                address={address}
                onAddressChange={setAddress}
                lightMode={lightMode}
                isExisting={isExisting}
                onGeoLocateClick={onGeoLocateClick}
              />
            )}

            {/* Step 2: Outlet Count & Power Type (Merged) */}
            {currentStep === 2 && (
              <Step2
                outletCount={outletCount}
                onOutletCountChange={handleOutletCountChange}
                powerType={powerType}
                onPowerTypeChange={setPowerType}
                lightMode={lightMode}
                isExisting={isExisting}
              />
            )}

            {/* Step 3: Port Type & Condition (Merged) */}
            {currentStep === 3 && (
              <Step3
                selectedPort={selectedPort}
                onPortChange={setSelectedPort}
                otherPort={otherPort}
                onOtherPortChange={setOtherPort}
                condition={condition}
                onConditionChange={setCondition}
                lightMode={lightMode}
                isExisting={isExisting}
              />
            )}

            {/* Step 4: Extra Details & File Upload */}
            {currentStep === 4 && (
              <Step4
                extraDetails={extraDetails}
                onExtraDetailsChange={setExtraDetails}
                images={images}
                onImageUpload={handleImageUpload}
                onRemoveImage={handleRemoveImage}
                lightMode={lightMode}
                isExisting={isExisting}
              />
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <ReviewStep
                formData={formData}
                lightMode={lightMode}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between w-full">
            <button
              onClick={() => {
                if (currentStep === 1) {
                  setShowAddOutlet(false);
                  if (!isExisting) {
                    onCancelTempPin?.();
                  }
                  onClose();
                  setCurrentStep(1);
                } else {
                  handleBack();
                }
              }}
              className="text-md font-semibold text-white bg-red-600 rounded-4xl px-6 py-2 hover:bg-red-700 transition-colors"
            >
              {currentStep === 1 ? (isExisting ? "Close" : "Cancel") : "Back"}
            </button>

            {!isExisting && (
              <button
                onClick={currentStep === 5 ? handleSubmit : handleNext}
                disabled={
                  (currentStep === 1 && !address.trim()) ||
                  (currentStep === 2 && (outletCount < 1 || !powerType.trim())) ||
                  (currentStep === 3 && ((!selectedPort && !otherPort.trim()) || !condition)) ||
                  (currentStep === 4 && !extraDetails.trim())
                }
                className={`text-md font-semibold rounded-4xl px-6 py-2 transition-colors ${
                  (currentStep === 1 && !address.trim()) ||
                  (currentStep === 2 && (outletCount < 1 || !powerType.trim())) ||
                  (currentStep === 3 && ((!selectedPort && !otherPort.trim()) || !condition)) ||
                  (currentStep === 4 && !extraDetails.trim())
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-lime-700 hover:bg-lime-800'
                }`}
              >
                <div className='text-white'>
                {currentStep === 5 ? "Submit" : "Next"}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selected pin overlays */}
      {!showAddOutlet && showPinOverlay && (
        selectedPin ? (
          <div
            className={`fixed top-[95px] right-6 z-50 p-4 rounded-[22px] shadow-lg w-[325px] max-h-[calc(100vh-140px)] overflow-auto backdrop-blur-sm border
        ${lightMode ? "bg-white/5 border-white/60 text-black" : "bg-white/15 border-white/60 text-white"}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <LucideBookmark className="w-5 h-5 opacity-90" />
                <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
                  {selectedPin.title || "Unknown Location"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-white/20 transition"
                aria-label="Close"
                title="Close"
              >
                <LucideX className="w-6 h-6" />
              </button>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-5 text-base opacity-90 mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>0.1 km</span>
              </div>
              <div className="flex items-center gap-1">
                <LucideClock className="w-4 h-4" />
                <span>5 min</span>
              </div>
              <div className="flex items-center gap-1">
                <LucideStar className="w-4 h-4" />
                <span>4.9 (2078)</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-3">
              <div className="flex items-center gap-6">
                <button className="pb-2 font-semibold relative after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:bg-white/80">
                  Overview
                </button>
                <button className="pb-2 opacity-60 cursor-not-allowed">Photos</button>
                <button className="pb-2 opacity-60 cursor-not-allowed">Reviews</button>
              </div>
              <div className="h-px w-full bg-white/30" />
            </div>

            {/* Media placeholder */}
            <div
              className={`h-40 rounded-xl mb-4 border-2 border-dashed flex items-center justify-center
          ${lightMode ? "bg-white/10 border-white/40" : "bg-white/10 border-white/30"}`}
            >
              <span className="opacity-60 text-sm">Photos coming soon</span>
            </div>

            {/* Details */}
            <div className="space-y-3 text-[15px]">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <div>
                  <span className="font-semibold">Address: </span>
                  <span>{selectedPin.title || "123 University Ave, Waterloo, ON LH387H"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <LucidePlugZap className="w-4 h-4 mt-0.5" />
                <div>
                  <span className="font-semibold">Power: </span>
                  <span>{selectedPin.category || "Lorem Ipsum"}</span>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <LucideStar className="w-4 h-4 mt-0.5" />
                <div>
                  <span className="font-semibold">Rating: </span>
                  <span>{"—"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button className="px-2 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#457E00] text-white font-semibold inline-flex items-center gap-1.5">
                <LucideNavigation className="w-5 h-5" />
                Directions
              </button>
              <button className="px-2 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#457E00] text-white font-semibold inline-flex items-center gap-1.5">
                <LucidePlayCircle className="w-5 h-5" />
                Start
              </button>
              <button className="px-2 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#457E00] text-white font-semibold inline-flex items-center gap-1.5">
                <Save className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        ) : (

          <div className={`fixed top-[95px] right-6 z-50 p-6 rounded-3xl shadow-lg w-[380px] backdrop-blur-sm border
      ${lightMode ? "bg-white/5 border-white/60 text-white" : "bg-white/15 border-white/60 text-white"}`}>
            <h2 className="text-lg font-semibold mb-2">You dropped a pin!</h2>
            <p>Longitude: {coords?.lng?.toFixed(5)}</p>
            <p>Latitude:  {coords?.lat?.toFixed(5)}</p>
            <button onClick={onClose} className="mt-3 px-4 py-2 rounded-2xl bg-lime-700 hover:bg-lime-800 font-semibold">
              Close
            </button>
          </div>
        )
      )}

      {/* Nearby Pins banner */}
      {!isExisting && (nearbyPinsMessage || isCheckingNearbyPins) && (
        <div className={`fixed top-20 left-8 z-50 backdrop-blur-md border rounded-2xl shadow-xl p-4 max-w-md transition-all duration-300 ${isCheckingNearbyPins
          ? (lightMode ? "bg-blue-100/80 border-blue-300 text-blue-900" : "bg-blue-900/40 border-blue-500/60 text-blue-100")
          : hasNearbyPins
            ? (lightMode ? "bg-green-100/80 border-green-300 text-green-900" : "bg-green-900/40 border-green-500/60 text-green-100")
            : (lightMode ? "bg-yellow-100/80 border-yellow-300 text-yellow-900" : "bg-yellow-900/40 border-yellow-500/60 text-yellow-100")
          }`}>
          {isCheckingNearbyPins ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              <p className="font-semibold text-sm">Checking nearby outlets...</p>
            </div>
          ) : (
            <>
              <p className="font-semibold text-sm mb-1">
                {hasNearbyPins ? "🔋 Nearby Outlets Found" : "⚠️ No Nearby Outlets"}
              </p>
              <p className="text-sm">{nearbyPinsMessage}</p>
            </>
          )}
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed top-1/2 left-1/2 z-50 w-[400px] max-w-full p-0 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`relative bg-gradient-to-br from-white/30 via-black/20 to-white/10 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl px-8 pt-8 pb-6 flex flex-col items-center ${lightMode ? "text-black" : "text-white"}`}>
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 transition-colors rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              aria-label="Close"
            >
              <span className="text-2xl font-bold leading-none">×</span>
            </button>

            <div className="flex items-start mb-6 w-full">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center shadow-lg mb-2">
                  {profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt="Profile"
                      width={64}
                      height={64}
                      className="object-cover w-full h-full rounded-full"
                      unoptimized
                      priority
                      loading="eager"
                    />
                  ) : (
                    <span className="text-2xl font-bold">
                      {userName ? `${userName.split(' ')[0][0]}${userName.split(' ')[1]?.[0] || ''}` : ''}
                    </span>
                  )}
                </div>

                <label
                  className="absolute bottom-1 -right-0 z-10 flex items-center justify-center h-5 w-5 rounded-full bg-lime-600 text-white shadow-md cursor-pointer hover:bg-lime-700"
                  title="Change profile picture"
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    disabled={isUpdatingProfileImage}
                  />
                  <Plus className="w-3 h-3" />
                </label>
              </div>

              <div className="ml-4 flex flex-col w-full min-w-0">
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  {userName || ''}
                </div>
                <div className={`text-sm ${lightMode ? "text-black/40" : "text-neutral-400"}`}>
                  {userEmail || ''}
                </div>
              </div>
            </div>

            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Bike className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  My Vehicles
                </div>
              </div>

              <div className="rounded-xl backdrop-blur-md max-h-24 overflow-y-auto">
                {vehicles.length > 0 ? (
                  vehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      className={`flex items-center justify-between w-full px-4 py-2 rounded-md h-12 ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                    >
                      <span>{vehicle.title}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ))
                ) : (
                  <div className={`${lightMode ? "text-black/40" : "text-neutral-100"} px-4 py-2`}>
                    No vehicles added yet
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col gap-2 pt-3">
              <div className="flex items-center gap-2">
                <PlugZap className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  My Shared Outlets
                </div>
              </div>

              <div className="rounded-xl backdrop-blur-md max-h-24 overflow-y-auto">
                {userOutlets.length > 0 ? (
                  userOutlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      className={`flex items-center justify-between w-full px-4 py-2 rounded-md h-12 ${lightMode ? "hover:bg-lime-600/30" : "hover:bg-lime-900"}`}
                    >
                      <span className="truncate max-w-[280px]" title={outlet.locationName}>
                        {outlet.locationName}
                      </span>
                      <ArrowRight className="w-5 h-5 flex-shrink-0" />
                    </button>
                  ))
                ) : (
                  <div className={`${lightMode ? "text-black/40" : "text-neutral-100"} px-4 py-2`}>
                    No outlets shared yet
                  </div>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col pt-3 pb-1">
              <div className="flex items-center gap-2">
                <User className={`${lightMode ? "text-black" : "text-neutral-100"}`} />
                <div className={`text-lg font-semibold ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  Account
                </div>
              </div>

              <div className="rounded-xl backdrop-blur-md">
                {hasEmailPasswordProvider() ? (
                  <button
                    onClick={() => {
                      setShowChangePassword(true);
                      setPasswordError("");
                      setPasswordSuccess("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${lightMode ? "hover:bg-lime-600/40" : "hover:bg-lime-900"}`}
                  >
                    Change Password
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <div className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${lightMode ? "text-black/50" : "text-neutral-400"}`}>
                    <span>Change Password</span>
                    <span className="text-xs">(Google accounts)</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    signOut(auth)
                      .then(() => {
                        setIsAuthenticated(false);
                        setShowSettings(false);
                        setUserData({
                          email: '',
                          password: '',
                          firstName: '',
                          lastName: '',
                          profileImage: null,
                          profileImagePreview: '',
                          vehicle: { title: '', type: '' },
                        });
                        setUserName('');
                        setUserEmail('');
                        setVehicles([]);
                        setUserOutlets([]);
                        setProfileImageUrl('');
                      })
                      .catch((error) => console.error("Sign-out error:", error));
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${lightMode ? "hover:bg-lime-600/40" : "hover:bg-lime-900"}`}
                >
                  Logout
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button className={`flex items-center justify-between w-full px-4 py-2 rounded-md ${lightMode ? "hover:bg-red-600/40" : "hover:bg-red-900"}`}>
                  Delete Account
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => {
              if (!isChangingPassword) {
                setShowChangePassword(false);
                setPasswordError("");
                setPasswordSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }
            }}
          />
          {/* Modal */}
          <div className="fixed top-1/2 left-1/2 z-50 w-[400px] max-w-full p-0 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`relative bg-gradient-to-br from-white/30 via-black/20 to-white/10 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl px-8 pt-8 pb-6 ${lightMode ? "text-black" : "text-white"}`}>
            <button
              onClick={() => {
                setShowChangePassword(false);
                setPasswordError("");
                setPasswordSuccess("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute top-4 right-4 bg-white/15 hover:bg-white/25 transition-colors rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
              aria-label="Close"
            >
              <LucideX className="w-6 h-6" />
            </button>

            <h2 className={`text-2xl font-bold mb-6 ${lightMode ? "text-black" : "text-white"}`}>
              Change Password
            </h2>

            {!hasEmailPasswordProvider() && (
              <div className="px-4 py-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50 text-yellow-200 text-sm mb-4">
                Password change is only available for accounts signed in with email and password. Google account users should manage their password through their Google account settings.
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:border-lime-500 ${lightMode ? "text-black placeholder-black/60" : "text-white placeholder-white/60"}`}
                  placeholder="Enter current password"
                  disabled={isChangingPassword || !hasEmailPasswordProvider()}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:border-lime-500 ${lightMode ? "text-black placeholder-black/60" : "text-white placeholder-white/60"}`}
                  placeholder="Enter new password (min. 6 characters)"
                  disabled={isChangingPassword || !hasEmailPasswordProvider()}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${lightMode ? "text-black" : "text-neutral-100"}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 focus:outline-none focus:border-lime-500 ${lightMode ? "text-black placeholder-black/60" : "text-white placeholder-white/60"}`}
                  placeholder="Confirm new password"
                  disabled={isChangingPassword || !hasEmailPasswordProvider()}
                />
              </div>

              {passwordError && (
                <div className="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/50 text-green-200 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordError("");
                    setPasswordSuccess("");
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${lightMode ? "bg-gray-300 hover:bg-gray-400 text-black" : "bg-white/15 hover:bg-white/25 text-white"}`}
                  disabled={isChangingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isChangingPassword || !hasEmailPasswordProvider()}
                >
                  {isChangingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default AddOutlet;