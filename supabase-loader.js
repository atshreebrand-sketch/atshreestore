(function(){
  if (window.supabase && typeof window.supabase.createClient === 'function') return;
  var sources = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://unpkg.com/@supabase/supabase-js@2'
  ];
  function load(i){
    if(i>=sources.length){
      console.error('ATSHREE: Could not load Supabase client from available CDNs.');
      return;
    }
    var s=document.createElement('script');
    s.src=sources[i];
    s.async=false;
    s.onload=function(){
      var next=document.createElement('script');
      next.src='/supabase.js';
      document.head.appendChild(next);
    };
    s.onerror=function(){load(i+1)};
    document.head.appendChild(s);
  }
  load(0);
})();
