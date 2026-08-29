(function(){
  const SUPABASE_URL="https://schsitbayzsqalkvnpbs.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY="sb_publishable_rHtZGmayQqlWsI-gJt-i8g_6_7LnaFz";
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('ATSHREE: Supabase library failed to load.');
    return;
  }
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
})();
