import mongoose from "mongoose";

const savedJobSchema = new mongoose.Schema(
  {
    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

savedJobSchema.index({ talent: 1, job: 1 }, { unique: true });

export default mongoose.model("SavedJob", savedJobSchema);