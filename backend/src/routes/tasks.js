const express = require("express");
const mongoose = require("mongoose");
const Task = require("../models/Task");
const ActivityLog = require("../models/ActivityLog");
const User = require("../models/User");
const { analyzeTaskWithGemini } = require("../llm");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function getGeminiApiKey() {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  );
}

function fallbackRiskResult(task) {
  const severity = task?.priority === "High" ? "Critical" : "Warning";
  return {
    risk: "Rủi ro trễ tiến độ dây chuyền cho toàn dự án và ảnh hưởng các hạng mục phụ thuộc.",
    solution:
      "Xác định blocker trong 15 phút, chốt owner + deadline mới, và báo cáo tiến độ mỗi 2 giờ cho đến khi task về trạng thái an toàn.",
    reminder:
      "Ưu tiên minh bạch tiến độ: cập nhật ngay khi phát sinh rủi ro hoặc thay đổi kế hoạch.",
    severity,
  };
}

function toUiTask(doc) {
  const obj = doc.toObject({ virtuals: false });
  return {
    id: String(obj._id),
    title: obj.title,
    assignee: obj.assignee,
    deadline: obj.deadline,
    status: obj.status,
    priority: obj.priority,
    isOverdue: doc.isOverdue(),
  };
}

router.get("/", async (req, res) => {
  const { status, priority, overdue, assignee } = req.query || {};

  const query = {};
  if (typeof status === "string" && status.trim()) {
    query.status = status.trim();
  }
  if (typeof priority === "string" && priority.trim()) {
    query.priority = priority.trim();
  }
  if (typeof assignee === "string" && assignee.trim()) {
    query["assignee.name"] = assignee.trim();
  }

  const tasks = await Task.find(query).sort({ createdAt: -1 });
  let uiTasks = tasks.map(toUiTask);

  if (typeof overdue === "string" && overdue.trim()) {
    const wantOverdue = overdue.trim().toLowerCase() === "true";
    uiTasks = uiTasks.filter((t) => t.isOverdue === wantOverdue);
  }

  res.json(uiTasks);
});

router.post("/", requireRole("admin"), async (req, res, next) => {
  try {
    const { title, assigneeUserId, deadline, status, priority } =
      req.body || {};

    const normalizedTitle = typeof title === "string" ? title.trim() : "";
    const normalizedDeadline =
      typeof deadline === "string" ? deadline.trim() : "";
    const normalizedStatus = typeof status === "string" ? status.trim() : "";
    const normalizedPriority =
      typeof priority === "string" ? priority.trim() : "";
    const normalizedAssigneeUserId =
      typeof assigneeUserId === "string" ? assigneeUserId.trim() : "";

    if (!normalizedTitle) {
      return res.status(400).json({ error: "title is required" });
    }
    if (!normalizedAssigneeUserId) {
      return res.status(400).json({ error: "assigneeUserId is required" });
    }
    if (!mongoose.isValidObjectId(normalizedAssigneeUserId)) {
      return res.status(400).json({ error: "assigneeUserId is invalid" });
    }
    if (!normalizedDeadline) {
      return res.status(400).json({ error: "deadline is required" });
    }
    // Simple YYYY-MM-DD check (UI sends ISO date string)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDeadline)) {
      return res
        .status(400)
        .json({ error: "deadline must be in YYYY-MM-DD format" });
    }

    const allowedStatus = ["To Do", "In Progress", "Done"];
    if (!allowedStatus.includes(normalizedStatus)) {
      return res.status(400).json({
        error: `status must be one of: ${allowedStatus.join(", ")}`,
      });
    }

    const allowedPriority = ["Low", "Medium", "High"];
    if (!allowedPriority.includes(normalizedPriority)) {
      return res.status(400).json({
        error: `priority must be one of: ${allowedPriority.join(", ")}`,
      });
    }

    const assigneeUser = await User.findById(normalizedAssigneeUserId).select(
      "email role"
    );
    if (!assigneeUser) {
      return res.status(400).json({ error: "Assignee user not found" });
    }
    if (assigneeUser.role !== "user") {
      return res
        .status(400)
        .json({ error: "Assignee must be a normal user (not admin)" });
    }

    const assigneeName = assigneeUser.email;
    const avatarSeed = encodeURIComponent(
      assigneeName.toLowerCase().replace(/\s+/g, "-") || "user"
    );
    const effectiveAvatar = `https://picsum.photos/seed/${avatarSeed}/100/100`;

    const task = await Task.create({
      title: normalizedTitle,
      assignee: { name: assigneeName, avatar: effectiveAvatar },
      deadline: normalizedDeadline,
      status: normalizedStatus,
      priority: normalizedPriority,
    });

    return res.status(201).json(toUiTask(task));
  } catch (err) {
    if (err && err.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid task" });
    }
    return next(err);
  }
});

router.patch("/:id", requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};

  const task = await Task.findByIdAndUpdate(id, patch, {
    new: true,
    runValidators: true,
  });
  if (!task) return res.status(404).json({ error: "Task not found" });

  res.json(toUiTask(task));
});

router.delete("/:id", requireRole("admin"), async (req, res) => {
  const { id } = req.params;
  const task = await Task.findByIdAndDelete(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  await ActivityLog.deleteMany({ taskId: id });
  res.status(204).send();
});

router.post("/:id/analyze", async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (!task.isOverdue()) {
    return res.status(400).json({ error: "Task is not overdue" });
  }

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Log system alert
  await ActivityLog.create({
    taskId: task._id,
    taskTitle: task.title,
    timestamp,
    message:
      "Cảnh báo hệ thống: Công việc đang trễ hạn. Chuyển cho AI để đề xuất phương án xử lý.",
  });

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

    await ActivityLog.create({
      taskId: task._id,
      taskTitle: task.title,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message,
    });

    res.json({
      risk: String(result?.risk || ""),
      solution: String(result?.solution || ""),
      reminder: String(result?.reminder || ""),
      severity,
    });
  } catch (err) {
    await ActivityLog.create({
      taskId: task._id,
      taskTitle: task.title,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      message:
        "Cảnh báo AI: Không thể kết nối LLM. Vui lòng kiểm tra GEMINI_API_KEY và kết nối mạng.",
    });

    // Keep the UI functional even when LLM is unavailable/misconfigured.
    const fb = fallbackRiskResult(task);
    res.json(fb);
  }
});

module.exports = router;
