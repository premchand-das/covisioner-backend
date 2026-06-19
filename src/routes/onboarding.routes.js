import express from "express";
import { completeOnboarding } from "../controllers/onboarding.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, completeOnboarding);

export default router;