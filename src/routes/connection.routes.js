import express from "express";
import {
  sendConnectionRequest,
  getMyConnectionRequests,
  getSentConnectionRequests,
  respondConnectionRequest,
} from "../controllers/connection.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:receiverId", protect, sendConnectionRequest);
router.get("/requests/received", protect, getMyConnectionRequests);
router.get("/requests/sent", protect, getSentConnectionRequests);
router.patch("/:id/respond", protect, respondConnectionRequest);

export default router;