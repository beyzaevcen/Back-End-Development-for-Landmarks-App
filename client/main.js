// API URL
const API_URL = "http://localhost:3002/api";

// Initialize map
const map = L.map("map").setView([20, 0], 2);

// Add OpenStreetMap tile layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

// Global variables
let selectedLocation = null;
let landmarks = [];
let markers = {};

// DOM Elements
const landmarkNameInput = document.getElementById("landmarkName");
const landmarkCategorySelect = document.getElementById("landmarkCategory");
const landmarkDescriptionInput = document.getElementById("landmarkDescription");
const selectedCoordsSpan = document.getElementById("selectedCoords");
const saveLandmarkBtn = document.getElementById("saveLandmarkBtn");
const landmarkList = document.getElementById("landmarkList");

// Modal Elements
const notesModal = document.getElementById("notesModal");
const visitedModal = document.getElementById("visitedModal");
const planModal = document.getElementById("planModal");
const closeButtons = document.querySelectorAll(".close");
const landmarkSelect = document.getElementById("landmarkSelect");
const noteText = document.getElementById("noteText");
const visitorName = document.getElementById("visitorName");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const visitedList = document.getElementById("visitedList");
const planLandmarks = document.getElementById("planLandmarks");
const planName = document.getElementById("planName");
const savePlanBtn = document.getElementById("savePlanBtn");

// Add landmark on map click
map.on("click", function (e) {
  const lat = e.latlng.lat.toFixed(6);
  const lng = e.latlng.lng.toFixed(6);

  // Clear previous selection
  if (selectedLocation && selectedLocation.marker) {
    selectedLocation.marker.remove();
  }

  // Create new marker
  const marker = L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`Lat: ${lat}, Lng: ${lng}`)
    .openPopup();

  // Store selected location
  selectedLocation = {
    latitude: lat,
    longitude: lng,
    marker: marker,
  };

  // Update UI
  selectedCoordsSpan.textContent = `Lat: ${lat}, Lng: ${lng}`;
  saveLandmarkBtn.disabled = !landmarkNameInput.value;
});

// Enable/disable save button based on name input
landmarkNameInput.addEventListener("input", function () {
  saveLandmarkBtn.disabled = !this.value || !selectedLocation;
});

// Save landmark
saveLandmarkBtn.addEventListener("click", function () {
  if (!selectedLocation || !landmarkNameInput.value) {
    alert("Please select a location and enter a name");
    return;
  }

  const newLandmark = {
    name: landmarkNameInput.value,
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude,
    description: landmarkDescriptionInput.value,
    category: landmarkCategorySelect.value,
  };

  // Send to API
  fetch(`${API_URL}/landmarks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newLandmark),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      // Update the map marker
      if (selectedLocation.marker) {
        selectedLocation.marker.remove();
      }

      const marker = L.marker([newLandmark.latitude, newLandmark.longitude])
        .addTo(map)
        .bindPopup(
          `<strong>${newLandmark.name}</strong><br>${
            newLandmark.description || ""
          }`
        )
        .openPopup();

      // Store marker reference
      markers[data._id] = marker;

      // Add to landmarks list
      landmarks.push(data);

      // Update UI
      updateLandmarkList();
      resetForm();

      alert("Landmark saved successfully!");
    })
    .catch((error) => {
      console.error("Error saving landmark:", error);
      alert("Error saving landmark. Please try again.");
    });
});

// Reset form after saving
function resetForm() {
  landmarkNameInput.value = "";
  landmarkDescriptionInput.value = "";
  landmarkCategorySelect.value = "other";
  selectedCoordsSpan.textContent = "Not selected";
  selectedLocation = null;
  saveLandmarkBtn.disabled = true;
}

// Fetch and display all landmarks
function fetchLandmarks() {
  fetch(`${API_URL}/landmarks`)
    .then((response) => response.json())
    .then((data) => {
      landmarks = data;

      // Clear existing markers
      Object.values(markers).forEach((marker) => marker.remove());
      markers = {};

      // Add markers for each landmark
      landmarks.forEach((landmark) => {
        const marker = L.marker([
          landmark.location.latitude,
          landmark.location.longitude,
        ])
          .addTo(map)
          .bindPopup(
            `<strong>${landmark.name}</strong><br>${landmark.description || ""}`
          );

        markers[landmark._id] = marker;
      });

      updateLandmarkList();
      updateLandmarkSelect();
    })
    .catch((error) => console.error("Error fetching landmarks:", error));
}

// Update landmark list in UI
function updateLandmarkList() {
  landmarkList.innerHTML = "";

  if (landmarks.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No landmarks added yet";
    landmarkList.appendChild(li);
    return;
  }

  landmarks.forEach((landmark) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${landmark.name}</strong> (${landmark.category})
      <br>Lat: ${landmark.location.latitude}, Lng: ${landmark.location.longitude}
      <div class="actions">
        <button class="view-btn" data-id="${landmark._id}">View</button>
        <button class="edit-btn" data-id="${landmark._id}">Edit</button>
        <button class="delete-btn" data-id="${landmark._id}">Delete</button>
      </div>
    `;
    landmarkList.appendChild(li);

    // Add event listeners to buttons
    li.querySelector(".view-btn").addEventListener("click", () => {
      const marker = markers[landmark._id];
      if (marker) {
        map.setView(
          [landmark.location.latitude, landmark.location.longitude],
          14
        );
        marker.openPopup();
      }
    });

    li.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`Are you sure you want to delete ${landmark.name}?`)) {
        deleteLandmark(landmark._id);
      }
    });
  });
}

// Update landmark select dropdown in notes modal
function updateLandmarkSelect() {
  landmarkSelect.innerHTML = "";

  landmarks.forEach((landmark) => {
    const option = document.createElement("option");
    option.value = landmark._id;
    option.textContent = landmark.name;
    landmarkSelect.appendChild(option);
  });
}

// Delete landmark
function deleteLandmark(id) {
  fetch(`${API_URL}/landmarks/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      // Remove marker from map
      if (markers[id]) {
        markers[id].remove();
        delete markers[id];
      }

      // Remove from landmarks array
      landmarks = landmarks.filter((landmark) => landmark._id !== id);

      // Update UI
      updateLandmarkList();
      updateLandmarkSelect();

      alert("Landmark deleted successfully!");
    })
    .catch((error) => {
      console.error("Error deleting landmark:", error);
      alert("Error deleting landmark. Please try again.");
    });
}

// Modal Event Listeners
document.getElementById("addNotesBtn").addEventListener("click", () => {
  if (landmarks.length === 0) {
    alert("Please add landmarks first");
    return;
  }
  notesModal.style.display = "block";
});

document.getElementById("showVisitedBtn").addEventListener("click", () => {
  fetchVisitedLandmarks();
  visitedModal.style.display = "block";
});

document.getElementById("createPlanBtn").addEventListener("click", () => {
  if (landmarks.length === 0) {
    alert("Please add landmarks first");
    return;
  }
  displayPlanLandmarks();
  planModal.style.display = "block";
});

// Close modals
closeButtons.forEach((button) => {
  button.addEventListener("click", function () {
    this.closest(".modal").style.display = "none";
  });
});

// Close modal when clicking outside
window.addEventListener("click", function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.style.display = "none";
  }
});

// Save Note
saveNoteBtn.addEventListener("click", function () {
  if (!landmarkSelect.value || !noteText.value) {
    alert("Please select a landmark and enter notes");
    return;
  }

  const visitData = {
    landmark_id: landmarkSelect.value,
    visitor_name: visitorName.value || "Anonymous",
    notes: noteText.value,
    visited_date: new Date().toISOString(),
  };

  fetch(`${API_URL}/visited`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(visitData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then(() => {
      alert("Notes saved successfully!");
      noteText.value = "";
      visitorName.value = "";
      notesModal.style.display = "none";
    })
    .catch((error) => {
      console.error("Error saving notes:", error);
      alert("Error saving notes. Please try again.");
    });
});

// Fetch Visited Landmarks
function fetchVisitedLandmarks() {
  visitedList.innerHTML = "<p>Loading...</p>";

  fetch(`${API_URL}/visited`)
    .then((response) => response.json())
    .then((data) => {
      if (data.length === 0) {
        visitedList.innerHTML = "<p>No visited landmarks yet</p>";
        return;
      }

      visitedList.innerHTML = "";
      data.forEach((visit) => {
        const landmark = landmarks.find((l) => l._id === visit.landmark_id) || {
          name: "Unknown",
          location: { latitude: 0, longitude: 0 },
        };

        const visitDate = new Date(visit.visited_date).toLocaleDateString();

        const visitCard = document.createElement("div");
        visitCard.className = "visit-card";
        visitCard.innerHTML = `
          <h4>${landmark.name}</h4>
          <p>Visited by: ${visit.visitor_name} on ${visitDate}</p>
          <p>Location: ${landmark.location.latitude}, ${
          landmark.location.longitude
        }</p>
          ${visit.notes ? `<div class="notes">${visit.notes}</div>` : ""}
        `;
        visitedList.appendChild(visitCard);
      });
    })
    .catch((error) => {
      console.error("Error fetching visited landmarks:", error);
      visitedList.innerHTML = "<p>Error loading visited landmarks</p>";
    });
}

// Display Landmarks for Planning
function displayPlanLandmarks() {
  planLandmarks.innerHTML = "";

  landmarks.forEach((landmark) => {
    const div = document.createElement("div");
    div.className = "landmark-plan-item";
    div.innerHTML = `
      <input type="checkbox" id="plan-${landmark._id}" value="${landmark._id}">
      <label for="plan-${landmark._id}">${landmark.name} (${landmark.category})</label>
      <textarea placeholder="Notes for this landmark" id="plan-notes-${landmark._id}"></textarea>
    `;
    planLandmarks.appendChild(div);
  });
}

// Save Plan (bonus feature)
savePlanBtn.addEventListener("click", function () {
  const selectedLandmarks = Array.from(
    planLandmarks.querySelectorAll('input[type="checkbox"]:checked')
  ).map((checkbox) => {
    const id = checkbox.value;
    const notes = document.getElementById(`plan-notes-${id}`).value;
    return { landmark_id: id, notes };
  });

  if (selectedLandmarks.length === 0) {
    alert("Please select at least one landmark");
    return;
  }

  // This is a bonus feature - you would need to implement the backend for this
  alert(`Plan saved with ${selectedLandmarks.length} landmarks!`);
  planModal.style.display = "none";
});

// Initialize the app
fetchLandmarks();
