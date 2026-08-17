import { cashfreeRequest, requireCashfreeUser } from './_cashfree.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireCashfreeUser(req);
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) return res.status(400).json({ verified: false, error: 'orderId is required' });

    const payments = await cashfreeRequest(`/orders/${encodeURIComponent(orderId)}/payments`, { method: 'GET' });
    const success = Array.isArray(payments)
      ? payments.find(p => String(p.payment_status || '').toUpperCase() === 'SUCCESS')
      : null;
    const pending = Array.isArray(payments)
      ? payments.some(p => ['PENDING', 'NOT_ATTEMPTED'].includes(String(p.payment_status || '').toUpperCase()))
      : false;

    if (success) {
      return res.status(200).json({
        verified: true,
        status: 'SUCCESS',
        paymentId: success.cf_payment_id || success.payment_id || null,
        paymentAmount: Number(success.payment_amount || 0),
        paymentCurrency: success.payment_currency || 'INR',
        bankReference: success.bank_reference || null
      });
    }

    return res.status(200).json({ verified: false, status: pending ? 'PENDING' : 'FAILED' });
  } catch (error) {
    return res.status(error.status || 500).json({ verified: false, error: error.message || 'Payment verification failed' });
  }
}
