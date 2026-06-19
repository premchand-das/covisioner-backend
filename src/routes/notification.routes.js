import express from "express";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notification.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMyNotifications);
router.patch("/:id/read", protect, markNotificationAsRead);
router.patch("/read-all", protect, markAllNotificationsAsRead);

router.delete("/", protect, clearAllNotifications);
router.delete("/:id", protect, deleteNotification);

export default router;