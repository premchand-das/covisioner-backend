import { Server } from "socket.io";

let io;
const onlineUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userId) return;

      onlineUsers.set(userId.toString(), socket.id);
      console.log("User online:", userId);
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("joinConversation", (conversationId) => {
      if (!conversationId) return;
      socket.join(conversationId.toString());
    });

    socket.on("leaveConversation", (conversationId) => {
      if (!conversationId) return;
      socket.leave(conversationId.toString());
    });

    socket.on("typing", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      socket.to(conversationId.toString()).emit("typing", {
        conversationId,
        userId,
      });
    });

    socket.on("stopTyping", ({ conversationId, userId }) => {
      if (!conversationId || !userId) return;

      socket.to(conversationId.toString()).emit("stopTyping", {
        conversationId,
        userId,
      });
    });

    socket.on("getOnlineUsers", () => {
      socket.emit("onlineUsers", Array.from(onlineUsers.keys()));
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }

      io.emit("onlineUsers", Array.from(onlineUsers.keys()));

      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const sendRealtimeNotification = (userId, notification) => {
  const socketId = onlineUsers.get(userId.toString());

  if (socketId && io) {
    io.to(socketId).emit("notification", notification);
  }
};

export const sendRealtimeMessage = (conversationId, message) => {
  if (io) {
    io.to(conversationId.toString()).emit("newMessage", message);
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

export default {
  initSocket,
  sendRealtimeNotification,
  sendRealtimeMessage,
  getIO,
};