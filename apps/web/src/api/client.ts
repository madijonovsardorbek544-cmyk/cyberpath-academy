import { mockApi } from './mock';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const API_MODE = import.meta.env.VITE_API_MODE || 'api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (API_MODE === 'mock') {
    const method = (options.method || 'GET').toUpperCase();
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    if (method === 'GET') return await mockApi.get<T>(path);
    if (method === 'POST') return await mockApi.post<T>(path, body);
    if (method === 'PATCH') return await mockApi.patch<T>(path, body);
    if (method === 'DELETE') return await mockApi.delete<T>(path);
    throw new Error(`Unsupported mock method ${method}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let payload: unknown = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'message' in payload ? String((payload as { message: unknown }).message) : 'Request failed';
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
