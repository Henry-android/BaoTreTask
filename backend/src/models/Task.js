const mongoose = require("mongoose");

const AssigneeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    assignee: { type: AssigneeSchema, required: true },
    deadline: { type: String, required: true, trim: true }, // YYYY-MM-DD
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      required: true,
    },
    priority: { type: String, enum: ["Low", "Medium", "High"], required: true },
  },
  { timestamps: true }
);

TaskSchema.methods.isOverdue = function isOverdue(nowMs = Date.now()) {
  if (this.status === "Done") return false;
  const due = new Date(`${this.deadline}T23:59:59`);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < nowMs;
};

module.exports = mongoose.model("Task", TaskSchema);
