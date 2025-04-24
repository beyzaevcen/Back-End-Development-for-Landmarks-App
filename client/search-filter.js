// Global variables for search and filter state
let currentSearchTerm = '';
let currentCategory = 'all';

// Initialize search and filter functionality
function initializeSearchAndFilter() {
 const searchInput = document.getElementById('searchInput');
 const searchBtn = document.getElementById('searchBtn');
 const categoryFilter = document.getElementById('categoryFilter');
 const resetFiltersBtn = document.getElementById('resetFiltersBtn');
 
 searchBtn.addEventListener('click', performSearch);
 
 searchInput.addEventListener('keypress', function(e) {
   if (e.key === 'Enter') {
     performSearch();
   }
 });
 
 categoryFilter.addEventListener('change', function() {
   currentCategory = categoryFilter.value;
   applyFilters();
 });
 
 resetFiltersBtn.addEventListener('click', resetFilters);
}

function performSearch() {
 const searchInput = document.getElementById('searchInput');
 currentSearchTerm = searchInput.value.trim();
 applyFilters();
}

function applyFilters() {
 const queryParams = new URLSearchParams();
 
 if (currentSearchTerm) {
   queryParams.append('name', currentSearchTerm);
 }
 
 if (currentCategory !== 'all') {
   queryParams.append('category', currentCategory);
 }
 
 fetchFilteredLandmarks(queryParams);
}

function resetFilters() {
 const searchInput = document.getElementById('searchInput');
 const categoryFilter = document.getElementById('categoryFilter');
 
 searchInput.value = '';
 categoryFilter.value = 'all';
 
 currentSearchTerm = '';
 currentCategory = 'all';
 
 fetchLandmarks();
}

function fetchFilteredLandmarks(queryParams) {
 fetch(`${API_URL}/search-landmarks?${queryParams.toString()}`)
   .then((response) => response.json())
   .then((data) => {
     landmarks = data;
     updateLandmarkList();
     fetchVisitedLandmarksIds();
     
     if (landmarks.length === 0) {
       const landmarkList = document.getElementById('landmarkList');
       landmarkList.innerHTML = '<li class="no-results">No result</li>';
     }
   })
   .catch((error) => {
     console.error("Error fetching filtered landmarks:", error);
     showNotification("Error fetching filtered landmark", "error");
   });
}

document.addEventListener("DOMContentLoaded", function() {
 fetchLandmarks();
 fetchSavedPlans();
 initCancelButton();
 initializeSearchAndFilter();
 window.planLayers = [];
});