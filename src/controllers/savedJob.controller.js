import SavedJob from "../models/savedJob.model.js";
import Job from "../models/job.model.js";

export const toggleSaveJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const existing = await SavedJob.findOne({
      talent: req.user._id,
      job: jobId,
    });

    if (existing) {
      await existing.deleteOne();

      return res.status(200).json({
        message: "Job removed from saved jobs",
        saved: false,
      });
    }

    await SavedJob.create({
      talent: req.user._id,
      job: jobId,
    });

    res.status(201).json({
      message: "Job saved successfully",
      saved: true,
    });
  } catch (error) {
    console.log("TOGGLE SAVE JOB ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMySavedJobs = async (req, res) => {
  try {
    const savedJobs = await SavedJob.find({ talent: req.user._id })
      .populate({
        path: "job",
        populate: {
          path: "startup",
          select: "startupName slug logo tagline industry location website",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      savedJobs,
    });
  } catch (error) {
    console.log("GET SAVED JOBS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export const checkSavedJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const savedJob = await SavedJob.findOne({
      talent: req.user._id,
      job: jobId,
    });

    res.status(200).json({
      saved: Boolean(savedJob),
    });
  } catch (error) {
    console.log("CHECK SAVED JOB ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  toggleSaveJob,
  getMySavedJobs,
  checkSavedJob,
};  