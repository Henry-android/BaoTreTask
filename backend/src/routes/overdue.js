const express = require("express");
const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");
const { analyzeTaskWithGemini } = require("../llm");

const router = express.Router();

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

// POST /api/overdue/scan
// Finds overdue tasks and creates logs + optional LLM analysis for each.
router.post("/scan", async (_req, res) => {
  const tasks = await Task.find({ status: { $ne: "Done" } });
  const overdue = tasks.filter((t) => t.isOverdue());

  const timestamp = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const createdLogIds = [];

  for (const task of overdue) {
    const systemLog = await ActivityLog.create({
      taskId: task._id,
      taskTitle: task.title,
      timestamp: timestamp(),
      message:
        "Cảnh báo hệ thống: Công việc đang trễ hạn. Chuyển cho AI để đề xuất phương án xử lý.",
    });
    createdLogIds.push(String(systemLog._id));

    try {
      const result = await analyzeTaskWithGemini({
        apiKey: getGeminiApiKey(),
        task: task.toObject(),
      });
      const severity = result?.severity === "Critical" ? "Critical" : "Warning";
      const prefix = severity === "Critical" ? "CRITICAL" : "WARNING";
      const message = `${prefix}: ${
        result?.risk || "Risk identified."
      } | Suggested action: ${result?.solution || "Please review."}`;

      const aiLog = await ActivityLog.create({
        taskId: task._id,
        taskTitle: task.title,
        timestamp: timestamp(),
        message,
      });
      createdLogIds.push(String(aiLog._id));
    } catch {
      const failLog = await ActivityLog.create({
        taskId: task._id,
        taskTitle: task.title,
        timestamp: timestamp(),
        message:
          "Cảnh báo AI: Không thể kết nối LLM. Vui lòng kiểm tra GEMINI_API_KEY và kết nối mạng.",
      });
      createdLogIds.push(String(failLog._id));
    }
  }

  res.json({ overdueCount: overdue.length, createdLogIds });
});

module.exports = router;
