const SUPABASE_URL="https://schsitbayzsqalkvnpbs.supabase.co";const SUPABASE_PUBLISHABLE_KEY="sb_publishable_rHtZGmayQqlWsI-g8g_6_7LnaFz";const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);window.supabaseClient=supabaseClient;const AUTH_EMAIL_COOLDOWN_MS=65000,AUTH_SIGNUP_LOCK='atshree_auth_signup_lock',AUTH_RECOVERY_LOCK='atshree_auth_recovery_lock';function authCooldownRemaining(key){const last=Number(localStorage.getItem(key)||0);return Math.max(0,AUTH_EMAIL_COOLDOWN_MS-(Date.now()-last))}function markAuthEmailAttempt(key){localStorage.setItem(key,String(Date.now()))}const originalSignUp=supabaseClient.auth.signUp.bind(supabaseClient.auth);supabaseClient.auth.signUp=async(...args)=>{const remaining=authCooldownRemaining(AUTH_SIGNUP_LOCK);if(remaining>0)return{data:{user:null,session:null},error:new Error(`Please wait ${Math.ceil(remaining/1000)} seconds before trying again.`)}markAuthEmailAttempt(AUTH_SIGNUP_LOCK);return originalSignUp(...args)};const originalRecovery=supabaseClient.auth.resetPasswordForEmail.bind(supabaseClient.auth);supabaseClient.auth.resetPasswordForEmail=async(...args)=>{const remaining=authCooldownRemaining(AUTH_RECOVERY_LOCK);if(remaining>0)return{data:{},error:new Error(`Please wait ${Math.ceil(remaining/1000)} seconds before requesting another reset email.`)}markAuthEmailAttempt(AUTH_RECOVERY_LOCK);return originalRecovery(...args)};async function addAdminAccessButton(){try{const{data:{user}}=await supabaseClient.auth.getUser();if(!user)return;const{data:profile}=await supabaseClient.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(!profile?.is_admin)return;if(document.querySelector('[data-atshree-admin-link]'))return;const navRight=document.querySelector('.navRight');if(navRight){const link=document.createElement('a');link.href='/admin.html';link.className='accountLink';link.dataset.atshreeAdminLink='true';link.textContent='ADMIN';navRight.insertBefore(link,navRight.firstChild)}const profileCard=document.querySelector('#accountArea .accountCard');if(profileCard){const link=document.createElement('a');link.href='/admin.html';link.className='btn';link.dataset.atshreeAdminLink='true';link.textContent='OPEN ADMIN DASHBOARD';profileCard.appendChild(link)}}catch(e){console.warn('Admin indicator unavailable',e)}}supabaseClient.auth.onAuthStateChange(()=>setTimeout(addAdminAccessButton,100));setTimeout(addAdminAccessButton,1200);function loadOnce(src,key){if(document.querySelector(`script[data-${key}]`))return;const s=document.createElement('script');s.src=src;s.dataset[key]='true';document.head.appendChild(s)}loadOnce('/features.js','atshree-features');loadOnce('/customer-care.js','atshree-care');

/* ATSHREE ADMIN LOGIN GUARD: admin.html now has its own secure sign-in screen. */
(async function adminLoginGuard(){
  if(!/\/admin\.html(?:$|[?#])/.test(location.pathname+location.search+location.hash))return;
  const style=document.createElement('style');
  style.textContent='.adminGate{position:fixed;inset:0;z-index:100000;background:#f7f5f1;display:flex;align-items:center;justify-content:center;padding:24px}.adminGateCard{width:min(440px,100%);background:#fff;border:1px solid #ddd;padding:32px;box-shadow:0 18px 60px rgba(0,0,0,.08)}.adminGateCard h1{margin:8px 0 6px}.adminGateCard .ey{font-size:11px;letter-spacing:.12em;color:#756a60}.adminGateForm{display:grid;gap:12px;margin-top:20px}.adminGateForm input{width:100%;box-sizing:border-box;padding:13px;border:1px solid #ccc;background:#fff}.adminGateForm button{padding:13px;border:1px solid #17130f;background:#17130f;color:#fff;cursor:pointer}.adminGateMsg{min-height:20px;margin-top:12px;font-size:13px;color:#8b2f2f}.adminGateMsg.ok{color:#246b36}';document.head.appendChild(style);
  const main=document.querySelector('main');
  if(!main)return;
  const gate=document.createElement('div');gate.className='adminGate';
  gate.innerHTML='<div class="adminGateCard"><div class="ey">ATSHREE CONTROL CENTER</div><h1>Admin Login</h1><p>Sign in with your ATSHREE admin account to continue.</p><form class="adminGateForm" id="adminGateForm"><input id="adminGateEmail" type="email" autocomplete="email" placeholder="Admin email" required><input id="adminGatePassword" type="password" autocomplete="current-password" placeholder="Password" required><button id="adminGateButton" type="submit">SIGN IN TO ADMIN</button></form><div id="adminGateMsg" class="adminGateMsg"></div><p style="font-size:12px;color:#756a60;margin-top:16px">Use your existing ATSHREE account. Do not create a second admin account.</p><a href="/account.html" style="font-size:12px;text-decoration:underline">BACK TO ACCOUNT</a></div>';
  document.body.appendChild(gate);
  main.style.visibility='hidden';
  const msg=document.querySelector('#adminGateMsg'),btn=document.querySelector('#adminGateButton');
  async function check(){
    const{data:{user},error}=await supabaseClient.auth.getUser();
    if(error){msg.textContent=error.message||'Unable to verify your session.';return false}
    if(!user)return false;
    const{data:profile,error:profileError}=await supabaseClient.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();
    if(profileError){msg.textContent=profileError.message||'Unable to verify admin access.';return false}
    if(!profile?.is_admin){msg.textContent='This account is not authorized for admin access.';await supabaseClient.auth.signOut();return false}
    gate.remove();main.style.visibility='visible';return true;
  }
  if(await check())return;
  document.querySelector('#adminGateForm').addEventListener('submit',async e=>{
    e.preventDefault();btn.disabled=true;btn.textContent='SIGNING IN…';msg.textContent='';
    try{
      const email=document.querySelector('#adminGateEmail').value.trim(),password=document.querySelector('#adminGatePassword').value;
      const{error}=await supabaseClient.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(await check()){msg.textContent='Admin access granted.';msg.className='adminGateMsg ok'}
    }catch(err){msg.textContent=err?.message||'Unable to sign in.'}
    finally{btn.disabled=false;btn.textContent='SIGN IN TO ADMIN'}
  });
})();