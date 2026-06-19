import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },

    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    talentProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TalentProfile",
      required: true,
      index: true,
    },

    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },

    coverLetter: {
      type: String,
      maxlength: 1000,
      default: "",
      trim: true,
    },

    resumeUrl: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "reviewed",
        "shortlisted",
        "interview",
        "offer",
        "accepted",
        "rejected",
      ],
      default: "pending",
      index: true,
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "pending",
            "reviewed",
            "shortlisted",
            "interview",
            "offer",
            "accepted",
            "rejected",
          ],
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    startupNotes: {
      type: String,
      maxlength: 2000,
      default: "",
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    interview: {
      scheduledAt: Date,
      meetingLink: {
        type: String,
        default: "",
      },
      notes: {
        type: String,
        default: "",
      },
    },

    offer: {
      title: {
        type: String,
        default: "",
      },
      salary: {
        type: Number,
        default: 0,
      },
      message: {
        type: String,
        default: "",
      },
      sentAt: Date,
    },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, talent: 1 }, { unique: true });
applicationSchema.index({ startup: 1, status: 1, createdAt: -1 });
applicationSchema.index({ talent: 1, status: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });

applicationSchema.pre("save", function () {
  if (this.isNew && this.statusHistory.length === 0) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.talent,
      updatedAt: new Date(),
    });
  }


});

export default mongoose.model("Application", applicationSchema);