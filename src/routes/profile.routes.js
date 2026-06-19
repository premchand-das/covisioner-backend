import express from "express";
import {
  createProfile,
  getMyProfile,
  getProfileByUserId,
  updateProfile,
} from "../controllers/profile.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";

import {
  createTalentProfileSchema,
  updateTalentProfileSchema,
  getTalentProfileByUserIdSchema,
} from "../validators/talentProfile.validator.js";

const router = express.Router();

router.post(
  "/",
  protect,
  validate(createTalentProfileSchema),
  createProfile
);

router.get("/me", protect, getMyProfile);

router.get(
  "/:userId",
  protect,
  validate(getTalentProfileByUserIdSchema),
  getProfileByUserId
);

router.put(
  "/me",
  protect,
  validate(updateTalentProfileSchema),
  updateProfile
);

export default router;