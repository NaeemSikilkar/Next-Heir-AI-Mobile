import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';
const API = `${BASE}/api`;

export const getToken = async () => AsyncStorage.getItem('nh_token');
export const setToken = async (t: string) => AsyncStorage.setItem('nh_token', t);
export const clearToken = async () => AsyncStorage.removeItem('nh_token');

async function request(path: string, options: any = {}) {
  const token = await getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {}
    throw new Error(detail);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const api = {
  // auth
  registerEmail: (data: { full_name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  loginEmail: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  requestOtp: (mobile: string) =>
    request('/auth/mobile/request-otp', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOtp: (data: { mobile: string; otp: string; full_name?: string }) =>
    request('/auth/mobile/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),

  // dashboard
  dashboard: () => request('/dashboard'),

  // assets
  listAssets: () => request('/assets'),
  createAsset: (data: any) => request('/assets', { method: 'POST', body: JSON.stringify(data) }),
  updateAsset: (id: string, data: any) => request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id: string) => request(`/assets/${id}`, { method: 'DELETE' }),

  // family
  listFamily: () => request('/family'),
  createFamily: (data: any) => request('/family', { method: 'POST', body: JSON.stringify(data) }),
  updateFamily: (id: string, data: any) => request(`/family/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteFamily: (id: string) => request(`/family/${id}`, { method: 'DELETE' }),

  // scenarios
  listScenarios: () => request('/scenarios'),
  getScenario: (id: string) => request(`/scenarios/${id}`),
  createScenario: (data: any) => request('/scenarios', { method: 'POST', body: JSON.stringify(data) }),
  updateScenario: (id: string, data: any) =>
    request(`/scenarios/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScenario: (id: string) => request(`/scenarios/${id}`, { method: 'DELETE' }),
  analyzeScenario: (id: string) => request(`/scenarios/${id}/analyze`, { method: 'POST' }),
  shareScenario: (id: string) => request(`/scenarios/${id}/share`, { method: 'POST' }),
  pdfUrl: (id: string) => `${API}/scenarios/${id}/pdf`,

  // chat
  chat: (message: string, session_id?: string) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ message, session_id }) }),
  chatHistory: (session_id?: string) =>
    request(`/chat/history${session_id ? `?session_id=${session_id}` : ''}`),
  clearChat: (session_id?: string) =>
    request(`/chat/history${session_id ? `?session_id=${session_id}` : ''}`, { method: 'DELETE' }),
};

export const BACKEND_URL = BASE;
export const API_BASE = API;
