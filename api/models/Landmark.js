import mongoose from "mongoose";

const landmarkSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  description: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    enum: ["historical", "natural", "cultural", "other"],
    default: "other",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Landmark = mongoose.model("Landmark", landmarkSchema);

export default Landmark;
