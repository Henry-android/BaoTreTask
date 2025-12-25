const express = require("express");
const User = require("../models/User");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// List assignable users for task assignment (exclude admins)
router.get("/", requireRole("admin"), async (_req, res) => {
  const users = await User.find({ role: "user" })
    .select("email role")
    .sort({ email: 1 });

  res.json(
    users.map((u) => ({
      id: String(u._id),
      email: u.email,
    }))
  );
});

module.exports = router;
