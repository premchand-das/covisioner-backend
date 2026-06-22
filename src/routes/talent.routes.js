import express from "express";
import {
  getAllTalent,
  getTalentByUsername,
} from "../controllers/talent.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

router.get("/", protect, authorizeRoles("startup"), getAllTalent);

router.get(
  "/username/:username",
 
  getTalentByUsername
);

export default router;