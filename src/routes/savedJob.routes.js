import express from "express";
import {
  toggleSaveJob,
  getMySavedJobs,
  checkSavedJob,
} from "../controllers/savedJob.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("talent"), getMySavedJobs);
router.get("/:jobId/check", protect, authorizeRoles("talent"), checkSavedJob);
router.post("/:jobId/toggle", protect, authorizeRoles("talent"), toggleSaveJob);

export default router;