import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateToken.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

const accessCookieOptions = {
  ...cookieOptions,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const getSafeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isVerified: user.isVerified,
  onboardingCompleted: user.onboardingCompleted,
  authProvider: user.authProvider,
});

const createVerificationCode = () =>
  crypto.randomInt(100000, 999999).toString();

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// 🔐 REGISTER
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationCode = createVerificationCode();

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      authProvider: "email",
      isVerified: false,
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
          <h2>Verify your email address</h2>
          <p>Welcome to CoVisioner. Use this code to verify your email.</p>
          <div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:28px 0;">
            ${verificationCode}
          </div>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn’t create an account, you can ignore this email.</p>
        </div>
      `,
    });

    return res.status(201).json({
      success: true,
      message: "Account created. Verification code sent to your email.",
      email: user.email,
    });
  } catch (error) {
    console.log("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create account",
    });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email }).select(
      "+emailVerificationCode +emailVerificationCodeExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired code",
      });
    }

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationCodeExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    console.log("VERIFY EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify email",
    });
  }
};

// 🔐 LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +refreshTokens"
    );

    if (!user || user.authProvider !== "email") {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before login",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push(refreshToken);

    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    

    res.cookie("accessToken", accessToken, accessCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: getSafeUser(user),
      accessToken,
    });
  } catch (error) {
    console.log("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

// 🎭 SET ROLE
export const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["talent", "startup"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.log("SET ROLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update role",
    });
  }
};

// 🚪 LOGOUT
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (req.user?._id && refreshToken) {
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { refreshTokens: refreshToken },
      });
    }

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  } catch (error) {
    console.log("LOGOUT ERROR:", error);

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logged out",
    });
  }
};

// ♻️ REFRESH ACCESS TOKEN
export const refreshAccessToken = async (req, res) => {
  try {
    const oldRefreshToken = req.cookies?.refreshToken;

    if (!oldRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch {
      clearAuthCookies(res);

      return res.status(403).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await User.findById(decoded.id).select("+refreshTokens");

    if (!user || !user.refreshTokens?.includes(oldRefreshToken)) {
      if (user) {
        user.refreshTokens = [];
        await user.save();
      }

      clearAuthCookies(res);

      return res.status(403).json({
        success: false,
        message: "Security check failed. Please login again.",
      });
    }

    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== oldRefreshToken
    );

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens.push(newRefreshToken);

    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.log("REFRESH TOKEN ERROR:", error);

    clearAuthCookies(res);

    return res.status(500).json({
      success: false,
      message: "Server error while refreshing token",
    });
  }
};

// 👤 GET ME
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: getSafeUser(user),
    });
  } catch (error) {
    console.log("GET ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// ✅ COMPLETE ONBOARDING
export const completeOnboarding = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.onboardingCompleted = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Onboarding completed",
      user: getSafeUser(user),
    });
  } catch (error) {
    console.log("COMPLETE ONBOARDING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
    });
  }
};

// 🔑 FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const genericResponse = {
      success: true,
      message: "If an account exists, a password reset link has been sent",
    };

    const user = await User.findOne({ email }).select(
      "+resetPasswordToken +resetPasswordExpires"
    );

    if (!user || user.authProvider !== "email") {
      return res.status(200).json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password.</p>
          <p>Click below to create a new password. This link expires in 10 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600;">
            Reset Password
          </a>
          <p style="margin-top:24px;color:#666;font-size:14px;">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.log("FORGOT PASSWORD ERROR:", error);

    return res.status(200).json({
      success: true,
      message: "If an account exists, a password reset link has been sent",
    });
  }
};

// 🔒 RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+password +refreshTokens +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Reset token is invalid or expired",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshTokens = [];

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. Please login.",
    });
  } catch (error) {
    console.log("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};