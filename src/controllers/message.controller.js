import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
import {
  sendRealtimeMessage,
  sendRealtimeNotification,
} from "../config/socket.js";

const getMessageLink = (role) =>
  role === "startup" ? "/startup/messages" : "/talent/messages";

export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 30, search = "" } = req.query;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const query = {
      conversation: conversationId,
      deletedFor: { $ne: userId },
    };

    if (search.trim()) {
      query.text = { $regex: search.trim(), $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const messages = await Message.find(query)
      .populate("sender", "username email avatar role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments(query);

    return res.status(200).json({
      messages: messages.reverse(),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: skip + messages.length < total,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text: text.trim(),
    });

    conversation.lastMessage = message._id;

    conversation.participants.forEach((participantId) => {
      const id = participantId.toString();

      if (id !== userId.toString()) {
        const currentCount = conversation.unreadCounts.get(id) || 0;
        conversation.unreadCounts.set(id, currentCount + 1);
      }
    });

    await conversation.save();

    const populatedMessage = await message.populate(
      "sender",
      "username email avatar role"
    );

    const receiver = conversation.participants.find(
      (participantId) => participantId.toString() !== userId.toString()
    );

    if (receiver) {
      const notification = await Notification.create({
        recipient: receiver,
        sender: userId,
        type: "message",
        title: "New Message",
        message: `${populatedMessage.sender.username} sent you a message`,
        link: getMessageLink(req.user.role),
      });

      sendRealtimeNotification(receiver.toString(), notification);
    }

    sendRealtimeMessage(conversationId, populatedMessage);

    return res.status(201).json({
      message: "Message sent",
      newMessage: populatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text is required" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You can edit only your message" });
    }

    message.text = text.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await message.populate(
      "sender",
      "username email avatar role"
    );

    sendRealtimeMessage(message.conversation.toString(), populatedMessage);

    return res.status(200).json({
      message: "Message updated",
      updatedMessage: populatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteMessageForMe = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (!message.deletedFor.some((id) => id.toString() === userId.toString())) {
      message.deletedFor.push(userId);
      await message.save();
    }

    return res.status(200).json({
      message: "Message deleted for you",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can delete only your message for everyone",
      });
    }

    message.text = "This message was deleted";
    message.isDeleted = true;
    message.isEdited = false;

    await message.save();

    const populatedMessage = await message.populate(
      "sender",
      "username email avatar role"
    );

    sendRealtimeMessage(message.conversation.toString(), populatedMessage);

    return res.status(200).json({
      message: "Message deleted for everyone",
      deletedMessage: populatedMessage,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({ message: "Not allowed" });
    }

await Message.updateMany(
  {
    conversation: conversationId,
    sender: { $ne: userId },
    isRead: false,
  },
  {
    $set: {
      isRead: true,
      readAt: new Date(),
    },
  }
);

    conversation.unreadCounts.set(userId.toString(), 0);
    await conversation.save();

    return res.status(200).json({
      message: "Messages marked as read",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessageForMe,
  deleteMessageForEveryone,
  markMessagesAsRead,
};