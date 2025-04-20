import mongoose from "mongoose";

const visitedLandmarkSchema = new mongoose.Schema({
  landmark_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Landmark",
    required: true,
  },
  visited_date: {
    type: Date,
    default: Date.now,
  },
  visitor_name: {
    type: String,
    default: "Anonim",
  },
  notes: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VisitedLandmark = mongoose.model(
  "VisitedLandmark",
  visitedLandmarkSchema
);

export default VisitedLandmark;
