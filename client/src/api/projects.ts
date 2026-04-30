import apiClient from './client';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  project_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  name: string;
  email: string;
}

export async function listProjects(): Promise<Project[]> {
  const res = await apiClient.get<{ projects: Project[] }>('/projects');
  return res.data.projects;
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await apiClient.post<{ project: Project }>('/projects', { name, description });
  return res.data.project;
}

export async function updateProject(
  id: string,
  name: string,
  description?: string
): Promise<Project> {
  const res = await apiClient.put<{ project: Project }>(`/projects/${id}`, { name, description });
  return res.data.project;
}

export async function deleteProject(id: string): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

export async function listMembers(projectId: string): Promise<Member[]> {
  const res = await apiClient.get<{ members: Member[] }>(`/projects/${projectId}/members`);
  return res.data.members;
}

export async function addMember(projectId: string, userId: string): Promise<Member> {
  const res = await apiClient.post<{ membership: Member }>(`/projects/${projectId}/members`, {
    userId,
  });
  return res.data.membership;
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/members/${userId}`);
}

export async function findUserByEmail(email: string): Promise<{ id: string; name: string; email: string }> {
  const res = await apiClient.get<{ user: { id: string; name: string; email: string } }>(
    `/users/search?email=${encodeURIComponent(email)}`
  );
  return res.data.user;
}
