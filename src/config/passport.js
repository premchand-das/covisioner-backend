import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();
const allowedRoles = ["talent", "startup"];

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

        if (!allowedRoles.includes(role)) {
          return done(null, false);
        }

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username: profile.displayName,
            email,
            role,
            avatar: profile.photos?.[0]?.value,
            authProvider: "google",
            providerId: profile.id,
            isVerified: true,
            onboardingCompleted: false,
          });
        }

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

        if (!allowedRoles.includes(role)) {
          return done(null, false);
        }

        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(null, false);
        }

        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            username: profile.username || profile.displayName,
            email,
            role,
            avatar: profile.photos?.[0]?.value,
            authProvider: "github",
            providerId: profile.id,
            isVerified: true,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;