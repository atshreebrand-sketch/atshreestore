import { getShiprocketTracking, getSupabaseUser, supabaseGet } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const user = await getSupabaseUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Authentication required' });
    const orderId = String(req.query?.orderId || '').trim();
    const requestedAwb = String(req.query?.awb || '').trim();
    if (!orderId && !requestedAwb) return res.status(400).json({ error: 'orderId is required' });

    let awb = requestedAwb;
    if (orderId) {
      const orders = await supabaseGet(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,user_id,awb_code&limit=1`);
      const order = orders?.[0];
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.user_id !== user.id) return res.status(403).json({ error: 'Not authorized for this order' });
      awb = order.awb_code || '';
    }
    if (!awb) return res.status(404).json({ error: 'Tracking is not available yet' });
    const data = await getShiprocketTracking(awb);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to fetch shipment tracking' });
  }
}
