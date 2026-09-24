// GitHub Pages 첫 화면(차시 목록). lessons/*/lesson.json 만 보고 만든다 — 손으로 고칠 필요 없음.
// 디자인은 docs/rules/design.md 의 토큰(잉크·크림 종이·격자 배경·파스텔 헤더)을 그대로 쓴다.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ACCENTS = ['#a9dce4', '#c4d8f7', '#fbe6a2', '#d6c4f5', '#bfe9dd', '#eec6ea', '#f7bfb2', '#e3e0b0'];

export function renderIndex(lessons) {
  const units = new Map();
  for (const l of lessons) {
    if (l.meta.status === 'hidden') continue;
    if (!units.has(l.unit)) units.set(l.unit, { title: l.meta.unitTitle || l.unit, items: [] });
    units.get(l.unit).items.push(l);
  }
  let n = 0;
  const sections = [...units].map(([unit, u]) => `
    <section class="unit">
      <h2><span class="tag">${esc(unit.toUpperCase().replace(/-/g, '_'))}</span>${esc(u.title)}</h2>
      <ul>${u.items.map((l) => `
        <li class="card" style="--accent:${ACCENTS[n++ % ACCENTS.length]}">
          <div class="head"><span class="no">${esc(l.no)}차시</span>${l.meta.status === 'draft' ? '<span class="draft">준비 중</span>' : ''}</div>
          <div class="body">
            <p class="title">${esc(l.meta.title)}</p>
            <p class="links">
              <a class="btn" href="${esc(l.unit)}/${esc(l.no)}/">학생용 열기</a>
              <a class="btn ghost" href="${esc(l.unit)}/${esc(l.no)}/teacher.html">교사용</a>
            </p>
          </div>
        </li>`).join('')}
      </ul>
    </section>`).join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>신현중학교 정보 수업 활동지</title>
<style>
  @font-face{font-family:'CookieRun';font-weight:700;src:url(shared/fonts/CookieRun-700.woff2) format('woff2');font-display:swap}
  @font-face{font-family:'Maplestory';font-weight:300;src:url(shared/fonts/Maplestory-300.woff2) format('woff2');font-display:swap}
  @font-face{font-family:'Maplestory';font-weight:700;src:url(shared/fonts/Maplestory-700.woff2) format('woff2');font-display:swap}
  :root{--ink:#4b3b6b;--paper:#fffdf7;--page:#e7e3f7;--grid:#d8d2ee;--muted:#8b7cb8;--sh:rgba(75,59,107,.18)}
  *{box-sizing:border-box}
  body{margin:0;padding:24px 16px 48px;color:var(--ink);font-family:'Maplestory','Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-weight:300;
    background-color:var(--page);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:28px 28px}
  .window{max-width:980px;margin:0 auto;background:var(--paper);border:4px solid var(--ink);border-radius:16px;box-shadow:8px 8px 0 rgba(75,59,107,.22);overflow:hidden}
  .titlebar{background:linear-gradient(90deg,#f9cade 0%,#d6c4f5 55%,#c4d8f7 100%);border-bottom:4px solid var(--ink);padding:14px 18px}
  .titlebar h1{margin:0;font-family:'CookieRun',sans-serif;font-weight:700;font-size:24px}
  .titlebar p{margin:4px 0 0;font-size:14px}
  main{padding:18px}
  .unit h2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-family:'CookieRun',sans-serif;font-size:20px;margin:6px 0 14px}
  .tag{font:700 11px/1 monospace;letter-spacing:1px;border:3px solid var(--ink);border-radius:6px;padding:5px 7px;background:#fbe6a2}
  ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}
  .card{border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:var(--paper);box-shadow:5px 5px 0 var(--sh)}
  .card .head{background:var(--accent);border-bottom:3px solid var(--ink);padding:8px 12px;display:flex;justify-content:space-between;align-items:center}
  .no{font-family:'CookieRun',sans-serif;font-weight:700}
  .draft{font-size:12px;border:2px dashed var(--ink);border-radius:6px;padding:1px 6px;background:var(--paper)}
  .card .body{padding:12px}
  .title{margin:0 0 12px;font-weight:700;font-size:16px;line-height:1.45}
  .links{margin:0;display:flex;gap:8px;flex-wrap:wrap}
  .btn{display:inline-block;text-decoration:none;color:var(--ink);font-weight:700;font-size:14px;border:3px solid var(--ink);border-radius:10px;padding:6px 12px;background:#9db2f2;box-shadow:3px 3px 0 var(--sh)}
  .btn.ghost{background:var(--paper)}
  .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 rgba(75,59,107,.35)}
  .btn:focus-visible{outline:3px solid #ee9dbf;outline-offset:2px}
  footer{max-width:980px;margin:16px auto 0;text-align:center;color:#6b7fa8;font-size:13px}
</style>
</head>
<body>
<div class="window">
  <div class="titlebar"><h1>🏫 신현중학교 정보 수업 활동지</h1><p>차시를 골라 열어요. 교사용은 진행률 위젯이 없는 화면이에요.</p></div>
  <main>${sections || '<p>아직 등록된 차시가 없어요.</p>'}</main>
</div>
<footer>자동 생성 페이지 · lessons/ 폴더의 lesson.json 을 바꾸면 다음 배포 때 반영돼요.</footer>
</body>
</html>
`;
}
