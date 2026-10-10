(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SubscriptionCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const TRIAL_LIMIT=10;
  function normalize(value={}){
    const used=Math.min(TRIAL_LIMIT,Math.max(0,Number(value.used)||0));
    const status=value.status==='active'?'active':'trial';
    return {status,used,limit:TRIAL_LIMIT,startedAt:value.startedAt||new Date().toISOString(),featureCounts:value.featureCounts&&typeof value.featureCounts==='object'?value.featureCounts:{}};
  }
  function remaining(value){const state=normalize(value);return state.status==='active'?Infinity:Math.max(0,state.limit-state.used);}
  function canUse(value){const state=normalize(value);return state.status==='active'||state.used<state.limit;}
  function consume(value,feature){
    const state=normalize(value);
    if(state.status==='active') return {allowed:true,state,remaining:Infinity};
    if(state.used>=state.limit) return {allowed:false,state,remaining:0};
    const next={...state,used:state.used+1,featureCounts:{...state.featureCounts,[feature]:(state.featureCounts[feature]||0)+1}};
    return {allowed:true,state:next,remaining:remaining(next)};
  }
  return {TRIAL_LIMIT,normalize,remaining,canUse,consume};
});
