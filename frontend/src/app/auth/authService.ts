// frontend/src/app/auth/authService.ts

const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'agency' | 'tourist';
  phone: string;
  agency: number | null;
  agency_name: string | null;
  agency_logo: string | null;
  agency_currency: string;
  avatar: string | null;
  is_admin: boolean;
  is_approved: boolean;
}

export interface LoginResponse {
  access:  string;
  refresh: string;
  user:    AuthUser;
}

export const saveAuth = (response: LoginResponse) => {
  localStorage.setItem('access_token',  response.access);
  localStorage.setItem('refresh_token', response.refresh);
  localStorage.setItem('user',          JSON.stringify(response.user));
};

export const clearAuth = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

export const getAccessToken  = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

export const getStoredUser = (): AuthUser | null => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = () => !!getAccessToken();

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const res = await fetch(`${BASE}/api/v1/accounts/auth/login/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(
      err.non_field_errors?.[0] ||
      err.detail ||
      'فشل تسجيل الدخول'
    );
  }

  return res.json();
};

export const logout = async () => {
  const refresh = getRefreshToken();
  if (refresh) {
    await fetch(`${BASE}/api/v1/accounts/auth/logout/`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${getAccessToken()}`,
      },
      body: JSON.stringify({ refresh }),
    }).catch(() => {});
  }
  clearAuth();
};

export { BASE };