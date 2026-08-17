import crypto from 'crypto';
import { cashfreeRequest, requireCashfreeUser, supabaseGet } from './_cashfree.js';

function baseUrl(req) {
  if (process.env.ATSHREE_BASE_URL) return process.env.ATSHREE_BASE_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await requireCashfreeUser(req);
    const { items, customer } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty' });

    const normalized = items.map((item) => ({
      productId: Number(item?.product_id),
      size: String(item?.size || 'M'),
      quantity: Number(item?.quantity)
    }));
    if (normalized.some(x => !Number.isInteger(x.productId) || !Number.isInteger(x.quantity) || x.quantity < 1 || x.quantity > 50)) {
      return res.status(400).json({ error: 'Invalid cart items' });
    }

    const ids = [...new Set(normalized.map(x => x.productId))];
    const products = await supabaseGet(`products?id=in.(${ids.join(',')})&active=eq.true&select=id,name,price,sale_price,sizes`);
    const byId = new Map((products || []).map(p => [Number(p.id), p]));
    let subtotal = 0;
    for (const item of normalized) {
      const product = byId.get(item.productId);
      if (!product) return res.status(400).json({ error: 'One or more products are unavailable' });
      if (Array.isArray(product.sizes) && product.sizes.length && !product.sizes.includes(item.size)) {
        return res.status(400).json({ error: `${product.name} is not available in size ${item.size}` });
      }
      const unit = Number(product.sale_price ?? product.price);
      subtotal += unit * item.quantity;
    }
    const shipping = subtotal > 0 && subtotal < 1999 ? 99 : 0;
    const amount = Number((subtotal + shipping).toFixed(2));
    if (amount < 1) return res.status(400).json({ error: 'Invalid order amount' });

    const phone = String(customer?.phone || '').replace(/\D/g, '').slice(-10);
    const name = String(customer?.name || '').trim();
    if (!name || !/^[0-9]{10}$/.test(phone)) return res.status(400).json({ error: 'Valid customer name and phone are required' });

    const orderId = `ATS${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`.slice(0, 45);
    const created = await cashfreeRequest('/orders', {
      method: 'POST',
      headers: { 'x-idempotency-key': crypto.randomUUID() },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: user.id,
          customer_name: name,
          customer_email: user.email || String(customer?.email || ''),
          customer_phone: phone
        },
        order_meta: {
          return_url: `${baseUrl(req)}/payment-return.html?order_id={order_id}`,
          notify_url: `${baseUrl(req)}/api/cashfree-webhook`
        },
        order_note: 'ATSHREE online order',
        order_tags: { store: 'ATSHREE', user_id: user.id }
      })
    });

    return res.status(200).json({
      orderId: created.order_id || orderId,
      paymentSessionId: created.payment_session_id,
      amount,
      currency: 'INR',
      environment: String(process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase() === 'production' ? 'production' : 'sandbox'
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to create Cashfree payment order' });
  }
}
