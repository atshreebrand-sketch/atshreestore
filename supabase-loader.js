(function(){
  function finish(){
    if(window.supabaseClient) return true;
    if(window.supabase && typeof window.supabase.createClient==='function'){
      if(!document.querySelector('script[data-atshree-supabase-config]')){
        var c=document.createElement('script');
        c.src='/supabase.js?v=20260829';
        c.setAttribute('data-atshree-supabase-config','true');
        document.head.appendChild(c);
      }
      return true;
    }
    return false;
  }
  if(finish()) return;
  var sources=[
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js',
    'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js'
  ];
  function load(i){
    if(finish()) return;
    if(i>=sources.length){console.error('ATSHREE: Could not load Supabase client.');return;}
    var s=document.createElement('script');
    s.src=sources[i];
    s.async=false;
    s.onload=function(){
      if(!finish()) load(i+1);
    };
    s.onerror=function(){load(i+1)};
    document.head.appendChild(s);
  }
  load(0);
})();
