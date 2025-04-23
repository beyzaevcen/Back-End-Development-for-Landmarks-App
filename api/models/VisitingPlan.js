import mongoose from "mongoose";

const visitingPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    creator: {
      type: String,
      default: "Anonymous",
      trim: true
    },
    landmarks: [
      {
        landmark_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Landmark",
          required: true
        },
        notes: {
          type: String,
          default: ""
        },
        order: {
          type: Number,
          default: 0
        }
      }
    ],
    description: {
      type: String,
      default: ""
    },
    is_public: {
      type: Boolean,
      default: true
    },
    planned_date: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const VisitingPlan = mongoose.model("VisitingPlan", visitingPlanSchema);

export default VisitingPlan;