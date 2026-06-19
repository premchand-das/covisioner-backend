import express from "express";
import {
  getAllStartups,
  getStartupById,
  getStartupBySlug,
} from "../controllers/startupPublic.controller.js";

const router = express.Router();

router.get("/slug/:slug", getStartupBySlug);
router.get("/:id", getStartupById);

export default router;