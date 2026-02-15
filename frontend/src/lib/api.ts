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
  is_admin: boolean;
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

export interface Campaign {
  id: number;
  title: string;
  campaign_type: string;
  description: string | null;
  points: number | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
}

export interface ReferralCode {
  referral_code: string;
  share_url: string;
}

export interface ReferralHistoryItem {
  id: number;
  referred_id: number;
  points_awarded: number;
  created_at: string;
}

export interface ShoppingTrack {
  id: number;
  merchant: string;
  order_id: string | null;
  amount: number | null;
  status: string;
  tracked_at: string;
}

export async function authRegister(
  email: string,
  password: string,
  name: string,
  referralCode?: string
) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, referral_code: referralCode }),
    });
  } catch (e) {
    throw new Error(
      `サーバーに接続できません。バックエンド (${API_BASE}) が起動しているか、CORS の設定を確認してください。`
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
      `サーバーに接続できません。バックエンド (${API_BASE}) が起動しているか、CORS の設定を確認してください。`
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

export async function getReferralCode(): Promise<ReferralCode> {
  return api<ReferralCode>("/referrals/my-code");
}

export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  return api<ReferralHistoryItem[]>("/referrals/history");
}

export async function getCampaigns(): Promise<Campaign[]> {
  return api<Campaign[]>("/campaigns");
}

export async function trackPurchase(
  merchant: string,
  orderId?: string,
  amount?: number
): Promise<ShoppingTrack> {
  return api<ShoppingTrack>("/shopping/track", {
    method: "POST",
    body: JSON.stringify({
      merchant,
      order_id: orderId,
      amount,
    }),
  });
}

export async function getShoppingHistory(): Promise<ShoppingTrack[]> {
  return api<ShoppingTrack[]>("/shopping/history");
}

// 管理者API
export interface Analytics {
  total_users: number;
  new_users_week: number;
  total_points_granted: number;
  total_points_exchanged: number;
  pending_receipts: number;
}

export interface UserListItem {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string | null;
  is_active: boolean;
  created_at: string;
}

export async function getAdminAnalytics(): Promise<Analytics> {
  return api<Analytics>("/admin/analytics");
}

export async function getAdminUsers(search?: string): Promise<UserListItem[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return api<UserListItem[]>(`/admin/users${q}`);
}

export async function updateUserActive(userId: number, isActive: boolean): Promise<void> {
  return api<void>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function grantPoints(
  userId: number,
  amount: number,
  description?: string
): Promise<void> {
  return api<void>("/admin/points/grant", {
    method: "POST",
    body: JSON.stringify({
      user_id: userId,
      amount,
      description: description || "管理者による手動付与",
    }),
  });
}

export async function getAdminReceipts(status?: string): Promise<Receipt[]> {
  const q = status ? `?status=${status}` : "";
  return api<Receipt[]>(`/admin/receipts${q}`);
}

export async function getAdminReceipt(id: number): Promise<Receipt> {
  return api<Receipt>(`/admin/receipts/${id}`);
}

export async function reviewReceipt(
  id: number,
  status: string,
  pointsAwarded?: number,
  rejectionReason?: string
): Promise<Receipt> {
  return api<Receipt>(`/admin/receipts/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      points_awarded: pointsAwarded,
      rejection_reason: rejectionReason,
    }),
  });
}

export async function getAdminCampaigns(): Promise<Campaign[]> {
  return api<Campaign[]>("/admin/campaigns");
}

export async function createCampaign(data: {
  title: string;
  campaign_type?: string;
  description?: string;
  points?: number;
  is_active?: boolean;
}): Promise<Campaign> {
  return api<Campaign>("/admin/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCampaign(
  id: number,
  data: Partial<Campaign>
): Promise<Campaign> {
  return api<Campaign>(`/admin/campaigns/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export interface Survey {
  id: number;
  title: string;
  description: string | null;
  points: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export async function getAdminSurveys(): Promise<Survey[]> {
  return api<Survey[]>("/admin/surveys");
}

export async function createSurvey(data: {
  title: string;
  description?: string;
  points?: number;
  expires_at?: string;
  is_active?: boolean;
}): Promise<Survey> {
  return api<Survey>("/admin/surveys", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSurvey(
  id: number,
  data: Partial<Survey>
): Promise<Survey> {
  return api<Survey>(`/admin/surveys/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getAdminAnnouncements(): Promise<Announcement[]> {
  return api<Announcement[]>("/admin/announcements");
}

export async function createAnnouncement(data: {
  title: string;
  body?: string;
}): Promise<Announcement> {
  return api<Announcement>("/admin/announcements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(
  id: number,
  data: { title?: string; body?: string; is_active?: boolean }
): Promise<Announcement> {
  return api<Announcement>(`/admin/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getAnnouncements(): Promise<Announcement[]> {
  return api<Announcement[]>("/announcements");
}
