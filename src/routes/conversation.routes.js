import express from "express";
import {
  createConversationFromApplication,
  getMyConversations,
} from "../controllers/conversation.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protect, getMyConversations);

router.post(
  "/from-application/:applicationId",
  protect,
  createConversationFromApplication
);

export default router;