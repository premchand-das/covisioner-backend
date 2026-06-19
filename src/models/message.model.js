import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
  type: Date,
  default: null,
},
    isEdited: { type: Boolean, default: false },
editedAt: Date,
deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);