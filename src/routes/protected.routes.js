import express from "express";
import { protect, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// only logged-in users
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// only recruiter
router.get("/recruiter-only", protect, requireRole("recruiter"), (req, res) => {
  res.json({ message: "Recruiter access granted" });
});

// only talent
router.get("/talent-only", protect, requireRole("talent"), (req, res) => {
  res.json({ message: "Talent access granted" });
});

export default router;