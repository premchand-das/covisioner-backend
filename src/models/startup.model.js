import mongoose from "mongoose";

const startupSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    startupName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    logo: {
      type: String,
      default: "",
    },

    coverImage: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      trim: true,
      default: "",
    },

    tagline: {
      type: String,
      trim: true,
      maxlength: 160,
      default: "",
    },

    vision: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    mission: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    problemStatement: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },

    whyJoinUs: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },

    fundingStage: {
      type: String,
      enum: [
        "idea",
        "bootstrapped",
        "pre-seed",
        "seed",
        "series-a",
        "series-b",
        "series-c",
        "profitable",
      ],
      default: "idea",
    },

    teamSize: {
      type: String,
      enum: ["1-5", "6-10", "11-50", "51-100", "100+"],
      default: "1-5",
    },

    foundedYear: {
      type: Number,
      min: 1900,
    },

    technologies: [
      {
        type: String,
        trim: true,
        lowercase: true,
        index: true,
      },
    ],

    achievements: [
      {
        title: {
          type: String,
          trim: true,
        },

        issuer: {
          type: String,
          trim: true,
          default: "",
        },

        year: {
          type: String,
          trim: true,
          default: "",
        },

        description: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    milestones: [
      {
        title: {
          type: String,
          trim: true,
        },

        date: {
          type: Date,
        },

        description: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    team: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        name: {
          type: String,
          trim: true,
          default: "",
        },

        role: {
          type: String,
          trim: true,
          default: "",
        },

        avatar: {
          type: String,
          default: "",
        },

        bio: {
          type: String,
          trim: true,
          maxlength: 500,
          default: "",
        },

        linkedin: {
          type: String,
          trim: true,
          default: "",
        },

        twitter: {
          type: String,
          trim: true,
          default: "",
        },

        github: {
          type: String,
          trim: true,
          default: "",
        },

        isFounder: {
          type: Boolean,
          default: false,
        },
      },
    ],

    openPositions: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },

        description: {
          type: String,
          trim: true,
          default: "",
        },

        skillsRequired: [
          {
            type: String,
            trim: true,
            lowercase: true,
          },
        ],

        type: {
          type: String,
          enum: ["full-time", "part-time", "internship", "co-founder"],
          required: true,
        },
      },
    ],

    location: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
        default: "",
      },

      twitter: {
        type: String,
        trim: true,
        default: "",
      },

      github: {
        type: String,
        trim: true,
        default: "",
      },

      crunchbase: {
        type: String,
        trim: true,
        default: "",
      },
    },

    verifiedBadge: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);


// Indexes


startupSchema.index({
  startupName: "text",
  tagline: "text",
  vision: "text",
  mission: "text",
  problemStatement: "text",
  whyJoinUs: "text",
  bio: "text",
  industry: "text",
  location: "text",
  "team.name": "text",
  "team.role": "text",
});

startupSchema.index({
  startupName: 1,
});



startupSchema.index({
  fundingStage: 1,
});





export default mongoose.model("Startup", startupSchema);