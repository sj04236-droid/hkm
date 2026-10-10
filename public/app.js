const STORE_KEY = 'atrTravelOpsV1';
const won = n => `${Math.round(Number(n)||0).toLocaleString('ko-KR')}원`;
const todayISO = () => new Date().toISOString().slice(0,10);
const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;

const demo = {
  workspace:{agencyName:'',agentName:'',email:'',phone:'',businessNo:'',address:'',defaultTasf:0,plan:'Pro 체험',defaultGds:''},
  customers:[
    {id:'c1',nameKo:'데모고객A',nameEn:'DEMO/CUSTOMER-A',birth:'',phone:'',email:'',company:'샘플회사A',department:'출장지원팀',title:'담당자',mileage:'DEMO-KE-001',seat:'통로',note:'명백한 가상 데모 데이터'},
    {id:'c2',nameKo:'데모고객B',nameEn:'DEMO/CUSTOMER-B',birth:'',phone:'',email:'',company:'샘플회사B',department:'경영지원팀',title:'담당자',mileage:'DEMO-OZ-002',seat:'창가',note:'명백한 가상 데모 데이터'}
  ],
  passports:{},
  ledger:[
    {id:'l1',date:todayISO(),tradeNo:'TR-20261005-001',item:'KE 싱가포르 항공권',client:'샘플회사A',payment:'카드',vatType:'taxable',sales:1500000,purchase:1280000,fee:25000,otherCost:5000,supply:1363636,vat:136364,memo:'TASF 포함'},
    {id:'l2',date:todayISO(),tradeNo:'TR-20261005-002',item:'호텔 예약 서비스',client:'샘플회사B',payment:'계좌이체',vatType:'taxable',sales:620000,purchase:540000,fee:0,otherCost:0,supply:563636,vat:56364,memo:''},
    {id:'l3',date:new Date(Date.now()-86400000*3).toISOString().slice(0,10),tradeNo:'TR-20261002-004',item:'OZ 일본 왕복 항공권',client:'개인 고객',payment:'현금',vatType:'zero',sales:1091900,purchase:944800,fee:0,otherCost:10000,supply:1091900,vat:0,memo:'발권수수료 별도'}
  ],
  tasks:[
    {id:'t1',date:todayISO(),time:'14:00',type:'TKT TL',client:'샘플회사A',detail:'KE / SIN / 발권 확인',done:false},
    {id:'t2',date:todayISO(),time:'17:00',type:'결제 마감',client:'데모고객A',detail:'OZ / NRT / 카드 승인',done:false},
    {id:'t3',date:new Date(Date.now()+86400000).toISOString().slice(0,10),time:'11:00',type:'여권/APIS',client:'데모고객B',detail:'여권 만료일 확인',done:false}
  ],
  quotes:[], lastAnalysis:null
};

const entryKB = manualEntries;
let state = loadState();
if(!state.workspace) state.workspace=structuredClone(demo.workspace);
if(!state.passportRecords) state.passportRecords=Object.entries(state.passports||{}).map(([id,p])=>({...p,id,party:'기존 등록',legacyCustomerId:id}));
function loadState(){ try{ return {...structuredClone(demo), ...JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}; }catch{return structuredClone(demo);} }
function saveState(){ try{localStorage.setItem(STORE_KEY, JSON.stringify(state));renderAll();return true;}catch(error){toast('저장공간이 부족합니다. 원본 파일 없이 저장해주세요.');return false;} }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),1800); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

const titles={dashboard:'대시보드',entries:'엔트리 도우미',pnr:'PNR·규정 분석',customers:'고객 CRM',passport:'여권·APIS',quotes:'견적서',ledger:'매출·매입 장부',tasks:'마감 일정',workspace:'팀 · 구독 설정'};
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  document.getElementById('pageTitle').textContent=titles[name]||name;
  document.getElementById('sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'instant'});
  if(name==='quotes') renderQuotePreview();
}
document.addEventListener('click',e=>{ const go=e.target.closest('[data-go]'); if(go) showView(go.dataset.go); const nav=e.target.closest('[data-view]'); if(nav) showView(nav.dataset.view); });
document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');

function renderDashboard(){
  const openTasks=state.tasks.filter(t=>!t.done), today=openTasks.filter(t=>t.date===todayISO());
  const passportMissing=state.passportRecords.length;
  document.getElementById('taskMetrics').innerHTML=[['오늘 마감',today.length,'TKT TL · 결제','tasks','일정 확인'],['저장된 견적',state.quotes.length,'고객 안내 내역','quotes','견적 작성'],['여행객 여권',passportMissing,'일행별 등록','passport','여권 업로드'],['고객 CRM',state.customers.length,'등록 고객','customers','고객 찾기']].map(x=>`<div class="metric"><span class="label">${x[0]}</span><strong>${x[1]}<small> 건</small></strong><small>${x[2]}</small><button class="metric-action" data-go="${x[3]}">${x[4]} →</button></div>`).join('');
  const month=todayISO().slice(0,7), rows=state.ledger.filter(x=>x.date.startsWith(month));
  const sales=rows.reduce((a,x)=>a+Number(x.sales||0),0), purchase=rows.reduce((a,x)=>a+Number(x.purchase||0),0), profit=rows.reduce((a,x)=>a+netProfit(x),0);
  document.getElementById('financeSummary').innerHTML=`<div class="finance-box"><span>매출액</span><strong>${won(sales)}</strong></div><div class="finance-box"><span>지출액</span><strong>${won(purchase)}</strong></div><div class="finance-box profit"><span>순수익</span><strong>${won(profit)}</strong></div>`;
  const pTypes=['현금','카드','계좌이체']; document.getElementById('paymentBreakdown').innerHTML=pTypes.map(p=>{const total=rows.filter(x=>x.payment===p).reduce((a,x)=>a+Number(x.sales||0),0);return `<div class="payment-chip"><span>${p} 매출</span><strong>${won(total)}</strong></div>`}).join('');
  renderTaskList('todayTasks',today.slice(0,5));
  document.getElementById('recentLedger').innerHTML=state.ledger.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(x=>`<div class="compact-item"><div><strong>${escapeHtml(x.item)}</strong><small>${x.date} · ${escapeHtml(x.payment)}</small></div><div class="amount">${won(x.sales)}</div></div>`).join('')||'<div class="empty-state">거래가 없습니다.</div>';
  renderLaunchSetup();
}
function renderTaskList(id,rows){ document.getElementById(id).innerHTML=rows.length?rows.map(t=>`<div class="task-row"><div class="task-time">${escapeHtml(t.time||'--:--')}</div><div><strong>${escapeHtml(t.client)}</strong><p>${escapeHtml(t.detail)}</p></div><div class="task-end"><span class="badge ${t.type==='TKT TL'?'warn':''}">${escapeHtml(t.type)}</span><button class="text-button" data-go="${t.type==='여권/APIS'?'passport':'tasks'}">업무 보기 →</button></div></div>`).join(''):'<div class="empty-state">오늘 마감 일정이 없습니다.</div>'; }

function workspaceSteps(){
  const w=state.workspace||{};
  return [
    {label:'여행사와 담당자 정보 등록',done:Boolean(w.agencyName&&w.agentName),view:'workspace'},
    {label:'견적 발신정보 등록',done:Boolean(w.phone&&w.businessNo&&w.address),view:'workspace'},
    {label:'첫 견적 저장',done:state.quotes.length>0,view:'quotes'}
  ];
}
function renderLaunchSetup(){
  const el=document.getElementById('launchSetup'); if(!el)return;
  const steps=workspaceSteps(),done=steps.filter(x=>x.done).length,next=steps.find(x=>!x.done);
  if(done===steps.length){
    el.innerHTML=`<div class="launch-complete"><div><span class="badge ok">업무공간 준비 완료</span><strong>${escapeHtml(state.workspace.agencyName||'내 여행사')}</strong><small>기본 설정이 끝났습니다. 오늘 마감 업무부터 처리하세요.</small></div><button class="text-button" data-go="workspace">팀 · 구독 설정 →</button></div>`;
    return;
  }
  el.innerHTML=`<div class="launch-copy"><p class="eyebrow">첫 사용 가이드</p><strong>업무공간 준비 ${done} / ${steps.length}</strong><small>처음 3가지만 설정하면 견적과 고객 업무를 더 빠르게 시작할 수 있습니다.</small></div><div class="setup-progress" aria-label="업무공간 준비 단계">${steps.map(x=>`<span class="${x.done?'done':''}">${x.done?'✓':'○'} ${escapeHtml(x.label)}</span>`).join('')}</div><button class="button primary" data-go="${next?.view||'workspace'}">다음 설정</button>`;
}

function renderWorkspace(){
  const w=state.workspace||demo.workspace, form=document.getElementById('workspaceForm'); if(!form)return;
  Object.entries(w).forEach(([k,v])=>{if(form.elements[k])form.elements[k].value=v??'';});
  document.getElementById('workspacePillName').textContent=w.agencyName||'내 여행사';
  document.getElementById('workspacePillPlan').textContent=w.plan||'Pro 체험';
  document.getElementById('planName').textContent=w.plan||'Pro 체험';
  const month=todayISO().slice(0,7),monthQuotes=state.quotes.filter(q=>(q.date||'').startsWith(month)).length;
  document.getElementById('workspaceUsage').innerHTML=[['고객',state.customers.length],['이번 달 견적',monthQuotes],['여권 기록',state.passportRecords.length],['미완료 일정',state.tasks.filter(t=>!t.done).length]].map(([label,value])=>`<div><span>${label}</span><strong>${value}</strong></div>`).join('');
  const steps=workspaceSteps(),done=steps.filter(x=>x.done).length;
  document.getElementById('workspaceProgressLabel').textContent=`${done} / ${steps.length}`;
  document.getElementById('workspaceChecklist').innerHTML=steps.map((x,i)=>`<button type="button" class="setup-check ${x.done?'done':''}" data-go="${x.view}"><span>${x.done?'✓':i+1}</span><div><strong>${escapeHtml(x.label)}</strong><small>${x.done?'완료':'설정하기'}</small></div><b>→</b></button>`).join('');
}

function applyWorkspaceDefaults(){
  const w=state.workspace||{}, form=document.getElementById('quoteForm');
  if(form&&!form.dataset.defaultsApplied){
    if(!form.elements.supplier.value) form.elements.supplier.value=w.agencyName||'';
    if(!form.elements.supplierContact.value) form.elements.supplierContact.value=[w.agentName,w.phone].filter(Boolean).join(' / ');
    if(!form.elements.businessNo.value) form.elements.businessNo.value=w.businessNo||'';
    if(!form.elements.supplierAddress.value) form.elements.supplierAddress.value=w.address||'';
    if(Number(form.elements.service.value||0)===0&&Number(w.defaultTasf||0)>0) form.elements.service.value=Number(w.defaultTasf);
    form.dataset.defaultsApplied='1';
  }
  const gds=document.getElementById('entryGds');
  if(gds&&!gds.value&&w.defaultGds) gds.value=w.defaultGds;
}

document.getElementById('workspaceForm').onsubmit=e=>{
  e.preventDefault();
  const form=e.currentTarget,data=Object.fromEntries(new FormData(form).entries());data.defaultTasf=Number(data.defaultTasf||0);
  state.workspace={...state.workspace,...data};
  document.getElementById('quoteForm').dataset.defaultsApplied='';
  if(saveState()){applyWorkspaceDefaults();renderWorkspace();renderQuotePreview();toast('워크스페이스 설정을 저장했습니다.');}
};

function entryCard(x){return `<article class="entry-card"><div class="entry-meta"><span class="badge">${x.gds}</span><span>${escapeHtml((x.source||'검증된 엔트리 DB')+(x.page?' · '+x.page+'쪽':''))}</span></div><h3>${escapeHtml(x.title)}</h3><div class="entry-code"><code>${escapeHtml(x.code)}</code><button data-copy="${escapeHtml(x.code)}">복사</button></div><p>${escapeHtml(x.desc)}</p>${x.guide?`<p class="entry-guide">${escapeHtml(x.guide)}</p>`:''}</article>`;}
function renderEntries(forceAnswer=false){
  const input=document.getElementById('entrySearch'), g=document.getElementById('entryGds').value, q=input.value.trim();
  const answer=document.getElementById('entryAnswer');
  input.disabled=!g; document.getElementById('entryAskBtn').disabled=!g;
  if(!g){
    answer.classList.add('hidden');
    document.getElementById('entryResults').innerHTML='<div class="empty-state">먼저 Sabre / Abacus 또는 Amadeus를 선택하세요.</div>';
    return;
  }
  const candidates=entryKB.filter(x=>x.gds===g); document.getElementById('entryCount').textContent=`${g} 교재 엔트리 ${candidates.length}개 · 질문으로 검색`;
  if(!q){
    answer.classList.add('hidden');
    document.getElementById('entryResults').innerHTML='<div class="empty-state">원하는 업무를 질문해주세요. 예: 과거일자 운임 조회하는 엔트리 알려줘</div>';
    return;
  }
  const ranked=TravelCore.searchEntries(entryKB,g,q);
  const rows=ranked.map(x=>x.entry);
  document.getElementById('entryResults').innerHTML=rows.length?rows.slice(forceAnswer?1:0,forceAnswer?4:6).map(entryCard).join(''):'<div class="empty-state">선택한 GDS 자료에서 질문과 일치하는 검증 엔트리를 찾지 못했습니다. 추측해서 만들지 않고 자료 추가/확인을 기다립니다.</div>';
  if(forceAnswer){
    answer.classList.remove('hidden');
    if(rows.length){
      const best=rows[0];
      answer.innerHTML=`<p class="eyebrow">질문 해석 · ${escapeHtml(g)}</p><h3>${escapeHtml(best.title)}</h3><p>“${escapeHtml(q)}” 질문과 가장 가까운 검증 엔트리입니다.</p><div class="answer-code"><code>${escapeHtml(best.code)}</code><button data-copy="${escapeHtml(best.code)}">복사</button></div><p>${escapeHtml(best.guide||best.desc)}</p><div class="entry-source">출처 구분: ${escapeHtml((best.source||'검증 엔트리 DB')+(best.page?' · '+best.page+'쪽':''))}</div>`;
    }else{
      answer.innerHTML=`<p class="eyebrow">질문 해석 · ${escapeHtml(g)}</p><h3>검증된 엔트리를 찾지 못했습니다.</h3><p>현재 등록된 ${escapeHtml(g)} 자료에 해당 질문과 일치하는 엔트리가 없습니다. 정확도를 위해 임의 엔트리는 생성하지 않습니다.</p>`;
    }
  }
}
document.getElementById('entryGds').addEventListener('change',()=>{document.getElementById('entrySearch').value='';renderEntries(false);if(document.getElementById('entryGds').value)document.getElementById('entrySearch').focus();});
document.getElementById('entrySearch').addEventListener('input',()=>document.getElementById('entryAnswer').classList.add('hidden'));
document.getElementById('entryAskBtn').addEventListener('click',()=>renderEntries(true));
document.getElementById('entrySearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();renderEntries(true);}});
document.getElementById('entryResults').addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){navigator.clipboard?.writeText(b.dataset.copy);toast('엔트리를 복사했습니다.')}});
document.getElementById('entryAnswer').addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){navigator.clipboard?.writeText(b.dataset.copy);toast('엔트리를 복사했습니다.')}});

const pnrSample=`FQQ1\n01 DEMO/PASSENGER*\nLAST TKT DTE 25OCT26 - DATE OF ORIGIN\n------------------------------------------------------------\n     AL FLGT  BK   DATE  TIME  FARE BASIS      NVB  NVA   BG\n SEL\n OSA OZ  1145 C    25OCT 0755  CRT                  25OCT 2P\n SEL KE   726 J    29OCT 1810  JRT                  25OCT 2P\n\nKRW   944800\nKRW    65800-YR\nKRW    57300-XT\nKRW  1091900\nFARE FAMILY:FC2:2:PRFLEX\n\nFQN1-2//PE\nCANCELLATIONS\nANY TIME\nCANCELLATIONS PERMITTED FOR CANCEL/REFUND.\nCHANGES\nANY TIME\nCHANGES PERMITTED FOR REISSUE.`;
document.getElementById('pnrSampleBtn').onclick=()=>{document.getElementById('pnrInput').value=pnrSample;};
function analyzePnr(text){return TravelCore.analyze(text);}
function analysisText(a){return (a.rules||[]).map(r=>r.title+': '+r.summary+'\n'+(r.details||[]).join('\n')+'\n근거: '+r.source).join('\n\n');}
function renderAnalysis(a){
  const flights=(a.flights||[]).map(TravelCore.flightKorean).join('\n');
  const rules=a.rules||TravelCore.summarizeRules(a.raw||'');
  document.getElementById('pnrAnalysis').className='analysis-output';
  document.getElementById('pnrAnalysis').innerHTML=(flights?`<div class="analysis-block"><strong>한글 항공 일정</strong><p>${escapeHtml(flights)}</p></div>`:'')+`<div class="analysis-block"><strong>운임 / 발권기한</strong><p>${a.total?won(a.total):'운임 미제공'}${a.ttl?' · '+escapeHtml(a.ttl):''}${a.family?' · '+escapeHtml(a.family):''}</p></div>`+rules.map(r=>`<div class="analysis-block"><strong>${escapeHtml(r.title)}</strong><p>${escapeHtml(r.summary+'\n'+(r.details||[]).join('\n'))}</p><details><summary>원문 근거 보기</summary><p>${escapeHtml(r.source)}</p></details></div>`).join('')+(!rules.length?'<p>규정 항목을 식별하지 못했습니다. FQN/RD 원문을 추가해주세요.</p>':'');
  document.getElementById('analysisToQuoteBtn').classList.remove('hidden');
}
document.getElementById('analyzePnrBtn').onclick=()=>{const text=document.getElementById('pnrInput').value.trim();if(!text)return toast('PNR/FQQ/FQN 내용을 먼저 넣어주세요.');state.lastAnalysis=analyzePnr(text);saveState();renderAnalysis(state.lastAnalysis);toast('분석을 완료했습니다.');};
document.getElementById('copyAnalysisBtn').onclick=()=>{if(state.lastAnalysis){navigator.clipboard?.writeText(analysisText(state.lastAnalysis));toast('규정 요약을 복사했습니다.');}};
document.getElementById('analysisToQuoteBtn').onclick=()=>{fillQuoteFromAnalysis();showView('quotes');};

function renderCustomers(){
  const q=(document.getElementById('customerSearch').value||'').toLowerCase();
  let rows=state.customers.filter(c=>['nameKo','nameEn','company','phone','email','mileage'].some(k=>String(c[k]||'').toLowerCase().includes(q)));
  const sort=document.getElementById('customerSort').value;
  if(sort==='newest')rows=rows.slice().reverse();else rows=rows.slice().sort((a,b)=>String(a[sort==='name'?'nameKo':'company']||'').localeCompare(String(b[sort==='name'?'nameKo':'company']||''),'ko'));
  document.getElementById('customerCount').textContent=`${rows.length}명 / 전체 ${state.customers.length}명`;
  const list=document.getElementById('customerList');list.className=document.getElementById('customerDisplay').value==='list'?'customer-grid customer-list-mode':'customer-grid';
  list.innerHTML=rows.map(c=>`<article class="customer-card"><div class="customer-top"><div><h3>${escapeHtml(c.nameKo)} <small>${escapeHtml(c.nameEn||'')}</small></h3><p>${escapeHtml(c.company||'개인 고객')} · ${escapeHtml(c.department||'')}</p></div><div><button class="text-button" data-edit-customer="${c.id}">수정</button><button class="delete-btn" data-del-customer="${c.id}">삭제</button></div></div><dl class="detail-list"><dt>연락처</dt><dd>${escapeHtml(c.phone||'-')}</dd><dt>이메일</dt><dd>${escapeHtml(c.email||'-')}</dd><dt>마일리지</dt><dd>${escapeHtml(c.mileage||'-')}</dd><dt>선호 좌석</dt><dd>${escapeHtml(c.seat||'-')}</dd></dl></article>`).join('')||'<div class="empty-state">검색된 고객이 없습니다.</div>';
  const selector=document.getElementById('passportCustomer'),previous=selector.value;
  selector.innerHTML='<option value="">선택 없이 새 여행객 등록</option>'+state.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.nameKo)} · ${escapeHtml(c.company||'개인')}</option>`).join('');selector.value=previous;
}
['customerSearch','customerSort','customerDisplay'].forEach(id=>document.getElementById(id).addEventListener(id==='customerSearch'?'input':'change',renderCustomers));
document.getElementById('toggleCustomerForm').onclick=()=>{document.getElementById('customerForm').reset();delete document.getElementById('customerForm').dataset.editId;document.getElementById('customerFormCard').classList.toggle('hidden');};
document.getElementById('cancelCustomerBtn').onclick=()=>document.getElementById('customerFormCard').classList.add('hidden');
document.getElementById('customerForm').onsubmit=e=>{e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form).entries());if(form.dataset.editId){const c=state.customers.find(x=>x.id===form.dataset.editId);Object.assign(c,data);}else state.customers.push({id:uid('c'),...data});form.reset();delete form.dataset.editId;document.getElementById('customerFormCard').classList.add('hidden');saveState();toast('고객정보를 저장했습니다.');};
document.getElementById('customerList').onclick=e=>{const edit=e.target.closest('[data-edit-customer]');if(edit){const c=state.customers.find(x=>x.id===edit.dataset.editCustomer),f=document.getElementById('customerForm');f.dataset.editId=c.id;Object.entries(c).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});document.getElementById('customerFormCard').classList.remove('hidden');return;}const id=e.target.closest('[data-del-customer]')?.dataset.delCustomer;if(id&&confirm('이 CRM 고객을 삭제할까요? 별도 여권 기록은 유지됩니다.')){state.customers=state.customers.filter(x=>x.id!==id);saveState();}};
function renderPassports(){
  document.getElementById('passportList').innerHTML=state.passportRecords.length?state.passportRecords.map(p=>`<div class="compact-item"><div><strong>${escapeHtml(p.surname)} ${escapeHtml(p.givenName)}</strong><small>${escapeHtml(p.party||'개별 여행객')} · ${escapeHtml(p.passportNo||'-')} · 만료 ${escapeHtml(p.expiry||'-')}</small></div><div><button class="text-button" data-edit-passport="${p.id}">보기 / 수정</button><button class="delete-btn" data-del-passport="${p.id}">삭제</button></div></div>`).join(''):'<div class="empty-state">여권을 업로드하거나 직접 입력해 일행을 등록하세요.</div>';
}
document.getElementById('passportCustomer').addEventListener('change',e=>{const c=state.customers.find(x=>x.id===e.target.value);if(!c)return;const parts=(c.nameEn||'').split('/');fillPassportFields({surname:parts[0]||'',givenName:parts[1]||'',birth:c.birth||''});});
document.getElementById('passportList').onclick=e=>{const edit=e.target.closest('[data-edit-passport]');if(edit){const p=state.passportRecords.find(x=>x.id===edit.dataset.editPassport),f=document.getElementById('passportForm');f.reset();f.dataset.editId=p.id;Object.entries(p).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v;});return;}const id=e.target.closest('[data-del-passport]')?.dataset.delPassport;if(id&&confirm('이 여권 기록을 삭제할까요?')){state.passportRecords=state.passportRecords.filter(p=>p.id!==id);saveState();}};
function setPassportOcrStatus(message,type=''){
  const el=document.getElementById('passportOcrStatus');
  el.textContent=message; el.className=`passport-ocr-status ${type}`.trim();
}
function cleanMrzLine(value=''){
  return value.toUpperCase().replace(/[«‹]/g,'<').replace(/\s/g,'').replace(/[^A-Z0-9<]/g,'');
}
function mrzDateToIso(value,type){
  if(!/^\d{6}$/.test(value)) return '';
  const yy=Number(value.slice(0,2)), mm=value.slice(2,4), dd=value.slice(4,6), nowYY=new Date().getFullYear()%100;
  const year=type==='expiry'?2000+yy:(yy>nowYY?1900+yy:2000+yy);
  const iso=`${year}-${mm}-${dd}`, date=new Date(Date.UTC(year,Number(mm)-1,Number(dd)));
  return Number.isNaN(date.getTime())||date.getUTCMonth()+1!==Number(mm)||date.getUTCDate()!==Number(dd)?'':iso;
}
function parsePassportMrz(text=''){
  const lines=text.split(/\r?\n/).map(cleanMrzLine).filter(x=>x.length>=25);
  let firstIndex=lines.findIndex(x=>x.includes('P<'));
  if(firstIndex<0){
    const flat=cleanMrzLine(text), start=flat.indexOf('P<');
    if(start>=0&&flat.length-start>=80){ lines.push(flat.slice(start,start+44),flat.slice(start+44,start+88)); firstIndex=lines.length-2; }
  }
  if(firstIndex<0) return null;
  let line1=lines[firstIndex], p=line1.indexOf('P<'); if(p>0) line1=line1.slice(p);
  const line2=lines.slice(firstIndex+1).find(x=>x.length>=35&&!x.startsWith('P<'))||'';
  if(line1.length<30||line2.length<27) return null;
  const names=line1.slice(5).split('<<'), validNameLine=line1.length===44&&names.length>=2;
  const surname=validNameLine?(names.shift()||'').replace(/</g,' ').trim():'', givenName=validNameLine?names.join(' ').replace(/</g,' ').replace(/\s+/g,' ').trim():'';
  const passportNo=line2.slice(0,9).replace(/</g,''), nationality=line2.slice(10,13).replace(/</g,'').replace(/0/g,'O'), birthRaw=line2.slice(13,19).replace(/O/g,'0'), gender=line2.slice(20,21), expiryRaw=line2.slice(21,27).replace(/O/g,'0');
  return {surname,givenName,passportNo,nationality,birth:mrzDateToIso(birthRaw,'birth'),gender:/^[MF]$/.test(gender)?gender:'',expiry:mrzDateToIso(expiryRaw,'expiry'),issueCountry:line1.slice(2,5).replace(/</g,'')};
}
function fillPassportFields(data){
  const form=document.getElementById('passportForm');
  ['surname','givenName','passportNo','nationality','birth','gender','expiry','issueCountry'].forEach(key=>{ if(data[key]&&form.elements[key]) form.elements[key].value=data[key]; });
}
function imageToCanvas(source){
  const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d'), width=source.width||source.naturalWidth, height=source.height||source.naturalHeight;
  canvas.width=Math.max(1,width);canvas.height=Math.max(1,height);ctx.drawImage(source,0,0,width,height,0,0,width,height);return canvas;
}
function cropMrzArea(source){
  const canvas=document.createElement('canvas'), ctx=canvas.getContext('2d'), width=source.width||source.naturalWidth, height=source.height||source.naturalHeight;
  const top=Math.floor(height*.58), cropHeight=Math.max(1,height-top); canvas.width=Math.max(1,width); canvas.height=cropHeight;
  ctx.drawImage(source,0,top,width,cropHeight,0,0,width,cropHeight); return canvas;
}
function loadImageFromFile(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('이미지를 열 수 없습니다.'))};img.src=url;});}
async function passportFileToSources(file){
  if(file.type==='application/pdf'||file.name.toLowerCase().endsWith('.pdf')){
    if(!window.pdfjsLib) throw new Error('PDF 읽기 모듈을 불러오지 못했습니다.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const pdf=await window.pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise, page=await pdf.getPage(1), viewport=page.getViewport({scale:2});
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise; return [cropMrzArea(canvas),canvas];
  }
  const image=await loadImageFromFile(file), full=imageToCanvas(image); return [cropMrzArea(full),full];
}
let passportReadGeneration=0;
async function autoReadPassport(file){
  const generation=++passportReadGeneration;
  if(!file) return;
  if(file.size>10*1024*1024){setPassportOcrStatus('자동 인식은 10MB 이하 파일을 사용해주세요.','error');return;}
  if(!window.Tesseract){setPassportOcrStatus('OCR 모듈을 불러오지 못했습니다. 네트워크 연결을 확인해주세요.','error');return;}
  let worker;
  try{
    document.querySelector('#passportForm button[type="submit"], #passportForm .form-actions button').disabled=true;
    setPassportOcrStatus('여권 하단 MRZ를 읽는 중입니다…','working');
    const sources=await passportFileToSources(file); let parsed=null;
    worker=await window.Tesseract.createWorker('eng',1,{logger:m=>{if(m.status==='recognizing text'&&generation===passportReadGeneration)setPassportOcrStatus(`MRZ 인식 중… ${Math.round((m.progress||0)*100)}%`,'working');}},{load_system_dawg:'0',load_freq_dawg:'0'});
    await worker.setParameters({tessedit_char_whitelist:'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',tessedit_pageseg_mode:'6',preserve_interword_spaces:'0'});
    for(let i=0;i<sources.length&&!parsed;i++){
      const result=await worker.recognize(sources[i]);
      if(generation!==passportReadGeneration)return;
      parsed=parsePassportMrz(result?.data?.text||'');
    }
    if(!parsed) throw new Error('MRZ 2줄을 정확히 찾지 못했습니다. 여권 하단이 선명하게 보이는 파일을 사용해주세요.');
    fillPassportFields(parsed);
    const partial=!parsed.surname||!parsed.givenName||!parsed.birth||!parsed.expiry;
    setPassportOcrStatus(partial?'일부 항목을 읽었습니다. 이름·날짜 등 빈 항목은 원본을 보며 직접 입력해주세요.':'자동 입력 완료. 모든 항목을 원본 여권과 대조해주세요.',partial?'working':'success');
    toast(partial?'인식된 항목만 입력했습니다. 빈 항목을 확인해주세요.':'여권 정보를 자동 입력했습니다.');
  }catch(error){if(generation===passportReadGeneration)setPassportOcrStatus(error?.message||'여권 자동 인식에 실패했습니다.','error');}
  finally{if(worker)await worker.terminate();if(generation===passportReadGeneration)document.querySelector('#passportForm .form-actions button').disabled=false;}
}
document.getElementById('passportFile').addEventListener('change',e=>{delete document.getElementById('passportForm').dataset.editId;['surname','givenName','passportNo','birth','expiry','gender'].forEach(k=>document.getElementById('passportForm').elements[k].value='');autoReadPassport(e.target.files[0]);});
document.getElementById('passportForm').onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget,data=Object.fromEntries(new FormData(form).entries());
  const id=form.dataset.editId||uid('p'),record={...state.passportRecords.find(p=>p.id===id),...data,id};
  const file=document.getElementById('passportFile').files[0];if(file){record.fileName=file.name;record.fileType=file.type;} // Store fields, not large passport binaries.
  const index=state.passportRecords.findIndex(p=>p.id===id);if(index>=0)state.passportRecords[index]=record;else state.passportRecords.push(record);
  if(saveState()){const party=form.elements.party.value;form.reset();form.elements.party.value=party;delete form.dataset.editId;setPassportOcrStatus('저장 완료. 다음 일행 여권을 업로드하세요.','success');toast('여행객 여권정보를 저장했습니다.');}
};

function fillQuoteFromAnalysis(){const a=state.lastAnalysis;if(!a)return;const f=document.getElementById('quoteForm');f.elements.itinerary.value=(a.flights||[]).map(TravelCore.flightKorean).join('\n');f.elements.fare.value=a.total||0;f.elements.rules.value=analysisText(a);document.getElementById('quotePnr').value=a.raw||'';renderQuotePreview();}
function quoteData(){const f=document.getElementById('quoteForm'),fare=Number(f.elements.fare.value||0),service=Number(f.elements.service.value||0),other=Number(f.elements.other.value||0),quantity=Math.max(1,Number(f.elements.quantity.value||1));return {id:uid('q'),date:todayISO(),customerName:document.getElementById('quoteCustomer').value,title:f.elements.title.value,passengers:f.elements.passengers.value,itinerary:f.elements.itinerary.value,flights:TravelCore.parseFlights(document.getElementById('quotePnr').value),fare,service,other,quantity,total:(fare+service)*quantity+other,rules:f.elements.rules.value,payment:f.elements.payment.value,paymentInfo:f.elements.paymentInfo.value,supplier:f.elements.supplier.value,supplierContact:f.elements.supplierContact.value,businessNo:f.elements.businessNo.value,supplierAddress:f.elements.supplierAddress.value};}
function renderQuotePreview(){const q=quoteData(),e=escapeHtml;document.getElementById('quotePreview').innerHTML=`<div class="quote-sheet"><p class="eyebrow">항공권 견적 / INVOICE</p><h2>${e(q.title)}</h2><div class="invoice-meta"><div><p>수신: ${e(q.customerName||'직접 입력')}</p><p>탑승객: ${e(q.passengers||'-')}</p><p>작성일: ${q.date}</p></div><div><p>상호: ${e(q.supplier||'-')}</p><p>발신 / 연락처: ${e(q.supplierContact||'-')}</p><p>사업자등록번호: ${e(q.businessNo||'-')}</p><p>주소: ${e(q.supplierAddress||'-')}</p></div></div><h3>항공 일정</h3>${q.flights.length?`<div class="table-scroll"><table><thead><tr><th>편명</th><th>여정</th><th>탑승일</th><th>출발</th><th>도착</th><th>클래스</th></tr></thead><tbody>${q.flights.map(f=>`<tr><td>${e((TravelCore.airlines[f.airline]||f.airline)+' '+f.airline+f.flight)}</td><td>${e((TravelCore.airports[f.from]||f.from)+' → '+(TravelCore.airports[f.to]||f.to))}</td><td>${e(TravelCore.koreanDate(f.date))}</td><td>${e(TravelCore.time(f.time))}</td><td>${e(TravelCore.time(f.arrival))}${e(f.arrivalOffset||'')}</td><td>${e(f.cls)}</td></tr>`).join('')}</tbody></table></div>`:''}<div class="quote-rules">${e(q.itinerary||'PNR을 넣거나 일정을 직접 입력해주세요.')}</div><table><thead><tr><th>상세내역</th><th class="num">단가</th><th class="num">인원</th><th class="num">합계</th></tr></thead><tbody><tr><td>항공료 (세금 포함)</td><td class="num">${won(q.fare)}</td><td class="num">${q.quantity}</td><td class="num">${won(q.fare*q.quantity)}</td></tr><tr><td>TASF (수수료)</td><td class="num">${won(q.service)}</td><td class="num">${q.quantity}</td><td class="num">${won(q.service*q.quantity)}</td></tr>${q.other?`<tr><td>부대비용</td><td colspan="2"></td><td class="num">${won(q.other)}</td></tr>`:''}</tbody></table><div class="quote-total"><span>TOTAL AMOUNT</span><span>${won(q.total)}</span></div><h3>변경·환불 및 안내 규정</h3><div class="quote-rules">${e(q.rules||'규정을 입력해주세요.')}</div><p class="helper-text">결제 방법: ${e(q.payment)} · ${e(q.paymentInfo)}</p><p class="helper-text">좌석·운임은 발권 시점에 확인합니다.</p></div>`;}
function quotePnrToKorean(){const raw=document.getElementById('quotePnr').value,flights=TravelCore.parseFlights(raw);if(!flights.length){toast('항공 구간을 읽지 못했습니다. 여정을 직접 입력해주세요.');return;}document.getElementById('quoteForm').elements.itinerary.value=flights.map(TravelCore.flightKorean).join('\n');renderQuotePreview();}
document.getElementById('quotePnrBtn').onclick=quotePnrToKorean;
document.getElementById('quotePnr').addEventListener('input',()=>{if(TravelCore.parseFlights(document.getElementById('quotePnr').value).length)quotePnrToKorean();});
document.getElementById('quoteForm').addEventListener('input',renderQuotePreview);document.getElementById('quoteForm').addEventListener('change',renderQuotePreview);
document.getElementById('saveQuoteBtn').onclick=()=>{state.quotes.unshift(quoteData());saveState();toast('견적서를 저장했습니다.');};document.getElementById('printQuoteBtn').onclick=()=>{renderQuotePreview();window.print();};

function netProfit(x){return TravelCore.netProfit(x);}
function renderLedger(){
  const rows=state.ledger.slice().sort((a,b)=>b.date.localeCompare(a.date));const sales=rows.reduce((a,x)=>a+Number(x.sales||0),0),purchase=rows.reduce((a,x)=>a+Number(x.purchase||0),0),vat=rows.reduce((a,x)=>a+Number(x.vat||0),0),profit=rows.reduce((a,x)=>a+netProfit(x),0);
  document.getElementById('ledgerSummary').innerHTML=[['총 매출액',sales],['총 지출액',purchase],['부가세액',vat],['순수익',profit]].map(([l,v])=>`<div class="summary-card"><span>${l}</span><strong>${won(v)}</strong></div>`).join('');
  document.getElementById('ledgerBody').innerHTML=rows.map(x=>`<tr><td>${x.date}</td><td>${escapeHtml(x.tradeNo)}</td><td>${escapeHtml(x.item)}</td><td><span class="badge">${escapeHtml(x.payment)}</span></td><td class="num">${won(x.sales)}</td><td class="num">${won(x.purchase)}</td><td>${escapeHtml(x.expenseItem||x.item||'-')}</td><td>${escapeHtml(x.evidence||'미등록')}</td><td class="num">${won(x.supply)}</td><td class="num">${won(x.vat)}</td><td class="num"><strong>${won(netProfit(x))}</strong></td><td><button class="delete-btn" data-del-ledger="${x.id}">삭제</button></td></tr>`).join('')||'<tr><td colspan="12">거래가 없습니다.</td></tr>';
}
document.getElementById('toggleLedgerForm').onclick=()=>{document.getElementById('ledgerFormCard').classList.toggle('hidden');document.querySelector('#ledgerForm [name=date]').value=todayISO();updateLedgerCalc();};document.getElementById('cancelLedgerBtn').onclick=()=>document.getElementById('ledgerFormCard').classList.add('hidden');
function updateLedgerCalc(){const f=document.getElementById('ledgerForm'),sales=Number(f.elements.sales.value||0),purchase=Number(f.elements.purchase.value||0),type=f.elements.vatType.value;if(type==='taxable'){f.elements.supply.value=Math.round(sales/1.1);f.elements.vat.value=sales-Math.round(sales/1.1)}else if(type==='zero'){f.elements.supply.value=sales;f.elements.vat.value=0}document.getElementById('ledgerCalc').textContent=`예상 순수익 ${won(sales-purchase)}`;}
document.getElementById('ledgerForm').addEventListener('input',updateLedgerCalc);document.getElementById('ledgerForm').addEventListener('change',updateLedgerCalc);
document.getElementById('ledgerForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f).entries());['sales','purchase','supply','vat'].forEach(k=>d[k]=Number(d[k]||0));d.id=uid('l');d.tradeNo=d.tradeNo||`TR-${d.date.replaceAll('-','')}-${String(state.ledger.length+1).padStart(3,'0')}`;state.ledger.unshift(d);f.reset();document.getElementById('ledgerFormCard').classList.add('hidden');saveState();toast('거래를 저장했습니다.');};
document.getElementById('ledgerBody').onclick=e=>{const id=e.target.closest('[data-del-ledger]')?.dataset.delLedger;if(id){state.ledger=state.ledger.filter(x=>x.id!==id);saveState();toast('거래를 삭제했습니다.');}};

function renderTasks(){const rows=state.tasks.slice().sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));document.getElementById('allTasks').innerHTML=rows.map(t=>`<div class="task-row"><div class="task-date">${t.date.slice(5)}</div><div class="task-time">${escapeHtml(t.time||'--:--')}</div><div><strong>${escapeHtml(t.client)} · ${escapeHtml(t.type)}</strong><p>${escapeHtml(t.detail)}</p></div><button class="delete-btn" data-del-task="${t.id}">삭제</button></div>`).join('')||'<div class="empty-state">등록된 일정이 없습니다.</div>';}
document.getElementById('toggleTaskForm').onclick=()=>{document.getElementById('taskFormCard').classList.toggle('hidden');document.querySelector('#taskForm [name=date]').value=todayISO();};document.getElementById('taskForm').onsubmit=e=>{e.preventDefault();state.tasks.push({id:uid('t'),...Object.fromEntries(new FormData(e.currentTarget).entries()),done:false});e.currentTarget.reset();document.getElementById('taskFormCard').classList.add('hidden');saveState();toast('마감 일정을 추가했습니다.');};document.getElementById('allTasks').onclick=e=>{const id=e.target.closest('[data-del-task]')?.dataset.delTask;if(id){state.tasks=state.tasks.filter(x=>x.id!==id);saveState();}};

function renderAll(){applyWorkspaceDefaults();renderDashboard();renderEntries();renderCustomers();renderPassports();renderLedger();renderTasks();renderWorkspace();renderQuotePreview();if(state.lastAnalysis)renderAnalysis(state.lastAnalysis);}
document.getElementById('resetDemoBtn').onclick=()=>{if(confirm('현재 브라우저에 저장한 데이터를 데모 상태로 초기화할까요?')){state=structuredClone(demo);state.passportRecords=[];localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll();toast('데모 데이터로 초기화했습니다.');}};
document.getElementById('todayLabel').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
renderAll();
