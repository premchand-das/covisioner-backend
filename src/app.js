import express from "express";
import cors from "cors";
import session from "express-session";
import passport from "./config/passport.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";


import testRoutes from "./routes/test.routes.js";
import authRoutes from "./routes/auth.routes.js";
import protectedRoutes from "./routes/protected.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import savedJobRoutes from "./routes/savedJob.routes.js";
import talentRoutes from "./routes/talent.routes.js";
import startupPublicRoutes from "./routes/startupPublic.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import messageRoutes from "./routes/message.routes.js";
import startupRoutes from "./routes/startup.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 100 requests per windowMs
});

app.use(limiter);


app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use("/api/test", testRoutes);

app.use(passport.initialize());


app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/saved-jobs", savedJobRoutes);
app.use("/api/talent", talentRoutes);
app.use("/api/startups", startupRoutes);
app.use("/api/startups", startupPublicRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/saved-jobs", savedJobRoutes);




app.get("/", (req, res) => {
  res.send("API is running...");
});

export default app;