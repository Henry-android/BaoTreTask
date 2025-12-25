const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  const secret = process.env.JWT_SECRET || "dev_secret";
  return jwt.sign(
    {
      sub: String(user._id),
      email: user.email,
      role: user.role,
    },
    secret,
    { expiresIn: "7d" }
  );
}

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "password must be at least 6 characters" });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) return res.status(409).json({ error: "email already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email: String(email).toLowerCase(),
    passwordHash,
    role: "user",
  });

  const token = signToken(user);
  return res.status(201).json({
    token,
    user: { id: String(user._id), email: user.email, role: user.role },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(401).json({ error: "invalid credentials" });

  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  const token = signToken(user);
  return res.json({
    token,
    user: { id: String(user._id), email: user.email, role: user.role },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  return res.json({ id: String(user._id), email: user.email, role: user.role });
});

module.exports = router;
