export type AuthRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  role: AuthRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  return (await res.json()) as T;
}

export async function register(
  email: string,
  password: string
): Promise<AuthResponse> {
  return http<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return http<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me(token: string): Promise<AuthUser> {
  return http<AuthUser>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
