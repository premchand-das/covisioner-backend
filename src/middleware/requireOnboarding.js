import User from "../models/user.model.js";

export const requireOnboarding = async (req, res, next) => {
  const user = await User.findById(req.user._id);

  if (!user.onboardingCompleted) {
    return res.status(403).json({
      message: "Complete onboarding first",
    });
  }

  next();
};