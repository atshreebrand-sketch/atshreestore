(function(){
  if(window.supabaseClient) return;
  var sources=['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','https://unpkg.com/@supabase/supabase-js@2'];
  function load(i){if(i>=sources.length)return;var s=document.createElement('script');s.src=sources[i];s.async=false;s.onload=function(){var c=document.createElement('script');c.src='/supabase.js';document.head.appendChild(c)};s.onerror=function(){load(i+1)};document.head.appendChild(s)}
  load(0);
})();
