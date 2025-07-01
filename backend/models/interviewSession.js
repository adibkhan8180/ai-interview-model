import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["human", "ai"], required: true },
  content: { type: String, required: true },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    interviewType: {
      type: String,
      enum: ["general", "HR", "domain-specific"],
      required: true,
    },
    domain: { type: String, trim: true },
    chatHistory: [messageSchema],
    status: { type: String, enum: ["active", "submitting", "completed"], default: "active" },
    currentStep: { type: String, default: "questioning" },
    lastFeedback: String,
    overallFeedback: Object,
    inputType: {
      type: String,
      enum: ["skills-based", "job-description"],
      required: true,
    },
    skills: {
      type: [String],
      trim: true,
    },
    jobDescription: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);
