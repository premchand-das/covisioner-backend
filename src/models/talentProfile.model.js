import mongoose from "mongoose";

const talentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    fullname: {
      type: String,
      trim: true,
      minlength: 3,
      maxlength: 80,
      required: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    avatar: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    skills: {
      type: [
        {
          type: String,
          trim: true,
          lowercase: true,
          maxlength: 40,
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: "Maximum 30 skills allowed",
      },
    },

    experience: {
      type: [
        {
          title: { type: String, trim: true, maxlength: 80 },
          company: { type: String, trim: true, maxlength: 80 },
          startDate: Date,
          endDate: Date,
          description: { type: String, trim: true, maxlength: 500 },
        },
      ],
      default: [],
    },

    projects: {
      type: [
        {
          title: { type: String, trim: true, maxlength: 100 },
          description: { type: String, trim: true, maxlength: 700 },
          techStack: [{ type: String, trim: true, lowercase: true }],
          projectUrl: { type: String, trim: true, default: "" },
          githubUrl: { type: String, trim: true, default: "" },
        },
      ],
      default: [],
    },

    socialLinks: {
      linkedin: { type: String, trim: true, default: "" },
      github: { type: String, trim: true, default: "" },
      twitter: { type: String, trim: true, default: "" },
      portfolio: { type: String, trim: true, default: "" },
    },

    availability: {
      type: String,
      enum: ["open", "not-looking"],
      default: "open",
      index: true,
    },

    verifiedBadge: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

talentProfileSchema.index({
  fullname: "text",
  headline: "text",
  bio: "text",
  skills: "text",
});

talentProfileSchema.index({ skills: 1 });

talentProfileSchema.index({ createdAt: -1 });

export default mongoose.model("TalentProfile", talentProfileSchema);