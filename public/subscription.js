(function(){
  const featureLabels={entry:'GDS 엔트리 답변',pnr:'PNR·규정 분석',passport:'여권 자동 인식',quote:'PNR 한글 일정'};
  const dialog=document.getElementById('subscriptionDialog');
  let config={googleClientId:'',tossClientKey:'',loginReady:false,billingReady:false};
  let account=null;
  let subscription={used:0,limit:10,status:'trial'};
  let replaying=false;

  async function api(path,options={}){
    const response=await fetch(path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.error||'요청을 처리하지 못했습니다.');error.status=response.status;throw error;}
    return data;
  }

  function remaining(){return subscription.status==='active'?null:Math.max(0,subscription.limit-subscription.used);}

  function renderSubscription(){
    const active=subscription.status==='active';
    const left=remaining();
    const authenticated=Boolean(account?.authenticated);
    const percent=active?100:Math.round(subscription.used/subscription.limit*100);
    document.getElementById('trialChip').classList.toggle('subscribed',active);
    document.getElementById('trialChip').querySelector('span').textContent=active?'Pro 이용 중':authenticated?'무료 체험':'로그인 필요';
    document.getElementById('trialChipCount').textContent=active?'자동화 무제한':authenticated?`${left}회 남음`:'Google 로그인';
    document.getElementById('planName').textContent=active?'Pro 월간':authenticated?'무료 체험':'로그인 전';
    document.getElementById('workspacePillPlan').textContent=active?'Pro 월간':authenticated?`무료 ${left}회`:'로그인 필요';
    document.getElementById('subscriptionStatusBadge').textContent=active?'구독 중':authenticated?(left?'체험 중':'무료 사용 완료'):'로그인 필요';
    document.getElementById('subscriptionStatusBadge').className=`badge ${active||left?'ok':'warn'}`;
    document.getElementById('trialProgressValue').textContent=active?'무제한':authenticated?`${subscription.used} / ${subscription.limit}회`:'0 / 10회';
    document.getElementById('trialProgressBar').style.width=`${authenticated?percent:0}%`;
    document.getElementById('trialRemainingText').textContent=active?'Pro 자동화 기능을 제한 없이 이용할 수 있습니다.':authenticated?(left?`${left}회 남았습니다.`:'무료 10회를 모두 사용했습니다.'):'Google 로그인 후 무료 10회가 시작됩니다.';
    document.getElementById('subscriptionDialogStatus').textContent=active?'Pro 이용 중':authenticated?'무료 체험':'로그인 전';
    document.getElementById('subscriptionDialogRemaining').textContent=active?'무제한':authenticated?`${left}회`:'10회';
    document.getElementById('continueTrialBtn').textContent=authenticated&&left?'남은 무료 사용 계속하기':'업무 화면으로 돌아가기';
    document.getElementById('loginPanel').classList.toggle('hidden',authenticated);
    document.getElementById('memberPanel').classList.toggle('hidden',!authenticated);
    document.getElementById('startSubscriptionBtn').disabled=!authenticated||!config.billingReady||active;
    document.getElementById('startSubscriptionBtn').textContent=active?'Pro 구독 이용 중':config.billingReady?'Toss Payments 카드 등록':'결제 설정 확인 중';
    if(authenticated){
      document.getElementById('memberName').textContent=account.user.name;
      document.getElementById('memberEmail').textContent=account.user.email;
      document.getElementById('accountChipName').textContent=account.user.name;
      document.getElementById('accountChipEmail').textContent=active?'Pro 이용 중':`${left}회 남음`;
      document.querySelector('.account-avatar').textContent=(account.user.name||'G').slice(0,1).toUpperCase();
    }else{
      document.getElementById('accountChipName').textContent='Google 로그인';
      document.getElementById('accountChipEmail').textContent='회원별 무료 10회';
      document.querySelector('.account-avatar').textContent='G';
    }
  }

  function openSubscription(reason){
    renderSubscription();
    const notice=document.getElementById('billingNotice');
    if(!account?.authenticated) notice.innerHTML='<strong>Google 로그인이 필요합니다</strong><p>무료 10회와 구독 상태를 회원 계정에 저장한 뒤 자동화 기능을 사용할 수 있습니다.</p>';
    else if(reason) notice.innerHTML=`<strong>${remaining()===0?'무료 10회를 모두 사용했습니다':'자동화 사용을 확인합니다'}</strong><p>${featureLabels[reason]||'자동화 기능'}의 사용량은 회원 계정에 기록됩니다.</p>`;
    else notice.innerHTML='<strong>월 9,900원 · VAT 포함</strong><p>카드를 등록하면 첫 달 결제가 승인되고, 이후 매월 같은 날 자동결제됩니다.</p>';
    if(!dialog.open) dialog.showModal();
    renderGoogleButton();
  }

  async function loadAccount(){
    account=await api('/api/account');
    if(account.authenticated) subscription={...account.subscription,limit:10};
    else subscription={used:0,limit:10,status:'trial'};
    renderSubscription();
  }

  function renderGoogleButton(){
    const host=document.getElementById('googleSignInButton');
    if(!host||account?.authenticated||!config.googleClientId||!window.google?.accounts?.id||host.dataset.ready) return;
    window.google.accounts.id.initialize({client_id:config.googleClientId,callback:handleGoogleCredential});
    window.google.accounts.id.renderButton(host,{theme:'outline',size:'large',shape:'pill',text:'signin_with',locale:'ko',width:300});
    host.dataset.ready='true';
  }

  async function handleGoogleCredential(response){
    try{
      await api('/api/auth/google',{method:'POST',body:JSON.stringify({credential:response.credential})});
      await loadAccount();
      if(dialog.open) dialog.close();
      toast('Google 로그인이 완료되었습니다. 무료 자동화 10회가 시작됩니다.');
    }catch(error){
      document.getElementById('billingNotice').innerHTML=`<strong>로그인에 실패했습니다</strong><p>${error.message}</p>`;
    }
  }
  window.handleGoogleCredential=handleGoogleCredential;

  async function consume(feature){
    if(!account?.authenticated){openSubscription(feature);return false;}
    try{
      const result=await api('/api/usage/consume',{method:'POST',body:JSON.stringify({feature})});
      subscription={used:result.used,limit:10,status:result.status};
      renderSubscription();
      toast(`${featureLabels[feature]} · ${result.status==='active'?'Pro 무제한':`무료 사용 ${result.remaining}회 남음`}`);
      return true;
    }catch(error){
      if(error.status===401){account=null;openSubscription(feature);return false;}
      if(error.status===402){subscription={used:10,limit:10,status:'trial'};openSubscription(feature);return false;}
      toast(error.message);return false;
    }
  }

  function eligibleClick(target){
    if(target.closest('#entryAskBtn')) return document.getElementById('entryGds').value&&document.getElementById('entrySearch').value.trim()?'entry':null;
    if(target.closest('#analyzePnrBtn')) return document.getElementById('pnrInput').value.trim()?'pnr':null;
    if(target.closest('#quotePnrBtn')) return document.getElementById('quotePnr').value.trim()?'quote':null;
    if(target.closest('[data-question]')) return document.getElementById('entryGds').value?'entry':null;
    return null;
  }

  document.addEventListener('click',async event=>{
    if(replaying) return;
    const feature=eligibleClick(event.target);
    if(!feature) return;
    const action=event.target.closest('button');
    event.preventDefault();event.stopImmediatePropagation();
    if(await consume(feature)){replaying=true;action?.click();replaying=false;}
  },true);
  document.addEventListener('keydown',async event=>{
    if(replaying||event.key!=='Enter'||event.target.id!=='entrySearch'||!document.getElementById('entryGds').value||!event.target.value.trim()) return;
    event.preventDefault();event.stopImmediatePropagation();
    if(await consume('entry')){replaying=true;document.getElementById('entryAskBtn').click();replaying=false;}
  },true);
  document.getElementById('passportFile').addEventListener('change',async event=>{
    if(replaying||!event.target.files?.length) return;
    event.preventDefault();event.stopImmediatePropagation();
    if(await consume('passport')){replaying=true;event.target.dispatchEvent(new Event('change',{bubbles:true}));replaying=false;}else event.target.value='';
  },true);

  document.querySelectorAll('[data-open-subscription]').forEach(button=>button.addEventListener('click',()=>openSubscription()));
  document.getElementById('closeSubscriptionDialog').onclick=()=>dialog.close();
  document.getElementById('continueTrialBtn').onclick=()=>dialog.close();
  document.getElementById('logoutBtn').onclick=async()=>{await api('/api/auth/logout',{method:'POST',body:'{}'});account=null;subscription={used:0,limit:10,status:'trial'};window.google?.accounts?.id?.disableAutoSelect();document.getElementById('googleSignInButton').removeAttribute('data-ready');document.getElementById('googleSignInButton').innerHTML='';renderSubscription();renderGoogleButton();};
  document.getElementById('startSubscriptionBtn').onclick=async()=>{
    try{
      if(!account?.authenticated){openSubscription();return;}
      const customer=await api('/api/billing/prepare');
      if(!window.TossPayments) throw new Error('Toss Payments 결제 모듈을 불러오지 못했습니다.');
      const payment=window.TossPayments(config.tossClientKey).payment({customerKey:customer.customerKey});
      await payment.requestBillingAuth({method:'CARD',successUrl:`${location.origin}/api/billing/callback`,failUrl:`${location.origin}/api/billing/fail`,customerEmail:customer.customerEmail,customerName:customer.customerName});
    }catch(error){document.getElementById('billingNotice').innerHTML=`<strong>카드 등록을 시작하지 못했습니다</strong><p>${error.message}</p>`;}
  };
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});

  async function init(){
    try{config=await api('/api/config');await loadAccount();}catch(error){document.getElementById('billingNotice').innerHTML=`<strong>회원 서비스를 확인하지 못했습니다</strong><p>${error.message}</p>`;renderSubscription();}
    const timer=setInterval(()=>{renderGoogleButton();if(window.google?.accounts?.id) clearInterval(timer);},250);
    const query=new URLSearchParams(location.search);
    if(query.get('billing')){
      await loadAccount().catch(()=>{});openSubscription();
      document.getElementById('billingNotice').innerHTML=query.get('billing')==='success'?'<strong>Pro 구독이 시작됐습니다</strong><p>첫 달 9,900원 결제가 완료됐고 자동화 기능을 제한 없이 이용할 수 있습니다.</p>':`<strong>결제를 완료하지 못했습니다</strong><p>${query.get('message')||'다시 시도해주세요.'}</p>`;
      history.replaceState({},'',location.pathname);
    }
  }
  init();
})();
