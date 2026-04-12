// frontend/src/app/auth/apiFetch.ts

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const getAccessToken  = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const clearSession = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// ─── محاولة تجديد الـ Access Token ───────────────────────
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const tryRefreshToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  // إذا كان refresh جارياً، أضف الطلب للقائمة وانتظر
  if (isRefreshing) {
    return new Promise(resolve => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;

  try {
    const res = await fetch(`${BASE}/api/v1/accounts/auth/token/refresh/`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    const newAccessToken = data.access;

    localStorage.setItem('access_token', newAccessToken);

    // إذا أرجع الـ backend refresh token جديد (ROTATE_REFRESH_TOKENS=True)
    if (data.refresh) {
      localStorage.setItem('refresh_token', data.refresh);
    }

    // أخبر كل الطلبات المنتظرة بالـ token الجديد
    refreshQueue.forEach(cb => cb(newAccessToken));
    refreshQueue = [];

    return newAccessToken;
  } catch {
    clearSession();
    return null;
  } finally {
    isRefreshing = false;
  }
};

// ─── apiFetch الرئيسية ────────────────────────────────────
export const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAccessToken();

  const buildHeaders = (accessToken: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    return headers;
  };

  // ── الطلب الأول ──────────────────────────────────────────
  let res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: buildHeaders(token),
  });

  // ── إذا 401: حاول refresh ثم أعد الطلب مرة واحدة ────────
  if (res.status === 401) {
    const newToken = await tryRefreshToken();

    if (!newToken) return res; // clearSession() استدعاها tryRefreshToken

    res = await fetch(`${BASE}${endpoint}`, {
      ...options,
      headers: buildHeaders(newToken),
    });

    // إذا فشل مجدداً بعد الـ refresh → اطرد المستخدم
    if (res.status === 401) {
      clearSession();
    }
  }

  return res;
};

export { BASE };