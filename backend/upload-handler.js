// Backend Upload Testing Platform - JavaScript Handler
// This file provides the UI interactions and data preparation
// Backend team should replace the placeholder upload functions with Firebase logic

// --- START FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyApxNuehMUOxEDybG45Eymv8er6bqCB6mQ",
    authDomain: "electriumap.firebaseapp.com",
    projectId: "electriumap",
    storageBucket: "electriumap.firebasestorage.app",
    messagingSenderId: "369697728783",
    appId: "1:369697728783:web:2e4be6df906e1f66c2f67a",
    measurementId: "G-FSV8JQKCLN",
};

// Initialize Firebase
let app;
let firestore;
if (typeof firebase !== "undefined") {
    app = firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
}
// --- END FIREBASE CONFIGURATION ---

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
        const requiredFields = [
            "pointName",
            "pointType",
            "latitude",
            "longitude",
        ];
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
            description: document
                .getElementById("pointDescription")
                .value.trim(),
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
        const generateRandomBtn = document.getElementById(
            "generateRandomCoords"
        );

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
        // Generate random coordinates within reasonable bounds
        // Latitude: -90 to 90, Longitude: -180 to 180
        const latitude = (Math.random() * 180 - 90).toFixed(6);
        const longitude = (Math.random() * 360 - 180).toFixed(6);

        document.getElementById("latitude").value = latitude;
        document.getElementById("longitude").value = longitude;

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
                description: document
                    .getElementById("imageDescription")
                    .value.trim(),
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
        if (!this.validatePointForm()) {
            this.showResult(
                "pointResults",
                "error",
                "Please fill in all required fields with valid data"
            );
            return;
        }

        const uploadBtn = document.getElementById("uploadPointBtn");
        const uploadText = document.getElementById("uploadPointText");
        const spinner = document.getElementById("pointSpinner");

        uploadBtn.disabled = true;
        uploadText.textContent = "Uploading...";
        spinner.style.display = "block";

        try {
            const pointData = this.collectPointData();

            // This calls the function that writes directly to Firestore
            const result = await this.simulateFirebasePointUpload(pointData);

            this.showResult(
                "pointResults",
                "success",
                `Successfully uploaded point: ${pointData.name}. ${result.message}`
            );

            // Reset form
            document.getElementById("pointName").value = "";
            document.getElementById("pointType").value = "";
            document.getElementById("latitude").value = "";
            document.getElementById("longitude").value = "";
            document.getElementById("pointDescription").value = "";
            document.getElementById("pointTags").value = "";
        } catch (error) {
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
        if (!firestore) {
            console.error(
                "Firestore not initialized. Simulating upload instead."
            );
            // Fallback to original simulation logic if Firebase isn't configured
            await new Promise((resolve) => setTimeout(resolve, 1000));
            console.log("=== POINT UPLOAD DATA (Simulated) ===");
            console.log("Point Data:", pointData);
            return {
                success: true,
                message: "Data logged to console for Firebase integration",
                pointId: pointData.id,
            };
        }

        try {
            const { latitude, longitude, ...restOfData } = pointData;

            // Create a Firestore GeoPoint for efficient location queries
            const location = new firebase.firestore.GeoPoint(
                latitude,
                longitude
            );

            const docRef = await firestore.collection("outlets").add({
                ...restOfData,
                location: location,
            });

            console.log("=== POINT UPLOAD DATA (Actual) ===");
            console.log("Firestore Document ID:", docRef.id);
            console.log("Point Data:", { ...restOfData, location });

            return {
                success: true,
                message: `Point data saved to Firestore with ID: ${docRef.id}`,
                pointId: docRef.id,
            };
        } catch (error) {
            console.error("Error writing document to Firestore: ", error);
            throw error; // Re-throw the error to be caught by the calling function
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
    window.uploadHandler = new UploadHandler();

    if (typeof firebase !== "undefined" && firestore) {
        console.log(
            "Backend Upload Testing Platform initialized with Firebase"
        );
        console.log(
            "Check console for uploaded data. Point data will be sent to Firebase."
        );
    } else {
        console.warn(
            "Firebase not configured. Point data will be logged to console only."
        );
        console.log(
            "Backend Upload Testing Platform initialized (simulation mode)"
        );
    }
});
