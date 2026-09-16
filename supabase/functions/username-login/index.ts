// Supabase Edge Function: username-login (verify_jwt=false, public login endpoint).
// Uses built-in project environment variables. Never return service credentials or emails.
Deno.serve(async (request:Request)=>{
 if(request.method!=='POST') return Response.json({error:'Méthode refusée'},{status:405});
 const fail=()=>Response.json({error:'Nom d’utilisateur ou mot de passe incorrect.'},{status:401});
 try{
  const {username,password}=await request.json();
  if(typeof username!=='string'||!/^[a-zA-Z0-9_-]{3,24}$/.test(username)||typeof password!=='string'||password.length>256)return fail();
  const base=Deno.env.get('SUPABASE_URL')!;const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(username.toLowerCase()));
  const rate_key=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('');
  const rate=await fetch(base+'/rest/v1/rpc/login_rate_limit',{method:'POST',headers,body:JSON.stringify({rate_key})});
  if(!rate.ok||!(await rate.json()))return Response.json({error:'Trop de tentatives. Réessayez dans 10 minutes.'},{status:429});
  const r=await fetch(base+'/rest/v1/rpc/login_email',{method:'POST',headers,body:JSON.stringify({login_username:username})});
  if(!r.ok)return Response.json({error:'Service de connexion non configuré.'},{status:503});
  const email=await r.json();
  const login=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:Deno.env.get('SUPABASE_ANON_KEY')!,'Content-Type':'application/json'},body:JSON.stringify({email:email||'unknown@invalid.invalid',password})});
  if(!email||!login.ok)return fail();
  return Response.json(await login.json(),{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Service de connexion indisponible.'},{status:503})}
});
