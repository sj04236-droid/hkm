/* Task-first workspace. Reuses the existing forms, knowledge and storage. */
const viewPositions = new Map();
let currentView = 'dashboard';
const originalShowView = showView;
showView = function(name) {
  if (!titles[name]) return;
  viewPositions.set(currentView, window.scrollY);
  currentView = name;
  originalShowView(name);
  document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-current', b.dataset.view === name ? 'page' : 'false'));
  document.querySelectorAll('.mobile-nav [data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  document.getElementById('moreNav').classList.toggle('active', !['dashboard','entries','quotes','passport'].includes(name));
  updateContextActions(name);
  requestAnimationFrame(() => window.scrollTo({top:viewPositions.get(name)||0, behavior:'instant'}));
};

function updateContextActions(name) {
  const actions = {
    dashboard: ['빠른 실행','search'], entries:['질문하기','entry'], pnr:['규정 정리','analyzePnrBtn'],
    customers:['고객 등록','customer'], passport:['확인 후 저장','passport'],
    quotes:['견적 저장','saveQuoteBtn'], ledger:['거래 등록','ledger'], tasks:['일정 등록','task']
  };
  const [label, action] = actions[name];
  document.getElementById('contextActions').innerHTML = `${name==='quotes'?'<button class="button ghost" data-forward="printQuoteBtn">인쇄 / PDF</button>':''}<button class="button primary" data-action="${action}">${label}</button>`;
  document.getElementById('mobileActions').innerHTML = ['quotes','passport'].includes(name)
    ? `<span>${name==='quotes'?'미리보기 확인 후 저장':'원본 여권과 대조 후 저장'}</span><button class="button primary" data-action="${action}">${label}</button>${name==='quotes'?'<button class="button ghost" data-forward="printQuoteBtn">PDF</button>':''}` : '';
  document.getElementById('mobileActions').classList.toggle('hidden',!['quotes','passport'].includes(name));
}
function runWorkspaceAction(action) {
  if(action==='search') return openWorkspaceSearch();
  if(action==='passport') {
    const form=document.getElementById('passportForm');
    if(form.querySelector('.form-actions button').disabled) return toast('여권을 읽는 중입니다. 완료 후 정보를 확인하고 저장해주세요.');
    return form.requestSubmit();
  }
  if(action==='entry') return document.getElementById('entrySearch').focus();
  const forms={customer:['customers','customerFormCard','customerForm'],ledger:['ledger','ledgerFormCard','ledgerForm'],task:['tasks','taskFormCard','taskForm']};
  if(forms[action]) {
    const [view,card,form]=forms[action]; showView(view);
    document.getElementById(card).classList.remove('hidden');
    const el=document.getElementById(form);
    if(el.elements.date) el.elements.date.value=todayISO();
    if(action==='ledger') updateLedgerCalc();
    el.querySelector('input').focus(); return;
  }
  document.getElementById(action)?.click();
}
document.addEventListener('click',e=>{
  const action=e.target.closest('[data-action]'); if(action) runWorkspaceAction(action.dataset.action);
  const forward=e.target.closest('[data-forward]'); if(forward) document.getElementById(forward.dataset.forward)?.click();
  const suggestion=e.target.closest('[data-question]');
  if(suggestion){ if(!document.getElementById('entryGds').value) {document.getElementById('entryGds').focus();return toast('먼저 GDS를 선택해주세요.');} document.getElementById('entrySearch').value=suggestion.dataset.question;renderEntries(true); }
});

const searchDialog=document.getElementById('workspaceSearch');
const searchInput=document.getElementById('workspaceSearchInput');
const searchItems=[
  ['dashboard','오늘 업무','홈 발권 마감 매출 손익'],['entries','GDS 엔트리 찾기','아마데우스 세이버 sabre amadeus 운임 명령어'],
  ['pnr','규정 분석','pnr 변경 환불 노쇼 수하물'],['customers','고객 찾기','crm 회사 이메일 마일리지'],
  ['passport','여권 업로드','apis 파일 일행 여행객'],['quotes','견적 작성','인보이스 invoice 항공편 tasf'],
  ['ledger','매출·매입 장부','거래 지출 수익 부가세'],['tasks','마감 일정','발권 결제 기한 tkt']
];
function renderWorkspaceSearch(){
  const query=searchInput.value.trim().toLowerCase();
  const rows=searchItems.filter(r=>(r[1]+' '+r[2]).toLowerCase().includes(query));
  document.getElementById('workspaceSearchResults').innerHTML=rows.map(([view,label,hint])=>`<button class="search-result" data-search-view="${view}"><strong>${label}</strong><small>${hint}</small><span aria-hidden="true">→</span></button>`).join('')||'<p class="helper-text">일치하는 업무가 없습니다. 엔트리·여권·견적처럼 업무 이름으로 찾아주세요.</p>';
}
function openWorkspaceSearch(){searchInput.value='';renderWorkspaceSearch();searchDialog.showModal();searchInput.focus();}
document.getElementById('workspaceSearchBtn').onclick=openWorkspaceSearch;
document.getElementById('moreNav').onclick=openWorkspaceSearch;
document.getElementById('closeWorkspaceSearch').onclick=()=>searchDialog.close();
searchInput.addEventListener('input',renderWorkspaceSearch);
searchDialog.addEventListener('click',e=>{const button=e.target.closest('[data-search-view]');if(button){searchDialog.close();showView(button.dataset.searchView);}});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();if(!searchDialog.open)openWorkspaceSearch();}});

// Upload first, inspect the extracted fields, then explicitly save.
const passportForm=document.getElementById('passportForm');
passportForm.prepend(passportForm.querySelector('.file-box'));
function insertFormSection(form, target, id, label) {
  const field=form.querySelector(target)?.closest('label');if(!field)return;
  const title=document.createElement('h3');title.id=id;title.className='form-section span-2';title.textContent=label;field.before(title);
}
insertFormSection(passportForm,'[name=party]','passport-review','2 · 인식 정보 확인 / 직접 입력');
insertFormSection(document.getElementById('quoteForm'),'#quoteCustomer','quote-recipient','1 · 고객 정보');
insertFormSection(document.getElementById('quoteForm'),'#quotePnr','quote-itinerary','2 · 항공 일정');
insertFormSection(document.getElementById('quoteForm'),'[name=fare]','quote-pricing','3 · 금액과 인원');
insertFormSection(document.getElementById('quoteForm'),'[name=rules]','quote-policy','4 · 규정과 결제 안내');
// The preview stays nearby on wide screens; mobile can jump to it without losing input.
document.getElementById('quotePreviewJump').onclick=()=>document.getElementById('quotePreview').scrollIntoView({behavior:'smooth',block:'start'});
document.getElementById('customerDisplay').value='list';renderCustomers();
updateContextActions('dashboard');
