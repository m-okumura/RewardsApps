const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  nickname: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Receipt {
  id: number;
  user_id: number;
  image_url: string;
  store_name: string;
  amount: number;
  items: string | null;
  purchased_at: string | null;
  status: string;
  points_awarded: number | null;
  rejection_reason: string | null;
  created_at: string;
}

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API Error");
  }
  return res.json();
}

export async function authRegister(email: string, password: string, name: string) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
  } catch (e) {
    throw new Error(
      "サーバーに接続できません。バックエンド (http://localhost:8000) が起動しているか確認してください。"
    );
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Registration failed");
  if (data.access_token) {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
  }
  return data;
}

export async function authLogin(email: string, password: string): Promise<TokenResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (e) {
    throw new Error(
      "サーバーに接続できません。バックエンド (http://localhost:8000) が起動しているか確認してください。"
    );
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  return data;
}

export function authLogout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function getMe(): Promise<User> {
  return api<User>("/users/me");
}

export async function updateMe(data: { name?: string; nickname?: string }): Promise<User> {
  return api<User>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getReceipts(skip = 0, limit = 20): Promise<Receipt[]> {
  return api<Receipt[]>(`/receipts?skip=${skip}&limit=${limit}`);
}

export async function getReceipt(id: number): Promise<Receipt> {
  return api<Receipt>(`/receipts/${id}`);
}

export async function uploadReceipt(
  image: File,
  storeName: string,
  amount: number,
  purchasedAt?: string
) {
  const form = new FormData();
  form.append("image", image);
  form.append("store_name", storeName);
  form.append("amount", String(amount));
  if (purchasedAt) form.append("purchased_at", purchasedAt);

  const token = await getToken();
  const res = await fetch(`${API_BASE}/receipts`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Upload failed");
  return data;
}
