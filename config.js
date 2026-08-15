/* ═══════════════════════════════════════════════════════════════
   SAFE 웹사이트 설정 파일

   ⚙️ 아래 두 줄만 본인 프로젝트 값으로 바꾸세요.
      Supabase 대시보드에서:
        SUPABASE_URL      → Settings → Data API → Project URL
        SUPABASE_ANON_KEY → Settings → API Keys → Publishable key

   ⚠️ 주의사항
      · URL 끝에 슬래시(/)를 붙이지 마세요.
      · 반드시 sb_publishable_ 로 시작하는 키를 쓰세요.
        sb_secret_ 로 시작하는 키는 절대 넣으면 안 됩니다.

   💡 이 파일이 따로 있는 이유
      앞으로 index.html 을 새 버전으로 교체해도
      이 파일만 그대로 두면 키를 다시 입력할 필요가 없습니다.
   ═══════════════════════════════════════════════════════════════ */

window.SAFE_CONFIG = {
  SUPABASE_URL:      'https://vxccyrwnrewsnbmgqiqd.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_YPRU6IL_gV9hsdYwD1CkPw_wUDuX0_2'
};
