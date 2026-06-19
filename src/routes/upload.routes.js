import express from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import upload from "../middleware/upload.middleware.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (!err) return next();

      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Image size must be less than 5MB",
        });
      }

      return res.status(400).json({
        message: err.message || "Upload failed",
      });
    });
  },
  uploadImage
);

export default router;