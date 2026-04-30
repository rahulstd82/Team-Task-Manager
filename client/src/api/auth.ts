import apiClient from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function register(
  email: string,
  name: string,
  password: string
): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/register', { email, name, password });
  return res.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
  return res.data;
}
