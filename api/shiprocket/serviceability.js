import { requireAdmin, shiprocketRequest } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { pickup_postcode, delivery_postcode, cod = 0, weight = 0.5, length = 20, breadth = 15, height = 10 } = req.body || {};
    if (!pickup_postcode || !delivery_postcode) return res.status(400).json({ error: 'pickup_postcode and delivery_postcode are required' });
    const qs = new URLSearchParams({
      pickup_postcode: String(pickup_postcode),
      delivery_postcode: String(delivery_postcode),
      cod: String(cod ? 1 : 0),
      weight: String(weight),
      length: String(length),
      breadth: String(breadth),
      height: String(height)
    });
    const data = await shiprocketRequest(`/courier/serviceability/?${qs.toString()}`, { method: 'GET' });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to check courier serviceability' });
  }
}
