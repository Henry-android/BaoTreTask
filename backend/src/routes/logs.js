const express = require("express");
const ActivityLog = require("../models/ActivityLog");

const router = express.Router();

router.get("/", async (_req, res) => {
  const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(200);
  res.json(
    logs.map((l) => ({
      id: String(l._id),
      taskId: String(l.taskId),
      taskTitle: l.taskTitle,
      timestamp: l.timestamp,
      message: l.message,
    }))
  );
});

module.exports = router;
