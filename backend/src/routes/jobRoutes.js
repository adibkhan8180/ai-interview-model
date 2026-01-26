import express from "express";
import { getDomains, getJobRoles, searchJobRoles, recommendedSkills } from "../controllers/jobsController.js";
import { validateParams, validateBody, validateQuery } from "../middleware/validate.js";
import { domainIdParamSchema, recommendedSkillsBodySchema, searchJobRolesQuerySchema } from "../validators/jobValidator.js";

const router = express.Router();

router.get("/domains", getDomains);
router.get("/roles/search", validateQuery(searchJobRolesQuerySchema), searchJobRoles);
router.get("/roles/:domainId", validateParams(domainIdParamSchema), getJobRoles);
router.post("/skills", validateBody(recommendedSkillsBodySchema),recommendedSkills);

export default router;