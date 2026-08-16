const SUPABASE_URL='https://schsitbayzsqalkvnpbs.supabase.co';
const SUPABASE_KEY='sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz';
import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);
const msg=document.querySelector('#adminMessage');
const notice=document.querySelector('#adminNotice');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products=[];
let inventory=[];
let editingId=null;

function showNotice(text,type='success'){
  notice.innerHTML=`<div class="adminNotice ${type}">${esc(text)}</div>`;
  setTimeout(()=>{if(notice)notice.innerHTML=''},3500);
}
function value(id){return document.querySelector(id).value.trim()}
function setValue(id,v=''){document.querySelector(id).value=v??''}
function arr(value){return String(value||'').split(',').map(x=>x.trim()).filter(Boolean)}
function productFormData(){
  const sale=value('#productSalePrice');
  return {
    name:value('#productName'),category:value('#productCategory'),price:Number(value('#productPrice')),
    sale_price:sale===''?null:Number(sale),image_url:value('#productImageUrl'),description:value('#productDescription'),
    fabric:value('#productFabric'),care:value('#productCare'),sku:value('#productSku'),
    featured:document.querySelector('#productFeatured').checked,sizes:arr(value('#productSizes')),colors:arr(value('#productColors')),
    active:document.querySelector('#productActive').checked,stock:Number(value('#productStock'))
  };
}
function resetForm(){
  editingId=null;
  document.querySelector('#productForm').reset();
  document.querySelector('#productStock').value='0';
  document.querySelector('#productActive').checked=true;
  document.querySelector('#productEditorTitle').textContent='Add new product';
  document.querySelector('#saveProductBtn').textContent='ADD PRODUCT';
  document.querySelector('#productId').value='';
  document.querySelector('#imagePreview').style.display='none';
}
function editProduct(id){
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p)return;
  editingId=Number(p.id);
  setValue('#productId',p.id);setValue('#productName',p.name);setValue('#productCategory',p.category);setValue('#productPrice',p.price);setValue('#productSalePrice',p.sale_price??'');setValue('#productSku',p.sku??'');
  const i=inventory.find(x=>Number(x.product_id)===Number(p.id));
  setValue('#productStock',i?.stock??0);setValue('#productSizes',(p.sizes||[]).join(', '));setValue('#productColors',(p.colors||[]).join(', '));setValue('#productImageUrl',p.image_url??'');setValue('#productDescription',p.description??'');setValue('#productFabric',p.fabric??'');setValue('#productCare',p.care??'');
  document.querySelector('#productFeatured').checked=!!p.featured;document.querySelector('#productActive').checked=!!p.active;
  document.querySelector('#productEditorTitle').textContent=`Edit product #${p.id}`;document.querySelector('#saveProductBtn').textContent='SAVE CHANGES';
  const preview=document.querySelector('#imagePreview');if(p.image_url){preview.src=p.image_url;preview.style.display='block'}else preview.style.display='none';
  document.querySelector('#productEditor details')?.setAttribute('open','');
  window.scrollTo({top:document.querySelector('#productEditor').offsetTop-20,behavior:'smooth'});
}
async function uploadImage(file){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use JPG, PNG or WEBP for product images.');
  if(file.size>5*1024*1024)throw new Error('Product image must be 5 MB or smaller.');
  const ext=(file.name.split('.').pop()||'jpg').toLowerCase();
  const path=`products/${crypto.randomUUID()}.${ext}`;
  const {error}=await sb.storage.from('product-images').upload(path,file,{cacheControl:'31536000',upsert:false,contentType:file.type});
  if(error)throw error;
  const {data}=sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}
async function saveProduct(e){
  e.preventDefault();
  const btn=document.querySelector('#saveProductBtn');btn.disabled=true;btn.textContent='SAVING…';
  try{
    const f=productFormData();
    if(!f.name||!Number.isFinite(f.price)||f.price<0)throw new Error('Enter a valid product name and price.');
    if(!Number.isInteger(f.stock)||f.stock<0)throw new Error('Stock must be a whole number of 0 or more.');
    const file=document.querySelector('#productImage').files[0];
    if(file)f.image_url=await uploadImage(file);
    if(editingId){
      const r=await sb.rpc('admin_upsert_product',{p_id:editingId,p_name:f.name,p_category:f.category,p_price:f.price,p_sale_price:f.sale_price,p_image_url:f.image_url,p_description:f.description,p_fabric:f.fabric,p_care:f.care,p_sku:f.sku,p_featured:f.featured,p_sizes:f.sizes,p_colors:f.colors,p_active:f.active});
      if(r.error)throw r.error;
      const s=await sb.rpc('admin_set_stock',{p_product_id:editingId,p_stock:f.stock});
      if(s.error)throw s.error;
      showNotice('Product updated successfully.');
    }else{
      const r=await sb.rpc('admin_create_product',{p_name:f.name,p_category:f.category,p_price:f.price,p_sale_price:f.sale_price,p_image_url:f.image_url,p_description:f.description,p_fabric:f.fabric,p_care:f.care,p_sku:f.sku,p_featured:f.featured,p_sizes:f.sizes,p_colors:f.colors,p_active:f.active,p_stock:f.stock});
      if(r.error)throw r.error;
      showNotice('Product added to ATSHREE.');
    }
    resetForm();await load();
  }catch(err){console.error(err);showNotice(err.message||'Unable to save product.','error');}
  finally{btn.disabled=false;btn.textContent=editingId?'SAVE CHANGES':'ADD PRODUCT';}
}
async function hideProduct(id){
  const p=products.find(x=>Number(x.id)===Number(id));if(!p)return;
  const action=p.active?'hide':'restore';
  if(!confirm(`${action[0].toUpperCase()+action.slice(1)} “${p.name}”?`))return;
  if(p.active){const r=await sb.rpc('admin_delete_product',{p_product_id:Number(id)});if(r.error){alert(r.error.message);return}}
  else{const r=await sb.rpc('admin_upsert_product',{p_id:Number(id),p_name:p.name,p_category:p.category,p_price:p.price,p_sale_price:p.sale_price,p_image_url:p.image_url,p_description:p.description,p_fabric:p.fabric,p_care:p.care,p_sku:p.sku,p_featured:p.featured,p_sizes:p.sizes||[],p_colors:p.colors||[],p_active:true});if(r.error){alert(r.error.message);return}}
  showNotice(p.active?'Product hidden from store.':'Product restored to store.');load();
}
async function setStock(id){
  const current=inventory.find(x=>Number(x.product_id)===Number(id))?.stock??0;
  const raw=prompt('Enter new stock quantity',String(current));if(raw===null)return;
  const n=Number(raw);if(!Number.isInteger(n)||n<0){alert('Enter a valid non-negative whole number');return}
  const r=await sb.rpc('admin_set_stock',{p_product_id:Number(id),p_stock:n});if(r.error)alert(r.error.message);else{showNotice('Stock updated.');load()}
}
function renderProducts(){
  const el=document.querySelector('#productsList');
  el.innerHTML=products.length?products.map(p=>{
    const i=inventory.find(x=>Number(x.product_id)===Number(p.id));
    const price=p.sale_price?`₹${Number(p.sale_price).toLocaleString('en-IN')} <s>₹${Number(p.price).toLocaleString('en-IN')}</s>`:`₹${Number(p.price).toLocaleString('en-IN')}`;
    return `<div class="productRow"><img class="productThumb" src="${esc(p.image_url||'/assets/products/ivory-kurta.jpg')}" alt="${esc(p.name)}"><div><h3>${esc(p.name)}</h3><small>${esc(p.category)} · ${price} · Stock ${i?.stock??0}${p.sku?' · SKU '+esc(p.sku):''}</small><small>${p.active?'VISIBLE':'HIDDEN'}${p.featured?' · FEATURED':''}${p.sizes?.length?' · Sizes '+esc(p.sizes.join(', ')):''}</small></div><div class="productRowActions"><button data-edit="${p.id}">EDIT</button><button data-stock="${p.id}">SET STOCK</button><button data-hide="${p.id}">${p.active?'HIDE':'RESTORE'}</button></div></div>`;
  }).join(''):'<p>No products yet. Add your first product above.</p>';
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
  document.querySelectorAll('[data-stock]').forEach(b=>b.onclick=()=>setStock(b.dataset.stock));
  document.querySelectorAll('[data-hide]').forEach(b=>b.onclick=()=>hideProduct(b.dataset.hide));
}
async function load(){
  const{data:{user}}=await sb.auth.getUser();
  if(!user){msg.innerHTML='<a class="btn" href="/account.html">LOGIN</a>';return}
  const{data:profile}=await sb.from('profiles').select('is_admin').eq('id',user.id).single();
  if(!profile?.is_admin){msg.textContent='This account is not authorized for admin access.';return}
  const r=await sb.rpc('admin_dashboard');
  if(r.error){msg.textContent='Unable to load admin data: '+r.error.message;return}
  const d=r.data||{};msg.textContent='Admin access granted.';
  const orders=d.orders||[];products=d.products||[];inventory=d.inventory||[];const rewards=d.rewards||[];
  document.querySelector('#stats').innerHTML=`<div class="accountCard"><div class="ey">SALES</div><h2>₹${Number(d.sales||0).toLocaleString('en-IN')}</h2></div><div class="accountCard"><div class="ey">ORDERS</div><h2>${orders.length}</h2></div><div class="accountCard"><div class="ey">PRODUCTS</div><h2>${products.filter(p=>p.active).length}</h2></div><div class="accountCard"><div class="ey">CUSTOMERS</div><h2>${Number(d.customers||0)}</h2></div>`;
  document.querySelector('#ordersList').innerHTML=orders.length?orders.map(o=>`<div class="orderMini"><span>${esc(o.status)} · ${esc(o.payment_status)}</span><strong>₹${Number(o.total||0).toLocaleString('en-IN')}</strong><small>${new Date(o.created_at).toLocaleString('en-IN')}</small><button class="textBtn" data-order="${o.id}" data-status="${o.status==='delivered'?'processing':'delivered'}">MARK ${o.status==='delivered'?'PROCESSING':'DELIVERED'}</button></div>`).join(''):'<p>No orders yet.</p>';
  renderProducts();
  document.querySelector('#rewardsList').innerHTML=rewards.length?rewards.map(r=>`<div class="orderMini"><strong>${Number(r.points).toLocaleString('en-IN')} points</strong><small>${esc(r.tier)}</small></div>`).join(''):'<p>No reward members yet.</p>';
  document.querySelector('#customersList').innerHTML=`<p>${Number(d.customers||0)} registered customer profiles.</p><p class="accountNote">Customer identities remain protected by Supabase security policies.</p>`;
  document.querySelectorAll('[data-order]').forEach(b=>b.onclick=async()=>{const status=b.dataset.status;const x=await sb.rpc('admin_update_order',{p_order_id:b.dataset.order,p_status:status,p_payment_status:null,p_courier:null,p_tracking_number:null,p_tracking_url:null});if(x.error)alert(x.error.message);else load()});
}

document.querySelector('#productForm').addEventListener('submit',saveProduct);
document.querySelector('#cancelEditBtn').addEventListener('click',resetForm);
document.querySelector('#productImage').addEventListener('change',e=>{const file=e.target.files[0],preview=document.querySelector('#imagePreview');if(!file){preview.style.display='none';return}preview.src=URL.createObjectURL(file);preview.style.display='block'});
load();
