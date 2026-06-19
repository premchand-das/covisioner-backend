import mongoose from "mongoose";
import Startup from "../models/startup.model.js";
import Job from "../models/job.model.js";

const populateStartup = (query) => {
  return query
    .populate("createdBy", "username email avatar role onboardingCompleted")
    .populate("team.user", "username email avatar role")
    .select("-__v");
};

const getOpenJobsForStartup = async (startupId) => {
  return Job.find({
    startup: startupId,
    status: "open",
  })
    .select("-__v")
    .sort({ createdAt: -1 });
};

export const getAllStartups = async (req, res) => {
  try {
    const {
      search,
      industry,
      location,
      fundingStage,
      technology,
      sort = "newest",
    } = req.query;

    const query = {};

    const makeRegexArray = (value) =>
      String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => new RegExp(item, "i"));

    if (industry) {
      query.industry = { $in: makeRegexArray(industry) };
    }

    if (location) {
      query.location = { $regex: String(location).trim(), $options: "i" };
    }

    if (fundingStage) {
      query.fundingStage = { $in: makeRegexArray(fundingStage) };
    }

    if (technology) {
      query.technologies = { $in: makeRegexArray(technology) };
    }

    if (search) {
      const searchText = String(search).trim();

      query.$or = [
        { startupName: { $regex: searchText, $options: "i" } },
        { tagline: { $regex: searchText, $options: "i" } },
        { vision: { $regex: searchText, $options: "i" } },
        { mission: { $regex: searchText, $options: "i" } },
        { problemStatement: { $regex: searchText, $options: "i" } },
        { whyJoinUs: { $regex: searchText, $options: "i" } },
        { bio: { $regex: searchText, $options: "i" } },
        { industry: { $regex: searchText, $options: "i" } },
        { fundingStage: { $regex: searchText, $options: "i" } },
        { location: { $regex: searchText, $options: "i" } },
        { website: { $regex: searchText, $options: "i" } },
        { technologies: { $regex: searchText, $options: "i" } },
        { "team.name": { $regex: searchText, $options: "i" } },
        { "team.role": { $regex: searchText, $options: "i" } },
      ];
    }

    let sortQuery = {
      verifiedBadge: -1,
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortQuery = {
        verifiedBadge: -1,
        createdAt: 1,
      };
    }

    if (sort === "nameAZ") {
      sortQuery = {
        startupName: 1,
      };
    }

    if (sort === "nameZA") {
      sortQuery = {
        startupName: -1,
      };
    }

    const startups = await Startup.find(query)
      .select("-__v")
      .sort(sortQuery)
      .lean();

    const startupIds = startups.map((startup) => startup._id);

    const jobs = await Job.find({
      status: "open",
      startup: { $in: startupIds },
    })
      .select("startup")
      .lean();

    const jobCountMap = {};

    jobs.forEach((job) => {
      const startupId = job.startup?.toString();
      if (!startupId) return;

      jobCountMap[startupId] = (jobCountMap[startupId] || 0) + 1;
    });

    let startupsWithJobs = startups.map((startup) => {
      const startupId = startup._id.toString();

      return {
        ...startup,
        openJobsCount: jobCountMap[startupId] || 0,
      };
    });

    if (sort === "jobsHigh") {
      startupsWithJobs.sort((a, b) => b.openJobsCount - a.openJobsCount);
    }

    if (sort === "jobsLow") {
      startupsWithJobs.sort((a, b) => a.openJobsCount - b.openJobsCount);
    }

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
export const getStartupById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid startup id",
      });
    }

    const startup = await populateStartup(Startup.findById(id));

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    const openJobs = await getOpenJobsForStartup(startup._id);

    return res.status(200).json({
      success: true,
      startup,
      openJobs,
    });
  } catch (error) {
    console.error("GET STARTUP BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch startup",
    });
  }
};

export const getStartupBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const startup = await populateStartup(
      Startup.findOne({
        slug: String(slug).trim().toLowerCase(),
      })
    );

    if (!startup) {
      return res.status(404).json({
        success: false,
        message: "Startup not found",
      });
    }

    const openJobs = await getOpenJobsForStartup(startup._id);

    return res.status(200).json({
      success: true,
      startup,
      openJobs,
    });
  } catch (error) {
    console.error("GET STARTUP BY SLUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch startup",
    });
  }
};

export default {
  getAllStartups,
  getStartupById,
  getStartupBySlug,
};