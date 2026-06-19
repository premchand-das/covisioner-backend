import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const oauthCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=oauth_failed`
      );
    }

    if (!user.role) {
      return res.redirect(`${process.env.FRONTEND_URL}/signup?error=role_required`);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);

    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (!user.onboardingCompleted) {
      return res.redirect(`${process.env.FRONTEND_URL}/onboarding`);
    }

    if (user.role === "talent") {
      return res.redirect(`${process.env.FRONTEND_URL}/talent/explore/startups`);
    }

    if (user.role === "startup") {
      return res.redirect(`${process.env.FRONTEND_URL}/startup/startups`);
    }

    return res.redirect(`${process.env.FRONTEND_URL}/onboarding`);
  } catch (error) {
    console.log("OAUTH CALLBACK ERROR:", error);

    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    );
  }
};

export default oauthCallback;