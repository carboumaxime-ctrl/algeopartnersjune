import { diagnose, validateAnswers, reportText } from '../rfe-engine.mjs';
const json=(body,status,headers)=>Response.json(body,{status,headers});
const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function readBody(request){
 const reader=request.body?.getReader();if(!reader)throw Error('body');let size=0,parts=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16000){await reader.cancel();throw Error('size');}parts.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export function validContact(c){return c&&['firstName','lastName'].every(k=>typeof c[k]==='string'&&c[k].trim().length>0&&c[k].length<=100&&!/[\r\n]/.test(c[k]))&&typeof c.email==='string'&&c.email.length<=254&&/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(c.email)&&['phone','company'].every(k=>c[k]===undefined||(typeof c[k]==='string'&&c[k].length<=100&&!/[\r\n]/.test(c[k])))&&c.ack===true&&typeof c.followup==='boolean'&&!c.website;}
export default {
 async fetch(request,env){
  const origin=request.headers.get('Origin');const allowed=(env.ALLOWED_ORIGINS||'https://algeopartners.fr,https://www.algeopartners.fr').split(',').map(x=>x.trim());
  const headers={'Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type'};
  if(!allowed.includes(origin))return json({error:'Origine refusée'},403,headers);
  headers['Access-Control-Allow-Origin']=origin;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(request.method!=='POST')return json({error:'Méthode refusée'},405,headers);
  if(!env.RESEND_API_KEY||!env.TURNSTILE_SECRET_KEY||!env.FROM_EMAIL||!env.RFE_RATE_LIMITER)return json({error:'Service indisponible'},503,headers);
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Format refusé'},415,headers);
  if(Number(request.headers.get('Content-Length'))>16000)return json({error:'Requête trop volumineuse'},413,headers);
  let body;try{body=await readBody(request);}catch{return json({error:'Données invalides'},400,headers);}
  if(!validateAnswers(body.answers)||!validContact(body.contact)||typeof body.token!=='string'||body.token.length>2048||!body.token||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(body.submissionId||''))return json({error:'Données invalides'},400,headers);
  try{
   const ip=request.headers.get('CF-Connecting-IP')||'unknown';
   const limit=await env.RFE_RATE_LIMITER.limit({key:ip});if(!limit.success)return json({error:'Veuillez réessayer ultérieurement'},429,headers);
   const captchaResponse=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',body:new URLSearchParams({secret:env.TURNSTILE_SECRET_KEY,response:body.token,remoteip:ip}),signal:AbortSignal.timeout(8000)});
   const captcha=await captchaResponse.json();
   const hosts=allowed.map(u=>new URL(u).hostname);
   if(!captchaResponse.ok||!captcha.success||!hosts.includes(captcha.hostname)||captcha.action!=='rfe-diagnostic')return json({error:'Vérification anti-robot requise'},400,headers);
   // Never trust an analysis submitted by the browser; recompute from validated choices.
   const result=diagnose(body.answers),c=body.contact;
   const text=`Bonjour ${c.firstName},\n\n${reportText(body.answers,result)}\n\nCoordonnées déclarées : ${c.firstName} ${c.lastName}\nEmail : ${c.email}\nTéléphone : ${c.phone||'Non renseigné'}\nStructure : ${c.company||'Non renseignée'}\nDemande de rappel : ${c.followup?'Oui':'Non'}\nInformation données personnelles acceptée (version 2026-10-20 ; date de demande figurant sur cet email).`;
   const html=`<!doctype html><html lang="fr"><body style="background:#f5efe3;color:#16302e;font:15px/1.7 Arial,sans-serif;padding:24px"><div style="max-width:680px;margin:auto;background:#fffdf8;padding:32px;border-top:5px solid #a8623c"><p style="letter-spacing:2px;color:#a8623c">ALGEO IMMO</p><h1 style="font:30px Georgia,serif">Votre diagnostic facturation électronique</h1><div style="white-space:pre-wrap">${safe(text)}</div><p><a style="color:#2f6b63" href="https://algeopartners.fr/contact.html">Faire le point avec le cabinet</a></p></div></body></html>`;
   const message={from:env.FROM_EMAIL,to:[c.email],bcc:[env.CABINET_EMAIL||'contact@algeopartners.fr'],reply_to:env.CABINET_EMAIL||'contact@algeopartners.fr',subject:'Votre diagnostic facturation électronique — ALGEO Immo',text,html};
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({a:body.answers,c:body.contact})));
   const key=body.submissionId+'-'+Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,'0')).join('');
   const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(message),signal:AbortSignal.timeout(10000)});
   const response=await sent.json();if(!sent.ok||!response.id)return json({error:'Envoi non confirmé'},502,headers);
   return json({success:true},200,headers);
  }catch{return json({error:'Service temporairement indisponible'},502,headers);}
 }
};
