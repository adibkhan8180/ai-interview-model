import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["human", "ai"], required: true },
  content: { type: String, required: true },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    companyName: String,
    jobRole: String,
    interviewType: String,
    chatHistory: [messageSchema],
    status: { type: String, default: "active" },
    currentStep: { type: String, default: "questioning" },
    lastFeedback: String,
    overallFeedback: Object,
    inputType: String,
    skills: {
      type: [String],
      default: [],
    },
    jobDescription: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const InterviewSession = mongoose.model(
  "InterviewSession",
  interviewSessionSchema
);
