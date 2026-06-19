import { de } from "zod/locales";
import Application from "../models/application.model.js";
import Conversation from "../models/conversation.model.js";

export const createConversationFromApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;

    const application = await Application.findById(applicationId)
      .populate("talent", "username email avatar role")
      .populate("startup");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const talentId = application.talent._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [userId, talentId] },
    }).populate("participants", "username email avatar role");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, talentId],
        unreadCounts: {
          [userId]: 0,
          [talentId]: 0,
        },
      });

      conversation = await conversation.populate(
        "participants",
        "username email avatar role"
      );
    }

    return res.status(200).json({
      message: "Conversation ready",
      conversation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "username email avatar role")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    return res.status(200).json({ conversations });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


export default {
  createConversationFromApplication,
  getMyConversations,
};