import type { ActivityLog, AIRiskResult, Task } from "../types";

function getToken() {
  try {
    return localStorage.getItem("auth_token") || "";
  } catch {
    return "";
  }
}
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  // 204
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

export async function fetchTasks(): Promise<Task[]> {
  return http<Task[]>("/api/tasks");
}

export type CreateTaskInput = Pick<
  Task,
  "title" | "assignee" | "deadline" | "status" | "priority"
>;

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return http<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchLogs(): Promise<ActivityLog[]> {
  return http<ActivityLog[]>("/api/logs");
}

export async function analyzeTask(taskId: string): Promise<AIRiskResult> {
  return http<AIRiskResult>(
    `/api/tasks/${encodeURIComponent(taskId)}/analyze`,
    { method: "POST" }
  );
}

export async function scanOverdue(): Promise<{
  overdueCount: number;
  createdLogIds: string[];
}> {
  return http<{ overdueCount: number; createdLogIds: string[] }>(
    "/api/overdue/scan",
    { method: "POST" }
  );
}
