import express from "express";
import passport from "../config/passport.js";

import {
  register,
  login,
  getMe,
  logout,
  refreshAccessToken,
  verifyEmailCode,
  completeOnboarding,
  forgotPassword,
  resetPassword,
  setUserRole,
} from "../controllers/auth.controller.js";

import { oauthCallback } from "../controllers/oauth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import validate from "../middleware/validate.middleware.js";

import {
  registerSchema,
  loginSchema,
  verifyEmailCodeSchema,
  setUserRoleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = express.Router();

const allowedRoles = ["talent", "startup"];

router.get("/google", (req, res, next) => {
  const role = req.query.role;

  if (!allowedRoles.includes(role)) {
    return res.redirect(`${process.env.FRONTEND_URL}/signup?error=invalid_role`);
  }

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role,
    session: false,
  })(req, res, next);
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`,
  }),
  oauthCallback
);

router.get("/github", (req, res, next) => {
  const role = req.query.role;

  if (!allowedRoles.includes(role)) {
    return res.redirect(`${process.env.FRONTEND_URL}/signup?error=invalid_role`);
  }

  passport.authenticate("github", {
    scope: ["user:email"],
    state: role,
    session: false,
  })(req, res, next);
});

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=github_failed`,
  }),
  oauthCallback
);

router.post("/register", validate(registerSchema), register);
router.post("/verify-email", validate(verifyEmailCodeSchema), verifyEmailCode);
router.post("/login", validate(loginSchema), login);

router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordSchema), resetPassword);

router.post("/set-role", protect, validate(setUserRoleSchema), setUserRole);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logout);

router.get("/me", protect, getMe);
router.patch("/complete-onboarding", protect, completeOnboarding);

export default router;