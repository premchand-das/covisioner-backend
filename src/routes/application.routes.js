import express from "express";
import {
  applyToJob,
  getMyApplications,
  getStartupApplications,
  updateApplicationStatus,
} from "../controllers/application.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/jobs/:jobId/apply", protect, applyToJob);
router.get("/me", protect, getMyApplications);
router.get("/startup", protect, getStartupApplications);
router.patch("/:id/status", protect, updateApplicationStatus);

export default router;