import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import interviewRoutes from "./src/routes/interviewRoutes.js";
import jobRoutes from "./src/routes/jobRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { connectDB } from "./src/config/database.js";

dotenv.config();

const app = express();
// const PORT = process.env.PORT || 8080;

let isConnected = false;

async function connectToMongoDB() {
  try {
    if (!isConnected) {
      await connectDB();
      isConnected = true;
    }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}

app.use(async (req, res, next) => {
  if (!isConnected) {
    await connectToMongoDB();
  }
  next();
});

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", interviewRoutes);
app.use("/api", jobRoutes);

app.use(errorHandler);

// app.listen(PORT, () => {
//   console.log(`Interview API Server running on port ${PORT}`);
// });

export default app;
