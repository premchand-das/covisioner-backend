import mongoose from "mongoose";
import slugify from "slugify";

const jobSchema = new mongoose.Schema(
  {
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: true,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      minlength: 10,
    },

    skillsRequired: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    employmentType: {
      type: String,
      enum: [
        "full-time",
        "part-time",
        "contract",
        "internship",
        "remote",
        "Co-founder",
      ],
      required: true,
      index: true,
    },

    experienceLevel: {
      type: String,
      enum: ["Co-founder","fresher", "junior", "mid", "senior"],
      default: "junior",
      index: true,
    },

salaryRange: {
  min: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  type: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },
},
      max: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    equityRange: {
      min: {
        type: Number,
        default: 0,
        min: 0,
      },
      max: {
        type: Number,
        default: 0,
        min: 0,
      },
      unit: {
        type: String,
        enum: ["percent"],
        default: "percent",
      },
    },

    location: {
      type: String,
      default: "Remote",
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: ["open", "closed", "archived"],
      default: "open",
      index: true,
    },

    applicantsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({
  title: "text",
  description: "text",
  location: "text",
  skillsRequired: "text",
});

jobSchema.index({
  startup: 1,
  status: 1,
});

jobSchema.index({
  createdBy: 1,
  createdAt: -1,
});

jobSchema.index({
  status: 1,
  createdAt: -1,
});

jobSchema.index({
  employmentType: 1,
  experienceLevel: 1,
  location: 1,
});

jobSchema.index({
  "salaryRange.min": 1,
  "salaryRange.max": 1,
});

jobSchema.index({
  "equityRange.min": 1,
  "equityRange.max": 1,
});

jobSchema.pre("save", async function () {
  if (!this.isModified("title")) return;

  const baseSlug =
    slugify(this.title || "job", {
      lower: true,
      strict: true,
      trim: true,
    }) || "job";

  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Job.findOne({
      slug,
      _id: { $ne: this._id },
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
});

export default mongoose.model("Job", jobSchema);