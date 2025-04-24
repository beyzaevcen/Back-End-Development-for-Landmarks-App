const API_URL = "http://localhost:3002"

let selectedLocation = null;
let landmarks = [];
let markers = {};
let editingLandmarkId = null;
let visitedLandmarks = [];
let routeLines = [];

const map = L.map("map").setView([20, 0], 2);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

const landmarkNameInput = document.getElementById("landmarkName");
const landmarkCategorySelect = document.getElementById("landmarkCategory");
const landmarkDescriptionInput = document.getElementById("landmarkDescription");
const selectedCoordsSpan = document.getElementById("selectedCoords");
const saveLandmarkBtn = document.getElementById("saveLandmarkBtn");
const landmarkList = document.getElementById("landmarkList");

const notesModal = document.getElementById("notesModal");
const visitedModal = document.getElementById("visitedModal");
const planModal = document.getElementById("planModal");
const closeButtons = document.querySelectorAll(".close");
const landmarkSelect = document.getElementById("landmarkSelect");
const visitorName = document.getElementById("visitorName");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const visitedList = document.getElementById("visitedList");
const planLandmarks = document.getElementById("planLandmarks");
const planName = document.getElementById("planName");
const savePlanBtn = document.getElementById("savePlanBtn");

map.on("click", function (e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  if (selectedLocation && selectedLocation.marker) {
    selectedLocation.marker.remove();
  }

  const marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`Lat: ${lat}, Lng: ${lng}`)
    .openPopup();

  selectedLocation = {
    latitude: lat,
    longitude: lng,
    marker: marker,
  };

  selectedCoordsSpan.textContent = `Lat: ${lat}, Lng: ${lng}`;
  saveLandmarkBtn.disabled = !landmarkNameInput.value;
  
  if (editingLandmarkId) {
    saveLandmarkBtn.textContent = "Update Landmark";
  } else {
    saveLandmarkBtn.textContent = "Save Landmark";
  }
});

function visualizePlan(selectedLandmarks) {
  if (routeLines.length > 0) {
    routeLines.forEach(line => line.remove());
  }
  routeLines = [];
  
  const selectedLandmarkObjects = selectedLandmarks.map(sl => 
    landmarks.find(l => l._id === sl.landmark_id)
  ).filter(Boolean);
  
  if (selectedLandmarkObjects.length >= 2) {
    for (let i = 0; i < selectedLandmarkObjects.length - 1; i++) {
      const from = selectedLandmarkObjects[i];
      const to = selectedLandmarkObjects[i + 1];
      
      const line = L.polyline([
        [from.location.latitude, from.location.longitude],
        [to.location.latitude, to.location.longitude]
      ], {
        color: '#3388ff',
        weight: 3,
        opacity: 0.7,
        dashArray: '10, 10',
        className: 'route-line'
      }).addTo(map);
      
      routeLines.push(line);
    }
    
    const bounds = selectedLandmarkObjects.map(l => [l.location.latitude, l.location.longitude]);
    map.fitBounds(bounds);
  }
}