import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import Landmark from "./models/Landmark.js";
import VisitedLandmark from "./models/VisitedLandmark.js";

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

// ---------- LANDMARK API ENDPOINTS ---------- //

// Create a new landmark
app.post("/api/landmarks", async (req, res) => {
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

// Get all landmarks
app.get("/api/landmarks", async (req, res) => {
  try {
    const landmarks = await Landmark.find();
    res.json(landmarks);
  } catch (error) {
    console.error("Landmark getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Get a specific landmark
app.get("/api/landmarks/:id", async (req, res) => {
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

// Update a landmark
app.put("/api/landmarks/:id", async (req, res) => {
  try {
    const { name, latitude, longitude, description, category } = req.body;

    // Güncellenecek verileri hazırla
    const updateData = {
      name,
      description,
      category,
    };

    // Konum bilgisi varsa güncelle
    if (latitude !== undefined && longitude !== undefined) {
      updateData.location = {
        latitude,
        longitude,
      };
    }

    const updatedLandmark = await Landmark.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true } // Güncellenmiş veriyi döndür
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

// Delete a landmark
app.delete("/api/landmarks/:id", async (req, res) => {
  try {
    const deletedLandmark = await Landmark.findByIdAndDelete(req.params.id);

    if (!deletedLandmark) {
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    // İlgili ziyaret kayıtlarını da sil
    await VisitedLandmark.deleteMany({ landmark_id: req.params.id });

    res.json({ message: "Landmark başarıyla silindi" });
  } catch (error) {
    console.error("Landmark silme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// ---------- VISITED LANDMARK API ENDPOINTS ---------- //

// Record a visited landmark
app.post("/api/visited", async (req, res) => {
  try {
    const { landmark_id, visitor_name, notes } = req.body;
    const visited_date = req.body.visited_date || new Date();

    if (!landmark_id) {
      return res.status(400).json({ error: "Landmark ID zorunludur" });
    }

    // Landmark'ın var olduğunu kontrol et
    const landmark = await Landmark.findById(landmark_id);
    if (!landmark) {
      return res.status(404).json({ error: "Landmark bulunamadı" });
    }

    const newVisit = new VisitedLandmark({
      landmark_id,
      visited_date,
      visitor_name: visitor_name || "Anonim",
      notes: notes || "",
    });

    const savedVisit = await newVisit.save();
    res.status(201).json(savedVisit);
  } catch (error) {
    console.error("Ziyaret kaydetme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Get all visited landmarks
app.get("/api/visited", async (req, res) => {
  try {
    // Ziyaret kayıtlarını al ve landmark bilgileriyle birleştir
    const visits = await VisitedLandmark.find().sort({ visited_date: -1 });

    // Landmark bilgilerini ekleyerek zenginleştirilmiş veri oluştur
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

// Get visit history for a specific landmark
app.get("/api/visited/:landmark_id", async (req, res) => {
  try {
    const visits = await VisitedLandmark.find({
      landmark_id: req.params.landmark_id,
    }).sort({ visited_date: -1 });

    res.json(visits);
  } catch (error) {
    console.error("Ziyaret geçmişi getirme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Update a visit record
app.put("/api/visited/:id", async (req, res) => {
  try {
    const { visitor_name, visited_date, notes } = req.body;

    const updatedVisit = await VisitedLandmark.findByIdAndUpdate(
      req.params.id,
      {
        visitor_name,
        visited_date,
        notes,
      },
      { new: true }
    );

    if (!updatedVisit) {
      return res.status(404).json({ error: "Ziyaret kaydı bulunamadı" });
    }

    res.json(updatedVisit);
  } catch (error) {
    console.error("Ziyaret güncelleme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

// Delete a visit record
app.delete("/api/visited/:id", async (req, res) => {
  try {
    const deletedVisit = await VisitedLandmark.findByIdAndDelete(req.params.id);

    if (!deletedVisit) {
      return res.status(404).json({ error: "Ziyaret kaydı bulunamadı" });
    }

    res.json({ message: "Ziyaret kaydı başarıyla silindi" });
  } catch (error) {
    console.error("Ziyaret silme hatası:", error);
    res.status(500).json({ error: "Sunucu hatası" });
  }
});

export default app;
