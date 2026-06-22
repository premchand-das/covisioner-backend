import Application from "../models/application.model.js";
import Job from "../models/job.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import Startup from "../models/startup.model.js";
import Notification from "../models/notification.model.js";
import { sendRealtimeNotification } from "../config/socket.js";

const VALID_APPLICATION_STATUSES = [
  "pending",
  "reviewed",
  "shortlisted",
  "interview",
  "offer",
  "accepted",
  "rejected",
];

// APPLY TO JOB
// APPLY TO JOB
export const applyToJob = async (req, res) => {
  try {
    if (req.user.role !== "talent") {
      return res.status(403).json({
        message: "Only talent users can apply to jobs",
      });
    }

    const { jobId } = req.params;
    const { coverLetter = "", resumeUrl = "" } = req.body;

    const job = await Job.findById(jobId);

    if (!job || job.status !== "open") {
      return res.status(404).json({
        message: "Job not found or closed",
      });
    }

    if (job.createdBy.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: "You cannot apply to your own job",
      });
    }

    const talentProfile = await TalentProfile.findOne({
      user: req.user._id,
    });

    if (!talentProfile) {
      return res.status(400).json({
        message: "Complete your talent profile before applying",
      });
    }

    const existingApplication = await Application.findOne({
      job: job._id,
      applicant: req.user._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You already applied to this job",
      });
    }

    const application = await Application.create({
      job: job._id,
      startup: job.startup,

      applicant: req.user._id,
      talent: req.user._id,

      talentProfile: talentProfile._id,
      coverLetter,
      resumeUrl,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          updatedBy: req.user._id,
          updatedAt: new Date(),
        },
      ],
    });

    await Job.findByIdAndUpdate(job._id, {
      $inc: {
        applicantsCount: 1,
      },
    });

    const notification = await Notification.create({
      recipient: job.createdBy,
      sender: req.user._id,
      type: "application",
      title: "New job application",
      message: `${req.user.username} applied to your job: ${job.title}`,
      link: "/startup/applications",
    });

    sendRealtimeNotification(job.createdBy.toString(), notification);

    const populatedApplication = await Application.findById(application._id)
      .populate("job", "title employmentType location status")
      .populate("startup", "startupName logo industry")
   
      .populate("talent", "username email avatar")
      .populate("talentProfile", "fullname headline skills avatar");

    return res.status(201).json({
      message: "Applied successfully",
      application: populatedApplication,
    });
  } catch (error) {
    console.log("APPLY JOB ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "You already applied to this job",
      });
    }

    return res.status(500).json({ message: error.message });
  }
};

// TALENT: GET MY APPLICATIONS
export const getMyApplications = async (req, res) => {
  try {
    if (req.user.role !== "talent") {
      return res.status(403).json({
        message: "Only talent users can view their applications",
      });
    }

    const applications = await Application.find({
      talent: req.user._id,
    })
      .populate("job", "title employmentType location status experienceLevel salaryRange")
      .populate("startup", "startupName logo industry location")
      .populate("talentProfile", "fullname headline avatar skills")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// STARTUP: GET APPLICATIONS FOR MY JOBS
export const getStartupApplications = async (req, res) => {
  try {
    if (req.user.role !== "startup") {
      return res.status(403).json({
        message: "Only startup users can view applications",
      });
    }

    const startup = await Startup.findOne({
      createdBy: req.user._id,
    });

    if (!startup) {
      return res.status(404).json({
        message: "Startup profile not found",
      });
    }

    const applications = await Application.find({
      startup: startup._id,
    })
      .populate("job", "title employmentType location status experienceLevel salaryRange")
      .populate("talent", "username email avatar")
      .populate(
        "talentProfile",
        "fullname headline skills avatar bio experience projects socialLinks availability verifiedBadge"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      applications,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// STARTUP: UPDATE APPLICATION STATUS
export const updateApplicationStatus = async (req, res) => {
  try {
    if (req.user.role !== "startup") {
      return res.status(403).json({
        message: "Only startup users can update applications",
      });
    }

    const {
      status,
      startupNotes,
      rating,
      interview,
      offer,
    } = req.body;

    if (!VALID_APPLICATION_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid application status",
      });
    }

    const startup = await Startup.findOne({
      createdBy: req.user._id,
    });

    if (!startup) {
      return res.status(404).json({
        message: "Startup profile not found",
      });
    }

    const application = await Application.findOne({
      _id: req.params.id,
      startup: startup._id,
    }).populate("job");

    if (!application) {
      return res.status(404).json({
        message: "Application not found or not authorized",
      });
    }

    application.status = status;

    application.statusHistory.push({
      status,
      updatedBy: req.user._id,
      updatedAt: new Date(),
    });

    if (typeof startupNotes === "string") {
      application.startupNotes = startupNotes;
    }

    if (typeof rating === "number") {
      application.rating = rating;
    }

    if (interview && typeof interview === "object") {
      application.interview = {
        ...application.interview,
        ...interview,
      };
    }

    if (offer && typeof offer === "object") {
      application.offer = {
        ...application.offer,
        ...offer,
        sentAt: status === "offer" ? new Date() : application.offer?.sentAt,
      };
    }

    await application.save();

    const notification = await Notification.create({
      recipient: application.talent,
      sender: req.user._id,
      type: "application",
      title: `Application ${status}`,
      message: `Your application for ${application.job.title} was ${status}.`,
      link: "/talent/applications",
    });

    sendRealtimeNotification(application.talent.toString(), notification);

    const populatedApplication = await Application.findById(application._id)
      .populate("job", "title employmentType location status experienceLevel salaryRange")
      .populate("talent", "username email avatar")
      .populate(
        "talentProfile",
        "fullname headline skills avatar bio experience projects socialLinks availability verifiedBadge"
      );

    return res.status(200).json({
      message: "Application status updated",
      application: populatedApplication,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  applyToJob,
  getMyApplications,
  getStartupApplications,
  updateApplicationStatus,
};