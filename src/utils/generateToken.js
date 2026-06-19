import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// ACCESS TOKEN
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

// REFRESH TOKEN
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

export default {
  generateAccessToken,
  generateRefreshToken,
};