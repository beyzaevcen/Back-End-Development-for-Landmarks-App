landmarkNameInput.addEventListener("input", function () {
    saveLandmarkBtn.disabled = !this.value || !selectedLocation;
  });
  
  saveLandmarkBtn.addEventListener("click", function () {
    if (!selectedLocation || !landmarkNameInput.value) {
      alert("Please select a location and enter a name");
      return;
    }
  
    const landmarkData = {
      name: landmarkNameInput.value,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      description: landmarkDescriptionInput.value,
      category: landmarkCategorySelect.value,
    };
  
    if (editingLandmarkId) {
      updateLandmark(editingLandmarkId, landmarkData);
    } else {
      createLandmark(landmarkData);
    }
  });
  
  function createLandmark(landmarkData) {
    fetch(`${API_URL}/landmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(landmarkData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (selectedLocation.marker) {
          selectedLocation.marker.remove();
        }
  
        const marker = L.marker([landmarkData.latitude, landmarkData.longitude])
          .addTo(map)
          .bindPopup(
            `<strong>${landmarkData.name}</strong><br>${
              landmarkData.description || ""
            }`
          )
          .openPopup();
  
        markers[data._id] = marker;
        landmarks.push(data);
  
        updateLandmarkList();
        updateLandmarkSelect();
        resetForm();
  
        alert("Landmark saved successfully!");
      })
      .catch((error) => {
        console.error("Error saving landmark:", error);
        alert("Error saving landmark. Please try again.");
      });
  }
  
  function updateLandmark(id, landmarkData) {
    fetch(`${API_URL}/landmarks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(landmarkData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((updatedLandmark) => {
        if (selectedLocation.marker) {
          selectedLocation.marker.remove();
        }
        
        if (markers[id]) {
          markers[id].remove();
        }
  
        const marker = L.marker([landmarkData.latitude, landmarkData.longitude])
          .addTo(map)
          .bindPopup(
            `<strong>${landmarkData.name}</strong><br>${
              landmarkData.description || ""
            }`
          )
          .openPopup();
  
        markers[id] = marker;
  
        const index = landmarks.findIndex(l => l._id === id);
        if (index !== -1) {
          landmarks[index] = updatedLandmark;
        }
  
        updateLandmarkList();
        updateLandmarkSelect();
        resetForm();
  
        alert("Landmark updated successfully!");
      })
      .catch((error) => {
        console.error("Error updating landmark:", error);
        alert("Error updating landmark. Please try again.");
      });
  }
  
  function resetForm() {
    landmarkNameInput.value = "";
    landmarkDescriptionInput.value = "";
    landmarkCategorySelect.value = "other";
    selectedCoordsSpan.textContent = "Not selected";
    if (selectedLocation && selectedLocation.marker) {
      selectedLocation.marker.remove();
    }
    selectedLocation = null;
    saveLandmarkBtn.disabled = true;
    saveLandmarkBtn.textContent = "Save Landmark";
    editingLandmarkId = null;
    
    if (!document.getElementById("cancelEditBtn")) {
      const cancelBtn = document.createElement("button");
      cancelBtn.id = "cancelEditBtn";
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "cancel-btn";
      cancelBtn.style.display = "none";
      cancelBtn.addEventListener("click", resetForm);
      
      saveLandmarkBtn.parentNode.insertBefore(cancelBtn, saveLandmarkBtn.nextSibling);
    }
    
    document.getElementById("cancelEditBtn").style.display = "none";
  }
  
  function editLandmark(id) {
    const landmark = landmarks.find(l => l._id === id);
    if (!landmark) return;
    
    landmarkNameInput.value = landmark.name;
    landmarkDescriptionInput.value = landmark.description || "";
    landmarkCategorySelect.value = landmark.category || "other";
    
    const lat = landmark.location.latitude;
    const lng = landmark.location.longitude;
    
    if (selectedLocation && selectedLocation.marker) {
      selectedLocation.marker.remove();
    }
    
    const marker = L.marker([lat, lng])
      .addTo(map)
      .bindPopup(`Editing: ${landmark.name}`)
      .openPopup();
    
    selectedLocation = {
      latitude: lat,
      longitude: lng,
      marker: marker,
    };
    
    selectedCoordsSpan.textContent = `Lat: ${lat}, Lng: ${lng}`;
    saveLandmarkBtn.disabled = false;
    saveLandmarkBtn.textContent = "Update Landmark";
    editingLandmarkId = id;
    
    const cancelBtn = document.getElementById("cancelEditBtn");
    cancelBtn.style.display = "inline-block";
    
    document.getElementById("landmarkForm").scrollIntoView({ behavior: 'smooth' });
  }
  
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
        if (markers[id]) {
          markers[id].remove();
          delete markers[id];
        }
  
        landmarks = landmarks.filter((landmark) => landmark._id !== id);
  
        updateLandmarkList();
        updateLandmarkSelect();
  
        alert("Landmark deleted successfully!");
      })
      .catch((error) => {
        console.error("Error deleting landmark:", error);
        alert("Error deleting landmark. Please try again.");
      });
  }
  
  function fetchLandmarks() {
    fetch(`${API_URL}/landmarks`)
      .then((response) => response.json())
      .then((data) => {
        landmarks = data;
  
        Object.values(markers).forEach((marker) => marker.remove());
        markers = {};
  
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
  
        fetchVisitedLandmarksIds();
      })
      .catch((error) => console.error("Error fetching landmarks:", error));
  }
  
  function initCancelButton() {
    if (!document.getElementById("cancelEditBtn")) {
      const cancelEditBtn = document.createElement("button");
      cancelEditBtn.id = "cancelEditBtn";
      cancelEditBtn.textContent = "Cancel";
      cancelEditBtn.className = "cancel-btn";
      cancelEditBtn.style.display = "none";
      cancelEditBtn.addEventListener("click", resetForm);
  
      if (saveLandmarkBtn && saveLandmarkBtn.parentNode) {
        saveLandmarkBtn.parentNode.insertBefore(cancelEditBtn, saveLandmarkBtn.nextSibling);
      }
    }
  }