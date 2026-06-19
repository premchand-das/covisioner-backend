import TalentProfile from "../models/talentProfile.model.js";
import User from "../models/user.model.js";

export const getAllTalent = async (req, res) => {
  try {
    const { search, skill, availability, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      const searchText = String(search).trim();

      query.$or = [
        { fullname: { $regex: searchText, $options: "i" } },
        { headline: { $regex: searchText, $options: "i" } },
        { bio: { $regex: searchText, $options: "i" } },
        { skills: { $regex: searchText, $options: "i" } },
      ];
    }

    if (skill) {
      query.skills = {
        $in: [String(skill).trim().toLowerCase()],
      };
    }

    if (availability) {
      query.availability = String(availability).trim();
    }

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const talent = await TalentProfile.find(query)
      .populate("user", "username email avatar role")
      .sort({ verifiedBadge: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const totalTalent = await TalentProfile.countDocuments(query);

    return res.status(200).json({
      success: true,
      talent,
      pagination: {
        totalTalent,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalTalent / limitNumber),
      },
    });
  } catch (error) {
    console.error("GET TALENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch talent",
    });
  }
};

export const getTalentByUsername = async (req, res) => {
  try {
    const username = String(req.params.username || "")
      .trim()
      .toLowerCase();

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const user = await User.findOne({
      username,
      role: "talent",
    }).select("_id username email avatar role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Talent not found",
      });
    }

    const profile = await TalentProfile.findOne({
      user: user._id,
    })
      .populate("user", "username email avatar role")
      .select("-__v")
      .lean();

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Talent profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("GET TALENT BY USERNAME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch talent profile",
    });
  }
};