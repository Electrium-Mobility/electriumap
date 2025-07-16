// Backend Upload Testing Platform - JavaScript Handler
// This file provides the UI interactions and data preparation
// Backend team should replace the placeholder upload functions with Firebase logic

// Console capture and display functionality
class ConsoleCapture {
  constructor() {
    this.originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };
    this.initializeConsoleCapture();
  }

  initializeConsoleCapture() {
    const consoleOutput = document.getElementById("consoleOutput");
    const clearButton = document.getElementById("clearConsole");
    const toggleButton = document.getElementById("consoleToggle");
    const minimizeButton = document.getElementById("minimizeConsole");
    const fixedConsole = document.getElementById("fixedConsole");

    // Console toggle functionality
    let isConsoleOpen = false;

    toggleButton.addEventListener("click", () => {
      isConsoleOpen = !isConsoleOpen;
      if (isConsoleOpen) {
        fixedConsole.classList.add("open");
        fixedConsole.classList.remove("minimized");
        document.body.classList.add("console-open");
        toggleButton.textContent = "📝 Hide Console";
      } else {
        fixedConsole.classList.remove("open");
        fixedConsole.classList.remove("minimized");
        document.body.classList.remove("console-open");
        toggleButton.textContent = "📝 Show Console";
      }
    });

    // Minimize/maximize functionality
    let isMinimized = false;

    minimizeButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent header click
      isMinimized = !isMinimized;
      if (isMinimized) {
        fixedConsole.classList.add("minimized");
        minimizeButton.textContent = "□";
      } else {
        fixedConsole.classList.remove("minimized");
        minimizeButton.textContent = "−";
      }
    });

    // Click header to minimize/maximize
    const consoleHeader = fixedConsole.querySelector(".console-header");
    consoleHeader.addEventListener("click", (e) => {
      if (e.target === clearButton || e.target === minimizeButton) return;
      minimizeButton.click();
    });

    // Override console methods
    console.log = (...args) => {
      this.originalConsole.log(...args);
      this.addConsoleMessage("log", args.join(" "));
    };

    console.warn = (...args) => {
      this.originalConsole.warn(...args);
      this.addConsoleMessage("warn", args.join(" "));
    };

    console.error = (...args) => {
      this.originalConsole.error(...args);
      this.addConsoleMessage("error", args.join(" "));
    };

    console.info = (...args) => {
      this.originalConsole.info(...args);
      this.addConsoleMessage("info", args.join(" "));
    };

    // Add clear button functionality
    clearButton.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent header click
      this.clearConsole();
    });

    // Add a custom success method for positive feedback
    console.success = (...args) => {
      this.originalConsole.log(...args);
      this.addConsoleMessage("success", args.join(" "));
    };

    // Catch unhandled JavaScript errors
    window.addEventListener("error", (event) => {
      this.addConsoleMessage(
        "error",
        `JavaScript Error: ${event.message} (Line: ${event.lineno})`
      );
    });

    // Catch unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.addConsoleMessage(
        "error",
        `Unhandled Promise Rejection: ${event.reason}`
      );
    });

    // Auto-open console on first message
    this.autoOpenOnFirstMessage = true;
  }

  addConsoleMessage(type, message) {
    const consoleOutput = document.getElementById("consoleOutput");
    const fixedConsole = document.getElementById("fixedConsole");
    const toggleButton = document.getElementById("consoleToggle");

    // Auto-open console on first real message (not the initial one)
    if (
      this.autoOpenOnFirstMessage &&
      !message.includes("Console initialized")
    ) {
      if (!fixedConsole.classList.contains("open")) {
        fixedConsole.classList.add("open");
        document.body.classList.add("console-open");
        toggleButton.textContent = "📝 Hide Console";
      }
      this.autoOpenOnFirstMessage = false;
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `console-message ${type}`;

    // Add timestamp
    const timestamp = new Date().toLocaleTimeString();
    messageDiv.textContent = `[${timestamp}] ${message}`;

    consoleOutput.appendChild(messageDiv);

    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;

    // Limit to last 100 messages to prevent memory issues
    const messages = consoleOutput.children;
    if (messages.length > 100) {
      consoleOutput.removeChild(messages[1]); // Keep the first "initialized" message
    }
  }

  clearConsole() {
    const consoleOutput = document.getElementById("consoleOutput");
    consoleOutput.innerHTML =
      '<div class="console-message info">Console cleared. Check here for debug information...</div>';
  }
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyApxNuehMUOxEDybG45Eymv8er6bqCB6mQ",
  authDomain: "electriumap.firebaseapp.com",
  projectId: "electriumap",
  storageBucket: "electriumap.firebasestorage.app",
  messagingSenderId: "369697728783",
  appId: "1:369697728783:web:2e4be6df906e1f66c2f67a",
  measurementId: "G-FSV8JQKCLN",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class UploadHandler {
  constructor() {
    this.selectedImages = [];
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Image upload listeners
    this.setupImageUpload();

    // Point data listeners
    this.setupPointDataForm();

    // Random coordinates listener
    this.setupRandomCoordinates();

    // Custom dropdown
    this.setupCustomDropdown();
  }

  // === IMAGE UPLOAD SECTION ===
  setupImageUpload() {
    const imageUploadArea = document.getElementById("imageUploadArea");
    const imageInput = document.getElementById("imageInput");
    const uploadImageBtn = document.getElementById("uploadImageBtn");

    // Click to upload
    imageUploadArea.addEventListener("click", () => {
      imageInput.click();
    });

    // Drag and drop
    imageUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      imageUploadArea.classList.add("dragover");
    });

    imageUploadArea.addEventListener("dragleave", () => {
      imageUploadArea.classList.remove("dragover");
    });

    imageUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      imageUploadArea.classList.remove("dragover");
      const files = Array.from(e.dataTransfer.files);
      this.handleImageFiles(files);
    });

    // File input change
    imageInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      this.handleImageFiles(files);
    });

    // Upload button
    uploadImageBtn.addEventListener("click", () => {
      this.uploadImages();
    });
  }

  handleImageFiles(files) {
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB

      if (!isValidType) {
        this.showResult(
          "imageResults",
          "error",
          `${file.name} is not a valid image file`
        );
        return false;
      }

      if (!isValidSize) {
        this.showResult(
          "imageResults",
          "error",
          `${file.name} is too large (max 10MB)`
        );
        return false;
      }

      return true;
    });

    this.selectedImages = [...this.selectedImages, ...validFiles];
    this.updateImagePreview();
    this.updateImageUploadButton();
  }

  updateImagePreview() {
    const previewContainer = document.getElementById("imagePreview");
    previewContainer.innerHTML = "";

    this.selectedImages.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewDiv = document.createElement("div");
        previewDiv.className = "image-preview";

        previewDiv.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-btn" onclick="uploadHandler.removeImage(${index})">×</button>
                `;

        previewContainer.appendChild(previewDiv);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index) {
    this.selectedImages.splice(index, 1);
    this.updateImagePreview();
    this.updateImageUploadButton();
  }

  updateImageUploadButton() {
    const uploadBtn = document.getElementById("uploadImageBtn");
    uploadBtn.disabled = this.selectedImages.length === 0;
  }

  // === POINT DATA SECTION ===
  setupPointDataForm() {
    const uploadPointBtn = document.getElementById("uploadPointBtn");

    uploadPointBtn.addEventListener("click", () => {
      this.uploadPoint();
    });

    // Form validation on input
    const requiredFields = ["pointName", "pointType", "latitude", "longitude"];
    requiredFields.forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      field.addEventListener("input", () => {
        this.validatePointForm();
      });
    });
  }

  validatePointForm() {
    const name = document.getElementById("pointName").value.trim();
    const type = document.getElementById("pointType").value;
    const lat = parseFloat(document.getElementById("latitude").value);
    const lng = parseFloat(document.getElementById("longitude").value);

    const isValid =
      name &&
      type &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    return isValid;
  }

  collectPointData() {
    return {
      name: document.getElementById("pointName").value.trim(),
      type: document.getElementById("pointType").value,
      latitude: parseFloat(document.getElementById("latitude").value),
      longitude: parseFloat(document.getElementById("longitude").value),
      description: document.getElementById("pointDescription").value.trim(),
      tags: document
        .getElementById("pointTags")
        .value.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      timestamp: new Date().toISOString(),
      id: this.generateId(),
    };
  }

  // === RANDOM COORDINATES ===
  setupRandomCoordinates() {
    const generateRandomBtn = document.getElementById("generateRandomCoords");

    generateRandomBtn.addEventListener("click", () => {
      this.generateRandomCoordinates();
    });
  }

  // === CUSTOM DROPDOWN ===
  setupCustomDropdown() {
    const selectSelected = document.getElementById("selectSelected");
    const selectItems = document.getElementById("selectItems");
    const pointTypeInput = document.getElementById("pointType");

    selectSelected.addEventListener("click", () => {
      console.log("📋 Point type dropdown clicked");
      selectItems.classList.toggle("select-hide");
      selectSelected.classList.toggle("select-arrow-active");
    });

    const items = selectItems.querySelectorAll("div");
    items.forEach((item) => {
      item.addEventListener("click", (e) => {
        const value = e.target.getAttribute("data-value");
        const text = e.target.textContent;

        selectSelected.textContent = text;
        pointTypeInput.value = value;

        selectItems.classList.add("select-hide");
        selectSelected.classList.remove("select-arrow-active");

        // Remove active class from all items
        items.forEach((i) => i.classList.remove("same-as-selected"));
        // Add active class to selected item
        e.target.classList.add("same-as-selected");

        console.success(`✅ Point type selected: ${text} (${value})`);
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-select")) {
        selectItems.classList.add("select-hide");
        selectSelected.classList.remove("select-arrow-active");
      }
    });
  }

  generateRandomCoordinates() {
    console.log("🎲 Generating random coordinates...");

    // Generate random coordinates within reasonable bounds
    // Latitude: -90 to 90, Longitude: -180 to 180
    const latitude = (Math.random() * 180 - 90).toFixed(6);
    const longitude = (Math.random() * 360 - 180).toFixed(6);

    document.getElementById("latitude").value = latitude;
    document.getElementById("longitude").value = longitude;

    console.success(
      `📍 Random coordinates generated: ${latitude}, ${longitude}`
    );

    this.showResult(
      "pointResults",
      "success",
      `Random coordinates generated: ${latitude}, ${longitude}`
    );
  }

  // === UPLOAD FUNCTIONS (TO BE REPLACED BY BACKEND TEAM) ===

  async uploadImages() {
    if (this.selectedImages.length === 0) return;

    const uploadBtn = document.getElementById("uploadImageBtn");
    const uploadText = document.getElementById("uploadImageText");
    const spinner = document.getElementById("imageSpinner");

    // Show loading state
    uploadBtn.disabled = true;
    uploadText.textContent = "Uploading...";
    spinner.style.display = "block";

    try {
      // Collect metadata
      const metadata = {
        title: document.getElementById("imageTitle").value.trim(),
        description: document.getElementById("imageDescription").value.trim(),
        timestamp: new Date().toISOString(),
        fileCount: this.selectedImages.length,
      };

      // TODO: Replace this with actual Firebase upload logic
      const result = await this.simulateFirebaseImageUpload(
        this.selectedImages,
        metadata
      );

      this.showResult(
        "imageResults",
        "success",
        `Successfully uploaded ${this.selectedImages.length} image(s). ${result.message}`
      );

      // Reset form
      this.selectedImages = [];
      this.updateImagePreview();
      document.getElementById("imageTitle").value = "";
      document.getElementById("imageDescription").value = "";
    } catch (error) {
      this.showResult(
        "imageResults",
        "error",
        `Upload failed: ${error.message}`
      );
    } finally {
      uploadBtn.disabled = false;
      uploadText.textContent = "Upload Images to Firebase";
      spinner.style.display = "none";
      this.updateImageUploadButton();
    }
  }

  async uploadPoint() {
    console.log("🔄 Starting point upload process...");

    if (!this.validatePointForm()) {
      console.error("❌ Form validation failed - missing required fields");
      this.showResult(
        "pointResults",
        "error",
        "Please fill in all required fields with valid data"
      );
      return;
    }

    console.success("✅ Form validation passed");

    const uploadBtn = document.getElementById("uploadPointBtn");
    const uploadText = document.getElementById("uploadPointText");
    const spinner = document.getElementById("pointSpinner");

    uploadBtn.disabled = true;
    uploadText.textContent = "Uploading...";
    spinner.style.display = "block";

    try {
      const pointData = this.collectPointData();
      console.log("📊 Point data collected:", pointData);

      // TODO: Replace this with actual Firebase upload logic
      const result = await this.simulateFirebasePointUpload(pointData);

      console.success(`🎉 Point uploaded successfully: ${pointData.name}`);

      this.showResult(
        "pointResults",
        "success",
        `Successfully uploaded point: ${pointData.name}. ${result.message}`
      );

      // Reset form
      document.getElementById("pointName").value = "";
      document.getElementById("pointType").value = "";
      document.getElementById("selectSelected").textContent = "Select type...";
      document.getElementById("latitude").value = "";
      document.getElementById("longitude").value = "";
      document.getElementById("pointDescription").value = "";
      document.getElementById("pointTags").value = "";

      console.log("🔄 Form reset completed");
    } catch (error) {
      console.error("💥 Upload failed:", error.message);
      this.showResult(
        "pointResults",
        "error",
        `Upload failed: ${error.message}`
      );
    } finally {
      uploadBtn.disabled = false;
      uploadText.textContent = "Upload Point to Firebase";
      spinner.style.display = "none";
    }
  }

  // === SIMULATION FUNCTIONS (REPLACE WITH FIREBASE) ===

  async simulateFirebaseImageUpload(images, metadata) {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("=== IMAGE UPLOAD DATA ===");
    console.log("Metadata:", metadata);
    console.log(
      "Files:",
      images.map((img) => ({
        name: img.name,
        size: img.size,
        type: img.type,
      }))
    );

    return {
      success: true,
      message: "Data logged to console for Firebase integration",
      imageIds: images.map(() => this.generateId()),
    };
  }

  async simulateFirebasePointUpload(pointData) {
    try {
      const docRef = await addDoc(collection(db, "Outlets"), {
        latitude: pointData.latitude,
        longitude: pointData.longitude,
        userName: "Test User",
        userid: "test123",
        locationName: pointData.name,
        chargerType: pointData.type,
        description: pointData.description,
        tags: pointData.tags || [],
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        message: `Data uploaded to Firestore (ID: ${docRef.id})`,
        pointId: docRef.id,
      };
    } catch (error) {
      console.error("Error uploading to Firestore:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // === UTILITY FUNCTIONS ===

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showResult(containerId, type, message) {
    const container = document.getElementById(containerId);
    container.className = `results ${type}`;
    container.textContent = message;
    container.style.display = "block";

    // Auto-hide after 5 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        container.style.display = "none";
      }, 5000);
    }
  }
}

// Initialize the upload handler when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Initialize console capture first
  window.consoleCapture = new ConsoleCapture();

  // Initialize upload handler
  window.uploadHandler = new UploadHandler();

  console.success("🚀 Backend Upload Testing Platform initialized");
  console.info("👀 All console outputs will now appear above");
  console.log(
    "📝 You can test the point type dropdown, random coordinates, and upload functionality"
  );
});
