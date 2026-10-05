const STORE_KEY = 'atrTravelOpsV1';
const won = n => `${Math.round(Number(n)||0).toLocaleString('ko-KR')}원`;
const todayISO = () => new Date().toISOString().slice(0,10);
const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;

const demo = {
  customers:[
    {id:'c1',nameKo:'데모고객A',nameEn:'DEMO/CUSTOMER-A',birth:'',phone:'',email:'',company:'샘플회사A',department:'출장지원팀',title:'담당자',mileage:'DEMO-KE-001',seat:'통로',note:'명백한 가상 데모 데이터'},
    {id:'c2',nameKo:'데모고객B',nameEn:'DEMO/CUSTOMER-B',birth:'',phone:'',email:'',company:'샘플회사B',department:'경영지원팀',title:'담당자',mileage:'DEMO-OZ-002',seat:'창가',note:'명백한 가상 데모 데이터'}
  ],
  passports:{},
  ledger:[
    {id:'l1',date:todayISO(),tradeNo:'TR-20261005-001',item:'KE 싱가포르 항공권',client:'샘플회사A',payment:'카드',vatType:'taxable',sales:1500000,purchase:1280000,fee:25000,otherCost:5000,supply:1363636,vat:136364,memo:'서비스피 포함'},
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

const entryKB = [
  {gds:'Sabre/Abacus',title:'기본 항공사 지정 공시운임 조회',code:'FQSELBJS-OZ',desc:'서울-베이징, 아시아나 지정 운임 조회 예시',tags:'공시운임 운임조회 FQ'},
  {gds:'Sabre/Abacus',title:'출발일 지정 공시운임 조회',code:'FQSELBJS01DEC-OZ',desc:'출발일을 함께 지정하는 운임 조회',tags:'날짜 운임조회'},
  {gds:'Sabre/Abacus',title:'과거일자 운임 조회',code:'FQ10DEC20SELSIN30DEC10-OZ',desc:'과거 발권/여행일자 조건을 포함한 운임 조회 예시',tags:'과거일자 운임'},
  {gds:'Sabre/Abacus',title:'부킹클래스 지정 운임 조회',code:'FQSELSIN20SEP¥BM-OZ',desc:'M 클래스 조건 운임 조회 예시',tags:'부킹클래스 M'},
  {gds:'Sabre/Abacus',title:'Availability 후 구간운임 조회',code:'FQL1',desc:'조회한 1번 라인 기준 구간 운임',tags:'어밸리티 구간운임'},
  {gds:'Sabre/Abacus',title:'PNR 후 구간운임 조회',code:'FQS1',desc:'PNR 1번 구간 기준 운임 조회',tags:'PNR 구간운임'},
  {gds:'Sabre/Abacus',title:'최종 운임 화면 재조회',code:'FQ*',desc:'직전 FQ 결과 재조회',tags:'재조회'},
  {gds:'Sabre/Abacus',title:'운임 규정 전체 조회',code:'RD3',desc:'선택된 3번 운임의 규정 전체 조회',tags:'규정 룰'},
  {gds:'Sabre/Abacus',title:'운임 규정 메뉴 조회',code:'RD3*M',desc:'3번 운임 규정의 메뉴 화면',tags:'규정 메뉴'},
  {gds:'Sabre/Abacus',title:'PNR 최저운임 계산',code:'WPNCS',desc:'PNR 최저 운임 계산 관련 저장 엔트리',tags:'최저운임 프라이싱'},
  {gds:'Sabre/Abacus',title:'PNR 운임 계산',code:'WPNC',desc:'PNR 운임 계산 관련 저장 엔트리',tags:'프라이싱'},
  {gds:'Amadeus',title:'Fare Quote 상세 보기',code:'FQQ1',desc:'1번 Fare Quote의 상세 운임, Tax, Fare Basis 확인',tags:'FQQ 운임 상세'},
  {gds:'Amadeus',title:'Fare Note 목록',code:'FQN1',desc:'1번 운임의 Fare Component/규정 항목 확인',tags:'FQN 규정'},
  {gds:'Amadeus',title:'Penalty 규정',code:'FQN1-1//PE',desc:'1번 운임, 1번 Fare Component의 변경·환불 Penalty 확인',tags:'PE 환불 변경 penalty'},
  {gds:'Amadeus',title:'Sales Restriction',code:'FQN1-1//SR',desc:'판매/발권 제한 규정 확인',tags:'SR 발권 제한'},
  {gds:'Amadeus',title:'Flight Restriction',code:'FQN1-1//FL',desc:'적용 항공편/운항 제한 확인',tags:'FL flight 제한'},
  {gds:'Amadeus',title:'Combinability',code:'FQN1-1//CO',desc:'운임 결합 규정 확인',tags:'CO combinability'}
];

let state = loadState();
function loadState(){ try{ return {...structuredClone(demo), ...JSON.parse(localStorage.getItem(STORE_KEY)||'{}')}; }catch{return structuredClone(demo);} }
function saveState(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); renderAll(); }
function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove('show'),1800); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

const titles={dashboard:'대시보드',entries:'엔트리 도우미',pnr:'PNR·규정 분석',customers:'고객 CRM',passport:'여권·APIS',quotes:'견적서',ledger:'매출·매입 장부',tasks:'마감 일정'};
function showView(name){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));
  document.querySelectorAll('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
  document.getElementById('pageTitle').textContent=titles[name]||name;
  document.getElementById('sidebar').classList.remove('open'); window.scrollTo({top:0,behavior:'smooth'});
  if(name==='quotes') renderQuotePreview();
}
document.addEventListener('click',e=>{ const go=e.target.closest('[data-go]'); if(go) showView(go.dataset.go); const nav=e.target.closest('[data-view]'); if(nav) showView(nav.dataset.view); });
document.getElementById('menuBtn').onclick=()=>document.getElementById('sidebar').classList.toggle('open');

function renderDashboard(){
  const openTasks=state.tasks.filter(t=>!t.done), today=openTasks.filter(t=>t.date===todayISO());
  const passportMissing=state.customers.filter(c=>!state.passports[c.id]).length;
  document.getElementById('taskMetrics').innerHTML=[['오늘 마감',today.length,'TKT TL · 결제'],['견적 대기',state.quotes.length,'저장된 견적'],['여권 미등록',passportMissing,'고객 APIS 확인'],['고객 CRM',state.customers.length,'등록 고객']].map(x=>`<div class="metric"><span class="label">${x[0]}</span><strong>${x[1]}건</strong><small>${x[2]}</small></div>`).join('');
  const month=todayISO().slice(0,7), rows=state.ledger.filter(x=>x.date.startsWith(month));
  const sales=rows.reduce((a,x)=>a+Number(x.sales||0),0), purchase=rows.reduce((a,x)=>a+Number(x.purchase||0),0), profit=rows.reduce((a,x)=>a+netProfit(x),0);
  document.getElementById('financeSummary').innerHTML=`<div class="finance-box"><span>매출액</span><strong>${won(sales)}</strong></div><div class="finance-box"><span>매입액</span><strong>${won(purchase)}</strong></div><div class="finance-box profit"><span>순수익</span><strong>${won(profit)}</strong></div>`;
  const pTypes=['현금','카드','계좌이체']; document.getElementById('paymentBreakdown').innerHTML=pTypes.map(p=>{const total=rows.filter(x=>x.payment===p).reduce((a,x)=>a+Number(x.sales||0),0);return `<div class="payment-chip"><span>${p} 매출</span><strong>${won(total)}</strong></div>`}).join('');
  renderTaskList('todayTasks',today.slice(0,5));
  document.getElementById('recentLedger').innerHTML=state.ledger.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(x=>`<div class="compact-item"><div><strong>${escapeHtml(x.item)}</strong><small>${x.date} · ${escapeHtml(x.payment)}</small></div><div class="amount">${won(x.sales)}</div></div>`).join('')||'<div class="empty-state">거래가 없습니다.</div>';
}
function renderTaskList(id,rows){ document.getElementById(id).innerHTML=rows.length?rows.map(t=>`<div class="task-row"><div class="task-time">${escapeHtml(t.time||'--:--')}</div><div><strong>${escapeHtml(t.client)}</strong><p>${escapeHtml(t.detail)}</p></div><span class="badge ${t.type==='TKT TL'?'warn':''}">${escapeHtml(t.type)}</span></div>`).join(''):'<div class="empty-state">오늘 마감 일정이 없습니다.</div>'; }

function renderEntries(){
  const q=(document.getElementById('entrySearch').value||'').toLowerCase(), g=document.getElementById('entryGds').value;
  const rows=entryKB.filter(x=>(g==='all'||x.gds===g)&&`${x.title} ${x.code} ${x.desc} ${x.tags}`.toLowerCase().includes(q));
  document.getElementById('entryResults').innerHTML=rows.map(x=>`<article class="entry-card"><div class="entry-meta"><span class="badge">${x.gds}</span><span>저장된 지식</span></div><h3>${escapeHtml(x.title)}</h3><div class="entry-code"><code>${escapeHtml(x.code)}</code><button data-copy="${escapeHtml(x.code)}">복사</button></div><p>${escapeHtml(x.desc)}</p></article>`).join('')||'<div class="empty-state">일치하는 엔트리가 없습니다.</div>';
}
document.getElementById('entrySearch').addEventListener('input',renderEntries); document.getElementById('entryGds').addEventListener('change',renderEntries);
document.getElementById('entryResults').addEventListener('click',e=>{const b=e.target.closest('[data-copy]');if(b){navigator.clipboard?.writeText(b.dataset.copy);toast('엔트리를 복사했습니다.')}});

const pnrSample=`FQQ1\n01 DEMO/PASSENGER*\nLAST TKT DTE 25OCT26 - DATE OF ORIGIN\n------------------------------------------------------------\n     AL FLGT  BK   DATE  TIME  FARE BASIS      NVB  NVA   BG\n SEL\n OSA OZ  1145 C    25OCT 0755  CRT                  25OCT 2P\n SEL KE   726 J    29OCT 1810  JRT                  25OCT 2P\n\nKRW   944800\nKRW    65800-YR\nKRW    57300-XT\nKRW  1091900\nFARE FAMILY:FC2:2:PRFLEX\n\nFQN1-2//PE\nCANCELLATIONS\nANY TIME\nCANCELLATIONS PERMITTED FOR CANCEL/REFUND.\nCHANGES\nANY TIME\nCHANGES PERMITTED FOR REISSUE.`;
document.getElementById('pnrSampleBtn').onclick=()=>{document.getElementById('pnrInput').value=pnrSample;};
function analyzePnr(text){
  const lines=text.split(/\r?\n/), flights=[];
  for(const line of lines){ const m=line.match(/^\s*(?:[A-Z]{3}\s+)?([A-Z0-9]{2})\s+(\d{2,4})\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+(\d{4})\s+([A-Z0-9]+).*?(\dP|\dPC)?\s*$/i); if(m) flights.push({airline:m[1],flight:m[2],cls:m[3],date:m[4],time:m[5],fareBasis:m[6],bag:m[7]||''}); }
  const totalMatches=[...text.matchAll(/KRW\s+([\d,]+)\s*$/gmi)].map(m=>Number(m[1].replace(/,/g,''))); const total=totalMatches.length?Math.max(...totalMatches):0;
  const ttl=(text.match(/LAST TKT DTE\s+([^\n-]+)/i)||[])[1]?.trim()||'';
  const family=(text.match(/FARE FAMILY(?::[^\n]*)?:\s*([A-Z0-9_-]+)/i)||text.match(/FARE FAMILY\s*:\s*([A-Z0-9_-]+)/i)||[])[1]||'';
  const cancel=/CANCELLATIONS PERMITTED/i.test(text)?'환불 가능':(/CANCELLATIONS NOT PERMITTED/i.test(text)?'환불 불가':'규정 확인 필요');
  const change=/CHANGES PERMITTED/i.test(text)?'변경 가능':(/CHANGES NOT PERMITTED/i.test(text)?'변경 불가':'규정 확인 필요');
  return {flights,total,ttl,family,cancel,change,raw:text};
}
function renderAnalysis(a){
  const flightText=a.flights.length?a.flights.map(f=>`${f.airline}${f.flight} · ${f.date} ${f.time} · ${f.cls} Class · ${f.fareBasis}${f.bag?` · ${f.bag}`:''}`).join('\n'):'항공편 자동 추출 결과 없음';
  document.getElementById('pnrAnalysis').className='analysis-output'; document.getElementById('pnrAnalysis').innerHTML=`<div class="analysis-block"><strong>항공 일정</strong><p>${escapeHtml(flightText)}</p></div><div class="analysis-block"><strong>운임</strong><p>총액 ${a.total?won(a.total):'확인 필요'}${a.family?`\nFare Family: ${escapeHtml(a.family)}`:''}${a.ttl?`\n발권기한: ${escapeHtml(a.ttl)}`:''}</p></div><div class="analysis-block"><strong>변경 / 환불</strong><p>${a.change} · ${a.cancel}\n※ 실제 발권 전 전체 Fare Rule 재확인 권장</p></div>`;
  document.getElementById('analysisToQuoteBtn').classList.remove('hidden');
}
document.getElementById('analyzePnrBtn').onclick=()=>{const text=document.getElementById('pnrInput').value.trim();if(!text)return toast('PNR/FQQ/FQN 내용을 먼저 넣어주세요.');state.lastAnalysis=analyzePnr(text);saveState();renderAnalysis(state.lastAnalysis);toast('분석을 완료했습니다.');};
document.getElementById('copyAnalysisBtn').onclick=()=>{const a=state.lastAnalysis;if(!a)return;const txt=`총액: ${won(a.total)}\nFare Family: ${a.family||'-'}\n발권기한: ${a.ttl||'-'}\n변경: ${a.change}\n환불: ${a.cancel}`;navigator.clipboard?.writeText(txt);toast('분석 결과를 복사했습니다.');};
document.getElementById('analysisToQuoteBtn').onclick=()=>{fillQuoteFromAnalysis();showView('quotes');};

function renderCustomers(){
  document.getElementById('customerList').innerHTML=state.customers.map(c=>`<article class="customer-card"><div class="customer-top"><div style="display:flex;gap:11px"><div class="avatar">${escapeHtml(c.nameKo.slice(0,1))}</div><div><h3>${escapeHtml(c.nameKo)} <small>${escapeHtml(c.nameEn||'')}</small></h3><p>${escapeHtml(c.company||'개인 고객')} ${c.title?`· ${escapeHtml(c.title)}`:''}</p></div></div><button class="delete-btn" data-del-customer="${c.id}">삭제</button></div><dl class="detail-list"><dt>연락처</dt><dd>${escapeHtml(c.phone||'-')}</dd><dt>이메일</dt><dd>${escapeHtml(c.email||'-')}</dd><dt>마일리지</dt><dd>${escapeHtml(c.mileage||'-')}</dd><dt>선호 좌석</dt><dd>${escapeHtml(c.seat||'-')}</dd><dt>여권</dt><dd>${state.passports[c.id]?'<span class="badge ok">등록완료</span>':'<span class="badge warn">미등록</span>'}</dd></dl></article>`).join('')||'<div class="empty-state">등록된 고객이 없습니다.</div>';
  const opts='<option value="">고객 선택</option>'+state.customers.map(c=>`<option value="${c.id}">${escapeHtml(c.nameKo)} · ${escapeHtml(c.company||'개인')}</option>`).join('');
  document.getElementById('passportCustomer').innerHTML=opts; document.getElementById('quoteCustomer').innerHTML=opts;
}
document.getElementById('toggleCustomerForm').onclick=()=>document.getElementById('customerFormCard').classList.toggle('hidden'); document.getElementById('cancelCustomerBtn').onclick=()=>document.getElementById('customerFormCard').classList.add('hidden');
document.getElementById('customerForm').onsubmit=e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.customers.push({id:uid('c'),...Object.fromEntries(f.entries())});e.currentTarget.reset();document.getElementById('customerFormCard').classList.add('hidden');saveState();toast('고객을 등록했습니다.');};
document.getElementById('customerList').onclick=e=>{const id=e.target.closest('[data-del-customer]')?.dataset.delCustomer;if(id){state.customers=state.customers.filter(x=>x.id!==id);delete state.passports[id];saveState();toast('고객을 삭제했습니다.');}};

function renderPassports(){
  const rows=state.customers.filter(c=>state.passports[c.id]); document.getElementById('passportList').innerHTML=rows.length?rows.map(c=>{const p=state.passports[c.id];return `<div class="compact-item"><div><strong>${escapeHtml(c.nameKo)} · ${escapeHtml(p.surname||'')} ${escapeHtml(p.givenName||'')}</strong><small>${escapeHtml(p.passportNo||'-')} · 만료 ${escapeHtml(p.expiry||'-')}${p.fileName?` · ${escapeHtml(p.fileName)}`:''}</small></div><span class="badge ok">등록</span></div>`}).join(''):'<div class="empty-state">저장된 여권/APIS 정보가 없습니다.</div>';
}
document.getElementById('passportForm').onsubmit=async e=>{e.preventDefault();const cid=document.getElementById('passportCustomer').value;if(!cid)return toast('고객을 선택해주세요.');const data=Object.fromEntries(new FormData(e.currentTarget).entries());delete data[''];const file=document.getElementById('passportFile').files[0];if(file&&file.size>2*1024*1024)return toast('파일은 2MB 이하로 등록해주세요.');if(file){data.fileName=file.name;data.fileType=file.type;data.fileData=await fileToData(file);}state.passports[cid]=data;saveState();toast('여권/APIS 정보를 저장했습니다.');};
function fileToData(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});}

function fillQuoteFromAnalysis(){const a=state.lastAnalysis;if(!a)return;const f=document.getElementById('quoteForm');f.elements.itinerary.value=a.flights.map(x=>`${x.airline}${x.flight} ${x.date} ${x.time} ${x.cls} ${x.fareBasis}`).join('\n');f.elements.fare.value=a.total||0;f.elements.rules.value=`변경: ${a.change}\n환불: ${a.cancel}${a.family?`\nFare Family: ${a.family}`:''}${a.ttl?`\n발권기한: ${a.ttl}`:''}`;renderQuotePreview();}
function quoteData(){const f=document.getElementById('quoteForm'),cid=document.getElementById('quoteCustomer').value,c=state.customers.find(x=>x.id===cid);const fare=Number(f.elements.fare.value||0),tax=Number(f.elements.tax.value||0),service=Number(f.elements.service.value||0),other=Number(f.elements.other.value||0);return {id:uid('q'),date:todayISO(),customerId:cid,customer:c,title:f.elements.title.value,itinerary:f.elements.itinerary.value,fare,tax,service,other,total:fare+tax+service+other,rules:f.elements.rules.value};}
function renderQuotePreview(){const q=quoteData(),c=q.customer;document.getElementById('quotePreview').innerHTML=`<div class="quote-sheet"><p class="eyebrow">ATR TRAVEL OPS</p><h2>${escapeHtml(q.title)}</h2><div class="quote-meta">작성일 ${q.date}${c?` · ${escapeHtml(c.nameKo)} / ${escapeHtml(c.company||'개인')}`:''}</div><h3 style="margin-top:28px">항공 일정</h3><div class="quote-rules">${escapeHtml(q.itinerary||'여정을 입력해주세요.')}</div><table><tbody><tr><td>항공 운임</td><td class="num">${won(q.fare)}</td></tr><tr><td>세금 / 유류할증료</td><td class="num">${won(q.tax)}</td></tr><tr><td>서비스피</td><td class="num">${won(q.service)}</td></tr><tr><td>기타</td><td class="num">${won(q.other)}</td></tr></tbody></table><div class="quote-total"><span>총 견적액</span><span>${won(q.total)}</span></div><h3>변경·환불 안내</h3><div class="quote-rules">${escapeHtml(q.rules||'규정을 입력해주세요.')}</div><p style="font-size:11px;color:#64748b;line-height:1.6;margin-top:20px">※ 운임과 좌석은 발권 시점에 변동될 수 있으며, 최종 발권 전 항공사 운임규정을 다시 확인합니다.</p></div>`;}
document.getElementById('quoteForm').addEventListener('input',renderQuotePreview);document.getElementById('quoteForm').addEventListener('change',renderQuotePreview);document.getElementById('saveQuoteBtn').onclick=()=>{const q=quoteData();state.quotes.unshift(q);saveState();toast('견적서를 저장했습니다.');};document.getElementById('printQuoteBtn').onclick=()=>{renderQuotePreview();window.print();};

function netProfit(x){return Number(x.sales||0)-Number(x.purchase||0)-Number(x.fee||0)-Number(x.otherCost||0)}
function renderLedger(){
  const rows=state.ledger.slice().sort((a,b)=>b.date.localeCompare(a.date));const sales=rows.reduce((a,x)=>a+Number(x.sales||0),0),purchase=rows.reduce((a,x)=>a+Number(x.purchase||0),0),vat=rows.reduce((a,x)=>a+Number(x.vat||0),0),profit=rows.reduce((a,x)=>a+netProfit(x),0);
  document.getElementById('ledgerSummary').innerHTML=[['총 매출액',sales],['총 매입액',purchase],['부가세액',vat],['순수익',profit]].map(([l,v])=>`<div class="summary-card"><span>${l}</span><strong>${won(v)}</strong></div>`).join('');
  document.getElementById('ledgerBody').innerHTML=rows.map(x=>`<tr><td>${x.date}</td><td>${escapeHtml(x.tradeNo)}</td><td>${escapeHtml(x.item)}</td><td><span class="badge">${escapeHtml(x.payment)}</span></td><td class="num">${won(x.sales)}</td><td class="num">${won(x.purchase)}</td><td class="num">${won(x.supply)}</td><td class="num">${won(x.vat)}</td><td class="num"><strong>${won(netProfit(x))}</strong></td><td><button class="delete-btn" data-del-ledger="${x.id}">삭제</button></td></tr>`).join('')||'<tr><td colspan="10">거래가 없습니다.</td></tr>';
}
document.getElementById('toggleLedgerForm').onclick=()=>{document.getElementById('ledgerFormCard').classList.toggle('hidden');document.querySelector('#ledgerForm [name=date]').value=todayISO();updateLedgerCalc();};document.getElementById('cancelLedgerBtn').onclick=()=>document.getElementById('ledgerFormCard').classList.add('hidden');
function updateLedgerCalc(){const f=document.getElementById('ledgerForm'),sales=Number(f.elements.sales.value||0),purchase=Number(f.elements.purchase.value||0),fee=Number(f.elements.fee.value||0),other=Number(f.elements.otherCost.value||0),type=f.elements.vatType.value;if(type==='taxable'){f.elements.supply.value=Math.round(sales/1.1);f.elements.vat.value=sales-Math.round(sales/1.1)}else if(type==='zero'){f.elements.supply.value=sales;f.elements.vat.value=0}document.getElementById('ledgerCalc').textContent=`예상 순수익 ${won(sales-purchase-fee-other)}`;}
document.getElementById('ledgerForm').addEventListener('input',updateLedgerCalc);document.getElementById('ledgerForm').addEventListener('change',updateLedgerCalc);
document.getElementById('ledgerForm').onsubmit=e=>{e.preventDefault();const f=e.currentTarget,d=Object.fromEntries(new FormData(f).entries());['sales','purchase','fee','otherCost','supply','vat'].forEach(k=>d[k]=Number(d[k]||0));d.id=uid('l');d.tradeNo=d.tradeNo||`TR-${d.date.replaceAll('-','')}-${String(state.ledger.length+1).padStart(3,'0')}`;state.ledger.unshift(d);f.reset();document.getElementById('ledgerFormCard').classList.add('hidden');saveState();toast('거래를 저장했습니다.');};
document.getElementById('ledgerBody').onclick=e=>{const id=e.target.closest('[data-del-ledger]')?.dataset.delLedger;if(id){state.ledger=state.ledger.filter(x=>x.id!==id);saveState();toast('거래를 삭제했습니다.');}};

function renderTasks(){const rows=state.tasks.slice().sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));document.getElementById('allTasks').innerHTML=rows.map(t=>`<div class="task-row"><div class="task-date">${t.date.slice(5)}</div><div class="task-time">${escapeHtml(t.time||'--:--')}</div><div><strong>${escapeHtml(t.client)} · ${escapeHtml(t.type)}</strong><p>${escapeHtml(t.detail)}</p></div><button class="delete-btn" data-del-task="${t.id}">삭제</button></div>`).join('')||'<div class="empty-state">등록된 일정이 없습니다.</div>';}
document.getElementById('toggleTaskForm').onclick=()=>{document.getElementById('taskFormCard').classList.toggle('hidden');document.querySelector('#taskForm [name=date]').value=todayISO();};document.getElementById('taskForm').onsubmit=e=>{e.preventDefault();state.tasks.push({id:uid('t'),...Object.fromEntries(new FormData(e.currentTarget).entries()),done:false});e.currentTarget.reset();document.getElementById('taskFormCard').classList.add('hidden');saveState();toast('마감 일정을 추가했습니다.');};document.getElementById('allTasks').onclick=e=>{const id=e.target.closest('[data-del-task]')?.dataset.delTask;if(id){state.tasks=state.tasks.filter(x=>x.id!==id);saveState();}};

function renderAll(){renderDashboard();renderEntries();renderCustomers();renderPassports();renderLedger();renderTasks();renderQuotePreview();if(state.lastAnalysis)renderAnalysis(state.lastAnalysis);}
document.getElementById('resetDemoBtn').onclick=()=>{if(confirm('현재 브라우저에 저장한 데이터를 데모 상태로 초기화할까요?')){state=structuredClone(demo);localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll();toast('데모 데이터로 초기화했습니다.');}};
document.getElementById('todayLabel').textContent=new Intl.DateTimeFormat('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
renderAll();
