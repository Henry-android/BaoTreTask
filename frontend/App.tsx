import React, { useEffect, useMemo, useRef, useState } from "react";
import { MenuTab, Task, ActivityLog } from "./types";
import Sidebar from "./components/Sidebar";
import TaskCard from "./components/TaskCard";
import AIModal from "./components/AIModal";
import ActivityFeed from "./components/ActivityFeed";
import {
  createTask,
  fetchLogs,
  fetchTasks,
  scanOverdue,
  type CreateTaskInput,
} from "./services/backendApi";
import AuthPanel from "./components/AuthPanel";
import { me } from "./services/authApi";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MenuTab>("Dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [token, setToken] = useState<string>(() => {
    try {
      return localStorage.getItem("auth_token") || "";
    } catch {
      return "";
    }
  });
  const [currentUser, setCurrentUser] = useState<null | {
    id: string;
    email: string;
    role: "admin" | "user";
  }>(null);

  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [newTaskError, setNewTaskError] = useState<string | null>(null);
  const [newTaskForm, setNewTaskForm] = useState<CreateTaskInput>(() => {
    const today = new Date();
    const in7 = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yyyy = in7.getFullYear();
    const mm = String(in7.getMonth() + 1).padStart(2, "0");
    const dd = String(in7.getDate()).padStart(2, "0");
    return {
      title: "",
      assignee: { name: "", avatar: "" },
      deadline: `${yyyy}-${mm}-${dd}`,
      status: "To Do",
      priority: "Medium",
    };
  });

  const notifiedOverdueTaskIdsRef = useRef<Set<string>>(new Set());

  const nowMs = useMemo(() => Date.now(), []);
  const computedTasks = useMemo(() => {
    const isTaskOverdue = (task: Task) => {
      if (task.status === "Done") return false;
      const due = new Date(`${task.deadline}T23:59:59`);
      if (Number.isNaN(due.getTime())) return task.isOverdue;
      return due.getTime() < nowMs;
    };

    return tasks.map((t) => ({
      ...t,
      isOverdue: isTaskOverdue(t),
    }));
  }, [tasks, nowMs]);

  const overdueTasks = computedTasks.filter((t) => t.isOverdue);

  const tabTitle: Record<MenuTab, string> = {
    Dashboard: "Tổng quan",
    Projects: "Dự án",
    "AI Insights": "AI Insights",
    Settings: "Cài đặt",
  };

  // Resolve current user from token
  useEffect(() => {
    (async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      try {
        const u = await me(token);
        setCurrentUser(u);
      } catch (err) {
        console.error(err);
        try {
          localStorage.removeItem("auth_token");
        } catch {
          // ignore
        }
        setToken("");
        setCurrentUser(null);
      }
    })();
  }, [token]);

  // Load data when authenticated
  useEffect(() => {
    (async () => {
      if (!currentUser) return;
      try {
        const [t, l] = await Promise.all([fetchTasks(), fetchLogs()]);
        setTasks(t);
        setLogs(l);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const getTimestamp = () =>
      new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const makeId = () => Math.random().toString(36).slice(2, 11);

    const newOverdueTasks = overdueTasks.filter(
      (t) => !notifiedOverdueTaskIdsRef.current.has(t.id)
    );
    if (newOverdueTasks.length === 0) return;

    // Mark as notified immediately to avoid duplicate calls in React StrictMode.
    newOverdueTasks.forEach((t) => notifiedOverdueTaskIdsRef.current.add(t.id));

    // 1) System alert logs
    setLogs((prev) => [
      ...prev,
      ...newOverdueTasks.map((task) => ({
        id: makeId(),
        taskId: task.id,
        taskTitle: task.title,
        timestamp: getTimestamp(),
        message:
          "Cảnh báo hệ thống: Công việc đang trễ hạn. Chuyển cho AI để đề xuất phương án xử lý.",
      })),
    ]);

    // 2) Ask backend to scan + (optionally) run LLM server-side, then refresh logs.
    (async () => {
      try {
        await scanOverdue();
        const l = await fetchLogs();
        setLogs(l);
      } catch (err) {
        console.error(err);
        setLogs((prev) => [
          ...prev,
          {
            id: makeId(),
            taskId: "system",
            taskTitle: "System",
            timestamp: getTimestamp(),
            message:
              "Cảnh báo AI: Quét dữ liệu thất bại. Hãy bật backend và MongoDB.",
          },
        ]);
      }
    })();
  }, [overdueTasks]);

  if (!currentUser) {
    return (
      <AuthPanel
        onAuthed={(newToken) => {
          try {
            localStorage.setItem("auth_token", newToken);
          } catch {
            // ignore
          }
          setToken(newToken);
        }}
      />
    );
  }

  const canCreateTask = currentUser.role === "admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={() => {
          try {
            localStorage.removeItem("auth_token");
          } catch {
            // ignore
          }
          setToken("");
          setCurrentUser(null);
          setTasks([]);
          setLogs([]);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex overflow-hidden">
        <main className="flex-1 p-10 overflow-y-auto">
          <header className="flex justify-between items-end mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-black tracking-tight text-slate-900">
                  {tabTitle[activeTab]}
                </h2>
                {activeTab === "Dashboard" && overdueTasks.length > 0 && (
                  <div className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-red-200">
                    {overdueTasks.length} cảnh báo
                  </div>
                )}
              </div>
              <p className="text-slate-500 font-medium">
                {activeTab === "Dashboard"
                  ? "Chào mừng quay lại. Đây là tổng quan tự động của dự án."
                  : "Quản lý nội dung theo từng mục."}
              </p>
            </div>

            {(activeTab === "Dashboard" || activeTab === "Projects") && (
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold transition-all shadow-sm">
                  <i className="fa-solid fa-filter"></i>
                  Bộ lọc
                </button>
                <button
                  onClick={() => {
                    if (!canCreateTask) {
                      alert("Chỉ tài khoản admin mới có thể tạo task.");
                      return;
                    }
                    setNewTaskError(null);
                    setNewTaskOpen(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                >
                  <i className="fa-solid fa-plus"></i>
                  New Task
                </button>
              </div>
            )}
          </header>

          {activeTab === "Dashboard" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {computedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onAnalyze={(task) => setSelectedTask(task)}
                />
              ))}
            </div>
          )}

          {activeTab === "Projects" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Tổng quan
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-bold text-slate-700">
                    Tổng số công việc: {computedTasks.length}
                  </span>
                  <span className="text-sm font-bold text-red-600">
                    Trễ hạn: {overdueTasks.length}
                  </span>
                  <span className="text-sm font-bold text-slate-500">
                    Vai trò: {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {computedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onAnalyze={(task) => setSelectedTask(task)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "AI Insights" && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Phân tích trễ hạn
                  </p>
                  <p className="text-sm font-bold text-slate-700">
                    Số công việc trễ hạn: {overdueTasks.length}
                  </p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Nhấn “Quét ngay” để backend tạo log và (tuỳ chọn) gọi AI.
                  </p>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await scanOverdue();
                      const [t, l] = await Promise.all([
                        fetchTasks(),
                        fetchLogs(),
                      ]);
                      setTasks(t);
                      setLogs(l);
                    } catch (err) {
                      console.error(err);
                      alert(
                        "Scan thất bại. Hãy kiểm tra backend (4000) và MongoDB đang chạy."
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  Quét ngay
                </button>
              </div>

              {overdueTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[45vh] text-slate-300">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 mb-6">
                    <i className="fa-solid fa-circle-check text-4xl text-emerald-200"></i>
                  </div>
                  <p className="text-xl font-bold text-slate-400">
                    Không có công việc trễ hạn
                  </p>
                  <p className="text-sm font-medium mt-1 uppercase tracking-widest opacity-50">
                    Hệ thống đang ổn định
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onAnalyze={(task) => setSelectedTask(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "Settings" && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Tài khoản
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Email
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                      {currentUser.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Vai trò
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Ghi chú
                </p>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  - Tạo task mới yêu cầu quyền admin.
                  <br />- Các API đều yêu cầu đăng nhập (JWT).
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: AI Automated Feed */}
        <aside className="w-96 p-10 border-l border-slate-200 bg-white/50 backdrop-blur-sm">
          <ActivityFeed logs={logs} />

          <div className="mt-8 p-6 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-brain text-8xl"></i>
            </div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-indigo-200">
              <i className="fa-solid fa-microchip"></i>
              Nhịp dự án
            </h4>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-5xl font-black">72%</span>
              <span className="text-xs font-bold text-indigo-200 mb-2 uppercase tracking-tighter">
                Hiệu suất
              </span>
            </div>
            <div className="w-full bg-indigo-500/50 rounded-full h-2.5 mb-4 p-0.5">
              <div
                className="bg-white h-1.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: "72%" }}
              ></div>
            </div>
            <p className="text-xs font-bold text-indigo-100 leading-relaxed italic">
              "AI phát hiện các điểm nghẽn quan trọng. Nên ưu tiên tối ưu các hạng mục có rủi ro cao."
            </p>
          </div>
        </aside>
      </div>

      {newTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Create Task
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Chỉ admin mới tạo được task.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewTaskOpen(false);
                  setNewTaskError(null);
                }}
                className="px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold"
              >
                Close
              </button>
            </div>

            <form
              className="p-6 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (creatingTask) return;
                setNewTaskError(null);
                setCreatingTask(true);
                try {
                  const trimmedTitle = newTaskForm.title.trim();
                  const trimmedAssignee = newTaskForm.assignee.name.trim();
                  const avatar = newTaskForm.assignee.avatar.trim();
                  const avatarSeed = encodeURIComponent(
                    trimmedAssignee.toLowerCase().replace(/\s+/g, "-") || "user"
                  );
                  const payload: CreateTaskInput = {
                    ...newTaskForm,
                    title: trimmedTitle,
                    assignee: {
                      name: trimmedAssignee,
                      avatar:
                        avatar ||
                        `https://picsum.photos/seed/${avatarSeed}/100/100`,
                    },
                  };

                  const created = await createTask(payload);
                  setTasks((prev) => [created, ...prev]);
                  setNewTaskOpen(false);
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Create task failed";
                  setNewTaskError(msg);
                } finally {
                  setCreatingTask(false);
                }
              }}
            >
              {newTaskError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold leading-relaxed">
                  {newTaskError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Title
                </label>
                <input
                  value={newTaskForm.title}
                  onChange={(e) =>
                    setNewTaskForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                  placeholder="Task title"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Assignee Name
                  </label>
                  <input
                    value={newTaskForm.assignee.name}
                    onChange={(e) =>
                      setNewTaskForm((p) => ({
                        ...p,
                        assignee: { ...p.assignee, name: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={newTaskForm.deadline}
                    onChange={(e) =>
                      setNewTaskForm((p) => ({
                        ...p,
                        deadline: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  Assignee Avatar (optional)
                </label>
                <input
                  value={newTaskForm.assignee.avatar}
                  onChange={(e) =>
                    setNewTaskForm((p) => ({
                      ...p,
                      assignee: { ...p.assignee, avatar: e.target.value },
                    }))
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Status
                  </label>
                  <select
                    value={newTaskForm.status}
                    onChange={(e) =>
                      setNewTaskForm((p) => ({
                        ...p,
                        status: e.target.value as Task["status"],
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) =>
                      setNewTaskForm((p) => ({
                        ...p,
                        priority: e.target.value as Task["priority"],
                      }))
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 font-bold text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskOpen(false);
                    setNewTaskError(null);
                  }}
                  className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  disabled={creatingTask}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100"
                  type="submit"
                >
                  {creatingTask ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Risk Assessment Modal */}
      {selectedTask && (
        <AIModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
};

export default App;
