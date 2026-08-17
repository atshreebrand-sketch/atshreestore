const SR_BASE = 'https://apiv2.shiprocket.in/v1/external';

async function srRequest(path, options = {}) {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    throw new Error('Shiprocket credentials are not configured');
  }

  const authResponse = await fetch(`${SR_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD
    })
  });
  const auth = await authResponse.json();
  if (!authResponse.ok || !auth.token) {
    throw new Error(auth.message || 'Shiprocket authentication failed');
  }

  const response = await fetch(`${SR_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || data?.errors || 'Shiprocket API request failed';
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return data;
}

export async function shiprocketRequest(path, options = {}) {
  return srRequest(path, options);
}

export async function getShiprocketTracking(awb) {
  return srRequest(`/courier/track/awb/${encodeURIComponent(awb)}`);
}

export async function getSupabaseUser(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY,
      Authorization: auth
    }
  });
  if (!response.ok) return null;
  return response.json();
}

export async function requireAdmin(req) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase server configuration is missing');
  }
  const user = await getSupabaseUser(req);
  if (!user?.id) throw Object.assign(new Error('Authentication required'), { status: 401 });

  const response = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=is_admin&limit=1`,
    {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  );
  const rows = await response.json();
  if (!response.ok || !rows?.[0]?.is_admin) {
    throw Object.assign(new Error('Admin access required'), { status: 403 });
  }
  return user;
}

export async function supabaseGet(path) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Supabase request failed');
  return data;
}

export async function supabasePatch(path, body) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || 'Supabase update failed');
  return data;
}
