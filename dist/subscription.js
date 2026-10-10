(function(){
  const STORAGE_KEY='atr-travel-ops-subscription-v1';
  const featureLabels={entry:'GDS 엔트리 답변',pnr:'PNR·규정 분석',passport:'여권 자동 인식',quote:'PNR 한글 일정'};
  let subscription=loadSubscription();
  const dialog=document.getElementById('subscriptionDialog');

  function loadSubscription(){
    try{return SubscriptionCore.normalize(JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'));}
    catch{return SubscriptionCore.normalize({});}
  }
  function saveSubscription(){localStorage.setItem(STORAGE_KEY,JSON.stringify(subscription));renderSubscription();}
  function renderSubscription(){
    const active=subscription.status==='active';
    const remaining=SubscriptionCore.remaining(subscription);
    const percent=active?100:Math.round(subscription.used/subscription.limit*100);
    document.getElementById('trialChip').classList.toggle('subscribed',active);
    document.getElementById('trialChip').querySelector('span').textContent=active?'Pro 이용 중':'무료 체험';
    document.getElementById('trialChipCount').textContent=active?'자동화 무제한':`${remaining}회 남음`;
    document.getElementById('planName').textContent=active?'Pro 월간':'무료 체험';
    document.getElementById('workspacePillPlan').textContent=active?'Pro 월간':`무료 ${remaining}회`;
    document.getElementById('subscriptionStatusBadge').textContent=active?'구독 중':remaining?'체험 중':'무료 사용 완료';
    document.getElementById('subscriptionStatusBadge').className=`badge ${remaining||active?'ok':'warn'}`;
    document.getElementById('trialProgressValue').textContent=active?'무제한':`${subscription.used} / ${subscription.limit}회`;
    document.getElementById('trialProgressBar').style.width=`${percent}%`;
    document.getElementById('trialRemainingText').textContent=active?'Pro 자동화 기능을 제한 없이 이용할 수 있습니다.':remaining?`${remaining}회 남았습니다.`:'무료 10회를 모두 사용했습니다.';
    document.getElementById('subscriptionDialogStatus').textContent=active?'Pro 이용 중':'무료 체험';
    document.getElementById('subscriptionDialogRemaining').textContent=active?'무제한':`${remaining}회`;
    document.getElementById('continueTrialBtn').textContent=remaining?'남은 무료 사용 계속하기':'업무 화면으로 돌아가기';
  }
  function openSubscription(reason){
    renderSubscription();
    const notice=document.getElementById('billingNotice');
    if(reason){notice.innerHTML=`<strong>무료 10회를 모두 사용했습니다</strong><p>${featureLabels[reason]||'자동화 기능'}을 계속 이용하려면 Pro 월간 구독이 필요합니다.</p>`;}
    else{notice.innerHTML='<strong>결제 연동 준비 단계</strong><p>Toss Payments 자동결제 계약과 상점 키가 연결된 뒤 카드 등록 버튼이 활성화됩니다. 연결 전에는 결제가 발생하지 않습니다.</p>';}
    if(!dialog.open) dialog.showModal();
  }
  function consume(feature){
    const result=SubscriptionCore.consume(subscription,feature);
    if(!result.allowed){openSubscription(feature);return false;}
    subscription=result.state;saveSubscription();
    toast(`${featureLabels[feature]} · 무료 사용 ${result.remaining}회 남음`);
    return true;
  }
  function eligibleClick(target){
    if(target.closest('#entryAskBtn')) return document.getElementById('entryGds').value&&document.getElementById('entrySearch').value.trim()?'entry':null;
    if(target.closest('#analyzePnrBtn')) return document.getElementById('pnrInput').value.trim()?'pnr':null;
    if(target.closest('#quotePnrBtn')) return document.getElementById('quotePnr').value.trim()?'quote':null;
    if(target.closest('[data-question]')) return document.getElementById('entryGds').value?'entry':null;
    return null;
  }
  document.addEventListener('click',event=>{
    const feature=eligibleClick(event.target);
    if(feature&&!consume(feature)){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&event.target.id==='entrySearch'&&document.getElementById('entryGds').value&&event.target.value.trim()&&!consume('entry')){event.preventDefault();event.stopImmediatePropagation();}
  },true);
  document.getElementById('passportFile').addEventListener('change',event=>{
    if(event.target.files?.length&&!consume('passport')){event.preventDefault();event.stopImmediatePropagation();event.target.value='';}
  },true);
  document.querySelectorAll('[data-open-subscription]').forEach(button=>button.addEventListener('click',()=>openSubscription()));
  document.getElementById('closeSubscriptionDialog').onclick=()=>dialog.close();
  document.getElementById('continueTrialBtn').onclick=()=>dialog.close();
  document.getElementById('startSubscriptionBtn').onclick=()=>{
    document.getElementById('billingNotice').innerHTML='<strong>아직 실제 결제는 시작되지 않았습니다</strong><p>자동결제 상점 계약과 테스트 키를 연결한 다음 테스트 결제로 검증해야 합니다. 시크릿 키는 브라우저나 GitHub에 저장하지 않습니다.</p>';
  };
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  const originalRenderWorkspace=window.renderWorkspace;
  if(typeof originalRenderWorkspace==='function') window.renderWorkspace=function(){originalRenderWorkspace();renderSubscription();};
  renderSubscription();
})();
