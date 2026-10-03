/* ═══════════════════════════════════════════════════════════════
   safe-home-plus.js — SAFE 홈페이지 덧붙임 (2026-10-03 · 5판 — 학회 로고·탭 아이콘·푸터 글)
     ① 기록 — 방문 · 공지 봄 · 첨부 받음 · 보고서 받음 · 유입(검색·SNS·AI·도메인·캠페인)
     ② 하단 로고 띠 — 학회원들이 진출한 곳 (천천히 회전)
     ③ 임원진 대시보드 — 개요 · 유입 · 검색 · AI 검색 · 다운로드 · 상세 기록 · SEO 점검 · 로고
   ───────────────────────────────────────────────────────────────
   붙이는 법 (홈페이지 index.html)
     1) Supabase 클라이언트를 만든 <뒤에>
          <script src="safe-home-plus.js"></script>
          SAFEPlus.init({ sb: 클라이언트, visitorKey: '<지금 쓰는 방문자 번호 키>',
                          stats: '#shpStats', logos: '#shpLogos' });
     2) 예전 record_visit 부르는 줄은 지웁니다 (방문 기록은 이제 site_track)
     3) 공지 카드에 data-news-id="${n.id}", 보고서 카드에 data-report-id="${r.id}"
     4) 임원 로그인 뒤 SAFEPlus.showStats(), 로그아웃 때 SAFEPlus.hideStats()
     5) 기수 선택 기본값: SAFEPlus.latestGen() → 가장 큰 기수 (3기)
     6) (선택) Amplitude — 학회원 실습용 «두 번째 창». init 에 amplitudeKey 만 넣으면 켜짐:
          amplitudeKey: '<프로젝트 API 키 — 브라우저용 공개 키>',
          amplitudeLocation: true,   // false 면 IP 를 안 보내 도시·나라 칸이 빔
          amplitudeUrl: '<Amplitude 대시보드 주소 — 임원 화면에 바로가기>'
        하단에 SAFEPlus.renderAnalyticsNotice('#shpNotice') 로 한 줄 고지.
     8) 학회 로고(위쪽 SF 마크)와 탭 아이콘을 임원이 대시보드 «로고» 탭에서 <따로> 바꾸게:
          brand: { mark: '.nav-logo .logo-mark', favicon: true }
          (about.logo_url = 사이트 로고 · about.icon_url = 탭 아이콘 · 파일은 logos 버킷의 brand/ 아래 · 비우면 원래대로)
     7) 로고 띠 선택값 — logosTitle: '띠 제목', logosNote: '권리 안내 한 줄' ('' 이면 없음),
          logoGray: true 면 평소 흑백·마우스 올리면 컬러 (기본은 원래 색 — 로고 색을 바꾸지 말라는
          브랜드 규정이 흔해서), logoSeconds: 로고 하나당 초 (기본 4).
   ⚠️ 남기는 것: 종류 · 글 번호 · 방문자 번호(이 브라우저의 임의 글자) · 유입 «분류» ·
      들어온 사이트 «도메인» · 캠페인 태그 · 기기 종류.
      IP · 위치 · 이름 · 학번 · 원래 주소(검색어·글 번호)는 안 보냅니다.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ── 이름표 · 색 ─────────────────────────────────────────────────
  //  ⚠️ 색은 «무엇인지(정체)» 를 나타냅니다 — 같은 것은 어느 탭에서나 같은 색.
  //     팔레트는 색약 시뮬레이션까지 검사한 값입니다 (dataviz validate_palette — 통과).
  var C = {
    visitor: '#2a78d6',   // 방문자
    notice:  '#eb6834',   // 공지 첨부 (지원서)
    report:  '#1baf7a',   // 보고서
    ai:      '#4a3aa7',   // AI 에서 온 사람 · 노출
    other:   '#b9b8b1'    // 기타 (분류가 아닌 «나머지»)
  };
  var GROUPS = [   // 유입 묶음 — 이 순서가 색약 안전 순서입니다 (바꾸지 마세요)
    { k: 'search', label: '검색',     color: '#2a78d6' },
    { k: 'sns',    label: 'SNS·커뮤니티', color: '#eb6834' },
    { k: 'ai',     label: 'AI',       color: '#4a3aa7' },
    { k: 'direct', label: '직접',     color: '#eda100' },
    { k: 'link',   label: '링크·QR',  color: '#e87ba4' },
    { k: 'other',  label: '기타',     color: '#b9b8b1' }
  ];
  var SRC = {   // 출처 → [이름, 묶음]
    google: ['구글', 'search'], naver: ['네이버', 'search'], daum: ['다음', 'search'], bing: ['빙', 'search'],
    instagram: ['인스타그램', 'sns'], kakao: ['카카오톡', 'sns'], everytime: ['에브리타임', 'sns'],
    facebook: ['페이스북', 'sns'], x: ['X (트위터)', 'sns'], threads: ['스레드', 'sns'],
    youtube: ['유튜브', 'sns'], linkedin: ['링크드인', 'sns'],
    chatgpt: ['ChatGPT', 'ai'], perplexity: ['Perplexity', 'ai'], gemini: ['Gemini', 'ai'],
    copilot: ['Copilot', 'ai'], claude: ['Claude', 'ai'], wrtn: ['뤼튼', 'ai'], deepseek: ['DeepSeek', 'ai'],
    grok: ['Grok', 'ai'], ai: ['기타 AI', 'ai'],
    direct: ['직접 입력·즐겨찾기', 'direct'],
    qr: ['QR 코드 (포스터)', 'link'], email: ['메일', 'link'], notion: ['노션', 'link'], terminal: ['SAFE 터미널', 'link'],
    internal: ['홈페이지 안', 'other'], other: ['기타 사이트', 'other']
  };
  var SRC_ALIAS = {
    ig: 'instagram', insta: 'instagram', instagram: 'instagram', 'instagram.com': 'instagram',
    kakao: 'kakao', kakaotalk: 'kakao', kt: 'kakao', katalk: 'kakao',
    everytime: 'everytime', et: 'everytime', evt: 'everytime', 'everytime.kr': 'everytime',
    naver: 'naver', google: 'google', daum: 'daum', bing: 'bing',
    youtube: 'youtube', yt: 'youtube', facebook: 'facebook', fb: 'facebook', x: 'x', twitter: 'x',
    threads: 'threads', linkedin: 'linkedin', notion: 'notion',
    chatgpt: 'chatgpt', 'chatgpt.com': 'chatgpt', openai: 'chatgpt', perplexity: 'perplexity', 'perplexity.ai': 'perplexity',
    gemini: 'gemini', copilot: 'copilot', claude: 'claude', 'claude.ai': 'claude', wrtn: 'wrtn', deepseek: 'deepseek', grok: 'grok',
    terminal: 'terminal', qr: 'qr', poster: 'qr', email: 'email', mail: 'email', newsletter: 'email', direct: 'direct'
  };
  var HOST_RULES = [
    [/(^|\.)instagram\.com$/, 'instagram'], [/(^|\.)kakao\.(com|co\.kr)$|(^|\.)kakaocdn\.net$/, 'kakao'],
    [/(^|\.)everytime\.kr$/, 'everytime'], [/(^|\.)naver\.(com|me)$/, 'naver'],
    //  ⚠️ AI 가 검색 엔진보다 <먼저> — gemini.google.com 이 «구글» 로 잡히지 않게
    [/^gemini\.google\.com$|^bard\.google\.com$/, 'gemini'], [/^copilot\.microsoft\.com$/, 'copilot'],
    [/(^|\.)google\.[a-z.]+$/, 'google'], [/(^|\.)daum\.net$/, 'daum'], [/(^|\.)bing\.com$/, 'bing'],
    [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube'], [/(^|\.)facebook\.com$|^fb\.(me|com)$/, 'facebook'],
    [/(^|\.)x\.com$|(^|\.)twitter\.com$|^t\.co$/, 'x'], [/(^|\.)threads\.(net|com)$/, 'threads'],
    [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin'], [/(^|\.)notion\.(so|site)$/, 'notion'],
    [/(^|\.)chatgpt\.com$|(^|\.)chat\.openai\.com$/, 'chatgpt'], [/(^|\.)perplexity\.ai$/, 'perplexity'],
    [/(^|\.)claude\.ai$/, 'claude'], [/(^|\.)wrtn\.(ai|io)$/, 'wrtn'], [/(^|\.)deepseek\.com$/, 'deepseek'],
    [/(^|\.)grok\.com$/, 'grok'], [/(^|\.)(you\.com|phind\.com|poe\.com|meta\.ai)$/, 'ai'],
    [/(^|\.)(mail\.[a-z.]+|outlook\.(com|live\.com))$/, 'email']
  ];
  var DEV_LABEL = { mobile: '휴대폰', pc: 'PC', tablet: '태블릿', unknown: '모름' };
  var DEV_ORDER = ['mobile', 'pc', 'tablet', 'unknown'];
  var DEV_COLOR = { mobile: '#2a78d6', pc: '#eb6834', tablet: '#1baf7a', unknown: '#b9b8b1' };
  var TYPE_LABEL = { recruit: '모집', event: '행사', notice: '공지' };
  var CAT_LABEL = { economy: '경제', industry: '산업' };
  var KIND = {
    visit: ['방문', C.visitor], notice_view: ['공지 봄', '#9ec5f4'],
    notice_file: ['첨부 받음', C.notice], report_open: ['보고서 받음', C.report]
  };
  var WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  var VIS_RE = /^[A-Za-z0-9_.:-]{6,64}$/;
  var BRAND_TERMS = ['safe sogang', 'sogang safe', '서강대 safe', '서강 safe', 'safe 서강대',
                     '서강대 금융 학회', '서강대 금융학회', '서강대 경제 학회', '서강대 투자 학회', '세이프 학회'];

  var cfg = {}, sb = null, VID = null, SRC_NOW = null, HOST_NOW = null, CMP_NOW = null, DEV = null;
  var seen = {}, timers = {}, io = null;

  // ── 작은 도구 ──────────────────────────────────────────────
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(x) { return (Number(x) || 0).toLocaleString('ko-KR'); }
  function pct(a, b, d) { if (!b) return '—'; var p = a / b * 100; return (d === 0 ? Math.round(p) : Math.round(p * 10) / 10) + '%'; }
  function el(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function kst(ts, withTime, withYear) {
    if (!ts) return '—';
    var d = new Date(ts); if (isNaN(d)) return '—';
    var o = { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' };
    if (withYear) o.year = 'numeric';
    if (withTime) { o.hour = '2-digit'; o.minute = '2-digit'; o.hour12 = false; }
    return new Intl.DateTimeFormat('ko-KR', o).format(d).replace(/\.\s?/g, '.').replace(/\.$/, '').replace(/\.(\d\d:)/, ' $1');
  }
  function md(d) { return String(d || '').slice(5).replace('-', '.'); }
  function entryYY(v) {
    var d = String(v == null ? '' : v).replace(/\D/g, '');
    if (d.length >= 4 && /^(19|20)\d\d$/.test(d.slice(0, 4))) return d.slice(2, 4);
    return d.slice(0, 2);
  }
  function srcName(k) { return (SRC[k] || [k || '기타'])[0]; }
  function srcGroup(k) { return (SRC[k] || [0, 'other'])[1]; }
  function groupOf(k) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].k === k) return GROUPS[i]; return GROUPS[5]; }
  function dot(color, cls) { return '<i class="shp-dot ' + (cls || '') + '" style="background:' + color + '"></i>'; }
  function niceMax(v) {
    if (v <= 4) return 4;
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
  }

  // ── 방문자 번호 · 유입 · 기기 ─────────────────────────────────
  function visitorId() {
    var keys = [cfg.visitorKey, 'safe_visitor', 'safe_visitor_id', 'safe_vid', 'visitor_id'].filter(Boolean);
    for (var i = 0; i < keys.length; i++) {
      var v = store(keys[i]);
      if (!v) continue;
      if (VIS_RE.test(v)) return v;
      v = v.replace(/[^A-Za-z0-9_.:-]/g, '_').slice(0, 64);
      while (v.length < 6) v += '_';
      return v;
    }
    var a = '';
    try {
      var b = new Uint8Array(16); crypto.getRandomValues(b);
      for (var j = 0; j < b.length; j++) a += (b[j] % 36).toString(36);
    } catch (e) { a = Math.random().toString(36).slice(2) + Date.now().toString(36); }
    var id = 'v_' + a;
    store(cfg.visitorKey || 'safe_visitor', id);
    return id;
  }

  function hostOf(referrer) {
    try { return new URL(referrer).hostname.toLowerCase().replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function classify(search, referrer, ua, selfHost, terminalMatch) {
    var p; try { p = new URLSearchParams(search || ''); } catch (e) { p = null; }
    var tag = p ? (p.get('utm_source') || p.get('src') || p.get('from') || '') : '';
    tag = tag.toLowerCase().trim().replace(/^www\./, '');
    if (tag) {
      if (SRC_ALIAS[tag]) return SRC_ALIAS[tag];
      for (var r = 0; r < HOST_RULES.length; r++) if (HOST_RULES[r][0].test(tag)) return HOST_RULES[r][1];
      return 'other';
    }
    ua = ua || '';
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/KAKAOTALK/i.test(ua)) return 'kakao';
    if (/everytime/i.test(ua)) return 'everytime';
    if (/NAVER\(inapp/i.test(ua)) return 'naver';
    if (/FBAN|FBAV/.test(ua)) return 'facebook';
    if (!referrer) return 'direct';
    var h = hostOf(referrer); if (!h) return 'other';
    if (terminalMatch && terminalMatch.test(referrer)) return 'terminal';
    if (selfHost && h === String(selfHost).toLowerCase().replace(/^www\./, '')) return 'internal';
    for (var i = 0; i < HOST_RULES.length; i++) if (HOST_RULES[i][0].test(h)) return HOST_RULES[i][1];
    return 'other';
  }
  //  들어온 사이트 — <도메인만>. 같은 사이트·주소 없음이면 비움.
  function refHost(referrer, selfHost) {
    var h = hostOf(referrer || '');
    if (!h || h === String(selfHost || '').toLowerCase().replace(/^www\./, '')) return null;
    return /^[a-z0-9.-]{3,100}$/.test(h) ? h : null;
  }
  function campaignOf(search) {
    var p; try { p = new URLSearchParams(search || ''); } catch (e) { return null; }
    var c = (p.get('utm_campaign') || p.get('c') || '').trim();
    return c ? c.slice(0, 60) : null;
  }
  function deviceOf(ua, touch) {
    ua = ua || '';
    if (/iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
        (/Macintosh/i.test(ua) && (touch || 0) > 1)) return 'tablet';
    if (/Mobi|iPhone|iPod|Android|Windows Phone/i.test(ua)) return 'mobile';
    return 'pc';
  }
  //  공유된 주소에 ?src=instagram 이 붙어 다니면 카톡으로 받은 사람도 «인스타» 로 셉니다
  //  — 읽은 뒤 주소창에서만 뗍니다 (화면은 그대로)
  function stripTags() {
    try {
      var u = new URL(location.href), hit = false;
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'from', 'c'].forEach(function (k) {
        if (u.searchParams.has(k)) { u.searchParams.delete(k); hit = true; }
      });
      if (hit) history.replaceState(history.state, '', u.pathname + (u.search || '') + u.hash);
    } catch (e) {}
  }

  // ── Amplitude (학회원 실습용 «두 번째 창») ────────────────────────
  //  ⚠️ 공식 숫자는 Supabase 대시보드가 기준입니다. Amplitude 는 같은 사건을 <같이> 보내
  //     학회원이 퍼널·리텐션·유입별 전환을 직접 만들어 보게 하는 용도.
  //  ⚠️ 보내는 것: 사건 이름 + 공지·보고서 번호·제목 + 출처 분류·캠페인 + Amplitude 가
  //     스스로 붙이는 브라우저·OS·(켜면) IP 로 추정한 도시. 이름·학번·로그인 정보는 안 보냅니다.
  //  ⚠️ 끈 것: 클릭한 글자·폼 입력(관리자 로그인 창이 있어서) · 원래 주소 통째(검색어가 섞임).
  //  ⚠️ 버전을 고정하고 무결성 해시(SRI)를 붙여 받습니다 — CDN 쪽 파일이 바뀌면 실행 안 됨.
  var AMP_VER = '2.47.2';
  var AMP_URL = 'https://cdn.jsdelivr.net/npm/@amplitude/analytics-browser@' + AMP_VER + '/lib/scripts/amplitude-min.js';
  var AMP_SRI = 'sha384-RTQybE5H4H6uCtC3gXx2Y7xeDTADZHEZf8qf6y0WeZbtGGVNpYEailMtUOgAA93+';
  var AMP_EVENT = { visit: 'Visit', notice_view: 'Notice Viewed', notice_file: 'Attachment Downloaded', report_open: 'Report Downloaded' };
  var AMP = { ready: null, meta: null };
  function officerBrowser() { return store('shp_officer') === '1'; }
  function ampLoad() {
    if (!cfg.amplitudeKey) return Promise.resolve(null);
    if (AMP.ready) return AMP.ready;
    AMP.ready = new Promise(function (res) {
      if (window.amplitude && window.amplitude.init && window.amplitude.__shp) return res(window.amplitude);
      var s = document.createElement('script');
      s.src = cfg.amplitudeSrc || AMP_URL; s.async = true; s.crossOrigin = 'anonymous';
      if (!cfg.amplitudeSrc) s.integrity = AMP_SRI;
      s.onload = function () { res(window.amplitude && window.amplitude.init ? window.amplitude : null); };
      s.onerror = function () { res(null); };
      (document.head || document.documentElement).appendChild(s);
    }).then(function (amp) {
      if (!amp) return null;
      try {
        amp.init(cfg.amplitudeKey, undefined, {
          deviceId: VID,                         //  우리 방문자 번호와 같게 — 두 창의 숫자를 맞춰 볼 수 있게
          serverZone: cfg.amplitudeZone || 'US',
          identityStorage: 'localStorage',       //  쿠키 안 씀
          optOut: officerBrowser(),              //  임원이 쓰는 브라우저는 빼고 셈
          trackingOptions: { ipAddress: cfg.amplitudeLocation !== false, language: true, platform: true },
          autocapture: { attribution: false, pageViews: true, sessions: true, fileDownloads: false,
                         formInteractions: false, elementInteractions: false, frustrationInteractions: false,
                         networkTracking: false, webVitals: false, performanceTracking: false }
        });
        amp.__shp = 1;
        //  처음 들어온 출처 — 사람 속성으로 한 번만 (Amplitude 의 «첫 유입» 분석 실습용)
        if (amp.Identify && amp.identify) {
          var idf = new amp.Identify();
          idf.setOnce('first_source', SRC_NOW); idf.setOnce('first_source_group', srcGroup(SRC_NOW));
          if (CMP_NOW) idf.setOnce('first_campaign', String(CMP_NOW).slice(0, 30));
          amp.identify(idf);
        }
      } catch (e) { if (cfg.debug) console.warn('[SAFEPlus] amplitude', e); return null; }
      return amp;
    });
    return AMP.ready;
  }
  function ampMeta() {   //  공지·보고서 제목 (방문자도 읽는 공개 표) — 한 번만 받음
    if (AMP.meta) return AMP.meta;
    var pick = function (r) { return r && !r.error && r.data ? r.data : []; };
    AMP.meta = Promise.all([
      Promise.resolve(sb.from('news').select('id,title,type,file_name')).then(pick, function () { return []; }),
      Promise.resolve(sb.from('reports').select('id,title,gen,category')).then(pick, function () { return []; })
    ]).then(function (rs) {
      var m = { news: {}, reports: {} };
      rs[0].forEach(function (x) { m.news[x.id] = x; }); rs[1].forEach(function (x) { m.reports[x.id] = x; });
      return m;
    });
    return AMP.meta;
  }
  function ampTrack(kind, ref) {
    if (!cfg.amplitudeKey || !AMP_EVENT[kind]) return Promise.resolve(false);
    return Promise.all([ampLoad(), ref != null && kind !== 'visit' ? ampMeta() : null]).then(function (rs) {
      var amp = rs[0], m = rs[1]; if (!amp) return false;
      var p = { source: SRC_NOW, source_group: srcGroup(SRC_NOW) };
      if (HOST_NOW) p.referrer_host = HOST_NOW;
      if (CMP_NOW) p.campaign = String(CMP_NOW).slice(0, 30);
      var id = ref == null ? null : Number(ref);
      if (kind === 'notice_view' || kind === 'notice_file') {
        var n = (m && m.news[id]) || {};
        p.notice_id = id; if (n.title) p.notice_title = n.title; if (n.type) p.notice_type = TYPE_LABEL[n.type] || n.type;
        if (kind === 'notice_file' && n.file_name) p.file_name = n.file_name;
      } else if (kind === 'report_open') {
        var r = (m && m.reports[id]) || {};
        p.report_id = id; if (r.title) p.report_title = r.title;
        if (r.gen != null) p.report_gen = r.gen + '기'; if (r.category) p.report_category = CAT_LABEL[r.category] || r.category;
      }
      try { amp.track(AMP_EVENT[kind], p); } catch (e) { return false; }
      return true;
    }, function () { return false; });
  }
  //  임원 로그인 → 이 브라우저는 Amplitude 에서 빼고 셈 (Supabase 기록은 서버가 로그인으로 따로 뺌)
  function setOfficer(on) {
    if (on) store('shp_officer', '1'); else { try { localStorage.removeItem('shp_officer'); } catch (e) {} }
    if (AMP.ready) AMP.ready.then(function (amp) { if (amp && amp.setOptOut) amp.setOptOut(!!on); });
  }
  function renderAnalyticsNotice(target, custom) {
    var box = el(target); if (!box) return;
    box.classList.add('shp-notice');
    //  임원이 «소개글 수정» 에서 문구를 적어 두면 그 글로 (비어 있으면 기본 문구)
    if (custom && String(custom).trim()) { box.textContent = String(custom).trim(); return; }
    box.textContent = cfg.amplitudeKey
      ? '방문 통계 안내 — 이 사이트는 익명 방문 기록을 학회 서버와 Amplitude(미국)에 남깁니다. 이름·학번은 보내지 않으며' +
        (cfg.amplitudeLocation !== false ? ', 위치는 IP 로 추정한 도시 단위까지만 봅니다.' : ', IP·위치도 보내지 않습니다.')
      : '방문 통계 안내 — 이 사이트는 익명 방문 기록을 학회 서버에 남깁니다. IP·위치·이름·학번은 남기지 않습니다.';
  }

  // ── 기록 ─────────────────────────────────────────────────────
  function track(kind, ref) {
    ampTrack(kind, ref);
    if (!sb || !VID) return Promise.resolve(false);
    var args = { p_kind: kind, p_ref: ref == null || ref === '' ? null : Number(ref),
                 p_visitor: VID, p_source: SRC_NOW, p_device: DEV, p_host: HOST_NOW, p_campaign: CMP_NOW };
    try {
      return Promise.resolve(sb.rpc('site_track', args)).then(function (r) {
        if (r && r.error && cfg.debug) console.warn('[SAFEPlus] site_track', r.error);
        return !(r && r.error);
      }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  function visibleEnough(e) {
    if (!e.isIntersecting) return false;
    if (e.intersectionRatio >= 0.5) return true;
    var vh = window.innerHeight || 800;
    return e.intersectionRect && e.intersectionRect.height >= vh * 0.4;
  }
  function onSee(entries) {
    entries.forEach(function (e) {
      var id = e.target.getAttribute('data-news-id');
      if (!id || seen[id]) return;
      if (visibleEnough(e)) {
        if (!timers[id]) timers[id] = setTimeout(function () {
          timers[id] = null; if (seen[id]) return;
          seen[id] = 1; io && io.unobserve(e.target); track('notice_view', id);
        }, cfg.viewMs || 1500);
      } else if (timers[id]) { clearTimeout(timers[id]); timers[id] = null; }
    });
  }
  function watch(root) {
    if (!io || !root || !root.querySelectorAll) return;
    var list = [].slice.call(root.querySelectorAll('[data-news-id]'));
    if (root.hasAttribute && root.hasAttribute('data-news-id')) list.push(root);
    list.forEach(function (c) { if (c.__shpSeen) return; c.__shpSeen = 1; io.observe(c); });
  }
  function isFileLink(a) {
    var h = a.getAttribute('href') || '';
    return a.hasAttribute('download') ||
      /\.(pdf|docx?|hwpx?|xlsx?|pptx?|zip|txt|png|jpe?g)(\?|#|$)/i.test(h) ||
      /\/storage\/v1\/object\//.test(h) || /^blob:/.test(h) ||
      /(^|\/\/)(drive|docs)\.google\.com\//.test(h) || /^https?:\/\/forms\.gle\//.test(h);
  }
  function onClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var t = e.target && e.target.closest ? e.target : (e.target && e.target.parentElement);
    if (!t || !t.closest) return;
    if (t.closest('.shp-stats')) return;   // 대시보드 안 클릭은 기록 안 함
    var a = t.closest('[data-track]');
    if (a) {
      var k = a.getAttribute('data-track'), ref = a.getAttribute('data-ref');
      if (!ref) { var c = a.closest('[data-news-id],[data-report-id]'); ref = c && (c.getAttribute('data-news-id') || c.getAttribute('data-report-id')); }
      if (k === 'notice_file' || k === 'report_open') track(k, ref);
      return;
    }
    var link = t.closest('a[href]');
    if (!link) return;
    var nc = link.closest('[data-news-id]');
    if (nc) { if (isFileLink(link)) track('notice_file', nc.getAttribute('data-news-id')); return; }
    var rc = link.closest('[data-report-id]');
    if (rc) track('report_open', rc.getAttribute('data-report-id'));
  }

  // ── 최신 기수 (홈페이지 기수 선택 기본값) ─────────────────────────
  //  ⚠️ app_settings 는 로그인한 사람만 읽어서, 방문자 화면은 members 의 가장 큰 기수로 셉니다
  function latestGen() {
    if (!sb) return Promise.resolve(null);
    return Promise.resolve(sb.from('members').select('gen').order('gen', { ascending: false }).limit(1))
      .then(function (r) { return r && !r.error && r.data && r.data[0] ? r.data[0].gen : null; }, function () { return null; });
  }

  // ── ② 로고 띠 ─────────────────────────────────────────────────
  function renderLogos(target) {
    var box = el(target || cfg.logos);
    if (!box || !sb) return Promise.resolve(0);
    return Promise.resolve(sb.from('partner_logos').select('id,name,logo_url,sort').eq('active', true)
      .order('sort', { ascending: true }).order('name', { ascending: true })).then(function (r) {
        var list = (r && !r.error && r.data) || [];
        if (!list.length) { box.innerHTML = ''; box.classList.add('shp-hidden'); return 0; }
        box.classList.remove('shp-hidden'); box.classList.add('shp-logos');
        var item = function (x) {
          var u = String(x.logo_url || '');
          return '<li class="shp-logo">' + (/^https:\/\//.test(u)
            ? '<img src="' + esc(u) + '" alt="' + esc(x.name) + '" loading="lazy" decoding="async">'
            : '<span class="shp-logo-t">' + esc(x.name) + '</span>') + '</li>';
        };
        //  ⚠️ 끊김 없이 돌게 같은 줄을 두 번 — 적으면 늘려서 화면을 채웁니다
        var base = list.slice();
        while (base.length < 10) base = base.concat(list);
        var half = base.map(item).join('');
        var dur = Math.max(30, base.length * (cfg.logoSeconds || 4));
        //  ⚠️ 로고 색: 기본은 <원래 색> 입니다 (색을 바꾸지 말라는 브랜드 규정이 흔함). 흑백은 logoGray: true 로.
        box.classList.toggle('shp-logos-gray', !!cfg.logoGray);
        var note = cfg.logosNote === undefined ? '각 로고의 권리는 해당 회사에 있으며, 학회와의 제휴·후원을 뜻하지 않습니다.' : String(cfg.logosNote || '');
        box.innerHTML = '<div class="shp-logos-h">' + esc(cfg.logosTitle || 'SAFE 출신이 진출한 곳') + '</div>' +
          '<div class="shp-marquee" style="--shp-dur:' + dur + 's">' +
          '<ul class="shp-track">' + half + '</ul>' +
          '<ul class="shp-track shp-track2" aria-hidden="true">' + half + '</ul></div>' +
          (note ? '<div class="shp-logos-n">' + esc(note) + '</div>' : '') +
          '<ul class="shp-logo-list">' + list.map(function (x) { return '<li>' + esc(x.name) + '</li>'; }).join('') + '</ul>';
        return list.length;
      }, function () { return 0; });
  }

  // ── ②-2 학회 로고 (상단 마크 · 탭 아이콘) ─────────────────────────
  //  ⚠️ 학회장: «세이프 로고도 관리자 권한을 통해 바꿀 수 있게 — 인턴/취업처럼».
  //     about.logo_url 이 https 주소면 그 그림을, 비어 있으면 원래 SF 마크를 씁니다.
  //     공유 미리보기 그림(og.png)은 저장소 파일이라 여기서 못 바꿉니다 (크롤러가 고정 주소를 읽음).
  //  ⚠️ 학회장: «탭 부분에 보이는 로고랑 사이트 내 로고랑 다르니까 구분해서» → 두 칸 (logo_url · icon_url)
  var BR = { logo: null, icon: null };
  var BRAND_KINDS = [
    { k: 'logo', col: 'logo_url', label: '사이트 로고', sub: '위쪽 메뉴의 SF 마크 자리 — 정사각형 · 배경 투명 PNG · 256px 이상', none: '기본 SF 마크' },
    { k: 'icon', col: 'icon_url', label: '탭 아이콘',   sub: '브라우저 탭·즐겨찾기의 작은 그림 — 정사각형 PNG 512px (16px 로 줄어도 보이게 단순하게)', none: '기본 logo.png' }
  ];
  function okUrl(u) { return /^https:\/\//.test(String(u || '')) ? String(u) : null; }
  function brandTargets() {
    var b = cfg.brand || {}; var out = [];
    if (b.mark) [].forEach.call(document.querySelectorAll(b.mark), function (e) { out.push(e); });
    return out;
  }
  function applyBrand(logoUrl, iconUrl) {
    BR.logo = okUrl(logoUrl); BR.icon = okUrl(iconUrl);
    brandTargets().forEach(function (e) {
      if (e.__shpOrig === undefined) e.__shpOrig = e.innerHTML;
      if (BR.logo) { e.classList.add('shp-brand-on'); e.innerHTML = '<img class="shp-brand-img" src="' + esc(BR.logo) + '" alt="SAFE 로고" decoding="async">'; }
      else { e.classList.remove('shp-brand-on'); e.innerHTML = e.__shpOrig; }
    });
    if (cfg.brand && cfg.brand.favicon !== false) {
      [].forEach.call(document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]'), function (l) {
        if (l.__shpOrig === undefined) l.__shpOrig = l.getAttribute('href');
        l.setAttribute('href', BR.icon || l.__shpOrig);
      });
    }
  }
  function loadBrand() {
    if (!sb || !cfg.brand) return Promise.resolve(null);
    return Promise.resolve(sb.from('about').select('logo_url,icon_url').eq('id', 1).maybeSingle())
      .then(function (r) { var d = r && !r.error && r.data ? r.data : {}; applyBrand(d.logo_url, d.icon_url); return d; }, function () { return null; });
  }
  function brandPathOf(url) {   //  우리 버킷의 파일이면 저장소 경로를, 아니면 null
    var m = /\/storage\/v1\/object\/public\/logos\/(.+)$/.exec(String(url || '')); return m ? decodeURIComponent(m[1]) : null;
  }
  function saveBrand(col, url) {
    var row = { id: 1 }; row[col] = url || null;
    return Promise.resolve(sb.from('about').upsert(row, { onConflict: 'id' }));
  }

  // ═══════════════════════════════════════════════════════════════
  //  ③ 임원진 대시보드
  // ═══════════════════════════════════════════════════════════════
  var D = { box: null, days: 30, tab: 'overview', site: {}, gsc: {}, log: null, seq: 0, charts: {}, seo: null };
  var TABS = [
    ['overview', '개요'], ['traffic', '유입'], ['search', '검색 (구글)'], ['ai', 'AI 검색'],
    ['downloads', '다운로드'], ['log', '상세 기록'], ['seo', 'SEO 점검'], ['logos', '로고']
  ];

  // ── 말풍선 (하나로 모든 차트) ──────────────────────────────────
  var tipEl = null;
  function tip() {
    if (tipEl) return tipEl;
    tipEl = document.createElement('div'); tipEl.className = 'shp-tip'; tipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tipEl); return tipEl;
  }
  function tipShow(x, y, rows, title) {
    var t = tip(); t.textContent = '';
    if (title) { var h = document.createElement('div'); h.className = 'shp-tip-h'; h.textContent = title; t.appendChild(h); }
    rows.forEach(function (r) {
      var row = document.createElement('div'); row.className = 'shp-tip-r';
      if (r.color) { var k = document.createElement('i'); k.className = 'shp-tip-k'; k.style.background = r.color; row.appendChild(k); }
      var v = document.createElement('b'); v.textContent = r.value; row.appendChild(v);
      var n = document.createElement('span'); n.textContent = r.name; row.appendChild(n);
      t.appendChild(row);
    });
    t.style.display = 'block';
    var w = t.offsetWidth, hgt = t.offsetHeight, vw = document.documentElement.clientWidth;
    var left = Math.min(vw - w - 8, Math.max(8, x + 14)), top = y - hgt - 12;
    if (top < 8) top = y + 16;
    t.style.left = left + 'px'; t.style.top = (top + window.scrollY) + 'px';
  }
  function tipHide() { if (tipEl) tipEl.style.display = 'none'; }
  function bindTips(root) {
    //  data-tip="제목|값|이름|색" 여러 줄은 ¶ 로
    function show(ev) {
      var n = ev.target.closest && ev.target.closest('[data-tip]'); if (!n || !root.contains(n)) return;
      var parts = n.getAttribute('data-tip').split('¶'), title = parts.shift();
      var rows = parts.map(function (p) { var a = p.split('|'); return { value: a[0], name: a[1] || '', color: a[2] || '' }; });
      var r = n.getBoundingClientRect();
      var x = ev.clientX != null && ev.type !== 'focusin' ? ev.clientX : r.left + r.width / 2;
      var y = ev.clientY != null && ev.type !== 'focusin' ? ev.clientY : r.top;
      tipShow(x, y, rows, title);
    }
    root.addEventListener('pointermove', show);
    root.addEventListener('focusin', show);
    root.addEventListener('pointerleave', tipHide);
    root.addEventListener('focusout', tipHide);
  }
  function tipAttr(title, rows) {
    return ' tabindex="0" data-tip="' + esc([title].concat(rows.map(function (r) { return [r[0], r[1] || '', r[2] || ''].join('|'); })).join('¶')) + '"';
  }

  // ── 차트 조각 ─────────────────────────────────────────────────
  //  선 그래프 — SVG 는 칸에 맞춰 늘어나므로 글자·점은 HTML 로 얹습니다 (늘어나면 찌그러짐)
  function lineChart(id, dates, series, opt) {
    opt = opt || {};
    var n = dates.length, max = 0;
    series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
    var top = niceMax(max), H = opt.height || 180;
    var X = function (i) { return n <= 1 ? 500 : i / (n - 1) * 1000; };
    var Y = function (v) { return 1000 - v / top * 1000; };
    D.charts[id] = { dates: dates, series: series, unit: opt.unit || '명' };
    var svg = '<svg class="shp-lc-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">';
    series.forEach(function (s, si) {
      var pts = s.values.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); });
      if (si === 0 && opt.area !== false)
        svg += '<path d="M' + X(0) + ',1000 L' + pts.join(' L') + ' L' + X(n - 1) + ',1000 Z" fill="' + s.color + '" fill-opacity="0.10"/>';
      svg += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="2" ' +
             'vector-effect="non-scaling-stroke" stroke-linejoin="round" stroke-linecap="round"/>';
    });
    svg += '</svg>';
    var ends = series.map(function (s) {
      var v = s.values[n - 1] || 0;
      return '<i class="shp-lc-end" style="left:100%;top:' + (Y(v) / 10) + '%;background:' + s.color + '"></i>';
    }).join('');
    var grid = [0, 0.5, 1].map(function (f) {
      return '<i class="shp-lc-g" style="top:' + (f * 100) + '%"></i><span class="shp-lc-yl" style="top:' + (f * 100) + '%">' + num(top * (1 - f)) + '</span>';
    }).join('');
    var xl = [0, Math.floor((n - 1) / 2), n - 1].filter(function (v, i, a) { return a.indexOf(v) === i && dates[v]; })
      .map(function (i) { return '<span style="left:' + (X(i) / 10) + '%">' + esc(md(dates[i])) + '</span>'; }).join('');
    var legend = series.length > 1 ? '<div class="shp-legend">' + series.map(function (s) {
      return '<span><i class="shp-key-line" style="background:' + s.color + '"></i>' + esc(s.name) +
             (s.total != null ? ' <b>' + num(s.total) + (opt.unit || '명') + '</b>' : '') + '</span>';
    }).join('') + '</div>' : '';
    var table = '<details class="shp-tv"><summary>표로 보기</summary><div class="shp-scroll"><table class="shp-tbl sm"><thead><tr><th class="l">날짜</th>' +
      series.map(function (s) { return '<th>' + esc(s.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      dates.map(function (d, i) { return '<tr><td class="l">' + esc(d) + '</td>' + series.map(function (s) { return '<td>' + num(s.values[i]) + '</td>'; }).join('') + '</tr>'; }).reverse().join('') +
      '</tbody></table></div></details>';
    return legend + '<div class="shp-lc" data-chart="' + id + '" style="--h:' + H + 'px">' +
      '<div class="shp-lc-plot">' + grid + svg + ends + '<i class="shp-lc-xh"></i><i class="shp-lc-hit" tabindex="0" aria-label="날마다 값 — 왼쪽·오른쪽 화살표로 이동"></i></div>' +
      '<div class="shp-lc-x">' + xl + '</div></div>' + (opt.table === false ? '' : table);
  }
  function bindLineCharts(root) {
    [].forEach.call(root.querySelectorAll('.shp-lc'), function (c) {
      var d = D.charts[c.getAttribute('data-chart')]; if (!d) return;
      var plot = c.querySelector('.shp-lc-plot'), xh = c.querySelector('.shp-lc-xh'), hit = c.querySelector('.shp-lc-hit');
      var cur = d.dates.length - 1;
      function at(i, cx, cy) {
        cur = Math.max(0, Math.min(d.dates.length - 1, i));
        var leftPct = d.dates.length <= 1 ? 50 : cur / (d.dates.length - 1) * 100;
        xh.style.left = leftPct + '%'; xh.style.display = 'block';
        var r = plot.getBoundingClientRect();
        tipShow(cx != null ? cx : r.left + r.width * leftPct / 100, cy != null ? cy : r.top + 20,
          d.series.map(function (s) { return { value: num(s.values[cur]) + d.unit, name: s.name, color: s.color }; }), d.dates[cur]);
      }
      hit.addEventListener('pointermove', function (ev) {
        var r = plot.getBoundingClientRect();
        at(Math.round((ev.clientX - r.left) / r.width * (d.dates.length - 1)), ev.clientX, ev.clientY);
      });
      hit.addEventListener('pointerleave', function () { xh.style.display = 'none'; tipHide(); });
      hit.addEventListener('focus', function () { at(cur); });
      hit.addEventListener('blur', function () { xh.style.display = 'none'; tipHide(); });
      hit.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowLeft') { at(cur - 1); ev.preventDefault(); }
        if (ev.key === 'ArrowRight') { at(cur + 1); ev.preventDefault(); }
      });
    });
  }
  function spark(values, color) {
    var n = values.length; if (!n) return '';
    var max = Math.max.apply(null, [1].concat(values));
    var pts = values.map(function (v, i) { return (n <= 1 ? 50 : i / (n - 1) * 100).toFixed(2) + ',' + (28 - v / max * 26).toFixed(2); }).join(' ');
    return '<svg class="shp-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M0,30 L' + pts.replace(/ /g, ' L') + ' L100,30 Z" fill="' + color + '" fill-opacity="0.12"/>' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function hbars(rows, unit) {   // rows: {label, value, color, extra, dotColor}
    if (!rows.length) return '<div class="shp-empty sm">아직 기록이 없습니다.</div>';
    var max = Math.max.apply(null, [1].concat(rows.map(function (r) { return r.value; })));
    return '<div class="shp-hb">' + rows.map(function (r) {
      var w = Math.max(1.5, r.value / max * 100);
      return '<div class="shp-hb-r"' + tipAttr(r.label, [[num(r.value) + (unit || '명'), r.tipName || '', r.color]].concat(r.tipMore || [])) + '>' +
        '<span class="shp-hb-l">' + (r.dotColor ? dot(r.dotColor) : '') + esc(r.label) + '</span>' +
        '<span class="shp-hb-t"><span style="width:' + w + '%;background:' + r.color + '"></span></span>' +
        '<span class="shp-hb-v">' + num(r.value) + (r.extra ? '<i>' + esc(r.extra) + '</i>' : '') + '</span></div>';
    }).join('') + '</div>';
  }
  function stack(parts, unit) {   // parts: {label, value, color}
    var tot = parts.reduce(function (a, p) { return a + p.value; }, 0);
    if (!tot) return '<div class="shp-empty sm">아직 기록이 없습니다.</div>';
    var vis = parts.filter(function (p) { return p.value > 0; });
    return '<div class="shp-stack">' + vis.map(function (p) {
      return '<span style="flex:' + p.value + ';background:' + p.color + '"' +
        tipAttr(p.label, [[num(p.value) + (unit || '명'), pct(p.value, tot), p.color]]) + '></span>';
    }).join('') + '</div><div class="shp-legend sm">' + vis.map(function (p) {
      return '<span>' + dot(p.color, 'sq') + esc(p.label) + ' <b>' + pct(p.value, tot, 0) + '</b> <em>' + num(p.value) + '</em></span>';
    }).join('') + '</div>';
  }
  //  늘었나 줄었나 — 좋은 쪽이면 초록 ▲ · 나쁜 쪽이면 빨강 ▼ (색만이 아니라 화살표·글자로도)
  function delta(cur, prev, complete, lowerIsBetter, label) {
    if (!complete || prev == null) return '<span class="shp-delta na" title="비교할 앞 기간 기록이 부족합니다">비교 전</span>';
    if (!prev && !cur) return '<span class="shp-delta na">변화 없음</span>';
    if (!prev) return '<span class="shp-delta up">새로 생김</span>';
    var ch = (cur - prev) / prev * 100, up = ch > 0;
    if (Math.abs(ch) < 0.5) return '<span class="shp-delta na">변화 없음</span>';
    var good = lowerIsBetter ? !up : up;
    return '<span class="shp-delta ' + (good ? 'good' : 'bad') + '" title="' + esc(label || '앞 기간') + '보다">' +
      (up ? '▲ ' : '▼ ') + Math.abs(Math.round(ch)) + '%</span>';
  }
  function tile(o) {   // {label, value, unit, color, sub, delta, spark}
    return '<div class="shp-tile">' +
      '<span class="shp-tile-l">' + (o.color ? dot(o.color) : '') + esc(o.label) + '</span>' +
      '<div class="shp-tile-m"><b class="shp-tile-v">' + esc(o.value) + (o.unit ? '<small>' + esc(o.unit) + '</small>' : '') + '</b>' +
      (o.spark || '') + '</div>' +
      '<span class="shp-tile-s">' + (o.delta || '') + (o.sub ? '<i>' + esc(o.sub) + '</i>' : '') + '</span></div>';
  }
  function card(title, sub, body, cls) {
    //  ⚠️ section·header·nav 같은 태그는 홈페이지 전체 CSS 가 꾸며 놓았을 수 있어 div 만 씁니다
    return '<div class="shp-card ' + (cls || '') + '"><div class="shp-ch"><h3>' + esc(title) + '</h3>' +
      (sub ? '<span>' + sub + '</span>' : '') + '</div>' + body + '</div>';
  }

  // ── 데이터 받기 ────────────────────────────────────────────────
  function rpc(name, args) {
    return Promise.resolve(sb.rpc(name, args)).then(function (r) {
      if (!r || r.error) throw (r && r.error) || new Error('응답 없음');
      return typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    });
  }
  function loadSite(days) {
    if (D.site[days]) return Promise.resolve(D.site[days]);
    return rpc('site_stats', { p_days: days }).then(function (d) { D.site[days] = d; return d; });
  }
  function loadGsc(days) {
    var gd = days === 30 ? 28 : days;    // 서치 콘솔 화면과 같게 28일
    if (D.gsc[gd]) return Promise.resolve(D.gsc[gd]);
    return rpc('gsc_stats', { p_days: gd }).then(function (d) { D.gsc[gd] = d; return d; },
      function (e) { return { connected: false, missing: true, error: String(e && e.message || e) }; });
  }

  // ── 탭: 개요 ───────────────────────────────────────────────────
  function tabOverview(d) {
    var p = d.prev || {}, cmp = !!p.complete, lbl = '앞 ' + d.days + '일';
    var daily = d.daily || [], dates = daily.map(function (x) { return x.d; });
    var col = function (k) { return daily.map(function (x) { return x[k] || 0; }); };
    var f = d.funnel || {};
    var h = '<div class="shp-tiles">' +
      tile({ label: '방문자', value: num(d.visitors), unit: '명', color: C.visitor,
             delta: delta(d.visitors, p.visitors, cmp, false, lbl), sub: '새로 ' + num(d.new_visitors) + ' · 다시 ' + num(d.returning),
             spark: spark(col('visitors'), C.visitor) }) +
      tile({ label: '공지 첨부 받은 사람', value: num(d.downloads_people), unit: '명', color: C.notice,
             delta: delta(d.downloads_people, p.downloads_people, cmp, false, lbl), sub: '누른 수 ' + num(d.downloads),
             spark: spark(col('downloads'), C.notice) }) +
      tile({ label: '보고서 받은 사람', value: num(d.report_people), unit: '명', color: C.report,
             delta: delta(d.report_people, p.report_people, cmp, false, lbl), sub: '누른 수 ' + num(d.report_opens),
             spark: spark(col('reports'), C.report) }) +
      tile({ label: 'AI 에서 온 사람', value: num(d.ai_visitors), unit: '명', color: C.ai,
             delta: delta(d.ai_visitors, p.ai_visitors, cmp, false, lbl), sub: '방문자의 ' + pct(d.ai_visitors, d.visitors),
             spark: spark(col('ai'), C.ai) }) +
      tile({ label: '지원서 받은 비율', value: pct(f.got_form, f.visitors), sub: '방문자 ' + num(f.visitors) + '명 중 ' + num(f.got_form) + '명' }) +
      '</div>';
    h += card('날마다', '사람 기준 · 한국 시간', lineChart('ov', dates, [
      { name: '방문자', color: C.visitor, values: col('visitors'), total: d.visitors },
      { name: '공지 첨부', color: C.notice, values: col('downloads'), total: d.downloads_people },
      { name: '보고서', color: C.report, values: col('reports'), total: d.report_people }]));
    var hours = d.hours || [], wk = d.weekdays || [];
    var hmax = Math.max.apply(null, [1].concat(hours)), wmax = Math.max.apply(null, [1].concat(wk));
    var peakH = hours.indexOf(Math.max.apply(null, hours)), peakW = wk.indexOf(Math.max.apply(null, wk));
    var anyH = hours.some(function (x) { return x > 0; });
    var when = '<div class="shp-hours">' + hours.map(function (v, i) {
        var st = v ? ' style="background:rgba(61,82,160,' + (0.18 + 0.82 * v / hmax).toFixed(2) + ')"' : '';
        return '<span' + st + tipAttr(i + '시', [[num(v) + '번', '방문']]) + '></span>';
      }).join('') + '</div><div class="shp-hlab"><span>0시</span><span>6시</span><span>12시</span><span>18시</span><span>23시</span></div>' +
      '<div class="shp-week">' + wk.map(function (v, i) {
        return '<div' + tipAttr(WEEK[i] + '요일', [[num(v) + '번', '방문']]) + '><span class="shp-wb"><span style="height:' + Math.round(v / wmax * 100) + '%"></span></span><i>' + WEEK[i] + '</i><b>' + num(v) + '</b></div>';
      }).join('') + '</div>';
    var devs = DEV_ORDER.map(function (k) {
      var x = (d.devices || []).filter(function (z) { return z.device === k; })[0];
      return { label: DEV_LABEL[k], value: x ? x.visitors : 0, color: DEV_COLOR[k] };
    });
    var nr = stack([{ label: '새로 온 사람', value: d.new_visitors || 0, color: C.visitor },
                    { label: '다시 온 사람', value: d.returning || 0, color: '#86b6ef' }]);
    h += '<div class="shp-grid2">' +
      card('언제 오나', anyH ? '가장 많은 때: <b>' + WEEK[peakW] + '요일 · ' + peakH + '시</b> — 공지·인스타 올릴 때 참고' : '아직 기록이 없습니다', when) +
      card('누가 · 무엇으로', '', '<div class="shp-sub-h">기기</div>' + stack(devs) + '<div class="shp-sub-h">새로 / 다시</div>' + nr) + '</div>';
    var st = d.storage || {};
    if (st.drops_window > 0) h += '<div class="shp-alert">⚠ 최근 ' + num(d.days) + '일 동안 기록 상한에 걸려 <b>' + num(st.drops_window) +
      '건</b>을 버렸습니다 (오늘 ' + num(st.drops_today) + '건). 누가 기록 함수를 반복해서 두드리고 있다는 뜻입니다 — 숫자가 평소보다 적게 보일 수 있어요.</div>';
    h += '<div class="shp-foot">⚠ «받은 사람» = 홈페이지에서 첨부·보고서 링크를 <b>누른</b> 서로 다른 브라우저 수. 카톡으로 돌린 파일은 안 셉니다 · ' +
         '폰·노트북은 둘로 셉니다 · 임원진 로그인 상태는 빼고 셉니다 · IP·위치·이름·학번은 남기지 않습니다 · 기록 ' +
         num(st.rows_est) + '줄 (' + (Math.round((st.bytes || 0) / 1048576 * 10) / 10) + 'MB / 상한 ' + num(st.cap_rows) + '줄)</div>';
    return h;
  }

  // ── 탭: 유입 ───────────────────────────────────────────────────
  function tabTraffic(d) {
    var srcs = d.sources || [];
    var gsum = {}; srcs.forEach(function (s) { var g = srcGroup(s.source); gsum[g] = (gsum[g] || 0) + s.visitors; });
    var h = card('어디서 왔나', '사람 기준 · 기간 안 첫 방문의 출처', stack(GROUPS.map(function (g) {
      return { label: g.label, value: gsum[g.k] || 0, color: g.color }; })));
    var rows = srcs.slice().sort(function (a, b) { return b.visitors - a.visitors; });
    h += card('출처별 — 지원서·보고서까지 이어졌나', '',
      rows.length ? '<div class="shp-scroll"><table class="shp-tbl"><thead><tr><th class="l">출처</th><th>사람</th><th>방문</th>' +
      '<th>지원서 받음</th><th>전환율</th><th>보고서 받음</th><th class="l bar">비중</th></tr></thead><tbody>' +
      rows.map(function (s) {
        var g = groupOf(srcGroup(s.source)), mx = rows[0].visitors || 1;
        return '<tr><td class="l">' + dot(g.color) + esc(srcName(s.source)) + ' <em class="shp-muted">' + esc(g.label) + '</em></td>' +
          '<td class="big">' + num(s.visitors) + '</td><td>' + num(s.visits) + '</td><td>' + num(s.got_form) + '</td>' +
          '<td>' + pct(s.got_form, s.visitors) + '</td><td>' + num(s.got_report) + '</td>' +
          '<td class="l bar"><span class="shp-cellbar"><span style="width:' + (s.visitors / mx * 100) + '%;background:' + g.color + '"></span></span></td></tr>';
      }).join('') + '</tbody></table></div>' : '<div class="shp-empty sm">아직 기록이 없습니다.</div>');
    var hosts = d.hosts || [];
    h += '<div class="shp-grid2">' + card('들어온 사이트', '도메인까지만 (글 주소·검색어는 안 남김)', hbars(hosts.map(function (x) {
        var g = groupOf(srcGroup(x.source));
        return { label: x.host, value: x.visitors, color: g.color, dotColor: g.color, tipName: srcName(x.source), extra: x.visits !== x.visitors ? ' · ' + num(x.visits) + '번' : '' };
      }))) +
      card('캠페인', '링크에 ?c=이름 을 붙이면 여기 따로 셉니다', (d.campaigns || []).length
        ? '<div class="shp-scroll"><table class="shp-tbl sm"><thead><tr><th class="l">캠페인</th><th>사람</th><th>지원서 받음</th><th>전환율</th></tr></thead><tbody>' +
          d.campaigns.map(function (x) { return '<tr><td class="l">' + esc(x.campaign) + '</td><td class="big">' + num(x.visitors) + '</td><td>' + num(x.got_form) + '</td><td>' + pct(x.got_form, x.visitors) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '<div class="shp-empty sm">아직 캠페인 링크로 온 사람이 없습니다.</div>') + '</div>';
    //  링크 만들기 — 인스타 프로필·포스터 QR·에타 글에 붙일 주소
    var base = (cfg.homeUrl || (location.origin + location.pathname)).split('#')[0].split('?')[0];
    h += card('링크 만들기', '어디에 올릴 링크인지 고르면 출처가 정확히 나뉩니다',
      '<div class="shp-lb"><select class="shp-lb-src">' +
      [['instagram', '인스타그램'], ['kakao', '카카오톡'], ['everytime', '에브리타임'], ['qr', '포스터 QR'], ['email', '메일'], ['linkedin', '링크드인']]
        .map(function (o) { return '<option value="' + o[0] + '">' + o[1] + '</option>'; }).join('') +
      '</select><input class="shp-lb-c" maxlength="40" placeholder="캠페인 이름 (예: 3기모집)"><input class="shp-lb-out" readonly value="' + esc(base + '?src=instagram') + '">' +
      '<button type="button" class="shp-btn shp-lb-copy">복사</button></div>' +
      '<div class="shp-note">⚠ 링크 끝의 ?src= · ?c= 는 방문자가 들어오는 순간 주소창에서 지웁니다 — 그 주소를 다시 공유해도 출처가 섞이지 않아요.</div>', 'shp-lbcard');
    return h;
  }
  function bindLinkBuilder(root) {
    var c = root.querySelector('.shp-lbcard'); if (!c) return;
    var s = c.querySelector('.shp-lb-src'), cm = c.querySelector('.shp-lb-c'), out = c.querySelector('.shp-lb-out');
    var base = (cfg.homeUrl || (location.origin + location.pathname)).split('#')[0].split('?')[0];
    function upd() {
      var u = base + '?src=' + encodeURIComponent(s.value);
      var v = cm.value.trim().toLowerCase().replace(/[^a-z0-9가-힣_-]+/g, '_').replace(/^_+|_+$/g, '');
      if (v) u += '&c=' + encodeURIComponent(v);
      out.value = u;
    }
    s.addEventListener('change', upd); cm.addEventListener('input', upd);
    c.querySelector('.shp-lb-copy').addEventListener('click', function () {
      out.select();
      var done = function () { var b = c.querySelector('.shp-lb-copy'); b.textContent = '복사됨'; setTimeout(function () { b.textContent = '복사'; }, 1500); };
      try { navigator.clipboard.writeText(out.value).then(done, function () { document.execCommand('copy'); done(); }); }
      catch (e) { try { document.execCommand('copy'); done(); } catch (e2) {} }
    });
  }

  // ── 탭: 검색 (구글 서치 콘솔) ───────────────────────────────────
  function gscGuide(g) {
    var last = g && g.last_sync;
    return card('구글 서치 콘솔 연결 (무료)', '한 번만 하면 매일 새벽 자동으로 받아옵니다',
      (last && !last.ok ? '<div class="shp-alert">마지막 시도 실패 — ' + esc(last.message || '') + '</div>' : '') +
      (g && g.missing ? '<div class="shp-alert">서버에 서치 콘솔 표가 아직 없습니다 — terminal-서치콘솔.sql 을 먼저 돌려 주세요.</div>' : '') +
      '<ol class="shp-steps">' +
      '<li><b>서치 콘솔 등록</b> — search.google.com/search-console → 속성 추가 → «URL 접두어» 에 홈페이지 주소 → 확인 방법 «HTML 태그» → 나온 한 줄을 홈페이지 &lt;head&gt; 에 넣고 «확인».</li>' +
      '<li><b>구글 클라우드</b> — console.cloud.google.com → 새 프로젝트 → «API 및 서비스 → 라이브러리» 에서 <b>Google Search Console API</b> 사용 → «사용자 인증 정보 → 서비스 계정 만들기» → 만든 계정의 «키 → 새 키 → JSON» (파일이 내려받아짐).</li>' +
      '<li><b>권한 주기</b> — 서치 콘솔 → 설정 → 사용자 및 권한 → 사용자 추가 → 서비스 계정 이메일(…@….iam.gserviceaccount.com), 권한 «제한됨».</li>' +
      '<li><b>Supabase 비밀값</b> — Edge Functions → Secrets 에 <code>GSC_SA_JSON</code> = JSON 파일 내용 전체, <code>GSC_SITE</code> = 서치 콘솔 속성 주소 그대로 (끝의 / 까지).</li>' +
      '<li><b>함수 올리기</b> — Edge Functions → 새 함수 «gsc-sync» → edge-gsc-sync.ts 붙여 넣고 배포 · SQL Editor 에서 terminal-서치콘솔.sql.</li>' +
      '<li><b>받아오기</b> — 아래 단추 (처음엔 16개월치). 새로 등록한 사이트는 구글에 숫자가 쌓이기까지 2~3일 걸립니다.</li></ol>' +
      '<div class="shp-row"><button type="button" class="shp-btn shp-btn-solid shp-gsc-run">지금 받아오기</button><span class="shp-gsc-msg shp-muted"></span></div>' +
      '<div class="shp-note">네이버는 검색어·순위를 꺼내는 공개 API 가 없어 서치어드바이저 화면에서 직접 봐야 합니다. 대신 네이버에서 들어온 <b>사람 수</b>는 «유입» 탭에 나옵니다.</div>');
  }
  function brandRows(g) {
    var qs = {}; (g.queries || []).forEach(function (q) { qs[String(q.key).toLowerCase().replace(/\s+/g, ' ').trim()] = q; });
    return (cfg.brandTerms || BRAND_TERMS).map(function (t) {
      var q = qs[t.toLowerCase().replace(/\s+/g, ' ').trim()];
      return '<tr><td class="l">' + esc(t) + '</td>' + (q
        ? '<td class="big">' + (q.position ? (Math.round(q.position * 10) / 10) + '위' : '—') + '</td><td>' + num(q.impressions) + '</td><td>' + num(q.clicks) + '</td>'
        : '<td colspan="3" class="shp-muted l">아직 이 검색어로 노출된 적 없음</td>') + '</tr>';
    }).join('');
  }
  function tabSearch(g, site) {
    var srcs = (site && site.sources) || [];
    var ours = ['google', 'naver', 'daum', 'bing'].map(function (k) {
      var x = srcs.filter(function (s) { return s.source === k; })[0];
      return { label: srcName(k), value: x ? x.visitors : 0, color: GROUPS[0].color };
    });
    var oursCard = card('우리 기록으로 본 검색 유입', '검색 엔진별 들어온 사람 (네이버 포함)', hbars(ours));
    if (!g || !g.connected) return gscGuide(g) + oursCard;
    var p = g.prev || {}, cmp = !!p.complete, lbl = '앞 ' + g.days + '일';
    var daily = g.daily || [], dates = daily.map(function (x) { return x.d; });
    var hidden = g.clicks ? Math.max(0, g.clicks - (g.query_clicks || 0)) : 0;
    var h = '<div class="shp-since">구글 자료 ' + esc(md(g.from)) + ' ~ ' + esc(md(g.to)) + ' (구글은 2~3일 늦게 확정) · 마지막으로 받아온 때 ' +
            esc(g.last_ok ? kst(g.last_ok, true) : '—') + ' <button type="button" class="shp-btn sm shp-gsc-run">지금 받아오기</button><span class="shp-gsc-msg shp-muted"></span></div>';
    h += '<div class="shp-tiles four">' +
      tile({ label: '클릭', value: num(g.clicks), unit: '번', color: C.visitor, delta: delta(g.clicks, p.clicks, cmp, false, lbl),
             spark: spark(daily.map(function (x) { return x.clicks; }), C.visitor) }) +
      tile({ label: '노출', value: num(g.impressions), unit: '번', color: C.ai, delta: delta(g.impressions, p.impressions, cmp, false, lbl),
             spark: spark(daily.map(function (x) { return x.impressions; }), C.ai) }) +
      tile({ label: '클릭률 (CTR)', value: g.ctr != null ? (Math.round(g.ctr * 1000) / 10) + '%' : '—', delta: delta(g.ctr || 0, p.ctr, cmp, false, lbl) }) +
      tile({ label: '평균 순위', value: g.position != null ? (Math.round(g.position * 10) / 10) + '위' : '—', delta: delta(g.position || 0, p.position, cmp, true, lbl),
             sub: '낮을수록 위' }) + '</div>';
    //  ⚠️ 클릭과 노출은 크기가 달라 <한 축에 겹치지 않고> 따로 그립니다
    h += '<div class="shp-grid2">' +
      card('클릭', '날마다', lineChart('gc', dates, [{ name: '클릭', color: C.visitor, values: daily.map(function (x) { return x.clicks; }) }], { unit: '번', height: 140 })) +
      card('노출', '날마다', lineChart('gi', dates, [{ name: '노출', color: C.ai, values: daily.map(function (x) { return x.impressions; }) }], { unit: '번', height: 140 })) + '</div>';
    h += card('찾고 싶은 검색어', '«safe sogang» 처럼 쳤을 때 몇 위에 나오나 (기간 안 평균)',
      '<div class="shp-scroll"><table class="shp-tbl sm"><thead><tr><th class="l">검색어</th><th>평균 순위</th><th>노출</th><th>클릭</th></tr></thead><tbody>' + brandRows(g) + '</tbody></table></div>');
    var qs = g.queries || [];
    h += card('검색어', '클릭 순 · 상위 100' + (hidden ? ' · 구글이 가린 드문 검색어 클릭 ' + num(hidden) + '번 (' + pct(hidden, g.clicks, 0) + ')' : ''),
      '<input class="shp-filter" type="search" placeholder="검색어 거르기" aria-label="검색어 거르기">' +
      (qs.length ? '<div class="shp-scroll"><table class="shp-tbl shp-qtbl"><thead><tr><th class="l">검색어</th><th>클릭</th><th>노출</th><th>CTR</th><th>평균 순위</th></tr></thead><tbody>' +
       qs.map(function (q) { return '<tr data-q="' + esc(String(q.key).toLowerCase()) + '"><td class="l">' + esc(q.key) + '</td><td class="big">' + num(q.clicks) + '</td><td>' + num(q.impressions) + '</td><td>' +
         (q.ctr != null ? (Math.round(q.ctr * 1000) / 10) + '%' : '—') + '</td><td>' + (q.position != null ? (Math.round(q.position * 10) / 10) : '—') + '</td></tr>'; }).join('') +
       '</tbody></table></div>' : '<div class="shp-empty sm">아직 검색어가 없습니다.</div>'));
    var dv = { MOBILE: '휴대폰', DESKTOP: 'PC', TABLET: '태블릿' };
    h += '<div class="shp-grid2">' +
      card('페이지', '클릭 순', (g.pages || []).length ? '<div class="shp-scroll"><table class="shp-tbl sm"><thead><tr><th class="l">주소</th><th>클릭</th><th>노출</th></tr></thead><tbody>' +
        g.pages.map(function (x) { return '<tr><td class="l shp-url">' + esc(String(x.key).replace(/^https?:\/\//, '')) + '</td><td>' + num(x.clicks) + '</td><td>' + num(x.impressions) + '</td></tr>'; }).join('') +
        '</tbody></table></div>' : '<div class="shp-empty sm">—</div>') +
      card('기기 · 나라', '클릭 기준', stack((g.devices || []).map(function (x, i) { return { label: dv[x.key] || x.key, value: x.clicks, color: [C.visitor, C.notice, C.report][i] || C.other }; }), '번') +
        '<div class="shp-sub-h">나라</div>' + hbars((g.countries || []).map(function (x) { return { label: String(x.key).toUpperCase(), value: x.clicks, color: C.visitor }; }), '번')) + '</div>' + oursCard;
    return h;
  }
  function bindSearch(root) {
    [].forEach.call(root.querySelectorAll('.shp-gsc-run'), function (b) {
      b.addEventListener('click', function () {
        var msg = b.parentNode.querySelector('.shp-gsc-msg');
        if (!sb.functions || !sb.functions.invoke) { msg.textContent = '이 화면에서는 함수를 부를 수 없습니다.'; return; }
        b.disabled = true; msg.textContent = ' 받아오는 중… (처음엔 1분쯤)';
        Promise.resolve(sb.functions.invoke('gsc-sync', { body: {} })).then(function (r) {
          b.disabled = false;
          var body = r && r.data;
          if (r && r.error) {
            var ctx = r.error.context;
            return Promise.resolve(ctx && ctx.json ? ctx.json().catch(function () { return null; }) : null).then(function (j) {
              msg.textContent = ' ' + ((j && j.error) || r.error.message || '실패');
            });
          }
          msg.textContent = ' 받았습니다 — ' + (body && body.rows ? num(Object.keys(body.rows).reduce(function (a, k) { return a + body.rows[k]; }, 0)) + '줄' : '');
          D.gsc = {}; render();
        }, function (e) { b.disabled = false; msg.textContent = ' ' + (e && e.message || '실패'); });
      });
    });
    var f = root.querySelector('.shp-filter');
    if (f) f.addEventListener('input', function () {
      var q = f.value.trim().toLowerCase();
      [].forEach.call(root.querySelectorAll('.shp-qtbl tbody tr'), function (tr) {
        tr.style.display = !q || tr.getAttribute('data-q').indexOf(q) >= 0 ? '' : 'none';
      });
    });
  }

  // ── 탭: AI 검색 (GEO · AEO) ───────────────────────────────────
  function tabAI(d) {
    var srcs = (d.sources || []).filter(function (s) { return srcGroup(s.source) === 'ai'; })
      .sort(function (a, b) { return b.visitors - a.visitors; });
    var form = srcs.reduce(function (a, s) { return a + (s.got_form || 0); }, 0);
    var daily = d.daily || [];
    var h = '<div class="shp-tiles three">' +
      tile({ label: 'AI 에서 온 사람', value: num(d.ai_visitors), unit: '명', color: C.ai,
             delta: delta(d.ai_visitors, (d.prev || {}).ai_visitors, !!(d.prev || {}).complete, false, '앞 ' + d.days + '일') }) +
      tile({ label: '전체 방문자 중', value: pct(d.ai_visitors, d.visitors), sub: '검색 엔진은 ' + pct(d.search_visitors, d.visitors) }) +
      tile({ label: 'AI 로 와서 지원서 받은 사람', value: num(form), unit: '명' }) + '</div>';
    h += '<div class="shp-grid2">' +
      card('어느 AI 에서', '사람 기준', hbars(srcs.map(function (s) { return { label: srcName(s.source), value: s.visitors, color: C.ai }; }))) +
      card('날마다', 'AI 에서 온 사람', lineChart('ai', daily.map(function (x) { return x.d; }),
        [{ name: 'AI', color: C.ai, values: daily.map(function (x) { return x.ai || 0; }) }], { height: 140 })) + '</div>';
    h += card('AI 가 SAFE 를 잘 읽게 (GEO · AEO 준비)', '«SEO 점검» 탭의 AI 항목만 모아 봤습니다', '<div class="shp-geo">' + (D.seo ? seoList(D.seo.filter(function (c) { return c.ai; })) :
      '<div class="shp-empty sm">점검 중…</div>') + '</div>');
    h += '<div class="shp-note">⚠ 알 수 있는 것: ChatGPT·Perplexity·Gemini·Copilot·Claude·뤼튼 등에서 <b>링크를 눌러 들어온 사람</b>. ' +
         '알 수 없는 것: AI 가 답만 하고 링크를 안 누른 경우 · 구글 AI 개요(구글 검색으로 섞임) · AI 크롤러 방문(GitHub Pages 는 서버 기록이 없음).</div>';
    return h;
  }

  // ── 탭: 다운로드 ───────────────────────────────────────────────
  function dlTable(rows, kind, days) {
    var color = kind === 'notice' ? C.notice : C.report;
    if (!rows.length) return '<div class="shp-empty sm">' + (kind === 'notice' ? '첨부가 있는 공지가 아직 없습니다.' : '보고서가 아직 없습니다.') + '</div>';
    var max = Math.max.apply(null, [1].concat(rows.map(function (x) { return x.dl_people; })));
    return '<div class="shp-scroll"><table class="shp-tbl"><thead><tr><th class="l">' + (kind === 'notice' ? '공지' : '보고서') + '</th>' +
      '<th>받은 사람</th><th>누른 수</th><th>오늘</th><th>기간 안</th>' + (kind === 'notice' ? '<th>본 사람</th>' : '') +
      '<th>추이</th><th>마지막</th></tr></thead><tbody>' + rows.map(function (x) {
        var map = {}; (x.dl_daily || []).forEach(function (z) { map[z.d] = z.n; });
        var badge = kind === 'notice'
          ? '<em class="shp-type shp-type-' + esc(x.type) + '">' + esc(TYPE_LABEL[x.type] || x.type) + '</em>'
          : '<em class="shp-type">' + esc(x.gen) + '기</em><em class="shp-type shp-cat-' + esc(x.category) + '">' + esc(CAT_LABEL[x.category] || x.category || '') + '</em>';
        var file = kind === 'notice'
          ? (x.has_file ? '<span class="shp-file">📎 ' + esc(x.file_name || '첨부') + '</span>' : '<span class="shp-file none">첨부 없음</span>')
          : '<span class="shp-file">' + esc([x.author, x.date].filter(Boolean).join(' · ')) + (x.file_type === 'link' ? ' · 링크(연 수)' : ' · 파일') + '</span>';
        var on = kind !== 'notice' || x.has_file;
        return '<tr' + (kind === 'notice' && x.type === 'recruit' && x.has_file ? ' class="shp-hot"' : '') + '>' +
          '<td class="l">' + badge + '<b class="shp-t">' + esc(x.title) + '</b>' + file + '</td>' +
          (on ? '<td class="big"><span class="shp-cellnum">' + num(x.dl_people) + '</span><span class="shp-cellbar thin"><span style="width:' + (x.dl_people / max * 100) + '%;background:' + color + '"></span></span></td>' +
                '<td>' + num(x.dl_clicks) + '</td><td>' + num(x.dl_today) + '</td><td>' + num(x.dl_people_window) + '</td>'
              : '<td>—</td><td>—</td><td>—</td><td>—</td>') +
          (kind === 'notice' ? '<td>' + num(x.view_people) + '</td>' : '') +
          '<td>' + (on ? spark(days.map(function (dd) { return map[dd] || 0; }), color) : '') + '</td>' +
          '<td class="t">' + (x.last_at ? esc(kst(x.last_at, true)) : '—') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function tabDownloads(d) {
    var f = d.funnel || { visitors: 0, saw_recruit: 0, got_form: 0 };
    var ramp = ['#86b6ef', '#2a78d6', '#104281'];   // 순서가 있는 단계 — 한 색의 밝기 단계
    var steps = [['들어옴', f.visitors, ''], ['모집 공고를 봄', f.saw_recruit, pct(f.saw_recruit, f.visitors)], ['지원서를 받음', f.got_form, pct(f.got_form, f.visitors)]];
    var fmax = Math.max(1, f.visitors);
    var h = card('모집 퍼널', '최근 ' + num(d.days) + '일 · 모집 공고 기준', '<div class="shp-funnel">' + steps.map(function (s, i) {
      return '<div class="shp-fs"' + tipAttr(s[0], [[num(s[1]) + '명', s[2] ? '방문자의 ' + s[2] : '', ramp[i]]]) + '><span class="shp-fl">' + s[0] + '</span>' +
        '<span class="shp-ft"><span style="width:' + Math.max(1.5, s[1] / fmax * 100) + '%;background:' + ramp[i] + '"></span></span>' +
        '<b>' + num(s[1]) + '명</b><i>' + s[2] + '</i></div>';
    }).join('') + '</div><div class="shp-note">«봄» = 공고 카드가 화면에 1.5초 넘게 보인 사람. 카드를 스치듯 지나 바로 받은 사람이 있어 «받음» 이 «봄» 보다 클 수 있습니다.</div>');
    var days = (d.daily || []).map(function (x) { return x.d; });
    var notices = (d.notices || []).filter(function (x) { return x.has_file || x.view_people > 0; }).slice(0, cfg.noticeRows || 20);
    h += card('공지 첨부 다운로드', '받은 사람·누른 수는 처음부터 전체 · «기간 안»·추이는 최근 ' + num(d.days) + '일', dlTable(notices, 'notice', days));
    h += card('보고서 다운로드', '받은 사람 많은 순 · 드라이브 링크 보고서는 «연 수»', dlTable(d.reports || [], 'report', days));
    return h;
  }

  // ── 탭: 상세 기록 ───────────────────────────────────────────────
  function tabLog() {
    var L = D.log || { rows: [], kind: '', who: '' };
    var h = '<div class="shp-row shp-logbar"><label>종류 <select class="shp-log-kind"><option value="">전체</option>' +
      Object.keys(KIND).map(function (k) { return '<option value="' + k + '"' + (L.kind === k ? ' selected' : '') + '>' + KIND[k][0] + '</option>'; }).join('') +
      '</select></label>' + (L.who ? '<span class="shp-chip-f">방문자 ' + esc(L.who) + ' <button type="button" class="shp-log-clear" aria-label="방문자 거르기 풀기">×</button></span>' : '') +
      '<span class="shp-muted">최근 ' + num(D.days) + '일 · 최신 순 · 방문자 번호는 8글자 요약</span>' +
      '<button type="button" class="shp-btn sm shp-log-csv">CSV 저장</button></div>';
    if (!L.rows.length) return h + '<div class="shp-empty">' + (L.loading ? '불러오는 중…' : '기록이 없습니다.') + '</div>';
    h += '<div class="shp-scroll"><table class="shp-tbl shp-logtbl"><thead><tr><th class="l">시각</th><th class="l">종류</th><th class="l">대상</th>' +
      '<th class="l">출처</th><th class="l">사이트</th><th class="l">캠페인</th><th class="l">기기</th><th class="l">방문자</th></tr></thead><tbody>' +
      L.rows.map(function (r) {
        var k = KIND[r.kind] || [r.kind, C.other], g = r.source ? groupOf(srcGroup(r.source)) : null;
        return '<tr><td class="l t">' + esc(kst(r.at, true)) + '</td><td class="l">' + dot(k[1]) + esc(k[0]) + '</td>' +
          '<td class="l">' + esc(r.title || '') + '</td><td class="l">' + (g ? dot(g.color) + esc(srcName(r.source)) : '') + '</td>' +
          '<td class="l shp-muted">' + esc(r.host || '') + '</td><td class="l shp-muted">' + esc(r.campaign || '') + '</td>' +
          '<td class="l">' + esc(DEV_LABEL[r.device] || '') + '</td>' +
          '<td class="l"><button type="button" class="shp-who" data-who="' + esc(r.who) + '">' + esc(r.who) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      (L.more ? '<div class="shp-row"><button type="button" class="shp-btn shp-log-more">더 보기</button></div>' : '');
    return h;
  }
  function loadLog(more) {
    var L = D.log || (D.log = { rows: [], kind: '', who: '' });
    var before = more && L.rows.length ? L.rows[L.rows.length - 1].at : null;
    if (!more) { L.rows = []; L.loading = true; }
    return rpc('site_events_log', { p_days: D.days, p_kind: L.kind || null, p_who: L.who || null, p_limit: 200, p_before: before })
      .then(function (rows) { L.loading = false; L.rows = L.rows.concat(rows || []); L.more = (rows || []).length === 200; },
            function (e) { L.loading = false; L.err = e; });
  }
  function bindLog(root) {
    var k = root.querySelector('.shp-log-kind');
    if (k) k.addEventListener('change', function () { D.log.kind = k.value; loadLog(false).then(render); render(); });
    var c = root.querySelector('.shp-log-clear');
    if (c) c.addEventListener('click', function () { D.log.who = ''; loadLog(false).then(render); render(); });
    [].forEach.call(root.querySelectorAll('.shp-who'), function (b) {
      b.addEventListener('click', function () { D.log.who = b.getAttribute('data-who'); loadLog(false).then(render); render(); });
    });
    var m = root.querySelector('.shp-log-more');
    if (m) m.addEventListener('click', function () { m.disabled = true; loadLog(true).then(render); });
    var csv = root.querySelector('.shp-log-csv');
    if (csv) csv.addEventListener('click', function () {
      var q = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) || /^[=+\-@]/.test(v) ? '"' + v.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"' : v; };
      var lines = [['시각(한국)', '종류', '대상', '출처', '사이트', '캠페인', '기기', '방문자'].join(',')].concat((D.log.rows || []).map(function (r) {
        return [kst(r.at, true, true), (KIND[r.kind] || [r.kind])[0], r.title, r.source ? srcName(r.source) : '', r.host, r.campaign, DEV_LABEL[r.device] || '', r.who].map(q).join(',');
      }));
      var blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = 'safe-홈페이지-상세기록-' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    });
  }

  // ── 탭: SEO 점검 ───────────────────────────────────────────────
  //  ⚠️ 이 페이지의 <원본 HTML> 을 다시 받아 자바스크립트 없이 읽습니다 — 구글·AI 크롤러가
  //     처음 보는 모습 그대로. robots.txt · sitemap.xml · llms.txt 도 직접 받아 봅니다.
  function seoRun() {
    var page = location.href.split('#')[0];
    var root = location.origin + '/';
    var get = function (u) {
      return fetch(u, { cache: 'no-store', credentials: 'omit' }).then(function (r) {
        return r.ok ? r.text().then(function (t) { return { ok: true, text: t, type: r.headers.get('content-type') || '' }; }) : { ok: false, status: r.status };
      }, function () { return { ok: false, status: 0 }; });
    };
    return Promise.all([get(page), get(root + 'robots.txt'), get(root + 'sitemap.xml'), get(root + 'llms.txt')]).then(function (rs) {
      var html = rs[0].ok ? rs[0].text : '';
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var meta = function (sel) { var m = doc.querySelector(sel); return m ? (m.getAttribute('content') || '').trim() : ''; };
      var title = (doc.querySelector('title') || {}).textContent || '';
      var desc = meta('meta[name="description"]');
      var canon = (doc.querySelector('link[rel="canonical"]') || { getAttribute: function () { return ''; } }).getAttribute('href') || '';
      var lds = [].map.call(doc.querySelectorAll('script[type="application/ld+json"]'), function (s) {
        try { return JSON.parse(s.textContent); } catch (e) { return { __bad: true }; } });
      var flat = []; lds.forEach(function (x) { (Array.isArray(x) ? x : (x && x['@graph']) || [x]).forEach(function (y) { flat.push(y); }); });
      var ofType = function (t) { return flat.filter(function (x) { var ty = x && x['@type']; return ty === t || (Array.isArray(ty) && ty.indexOf(t) >= 0); }); };
      var org = ofType('Organization').concat(ofType('EducationalOrganization'), ofType('CollegeOrUniversity')).filter(function (x) { return /safe/i.test(String(x.name || '')); })[0];
      var faq = ofType('FAQPage')[0];
      [].forEach.call(doc.querySelectorAll('script,style,noscript,template'), function (n) { n.remove(); });
      var text = (doc.body ? doc.body.textContent : '').replace(/\s+/g, ' ').trim();
      var robots = rs[1].ok ? rs[1].text : '';
      var blocked = function (bot) {
        var lines = robots.split(/\r?\n/), on = false, dis = false;
        lines.forEach(function (l) {
          var m = l.replace(/#.*/, '').trim(); if (!m) return;
          var kv = m.split(':'), k = kv.shift().trim().toLowerCase(), v = kv.join(':').trim();
          if (k === 'user-agent') on = v === '*' || v.toLowerCase() === bot.toLowerCase();
          else if (on && k === 'disallow' && (v === '/' || v === '/*')) dis = true;
        });
        return dis;
      };
      var noindex = /noindex/i.test(meta('meta[name="robots"]'));
      var h1 = doc.querySelectorAll('h1').length;
      var imgsNoAlt = [].filter.call(document.querySelectorAll('img'), function (i) { return !i.hasAttribute('alt'); }).length;
      var sm = rs[2].ok ? rs[2].text : '';
      var R = [];
      var add = function (grp, name, st, now, fix, ai) { R.push({ grp: grp, name: name, st: st, now: now, fix: fix, ai: !!ai }); };
      if (!rs[0].ok) add('기본', '원본 HTML 받기', 'bad', '이 페이지를 다시 받지 못했습니다 (' + rs[0].status + ')', '같은 주소에서 열었는지 확인');
      add('기본', '제목 (title)', title && /safe/i.test(title) && /(서강|sogang)/i.test(title) && title.length <= 60 ? 'good' : title ? 'warn' : 'bad',
          title ? '«' + title + '» (' + title.length + '자)' : '없음', '«SAFE | 서강대학교 금융·경제 학회 (Sogang)» 처럼 SAFE · 서강 · 학회를 60자 안에');
      add('기본', '설명 (description)', desc.length >= 50 && desc.length <= 160 && /(서강|sogang)/i.test(desc) ? 'good' : desc ? 'warn' : 'bad',
          desc ? desc.length + '자' : '없음', '검색 결과 아래 회색 글 — 50~160자, 서강대·금융·학회·모집을 자연스럽게');
      add('기본', '언어 (lang="ko")', /^ko/i.test(doc.documentElement.getAttribute('lang') || '') ? 'good' : 'warn', doc.documentElement.getAttribute('lang') || '없음', '<html lang="ko">');
      add('기본', '휴대폰 화면 (viewport)', meta('meta[name="viewport"]') ? 'good' : 'bad', meta('meta[name="viewport"]') || '없음', 'width=device-width, initial-scale=1');
      add('기본', '대표 주소 (canonical)', /^https:\/\//.test(canon) ? 'good' : 'warn', canon || '없음', '<link rel="canonical" href="홈페이지 주소">');
      add('기본', '검색 막음 (noindex) 없음', noindex ? 'bad' : 'good', noindex ? 'noindex 가 있습니다' : '없음', 'meta robots 의 noindex 를 지우기');
      add('기본', '큰 제목 (h1) 하나', h1 === 1 ? 'good' : 'warn', h1 + '개', '페이지 맨 위 큰 제목 하나에 «SAFE · 서강대학교 금융경제학회»');
      add('공유', '공유 미리보기 (Open Graph)', meta('meta[property="og:title"]') && meta('meta[property="og:description"]') && /^https:\/\//.test(meta('meta[property="og:image"]')) ? 'good' : 'warn',
          ['og:title', 'og:description', 'og:image', 'og:url'].filter(function (k) { return !meta('meta[property="' + k + '"]'); }).map(function (k) { return k + ' 없음'; }).join(' · ') || '다 있음',
          '카톡·인스타에 링크를 올리면 뜨는 제목·설명·그림 (그림은 https 전체 주소, 1200×630)');
      add('공유', '트위터 카드', meta('meta[name="twitter:card"]') ? 'good' : 'warn', meta('meta[name="twitter:card"]') || '없음', 'summary_large_image');
      add('검색', '구글 소유 확인', meta('meta[name="google-site-verification"]') ? 'good' : 'warn', meta('meta[name="google-site-verification"]') ? '있음' : '없음', '서치 콘솔에서 받은 한 줄');
      add('검색', '네이버 소유 확인', meta('meta[name="naver-site-verification"]') ? 'good' : 'warn', meta('meta[name="naver-site-verification"]') ? '있음' : '없음', '네이버 서치어드바이저에서 받은 한 줄 — 한국은 네이버가 큼');
      add('검색', 'robots.txt', rs[1].ok && !blocked('*') ? 'good' : rs[1].ok ? 'bad' : 'warn', rs[1].ok ? (blocked('*') ? '전체를 막고 있습니다' : '있음') : '없음 (' + rs[1].status + ')',
          '사이트 맨 위 폴더에 — 모두 허용 + Sitemap: 줄');
      add('검색', 'sitemap.xml', rs[2].ok && /<urlset/.test(sm) ? 'good' : 'warn', rs[2].ok ? (/<urlset/.test(sm) ? '있음' : '모양이 이상합니다') : '없음', '홈페이지 주소를 담은 사이트맵 → 서치 콘솔·서치어드바이저에 제출');
      add('구조화 데이터', '단체 정보 (Organization)', org && org.url && (org.alternateName || org.sameAs) ? 'good' : org ? 'warn' : 'bad',
          org ? '«' + org.name + '»' + (org.alternateName ? ' · 다른 이름 ' + [].concat(org.alternateName).length + '개' : ' · 다른 이름 없음') : '없음',
          '이름·다른 이름(SAFE, Sogang SAFE, 서강 SAFE…)·주소·인스타(sameAs)·서강대(parentOrganization) — «safe sogang» 검색에 직접 도움', true);
      add('구조화 데이터', '자주 묻는 질문 (FAQPage)', faq ? 'good' : 'warn', faq ? ((faq.mainEntity || []).length + '개 질문') : '없음',
          '«SAFE 는 어떤 학회인가요?» «언제 모집하나요?» — 구글·AI 가 답으로 바로 씁니다 (AEO)', true);
      add('구조화 데이터', 'JSON-LD 문법', lds.some(function (x) { return x.__bad; }) ? 'bad' : lds.length ? 'good' : 'warn', lds.length ? lds.length + '덩어리' : '없음', '깨진 JSON 이 있으면 통째로 무시됩니다', true);
      add('AI', 'llms.txt', rs[3].ok && rs[3].text.trim().length > 50 ? 'good' : 'warn', rs[3].ok ? rs[3].text.trim().length + '자' : '없음', 'AI 에게 주는 요약 (사이트 맨 위 폴더)', true);
      add('AI', 'AI 크롤러 허용 (GPTBot · ClaudeBot · PerplexityBot · Google-Extended)',
          rs[1].ok ? (['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot'].some(blocked) ? 'bad' : 'good') : 'warn',
          rs[1].ok ? (['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'OAI-SearchBot'].filter(blocked).join(' · ') || '막은 곳 없음') : 'robots.txt 없음',
          '막지 않기 — 막으면 ChatGPT·Perplexity 답에 SAFE 가 안 나옵니다', true);
      add('AI', '자바스크립트 없이 보이는 글', text.length >= 400 && /(서강|sogang)/i.test(text) && /safe/i.test(text) ? 'good' : text.length >= 150 ? 'warn' : 'bad',
          num(text.length) + '자' + (/(서강|sogang)/i.test(text) ? '' : ' · «서강» 없음'),
          'AI 크롤러 대부분은 자바스크립트를 안 돌립니다 — 소개·모집 안내를 HTML 에 직접', true);
      add('접근성', '그림 대체 글 (alt)', imgsNoAlt ? 'warn' : 'good', imgsNoAlt ? imgsNoAlt + '개 없음' : '다 있음', '<img alt="설명">');
      add('기본', 'https', location.protocol === 'https:' ? 'good' : 'bad', location.protocol, 'GitHub Pages 설정 → Enforce HTTPS');
      return R;
    });
  }
  function seoList(rows) {
    var ic = { good: '✓', warn: '!', bad: '✕' }, lab = { good: '좋음', warn: '고칠 것', bad: '문제' };
    return '<ul class="shp-seo">' + rows.map(function (r) {
      return '<li class="' + r.st + '"><span class="shp-seo-i" aria-label="' + lab[r.st] + '">' + ic[r.st] + '</span>' +
        '<div><b>' + esc(r.name) + '</b> <em class="shp-seo-s">' + lab[r.st] + '</em><div class="shp-muted">' + esc(r.now) + '</div>' +
        (r.st !== 'good' ? '<div class="shp-seo-f">' + esc(r.fix) + '</div>' : '') + '</div></li>';
    }).join('') + '</ul>';
  }
  function tabSeo() {
    if (!D.seo) return '<div class="shp-empty">점검 중…</div>';
    var good = D.seo.filter(function (r) { return r.st === 'good'; }).length;
    var grp = []; D.seo.forEach(function (r) { if (grp.indexOf(r.grp) < 0) grp.push(r.grp); });
    var h = '<div class="shp-tiles three">' +
      tile({ label: '통과', value: good + ' / ' + D.seo.length, sub: '좋음 항목 수' }) +
      tile({ label: '고칠 것', value: String(D.seo.filter(function (r) { return r.st === 'warn'; }).length) }) +
      tile({ label: '문제', value: String(D.seo.filter(function (r) { return r.st === 'bad'; }).length) }) + '</div>';
    grp.forEach(function (g) { h += card(g, '', seoList(D.seo.filter(function (r) { return r.grp === g; }))); });
    h += '<div class="shp-row"><button type="button" class="shp-btn shp-seo-again">다시 점검</button><span class="shp-muted">이 페이지의 원본 HTML 을 자바스크립트 없이 읽어 봅니다 (크롤러가 보는 모습)</span></div>';
    return h;
  }

  // ── 탭: 로고 관리 ───────────────────────────────────────────────
  var LG = { rows: null, msg: '' };
  function loadLogoAdmin() {
    return Promise.resolve(sb.from('partner_logos').select('id,name,logo_url,sort,active').order('sort', { ascending: true }).order('name', { ascending: true }))
      .then(function (r) { if (r.error) throw r.error; LG.rows = r.data || []; }, function (e) { LG.rows = []; LG.msg = '불러오기 실패: ' + (e.message || e); });
  }
  function tabLogos() {
    if (!LG.rows) return '<div class="shp-empty">불러오는 중…</div>';
    var h = '';
    if (cfg.brand) {
      h += card('학회 로고 · 탭 아이콘', '둘은 따로입니다 — 비우면 원래대로', BRAND_KINDS.map(function (b) {
        var cur = BR[b.k];
        return '<div class="shp-brand-row" data-kind="' + b.k + '"><div class="shp-sub-h">' + esc(b.label) + ' <span class="shp-muted" style="font-weight:400">— ' + esc(b.sub) + '</span></div>' +
          '<div class="shp-row wrap"><span class="shp-brand-cur">' + (cur ? '<img src="' + esc(cur) + '" alt="지금 ' + esc(b.label) + '">' : '<span class="shp-muted">지금: ' + esc(b.none) + '</span>') + '</span>' +
          '<input class="shp-br-file" type="file" accept="image/png,image/jpeg,image/webp">' +
          '<button type="button" class="shp-btn shp-btn-solid shp-br-set">바꾸기</button>' +
          (cur ? '<button type="button" class="shp-btn shp-br-clear">기본으로</button>' : '') + '</div>' +
          '<div class="shp-br-msg shp-muted"></div></div>';
      }).join('') +
        '<div class="shp-note">PNG · JPG · WebP, 512KB 까지. 카톡·인스타 공유 미리보기 그림(og.png)은 저장소 파일이라 여기서는 안 바뀝니다 (GitHub 에 새 og.png 를 올리면 됨).</div>');
    }
    h += card('로고 띠 미리보기', '홈페이지 아래쪽 — 마우스를 올리면 멈추고 컬러로', '<div class="shp-logo-prev"></div>');
    h += card('로고 목록', '위에서부터 이 순서로 돕니다 · 숨기면 홈페이지에서 빠짐', (LG.rows.length ? '<ul class="shp-lgl">' + LG.rows.map(function (x, i) {
      return '<li data-id="' + x.id + '"' + (x.active ? '' : ' class="off"') + '>' +
        (/^https:\/\//.test(x.logo_url || '') ? '<img src="' + esc(x.logo_url) + '" alt="">' : '<span class="shp-lgl-ph">로고 없음</span>') +
        '<b>' + esc(x.name) + '</b>' +
        '<button type="button" class="shp-btn sm" data-act="up"' + (i === 0 ? ' disabled' : '') + ' aria-label="위로">▲</button>' +
        '<button type="button" class="shp-btn sm" data-act="down"' + (i === LG.rows.length - 1 ? ' disabled' : '') + ' aria-label="아래로">▼</button>' +
        '<button type="button" class="shp-btn sm" data-act="toggle">' + (x.active ? '숨기기' : '보이기') + '</button>' +
        '<button type="button" class="shp-btn sm danger" data-act="del">지우기</button></li>';
    }).join('') + '</ul>' : '<div class="shp-empty sm">아직 로고가 없습니다.</div>'));
    h += card('로고 넣기', 'PNG · JPG · WebP, 512KB 까지 — 배경 투명한 가로형이 제일 예쁩니다',
      '<div class="shp-row wrap"><input class="shp-lg-name" maxlength="60" placeholder="회사 이름 (예: 미래에셋증권)">' +
      '<input class="shp-lg-file" type="file" accept="image/png,image/jpeg,image/webp">' +
      '<button type="button" class="shp-btn shp-btn-solid shp-lg-add">넣기</button></div>' +
      '<div class="shp-note">로고 파일이 없으면 이름 글자로 돕니다. 로고는 각 회사 홈페이지·보도자료실의 공식 파일을 쓰세요 (SVG 는 보안상 안 받습니다).</div>' +
      '<div class="shp-lg-msg shp-muted">' + esc(LG.msg) + '</div>');
    return h;
  }
  function bindLogos(root) {
    var prev = root.querySelector('.shp-logo-prev');
    if (prev) renderLogos(prev);
    [].forEach.call(root.querySelectorAll('.shp-brand-row'), function (row) {
      var kind = row.getAttribute('data-kind'), spec = BRAND_KINDS.filter(function (b) { return b.k === kind; })[0];
      var bset = row.querySelector('.shp-br-set'), bclr = row.querySelector('.shp-br-clear');
      var bmsg = function (t) { var m = row.querySelector('.shp-br-msg'); if (m) m.textContent = t; };
      var bdone = function (r, oldPath) {
        if (r && r.error) { bmsg('실패: ' + r.error.message); return; }
        if (oldPath) sb.storage.from('logos').remove([oldPath]);   //  예전 파일은 정리 (실패해도 그냥 둠)
        loadBrand().then(render);
      };
      bset.addEventListener('click', function () {
        var file = row.querySelector('.shp-br-file').files[0];
        if (!file) { bmsg('파일을 골라 주세요.'); return; }
        if (['image/png', 'image/jpeg', 'image/webp'].indexOf(file.type) < 0) { bmsg('PNG · JPG · WebP 만 됩니다.'); return; }
        if (file.size > 524288) { bmsg('512KB 보다 큽니다 — 줄여서 올려 주세요.'); return; }
        bset.disabled = true; bmsg('올리는 중…');
        var path = 'brand/' + kind + '-' + Date.now() + '.' + (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg');
        var oldPath = brandPathOf(BR[kind]);
        Promise.resolve(sb.storage.from('logos').upload(path, file, { contentType: file.type, upsert: false })).then(function (r) {
          bset.disabled = false;
          if (r && r.error) { bmsg('올리기 실패: ' + r.error.message); return; }
          var pub = sb.storage.from('logos').getPublicUrl(path);
          return saveBrand(spec.col, pub && pub.data && pub.data.publicUrl).then(function (r2) { bdone(r2, oldPath); });
        }, function (e) { bset.disabled = false; bmsg('올리기 실패: ' + (e.message || e)); });
      });
      if (bclr) bclr.addEventListener('click', function () {
        if (bclr.getAttribute('data-sure') !== '1') { bclr.setAttribute('data-sure', '1'); bclr.textContent = '정말 기본으로'; return; }
        var oldPath = brandPathOf(BR[kind]);
        saveBrand(spec.col, null).then(function (r) { bdone(r, oldPath); });
      });
    });
    var msg = function (t) { LG.msg = t; var m = root.querySelector('.shp-lg-msg'); if (m) m.textContent = t; };
    var after = function (r) { if (r && r.error) { msg('실패: ' + r.error.message); return; } loadLogoAdmin().then(render); };
    [].forEach.call(root.querySelectorAll('.shp-lgl [data-act]'), function (b) {
      b.addEventListener('click', function () {
        var li = b.closest('li'), id = Number(li.getAttribute('data-id')), act = b.getAttribute('data-act');
        var i = LG.rows.findIndex(function (x) { return x.id === id; }), x = LG.rows[i];
        if (act === 'toggle') return Promise.resolve(sb.from('partner_logos').update({ active: !x.active }).eq('id', id)).then(after);
        if (act === 'del') {
          if (b.getAttribute('data-sure') !== '1') { b.setAttribute('data-sure', '1'); b.textContent = '정말 지우기'; return; }
          return Promise.resolve(sb.from('partner_logos').delete().eq('id', id)).then(after);
        }
        var j = act === 'up' ? i - 1 : i + 1; if (j < 0 || j >= LG.rows.length) return;
        //  순서를 10 단위로 다시 매김 (두 줄만 바꾸면 같은 숫자끼리 꼬일 수 있어서)
        var order = LG.rows.slice(); var t = order[i]; order[i] = order[j]; order[j] = t;
        Promise.all(order.map(function (y, k) { return sb.from('partner_logos').update({ sort: (k + 1) * 10 }).eq('id', y.id); })).then(function (rs) {
          after(rs.filter(function (r) { return r && r.error; })[0]);
        });
      });
    });
    var add = root.querySelector('.shp-lg-add');
    if (add) add.addEventListener('click', function () {
      var name = root.querySelector('.shp-lg-name').value.trim(), file = root.querySelector('.shp-lg-file').files[0];
      if (!name) { msg('회사 이름을 적어 주세요.'); return; }
      var sort = (LG.rows.reduce(function (a, x) { return Math.max(a, x.sort || 0); }, 0)) + 10;
      var insert = function (url) { return Promise.resolve(sb.from('partner_logos').insert({ name: name, logo_url: url || null, sort: sort })).then(after); };
      if (!file) return insert(null);
      if (['image/png', 'image/jpeg', 'image/webp'].indexOf(file.type) < 0) { msg('PNG · JPG · WebP 만 됩니다.'); return; }
      if (file.size > 524288) { msg('512KB 보다 큽니다 — 줄여서 올려 주세요.'); return; }
      add.disabled = true; msg('올리는 중…');
      var path = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + (file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg');
      Promise.resolve(sb.storage.from('logos').upload(path, file, { contentType: file.type, upsert: false })).then(function (r) {
        add.disabled = false;
        if (r && r.error) { msg('올리기 실패: ' + r.error.message); return; }
        var pub = sb.storage.from('logos').getPublicUrl(path);
        return insert(pub && pub.data && pub.data.publicUrl);
      }, function (e) { add.disabled = false; msg('올리기 실패: ' + (e.message || e)); });
    });
  }

  // ── 틀 · 그리기 ────────────────────────────────────────────────
  function shell() {
    return '<div class="shp-st-head"><div class="shp-st-title"><b>홈페이지 지표</b><span class="shp-only">임원진만 보입니다</span>' +
      (cfg.amplitudeUrl && /^https:\/\//.test(cfg.amplitudeUrl) ? '<a class="shp-amp" href="' + esc(cfg.amplitudeUrl) + '" target="_blank" rel="noopener">Amplitude 에서 더 보기 →</a>' : '') + '</div>' +
      '<div class="shp-seg" role="group" aria-label="기간">' + [7, 30, 90].map(function (n) {
        return '<button type="button" data-days="' + n + '"' + (n === D.days ? ' class="on" aria-pressed="true"' : ' aria-pressed="false"') + '>' + n + '일</button>';
      }).join('') + '</div></div>' +
      '<div class="shp-tabs" role="tablist">' + TABS.map(function (t) {
        return '<button type="button" role="tab" data-tab="' + t[0] + '" aria-selected="' + (t[0] === D.tab) + '"' + (t[0] === D.tab ? ' class="on"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div><div class="shp-since shp-since-site"></div><div class="shp-body" role="tabpanel"></div>';
  }
  function render() {
    var box = D.box; if (!box) return;
    var body = box.querySelector('.shp-body'); if (!body) return;
    var my = ++D.seq;
    body.classList.add('shp-busy');
    var need = D.tab === 'search' ? Promise.all([loadGsc(D.days), loadSite(D.days)])
             : D.tab === 'log' ? (D.log && (D.log.rows.length || D.log.loaded) ? Promise.resolve() : loadLog(false).then(function () { D.log.loaded = true; }))
             : D.tab === 'logos' ? (LG.rows ? Promise.resolve() : loadLogoAdmin())
             : D.tab === 'seo' ? (D.seo ? Promise.resolve() : seoRun().then(function (r) { D.seo = r; }))
             : D.tab === 'ai' ? Promise.all([loadSite(D.days), D.seo ? null : seoRun().then(function (r) { D.seo = r; })])
             : loadSite(D.days);
    return Promise.resolve(need).then(function () {
      if (my !== D.seq) return;
      var d = D.site[D.days] || {};
      var since = box.querySelector('.shp-since-site');
      if (since) since.textContent = d.since ? '홈페이지 기록 시작 ' + kst(d.since, false, true) + ' · 한국 시간 기준' : '';
      var h = D.tab === 'overview' ? tabOverview(d) : D.tab === 'traffic' ? tabTraffic(d)
            : D.tab === 'search' ? tabSearch(D.gsc[D.days === 30 ? 28 : D.days], d) : D.tab === 'ai' ? tabAI(d)
            : D.tab === 'downloads' ? tabDownloads(d) : D.tab === 'log' ? tabLog()
            : D.tab === 'seo' ? tabSeo() : tabLogos();
      body.innerHTML = h;
      body.classList.remove('shp-busy');
      bindLineCharts(body); bindLinkBuilder(body); bindSearch(body); bindLog(body);
      if (D.tab === 'logos') bindLogos(body);
      var again = body.querySelector('.shp-seo-again');
      if (again) again.addEventListener('click', function () { D.seo = null; render(); });
    }, function (e) {
      if (my !== D.seq) return;
      body.classList.remove('shp-busy');
      body.innerHTML = '<div class="shp-alert">불러오지 못했습니다 — ' + esc(e && e.message || e) + '</div>';
    });
  }
  function showStats(days, target) {
    var box = el(target || cfg.stats);
    if (!box || !sb) return Promise.resolve(false);
    if (days) D.days = days;
    D.box = box;
    var saved = store('shp_tab'); if (saved && TABS.some(function (t) { return t[0] === saved; })) D.tab = saved;
    //  ⚠️ 먼저 임원인지 서버에 물어봅니다 — 아니면 조용히 숨김.
    //     임원인데 통계가 늦거나 실패하면 <숨기지 않고> 탭 안에 이유를 띄웁니다
    //     (예전엔 모든 오류를 «임원 아님» 으로 보고 통째로 숨겨서, 느려지면 대시보드가 사라졌음).
    return rpc('is_officer', {}).then(function (isOff) {
      if (isOff !== true) throw new Error('임원 아님');
      setOfficer(true);
    }).then(function () {
      box.classList.add('shp-stats'); box.classList.remove('shp-hidden');
      box.innerHTML = shell();
      bindTips(box);
      box.querySelector('.shp-seg').addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-days]'); if (!b) return;
        D.days = Number(b.getAttribute('data-days')); D.log = null;
        [].forEach.call(box.querySelectorAll('.shp-seg button'), function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
        render();
      });
      box.querySelector('.shp-tabs').addEventListener('click', function (ev) {
        var b = ev.target.closest('button[data-tab]'); if (!b) return;
        D.tab = b.getAttribute('data-tab'); store('shp_tab', D.tab);
        [].forEach.call(box.querySelectorAll('.shp-tabs button'), function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
        render();
      });
      return render().then(function () { return true; });
    }, function (e) {
      box.innerHTML = ''; box.classList.add('shp-hidden');
      if (cfg.debug) console.warn('[SAFEPlus] site_stats', e);
      return false;
    });
  }
  function hideStats(target) {
    var box = el(target || cfg.stats); D.seq++; D.site = {}; D.gsc = {}; D.log = null; LG.rows = null; tipHide();
    if (box) { box.innerHTML = ''; box.classList.add('shp-hidden'); }
  }

  // ── 모양 ─────────────────────────────────────────────────────
  var CSS = [
    '.shp-hidden{display:none!important}',
    '.shp-stats,.shp-logos{--p:var(--primary,#2c3e6b);--pl:var(--primary-light,#3d52a0);--ac:var(--accent,#6b8cda);--as:var(--accent-soft,#e8edf8);--tx:var(--text,#1a1f36);--ts:var(--text-sub,#5a6278);--mu:#898781;--bd:var(--border,#e2e6f0);--wh:var(--white,#fff);--grid:#eceef4;color:var(--tx);word-break:keep-all;overflow-wrap:anywhere}',
    '.shp-stats{margin-top:18px;display:flex;flex-direction:column;gap:14px;min-width:0;max-width:100%}',
    '.shp-stats>*,.shp-body>*,.shp-grid2>*{min-width:0;max-width:100%}',
    '.shp-empty{color:var(--ts);font-size:14px;padding:18px 4px}.shp-empty.sm{font-size:13px;padding:8px 2px}.shp-muted{color:var(--ts)}',
    //  머리 · 탭
    '.shp-st-head{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
    '.shp-st-title b{font-size:1.15rem;color:var(--p);letter-spacing:-.2px}.shp-only{margin-left:8px;font-size:11.5px;color:var(--ts)}.shp-amp{margin-left:12px;font-size:12px;color:var(--pl);text-decoration:none}.shp-amp:hover{text-decoration:underline}',
    '.shp-notice{font-size:11.5px;color:var(--text-sub,#5a6278);line-height:1.6;text-align:center;padding:8px 16px}',
    '.shp-seg{display:inline-flex;border:1px solid var(--bd);border-radius:10px;overflow:hidden;background:var(--wh)}.shp-seg button{border:0;background:transparent;padding:7px 14px;font-size:12.5px;cursor:pointer;color:var(--ts);font-family:inherit}.shp-seg button.on{background:var(--p);color:#fff}',
    '.shp-tabs{display:flex;gap:2px;border-bottom:1px solid var(--bd);overflow-x:auto;scrollbar-width:none}.shp-tabs::-webkit-scrollbar{display:none}',
    '.shp-tabs button{flex:none;border:0;background:none;padding:10px 13px 11px;font-size:13.5px;color:var(--ts);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:inherit;white-space:nowrap}',
    '.shp-tabs button.on{color:var(--p);font-weight:700;border-bottom-color:var(--p)}.shp-tabs button:hover{color:var(--p)}',
    '.shp-since{font-size:12px;color:var(--ts);display:flex;align-items:center;gap:8px;flex-wrap:wrap}.shp-since-site:empty{display:none}',
    '.shp-body{display:flex;flex-direction:column;gap:14px;transition:opacity .15s}.shp-body.shp-busy{opacity:.55;pointer-events:none}',
    //  타일
    '.shp-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.shp-tiles.four{grid-template-columns:repeat(4,minmax(0,1fr))}.shp-tiles.three{grid-template-columns:repeat(3,minmax(0,1fr))}',
    '.shp-tile{position:relative;background:var(--wh);border:1px solid var(--bd);border-radius:14px;padding:13px 14px 12px;display:flex;flex-direction:column;gap:3px;min-width:0;overflow:hidden}',
    '.shp-tile-l{font-size:12px;color:var(--ts);display:flex;align-items:center;gap:6px}',
    '.shp-tile-v{font-size:1.6rem;font-weight:700;color:var(--p);line-height:1.15;letter-spacing:-.4px}.shp-tile-v small{font-size:.8rem;font-weight:600;margin-left:2px}',
    '.shp-tile-s{font-size:11.5px;color:var(--ts);display:flex;gap:6px;align-items:center;flex-wrap:wrap}.shp-tile-s i{font-style:normal}',
    '.shp-tile-m{display:flex;align-items:flex-end;justify-content:space-between;gap:10px}.shp-tile .shp-spark{flex:0 1 84px;width:84px;height:28px;margin-bottom:4px}',
    '.shp-dot{display:inline-block;width:8px;height:8px;border-radius:50%;flex:none;margin-right:5px;vertical-align:1px}.shp-dot.sq{border-radius:2px}',
    '.shp-delta{font-size:11px;font-weight:700;border-radius:999px;padding:1px 7px;line-height:1.6}.shp-delta.good{color:#006300;background:#e7f4e7}.shp-delta.bad{color:#b42828;background:#fcebea}.shp-delta.na{color:var(--mu);background:#f2f2ef;font-weight:500}.shp-delta.up{color:#006300;background:#e7f4e7}',
    //  카드
    '.shp-card{background:var(--wh);border:1px solid var(--bd);border-radius:14px;padding:15px 16px 14px;min-width:0;margin:0;max-width:none;box-sizing:border-box}',
    '.shp-stats *,.shp-logos *{box-sizing:border-box}',
    '.shp-ch{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;margin-bottom:12px}.shp-ch h3{margin:0;font-size:14px;font-weight:700;color:var(--p)}.shp-ch span{font-size:11.5px;color:var(--ts)}',
    '.shp-sub-h{font-size:12px;font-weight:600;color:var(--ts);margin:12px 0 6px}.shp-sub-h:first-child{margin-top:0}',
    '.shp-grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px}',
    '.shp-note,.shp-foot{font-size:11.5px;color:var(--ts);line-height:1.65;margin-top:10px}.shp-foot{margin-top:0}.shp-note code,.shp-steps code{background:var(--as);border-radius:4px;padding:0 4px;font-size:11px}',
    '.shp-alert{background:#fff8e6;border:1px solid #f4dc9c;color:#6b4e00;border-radius:10px;padding:9px 12px;font-size:12.5px;line-height:1.6}',
    //  범례 · 선 그래프
    '.shp-legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--ts);margin:-2px 0 10px}.shp-legend b{color:var(--tx);font-weight:600}.shp-legend em{font-style:normal;color:var(--mu)}.shp-legend.sm{margin:8px 0 0}',
    '.shp-key-line{display:inline-block;width:14px;height:2px;border-radius:2px;vertical-align:4px;margin-right:6px}',
    '.shp-lc{position:relative;padding-left:34px}.shp-lc-plot{position:relative;height:var(--h,180px);border-bottom:1px solid #c3c2b7}',
    '.shp-lc-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '.shp-lc-g{position:absolute;left:0;right:0;border-top:1px solid var(--grid)}.shp-lc-yl{position:absolute;left:-34px;width:28px;text-align:right;transform:translateY(-50%);font-size:10.5px;color:var(--mu);font-variant-numeric:tabular-nums}',
    '.shp-lc-end{position:absolute;width:8px;height:8px;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 2px var(--wh)}',
    '.shp-lc-xh{position:absolute;top:0;bottom:0;width:0;border-left:1px solid #9a9a95;display:none;pointer-events:none}',
    '.shp-lc-hit{position:absolute;inset:-6px 0;cursor:crosshair;outline:none}.shp-lc-hit:focus-visible{outline:2px solid var(--ac);outline-offset:2px;border-radius:4px}',
    '.shp-lc-x{position:relative;height:18px;font-size:10.5px;color:var(--mu)}.shp-lc-x span{position:absolute;top:4px;transform:translateX(-50%);white-space:nowrap}.shp-lc-x span:first-child{transform:none}.shp-lc-x span:last-child{transform:translateX(-100%)}',
    '.shp-tv{margin-top:8px;font-size:12px;color:var(--ts)}.shp-tv summary{cursor:pointer;width:max-content}.shp-tv .shp-tbl{margin-top:6px}',
    '.shp-spark{display:block;width:96px;height:24px}',
    //  말풍선
    '.shp-tip{position:absolute;z-index:9999;display:none;pointer-events:none;background:#fff;border:1px solid rgba(11,11,11,.12);box-shadow:0 8px 24px rgba(26,31,54,.14);border-radius:10px;padding:8px 10px;font-size:12px;color:#1a1f36;max-width:260px;font-family:inherit;white-space:pre-line}',
    '.shp-tip-h{font-size:11px;color:#5a6278;margin-bottom:4px}.shp-tip-r{display:flex;align-items:center;gap:7px;line-height:1.7}.shp-tip-r b{font-variant-numeric:tabular-nums}.shp-tip-r span{color:#5a6278}.shp-tip-k{display:inline-block;width:12px;height:2px;border-radius:2px}',
    //  막대 · 쌓기
    '.shp-hb{display:flex;flex-direction:column;gap:7px}.shp-hb-r{display:grid;grid-template-columns:132px minmax(0,1fr) 72px;align-items:center;gap:10px;font-size:12.5px;outline:none;border-radius:6px}.shp-hb-r:hover,.shp-hb-r:focus-visible{background:#f6f7fa}',
    '.shp-hb-l{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.shp-hb-t{height:10px;background:#f1f2f6;border-radius:0 4px 4px 0;overflow:hidden}.shp-hb-t span{display:block;height:100%;border-radius:0 4px 4px 0}',
    '.shp-hb-v{text-align:right;font-variant-numeric:tabular-nums;font-weight:600}.shp-hb-v i{font-style:normal;color:var(--mu);font-weight:400;font-size:11px}',
    '.shp-stack{display:flex;gap:2px;height:14px;border-radius:4px;overflow:hidden}.shp-stack span{min-width:3px;outline:none;transition:filter .1s}.shp-stack span:hover,.shp-stack span:focus-visible{filter:brightness(1.12)}',
    //  퍼널
    '.shp-funnel{display:flex;flex-direction:column;gap:8px}.shp-fs{display:grid;grid-template-columns:110px minmax(0,1fr) 64px 52px;align-items:center;gap:10px;font-size:13px;outline:none}',
    '.shp-ft{height:12px;background:#f1f2f6;border-radius:0 4px 4px 0;overflow:hidden}.shp-ft span{display:block;height:100%;border-radius:0 4px 4px 0}.shp-fs b{text-align:right}.shp-fs i{font-style:normal;color:var(--ts);font-size:12px}',
    //  표
    '.shp-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}',
    '.shp-tbl{width:100%;border-collapse:collapse;font-size:12.5px;min-width:640px;font-variant-numeric:tabular-nums}.shp-tbl.sm{min-width:0}',
    '.shp-tbl th{font-weight:600;color:var(--ts);font-size:11.5px;text-align:right;padding:6px 8px;border-bottom:1px solid var(--bd);white-space:nowrap}',
    '.shp-tbl td{text-align:right;padding:9px 8px;border-bottom:1px solid #f0f1f5;vertical-align:middle;white-space:nowrap}.shp-tbl .l{text-align:left}.shp-tbl td.l{white-space:normal}',
    '.shp-tbl td.big{font-size:14.5px;font-weight:700;color:var(--p)}.shp-tbl td.t{color:var(--ts);font-size:11.5px}.shp-tbl tr.shp-hot td{background:#fffaf6}',
    '.shp-tbl .shp-t{font-weight:600;margin-left:6px}.shp-file{display:block;font-size:11.5px;color:var(--ts);margin-top:2px}.shp-file.none{opacity:.7}.shp-url{font-size:11.5px;word-break:break-all}',
    '.shp-cellbar{display:block;height:6px;background:#f1f2f6;border-radius:0 3px 3px 0;overflow:hidden;min-width:60px}.shp-cellbar span{display:block;height:100%;border-radius:0 3px 3px 0}.shp-cellbar.thin{height:3px;margin-top:4px;min-width:48px}',
    '.shp-tbl td.bar{min-width:110px}.shp-cellnum{display:block}',
    '.shp-type{font-style:normal;font-size:10.5px;font-weight:700;border-radius:5px;padding:1px 6px;background:var(--as);color:var(--pl);margin-right:3px}.shp-type-recruit{background:#fdece6;color:#b8461c}.shp-type-event{background:#e8f6f0;color:#127a55}.shp-cat-industry{background:#e8f6f0;color:#127a55}',
    //  언제 오나 (원래 색 그대로)
    '.shp-hours{display:grid;grid-template-columns:repeat(24,minmax(0,1fr));gap:2px}.shp-hours span{height:26px;border-radius:4px;background:var(--as);outline:none}.shp-hours span:hover,.shp-hours span:focus-visible{box-shadow:0 0 0 2px var(--wh),0 0 0 3px var(--p)}',
    '.shp-hlab{display:flex;justify-content:space-between;font-size:10.5px;color:var(--ts);margin:4px 0 14px}',
    '.shp-week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;text-align:center;font-size:11.5px}.shp-week>div{outline:none}.shp-week i{display:block;font-style:normal;color:var(--ts)}.shp-week b{font-weight:600}',
    '.shp-wb{display:flex;align-items:flex-end;height:54px;background:var(--as);border-radius:6px;overflow:hidden}.shp-wb span{display:block;width:100%;background:var(--ac)}',
    //  버튼 · 입력
    '.shp-btn{border:1px solid var(--bd);background:var(--wh);color:var(--p);border-radius:8px;padding:7px 12px;font-size:12.5px;cursor:pointer;font-family:inherit}.shp-btn:hover{border-color:var(--ac)}.shp-btn:disabled{opacity:.45;cursor:default}',
    '.shp-btn.sm{padding:4px 9px;font-size:11.5px}.shp-btn-solid{background:var(--p);color:#fff;border-color:var(--p)}.shp-btn.danger{color:#b42828}',
    '.shp-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px}.shp-row.wrap input{flex:1 1 180px}',
    '.shp-stats input,.shp-stats select{font-family:inherit;font-size:13px;border:1px solid var(--bd);border-radius:8px;padding:7px 10px;background:var(--wh);color:var(--tx);min-width:0}',
    '.shp-filter{width:100%;max-width:280px;margin-bottom:10px}',
    '.shp-lb{display:grid;grid-template-columns:130px 180px minmax(0,1fr) auto;gap:8px}',
    '.shp-steps{margin:0;padding-left:20px;font-size:13px;line-height:1.75}.shp-steps li{margin-bottom:6px}',
    '.shp-logbar label{display:flex;align-items:center;gap:6px}.shp-chip-f{background:var(--as);border-radius:999px;padding:2px 4px 2px 10px;font-size:12px}.shp-chip-f button{border:0;background:none;cursor:pointer;font-size:14px;color:var(--p)}',
    '.shp-who{border:0;background:#f2f3f7;border-radius:6px;padding:1px 7px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;cursor:pointer;color:var(--p)}.shp-who:hover{background:var(--as)}',
    '.shp-logtbl td{font-size:12px;padding:7px 8px}',
    //  SEO
    '.shp-seo{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}.shp-seo li{display:flex;gap:10px;padding:9px 4px;border-bottom:1px solid #f0f1f5;font-size:13px}.shp-seo li:last-child{border:0}',
    '.shp-seo-i{flex:none;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}',
    '.shp-seo li.good .shp-seo-i{background:#0ca30c}.shp-seo li.warn .shp-seo-i{background:#fab219;color:#3d2c00}.shp-seo li.bad .shp-seo-i{background:#d03b3b}',
    '.shp-seo-s{font-style:normal;font-size:11px;color:var(--mu)}.shp-seo .shp-muted{font-size:12px;margin-top:1px}.shp-seo-f{font-size:12px;color:var(--p);margin-top:3px}',
    //  로고 관리
    '.shp-lgl{list-style:none;margin:0;padding:0}.shp-lgl li{display:grid;grid-template-columns:96px minmax(0,1fr) auto auto auto auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #f0f1f5;font-size:13px}.shp-lgl li.off{opacity:.5}',
    '.shp-lgl img{max-width:90px;max-height:32px;object-fit:contain}.shp-lgl-ph{font-size:11px;color:var(--mu)}',
    //  학회 로고 (상단 마크를 그림으로)
    '.shp-brand-on{background:none!important;padding:0!important;overflow:hidden}.shp-brand-img{width:100%;height:100%;object-fit:contain;display:block}',
    '.shp-brand-cur img{height:40px;max-width:120px;object-fit:contain;vertical-align:middle;background:#fff;border:1px solid var(--bd);border-radius:8px;padding:2px}.shp-brand-row+.shp-brand-row{margin-top:12px;padding-top:12px;border-top:1px solid #f0f1f5}',
    //  로고 띠 (홈페이지)
    '.shp-logos{padding:36px 0 28px}.shp-logos-h{text-align:center;font-size:12px;letter-spacing:2.2px;color:var(--ts);font-weight:600;margin-bottom:18px}',
    '.shp-marquee{position:relative;display:flex;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent);mask-image:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)}',
    '.shp-track{display:flex;align-items:center;gap:56px;margin:0;padding:0 28px;list-style:none;flex:none;animation:shp-scroll var(--shp-dur,60s) linear infinite}',
    '.shp-marquee:hover .shp-track{animation-play-state:paused}',
    '@keyframes shp-scroll{from{transform:translateX(0)}to{transform:translateX(-100%)}}',
    '.shp-logo{flex:none;display:flex;align-items:center;height:44px}.shp-logo img{height:34px;max-width:150px;object-fit:contain;transition:filter .3s,opacity .3s}',
    '.shp-logos-gray .shp-logo img{filter:grayscale(1);opacity:.6}.shp-logos-gray .shp-logo img:hover{filter:none;opacity:1}',
    '.shp-logos-n{text-align:center;font-size:11px;color:var(--mu);margin-top:16px;line-height:1.6;padding:0 16px}',
    '.shp-logo-t{font-size:15px;font-weight:700;color:var(--ts);opacity:.75;white-space:nowrap;letter-spacing:-.2px}',
    '.shp-logo-list{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    '@media (prefers-reduced-motion:reduce){.shp-track{animation:none;flex-wrap:wrap;justify-content:center;row-gap:18px}.shp-track2{display:none}.shp-marquee{-webkit-mask-image:none;mask-image:none;justify-content:center}}',
    '.shp-logo-prev .shp-logos{padding:8px 0}',
    //  좁은 화면
    '@media(max-width:900px){.shp-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '@media(max-width:760px){.shp-tiles,.shp-tiles.four,.shp-tiles.three{grid-template-columns:repeat(2,minmax(0,1fr))}.shp-grid2{grid-template-columns:1fr}.shp-fs{grid-template-columns:92px minmax(0,1fr) 54px 46px;gap:7px}.shp-hb-r{grid-template-columns:100px minmax(0,1fr) 60px}.shp-lb{grid-template-columns:1fr 1fr}.shp-lb .shp-lb-out{grid-column:1/-1}.shp-lgl li{grid-template-columns:70px minmax(0,1fr) auto auto;}.shp-lgl li [data-act=toggle],.shp-lgl li [data-act=del]{grid-column:span 2}.shp-tile .shp-spark{flex-basis:56px;width:56px}.shp-track{gap:36px}.shp-logo img{height:28px}}'
  ].join('\n');
  function injectCss() {
    if (document.getElementById('shp-css')) return;
    var s = document.createElement('style'); s.id = 'shp-css'; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }

  // ── 시작 ─────────────────────────────────────────────────────
  function init(opts) {
    cfg = opts || {}; sb = cfg.sb || window.sb || null;
    injectCss();
    if (!sb) { if (cfg.debug) console.warn('[SAFEPlus] Supabase 클라이언트가 없습니다'); return; }
    VID = visitorId();
    SRC_NOW = classify(location.search, document.referrer, navigator.userAgent, location.hostname,
                       cfg.terminalMatch || /\/terminal|terminal\./i);
    HOST_NOW = refHost(document.referrer, location.hostname);
    CMP_NOW = campaignOf(location.search);
    DEV = deviceOf(navigator.userAgent, navigator.maxTouchPoints);
    stripTags();
    if (cfg.trackVisit !== false) track('visit', null);
    if ('IntersectionObserver' in window) io = new IntersectionObserver(onSee, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    watch(document.body);
    if ('MutationObserver' in window) new MutationObserver(function (ms) {
      ms.forEach(function (m) { [].forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) watch(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
    document.addEventListener('click', onClick, true);
    document.addEventListener('auxclick', onClick, true);
    if (cfg.logos) renderLogos(cfg.logos);
    if (cfg.brand) loadBrand();
  }

  window.SAFEPlus = {
    init: init, track: track, latestGen: latestGen, renderLogos: renderLogos,
    showStats: showStats, hideStats: hideStats, setOfficer: setOfficer, renderAnalyticsNotice: renderAnalyticsNotice,
    loadBrand: loadBrand, applyBrand: applyBrand,
    //  시험용
    _classify: classify, _refHost: refHost, _campaign: campaignOf, _device: deviceOf, _entryYY: entryYY,
    _visitor: function () { return VID; }, _source: function () { return SRC_NOW; },
    _seo: seoRun, _state: D
  };
})();
