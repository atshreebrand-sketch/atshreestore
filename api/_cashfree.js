const API_VERSION = '2025-01-01';
const SANDBOX_BASE = 'https://sandbox.cashfree.com/pg';
const PRODUCTION_BASE = 'https://api.cashfree.com/pg';

export function cashfreeBaseUrl() {
  return String(process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production'
    ? PRODUCTION_BASE
    : SANDBOX_BASE;
}

export function requireCashfreeConfig() {
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    throw Object.assign(new Error('Cashfree is not configured yet'), { status: 503 });
  }
}

export async function cashfreeRequest(path, options = {}) {
  requireCashfreeConfig();
  const response = await fetch(`${cashfreeBaseUrl()}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-client-id': process.env.CASHFREE_APP_ID,
      'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      'x-api-version': API_VERSION,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || data?.type || 'Cashfree API request failed';
    throw Object.assign(new Error(typeof message === 'string' ? message : JSON.stringify(message)), { status: response.status });
  }
  return data;
}

export async function getSupabaseUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: auth
    }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function requireCashfreeUser(req) {
  const user = await getSupabaseUser(req);
  if (!user?.id) throw Object.assign(new Error('Authentication required'), { status: 401 });
  return user;
}

export async function supabaseGet(path) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw Object.assign(new Error('Supabase server configuration is missing'), { status: 503 });
  }
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Supabase request failed');
  return data;
}
