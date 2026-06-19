import mongoose from "mongoose";
import Job from "../models/job.model.js";
import Startup from "../models/startup.model.js";

const toArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

// CREATE JOB
export const createJob = async (req, res) => {
  try {
    if (req.user.role !== "startup") {
      return res.status(403).json({ message: "Only startup users can post jobs" });
    }

    const startup = await Startup.findOne({ createdBy: req.user._id });

    if (!startup) {
      return res.status(404).json({
        message: "Create startup profile before posting job",
      });
    }

    const job = await Job.create({
      ...req.body,
      startup: startup._id,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: "Job created successfully",
      job,
    });
  } catch (error) {
    console.log("CREATE JOB ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL JOBS WITH ADVANCED FILTERS
export const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      employmentType,
      experienceLevel,
      skill,
      skills,
      workplaceType,
      jobType,
      minSalary,
      maxSalary,
      minEquity,
      maxEquity,
      industry,
      fundingStage,
      startup,
      status = "open",
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    if (status !== "all") {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { skillsRequired: { $regex: search, $options: "i" } },
      ];
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const employmentTypes = toArray(employmentType);
    if (employmentTypes.length) {
      query.employmentType = { $in: employmentTypes };
    }

    const experienceLevels = toArray(experienceLevel);
    if (experienceLevels.length) {
      query.experienceLevel = { $in: experienceLevels };
    }

    const workplaceTypes = toArray(workplaceType);
    if (workplaceTypes.length) {
      query.workplaceType = { $in: workplaceTypes };
    }

    const jobTypes = toArray(jobType);
    if (jobTypes.length) {
      query.jobType = { $in: jobTypes };
    }

    const allSkills = [...toArray(skill), ...toArray(skills)].map((s) =>
      s.toLowerCase()
    );

    if (allSkills.length) {
      query.skillsRequired = { $in: allSkills };
    }

    const salaryMin = toNumber(minSalary);
    const salaryMax = toNumber(maxSalary);

    if (salaryMin !== undefined || salaryMax !== undefined) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          {
            "salary.min": {
              ...(salaryMax !== undefined ? { $lte: salaryMax } : {}),
            },
          },
          {
            "salary.max": {
              ...(salaryMin !== undefined ? { $gte: salaryMin } : {}),
            },
          },
        ],
      });
    }

    const equityMin = toNumber(minEquity);
    const equityMax = toNumber(maxEquity);

    if (equityMin !== undefined || equityMax !== undefined) {
      query.equity = {};
      if (equityMin !== undefined) query.equity.$gte = equityMin;
      if (equityMax !== undefined) query.equity.$lte = equityMax;
    }

    if (startup && mongoose.Types.ObjectId.isValid(startup)) {
      query.startup = startup;
    }

    let startupFilterIds = [];

    if (industry || fundingStage) {
      const startupQuery = {};

      const industries = toArray(industry);
      if (industries.length) {
        startupQuery.industry = { $in: industries };
      }

      const fundingStages = toArray(fundingStage);
      if (fundingStages.length) {
        startupQuery.fundingStage = { $in: fundingStages };
      }

      const startups = await Startup.find(startupQuery).select("_id");
      startupFilterIds = startups.map((s) => s._id);

      query.startup = { $in: startupFilterIds };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      salaryHighToLow: { "salary.max": -1 },
      salaryLowToHigh: { "salary.min": 1 },
      equityHighToLow: { equity: -1 },
      titleAZ: { title: 1 },
      titleZA: { title: -1 },
    };

    const selectedSort = sortOptions[sort] || sortOptions.newest;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const [jobs, totalJobs, facets] = await Promise.all([
      Job.find(query)
        .populate(
          "startup",
          "startupName slug logo tagline industry fundingStage location website"
        )
        .sort(selectedSort)
        .skip(skip)
        .limit(limitNumber),

      Job.countDocuments(query),

      Job.aggregate([
        { $match: query },
        {
          $facet: {
            employmentTypes: [
              { $group: { _id: "$employmentType", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            experienceLevels: [
              { $group: { _id: "$experienceLevel", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            workplaceTypes: [
              { $group: { _id: "$workplaceType", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
            ],
            locations: [
              { $group: { _id: "$location", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
            ],
            skills: [
              { $unwind: "$skillsRequired" },
              { $group: { _id: "$skillsRequired", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 30 },
            ],
            salaryRange: [
              {
                $group: {
                  _id: null,
                  minSalary: { $min: "$salary.min" },
                  maxSalary: { $max: "$salary.max" },
                },
              },
            ],
            equityRange: [
              {
                $group: {
                  _id: null,
                  minEquity: { $min: "$equity" },
                  maxEquity: { $max: "$equity" },
                },
              },
            ],
          },
        },
      ]),
    ]);

    res.status(200).json({
      jobs,
      filters: facets[0] || {},
      pagination: {
        totalJobs,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalJobs / limitNumber),
        limit: limitNumber,
        hasNextPage: pageNumber < Math.ceil(totalJobs / limitNumber),
        hasPrevPage: pageNumber > 1,
      },
    });
  } catch (error) {
    console.log("GET ALL JOBS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE JOB
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findOne({
      $or: [
        {
          _id: mongoose.Types.ObjectId.isValid(req.params.id)
            ? req.params.id
            : null,
        },
        { slug: req.params.id },
      ],
    }).populate(
      "startup",
      "startupName slug logo tagline industry location website fundingStage"
    );

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET MY POSTED JOBS
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ createdBy: req.user._id })
      .populate("startup", "startupName slug logo")
      .sort({ createdAt: -1 });

    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE JOB
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found or not authorized",
      });
    }

    res.status(200).json({
      message: "Job updated successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CLOSE JOB
export const closeJob = async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user._id,
      },
      { status: "closed" },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found or not authorized",
      });
    }

    res.status(200).json({
      message: "Job closed successfully",
      job,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default {
  createJob,
  getAllJobs,
  getJobById,
  getMyJobs,
  updateJob,
  closeJob,
};