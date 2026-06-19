import Connection from "../models/connection.model.js";
import User from "../models/user.model.js";
import notificationModel from "../models/notification.model.js";
import { sendRealtimeNotification } from "../config/socket.js";

export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.params;
    const { message, type } = req.body;

    if (receiverId === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot send request to yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "Receiver not found",
      });
    }

    const existingRequest = await Connection.findOne({
      sender: req.user._id,
      receiver: receiverId,
      type: type || "connect",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Request already sent",
      });
    }

    const connection = await Connection.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
      type: type || "connect",
    });

    const notification = await Notification.create({
      recipient: receiverId,
      sender: req.user._id,
      type: "connection",
      title: "New connection request",
      message: `${req.user.username} sent you a connection request`,
      link: `/connections`,
    });

    sendRealtimeNotification(receiverId, notification);

    return res.status(201).json({
      message: "Connection request sent",
      connection,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getMyConnectionRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", "username email avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getSentConnectionRequests = async (req, res) => {
  try {
    const requests = await Connection.find({
      sender: req.user._id,
    })
      .populate("receiver", "username email avatar role")
      .sort({ createdAt: -1 });

    return res.status(200).json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const respondConnectionRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const connection = await Connection.findOneAndUpdate(
      {
        _id: req.params.id,
        receiver: req.user._id,
        status: "pending",
      },
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!connection) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    return res.status(200).json({
      message: `Request ${status}`,
      connection,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};