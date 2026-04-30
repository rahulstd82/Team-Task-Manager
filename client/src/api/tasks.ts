import apiClient from './client';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: string;
  project_id: string;
  assignee_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null;
  status_updated_at: string;
  created_at: string;
}

export async function listTasks(projectId: string): Promise<Task[]> {
  const res = await apiClient.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
  return res.data.tasks;
}

export async function createTask(
  projectId: string,
  data: { title: string; description?: string; due_date?: string; assignee_id?: string }
): Promise<Task> {
  const res = await apiClient.post<{ task: Task }>(`/projects/${projectId}/tasks`, data);
  return res.data.task;
}

export async function updateTaskStatus(
  projectId: string,
  taskId: string,
  status: TaskStatus
): Promise<Task> {
  const res = await apiClient.put<{ task: Task }>(`/projects/${projectId}/tasks/${taskId}`, {
    status,
  });
  return res.data.task;
}
