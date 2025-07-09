import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
    domain: { type: String, required: true, unique: true },
    job_roles: [{ type: String }],
});

export const Job = mongoose.model("Job", jobSchema);