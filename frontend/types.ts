
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';

export interface Assignee {
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: Assignee;
  deadline: string;
  status: TaskStatus;
  isOverdue: boolean;
  priority: 'Low' | 'Medium' | 'High';
}

export interface AIRiskResult {
  risk: string;
  solution: string;
  reminder: string;
  severity: 'Warning' | 'Critical';
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  timestamp: string;
  message: string;
}

export type MenuTab = 'Dashboard' | 'Projects' | 'Settings' | 'AI Insights';
