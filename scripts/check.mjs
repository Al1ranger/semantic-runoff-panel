import fs from 'node:fs';
import crypto from 'node:crypto';
import dns from 'node:dns';
import assert from 'node:assert/strict';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
dns.setDefaultResultOrder('ipv4first');
export const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x).replace(/[\u007f-\uffff]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')):
 Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>canonical(k)+':'+canonical(x[k])).join(',')+'}';
export const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
export const digest=x=>sha(canonical(x));
export async function rpc(method,params){
 if(!['eth_chainId','eth_getTransactionByHash','gen_getContractCode','eth_getTransactionCount','sim_getTransactionsForAddress'].includes(method))throw Error('Read-only RPC methods only');
 for(let attempt=0;attempt<3;attempt++)try{
  const r=await fetch('https://studio.genlayer.com/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error('HTTP failure');const p=await r.json();if(p.error||p.result==null)throw Error('RPC failure');return p.result;
 }catch{if(attempt===2)throw Error('Read-only RPC unavailable');await new Promise(r=>setTimeout(r,4000*(attempt+1)));}
}
const client=createClient({chain:studionet});
export const read=(address,functionName,args)=>client.readContract({address,functionName,args});
export async function receipt(hash,expected='SUCCESS',message){
 let tx=await rpc('eth_getTransactionByHash',[hash]);
 const indexed=t=>t.status==='FINALIZED'&&t.result_name&&t.consensus_data?.leader_receipt?.some(x=>x.mode==='leader'&&x.execution_result);
 for(let i=0;!indexed(tx)&&i<30;i++){await new Promise(r=>setTimeout(r,4000));tx=await rpc('eth_getTransactionByHash',[hash]);}
 const leader=tx.consensus_data?.leader_receipt?.find(x=>x.mode==='leader');
 const raw=leader?.genvm_result?.stderr||leader?.result;
 const decoded=typeof raw!=='string'?'':(/^[A-Za-z0-9+/]*={0,2}$/.test(raw)&&raw.length%4===0?Buffer.from(raw,'base64').toString('utf8'):raw);
 const result={hash,address:tx.to_address??tx.to,status:tx.status,execution:leader?.execution_result,consensus:tx.result_name,
  ...(message?{expected_error_matched:decoded.includes(message)}:{})};
 if(tx.status==='FINALIZED'&&expected==='SUCCESS'&&leader?.execution_result==='SUCCESS'&&tx.result_name==='MAJORITY_DISAGREE')return {...result,committed:false};
 if(tx.status!=='FINALIZED'||leader?.execution_result!==expected||tx.result_name!=='MAJORITY_AGREE'||(message&&!decoded.includes(message)))throw Error('Receipt unverified');
 return {...result,committed:expected==='SUCCESS'};
}
export async function source(address){
 const norm=x=>x.replace(/\r\n/g,'\n').trimEnd()+'\n';
 const actual=norm(Buffer.from(await rpc('gen_getContractCode',[address]),'base64').toString('utf8'));
 if(actual!==norm(fs.readFileSync('contracts/SemanticRunoffPanel.py','utf8')))throw Error('Source mismatch');
 return {address,source_match:true,sha256:sha(actual)};
}

export function tally(candidates,votes){
 // Independent cursor-based implementation: each ballot cursor advances past eliminations.
 let alive=candidates.map(c=>c.id);const cursors=votes.map(()=>0),rounds=[];
 const total=votes.reduce((s,v)=>s+v.weight,0),abstained=votes.filter(v=>v.status==='ABSTAIN').reduce((s,v)=>s+v.weight,0);
 while(alive.length){
  const counts=alive.map(()=>0),allocations=[];let exhausted=0;
  votes.forEach((v,i)=>{
   while(cursors[i]<v.ranking.length&&!alive.includes(v.ranking[cursors[i]]))cursors[i]++;
   const selected=v.ranking[cursors[i]]??'';allocations.push(selected);
   if(selected)counts[alive.indexOf(selected)]+=v.weight;else if(v.status==='RANKED')exhausted+=v.weight;
  });
  const active=counts.reduce((a,b)=>a+b,0);assert.equal(active+exhausted+abstained,total);
  const row={active:[...alive],counts,allocations,active_weight:active,exhausted_weight:exhausted,abstained_weight:abstained,eliminated:'',majority:''};rounds.push(row);
  if(active===0)return {status:'NO_VOTES',winner:'',rounds,total_weight:total};
  const winner=alive.find((_,i)=>counts[i]*2>active);
  if(winner){row.majority=winner;return {status:'ELECTED',winner,rounds,total_weight:total};}
  const minimum=Math.min(...counts),lowest=alive.filter((_,i)=>counts[i]===minimum);
  if(lowest.length!==1)return {status:'TIED_LAST',winner:'',rounds,total_weight:total};
  row.eliminated=lowest[0];alive=alive.filter(x=>x!==lowest[0]);
 }throw Error('Tally did not terminate');
}
export function verifyBallot(ballot,candidates,held=false){
 assert.equal(canonical(Object.keys(ballot).sort()),canonical(['ranking','status']));
 assert((held?['RANKED','ABSTAIN','UNCLEAR','HELD']:['RANKED','ABSTAIN','UNCLEAR']).includes(ballot.status));
 assert(Array.isArray(ballot.ranking));
 if(ballot.status==='RANKED')assert(ballot.ranking.length>=1&&ballot.ranking.length<=candidates.length&&new Set(ballot.ranking).size===ballot.ranking.length&&ballot.ranking.every(x=>candidates.some(c=>c.id===x)));
 else assert.equal(ballot.ranking.length,0);
}
export function verifyAttempt(key,record,poll,configRoot,candidates,voter,revision,previous){
 const {root,...body}=record,r=record.report,b=r.binding,s=r.source;
 assert.equal(digest(body),root);assert.equal(record.poll,poll);assert.equal(record.voter,voter);assert.equal(record.revision,revision);
 assert.equal(record.config_root,configRoot);assert.equal(record.previous_attempt,previous);
 assert.equal(key,digest({poll,voter,revision}));
 assert(/^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9_.-]+\/[0-9a-f]{40}\/[A-Za-z0-9_./-]+\.json$/.test(b.source.url));
 assert(/^[0-9a-f]{64}$/.test(b.source.sha256));
 assert.equal(canonical(b),canonical({policy:'semantic-runoff-panel-v1',poll,config_root:configRoot,voter,revision,attempt:key,source:b.source}));
 assert.equal(s.url,b.source.url);let doc='ACQUISITION_FAILED';
 if(['OK','HASH_MISMATCH'].includes(s.status)){
  assert(s.http===200&&Buffer.byteLength(s.body)>=1&&Buffer.byteLength(s.body)<=2048);assert.equal(sha(s.body),s.hash);
  assert.equal(s.status,s.hash===b.source.sha256?'OK':'HASH_MISMATCH');
  if(s.status==='OK'){
   doc='INVALID_BALLOT';let obj;try{obj=JSON.parse(s.body);}catch{}
   if(obj&&canonical(Object.keys(obj).sort())===canonical(['schema','statement'])&&obj.schema==='semantic-ballot-v1'&&typeof obj.statement==='string'&&obj.statement===obj.statement.trim()&&Buffer.byteLength(obj.statement)>=10&&Buffer.byteLength(obj.statement)<=800&&!/[\u0000-\u001f]/.test(obj.statement))doc='READY';
  }
 }else assert(['UNAVAILABLE','HTTP_ERROR','SIZE_ERROR','ENCODING_ERROR'].includes(s.status)&&!s.body&&!s.hash);
 verifyBallot(r.ballot,candidates,true);assert.equal(r.document_status,doc);assert.equal(r.ballot.status==='HELD',doc!=='READY');
 assert.equal(canonical(record.ballot),canonical(r.ballot));return true;
}
export async function denied(address,method,args){
 try{await read(address,method,args);return false;}catch(e){if(e.code===-32000&&e.details==='execution failed')return true;throw Error('Read failed without verified contract revert');}
}
export async function state(address,pollId){
 const p=await read(address,'get_poll',[pollId]),c=p.config;
 assert.equal(c.contract,address);assert.equal(c.policy,'semantic-runoff-panel-v1');assert.equal(digest(c),p.config_root);
 assert.equal(digest({contract:address,creator:c.creator,nonce:c.nonce}),pollId);
 assert(c.members.length>=2&&c.members.length<=8&&new Set(c.members.map(m=>m.address.toLowerCase())).size===c.members.length);
 assert(c.members.every(m=>Number.isInteger(m.weight)&&m.weight>=1&&m.weight<=100));
 assert(c.candidates.length>=2&&c.candidates.length<=4&&new Set(c.candidates.map(x=>x.id)).size===c.candidates.length);
 assert(Object.keys(p.ballots).every(v=>c.members.some(m=>m.address===v)));
 const attempts=[];let count=0;
 for(const member of c.members){
  const slot=p.ballots[member.address];if(!slot)continue;
  assert(Number.isInteger(slot.revision)&&slot.revision>=0&&slot.revision<3);let previous='',last;
  for(let revision=0;revision<=slot.revision;revision++){
   const key=digest({poll:pollId,voter:member.address,revision}),record=await read(address,'get_attempt',[key]);
   verifyAttempt(key,record,pollId,p.config_root,c.candidates,member.address,revision,previous);attempts.push({key,...record});previous=key;last=record;count++;
  }
  assert.equal(canonical(slot),canonical({attempt:previous,revision:slot.revision,root:last.root,...last.ballot}));
 }
 assert.equal(count,p.attempt_count);
 if(p.status==='OPEN')assert.equal(p.final,null);
 else{
  const {root,...body}=p.final;assert.equal(digest(body),root);assert.equal(body.poll,pollId);assert.equal(body.config_root,p.config_root);
  assert.equal(canonical(body.ballot_roots),canonical(c.members.map(m=>p.ballots[m.address]?.root??'')));
  const unresolved=c.members.filter(m=>!['RANKED','ABSTAIN'].includes(p.ballots[m.address]?.status)).map(m=>m.address);
  const expected=unresolved.length?{status:'INCOMPLETE',winner:'',rounds:[],unresolved}:
   tally(c.candidates,c.members.map(m=>({weight:m.weight,status:p.ballots[m.address].status,ranking:p.ballots[m.address].ranking})));
  assert.equal(canonical(expected),canonical(body.outcome));assert.equal(p.status,expected.status);
  if(p.status==='ELECTED')assert.equal(canonical(await read(address,'winner',[pollId,root])),canonical({final_root:root,candidate:c.candidates.find(x=>x.id===expected.winner)}));
  else assert(await denied(address,'winner',[pollId,root]));
 }
 return {poll:pollId,...p,attempts,verified:true};
}
if(process.argv[1]?.endsWith('check.mjs'))try{
 const [mode,value,extra]=process.argv.slice(2);
 const result=mode==='source'?await source(value):mode==='state'?await state(value,extra):['success','error'].includes(mode)?await receipt(value,mode==='error'?'ERROR':'SUCCESS',extra):null;
 if(!result)throw Error('Unknown mode');console.log(JSON.stringify(result));
}catch{console.error('Sanitized verification failure; inspect recorded hashes before retry');process.exitCode=1;}
