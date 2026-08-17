import crypto from 'crypto';
import { supabaseGet } from './_cashfree.js';

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    if (!process.env.CASHFREE_SECRET_KEY) return res.status(503).json({ error: 'Cashfree is not configured yet' });
    const timestamp = req.headers['x-webhook-timestamp'];
    const signature = req.headers['x-webhook-signature'];
    const rawBody = await readRawBody(req);
    if (!timestamp || !signature) return res.status(400).json({ error: 'Missing Cashfree webhook signature' });

    const age = Math.abs(Date.now() - Number(timestamp));
    if (!Number.isFinite(age) || age > 5 * 60 * 1000) return res.status(400).json({ error: 'Expired webhook' });

    const expected = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
      .update(String(timestamp) + rawBody)
      .digest('base64');
    const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(signature)));
    if (!valid) return res.status(400).json({ error: 'Invalid webhook signature' });

    const payload = JSON.parse(rawBody);
    const eventType = String(payload?.type || payload?.event_type || '').toUpperCase();
    const orderId = payload?.data?.order?.order_id;
    const payment = payload?.data?.payment || {};
    const paymentId = payment?.cf_payment_id;
    const paymentStatus = String(payment?.payment_status || '').toUpperCase();

    // The customer return flow performs the authoritative order finalisation.
    // The webhook keeps already-finalised orders in sync when Cashfree sends later updates.
    if (paymentId && (paymentStatus === 'SUCCESS' || paymentStatus === 'FAILED')) {
      const orders = await supabaseGet(`orders?payment_reference=eq.${encodeURIComponent(String(paymentId))}&select=id,payment_status&limit=1`);
      const order = orders?.[0];
      if (order?.id && paymentStatus === 'SUCCESS') {
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(order.id)}`, {
          method: 'PATCH',
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ payment_status: 'paid', status: 'paid', updated_at: new Date().toISOString() })
        });
        if (!response.ok) console.error('Cashfree webhook order update failed', await response.text());
      }
    }

    return res.status(200).json({ received: true, eventType, orderId });
  } catch (error) {
    console.error('Cashfree webhook error', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
