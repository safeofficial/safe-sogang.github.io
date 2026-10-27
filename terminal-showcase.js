/* SAFE Terminal 쇼케이스 - 공지사항 아래 · 예시 화면 (실제 학회원 · 계좌 데이터 없음) */
(function(){
  var S = [
    { t: '홈 대시보드', d: '뉴스 클리핑 · 경제 캘린더 · 실적 일정을 아침마다 한눈에', v: 'home' },
    { t: '마켓 맵', d: '국내 · 미국 업종별 시가총액과 등락률을 지도로', v: 'map' },
    { t: '밸류에이션', d: 'DCF · 배수 · 컨센서스로 적정주가를 직접 계산', v: 'val' },
    { t: '전광판 · 모의투자', d: '24시간 시세 전광판과 팀 대회 모의투자', v: 'board' },
    { t: '재무제표', d: '국내 DART · 미국 SEC 공시로 분기 실적과 추이를', v: 'fin' }
  ];
  var css = `
  #termShow{padding:96px 24px;background:var(--bg,#f8f9fb)}
  #termShow .ts-wrap{max-width:1080px;margin:0 auto}
  #termShow .ts-grid{display:grid;grid-template-columns:300px 1fr;gap:40px;align-items:center;margin-top:8px}
  #termShow .ts-list{display:flex;flex-direction:column;gap:4px}
  #termShow .ts-item{all:unset;box-sizing:border-box;cursor:pointer;display:block;position:relative;padding:14px 18px 16px;border-radius:14px;transition:background .25s,box-shadow .25s}
  #termShow .ts-item b{display:block;font-size:1.05rem;font-weight:700;color:var(--primary,#2c3e6b);margin-bottom:4px}
  #termShow .ts-item span{display:block;font-size:.9rem;line-height:1.55;color:var(--text-sub,#5a6278)}
  #termShow .ts-item i{position:absolute;left:18px;right:18px;bottom:0;height:2px;background:var(--border,#e2e6f0);border-radius:2px;overflow:hidden}
  #termShow .ts-item i::after{content:'';position:absolute;inset:0;width:0;background:var(--primary,#2c3e6b)}
  #termShow .ts-item.on{background:#fff;box-shadow:0 1px 2px rgba(20,30,60,.06),0 10px 30px -14px rgba(20,30,60,.22)}
  #termShow .ts-item.on::before{content:'';position:absolute;left:0;top:16px;bottom:16px;width:3px;border-radius:3px;background:var(--primary,#2c3e6b)}
  #termShow .ts-item.on i::after{animation:tsBar 5.5s linear forwards}
  #termShow .ts-item:focus-visible{outline:2px solid var(--accent,#6b8cda);outline-offset:2px}
  @keyframes tsBar{to{width:100%}}
  #termShow .ts-win{border-radius:16px;overflow:hidden;background:#fff;border:1px solid var(--border,#e2e6f0);box-shadow:0 30px 70px -30px rgba(30,40,90,.35),0 6px 16px -8px rgba(30,40,90,.12)}
  #termShow .ts-bar{display:flex;align-items:center;gap:7px;padding:11px 14px;border-bottom:1px solid var(--border,#e2e6f0);background:#f7f8fb;font-size:.8rem;color:var(--text-sub,#5a6278)}
  #termShow .ts-bar em{width:10px;height:10px;border-radius:50%;display:inline-block}
  #termShow .ts-bar span{margin-left:8px}
  #termShow .ts-nav{display:flex;align-items:center;gap:16px;padding:10px 16px;border-bottom:1px solid var(--border,#e2e6f0);font-size:.72rem;color:#8a91a5}
  #termShow .ts-nav b{display:flex;align-items:center;gap:7px;color:var(--primary,#2c3e6b);font-size:.8rem;margin-right:8px}
  #termShow .ts-nav b em{font-style:normal;width:20px;height:20px;border-radius:5px;background:var(--primary,#2c3e6b);color:#fff;display:grid;place-items:center;font-size:.6rem}
  #termShow .ts-nav .on{color:var(--primary,#2c3e6b);font-weight:700;border-bottom:2px solid var(--primary,#2c3e6b);padding-bottom:2px}
  #termShow .ts-stage{position:relative;height:372px;background:linear-gradient(135deg,#e9eefc 0%,#eef0fb 45%,#f6ecf4 100%)}
  #termShow .ts-scr{position:absolute;inset:0;padding:16px;opacity:0;transform:translateY(8px);transition:opacity .45s,transform .45s;pointer-events:none}
  #termShow .ts-scr.on{opacity:1;transform:none}
  #termShow .ts-c{background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.9);border-radius:12px;padding:12px 14px;box-shadow:0 8px 20px -14px rgba(30,40,90,.35)}
  #termShow .ts-h{font-size:.78rem;font-weight:700;color:#1a1f36;margin-bottom:10px}
  #termShow .ts-h small{font-weight:500;color:#8a91a5;margin-left:6px;font-size:.66rem}
  #termShow .up{color:#c8352c} #termShow .dn{color:#1f5fbf}
  #termShow .ts-row{display:flex;justify-content:space-between;align-items:center;font-size:.7rem;color:#3a4256;padding:6px 0;border-bottom:1px solid rgba(30,40,90,.07)}
  #termShow .ts-row:last-child{border-bottom:0}
  #termShow .ts-dots{display:flex;justify-content:center;gap:6px;margin-top:16px}
  #termShow .ts-dots i{width:6px;height:6px;border-radius:3px;background:#c9cfdd;transition:width .3s,background .3s}
  #termShow .ts-dots i.on{width:22px;background:var(--primary,#2c3e6b)}
  #termShow .ts-note{text-align:center;font-size:.78rem;color:#8a91a5;margin-top:14px}
  #termShow .ts-note a{color:var(--primary,#2c3e6b);font-weight:600;text-decoration:none;margin-left:8px}
  @media (max-width:860px){ #termShow .ts-grid{grid-template-columns:1fr} #termShow .ts-list{flex-direction:row;overflow-x:auto;gap:8px;padding-bottom:4px} #termShow .ts-item{min-width:200px} #termShow .ts-stage{height:300px} }
  @media (prefers-reduced-motion:reduce){ #termShow .ts-scr{transition:none} #termShow .ts-item.on i::after{animation:none;width:100%} }
  `;
  function bars(rows){ return rows.map(function(r){ return '<div style="display:grid;grid-template-columns:70px 1fr;align-items:center;gap:8px;margin:7px 0"><span style="font-size:.66rem;font-weight:700;color:#3a4256">' + r[0] + '</span><div style="position:relative;height:9px;border-radius:9px;background:rgba(30,40,90,.08)"><div style="position:absolute;left:' + r[1] + '%;width:' + r[2] + '%;top:0;bottom:0;border-radius:9px;background:linear-gradient(90deg,#5b6cf0,#3a7bff)"></div></div></div>'; }).join(''); }
  var V = {
    home: '<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px;height:100%"><div class="ts-c"><div class="ts-h">뉴스 클리핑<small>오늘 아침</small></div>'
      + [['반도체 수출 3개월 연속 증가', '+2.1%', 'up'], ['연준 위원 "추가 인하 신중"', '-0.4%', 'dn'], ['원/달러 1,320원대 마감', '+0.3%', 'up'], ['2차전지 소재 수주 확대', '+1.8%', 'up'], ['유가 공급 우려 완화', '-1.2%', 'dn'], ['조선 수주잔고 사상 최대', '+2.6%', 'up'], ['미 국채 10년물 4.9%대', '-0.1%', 'dn'], ['AI 서버 투자 확대 전망', '+1.4%', 'up']].map(function(x){ return '<div class="ts-row"><span>' + x[0] + '</span><b class="' + x[2] + '">' + x[1] + '</b></div>'; }).join('')
      + '</div><div class="ts-c"><div class="ts-h">경제 캘린더<small>이번 주</small></div>' + [['월', 'ISM 제조업'], ['화', '소비자물가 (CPI)'], ['수', 'FOMC 의사록'], ['목', '실적 · 반도체 A사'], ['목', '수출입 동향'], ['금', '고용 보고서'], ['금', '실적 · 플랫폼 B사']].map(function(x){ return '<div class="ts-row"><span><b style="color:#2c3e6b;margin-right:8px">' + x[0] + '</b>' + x[1] + '</span></div>'; }).join('') + '</div></div>',
    map: '<div class="ts-c" style="height:100%;box-sizing:border-box"><div class="ts-h">업종 지도<small>시가총액 · 등락률</small></div><div style="display:grid;grid-template-columns:repeat(6,1fr);grid-auto-rows:44px;gap:3px">'
      + [['반도체', 3, 2, '#c8352c', '+2.4'], ['인터넷', 2, 1, '#e06a5e', '+0.9'], ['자동차', 1, 1, '#f0a39b', '+0.3'], ['은행', 2, 1, '#8fb0e6', '-0.4'], ['바이오', 1, 1, '#4f7fd0', '-1.1'], ['2차전지', 1, 2, '#d24a3f', '+1.7'], ['조선', 1, 1, '#e88a80', '+0.6'], ['화학', 1, 1, '#a9c1ea', '-0.2'], ['유통', 1, 1, '#2d5fb5', '-1.6'], ['통신', 1, 1, '#c3d3ef', '-0.1'], ['게임', 1, 1, '#ecb3ab', '+0.2']].map(function(x){ return '<div style="grid-column:span ' + x[1] + ';grid-row:span ' + x[2] + ';background:' + x[3] + ';border-radius:5px;color:#fff;font-size:.66rem;font-weight:700;padding:6px 7px;display:flex;flex-direction:column;justify-content:space-between"><span>' + x[0] + '</span><span>' + x[4] + '%</span></div>'; }).join('') + '</div></div>',
    val: '<div style="display:grid;grid-template-columns:1.3fr 1fr;gap:12px"><div class="ts-c"><div class="ts-h">풋볼 필드<small>방법별 적정주가 범위 (예시)</small></div><div style="position:relative">' + bars([['DCF', 30, 36], ['PER', 30, 38], ['PBR', 18, 40], ['EV/EBITDA', 12, 40], ['컨센서스', 23, 28]]) + '<div style="position:absolute;left:calc(70px + 8px + (100% - 78px) * .48);top:-4px;bottom:-4px;border-left:1.5px dashed #c8352c"></div></div></div>'
      + '<div class="ts-c"><div class="ts-h">시총 대비 지표<small>최근 4분기 · 컨센서스</small></div>' + [['PER', '22.0배', '19.1배'], ['PSR', '17.6배', '6.9배'], ['PBR', '27.8배', '14.6배'], ['EV/EBITDA', '23.1배', '8.7배'], ['P/FCF', '16.9배', '15.1배']].map(function(x){ return '<div class="ts-row"><span>' + x[0] + '</span><b>' + x[1] + '</b><b style="color:#1f5fbf">' + x[2] + '</b></div>'; }).join('') + '</div></div>'
      + '<div class="ts-c" style="margin-top:12px"><div class="ts-h">DCF 연도별 가정<small>컨센서스 → 영구성장률</small></div><div style="display:flex;align-items:flex-end;gap:16px;height:54px;padding:0 6px">' + [[100, '#3a7bff'], [84, '#3a7bff'], [62, '#a9c7ff'], [48, '#a9c7ff'], [36, '#a9c7ff']].map(function(x){ return '<div style="flex:1;height:' + x[0] + '%;background:' + x[1] + ';border-radius:6px"></div>'; }).join('') + '</div></div>',
    board: '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:12px;height:100%"><div class="ts-c" style="background:#0b0d14;border-color:#1c2030"><div class="ts-h" style="color:#e8ecf4">전광판<small style="color:#8a91a5">24시간</small></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'
      + [['S&P 500', '7,676', '+0.70', 'up'], ['나스닥', '26,169', '+0.82', 'up'], ['코스피', '5,693', '+4.09', 'up'], ['VIX', '18.39', '-5.45', 'dn'], ['원/달러', '1,324.8', '-0.03', 'dn'], ['비트코인', '80,214', '+0.26', 'up'], ['금', '2,684', '+0.41', 'up'], ['미 10년물', '4.99%', '-0.04', 'dn']].map(function(x){ return '<div style="background:#141826;border-radius:8px;padding:5px 9px"><div style="font-size:.6rem;color:#8a91a5">' + x[0] + '</div><div style="font-size:.85rem;font-weight:700;color:#f2f4f8;font-family:ui-monospace,Menlo,monospace">' + x[1] + '</div><div style="font-size:.62rem;font-weight:700;color:' + (x[3] === 'up' ? '#ff6b5e' : '#6ea8ff') + '">' + x[2] + '%</div></div>'; }).join('') + '</div></div>'
      + '<div class="ts-c"><div class="ts-h">팀 대회 순위<small>예시</small></div>' + [['1위', 'A팀', '+6.2%', 'up'], ['2위', 'B팀', '+3.4%', 'up'], ['3위', 'C팀', '+0.9%', 'up'], ['4위', 'D팀', '-2.1%', 'dn'], ['5위', 'E팀', '-3.0%', 'dn'], ['6위', 'F팀', '-4.4%', 'dn']].map(function(x){ return '<div class="ts-row"><span><b style="color:#2c3e6b;margin-right:10px">' + x[0] + '</b>' + x[1] + '</span><b class="' + x[3] + '">' + x[2] + '</b></div>'; }).join('') + '</div></div>',
    fin: '<div class="ts-c" style="height:100%;box-sizing:border-box"><div class="ts-h">손익계산서<small>분기 · 단위 억 원 (예시)</small></div><div style="display:grid;grid-template-columns:1.3fr repeat(5,1fr) 1.2fr;font-size:.68rem;color:#3a4256">'
      + ['항목', '24.4Q', '25.1Q', '25.2Q', '25.3Q', '25.4Q', '추이'].map(function(h){ return '<b style="padding:6px 4px;border-bottom:1px solid rgba(30,40,90,.15);color:#5a6278">' + h + '</b>'; }).join('')
      + [['매출', [612, 640, 668, 702, 745]], ['영업이익', [61, 66, 71, 79, 88]], ['순이익', [44, 49, 52, 60, 66]], ['영업이익률', [10.0, 10.3, 10.6, 11.3, 11.8]], ['EPS (원)', [1210, 1340, 1420, 1630, 1790]], ['영업현금흐름', [82, 75, 90, 97, 104]]].map(function(r){ var mx = Math.max.apply(null, r[1]); return '<span style="padding:9px 4px;border-bottom:1px solid rgba(30,40,90,.07);font-weight:700">' + r[0] + '</span>' + r[1].map(function(v){ return '<span style="padding:9px 4px;border-bottom:1px solid rgba(30,40,90,.07);font-variant-numeric:tabular-nums">' + v.toLocaleString() + (r[0] === '영업이익률' ? '%' : '') + '</span>'; }).join('') + '<span style="padding:6px 4px;border-bottom:1px solid rgba(30,40,90,.07);display:flex;align-items:flex-end;gap:3px;height:22px">' + r[1].map(function(v, i){ return '<i style="flex:1;height:' + Math.max(3, Math.round(v / mx * 18)) + 'px;border-radius:2px;background:' + (i === 4 ? '#2c3e6b' : '#b9c4e0') + '"></i>'; }).join('') + '</span>'; }).join('') + '</div></div>'
  };
  function mount(){
    var news = document.getElementById('news'); if (!news || document.getElementById('termShow')) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var sec = document.createElement('section'); sec.id = 'termShow';
    sec.innerHTML = '<div class="ts-wrap"><div class="section-header"><div class="section-tag">Members only</div><h2>SAFE Terminal</h2><p>학회원 전용 금융 데이터 · 리서치 플랫폼. 시장부터 기업 분석, 모의투자까지 한 곳에서.</p></div>'
      + '<div class="ts-grid"><div class="ts-list" role="tablist">' + S.map(function(x, i){ return '<button type="button" class="ts-item" role="tab" data-i="' + i + '"><b>' + x.t + '</b><span>' + x.d + '</span><i></i></button>'; }).join('') + '</div>'
      + '<div><div class="ts-win" aria-label="SAFE Terminal 예시 화면"><div class="ts-bar"><em style="background:#ff5f57"></em><em style="background:#febc2e"></em><em style="background:#28c840"></em><span>SAFE Terminal</span></div>'
      + '<div class="ts-nav"><b><em>SF</em>SAFE Terminal</b>' + S.map(function(x, i){ return '<span data-n="' + i + '">' + x.t.split(' ·')[0] + '</span>'; }).join('') + '</div>'
      + '<div class="ts-stage">' + S.map(function(x, i){ return '<div class="ts-scr" data-s="' + i + '">' + V[x.v] + '</div>'; }).join('') + '</div></div>'
      + '<div class="ts-dots">' + S.map(function(){ return '<i></i>'; }).join('') + '</div><p class="ts-note">화면은 예시이며 실제 데이터와 다를 수 있습니다.<a href="https://safeofficial.github.io/terminal/" target="_blank" rel="noopener">학회원 로그인</a></p></div></div></div>';
    news.parentNode.insertBefore(sec, news.nextSibling);
    var cur = 0, tm = 0, items = sec.querySelectorAll('.ts-item'), scr = sec.querySelectorAll('.ts-scr'), dots = sec.querySelectorAll('.ts-dots i'), navs = sec.querySelectorAll('.ts-nav span');
    var go = function(i){ cur = (i + S.length) % S.length;
      [items, scr, dots, navs].forEach(function(L){ Array.prototype.forEach.call(L, function(e, k){ e.classList.toggle('on', k === cur); }); });
      Array.prototype.forEach.call(items, function(e, k){ e.setAttribute('aria-selected', k === cur ? 'true' : 'false'); var b = e.querySelector('i'); if (b && k === cur){ b.style.display = 'none'; void b.offsetWidth; b.style.display = ''; } });
      clearTimeout(tm); tm = setTimeout(function(){ go(cur + 1); }, 5500); };
    Array.prototype.forEach.call(items, function(e){ e.addEventListener('click', function(){ go(+e.getAttribute('data-i')); }); });
    var vis = true; try { new IntersectionObserver(function(en){ vis = en[0].isIntersecting; if (!vis) clearTimeout(tm); else go(cur); }).observe(sec); } catch(e){}
    go(0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
