import TalentProfile from "../models/talentProfile.model.js";
import Startup from "../models/startup.model.js";
import User from "../models/user.model.js";
import slugify from "slugify";

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

// CREATE PROFILE / ONBOARDING
export const createProfile = async (req, res) => {
  try {
    let profile;

    if (req.user.role === "talent") {
      const existingProfile = await TalentProfile.findOne({
        user: req.user._id,
      });

      if (existingProfile) {
        return res.status(400).json({
          message: "Talent profile already exists",
        });
      }

      profile = await TalentProfile.create({
        user: req.user._id,
        ...req.body,
      });

      await User.findByIdAndUpdate(req.user._id, {
        onboardingCompleted: true,
      });
    }

    if (req.user.role === "startup") {
      const existingStartup = await Startup.findOne({
        createdBy: req.user._id,
      });

      if (existingStartup) {
        return res.status(400).json({
          message: "Startup profile already exists",
        });
      }

      if (!req.body.startupName) {
        return res.status(400).json({
          message: "Startup name is required",
        });
      }

      const slug = await generateUniqueSlug(req.body.startupName);

      profile = await Startup.create({
        createdBy: req.user._id,
        slug,
        ...req.body,
        team: [
          {
            user: req.user._id,
            role: "Founder",
          },
          ...(Array.isArray(req.body.team) ? req.body.team : []),
        ],
      });

      await User.findByIdAndUpdate(req.user._id, {
        onboardingCompleted: true,
        startup: profile._id,
      });
    }

    if (!profile) {
      return res.status(400).json({
        message: "Invalid user role",
      });
    }

    return res.status(201).json({
      message: "Profile created successfully",
      profile,
    });
  } catch (err) {
    console.log("CREATE PROFILE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

// GET MY PROFILE
export const getMyProfile = async (req, res) => {
  try {
    let profile;

    if (req.user.role === "talent") {
      profile = await TalentProfile.findOne({ user: req.user._id })
        .populate("user", "username email avatar role onboardingCompleted")
        .select("-__v");
    }

    if (req.user.role === "startup") {
      profile = await Startup.findOne({ createdBy: req.user._id })
        .populate("createdBy", "username email avatar role onboardingCompleted")
        .populate("team.user", "username email avatar role")
        .select("-__v");
    }

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET PROFILE BY USER ID
export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    let profile =
      (await TalentProfile.findOne({ user: userId })
        .populate("user", "username email avatar role")
        .select("-__v")) ||
      (await Startup.findOne({ createdBy: userId })
        .populate("createdBy", "username email avatar role")
        .populate("team.user", "username email avatar role")
        .select("-__v"));

    if (!profile) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({ profile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    let updated;

    if (req.user.role === "talent") {
      updated = await TalentProfile.findOneAndUpdate(
        { user: req.user._id },
        req.body,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("user", "username email avatar role onboardingCompleted")
        .select("-__v");
    }

    if (req.user.role === "startup") {
      const startup = await Startup.findOne({
        createdBy: req.user._id,
      });

      if (!startup) {
        return res.status(404).json({
          message: "Profile not found",
        });
      }

      const oldName = startup.startupName;

      Object.assign(startup, req.body);

      if (req.body.startupName && req.body.startupName !== oldName) {
        startup.slug = await generateUniqueSlug(
          req.body.startupName,
          startup._id
        );
      }

      await startup.save();

      await User.findByIdAndUpdate(req.user._id, {
        onboardingCompleted: true,
        startup: startup._id,
      });

      updated = await Startup.findById(startup._id)
        .populate("createdBy", "username email avatar role onboardingCompleted")
        .populate("team.user", "username email avatar role")
        .select("-__v");
    }

    if (!updated) {
      return res.status(404).json({
        message: "Profile not found",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully",
      profile: updated,
    });
  } catch (err) {
    console.log("UPDATE PROFILE ERROR:", err);
    return res.status(500).json({ error: err.message });
  }
};

export default {
  createProfile,
  getMyProfile,
  getProfileByUserId,
  updateProfile,
};