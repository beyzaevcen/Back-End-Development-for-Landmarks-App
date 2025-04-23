import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Landmark from "./models/Landmark.js";
import VisitedLandmark from "./models/VisitedLandmark.js";
import VisitingPlan from "./models/VisitingPlan.js";

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB bağlantısı başarılı");

    app.listen(PORT, () => {
      console.log(`Sunucu ${PORT} portunda çalışıyor`);
    });
  })
  .catch((err) => {
    console.error("MongoDB bağlantı hatası:", err);
  });


app.post("/landmarks", async (req, res) => {
  try {
    const { name, latitude, longitude, description, category } = req.body;

    if (!name || !latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "İsim, enlem ve boylam zorunludur" });
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
    console.error("Landmark oluşturma hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.get("/landmarks", async (req, res) => {
  try {
    const landmarks = await Landmark.find();
    res.json(landmarks);
  } catch (error) {
    console.error("Landmark getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.get("/landmarks/:id", async (req, res) => {
  try {
    const landmark = await Landmark.findById(req.params.id);

    if (!landmark) {
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    res.json(landmark);
  } catch (error) {
    console.error("Landmark getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
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
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    res.json(updatedLandmark);
  } catch (error) {
    console.error("Landmark güncelleme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.delete("/landmarks/:id", async (req, res) => {
  try {
    const deletedLandmark = await Landmark.findByIdAndDelete(req.params.id);

    if (!deletedLandmark) {
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    await VisitedLandmark.deleteMany({ landmark_id: req.params.id });

    // Also remove this landmark from any plans
    await VisitingPlan.updateMany(
      { "landmarks.landmark_id": req.params.id },
      { $pull: { landmarks: { landmark_id: req.params.id } } }
    );

    res.json({ message: "Landmark başarıyla silindi" });
  } catch (error) {
    console.error("Landmark silme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});


app.post("/visited", async (req, res) => {
  try {
    const { landmark_id, visitor_name } = req.body;
    const visited_date = req.body.visited_date || new Date();

    if (!landmark_id) {
      return res.status(400).json({ error: "Landmark ID zorunludur" });
    }

    const landmark = await Landmark.findById(landmark_id);
    if (!landmark) {
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    const newVisit = new VisitedLandmark({
      landmark_id,
      visited_date,
      visitor_name: visitor_name || "Anonim",
    });

    const savedVisit = await newVisit.save();
    res.status(201).json(savedVisit);
  } catch (error) {
    console.error("Ziyaret kaydetme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
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
          landmark: landmark || { name: "Silinmiş Landmark" },
        };
      })
    );

    res.json(enrichedVisits);
  } catch (error) {
    console.error("Ziyaret geçmişi getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

app.get("/visited/:id", async (req, res) => {
  try {
    const visits = await VisitedLandmark.find({
      landmark_id: req.params.id,
    }).sort({ visited_date: -1 });

    res.json(visits);
  } catch (error) {
    console.error("Ziyaret geçmişi getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});


// Create a new visiting plan
app.post("/plans", async (req, res) => {
  try {
    const { name, creator, landmarks, description, is_public, planned_date } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Plan ismi zorunludur" });
    }

    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return res.status(400).json({ error: "En az bir landmark eklenmelidir" });
    }

    // Validate that all landmarks exist
    const landmarkIds = landmarks.map(item => item.landmark_id);
    const existingLandmarks = await Landmark.find({ _id: { $in: landmarkIds } });

    if (existingLandmarks.length !== landmarkIds.length) {
      return res.status(400).json({ error: "Bazı landmarklar bulunamadı" });
    }

    // Add order if not provided
    const landmarksWithOrder = landmarks.map((item, index) => ({
      ...item,
      order: item.order || index
    }));

    const newPlan = new VisitingPlan({
      name,
      creator: creator || "Anonim",
      landmarks: landmarksWithOrder,
      description: description || "",
      is_public: is_public !== undefined ? is_public : true,
      planned_date: planned_date || null
    });

    const savedPlan = await newPlan.save();

    // Populate landmark details for the response
    const populatedPlan = await VisitingPlan.findById(savedPlan._id);
    const enrichedPlan = {
      ...populatedPlan._doc,
      landmarks: await Promise.all(
        populatedPlan.landmarks.map(async (item) => {
          const landmark = await Landmark.findById(item.landmark_id);
          return {
            ...item._doc,
            landmark_details: landmark || { name: "Silinmiş Landmark" }
          };
        })
      )
    };

    res.status(201).json(enrichedPlan);
  } catch (error) {
    console.error("Ziyaret planı oluşturma hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Get all visiting plans
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
              landmark_details: landmark || { name: "Silinmiş Landmark" }
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
    console.error("Ziyaret planlarını getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});



export default app;