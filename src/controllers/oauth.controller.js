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
      return res.redirect(
        `${process.env.FRONTEND_URL}/signup?error=role_required`
      );
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);

    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    };

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const frontendUrl = process.env.FRONTEND_URL;

    if (!user.onboardingCompleted) {
      return res.redirect(`${frontendUrl}/onboarding`);
    }

    if (user.role === "talent") {
      return res.redirect(`${frontendUrl}/talent/saved-jobs`);
    }

    if (user.role === "startup") {
      return res.redirect(`${frontendUrl}/startup/dashboard`);
    }

    return res.redirect(`${frontendUrl}/onboarding`);
  } catch (error) {
    console.log("OAUTH CALLBACK ERROR:", error);

    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=oauth_failed`
    );
  }
};

export default oauthCallback;