// ═══════════════════════════════════════════════════════════════
// FitOptim AI — API Client
// ═══════════════════════════════════════════════════════════════

const BASE = '/api';

function getToken() {
  return localStorage.getItem('fitoptim_token');
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function request(method, path, body) {
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
};
