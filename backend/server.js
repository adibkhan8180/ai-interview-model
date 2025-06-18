import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import interviewRoutes from './src/routes/interviewRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', interviewRoutes);

// Error handling - If any route throws an error, this middleware will catch it and return a well-structured error response.
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Interview API Server running on port ${PORT}`);
});
