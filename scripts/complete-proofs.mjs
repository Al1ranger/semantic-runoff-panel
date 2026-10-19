import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {rpc,receipt,source,state,read,denied,digest,sha} from './check.mjs';
const file='PROOFS.json',slate='a:Archive|b:Beacon|c:Canopy';
const accounts=[
 {name:'studio-proof-deployer',address:'0x7a413BB4AB62E31d62d4cD9efC8C8a8Dae37FB42'},
 {name:'fairresolve-demo',address:'0x34346773A22564cBCc5F1D67d1C1F9f196DAEA35'},
 {name:'reality-random2',address:'0x5585eA8f2fCc126bAD0830EB9701e19b3cD800D5'}];
// Normalize public addresses using the SDK's underlying checksum utility.
import {getAddress} from 'viem';
accounts.forEach(a=>a.address=getAddress(a.address.toLowerCase()));
let p;
if(fs.existsSync(file))p=JSON.parse(fs.readFileSync(file,'utf8'));
else{
 const commit=process.argv[2];if(!/^[0-9a-f]{40}$/.test(commit??''))throw Error('Supply published fixture commit');
 p={network:'studionet',chain_id:61999,accounts,fixture_commit:commit,transactions:[],polls:{},observations:{}};
}
const save=()=>fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');p.final_readback_verified=false;save();
function broadcast(args,account,onHash){return new Promise((resolve,reject)=>{
 const proc=spawn(process.execPath,['--dns-result-order=ipv4first','scripts/run-cli.cjs',...args],{windowsHide:true,
  env:{...process.env,RUNOFF_TEST_ACCOUNT:account.name},stdio:['ignore','pipe','pipe']});
 let carry='';proc.stderr.resume();proc.stdout.on('data',chunk=>{carry+=chunk.toString();const lines=carry.split(/\r?\n/);carry=lines.pop();
  for(const line of lines)if(/^BROADCAST_HASH 0x[0-9a-fA-F]{64}$/.test(line))onHash(line.split(' ')[1]);});
 proc.on('error',()=>reject(Error('CLI launch failed')));proc.on('close',resolve);
});}
async function tx(step,args,account=accounts[0],expected='SUCCESS',message){
 let entry=p.transactions.find(t=>t.step===step);
 if(!entry){entry={step,signer:account.address,verified:false,broadcast_unknown:true,cli_arguments:args,...(message?{expected_message:message}:{})};p.transactions.push(entry);save();
  await broadcast(args,account,hash=>{entry.hash=hash;delete entry.broadcast_unknown;save();console.log(step+' '+hash);});}
 if(!entry.hash)throw Error('Unknown broadcast outcome; inspect signer history before rebroadcast');
 Object.assign(entry,await receipt(entry.hash,expected,message),{verified:true});save();
 console.log(JSON.stringify({step,status:entry.status,execution:entry.execution,consensus:entry.consensus}));
 if(expected==='SUCCESS'&&!entry.committed)throw Error('Consensus disagreement: no state committed');return entry;
}
async function open(name,weights,duration){
 await tx('open-'+name,['write',p.address,'open_poll','--args',name,slate,accounts.map((a,i)=>a.address+':'+weights[i]).join('|'),String(duration)]);
 const id=digest({contract:p.address,creator:accounts[0].address,nonce:name});p.polls[name]={id};save();return id;
}
async function cast(name,id,member,revision,fixture,bad=false){
 const path='examples/'+fixture+'.json',coordinate='Al1ranger/semantic-runoff-panel/'+p.fixture_commit+'/'+path;
 await tx(name,['write',p.address,'cast','--args',id,String(revision),coordinate,bad?'f'.repeat(64):sha(fs.readFileSync(path))],accounts[member]);
 const poll=await read(p.address,'get_poll',[id]);
 const slot=poll.ballots[accounts[member].address];
 p.observations[name]={poll:id,voter:accounts[member].address,slot};save();return {coordinate,sha:sha(fs.readFileSync(path))};
}
try{
 if(await rpc('eth_chainId',[])!=='0xf22f')throw Error('Wrong chain');
 const deployed=await tx('deploy',['deploy','--contract','contracts/SemanticRunoffPanel.py']);p.address=deployed.address;p.source=await source(p.address);save();
 const expiry=await open('expiry-v1',[2,2,1],60);
 const happy=await open('transfer-v1',[2,2,1],1800);
 await cast('source-held',happy,0,0,'archive',true);
 await cast('unclear-revision',happy,0,1,'unclear');
 await cast('beacon-ballot',happy,1,0,'beacon');
 await cast('canopy-ballot',happy,2,0,'canopy');
 await tx('unresolved-cannot-tally',['write',p.address,'finalize','--args',happy],accounts[1],'ERROR','Panel incomplete before deadline');
 const correct=await cast('corrected-archive',happy,0,2,'archive');
 await tx('replay-revision',['write',p.address,'cast','--args',happy,'2',correct.coordinate,correct.sha],accounts[0],'ERROR','Revision mismatch');
 await tx('finalize-transfer',['write',p.address,'finalize','--args',happy],accounts[1]);
 p.polls['transfer-v1']=await state(p.address,happy);save();
 await tx('terminal-ballot',['write',p.address,'cast','--args',happy,'3',correct.coordinate,correct.sha],accounts[0],'ERROR','Poll terminal');
 const tie=await open('tie-v1',[1,1,1],1800);
 await cast('tie-archive',tie,0,0,'archive');await cast('tie-beacon',tie,1,0,'beacon');await cast('tie-canopy',tie,2,0,'canopy');
 await tx('finalize-tie',['write',p.address,'finalize','--args',tie],accounts[2]);p.polls['tie-v1']=await state(p.address,tie);save();
 await tx('deadline-ballot',['write',p.address,'cast','--args',expiry,'0',correct.coordinate,correct.sha],accounts[0],'ERROR','Ballot deadline passed');
 await tx('finalize-incomplete',['write',p.address,'finalize','--args',expiry],accounts[2]);p.polls['expiry-v1']=await state(p.address,expiry);save();
 if(!await denied(p.address,'winner',[happy,'f'.repeat(64)]))throw Error('Wrong-root consumer unguarded');p.wrong_root_consumer_denied=true;
 for(const [name,prior] of Object.entries(p.polls)){
  const current=await state(p.address,prior.poll??prior.id);if(prior.final&&prior.final.root!==current.final.root)throw Error('Terminal state changed');p.polls[name]=current;
 }
 if(p.transactions.some(t=>!t.verified||t.broadcast_unknown))throw Error('Unverified transaction remains');
 p.source=await source(p.address);p.final_readback_verified=true;p.expected_outcomes_matched={transfer:p.polls['transfer-v1'].final.outcome.winner==='b',tie:p.polls['tie-v1'].status==='TIED_LAST',expiry:p.polls['expiry-v1'].status==='INCOMPLETE'};save();
 console.log(JSON.stringify({complete:true,address:p.address,outcomes:Object.fromEntries(Object.entries(p.polls).map(([k,v])=>[k,v.status]))}));
}catch{console.error('Sanitized proof workflow stopped; inspect recorded hashes/state before retry');process.exitCode=1;}
