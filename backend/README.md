# 🔧 Backend Upload Testing Platform

A standalone web application for testing image and point data uploads to Firebase. This platform provides a complete UI for the backend team to experiment with Firebase integrations.

## 🚀 Quick Start

1. **Open the platform**: Open `index.html` in your browser or serve it locally
2. **Test the interface**: Try uploading images, entering point data, or uploading CSV files
3. **Check the console**: All data being "uploaded" is logged to the browser console
4. **Integrate Firebase**: Replace the simulation functions with your Firebase logic

## 📁 Files Structure

```
backend/
├── index.html          # Main HTML interface
├── styles.css          # Styling and responsive design
├── upload-handler.js   # JavaScript logic and Firebase integration points
└── README.md          # This file
```

## 🎯 Features

### 📸 Image Upload Testing
- **Drag & drop** or click to upload multiple images
- **File validation** (type and size checking)
- **Image previews** with removal capability
- **Metadata collection** (title, description)
- **Progress indicators** and error handling

### 📍 Point Data Upload Testing  
- **Form-based data entry** for location points
- **Geolocation integration** (get current coordinates)
- **Coordinate validation** (lat/lng bounds checking)
- **Point type categorization** (charging stations, parking, etc.)
- **Tags support** for additional metadata

### 📋 Bulk CSV Upload Testing
- **CSV file upload** with drag & drop support
- **Format validation** and preview functionality
- **Expected CSV format**: `name,type,latitude,longitude,description,tags`
- **Batch processing** preparation for multiple points

## 🔌 Firebase Integration Points

### Replace These Functions in `upload-handler.js`:

#### 1. Image Upload (`simulateFirebaseImageUpload`)
```javascript
async simulateFirebaseImageUpload(images, metadata) {
    // TODO: Replace with Firebase Storage upload
    // - Upload images to Firebase Storage
    // - Save metadata to Firestore
    // - Return actual upload results
}
```

#### 2. Point Data Upload (`simulateFirebasePointUpload`)
```javascript
async simulateFirebasePointUpload(pointData) {
    // TODO: Replace with Firestore document creation
    // - Add point data to Firestore collection
    // - Handle GeoPoint for coordinates
    // - Return document ID and success status
}
```

#### 3. CSV Bulk Upload (`simulateFirebaseCSVUpload`)
```javascript
async simulateFirebaseCSVUpload(csvData) {
    // TODO: Replace with Firestore batch operations
    // - Process CSV data array
    // - Use Firestore batch writes for efficiency
    // - Handle errors for individual items
}
```

## 📊 Data Structures

### Image Upload Data
```javascript
{
    title: "Image title",
    description: "Image description", 
    timestamp: "2024-01-01T00:00:00.000Z",
    fileCount: 3,
    files: [File, File, File] // Browser File objects
}
```

### Point Data Structure
```javascript
{
    id: "generated_id",
    name: "Downtown Charging Station",
    type: "charging-station",
    latitude: 40.7128,
    longitude: -74.0060,
    description: "Fast charging available 24/7",
    tags: ["fast-charging", "24-hours", "covered"],
    timestamp: "2024-01-01T00:00:00.000Z"
}
```

### CSV Data Structure
```javascript
[
    {
        id: "generated_id",
        name: "Station 1",
        type: "charging-station", 
        latitude: "40.7128",
        longitude: "-74.0060",
        description: "Description text",
        tags: "tag1,tag2,tag3",
        timestamp: "2024-01-01T00:00:00.000Z"
    },
    // ... more entries
]
```

## 🛠️ Firebase Setup Recommendations

### 1. Firebase Storage (for images)
```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const imageRef = ref(storage, `images/${filename}`);
await uploadBytes(imageRef, file);
const downloadURL = await getDownloadURL(imageRef);
```

### 2. Firestore (for point data)
```javascript
import { getFirestore, collection, addDoc, GeoPoint } from 'firebase/firestore';

const db = getFirestore();
await addDoc(collection(db, 'points'), {
    ...pointData,
    coordinates: new GeoPoint(latitude, longitude)
});
```

### 3. Firestore Batch Operations (for CSV)
```javascript
import { writeBatch, doc } from 'firebase/firestore';

const batch = writeBatch(db);
csvData.forEach((point) => {
    const docRef = doc(collection(db, 'points'));
    batch.set(docRef, {
        ...point,
        coordinates: new GeoPoint(point.latitude, point.longitude)
    });
});
await batch.commit();
```

## 🎨 Customization

### Adding New Point Types
Edit the point type dropdown in `index.html`:
```html
<select id="pointType">
    <option value="charging-station">Charging Station</option>
    <option value="your-new-type">Your New Type</option>
</select>
```

### Modifying CSV Format
Update the expected headers in `upload-handler.js`:
```javascript
const expectedHeaders = ['name', 'type', 'latitude', 'longitude', 'description', 'tags'];
```

### Styling Changes
All styles are in `styles.css` - modify colors, layouts, and responsive breakpoints as needed.

## 🐛 Error Handling

The platform includes comprehensive error handling for:
- **File validation** (type, size limits)
- **Form validation** (required fields, coordinate bounds)  
- **CSV format validation** (headers, data structure)
- **Geolocation errors** (permissions, availability)
- **Upload simulation** (network errors, timeouts)

## 📱 Browser Support

- **Modern browsers** with ES6+ support
- **File API** support for uploads
- **Geolocation API** for current location
- **Local Storage** (if you add persistence)

## 🔍 Testing Tips

1. **Check browser console** for all logged data
2. **Test file size limits** with large images  
3. **Try invalid CSV formats** to test validation
4. **Test geolocation** in different browsers
5. **Simulate slow networks** for loading states

## 🚀 Next Steps for Backend Team

1. **Set up Firebase project** and get config
2. **Install Firebase SDK** dependencies
3. **Replace simulation functions** with actual Firebase calls
4. **Add authentication** if required
5. **Implement error logging** for production
6. **Add data validation** server-side
7. **Set up Firestore security rules**

---

**Ready to integrate Firebase? Check the console logs to see exactly what data is being prepared for upload!** 🔥 