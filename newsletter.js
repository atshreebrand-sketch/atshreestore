(function(){
  const form=document.querySelector('.newsletter .signup');
  if(!form)return;
  form.onsubmit=null;
  const input=form.querySelector('input[type="email"]');
  const button=form.querySelector('button');
  const status=document.createElement('p');
  status.className='secureText';
  form.after(status);
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const email=input.value.trim();
    if(!email)return;
    button.disabled=true;
    status.textContent='Joining…';
    try{
      const sb=window.supabaseClient || window.atshreeSupabase;
      if(!sb)throw Error('Newsletter service is temporarily unavailable. Please try again.');
      const {error}=await sb.rpc('subscribe_newsletter',{p_email:email});
      if(error)throw error;
      status.textContent='You’re on the list. Welcome to ATSHREE.';
      form.reset();
    }catch(err){
      status.textContent=err?.message||'Unable to join right now. Please try again.';
    }finally{button.disabled=false;}
  });
})();