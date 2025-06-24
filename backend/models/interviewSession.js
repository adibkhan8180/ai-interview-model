import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["human", "ai"], required: true },
  content: { type: String, required: true },
});

const interviewSessionSchema = new mongoose.Schema(
  {
    companyName: String,
    jobRole: String,
    jobDescription: String,
    interviewType: String,
    chatHistory: [messageSchema],
    status: { type: String, default: "active" },
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
