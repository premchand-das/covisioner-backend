import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 30,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: function () {
        return this.authProvider === "email";
      },
      select: false,
    },

    role: {
      type: String,
      enum: ["talent", "startup", null],
      default: null,
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["email", "google", "github"],
      default: "email",
      index: true,
    },

    providerId: {
      type: String,
      default: null,
      index: true,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    refreshTokens: {
      type: [String],
      default: [],
      select: false,
    },

    onboardingCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    savedJobs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Job",
      },
    ],

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },

    emailVerificationCode: {
      type: String,
      select: false,
    },

    emailVerificationCodeExpires: {
      type: Date,
      select: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

userSchema.index(
  { providerId: 1, authProvider: 1 },
  {
    sparse: true,
  }
);

userSchema.index({ createdAt: -1 });

export default mongoose.model("User", userSchema);