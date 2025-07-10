import express from "express";
import { getDomains, getJobRoles } from "../controllers/jobsController.js";

const router = express.Router();

router.get("/domains", getDomains);
router.get("/roles/:domainId", getJobRoles);

export default router;