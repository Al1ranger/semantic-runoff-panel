// Read-only: no wallet access, signatures or sends.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,receipt,source,state,denied} from './check.mjs';
try{
 const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
 assert(p.final_readback_verified);assert.equal(await rpc('eth_chainId',[]),'0xf22f');
 const code=await source(p.address);assert.equal(code.sha256,p.source.sha256);
 for(const t of p.transactions){
  const current=await receipt(t.hash,t.execution,t.expected_message);assert.equal(current.consensus,t.consensus);assert.equal(current.committed,t.committed);
  const tx=await rpc('eth_getTransactionByHash',[t.hash]);assert.equal((tx.from_address??tx.from).toLowerCase(),t.signer.toLowerCase());
  assert.equal((tx.to_address??tx.to).toLowerCase(),p.address.toLowerCase());
  await new Promise(r=>setTimeout(r,2200));
 }
 for(const prior of Object.values(p.polls)){
  const current=await state(p.address,prior.poll);assert.equal(current.final.root,prior.final.root);
 }
 const elected=Object.values(p.polls).find(x=>x.status==='ELECTED');
 if(elected)assert(await denied(p.address,'winner',[elected.poll,'f'.repeat(64)]));
 console.log(JSON.stringify({verified:true,address:p.address,finalized_transactions:p.transactions.length,terminal_polls:Object.keys(p.polls).length,source_sha256:code.sha256}));
}catch{console.error('Read-only live verification failed; no transaction was sent');process.exitCode=1;}
