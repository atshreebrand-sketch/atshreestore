import { getShiprocketTracking } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const awb = String(req.query?.awb || '').trim();
    if (!awb) return res.status(400).json({ error: 'awb is required' });
    const data = await getShiprocketTracking(awb);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Unable to fetch shipment tracking' });
  }
}
