const SUPABASE_URL = "https://schsitbayzsqalkvnpbs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Prevent accidental duplicate email sends from rapid clicks or double submissions.
// Supabase remains the final server-side rate limiter.
const AUTH_EMAIL_COOLDOWN_MS = 65000;
const AUTH_SIGNUP_LOCK = "atshree_auth_signup_lock";
const AUTH_RECOVERY_LOCK = "atshree_auth_recovery_lock";

function authCooldownRemaining(key) {
  const last = Number(localStorage.getItem(key) || 0);
  return Math.max(0, AUTH_EMAIL_COOLDOWN_MS - (Date.now() - last));
}

function markAuthEmailAttempt(key) {
  localStorage.setItem(key, String(Date.now()));
}

const originalSignUp = supabaseClient.auth.signUp.bind(supabaseClient.auth);
supabaseClient.auth.signUp = async (...args) => {
  const remaining = authCooldownRemaining(AUTH_SIGNUP_LOCK);
  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000);
    return {
      data: { user: null, session: null },
      error: new Error(`Please wait ${seconds} seconds before trying account creation again. If you already created the account, check your email or sign in instead.`)
    };
  }
  markAuthEmailAttempt(AUTH_SIGNUP_LOCK);
  const result = await originalSignUp(...args);
  if (result?.error && /rate limit|429|too many/i.test(result.error.message || "")) {
    return {
      ...result,
      error: new Error("Email sending is temporarily rate-limited. Please wait before trying again. ATSHREE should use custom SMTP for production customer confirmation emails.")
    };
  }
  return result;
};

const originalRecovery = supabaseClient.auth.resetPasswordForEmail.bind(supabaseClient.auth);
supabaseClient.auth.resetPasswordForEmail = async (...args) => {
  const remaining = authCooldownRemaining(AUTH_RECOVERY_LOCK);
  if (remaining > 0) {
    const seconds = Math.ceil(remaining / 1000);
    return { data: {}, error: new Error(`Please wait ${seconds} seconds before requesting another reset email.`) };
  }
  markAuthEmailAttempt(AUTH_RECOVERY_LOCK);
  const result = await originalRecovery(...args);
  if (result?.error && /rate limit|429|too many/i.test(result.error.message || "")) {
    return { ...result, error: new Error("Password-reset email sending is temporarily rate-limited. Please wait and try again.") };
  }
  return result;
};
