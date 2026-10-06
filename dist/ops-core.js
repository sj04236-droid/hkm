(function(root){
  const airports={ICN:'인천',SEL:'서울',GMP:'김포',NRT:'도쿄 나리타',HND:'도쿄 하네다',TYO:'도쿄',KIX:'오사카 간사이',OSA:'오사카',SIN:'싱가포르',HKG:'홍콩',BKK:'방콕',TPE:'타이베이',VIE:'비엔나',DRS:'드레스덴',FRA:'프랑크푸르트',CDG:'파리',LHR:'런던',PNH:'프놈펜',LAX:'로스앤젤레스',JFK:'뉴욕',PEK:'베이징',MUC:'뮌헨',FCO:'로마',DXB:'두바이',SYD:'시드니',DAD:'다낭',SGN:'호찌민',HAN:'하노이'};
  const airlines={KE:'대한항공',OZ:'아시아나항공',LH:'루프트한자',SQ:'싱가포르항공',JL:'일본항공',NH:'전일본공수',CX:'캐세이퍼시픽',TG:'타이항공',AF:'에어프랑스',QR:'카타르항공',EK:'에미레이트항공',UA:'유나이티드항공','7C':'제주항공',TW:'티웨이항공',LJ:'진에어'};
  const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function koreanDate(d){const m=String(d||'').match(/(\d{1,2})([A-Z]{3})(\d{2})?/);return m&&months.includes(m[2])?`${m[3]?'20'+m[3]+'년 ':''}${months.indexOf(m[2])+1}월 ${Number(m[1])}일`:d||'날짜 확인';}
  function time(t){const s=String(t||'').replace(':','');return /^\d{4}$/.test(s)?s.slice(0,2)+':'+s.slice(2):t||'';}
  function parseFlights(text){
    const flights=[],lines=text.toUpperCase().split(/\r?\n/);let origin='';
    for(const line of lines){
      let m=line.match(/^\s*(\d+)?\s*([A-Z0-9]{2})\s*(\d{1,4})\s*([A-Z])\s+(\d{1,2}[A-Z]{3}(?:\d{2})?)\s*(?:\d|[A-Z]{2})?\s*([A-Z]{3})([A-Z]{3})\s+([A-Z]{2}\d*)\s+(\d{4})\s+(\d{4})(?:\s*(\+\d))?/);
      if(m){flights.push({airline:m[2],flight:m[3],cls:m[4],date:m[5],from:m[6],to:m[7],status:m[8],time:m[9],arrival:m[10],arrivalOffset:m[11]||'',fareBasis:'',bag:''});continue;}
      m=line.match(/^\s*([A-Z]{3})\s*$/);if(m){origin=m[1];continue;}
      m=line.match(/^\s*([A-Z]{3})\s+([A-Z0-9]{2})\s+(\d{1,4})\s+([A-Z])\s+(\d{1,2}[A-Z]{3})\s+(\d{4})\s+([A-Z0-9]+).*?\s(\dP|\dPC)?\s*$/);
      if(m){flights.push({from:origin,to:m[1],airline:m[2],flight:m[3],cls:m[4],date:m[5],time:m[6],fareBasis:m[7],bag:m[8]||'',arrival:'',status:''});origin=m[1];}
    }
    return flights;
  }
  function flightKorean(f){return `${koreanDate(f.date)} ${airlines[f.airline]||f.airline} ${f.airline}${f.flight} · ${airports[f.from]||f.from||'출발지 확인'} → ${airports[f.to]||f.to||'도착지 확인'} · 출발 ${time(f.time)}${f.arrival?' / 도착 '+time(f.arrival)+(f.arrivalOffset?' ('+f.arrivalOffset+'일)':''):''} · 예약등급 ${f.cls}${f.status?' · '+(/^HK/.test(f.status)?'예약 확약':f.status):''}`;}
  function summarizeRules(text){
    const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),result=[];
    const definitions=[['변경',/CHANGES|REISSUE|VOLUNTARY CHANGES|변경|재발행/i],['환불',/CANCELLATIONS|REFUND|NON.?REFUNDABLE|환불|취소/i],['노쇼',/NO[ -]?SHOW|노쇼/i],['수하물',/BAGGAGE|ALLOWANCE|수하물|\b\d+PC\b/i],['발권·판매 제한',/SALES RESTRICTION|TICKETING|LAST TKT|발권|판매제한/i],['항공편 제한',/FLIGHT APPLICATION|FLIGHT RESTRICTION|항공편 제한/i],['최소·최대 체류',/MINIMUM STAY|MAXIMUM STAY|최소체류|최대체류/i],['운임 결합',/COMBINABILITY|END.ON.END|결합/i]];
    const groups=new Map();let current='';
    for(const line of lines){
      const heading=line.match(/^(?:[A-Z]{2}[. ]\s*)?(CHANGES|CANCELLATIONS|REFUNDS?|PENALTIES|VOLUNTARY CHANGES|VOLUNTARY REFUNDS|NO[ -]?SHOW|BAGGAGE(?: ALLOWANCE)?|SALES RESTRICTIONS?|FLIGHT APPLICATION|MINIMUM STAY|MAXIMUM STAY|COMBINABILITY|ADVANCE RES(?:ERVATIONS)?\/?TKT|SEASONS|환불|취소|변경|노쇼|수하물)(?:\s*[:.]|\s*)$/i);
      if(heading){current=definitions.find(([,pattern])=>pattern.test(heading[1]))?.[0]||heading[1];}
      if(!current)current=definitions.find(([,pattern])=>pattern.test(line))?.[0]||'';
      const key=/NO[ -]?SHOW/i.test(line)?'노쇼':current;
      if(key){if(!groups.has(key))groups.set(key,[]);groups.get(key).push(line);}
    }
    const additional=[...groups.keys()].filter(k=>!definitions.some(([t])=>t===k)).map(k=>[k,/./]);
    for(const [title,pattern] of [...definitions,...additional]){
      const chunks=groups.get(title)||[];
      if(!chunks.length)continue;
      const source=chunks.join('\n'),u=source.toUpperCase();const summaries=[];
      if(title==='변경'||title==='환불'){
        const forbidden=title==='변경'?/CHANGES (?:ARE )?NOT PERMITTED|REISSUE NOT PERMITTED/:/CANCELLATIONS (?:ARE )?NOT PERMITTED|REFUNDS? (?:ARE )?NOT PERMITTED|NON.?REFUNDABLE/;
        const allowed=title==='변경'?/CHANGES (?:ARE )?PERMITTED|REISSUE PERMITTED/:/CANCELLATIONS (?:ARE )?PERMITTED|REFUNDS? (?:ARE )?PERMITTED/;
        if(forbidden.test(u)&&(/CHARGE/.test(u)||allowed.test(u)))summaries.push('조건별 '+title+' 가능·불가 구분 필요');else if(forbidden.test(u))summaries.push(title+' 불가 조건 포함');else if(allowed.test(u))summaries.push(title+' 가능 조건 포함');
      }
      if(/BEFORE DEPARTURE/.test(u))summaries.push('출발 전 조건');if(/AFTER DEPARTURE/.test(u))summaries.push('출발 후 조건');if(/ANY TIME/.test(u))summaries.push('전체 시점 적용 문구');
      const charges=[...u.matchAll(/(?:CHARGE|PENALTY|FEE)\s+(KRW|USD|EUR|JPY)\s*([\d,]+(?:\.\d+)?)/g)].map(m=>`${m[1]} ${m[2]}`);if(charges.length)summaries.push('수수료: '+[...new Set(charges)].join(', '));
      if(/NO[ -]?SHOW/.test(u))summaries.push('노쇼 조건 포함');if(/WAIV(?:ED|ER)/.test(u))summaries.push('면제 예외 조건 포함');
      if(title==='수하물'){const bags=[...u.matchAll(/\b(\d+\s*(?:PC|KG))\b/g)].map(m=>m[1]);if(bags.length)summaries.push('허용량: '+[...new Set(bags)].join(', '));}
      let condition='';const details=[];
      for(const line of chunks){
        if(/BEFORE DEPARTURE/i.test(line))condition='출발 전';else if(/AFTER DEPARTURE/i.test(line))condition='출발 후';else if(/ANY TIME/i.test(line))condition='전체 시점';
        const charge=line.match(/(?:CHARGE|PENALTY|FEE)\s+(KRW|USD|EUR|JPY)\s*([\d,]+(?:\.\d+)?)/i);
        if(charge)details.push(`${condition?condition+': ':''}수수료 ${charge[1]} ${charge[2]}`);
        if(/NOT PERMITTED|NON.?REFUNDABLE/i.test(line))details.push(`${condition?condition+': ':''}${title} 불가 조건`);
        const deadline=line.match(/WITHIN\s+(\d+)\s+DAYS/i);if(deadline)details.push(`${deadline[1]}일 이내 조건`);
        const duration=line.match(/(\d+)\s*(MONTHS?|DAYS?)/i);if(duration&&!deadline)details.push(`${duration[1]}${/^MONTH/i.test(duration[2])?'개월':'일'} 조건`);
      }
      result.push({title,summary:summaries.join(' · ')||'관련 규정 문구 확인',details:[...new Set(details)],source});
    }
    return result;
  }
  function analyze(text){const flights=parseFlights(text),rules=summarizeRules(text);const nums=[...text.matchAll(/KRW\s+([\d,]+)\s*$/gmi)].map(m=>Number(m[1].replace(/,/g,'')));return {flights,rules,total:nums.length?Math.max(...nums):0,ttl:(text.match(/LAST TKT DTE\s+([^\n-]+)/i)||[])[1]?.trim()||'',family:(text.match(/FARE FAMILY[^\n]*:([A-Z0-9_-]+)\s*$/im)||[])[1]||'',cancel:rules.find(r=>r.title==='환불')?.summary||'환불 규정 미제공',change:rules.find(r=>r.title==='변경')?.summary||'변경 규정 미제공',raw:text};}
  function normalize(q){return String(q).toLowerCase().replace(/과거\s*날짜|예전\s*날짜|옛날/g,'과거일자').replace(/수화물/g,'수하물').replace(/환급/g,'환불').replace(/취소/g,'환불').replace(/조회하는\s*(거|것)|조회해줘|찾아줘|알려주세요|알려줘|엔트리|명령어|하는법|어떻게|뭐야/g,' ').replace(/\s+/g,' ').trim();}
  function searchEntries(entries,gds,q){
    const n=normalize(q),tokens=n.match(/[가-힣a-z0-9¥/*.-]+/g)||[],generic=new Set(['운임','조회','규정','관련','좀','하는','거','해줘','코드']);const important=tokens.filter(x=>!generic.has(x)&&x.length>1);
    if(!n)return [];
    return entries.filter(e=>e.gds===gds).map(e=>{
      const hay=normalize(e.title+' '+e.tags+' '+(e.aliases||[]).join(' ')),code=e.code.toLowerCase();
      const exact=code===q.toLowerCase().trim();let hits=important.filter(t=>hay.includes(t)||code.includes(t)).length;
      // A specific request must match its intent, not simply share the word 'fare'.
      if(important.length&&!hits&&!exact)return {entry:e,score:0};
      let score=exact?100:0;for(const t of tokens)if(hay.includes(t))score+=generic.has(t)?1:8;
      if(n.includes('과거')&&!hay.includes('과거'))score=0;
      if(n.includes('과거')&&hay.includes('과거'))score+=30;
      return {entry:e,score};
    }).filter(x=>x.score>=3).sort((a,b)=>b.score-a.score);
  }
  const api={airports,airlines,koreanDate,time,parseFlights,flightKorean,summarizeRules,analyze,searchEntries,netProfit:x=>Number(x.sales||0)-Number(x.purchase||0)};
  root.TravelCore=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
