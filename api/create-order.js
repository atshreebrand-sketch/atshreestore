export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({ error: 'Razorpay is not configured yet' });
  }
  try {
    const { amount, receipt } = req.body || {};
    const paise = Number(amount);
    if (!Number.isInteger(paise) || paise < 100) return res.status(400).json({ error: 'Invalid amount' });
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: paise, currency: 'INR', receipt: String(receipt || `ATS-${Date.now()}`), payment_capture: 1 })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.description || 'Unable to create payment order' });
    return res.status(200).json({ orderId: data.id, amount: data.amount, currency: data.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (e) {
    return res.status(500).json({ error: 'Payment order creation failed' });
  }
}
