const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const { connectDb } = require("./db");
const { seedIfEmpty } = require("./seed");

const tasksRoute = require("./routes/tasks");
const logsRoute = require("./routes/logs");
const overdueRoute = require("./routes/overdue");
const authRoute = require("./routes/auth");
const { requireAuth } = require("./middleware/auth");

const PORT = Number(process.env.PORT || 4000);
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/project_guardian";

async function main() {
  await connectDb(MONGODB_URI);
  await seedIfEmpty();

  const app = express();

  app.use(cors({ origin: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  // Public auth endpoints
  app.use("/api/auth", authRoute);

  // Protect all remaining API endpoints
  app.use("/api", requireAuth);

  app.use("/api/tasks", tasksRoute);
  app.use("/api/logs", logsRoute);
  app.use("/api/overdue", overdueRoute);

  // Minimal error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // Avoid leaking internals
    res.status(500).json({ error: "Internal Server Error" });
  });

  app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
    console.log(`MongoDB: ${MONGODB_URI}`);
  });
}

main().catch((err) => {
  console.error("Failed to start backend:", err);
  process.exit(1);
});
