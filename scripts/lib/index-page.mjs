// GitHub Pages 첫 화면 — 수업 활동지(lessons/*/lesson.json + lessons/units.json) · 수업 자료(materials/). 손으로 고칠 필요 없음.
// 디자인은 docs/rules/design.md 의 토큰(잉크·크림 종이·격자 배경·파스텔 헤더)을 그대로 쓴다.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ACCENTS = ['#a9dce4', '#c4d8f7', '#fbe6a2', '#d6c4f5', '#bfe9dd', '#eec6ea', '#f7bfb2', '#e3e0b0'];
// 이 확장자는 새 탭에서 열고, 나머지(pptx·hwp·zip …)는 내려받는다
const OPENS_IN_TAB = new Set(['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'txt']);
const fileSize = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

export function renderIndex(lessons, units = [], materials = []) {
  // 단원 순서·이름·예정 차시 수는 units.json. 거기 없는 단원은 뒤에 붙이고 만든 차시만 보여 준다.
  const byUnit = new Map(units.map((u) => [u.unit, { title: u.title, planned: u.planned || 0, items: [] }]));
  for (const l of lessons) {
    if (l.meta.status === 'hidden') continue;
    if (!byUnit.has(l.unit)) byUnit.set(l.unit, { title: l.meta.unitTitle || l.unit, planned: 0, items: [] });
    byUnit.get(l.unit).items.push(l);
  }
  // 차시 한 줄 — 줄 전체가 학생용 링크(제목 링크를 줄 크기로 늘림), 아래 작은 줄에 학생용 · 교사용 링크
  const lessonRow = (l) => `
          <li class="row live">
            <span class="num">${esc(l.no)}</span>
            <div class="txt">
              <a class="name" href="${esc(l.unit)}/${esc(l.no)}/">${esc(l.meta.title)}</a>${l.meta.status === 'draft' ? ' <span class="draft">준비 중</span>' : ''}
              <div class="subs"><a class="chip" href="${esc(l.unit)}/${esc(l.no)}/">학생용</a><a class="chip" href="${esc(l.unit)}/${esc(l.no)}/teacher.html">교사용</a></div>
            </div>
          </li>`;
  const soonRow = (no) => `
          <li class="row soon"><span class="num">${no}</span><div class="txt"><span class="name">준비 중이에요</span></div></li>`;

  // 단원마다 세로 칸 하나 — 예정 차시(01 ~ planned)마다 한 줄, 아직 없으면 "준비 중" 줄. 예정 밖 차시는 뒤에.
  const unitColumns = [...byUnit].map(([, u], i) => {
    const slots = Array.from({ length: u.planned }, (_, k) => String(k + 1).padStart(2, '0'));
    const rows = [
      ...slots.map((no) => { const l = u.items.find((x) => x.no === no); return l ? lessonRow(l) : soonRow(no); }),
      ...u.items.filter((l) => !slots.includes(l.no)).map(lessonRow),
    ];
    const range = u.planned ? `1–${u.planned}차시` : `${u.items.length}차시`;
    return `
      <section class="unit" style="--accent:${ACCENTS[i % ACCENTS.length]}">
        <div class="unit-head"><h3>${esc(u.title)}</h3><span class="range">${range}</span></div>
        ${rows.length ? `<ol class="rows">${rows.join('')}
        </ol>` : '<p class="empty">아직 등록된 차시가 없어요.</p>'}
      </section>`;
  }).join('');

  let n = 0;

  const fileCards = materials.map((m) => {
    const ext = (m.file.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
    const inTab = OPENS_IN_TAB.has(ext);
    return `
        <li class="card" style="--accent:${ACCENTS[n++ % ACCENTS.length]}">
          <div class="head"><span class="tag">${esc(ext.toUpperCase() || 'FILE')}</span><span class="size">${fileSize(m.size)}</span></div>
          <div class="body">
            <p class="title">${esc(m.title)}</p>${m.desc ? `
            <p class="desc">${esc(m.desc)}</p>` : ''}
            <p class="links"><a class="btn" href="materials/${esc(encodeURIComponent(m.file))}"${inTab ? ' target="_blank" rel="noopener"' : ' download'}>${inTab ? '열기' : '내려받기'}</a></p>
          </div>
        </li>`;
  }).join('');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>신현중학교 정보</title>
<style>
  @font-face{font-family:'CookieRun';font-weight:700;src:url(shared/fonts/CookieRun-700.woff2) format('woff2');font-display:swap}
  @font-face{font-family:'Maplestory';font-weight:300;src:url(shared/fonts/Maplestory-300.woff2) format('woff2');font-display:swap}
  @font-face{font-family:'Maplestory';font-weight:700;src:url(shared/fonts/Maplestory-700.woff2) format('woff2');font-display:swap}
  :root{--ink:#4b3b6b;--paper:#fffdf7;--page:#e7e3f7;--grid:#d8d2ee;--muted:#8b7cb8;--muted-2:#6b5b93;--sh:rgba(75,59,107,.18)}
  *{box-sizing:border-box}
  body{margin:0;padding:24px 16px 48px;color:var(--ink);font-family:'Maplestory','Apple SD Gothic Neo','Malgun Gothic',sans-serif;font-weight:300;
    background-color:var(--page);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:28px 28px}
  .window{max-width:980px;margin:0 auto;background:var(--paper);border:4px solid var(--ink);border-radius:16px;box-shadow:8px 8px 0 rgba(75,59,107,.22);overflow:hidden}
  @media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
  .titlebar{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;background:linear-gradient(90deg,#f9cade 0%,#d6c4f5 55%,#c4d8f7 100%);border-bottom:4px solid var(--ink);padding:14px 18px}
  .titlebar h1{margin:0;font-family:'CookieRun',sans-serif;font-weight:700;font-size:24px;white-space:nowrap}
  /* 칩 버튼 — 제목줄 바로 가기 · 차시의 학생용/교사용이 같이 쓴다 */
  .chip{position:relative;display:inline-block;padding:7px 13px;border:3px solid var(--ink);border-radius:9px;background:var(--paper);box-shadow:3px 3px 0 rgba(75,59,107,.25);
    font-family:'CookieRun',sans-serif;font-weight:700;font-size:15px;line-height:1.2;color:var(--ink);text-decoration:none;white-space:nowrap}
  .chip:hover{background:#fbe6a2;transform:translate(-1px,-1px);box-shadow:4px 4px 0 rgba(75,59,107,.35)}
  .chip:focus-visible{outline:3px solid #ee9dbf;outline-offset:2px}
  /* 제목줄 오른쪽 바로 가기 — 폭이 좁으면 제목 아래 줄로 내려가 오른쪽 정렬 */
  .nav{margin-left:auto;display:flex;flex-wrap:wrap;gap:8px}
  .area{scroll-margin-top:16px}
  .notice{margin:0 0 22px;padding:10px 14px 10px 32px;border:3px solid var(--ink);border-radius:11px;background:#fffaee;font-size:14px;line-height:1.6}
  main{padding:18px}
  .area h2{font-family:'CookieRun',sans-serif;font-weight:700;font-size:22px;margin:4px 0 16px}
  .area + .area{margin-top:28px;padding-top:22px}
  .empty{margin:0;color:var(--muted-2);font-size:14px}
  /* 수업 활동지: 단원마다 세로 칸, 칸 안에 차시가 한 줄씩 */
  .units{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px;align-items:start}
  .unit{border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:var(--paper);box-shadow:5px 5px 0 var(--sh)}
  /* 단원 이름(왼쪽) + 예정 차시 태그(같은 줄 오른쪽, 흰 바탕) */
  .unit-head{background:var(--accent);border-bottom:3px solid var(--ink);padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px}
  .range{flex:none;font-size:12px;font-weight:700;line-height:1;border:2px solid var(--ink);border-radius:6px;padding:5px 8px;background:#fff;white-space:nowrap}
  .unit h3{margin:0;font-family:'CookieRun',sans-serif;font-weight:700;font-size:19px}
  .unit .empty{padding:14px 16px}
  .rows{list-style:none;margin:0;padding:0}
  .row{position:relative;display:flex;gap:14px;align-items:flex-start;min-height:90px;padding:13px 16px}
  .row + .row{border-top:2px dashed rgba(75,59,107,.16)}
  .num{flex:none;width:22px;padding-top:2px;font-family:'CookieRun',sans-serif;font-weight:700;font-size:14px;color:var(--muted-2)}
  .txt{min-width:0}
  .row .name{font-weight:700;font-size:15px;line-height:1.45;color:var(--ink);text-decoration:none}
  .row.live .name::after{content:'';position:absolute;inset:0}
  .row.live:hover{background:rgba(251,230,162,.32)}
  .subs{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
  .subs .chip{padding:4px 11px;font-size:14px}
  .row .name:focus-visible{outline:3px solid #ee9dbf;outline-offset:2px;border-radius:4px}
  .row.soon .num{color:#a596cc}
  .row.soon .name{font-weight:300;color:var(--muted-2)}
  .draft{font-size:12px;border:2px dashed var(--ink);border-radius:6px;padding:1px 6px;background:var(--paper);white-space:nowrap}
  /* 수업 자료: 파일 카드 */
  .cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr));gap:14px}
  .card{display:flex;flex-direction:column;border:3px solid var(--ink);border-radius:14px;overflow:hidden;background:var(--paper);box-shadow:5px 5px 0 var(--sh)}
  .card .head{background:var(--accent);border-bottom:3px solid var(--ink);padding:8px 12px;display:flex;justify-content:space-between;align-items:center}
  .tag{font:700 11px/1 monospace;letter-spacing:1px;border:3px solid var(--ink);border-radius:6px;padding:5px 7px;background:var(--paper)}
  .size{font-size:13px}
  .card .body{flex:1;display:flex;flex-direction:column;padding:12px}
  .title{margin:0 0 12px;font-weight:700;font-size:16px;line-height:1.45}
  .desc{margin:-6px 0 12px;font-size:14px;line-height:1.5;color:var(--muted-2)}
  .links{margin:auto 0 0;display:flex;gap:8px;flex-wrap:wrap}
  .btn{display:inline-block;text-decoration:none;color:var(--ink);font-weight:700;font-size:14px;border:3px solid var(--ink);border-radius:10px;padding:6px 12px;background:#9db2f2;box-shadow:3px 3px 0 var(--sh)}
  .btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 rgba(75,59,107,.35)}
  .btn:focus-visible{outline:3px solid #ee9dbf;outline-offset:2px}
</style>
</head>
<body>
<div class="window">
  <div class="titlebar">
    <h1>🏫 신현중학교 정보</h1>
    <nav class="nav" aria-label="바로 가기"><a class="chip" href="#lessons">📝 수업 활동지</a><a class="chip" href="#materials">📂 수업 자료</a></nav>
  </div>
  <main>
    <ul class="notice">
      <li>차시를 골라 열어요. 교사용은 진행률 위젯이 없는 화면이에요.</li>
      <li>자동 생성 페이지 · lessons/ 와 materials/ 폴더를 바꾸면 다음 배포 때 반영돼요.</li>
    </ul>
    <section class="area" id="lessons">
      <h2>📝 수업 활동지</h2>
      ${unitColumns ? `<div class="units">${unitColumns}
      </div>` : '<p class="empty">아직 등록된 차시가 없어요.</p>'}
    </section>
    <section class="area" id="materials">
      <h2>📂 수업 자료</h2>
      ${fileCards ? `<ul class="cards">${fileCards}
      </ul>` : '<p class="empty">아직 올린 자료가 없어요.</p>'}
    </section>
  </main>
</div>
</body>
</html>
`;
}
