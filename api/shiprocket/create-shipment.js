import { requireAdmin, shiprocketRequest, supabaseGet, supabasePatch } from '../_shiprocket.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    await requireAdmin(req);
    const { orderId, courierId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: 'orderId is required' });

    const orders = await supabaseGet(`orders?id=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
    const order = orders?.[0];
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.shiprocket_order_id) {
      return res.status(200).json({
        alreadyCreated: true,
        shiprocketOrderId: order.shiprocket_order_id,
        shipmentId: order.shiprocket_shipment_id,
        awb: order.awb_code,
        trackingUrl: order.tracking_url,
        labelUrl: order.shiprocket_label_url
      });
    }

    const items = await supabaseGet(`order_items?order_id=eq.${encodeURIComponent(orderId)}&select=product_id,product_name,size,quantity,unit_price`);
    const address = order.shipping_address || {};
    const email = address.email || address.shipping_email || '';
    const phone = String(address.phone || address.mobile || '').replace(/\D/g, '').slice(-10);
    const customerName = address.full_name || address.name || 'ATSHREE Customer';
    const srItems = (items || []).map((item) => ({
      name: item.product_name,
      sku: `ATS-${item.product_id || item.product_name.replace(/\s+/g, '-').slice(0, 20)}`,
      units: Number(item.quantity || 1),
      selling_price: Number(item.unit_price || 0),
      discount: 0
    }));
    const subtotal = srItems.reduce((sum, item) => sum + item.selling_price * item.units, 0);

    const payload = {
      order_id: `ATS-${String(order.id).replace(/-/g, '').slice(0, 16)}`,
      order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 10),
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
      channel_id: process.env.SHIPROCKET_CHANNEL_ID ? Number(process.env.SHIPROCKET_CHANNEL_ID) : undefined,
      billing_customer_name: customerName,
      billing_last_name: '',
      billing_address: address.line1 || address.address || '',
      billing_address_2: address.line2 || address.landmark || '',
      billing_city: address.city || '',
      billing_pincode: Number(address.postal_code || address.pincode || 0),
      billing_state: address.state || '',
      billing_country: 'India',
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      shipping_customer_name: customerName,
      shipping_address: address.line1 || address.address || '',
      shipping_address_2: address.line2 || address.landmark || '',
      shipping_city: address.city || '',
      shipping_pincode: Number(address.postal_code || address.pincode || 0),
      shipping_state: address.state || '',
      shipping_country: 'India',
      shipping_email: email,
      shipping_phone: phone,
      order_items: srItems,
      payment_method: order.payment_status === 'paid' ? 'PREPAID' : 'COD',
      sub_total: subtotal,
      length: Number(process.env.SHIPROCKET_LENGTH_CM || 20),
      breadth: Number(process.env.SHIPROCKET_BREADTH_CM || 15),
      height: Number(process.env.SHIPROCKET_HEIGHT_CM || 10),
      weight: Number(process.env.SHIPROCKET_WEIGHT_KG || 0.5)
    };
    if (!payload.channel_id) delete payload.channel_id;

    // 1) Create the Shiprocket order and shipment.
    const created = await shiprocketRequest('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const shiprocketOrderId = created.order_id || created.orderId;
    const shipmentId = created.shipment_id || created.shipmentId;
    if (!shiprocketOrderId || !shipmentId) {
      throw new Error('Shiprocket did not return order/shipment IDs');
    }

    // 2) Assign an AWB/courier. If courierId is omitted Shiprocket chooses the default.
    const awb = await shiprocketRequest('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: Number(shipmentId), ...(courierId ? { courier_id: Number(courierId) } : {}) })
    });
    const awbCode = awb?.response?.data?.awb_code || awb?.awb_code || awb?.data?.awb_code || '';
    const courierName = awb?.response?.data?.courier_name || awb?.courier_name || awb?.data?.courier_name || null;
    const courierIdReturned = awb?.response?.data?.courier_company_id || awb?.courier_company_id || null;
    if (!awbCode) throw new Error('Shiprocket did not return an AWB');

    // 3) Generate the shipping label. Shiprocket requires shipment_id as an array.
    let labelUrl = null;
    try {
      const label = await shiprocketRequest('/courier/generate/label', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: [Number(shipmentId)] })
      });
      labelUrl = label?.label_url || label?.response?.data?.label_url || label?.data?.label_url || null;
    } catch (_) {
      // Label generation can be retried later without recreating the order/AWB.
    }

    // 4) Request pickup for the shipment.
    let pickupRequested = false;
    try {
      await shiprocketRequest('/courier/generate/pickup', {
        method: 'POST',
        body: JSON.stringify({ shipment_id: [Number(shipmentId)] })
      });
      pickupRequested = true;
    } catch (_) {
      // Keep the shipment usable even if pickup scheduling needs a manual retry.
    }

    const trackingUrl = `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`;
    await supabasePatch(`orders?id=eq.${encodeURIComponent(orderId)}`, {
      shiprocket_order_id: String(shiprocketOrderId),
      shiprocket_shipment_id: String(shipmentId),
      awb_code: awbCode,
      courier: courierName || order.courier || null,
      shiprocket_courier_id: courierIdReturned ? String(courierIdReturned) : null,
      tracking_number: awbCode,
      tracking_url: trackingUrl,
      shiprocket_label_url: labelUrl,
      shiprocket_status: pickupRequested ? 'Pickup Requested' : 'Shipment Booked',
      status: 'processing'
    });

    return res.status(200).json({
      success: true,
      shiprocketOrderId,
      shipmentId,
      awb: awbCode,
      courier: courierName,
      pickupRequested,
      trackingUrl,
      labelUrl
    });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message || 'Unable to create Shiprocket shipment' });
  }
}
