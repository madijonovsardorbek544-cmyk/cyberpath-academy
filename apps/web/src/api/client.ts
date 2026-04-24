import { mockApi } from './mock';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');
const API_MODE = import.meta.env.VITE_API_MODE || 'api';
const REQUEST_TIMEOUT_MS = 12000;

function getFriendlyNetworkMessage(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'The request took too long. Make sure the API server is running and try again.';
  }

  if (error instanceof Error && /Failed to fetch/i.test(error.message)) {
    return 'Could not reach the server. Check that the API is running and the frontend points to the correct URL.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unexpected network error. Try again.';
}

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

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options,
      signal: controller.signal
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
      const message = typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed with status ${response.status}.`;
      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    throw new Error(getFriendlyNetworkMessage(error));
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
