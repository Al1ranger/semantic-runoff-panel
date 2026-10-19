import test from 'node:test';
import assert from 'node:assert/strict';
import {tally,verifyBallot} from '../scripts/check.mjs';
const candidates=['a','b','c'].map(id=>({id}));
const vote=(weight,ranking,status='RANKED')=>({weight,ranking,status});
test('transfer changes counts and wins, with conserved total weight',()=>{
 const r=tally(candidates,[vote(2,['a','b','c']),vote(2,['b','c','a']),vote(1,['c','b','a'])]);
 assert.equal(r.winner,'b');assert.deepEqual(r.rounds.map(x=>x.counts),[[2,2,1],[2,3]]);assert.equal(r.rounds[0].eliminated,'c');
});
test('tied last does not pick an arbitrary candidate',()=>{
 assert.equal(tally(candidates,[vote(1,['a']),vote(1,['b']),vote(1,['c'])]).status,'TIED_LAST');
});
test('abstention, uncertainty and exhaustion are distinct',()=>{
 assert.equal(tally(candidates,[vote(1,[],'ABSTAIN'),vote(2,[],'ABSTAIN')]).status,'NO_VOTES');
 const r=tally(candidates,[vote(3,['a']),vote(2,['b']),vote(1,['c'])]);assert.equal(r.winner,'a');assert.equal(r.rounds[1].exhausted_weight,1);
 assert.throws(()=>verifyBallot({status:'UNCLEAR',ranking:['a']},candidates));
});
test('all 1,000 triples of partial ballots conserve weight and terminate',()=>{
 const ranks=[['a'],['b'],['c'],['a','b'],['a','c'],['b','a'],['b','c'],['c','a'],['c','b'],['a','b','c']];let count=0;
 for(const a of ranks)for(const b of ranks)for(const c of ranks){
  const result=tally(candidates,[vote(2,a),vote(2,b),vote(1,c)]);assert(result.rounds.length<=3);
  for(const row of result.rounds)assert.equal(row.active_weight+row.exhausted_weight+row.abstained_weight,5);count++;
 }assert.equal(count,1000);
});
