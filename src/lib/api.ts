const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TOKEN_KEY = "token";
const AUTH_CHANGE_EVENT = "motiscan-auth-change";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

/** Sync auth state when another tab logs in or out. */
export function subscribeAuthChanges(onChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const onStorage = (event: StorageEvent) => {
    if (event.key === TOKEN_KEY) onChange();
  };

  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  setToken(null);
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

const DEFAULT_TIMEOUT_MS = 30000;

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Please try again.",
        408,
        "TIMEOUT"
      );
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (res.status === 401) {
    handleUnauthorized();
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      body.error ?? body.message ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return body as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, options),
  post: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
      ...options,
    }),
  put: <T>(path: string, data?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data ?? {}),
      ...options,
    }),
  delete: (path: string, options?: RequestOptions) =>
    request<void>(path, { method: "DELETE", ...options }),
};
