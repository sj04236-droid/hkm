const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(require.resolve('../public/subscription-core.js'),'utf8'),ctx);const SubscriptionCore=ctx.SubscriptionCore;

test('free trial allows exactly ten metered actions',()=>{
  let state=SubscriptionCore.normalize({});
  for(let i=0;i<10;i++){
    const result=SubscriptionCore.consume(state,'entry');
    assert.equal(result.allowed,true);
    state=result.state;
  }
  assert.equal(SubscriptionCore.remaining(state),0);
  assert.equal(SubscriptionCore.consume(state,'pnr').allowed,false);
  assert.equal(state.featureCounts.entry,10);
});

test('active subscribers are not decremented',()=>{
  const state=SubscriptionCore.normalize({status:'active',used:10});
  const result=SubscriptionCore.consume(state,'passport');
  assert.equal(result.allowed,true);
  assert.equal(result.state.used,10);
  assert.equal(result.remaining,Infinity);
});
