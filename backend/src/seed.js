const Task = require("./models/Task");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function seedIfEmpty() {
  // 1) Seed admin (for demo/dev) regardless of existing tasks.
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  // Demo-friendly default admin in non-production.
  const isProd =
    String(process.env.NODE_ENV || "").toLowerCase() === "production";
  const effectiveAdminEmail = adminEmail || (isProd ? "" : "admin@example.com");
  const effectiveAdminPassword = adminPassword || (isProd ? "" : "admin12345");

  if (effectiveAdminEmail && effectiveAdminPassword) {
    const existingUser = await User.findOne({ email: effectiveAdminEmail });
    const passwordHash = await bcrypt.hash(effectiveAdminPassword, 10);

    if (!existingUser) {
      await User.create({
        email: effectiveAdminEmail,
        passwordHash,
        role: "admin",
      });
    } else {
      // In dev/demo, make admin login deterministic even if the email
      // was registered earlier as a normal user.
      const updates = {};
      if (existingUser.role !== "admin") updates.role = "admin";
      if (!isProd) updates.passwordHash = passwordHash;

      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: existingUser._id }, updates);
      }
    }
  }

  // 2) Seed tasks only when empty.
  const count = await Task.countDocuments();
  if (count > 0) return;

  await Task.insertMany([
    {
      title: "Phát triển API cho Module Thanh toán",
      assignee: {
        name: "Khánh Nguyễn",
        avatar: "https://picsum.photos/seed/khanh/100/100",
      },
      deadline: "2023-12-01",
      status: "In Progress",
      priority: "High",
    },
    {
      title: "Thiết kế UI/UX Dashboard mới",
      assignee: {
        name: "Minh Trần",
        avatar: "https://picsum.photos/seed/minh/100/100",
      },
      deadline: "2026-05-15",
      status: "To Do",
      priority: "Medium",
    },
    {
      title: "Kiểm thử bảo mật Hệ thống",
      assignee: {
        name: "Linh Phạm",
        avatar: "https://picsum.photos/seed/linh/100/100",
      },
      deadline: "2023-11-20",
      status: "In Progress",
      priority: "High",
    },
    {
      title: "Viết tài liệu hướng dẫn sử dụng",
      assignee: {
        name: "Hòa Lê",
        avatar: "https://picsum.photos/seed/hoa/100/100",
      },
      deadline: "2024-06-01",
      status: "Done",
      priority: "Low",
    },
    {
      title: "Tối ưu hóa Database Query",
      assignee: {
        name: "Anh Vũ",
        avatar: "https://picsum.photos/seed/anh/100/100",
      },
      deadline: "2026-04-10",
      status: "In Progress",
      priority: "High",
    },
    {
      title: "Hợp nhất Code và Deploy Staging",
      assignee: {
        name: "Đức Đào",
        avatar: "https://picsum.photos/seed/duc/100/100",
      },
      deadline: "2023-10-05",
      status: "To Do",
      priority: "Medium",
    },
  ]);
}

module.exports = { seedIfEmpty };
