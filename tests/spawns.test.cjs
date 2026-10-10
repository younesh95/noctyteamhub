const {test}=require('node:test'),assert=require('node:assert/strict');
const {SPAWNS,strategyLanes,actionLane}=require('../lib/domain/spawns.mjs');
test('spawn strategies always contain exactly five lanes independently of roster',()=>{
 const d={type:'Selon les spawns'};
 for(const players of [[],Array.from({length:7},(_,i)=>({id:''+i,role:'joueur'}))])assert.deepEqual(strategyLanes(d,players).map(p=>p.id),['1','2','3','4','5']);
 assert.match(SPAWNS[0].position,/droite/);assert.match(SPAWNS[4].position,/gauche/);
 assert.equal(actionLane(d,{player:'someone',spawn:'3'}),'3');
 assert.equal(strategyLanes(d,[],'Tous','4').length,1);
});
test('role strategies retain player assignments and filter',()=>{assert.equal(actionLane({type:'Selon les rôles'},{player:'player-a',spawn:'1'}),'player-a');assert.equal(strategyLanes({},[{id:'p',role:'joueur'},{id:'c',role:'coach'}]).length,1)});
