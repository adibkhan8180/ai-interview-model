import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["human", "ai"], required: true },
  content: { type: String, required: true },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    interviewType: {
      type: String,
      enum: ["HR", "domain-specific"],
      required: true,
    },

    hrRoundType: {
      type: String,
      enum: [
        "screening",
        "situational",
        "stress",
        "behavioral",
        "cultural-fit",
      ],
    },

    //domain specific
    jobRole: { type: String, trim: true },
    domain: { type: String, trim: true },

    inputType: {
      type: String,
      enum: ["skills-based", "job-description"],
    },
    skills: {
      type: [String],
      trim: true,
    },
    jobDescription: {
      type: String,
      trim: true,
    },

    chatHistory: [messageSchema],
    status: {
      type: String,
      enum: ["active", "submitting", "completed"],
      default: "active",
    },
    currentStep: { type: String, default: "questioning" },
    lastFeedback: String,
    overallFeedback: Object,
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);
