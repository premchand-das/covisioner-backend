import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

const allowedRoles = ["talent", "startup"];

const createSafeUsername = (profile, email) => {
  const base =
    profile.displayName?.replace(/\s+/g, "").toLowerCase() ||
    profile.username?.replace(/\s+/g, "").toLowerCase() ||
    email.split("@")[0];

  return `${base}_${Math.floor(Math.random() * 10000)}`;
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state;
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(null, false);
        }

        let user = await User.findOne({ email });

        // Existing user login: role is already saved in DB
        if (user) {
          if (!user.providerId) user.providerId = profile.id;
          if (!user.authProvider) user.authProvider = "google";
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          if (!user.isVerified) user.isVerified = true;

          await user.save();
          return done(null, user);
        }

        // New Google signup: role is required
        if (!allowedRoles.includes(role)) {
          return done(null, false);
        }

        user = await User.create({
          username: createSafeUsername(profile, email),
          email,
          role,
          avatar: profile.photos?.[0]?.value || "",
          authProvider: "google",
          providerId: profile.id,
          isVerified: true,
          onboardingCompleted: false,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.BACKEND_URL}/api/v1/auth/github/callback`,
      scope: ["user:email"],
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state;
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(null, false);
        }

        let user = await User.findOne({ email });

        if (user) {
          if (!user.providerId) user.providerId = profile.id;
          if (!user.authProvider) user.authProvider = "github";
          if (!user.avatar && profile.photos?.[0]?.value) {
            user.avatar = profile.photos[0].value;
          }
          if (!user.isVerified) user.isVerified = true;

          await user.save();
          return done(null, user);
        }

        if (!allowedRoles.includes(role)) {
          return done(null, false);
        }

        user = await User.create({
          username: createSafeUsername(profile, email),
          email,
          role,
          avatar: profile.photos?.[0]?.value || "",
          authProvider: "github",
          providerId: profile.id,
          isVerified: true,
          onboardingCompleted: false,
        });

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;