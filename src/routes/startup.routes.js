import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {validate} from "../middleware/validate.middleware.js";
import {

  createStartup,
  deleteStartup,
  getAllStartups,
  getMyStartup,
  getSingleStartup,
  updateStartup,
} from "../controllers/startup.controller.js";
import { createStartupSchema, updateStartupSchema } from "../validators/startup.validator.js";

const router = express.Router();

router.get("/", getAllStartups);

router.get("/me", protect, getMyStartup);
router.post("/", protect, validate(createStartupSchema), createStartup);
router.put("/me", protect, validate(updateStartupSchema), updateStartup);
router.delete("/me", protect, deleteStartup);
router.get("/:id", getSingleStartup);

export default router;