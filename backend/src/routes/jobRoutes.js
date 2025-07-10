import express from "express";
import { getDomains, getJobRoles, searchJobRoles } from "../controllers/jobsController.js";
import { validateParams, validateBody, validateQuery } from "../middleware/validate.js";
import { domainIdParamSchema, searchJobRolesQuerySchema } from "../../validators/jobValidator.js";

const router = express.Router();

router.get("/domains", getDomains);
router.get("/roles/search", validateQuery(searchJobRolesQuerySchema), searchJobRoles);
router.get("/roles/:domainId", validateParams(domainIdParamSchema), getJobRoles);

export default router;