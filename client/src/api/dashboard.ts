import apiClient from './client';
import { Task } from './tasks';

export interface TaskStatusCounts {
  todo: number;
  in_progress: number;
  done: number;
}

export interface DashboardData {
  task_counts: TaskStatusCounts;
  overdue_tasks: Task[];
  admin_project_counts?: TaskStatusCounts;
}

export async function getDashboard(): Promise<DashboardData> {
  const res = await apiClient.get<DashboardData>('/dashboard');
  return res.data;
}
