import express from "express";
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
} from "../controllers/message.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:conversationId", protect, getMessages);
router.post("/:conversationId", protect, sendMessage);
router.patch("/:conversationId/read", protect, markMessagesAsRead);

router.patch("/message/:messageId/edit", protect, editMessage);
router.delete("/message/:messageId/me", protect, deleteMessageForMe);
router.delete("/message/:messageId/everyone", protect, deleteMessageForEveryone);

export default router;