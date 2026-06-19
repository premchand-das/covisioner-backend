import express from "express";
import User from "../models/user.model.js";

const router = express.Router();

router.get("/create-user", async (req, res) => {
  try {
    const user = await User.create({
      username: "testuser",
      email: "test@gmail.com",
      password: "123456",
      role: "talent",
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;