import assert from 'node:assert/strict';
import {abi} from 'genlayer-js';
const {calldata}=abi;
for(const [method,args] of [
 ['open_poll',['demo','a:Archive|b:Beacon','0x'+'1'.repeat(40)+':1|0x'+'2'.repeat(40)+':1',3600]],
 ['cast',['a'.repeat(64),0,'Al1ranger/semantic-runoff-panel/'+'a'.repeat(40)+'/examples/archive.json','b'.repeat(64)]],
 ['finalize',['a'.repeat(64)]],['get_poll',['a'.repeat(64)]],['get_attempt',['a'.repeat(64)]],['winner',['a'.repeat(64),'b'.repeat(64)]]]){
 const bytes=calldata.encode(calldata.makeCalldataObject(method,args,{}));assert.deepEqual(calldata.encode(calldata.decode(bytes)),bytes);
}
console.log('6 SDK calldata roundtrips passed');
