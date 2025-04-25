import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Landmark from "./models/Landmark.js";
import VisitedLandmark from "./models/VisitedLandmark.js";
import VisitingPlan from "./models/VisitingPlan.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connection successful");

    if (process.env.PORT) {
      app.listen(process.env.PORT, () => {
        console.log(`Server running on port ${process.env.PORT}`);
      });
    } else {
      console.log("PORT environment variable is not defined. Server not started.");
    }

  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });


  //Landmarks endpoints

app.post("/landmarks", async (req, res) => {
  try {
    const { name, latitude, longitude, description, category } = req.body;

    if (!name || !latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Name, latitude and longitude are required" });
    }

    const newLandmark = new Landmark({
      name,
      location: {
        latitude,
        longitude,
      },
      description: description || "",
      category: category || "other",
    });

    const savedLandmark = await newLandmark.save();
    res.status(201).json(savedLandmark);
  } catch (error) {
    console.error("Error creating landmark:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/landmarks", async (req, res) => {
  try {
    const landmarks = await Landmark.find();
    res.json(landmarks);
  } catch (error) {
    console.error("Error fetching landmarks:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/landmarks/:id", async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id);

    if (!landmark) {
      return res.status(404).json({ error: "Landmark not found" });
    }

    res.json(landmark);
  } catch (error) {
    console.error("Error fetching landmark:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/landmarks/:id", async (req, res) => {
  try {
    const { name, latitude, longitude, description, category } = req.body;

    const updateData = {
      name,
      description,
      category,
    };

    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        latitude,
        longitude,
      };
    }

    const updatedLandmark = await Landmark.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } 
    );

    if (!updatedLandmark) {
      return res.status(404).json({ error: "Landmark not found" });
    }

    res.json(updatedLandmark);
  } catch (error) {
    console.error("Error updating landmark:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/landmarks/:id", async (req, res) => {
  try {
    const deletedLandmark = await Landmark.findByIdAndDelete(req.params.id);

    if (!deletedLandmark) {
      return res.status(404).json({ error: "Landmark not found" });
    }

    await VisitedLandmark.deleteMany({ landmark_id: req.params.id });

    await VisitingPlan.updateMany(
      { "landmarks.landmark_id": req.params.id },
      { $pull: { landmarks: { landmark_id: req.params.id } } }
    );

    res.json({ message: "Landmark successfully deleted" });
  } catch (error) {
    console.error("Error deleting landmark:", error);
    res.status(500).json({ error: "Server error" });
  }
});

//Visited landmarks endpoints

app.post("/visited", async (req, res) => {
  try {
    const { landmark_id, visitor_name } = req.body;
    const visited_date = req.body.visited_date || new Date();

    if (!landmark_id) {
      return res.status(400).json({ error: "Landmark ID is required" });
    }

    const landmark = await Landmark.findById(landmark_id);
    if (!landmark) {
      return res.status(404).json({ error: "Landmark not found" });
    }

    const newVisit = new VisitedLandmark({
      landmark_id,
      visited_date,
      visitor_name: visitor_name || "Anonymous",
    });

    const savedVisit = await newVisit.save();
    res.status(201).json(savedVisit);
  } catch (error) {
    console.error("Error saving visit:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/visited", async (req, res) => {
  try {
    const visits = await VisitedLandmark.find().sort({ visited_date: -1 });

    const enrichedVisits = await Promise.all(
      visits.map(async (visit) => {
        const landmark = await Landmark.findById(visit.landmark_id);
        return {
          ...visit._doc,
          landmark: landmark || { name: "Deleted Landmark" },
        };
      })
    );

    res.json(enrichedVisits);
  } catch (error) {
    console.error("Error fetching visit history:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/visited/:id", async (req, res) => {
  try {
    const visits = await VisitedLandmark.find({
      landmark_id: req.params.id,
    }).sort({ visited_date: -1 });

    res.json(visits);
  } catch (error) {
    console.error("Error fetching visit history:", error);
    res.status(500).json({ error: "Server error" });
  }
});


//Visiting plans endpoints

app.post("/plans", async (req, res) => {
  try {
    const { name, creator, landmarks, description, is_public, planned_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Plan name is required" });
    }

    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return res.status(400).json({ error: "At least one landmark must be added" });
    }

    const landmarkIds = landmarks.map(item => item.landmark_id);
    const existingLandmarks = await Landmark.find({ _id: { $in: landmarkIds } });

    if (existingLandmarks.length !== landmarkIds.length) {
      return res.status(400).json({ error: "Some landmarks were not found" });
    }

    const landmarksWithOrder = landmarks.map((item, index) => ({
      ...item,
      order: item.order || index
    }));

    const newPlan = new VisitingPlan({
      name,
      creator: creator || "Anonymous",
      landmarks: landmarksWithOrder,
      description: description || "",
      is_public: is_public !== undefined ? is_public : true,
      planned_date: planned_date || null
    });

    const savedPlan = await newPlan.save();

    const populatedPlan = await VisitingPlan.findById(savedPlan._id);
    const enrichedPlan = {
      ...populatedPlan._doc,
      landmarks: await Promise.all(
        populatedPlan.landmarks.map(async (item) => {
          const landmark = await Landmark.findById(item.landmark_id);
          return {
            ...item._doc,
            landmark_details: landmark || { name: "Deleted Landmark" }
          };
        })
      )
    };

    res.status(201).json(enrichedPlan);
  } catch (error) {
    console.error("Error creating visiting plan:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/plans", async (req, res) => {
  try {
    const plans = await VisitingPlan.find().sort({ createdAt: -1 });

    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const enrichedLandmarks = await Promise.all(
          plan.landmarks.map(async (item) => {
            const landmark = await Landmark.findById(item.landmark_id);
            return {
              ...item._doc,
              landmark_details: landmark || { name: "Deleted Landmark" }
            };
          })
        );

        return {
          ...plan._doc,
          landmarks: enrichedLandmarks
        };
      })
    );

    res.json(enrichedPlans);
  } catch (error) {
    console.error("Error fetching visiting plans:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/plans/:id", async (req, res) => {
  try {
    const deletedPlan = await VisitingPlan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      return res.status(404).json({ error: "Visiting plan not found" });
    }

    res.json({ message: "Visiting plan successfully deleted" });
  } catch (error) {
    console.error("Error deleting visiting plan:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Search and filter landmark endpoint
app.get("/search-landmarks", async (req, res) => {
  try {
    const { name, category } = req.query;
    
    let query = {};
    
    if (name) {
      query.name = { $regex: name, $options: 'i' }; 
    }
    
    if (category && category !== "all") {
      query.category = category;
    }
    
    const landmarks = await Landmark.find(query);
    res.json(landmarks);
  } catch (error) {
    console.error("Error searching landmarks:", error);
    res.status(500).json({ error: "Server error" });
  }
});



export default app;