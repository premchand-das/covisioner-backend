import mongoose from "mongoose";
import slugify from "slugify";
import Startup from "../models/startup.model.js";
import Job from "../models/job.model.js";
import User from "../models/user.model.js";

const generateUniqueSlug = async (startupName, excludeStartupId = null) => {
  const baseSlug = slugify(startupName || "startup", {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug || "startup";
  let counter = 1;

  while (
    await Startup.findOne({
      slug,
      ...(excludeStartupId ? { _id: { $ne: excludeStartupId } } : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

const populateStartup = (query) => {
  return query
    .populate("createdBy", "username email avatar role onboardingCompleted")
    .populate("team.user", "username email avatar role")
    .select("-__v");
};

const cleanTeam = (team = []) => {
  if (!Array.isArray(team)) return [];

  return team.map((member) => ({
    user: member.user || undefined,
    name: member.name || "",
    role: member.role || "",
    avatar: member.avatar || "",
    bio: member.bio || "",
    linkedin: member.linkedin || "",
    twitter: member.twitter || "",
    github: member.github || "",
    isFounder: Boolean(member.isFounder),
  }));
};

const createFounderTeamMember = (user) => ({
  user: user._id,
  name: user.username || "",
  role: "Founder",
  avatar: user.avatar || "",
  bio: "",
  linkedin: "",
  twitter: "",
  github: "",
  isFounder: true,
});

export const createStartup = async (req, res) => {
  try {
    const existingStartup = await Startup.findOne({
      createdBy: req.user._id,
    });

    if (existingStartup) {
      return res.status(400).json({
        success: false,
        message: "You already created a startup profile",
      });
    }

    if (!req.body.startupName) {
      return res.status(400).json({
        success: false,
        message: "Startup name is required",
      });
    }

    const slug = await generateUniqueSlug(req.body.startupName);

    const incomingTeam = cleanTeam(req.body.team);

    const founderMember = createFounderTeamMember(req.user);

    const startup = await Startup.create({
      ...req.body,
      slug,
      createdBy: req.user._id,

      vision: req.body.vision || "",
      mission: req.body.mission || "",
      problemStatement: req.body.problemStatement || "",
      whyJoinUs: req.body.whyJoinUs || "",

      socialLinks: {
        linkedin: req.body.socialLinks?.linkedin || "",
        twitter: req.body.socialLinks?.twitter || "",
        github: req.body.socialLinks?.github || "",
        crunchbase: req.body.socialLinks?.crunchbase || "",
      },

      team: [
        founderMember,
        ...incomingTeam.filter(
          (member) =>
            String(member.user || "") !== String(req.user._id)
        ),
      ],
    });

    await User.findByIdAndUpdate(req.user._id, {
      startup: startup._id,
      onboardingCompleted: true,
    });

    const populatedStartup = await populateStartup(
      Startup.findById(startup._id)
    );

    return res.status(201).json({
      success: true,
      message: "Startup profile created successfully",
      startup: populatedStartup,
    });
  } catch (error) {
    console.error("CREATE STARTUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create startup",
    });


  }
    console.log("REQ BODY");
  console.log(req.body);

  console.log("VALIDATED");
  console.log(req.validated);
};

export const getMyStartup = async (req, res) => {
  try {
    const startup = await populateStartup(
      Startup.findOne({
        createdBy: req.user._id,
      })
    );

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup profile not found",
      });
    }

    const openJobs = await Job.find({
      startup: startup._id,
      status: "open",
    })
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      startup,
      openJobs,
    });
  } catch (error) {
    console.error("GET MY STARTUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch your startup profile",
    });
  }
};

export const updateStartup = async (req, res) => {
  try {
    const startup = await Startup.findOne({
      createdBy: req.user._id,
    });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup profile not found",
      });
    }

    const oldName = startup.startupName;

    const payload = { ...req.body };

    if (payload.team) {
      payload.team = cleanTeam(payload.team);
    }

    if (payload.socialLinks) {
      payload.socialLinks = {
        linkedin: payload.socialLinks.linkedin || "",
        twitter: payload.socialLinks.twitter || "",
        github: payload.socialLinks.github || "",
        crunchbase: payload.socialLinks.crunchbase || "",
      };
    }

    Object.assign(startup, payload);

    if (payload.startupName && payload.startupName !== oldName) {
      startup.slug = await generateUniqueSlug(payload.startupName, startup._id);
    }

    await startup.save();

    await User.findByIdAndUpdate(req.user._id, {
      startup: startup._id,
      onboardingCompleted: true,
    });

    const populatedStartup = await populateStartup(
      Startup.findById(startup._id)
    );

    return res.status(200).json({
      success: true,
      message: "Startup profile updated successfully",
      startup: populatedStartup,
    });
  } catch (error) {
    console.error("UPDATE STARTUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update startup profile",
    });
  }
};

export const getAllStartups = async (req, res) => {
  try {
    const { search, industry, location, fundingStage, technology } = req.query;

    const query = {};

    if (industry) {
      query.industry = { $regex: industry, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    if (fundingStage) {
      query.fundingStage = fundingStage;
    }

    if (technology) {
      query.technologies = {
        $in: [String(technology).toLowerCase()],
      };
    }

    if (search) {
      const searchText = String(search).trim();
      const lowerSearch = searchText.toLowerCase();

      query.$or = [
        { startupName: { $regex: searchText, $options: "i" } },
        { tagline: { $regex: searchText, $options: "i" } },
        { vision: { $regex: searchText, $options: "i" } },
        { mission: { $regex: searchText, $options: "i" } },
        { problemStatement: { $regex: searchText, $options: "i" } },
        { whyJoinUs: { $regex: searchText, $options: "i" } },
        { bio: { $regex: searchText, $options: "i" } },
        { industry: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { technologies: { $in: [lowerSearch] } },
        { "team.name": { $regex: searchText, $options: "i" } },
        { "team.role": { $regex: searchText, $options: "i" } },
      ];
    }

    const startups = await Startup.find(query)
      .select("-__v")
      .sort({ verifiedBadge: -1, createdAt: -1 })
      .lean();

    const startupsWithJobs = await Promise.all(
      startups.map(async (startup) => {
        const openJobsCount = await Job.countDocuments({
          startup: startup._id,
          status: "open",
        });

        return {
          ...startup,
          openJobsCount,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: startupsWithJobs.length,
      startups: startupsWithJobs,
    });
  } catch (error) {
    console.error("GET ALL STARTUPS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch startups",
    });
  }
};

export const getSingleStartup = async (req, res) => {
  try {
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? {
          $or: [{ _id: id }, { slug: id }],
        }
      : {
          slug: id,
        };

    const startup = await populateStartup(Startup.findOne(query));

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    const openJobs = await Job.find({
      startup: startup._id,
      status: "open",
    })
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      startup,
      openJobs,
    });
  } catch (error) {
    console.error("GET SINGLE STARTUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch startup",
    });
  }
};

export const deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findOne({
      createdBy: req.user._id,
    });

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup profile not found",
      });
    }

    await Job.deleteMany({
      startup: startup._id,
    });

    await Startup.findByIdAndDelete(startup._id);

    await User.findByIdAndUpdate(req.user._id, {
      onboardingCompleted: false,
      $unset: {
        startup: "",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Startup profile deleted successfully",
    });
  } catch (error) {
    console.error("DELETE STARTUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete startup profile",
    });
  }
};