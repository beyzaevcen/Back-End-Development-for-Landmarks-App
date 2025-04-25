# Landmark Tracker Application

A web application for tracking landmarks, creating visiting plans, and recording visits.  
Built with **Express.js**, **MongoDB** for the backend, and **vanilla JavaScript**, **HTML**, and **CSS** for the frontend.

---

## 🚀 Setup Instructions

### 🔧 Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Back-End-Development-for-Landmarks-App.git
   cd Back-End-Development-for-Landmarks-Applandmark-tracker

2. Install dependencies:
    ```bash
   cd api
   npm install

3. Create a .env file in the api directory with the following content:
    ```bash
   MONGODB_URI=mongodb://localhost:27017/landmark_tracker 
   PORT=5000
  ⚠️ Adjust the MongoDB URI as needed for your setup.

4. Start the server:
   ```bash
   node index.js


### 🌐 Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../client
2. Open map-controller.js and update the API_URL variable;
   ```bash
   // Find this line
   const API_URL = "http://localhost:5000";
   // Replace with your server URL if different
 
3. Open the application by opening index.html in your browser


## ✨ Features

- View landmarks on an interactive map  
- Add new landmarks with location, description, and category  
- Mark landmarks as visited  
- Create visiting plans with multiple landmarks  
- Search and filter landmarks by name and category  
- View history of visited landmarks  

---

## 📡 API Endpoints

- `/landmarks` – CRUD operations for landmarks  
- `/visited` – Record and retrieve landmark visits  
- `/plans` – Create and manage visiting plans  
- `/search-landmarks` – Search and filter landmarks  

---

## 🛠️ Technologies Used

- **Backend:** Node.js, Express.js, MongoDB  
- **Frontend:** Vanilla JavaScript, HTML5, CSS3  
- **Map:** VLeaflet.js

