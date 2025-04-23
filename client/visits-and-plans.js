// Update landmark list in UI
function updateLandmarkList(visitedIds = new Set()) {
    landmarkList.innerHTML = "";
  
    if (landmarks.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No landmarks added yet";
      landmarkList.appendChild(li);
      return;
    }
  
    landmarks.forEach((landmark) => {
      const isVisited = visitedIds.has(landmark._id);
      
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="landmark-header">
          <strong>${landmark.name}</strong> 
          <span class="category-label" data-category="${landmark.category || "other"}">${landmark.category || "other"}</span>
          ${isVisited ? '<span class="visited-badge">✓ Visited</span>' : ''}
        </div>
        <p>Lat: ${landmark.location.latitude}, Lng: ${landmark.location.longitude}</p>
        <div class="actions">
          <button class="view-btn" data-id="${landmark._id}">View</button>
          <button class="edit-btn" data-id="${landmark._id}">Edit</button>
          <button class="visit-btn" data-id="${landmark._id}">${isVisited ? 'Mark Visited Again' : 'Mark Visited'}</button>
          ${isVisited ? `<button class="history-btn" data-id="${landmark._id}">Visit History</button>` : ''}
          <button class="delete-btn" data-id="${landmark._id}">Delete</button>
        </div>
      `;
      landmarkList.appendChild(li);
  
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
      
      li.querySelector(".edit-btn").addEventListener("click", () => {
        editLandmark(landmark._id);
      });
      
      li.querySelector(".visit-btn").addEventListener("click", () => {
        openNotesModal(landmark._id);
      });
  
      // Add visit history button if the landmark has been visited
      if (isVisited) {
        li.querySelector(".history-btn").addEventListener("click", () => {
          showLandmarkVisitHistory(landmark._id);
        });
      }
  
      li.querySelector(".delete-btn").addEventListener("click", () => {
        if (confirm(`Are you sure you want to delete ${landmark.name}?`)) {
          deleteLandmark(landmark._id);
        }
      });
    });
  }
  
  function updateLandmarkSelect() {
    landmarkSelect.innerHTML = "";
  
    landmarks.forEach((landmark) => {
      const option = document.createElement("option");
      option.value = landmark._id;
      option.textContent = landmark.name;
      landmarkSelect.appendChild(option);
    });
  }
  
  function fetchVisitedLandmarksIds() {
    fetch(`${API_URL}/visited`)
      .then((response) => response.json())
      .then((data) => {
        const visitedIds = new Set();
        data.forEach((visit) => {
          visitedIds.add(visit.landmark_id);
        });
        
        visitedLandmarks = data;
        
        updateLandmarkList(visitedIds);
        updateLandmarkSelect();
      })
      .catch((error) => console.error("Error fetching visited landmarks:", error));
  }
  
  function showLandmarkVisitHistory(landmarkId) {
    const landmark = landmarks.find(l => l._id === landmarkId);
    if (!landmark) {
      alert("Landmark not found");
      return;
    }
    const historyModal = document.createElement("div");
    historyModal.className = "modal";
    historyModal.style.display = "block";
    
    const visits = visitedLandmarks.filter(v => v.landmark_id === landmarkId);
    
    let visitsHTML = "";
    if (visits.length === 0) {
      visitsHTML = "<p>No visit history found for this landmark.</p>";
    } else {
      visitsHTML = visits.map(visit => {
        const visitDate = new Date(visit.visited_date).toLocaleDateString();
        const visitTime = new Date(visit.visited_date).toLocaleTimeString();
        return `
          <div class="visit-card">
            <p>Visited by: ${visit.visitor_name}</p>
            <p>Date: ${visitDate} at ${visitTime}</p>
          </div>
        `;
      }).join("");
    }
    
    historyModal.innerHTML = `
      <div class="modal-content">
        <span class="close">&times;</span>
        <h3>Visit History for ${landmark.name}</h3>
        <div class="visit-history">
          ${visitsHTML}
        </div>
      </div>
    `;
    
    document.body.appendChild(historyModal);
    
    historyModal.querySelector(".close").addEventListener("click", function() {
      document.body.removeChild(historyModal);
    });
    
    historyModal.addEventListener("click", function(event) {
      if (event.target === historyModal) {
        document.body.removeChild(historyModal);
      }
    });
  }
  
  function openNotesModal(landmarkId) {
    if (landmarkSelect) {
      landmarkSelect.value = landmarkId;
    }
    
    if (visitorName) {
      visitorName.value = "";
    }
    
    notesModal.style.display = "block";
  }
  
  saveNoteBtn.addEventListener("click", function () {
    if (!landmarkSelect.value) {
      alert("Please select a landmark");
      return;
    }
  
    const visitData = {
      landmark_id: landmarkSelect.value,
      visitor_name: visitorName.value || "Anonymous",
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
        alert("Visit recorded successfully!");
        visitorName.value = "";
        notesModal.style.display = "none";
        
        fetchVisitedLandmarksIds();
      })
      .catch((error) => {
        console.error("Error saving visit:", error);
        alert("Error recording visit. Please try again.");
      });
  });
  
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
        
        data.sort((a, b) => new Date(b.visited_date) - new Date(a.visited_date));
        
        data.forEach((visit) => {
          const landmark = landmarks.find((l) => l._id === visit.landmark_id) || {
            name: "Unknown",
            location: { latitude: 0, longitude: 0 },
            category: "other"
          };
  
          const visitDate = new Date(visit.visited_date).toLocaleDateString();
          const visitTime = new Date(visit.visited_date).toLocaleTimeString();
  
          const visitCard = document.createElement("div");
          visitCard.className = "visit-card";
          visitCard.innerHTML = `
            <div class="visit-header">
              <h4>${landmark.name}</h4>
              <span class="category-label" data-category="${landmark.category || "other"}">${landmark.category || "other"}</span>
            </div>
            <p>Visited by: ${visit.visitor_name}</p>
            <p>Date: ${visitDate} at ${visitTime}</p>
            <p>Location: ${landmark.location.latitude}, ${landmark.location.longitude}</p>
          `;
          
          const viewBtn = document.createElement("button");
          viewBtn.className = "view-btn";
          viewBtn.textContent = "View on Map";
          viewBtn.addEventListener("click", () => {
            visitedModal.style.display = "none";
            const marker = markers[visit.landmark_id];
            if (marker) {
              map.setView(
                [landmark.location.latitude, landmark.location.longitude],
                14
              );
              marker.openPopup();
            }
          });
          
          visitCard.appendChild(viewBtn);
          visitedList.appendChild(visitCard);
        });
      })
      .catch((error) => {
        console.error("Error fetching visited landmarks:", error);
        visitedList.innerHTML = "<p>Error loading visited landmarks</p>";
      });
  }
  
  let savedPlans = [];

  function fetchSavedPlans() {
    fetch(`${API_URL}/plans`)
      .then((response) => response.json())
      .then((data) => {
        savedPlans = data;
      })
      .catch((error) => console.error("Error fetching plans:", error));
  }
  
  function displayPlanLandmarks() {
    planLandmarks.innerHTML = "";
    
    if (savedPlans.length > 0) {
      const planSelector = document.createElement("div");
      planSelector.className = "plan-selector";
      planSelector.innerHTML = `
        <h4>Load Existing Plan</h4>
        <select id="existingPlanSelect">
          <option value="">Select a plan...</option>
          ${savedPlans.map(plan => `<option value="${plan._id}">${plan.name}</option>`).join('')}
        </select>
        <button id="loadPlanBtn" class="view-btn">Load Plan</button>
      `;
      planLandmarks.appendChild(planSelector);
      
      document.getElementById("loadPlanBtn").addEventListener("click", function() {
        const selectedPlanId = document.getElementById("existingPlanSelect").value;
        if (selectedPlanId) {
          loadPlan(selectedPlanId);
        } else {
          alert("Please select a plan to load");
        }
      });
    }
    
    const newPlanHeading = document.createElement("h4");
    newPlanHeading.textContent = "Create New Plan";
    newPlanHeading.style.marginTop = "20px";
    planLandmarks.appendChild(newPlanHeading);
  
    landmarks.forEach((landmark) => {
      const div = document.createElement("div");
      div.className = "landmark-plan-item";
      div.innerHTML = `
        <div class="plan-header">
          <input type="checkbox" id="plan-${landmark._id}" value="${landmark._id}">
          <label for="plan-${landmark._id}">${landmark.name}</label>
          <span class="category-label" data-category="${landmark.category || "other"}">${landmark.category || "other"}</span>
        </div>
        <textarea placeholder="Notes for this landmark" id="plan-notes-${landmark._id}"></textarea>
      `;
      planLandmarks.appendChild(div);
    });
  }
  
  function loadPlan(planId) {
    const plan = savedPlans.find(p => p._id === planId);
    if (!plan) {
      alert("Plan not found");
      return;
    }
    
    planName.value = plan.name;
    
    plan.landmarks.forEach(item => {
      const checkbox = document.getElementById(`plan-${item.landmark_id}`);
      if (checkbox) {
        checkbox.checked = true;
        
        const notesField = document.getElementById(`plan-notes-${item.landmark_id}`);
        if (notesField && item.notes) {
          notesField.value = item.notes;
        }
      }
    });
    
    showNotification(`Plan "${plan.name}" loaded successfully`, "success");
  }
  
  function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
  
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
    
    const planNameValue = planName.value || "My Visit Plan";
    
    const planData = {
      name: planNameValue,
      created_date: new Date().toISOString(),
      landmarks: selectedLandmarks
    };
    
    fetch(`${API_URL}/plans`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(planData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        savedPlans.push(data);
        
        planModal.style.display = "none";
        
        visualizePlan(selectedLandmarks);
        
        showNotification(`Plan "${planNameValue}" saved with ${selectedLandmarks.length} landmarks!`, "success");
      })
      .catch((error) => {
        console.error("Error saving plan:", error);
        showNotification("Error saving plan. Please try again.", "error");
      });
  });
  
  function visualizePlan(selectedLandmarks) {
    if (planLayers) {
      planLayers.forEach(layer => map.removeLayer(layer));
    }
    
    planLayers = [];
    
    const planLandmarkData = selectedLandmarks.map(item => {
      const landmark = landmarks.find(l => l._id === item.landmark_id);
      return landmark;
    }).filter(Boolean); 
    
    if (planLandmarkData.length < 2) {
      return;
    }
    
    let points = planLandmarkData.map(landmark => 
      [landmark.location.latitude, landmark.location.longitude]
    );
    
    const routeLine = L.polyline(points, {
      color: '#3498db',
      weight: 3,
      opacity: 0.7,
      dashArray: '5, 10',
      className: 'route-line'
    });
    
    planLayers.push(routeLine);
    routeLine.addTo(map);
    
    const startIcon = L.divIcon({
      html: '<div class="custom-marker start-marker">1</div>',
      className: 'custom-marker-container',
      iconSize: [30, 30]
    });
    
    const endIcon = L.divIcon({
      html: `<div class="custom-marker end-marker">${planLandmarkData.length}</div>`,
      className: 'custom-marker-container',
      iconSize: [30, 30]
    });
    
    const startMarker = L.marker(points[0], {icon: startIcon});
    const endMarker = L.marker(points[points.length - 1], {icon: endIcon});
    
    planLayers.push(startMarker, endMarker);
    startMarker.addTo(map);
    endMarker.addTo(map);
    
    if (points.length > 2) {
      for (let i = 1; i < points.length - 1; i++) {
        const waypointIcon = L.divIcon({
          html: `<div class="custom-marker waypoint-marker">${i + 1}</div>`,
          className: 'custom-marker-container',
          iconSize: [25, 25]
        });
        
        const waypointMarker = L.marker(points[i], {icon: waypointIcon});
        planLayers.push(waypointMarker);
        waypointMarker.addTo(map);
      }
    }
    
    // Fit map to show all markers
    map.fitBounds(routeLine.getBounds(), {padding: [50, 50]});
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
    // Fetch plans before displaying plan modal
    fetchSavedPlans();
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
  
  // Initialize the app
  document.addEventListener("DOMContentLoaded", function() {
    fetchLandmarks();
    fetchSavedPlans(); // Fetch plans at initialization
    initCancelButton();
    
    // Initialize planLayers array to store plan visualization layers
    window.planLayers = [];
  });

  // Add this function to visits-and-plans.js

// Display saved plans in the plans-container
function displaySavedPlans() {
    const plansContainer = document.getElementById('plans-container');
    
    // Clear the container first
    plansContainer.innerHTML = '';
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Your Saved Plans';
    plansContainer.appendChild(heading);
    
    // Check if there are any plans
    if (savedPlans.length === 0) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No saved plans yet. Create your first plan!';
      plansContainer.appendChild(emptyMessage);
      return;
    }
    
    // Create a container for the plans
    const plansGrid = document.createElement('div');
    plansGrid.className = 'plans-grid';
    
    // Add each plan to the grid
    savedPlans.forEach(plan => {
      const planCard = document.createElement('div');
      planCard.className = 'plan-card';
      
      // Format date
      const planDate = new Date(plan.created_date).toLocaleDateString();
      
      // Get landmarks for this plan
      const planLandmarks = plan.landmarks.map(item => {
        const landmark = landmarks.find(l => l._id === item.landmark_id);
        return landmark ? landmark.name : 'Unknown Landmark';
      });
      
      // Create plan card content
      planCard.innerHTML = `
        <div class="plan-card-header">
          <h4>${plan.name}</h4>
          <span class="plan-date">${planDate}</span>
        </div>
        <div class="plan-landmarks-count">
          <strong>${plan.landmarks.length}</strong> landmarks
        </div>
        <div class="plan-landmarks-list">
          ${planLandmarks.map((name, index) => 
            `<div class="plan-landmark-item">
              <span class="landmark-number">${index + 1}</span>
              <span class="landmark-name">${name}</span>
            </div>`
          ).join('')}
        </div>
        <div class="plan-card-actions">
          <button class="view-plan-btn" data-id="${plan._id}">View on Map</button>
          <button class="delete-plan-btn" data-id="${plan._id}">Delete</button>
        </div>
      `;
      
      plansGrid.appendChild(planCard);
    });
    
    plansContainer.appendChild(plansGrid);
    
    // Add event listeners to buttons
    const viewButtons = plansContainer.querySelectorAll('.view-plan-btn');
    viewButtons.forEach(button => {
      button.addEventListener('click', function() {
        const planId = this.getAttribute('data-id');
        loadAndVisualizeSelectedPlan(planId);
      });
    });
    
    const deleteButtons = plansContainer.querySelectorAll('.delete-plan-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', function() {
        const planId = this.getAttribute('data-id');
        deleteSavedPlan(planId);
      });
    });
  }
  
  // Load and visualize a selected plan
  function loadAndVisualizeSelectedPlan(planId) {
    const plan = savedPlans.find(p => p._id === planId);
    if (!plan) {
      showNotification('Plan not found', 'error');
      return;
    }
    
    // Visualize the plan on the map
    visualizePlan(plan.landmarks);
    
    // Show notification
    showNotification(`Showing plan: ${plan.name}`, 'success');
    
    // Scroll up to the map
    document.querySelector('.map-container').scrollIntoView({ 
      behavior: 'smooth' 
    });
  }
  
  
  // Modified fetchSavedPlans to update the plans display
  function fetchSavedPlans() {
    fetch(`${API_URL}/plans`)
      .then((response) => response.json())
      .then((data) => {
        savedPlans = data;
        // Update the plans display
        displaySavedPlans();
      })
      .catch((error) => {
        console.error("Error fetching plans:", error);
        // Still try to display plans (will show empty state)
        displaySavedPlans();
      });
  }
  
  // Make sure to call displaySavedPlans after plans are loaded
  // Add this to your document ready function
  document.addEventListener("DOMContentLoaded", function() {
    fetchLandmarks();
    fetchSavedPlans(); // This now calls displaySavedPlans internally
    initCancelButton();
    
    // Initialize planLayers array to store plan visualization layers
    window.planLayers = [];
  });