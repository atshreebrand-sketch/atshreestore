const SUPABASE_URL = "https://schsitbayzsqalkvnpbs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const AUTH_EMAIL_COOLDOWN_MS = 65000;
const AUTH_SIGNUP_LOCK = "atshree_auth_signup_lock";
const AUTH_RECOVERY_LOCK = "atshree_auth_recovery_lock";
function authCooldownRemaining(key) { const last = Number(localStorage.getItem(key) || 0); return Math.max(0, AUTH_EMAIL_COOLDOWN_MS - (Date.now() - last)); }
function markAuthEmailAttempt(key) { localStorage.setItem(key, String(Date.now())); }
const originalSignUp = supabaseClient.auth.signUp.bind(supabaseClient.auth);
supabaseClient.auth.signUp = async (...args) => { const remaining=authCooldownRemaining(AUTH_SIGNUP_LOCK); if(remaining>0){const seconds=Math.ceil(remaining/1000);return {data:{user:null,session:null},error:new Error(`Please wait ${seconds} seconds before trying again. If you already created the account, check your email or sign in instead.`)}} markAuthEmailAttempt(AUTH_SIGNUP_LOCK); const result=await originalSignUp(...args); if(result?.error&&/rate limit|429|too many/i.test(result.error.message||"")){return {...result,error:new Error("Email sending is temporarily rate-limited. Please wait and try again.")}} return result; };
const originalRecovery = supabaseClient.auth.resetPasswordForEmail.bind(supabaseClient.auth);
supabaseClient.auth.resetPasswordForEmail = async (...args) => { const remaining=authCooldownRemaining(AUTH_RECOVERY_LOCK); if(remaining>0){const seconds=Math.ceil(remaining/1000);return {data:{},error:new Error(`Please wait ${seconds} seconds before requesting another reset email.`)}} markAuthEmailAttempt(AUTH_RECOVERY_LOCK); const result=await originalRecovery(...args); if(result?.error&&/rate limit|429|too many/i.test(result.error.message||"")){return {...result,error:new Error("Password-reset email sending is temporarily rate-limited. Please wait and try again.")}} return result; };

async function addAdminAccessButton(){try{const{data:{user}}=await supabaseClient.auth.getUser();if(!user)return;const{data:profile}=await supabaseClient.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(!profile?.is_admin)return;if(document.querySelector('[data-atshree-admin-link]'))return;const navRight=document.querySelector('.navRight');if(navRight){const link=document.createElement('a');link.href='/admin.html';link.className='accountLink';link.dataset.atshreeAdminLink='true';link.textContent='ADMIN';navRight.insertBefore(link,navRight.firstChild);}const profileCard=document.querySelector('#accountArea .accountCard');if(profileCard){const link=document.createElement('a');link.href='/admin.html';link.className='btn';link.dataset.atshreeAdminLink='true';link.textContent='OPEN ADMIN DASHBOARD';link.style.marginTop='14px';profileCard.appendChild(link);}}catch(e){console.warn('Admin indicator unavailable',e)}}
supabaseClient.auth.onAuthStateChange(()=>setTimeout(addAdminAccessButton,100));
setTimeout(addAdminAccessButton,1200);
if(!document.querySelector('script[data-atshree-features]')){const s=document.createElement('script');s.src='/features.js';s.dataset.atshreeFeatures='true';document.head.appendChild(s);}
