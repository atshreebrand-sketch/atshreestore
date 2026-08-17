import{createClient}from'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
const SUPABASE_URL='https://schsitbayzsqalkvnpbs.supabase.co';
const SUPABASE_KEY='sb_publishable_rHtZGmayQqlWsI-g8g_6_7LnaFz';
const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

function attachShiprocketControls(){
  document.querySelectorAll('[data-save-order]').forEach(save=>{
    const controls=save.parentElement;
    if(!controls||controls.querySelector('[data-shiprocket]'))return;
    const b=document.createElement('button');
    b.type='button';b.textContent='CREATE SHIPMENT';b.dataset.shiprocket=save.dataset.saveOrder;
    b.onclick=async()=>{
      b.disabled=true;b.textContent='CREATING…';
      try{
        const{data:{session}}=await sb.auth.getSession();
        if(!session?.access_token)throw Error('Please sign in again.');
        const r=await fetch('/api/shiprocket/create-shipment',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({orderId:save.dataset.saveOrder})});
        const data=await r.json();if(!r.ok)throw Error(data.error||'Shiprocket shipment failed');
        alert(data.alreadyCreated?`Shipment already created. AWB: ${data.awb||'pending'}`:`Shipment created. AWB: ${data.awb||'pending'}`);
        if(data.trackingUrl)window.open(data.trackingUrl,'_blank');
        window.location.reload();
      }catch(e){alert(e.message||'Unable to create shipment');b.disabled=false;b.textContent='CREATE SHIPMENT'}
    };
    controls.appendChild(b);
  });
}
const observer=new MutationObserver(attachShiprocketControls);observer.observe(document.body,{childList:true,subtree:true});setTimeout(attachShiprocketControls,800);
