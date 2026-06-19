import User from "../models/user.model.js";
import TalentProfile from "../models/talentProfile.model.js";
import Startup from "../models/startup.model.js";

export const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.onboardingCompleted) {
      return res.status(400).json({ message: "Already completed" });
    }

    const { role } = req.body;

    // 🔥 Set role if missing
    if (!user.role) {
      if (!role) {
        return res.status(400).json({ message: "Role required" });
      }
      user.role = role;
    }

    let profile;

    // 👨‍💻 TALENT
    if (user.role === "talent") {
      profile = await TalentProfile.create({
        user: user._id,
        ...req.body,
      });
    }

    // 🏢 STARTUP
    else if (user.role === "recruiter") {
      profile = await Startup.create({
        createdBy: user._id,
        ...req.body,
      });
    }

    user.onboardingCompleted = true;
    await user.save();

    res.status(201).json({
      message: "Onboarding completed",
      profile,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default completeOnboarding;