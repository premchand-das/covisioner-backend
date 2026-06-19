import express from "express";
import {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  closeJob,
} from "../controllers/job.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles("startup"), createJob);
router.get("/", getAllJobs);
router.get("/my-jobs", protect, authorizeRoles("startup"), getMyJobs);
router.get("/:id", getJobById);
router.put("/:id", protect, authorizeRoles("startup"), updateJob);
router.patch("/:id/close", protect, authorizeRoles("startup"), closeJob);

export default router;