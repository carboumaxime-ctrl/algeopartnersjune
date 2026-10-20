import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diagnose,validateAnswers,reportText} from '../rfe-engine.mjs';
import worker from '../rfe-api/worker.mjs';
const base={structure:'lmnp',activity:'meublee',territory:'fr',vat:'exonere',assujetti:'oui',siren:'oui',clients:'b2c',size:'pme',debits:'sans'};
const statuses=a=>diagnose(a).rows.map(r=>r[1]);
test('LMNP exonéré mais assujetti : réception seule',()=>assert.deepEqual(statuses(base),['Concerné','Non concerné pour ce flux','Non concerné pour ce flux','Non concerné pour ce flux']));
test('SCI patrimoniale : absence assujettissement confirmée',()=>assert.equal(statuses({...base,structure:'sci_ir',activity:'nue',vat:'non',assujetti:'non'})[0],'Non concerné pour ce flux'));
test('Assujettissement inconnu : aucune conclusion universelle LMNP ou SCI',()=>{for(const structure of ['lmnp','lmp','sci_ir','sci_is'])assert.equal(statuses({...base,structure,assujetti:'inconnu'})[0],'À confirmer');});
test('Franchise : émission B2B et données paiement restent concernées',()=>assert.deepEqual(statuses({...base,activity:'pro_equipe',vat:'franchise',clients:'b2b'}),['Concerné','Concerné','Non concerné pour ce flux','Concerné']));
test('Location pro taxable B2C : e-reporting ; débits exclut données paiement',()=>assert.deepEqual(statuses({...base,activity:'pro_equipe',vat:'taxable',debits:'debits'}),['Concerné','Non concerné pour ce flux','Concerné','Non concerné pour ce flux']));
test('Clientèle mixte et calendrier GE',()=>{const r=diagnose({...base,activity:'parking',vat:'taxable',clients:'mixte',size:'ge',debits:'encaissements'});assert.deepEqual(r.rows.map(r=>r[1]),Array(4).fill('Concerné'));assert.match(r.rows[1][2],/2026/);});
test('Absence SIREN : réception conditionnelle',()=>assert.equal(statuses({...base,siren:'non'})[0],'À confirmer'));
test('Contradiction et territoire hors France : examen spécifique',()=>{assert.ok(diagnose({...base,activity:'parking'}).checks.length);assert.deepEqual(statuses({...base,territory:'autre'}),Array(4).fill('À confirmer'));});
test('Activités mixtes : revue par flux',()=>assert.equal(statuses({...base,activity:'mixte'})[1],'À confirmer'));
test('Toutes les réponses inconnues ne produisent pas un non-assujetti',()=>{const a=Object.fromEntries(Object.entries(base).map(([k,v])=>[k,['structure','activity','territory'].includes(k)?(k==='territory'?'inconnu':'autre'):'inconnu']));assert.equal(validateAnswers(a),true);assert.deepEqual(statuses(a),Array(4).fill('À confirmer'));});
test('Rejet réponses manquantes ou inventées',()=>{assert.equal(validateAnswers({}),false);assert.throws(()=>diagnose({...base,vat:'invalid'}));});
const c={firstName:'Test',lastName:'Simulation',email:'simulation@example.org',phone:'',company:'',ack:true,followup:false,website:''};
const env={RESEND_API_KEY:'test',TURNSTILE_SECRET_KEY:'test',FROM_EMAIL:'ALGEO <test@example.org>',RFE_RATE_LIMITER:{limit:async()=>({success:true})}};
const payload=()=>({answers:base,contact:c,token:'test-token',submissionId:'69b11318-74f7-40b7-9f87-55a79235b91d'});
const req=(data=payload(),origin='https://algeopartners.fr')=>new Request('https://worker.example.org',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)});
test('API : rejet origin, coordonnées invalides, secret absent et corps trop grand',async()=>{assert.equal((await worker.fetch(req(undefined,'https://evil.example'),env)).status,403);assert.equal((await worker.fetch(req({...payload(),contact:{...c,email:'a\r\nb@example.org'}}),env)).status,400);assert.equal((await worker.fetch(req(),{})).status,503);assert.equal((await worker.fetch(req({...payload(),junk:'a'.repeat(17000)}),env)).status,400);});
test('API : limite de débit',async()=>assert.equal((await worker.fetch(req(),{...env,RFE_RATE_LIMITER:{limit:async()=>({success:false})}})).status,429));
test('API : anti-robot, diagnostic recalculé, copie cabinet, erreurs fournisseur',async()=>{
 const original=globalThis.fetch;let calls=[];
 try{
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return url.includes('siteverify')?Response.json({success:true,hostname:'algeopartners.fr',action:'rfe-diagnostic'}):Response.json({id:'mock-email'});};
 assert.equal((await worker.fetch(req({...payload(),result:{title:'FAUX'}}),env)).status,200);
 const mail=JSON.parse(calls[1].options.body);assert.equal(mail.to[0],c.email);assert.equal(mail.bcc[0],'contact@algeopartners.fr');assert.match(mail.text,/Réception des factures/);assert.doesNotMatch(mail.text,/FAUX/);assert.match(mail.text,/Demande de rappel : Non/);
 globalThis.fetch=async()=>Response.json({success:false});assert.equal((await worker.fetch(req(),env)).status,400);
 globalThis.fetch=async(url)=>url.includes('siteverify')?Response.json({success:true,hostname:'evil.example',action:'rfe-diagnostic'}):Response.json({id:'x'});assert.equal((await worker.fetch(req(),env)).status,400);
 globalThis.fetch=async(url)=>url.includes('siteverify')?Response.json({success:true,hostname:'algeopartners.fr',action:'rfe-diagnostic'}):Response.json({error:'down'},{status:500});assert.equal((await worker.fetch(req(),env)).status,502);
 }finally{globalThis.fetch=original;}
});
test('Rapport contient réponses, limites et sources',()=>{const text=reportText(base,diagnose(base));assert.match(text,/impots.gouv.fr/);assert.match(text,/ne vaut pas/);assert.match(text,/LMNP/);});
