import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const sb = createClient(
  'https://schsitbayzsqalkvnpbs.supabase.co',
  'sb_publishable_rHtZGmayQqlWsI-g8g_6_7LnaFz'
);

const css = document.createElement('style');
css.textContent = `
.orderTools{display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:8px;margin:12px 0 18px;padding:12px;background:#faf9f7;border:1px solid #ddd}
.orderTools input,.orderTools select{padding:10px;border:1px solid #ccc;background:#fff;color:#17130f}
.orderTools button{padding:10px 14px;border:1px solid #17130f;background:#17130f;color:#fff;cursor:pointer}
.orderTools .ghost{background:#fff;color:#17130f}
.orderToolsMeta{font-size:11px;color:#756a60;grid-column:1/-1}
.orderAdmin{position:relative}
.orderQuick{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}
.orderQuick button{padding:7px 10px;border:1px solid #17130f;background:#fff;color:#17130f;cursor:pointer;font-size:11px}
.orderModal{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:9999;display:none;align-items:center;justify-content:center;padding:20px}
.orderModal.open{display:flex}
.orderPanel{width:min(820px,100%);max-height:90vh;overflow:auto;background:#fff;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.25)}
.orderPanelHead{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;border-bottom:1px solid #ddd;padding-bottom:15px}
.orderPanelHead button{border:0;background:none;font-size:22px;cursor:pointer}
.orderDetailGrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
.orderDetailCard{border:1px solid #ddd;padding:14px}
.orderDetailCard h3{margin:0 0 10px;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.orderItem{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid #eee;font-size:13px}
.orderTimeline{border-left:2px solid #ddd;padding-left:14px}
.orderTimelineItem{padding:0 0 14px;font-size:12px}
.returnAdmin{margin:20px 0;padding:22px;background:#fff;border:1px solid #ddd}
.returnRow{border-top:1px solid #e5e1dc;padding:14px 0}
.returnRow select,.returnRow input{padding:8px;border:1px solid #ccc;margin:5px 5px 0 0}
.returnRow button{padding:8px 12px;background:#17130f;color:#fff;border:1px solid #17130f;cursor:pointer}
@media(max-width:800px){.orderTools{grid-template-columns:1fr 1fr}.orderToolsMeta{grid-column:1/-1}.orderDetailGrid{grid-template-columns:1fr}}
`;
document.head.appendChild(css);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ordersList = document.querySelector('#ordersList');
if (!ordersList) throw new Error('Orders panel not found');

const tools = document.createElement('div');
tools.className = 'orderTools';
tools.innerHTML = `
  <input id="orderSearch" placeholder="Search order ID, phone, name, city…">
  <select id="orderStatusFilter"><option value="">All statuses</option><option>paid</option><option>processing</option><option>packed</option><option>shipped</option><option>delivered</option><option>cancelled</option></select>
  <select id="orderPaymentFilter"><option value="">All payments</option><option>paid</option><option>pending</option><option>failed</option></select>
  <select id="orderAgeFilter"><option value="">Any date</option><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select>
  <button id="clearOrderFilters" class="ghost">CLEAR</button>
  <div id="orderToolsMeta" class="orderToolsMeta">Loading orders…</div>
`;
ordersList.parentElement.insertBefore(tools, ordersList);

const modal = document.createElement('div');
modal.className = 'orderModal';
modal.id = 'orderModal';
modal.innerHTML = `<div class="orderPanel"><div class="orderPanelHead"><div><div class="ey">ORDER DETAILS</div><h2 id="orderPanelTitle">Order</h2></div><button id="closeOrderModal" aria-label="Close">×</button></div><div id="orderPanelBody">Loading…</div></div>`;
document.body.appendChild(modal);

document.querySelector('#closeOrderModal').onclick = () => modal.classList.remove('open');
modal.onclick = e => { if (e.target === modal) modal.classList.remove('open'); };
document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.classList.remove('open'); });

function orderIdFromRow(row){
  return row.querySelector('[data-save-order]')?.dataset.saveOrder || '';
}

function applyFilters(){
  const q = document.querySelector('#orderSearch').value.trim().toLowerCase();
  const status = document.querySelector('#orderStatusFilter').value;
  const payment = document.querySelector('#orderPaymentFilter').value;
  const age = Number(document.querySelector('#orderAgeFilter').value || 0);
  const cutoff = age ? Date.now() - age * 86400000 : 0;
  let shown = 0;
  const rows = [...ordersList.querySelectorAll('.orderAdmin')];
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    const parts = row.querySelector('.secureText')?.textContent || '';
    const dateText = row.querySelectorAll('.secureText')[0]?.textContent || '';
    const date = Date.parse(dateText.split('·').pop()?.trim() || '');
    const statusMatch = !status || text.includes(`· ${status} ·`) || text.includes(` ${status} ·`);
    const paymentMatch = !payment || text.includes(`· ${payment} ·`) || text.includes(` ${payment} ·`);
    const queryMatch = !q || text.includes(q) || orderIdFromRow(row).toLowerCase().includes(q);
    const ageMatch = !cutoff || (!Number.isNaN(date) && date >= cutoff);
    const ok = statusMatch && paymentMatch && queryMatch && ageMatch;
    row.style.display = ok ? '' : 'none';
    if (ok) shown++;
  });
  document.querySelector('#orderToolsMeta').textContent = `${shown} order${shown === 1 ? '' : 's'} shown`;
}

['#orderSearch','#orderStatusFilter','#orderPaymentFilter','#orderAgeFilter'].forEach(sel => {
  document.querySelector(sel).addEventListener('input', applyFilters);
  document.querySelector(sel).addEventListener('change', applyFilters);
});
document.querySelector('#clearOrderFilters').onclick = () => {
  document.querySelector('#orderSearch').value='';
  document.querySelector('#orderStatusFilter').value='';
  document.querySelector('#orderPaymentFilter').value='';
  document.querySelector('#orderAgeFilter').value='';
  applyFilters();
};

async function openOrder(id){
  modal.classList.add('open');
  document.querySelector('#orderPanelTitle').textContent = `Order ${id.slice(0,8).toUpperCase()}`;
  const body = document.querySelector('#orderPanelBody');
  body.innerHTML = 'Loading order details…';
  const r = await sb.rpc('admin_order_detail',{p_order_id:id});
  if(r.error){body.innerHTML=`<p style="color:#8b2f2f">${esc(r.error.message)}</p>`;return;}
  const d=r.data||{}, o=d.order||{}, a=o.shipping_address||{}, items=d.items||[], history=d.history||[];
  body.innerHTML = `
    <div class="orderQuick"><button id="copyOrder">COPY ORDER ID</button><button id="printInvoice">PRINT INVOICE</button></div>
    <div class="orderDetailGrid">
      <div class="orderDetailCard"><h3>Customer & Delivery</h3><strong>${esc(a.name||'Customer')}</strong><p>${esc(a.phone||'')}<br>${esc(a.address||'')} ${esc(a.line2||'')}<br>${esc(a.city||'')} ${esc(a.state||'')} ${esc(a.pin||'')}</p></div>
      <div class="orderDetailCard"><h3>Payment & Shipping</h3><p><b>Status:</b> ${esc(o.status||'')}<br><b>Payment:</b> ${esc(o.payment_status||'')}<br><b>Total:</b> ₹${Number(o.total||0).toLocaleString('en-IN')}<br><b>Courier:</b> ${esc(o.courier||'—')}<br><b>Tracking:</b> ${esc(o.tracking_number||'—')}</p></div>
    </div>
    <div class="orderDetailCard" style="margin-top:18px"><h3>Items</h3>${items.length?items.map(i=>`<div class="orderItem"><span>${esc(i.product_name)}${i.size?' · '+esc(i.size):''} × ${Number(i.quantity||0)}</span><b>₹${(Number(i.unit_price||0)*Number(i.quantity||0)).toLocaleString('en-IN')}</b></div>`).join(''):'<p>No item details available.</p>'}</div>
    <div class="orderDetailCard" style="margin-top:18px"><h3>Status History</h3><div class="orderTimeline">${history.length?history.map(h=>`<div class="orderTimelineItem"><b>${esc(h.status)}</b><br>${esc(h.note||'')}<br>${new Date(h.created_at).toLocaleString('en-IN')}</div>`).join(''):'<p>No status history.</p>'}</div></div>
  `;
  document.querySelector('#copyOrder').onclick=async()=>{await navigator.clipboard.writeText(id);document.querySelector('#copyOrder').textContent='COPIED';};
  document.querySelector('#printInvoice').onclick=()=>printInvoice(o,items,a);
}

function addDetailButtons(){
  ordersList.querySelectorAll('.orderAdmin').forEach(row=>{
    if(row.querySelector('[data-order-detail]'))return;
    const id=orderIdFromRow(row);if(!id)return;
    const controls=row.querySelector('.orderControls');if(!controls)return;
    const b=document.createElement('button');b.type='button';b.textContent='VIEW DETAILS';b.dataset.orderDetail=id;b.onclick=()=>openOrder(id);controls.appendChild(b);
  });
  applyFilters();
}

function printInvoice(o,items,a){
  const w=window.open('','_blank','width=800,height=900');
  if(!w)return;
  const rows=items.map(i=>`<tr><td>${esc(i.product_name)}${i.size?` · ${esc(i.size)}`:''}</td><td>${Number(i.quantity||0)}</td><td>₹${Number(i.unit_price||0).toLocaleString('en-IN')}</td><td>₹${(Number(i.unit_price||0)*Number(i.quantity||0)).toLocaleString('en-IN')}</td></tr>`).join('');
  w.document.write(`<!doctype html><html><head><title>ATSHREE Invoice</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#17130f}h1{letter-spacing:7px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.total{text-align:right;margin-top:25px;font-size:18px}@media print{button{display:none}}</style></head><body><h1>ATSHREE</h1><p>Tax Invoice / Order Receipt</p><hr><p><b>Order:</b> ${esc(o.id)}<br><b>Date:</b> ${new Date(o.created_at).toLocaleString('en-IN')}</p><p><b>Bill / Ship to:</b><br>${esc(a.name||'')}<br>${esc(a.phone||'')}<br>${esc(a.address||'')} ${esc(a.line2||'')}<br>${esc(a.city||'')} ${esc(a.state||'')} ${esc(a.pin||'')}</p><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Amount</th></tr></thead><tbody>${rows}</tbody></table><div class="total"><b>Total: ₹${Number(o.total||0).toLocaleString('en-IN')}</b></div><p style="margin-top:50px">Thank you for shopping with ATSHREE.</p><script>window.onload=()=>setTimeout(()=>window.print(),300)<\/script></body></html>`);
  w.document.close();
}

const observer = new MutationObserver(() => setTimeout(addDetailButtons,50));
observer.observe(ordersList,{childList:true,subtree:true});
setTimeout(addDetailButtons,800);

// Returns / exchange queue.
const returnsBox=document.createElement('div');
returnsBox.className='returnAdmin';
returnsBox.innerHTML='<h2>Returns & Exchange Requests</h2><p class="secureText">Review customer requests and update their status from the admin panel.</p><div id="returnsList">Loading…</div>';
const ordersCard=document.querySelector('#orders')?.parentElement;
if(ordersCard) ordersCard.appendChild(returnsBox);

async function loadReturns(){
  const r=await sb.rpc('admin_returns');
  const el=document.querySelector('#returnsList');
  if(!el)return;
  if(r.error){el.innerHTML=`<p style="color:#8b2f2f">${esc(r.error.message)}</p>`;return;}
  const data=r.data||[];
  el.innerHTML=data.length?data.map(x=>`<div class="returnRow"><strong>${esc(x.request_type||'RETURN').toUpperCase()}</strong> · ${esc(x.status||'pending')}<div class="secureText">Order ${esc(String(x.order_id||'').slice(0,8).toUpperCase())} · ${esc(x.full_name||'Customer')} · ₹${Number(x.total||0).toLocaleString('en-IN')}<br>${esc(x.reason||'')}</div><select data-return-status="${x.id}"><option>pending</option><option>approved</option><option>rejected</option><option>received</option><option>completed</option><option>cancelled</option></select><input data-return-note="${x.id}" placeholder="Admin note" value="${esc(x.notes||'')}"><button data-return-save="${x.id}">UPDATE</button></div>`).join(''):'<p>No return or exchange requests.</p>';
  el.querySelectorAll('[data-return-save]').forEach(b=>b.onclick=async()=>{
    const id=b.dataset.returnSave;
    const rr=await sb.rpc('admin_return_update',{p_return_id:id,p_status:el.querySelector(`[data-return-status="${id}"]`).value,p_notes:el.querySelector(`[data-return-note="${id}"]`).value.trim()||null});
    if(rr.error)alert(rr.error.message);else loadReturns();
  });
}
loadReturns();
