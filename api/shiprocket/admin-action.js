import { requireAdmin, shiprocketRequest, supabaseGet, supabasePatch } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { orderId, action } = req.body || {};
    if (!orderId || !action) return res.status(400).json({ error: 'orderId and action are required' });

    const rows = await supabaseGet(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
    const order = rows?.[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const shipmentId = Number(order.shiprocket_shipment_id || 0);
    if (!shipmentId) return res.status(400).json({ error: 'Shiprocket shipment has not been created yet' });

    let result = null;
    let patch = {};
    if (action === 'label') {
      result = await shiprocketRequest('/courier/generate/label', { method:'POST', body:JSON.stringify({ shipment_id:[shipmentId] }) });
      const labelUrl = result?.label_url || result?.response?.data?.label_url || result?.data?.label_url || null;
      if (labelUrl) patch.shiprocket_label_url = labelUrl;
    } else if (action === 'pickup') {
      result = await shiprocketRequest('/courier/generate/pickup', { method:'POST', body:JSON.stringify({ shipment_id:[shipmentId] }) });
      patch.shiprocket_status = 'Pickup Requested';
    } else if (action === 'track') {
      const awb = String(order.awb_code || '').trim();
      if (!awb) return res.status(400).json({ error: 'AWB is not available yet' });
      result = await shiprocketRequest(`/courier/track/awb/${encodeURIComponent(awb)}`);
      patch.shiprocket_status = result?.tracking_data?.shipment_status || result?.shipment_status || order.shiprocket_status || null;
      if (result?.tracking_data?.track_url) patch.tracking_url = result.tracking_data.track_url;
    } else {
      return res.status(400).json({ error: 'Unsupported action' });
    }

    if (Object.keys(patch).length) await supabasePatch(`orders?id=eq.${encodeURIComponent(orderId)}`, patch);
    return res.status(200).json({ success:true, action, result, patch });
  } catch (error) {
    return res.status(error.status || 500).json({ error:error.message || 'Shiprocket action failed' });
  }
}
