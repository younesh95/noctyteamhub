const {test}=require('node:test');
const assert=require('node:assert/strict');
const {allowedCallPermission,isJitsi}=require('../desktop/call-policy.cjs');
test('Jitsi media permissions require an active call and the exact HTTPS origin',()=>{
  assert.equal(allowedCallPermission('media','https://meet.jit.si/room',true),true);
  for(const url of ['http://meet.jit.si','https://meet.jit.si.evil.test','https://evil.test','file:///meet.jit.si']) assert.equal(isJitsi(url),false);
  assert.equal(allowedCallPermission('media','https://meet.jit.si',false),false);
  assert.equal(allowedCallPermission('clipboard-read','https://meet.jit.si',true),false);
});
test('BO1 and BO3 preserve a single decider and reject repeated maps',async()=>{
  const {defaultSteps,simulate,validateSteps}=await import('../features/veto/engine.mjs');
  const pool=['Dust2','Mirage','Anubis','Cache','Ancient','Nuke','Inferno'];
  for(const format of ['BO1','BO3']){
    const steps=defaultSteps(format);
    const done=simulate(format,pool,steps,pool.slice(0,6));
    assert.equal(done.decider,'Inferno'); assert.equal(done.complete,true); assert.equal(done.picks.length,format==='BO3'?2:0);
    assert.equal(simulate(format,pool,steps,pool.slice(0,5)).complete,false);
    assert.throws(()=>simulate(format,pool,steps,['Mirage','Mirage']));
    assert.throws(()=>simulate(format,pool,steps,['Train']));
  }
  const custom=defaultSteps('BO3').map(s=>({...s,team:'B'}));
  assert.equal(validateSteps('BO3',custom),'');
  assert.notEqual(validateSteps('BO1',custom),'');
  assert.notEqual(validateSteps('BO3',custom.slice(1)),'');
});
