#!/usr/bin/env node
// 4탭(이용 규칙·시간표·오늘의 급식·수업 활동지) 차시의 화면을 지금 규칙대로 맞춘다 — 이미 적용된 묶음은 건너뛴다.
//
//   npm run portal-upgrade                 → 4탭(lesson.json shell: portal) 차시 전부
//   npm run portal-upgrade -- 06           → 6차시만 (여러 개: 01 05)
//   npm run portal-upgrade -- 06 --dry     → 고치지 않고 무엇을 할지만 보여 줌
//
// 밖에서 만든 옛 모양 HTML 을 `npm run import` 로 가져왔거나, 옛 차시를 복사했을 때 돌린다.
// 묶음(규칙 문서: docs/rules/portal/*.md)
//   lunch-center  오늘의 급식 · 일간: 메뉴 이름 가운데 → 알레르기 태그는 다음 줄 가운데      (lunch.md §5.3)
//   tab-chips     제목줄 탭 = 첫 화면 칩 버튼 모양, 오른쪽 정렬, 좁은 화면 2×2                (rule.md §2)
//   time-date     시간표: 날짜 카드를 "시간표 TIMETABLE" 제목 아래 줄로                      (timetable.md)
//   meal-nav      오늘의 급식: 보기 버튼 아래 날짜 카드 + ◀ ▶ (일간 하루·토일 건너뜀 / 주간 한 주 / 월간 한 달) (lunch.md §5.2)
// 앵커 문자열은 "정확히 1번" 찾혀야 한다. 하나라도 어긋나면 그 차시는 파일을 건드리지 않고 ✖ 로 알린다.
import fs from 'node:fs';
import path from 'node:path';
import { pickLessons, readText, rel } from './lib/common.mjs';

export function upgrade(src) {
  let s = src;
  const E = s.includes('\r\n') ? '\r\n' : '\n';
  const J = (...l) => l.join(E);
  const rep = (a, b) => { const c = s.split(a).length - 1; if (c !== 1) throw new Error(`앵커 ${c}번 — ${a.slice(0, 70).replace(/\r?\n/g, '⏎')}`); s = s.replace(a, b); };
  const addCss = (css) => { const i = s.indexOf('</style>'); if (i < 0) throw new Error('</style> 없음'); s = s.slice(0, i) + css + s.slice(i); };
  const done = [];

  // ── lunch-center ─────────────────────────────────────────────────────────────
  if (!s.includes('m.hasAl')) {
    rep('<div style="display:flex; alignItems:center; justifyContent:center; gap:12px; padding:10px 12px; border:3px solid #4b3b6b; borderRadius:10px; background:#fdf6fa">',
        '<div style="display:flex; flexDirection:column; alignItems:center; justifyContent:center; gap:6px; padding:10px 12px; border:3px solid #4b3b6b; borderRadius:10px; background:#fdf6fa; textAlign:center">');
    rep(J('                        <span style="display:flex; gap:5px; flexWrap:wrap">',
          '                          <sc-for list="{{ m.allergens }}" as="a" hint-placeholder-count="2">',
          '                            <span style="{{ a.style }}">{{ a.label }}</span>',
          '                          </sc-for>',
          '                        </span>'),
        J('                        <sc-if value="{{ m.hasAl }}" hint-placeholder-val="{{ true }}">',
          '                          <span style="display:flex; gap:5px; flexWrap:wrap; justifyContent:center">',
          '                            <sc-for list="{{ m.allergens }}" as="a" hint-placeholder-count="2">',
          '                              <span style="{{ a.style }}">{{ a.label }}</span>',
          '                            </sc-for>',
          '                          </span>',
          '                        </sc-if>'));
    rep(J('        name: dishName(it.name),', '        allergens: it.al.map((n) => {'),
        J('        name: dishName(it.name),', '        hasAl: it.al.length > 0,', '        allergens: it.al.map((n) => {'));
    done.push('lunch-center');
  }

  // ── tab-chips ────────────────────────────────────────────────────────────────
  if (!s.includes('tabChip(')) {
    rep('<div id="appTitlebar" style="display:flex; alignItems:flex-end; gap:14px; padding:14px 16px 0;',
        '<div id="appTitlebar" style="display:flex; alignItems:center; flexWrap:wrap; gap:10px 14px; padding:14px 16px;');
    rep(`fontSize:25px; letterSpacing:.5px; flex:none; whiteSpace:nowrap; paddingBottom:12px">🏫 신현중학교 정보</div>${E}        <div style="flex:1"></div>${E}        <div style="display:flex; gap:4px; alignItems:flex-end">`,
        `fontSize:25px; letterSpacing:.5px; flex:none; whiteSpace:nowrap">🏫 신현중학교 정보</div>${E}        <div role="tablist" aria-label="화면 고르기" style="marginLeft:auto; display:flex; gap:8px; flexWrap:wrap; alignItems:center">`);
    for (const [k, name] of [['Rules', '📜</span><span>이용 규칙'], ['Time', '🕒</span><span>시간표'], ['Meal', '🍚</span><span>오늘의 급식'], ['Sheet', '✏️</span><span>수업 활동지']]) {
      rep(`<div onClick="{{ go${k} }}" style="{{ tab${k} }}"><span>${name}</span></div>`,
          `<div class="tab-chip" role="tab" aria-selected="{{ tab${k}Sel }}" onClick="{{ go${k} }}" style="{{ tab${k} }}"><span>${name}</span></div>`);
    }
    rep('        <div style="display:flex; gap:6px; paddingBottom:12px">', '        <div class="win-btns" style="display:flex; gap:6px">');
    rep('  tabStyle(active, color, cap) {', J(
      '  /* 제목줄 탭 — 첫 화면(index) 칩 버튼과 같은 모양. 고른 탭은 탭 색으로 채우고 눌린 모양(design.md §3.7 chip is-on) */',
      '  tabChip(active, color) {',
      "    return 'cursor:pointer; display:flex; alignItems:center; gap:6px; whiteSpace:nowrap; padding:7px 13px; border:3px solid #4b3b6b; borderRadius:9px; color:#4b3b6b; background:' + (active ? color : '#fffdf7') +",
      "      \"; fontFamily:'CookieRun', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif; fontWeight:700; fontSize:15px; boxShadow:\" + (active ? '2px 2px 0 rgba(75,59,107,.35)' : '3px 3px 0 rgba(75,59,107,.25)') +",
      "      '; transform:' + (active ? 'translate(1px,1px)' : 'none');",
      '  }',
      '',
      '  tabStyle(active, color, cap) {'));
    for (const [k, id, col] of [['Rules', 'rules', '#fbe6a2'], ['Time', 'time', '#c4d8f7'], ['Meal', 'meal', '#bfe9dd'], ['Sheet', 'sheet', '#f9cade']]) {
      const re = new RegExp(`( *)tab${k}: this\\.tabStyle\\(s\\.tab === '${id}', '[^']+', '[^']+'\\),`);
      const m = s.match(re); if (!m) throw new Error(`tab${k}: this.tabStyle(...) 줄 없음`);
      s = s.replace(re, `${m[1]}tab${k}: this.tabChip(s.tab === '${id}', '${col}'), tab${k}Sel: String(s.tab === '${id}'),`);
    }
    addCss(J(
      '  /* 제목줄 칩 탭 — 안 고른 탭 hover: 떠오르기만(색은 고른 탭 표시용이라 바꾸지 않음) */',
      '  .tab-chip[aria-selected="false"]:hover { transform:translate(-1px,-1px) !important; box-shadow:4px 4px 0 rgba(75,59,107,.35) !important; }',
      '  /* 좁은 화면: 창 버튼은 제목 옆으로, 탭 4개는 아래 줄에 2×2 */',
      '  @media (max-width: 560px) {',
      '    #appTitlebar [role="tablist"] { order: 2; width: 100%; margin-left: 0 !important; display: grid !important; grid-template-columns: 1fr 1fr; }',
      '    #appTitlebar .tab-chip { justify-content: center; }',
      '    #appTitlebar .win-btns { order: 1; margin-left: auto; }',
      '  }', ''));
    done.push('tab-chips');
  }

  // ── time-date ────────────────────────────────────────────────────────────────
  if (!s.includes('alignSelf:center; marginTop:-8px">{{ todayLabel }}')) {
    const dateRe = /( *)<div style="(border:3px solid #4b3b6b; borderRadius:10px; background:#fffdf7; padding:5px 14px;[^"]*)">\{\{ todayLabel \}\}<\/div>\r?\n/;
    const m = s.match(dateRe); if (!m) throw new Error('시간표 날짜 카드({{ todayLabel }}) 줄 없음');
    s = s.replace(dateRe, '');
    const t = s.indexOf('TIMETABLE</div>'); if (t < 0 || s.indexOf('TIMETABLE</div>', t + 1) >= 0) throw new Error('TIMETABLE 앵커');
    const close = s.indexOf(`${E}            </div>`, t); if (close < 0) throw new Error('시간표 머리 줄 닫는 곳 없음');
    const at = close + E.length + '            </div>'.length;
    s = s.slice(0, at) + `${E}            <div style="${m[2]}; alignSelf:center; marginTop:-8px">{{ todayLabel }}</div>` + s.slice(at);
    done.push('time-date');
  }

  // ── meal-nav ─────────────────────────────────────────────────────────────────
  if (!s.includes('mealWeekMon')) {
    rep("mealLoadedMonth: '', neisErr: ''", "mealLoadedMonth: '', mealDay: '', mealWeek: '', mealMonth: '', neisErr: ''");
    rep(`    this.loadMeal(new Date());${E}`, `    this.loadMeal(new Date());${E}    { const fri = mondayOf(new Date()); fri.setDate(fri.getDate() + 4); this.loadMeal(fri); }   // 이번 주가 두 달에 걸치면 다음 달 급식도${E}`);
    rep('    if (this._mealPending === mk) return;', J('    this._mealMonths = this._mealMonths || {};', '    if (this._mealPending === mk || this._mealMonths[mk]) return;'));
    rep(J("      this._mealPending = '';", '      const meal = Object.assign({}, (this._snap && this._snap.meal) || {});'),
        J("      this._mealPending = '';", '      this._mealMonths[mk] = true;', '      const fresh = {};'));
    rep("        meal[d] = { items: items, kcal: kcal, type: r.MMEAL_SC_NM || '중식' };", "        fresh[d] = { items: items, kcal: kcal, type: r.MMEAL_SC_NM || '중식' };");
    rep('      if (Object.keys(meal).length) this.setState({ meal: meal, mealLoadedMonth: mk });',
        '      this.setState((st) => ({ meal: Object.assign({}, (this._snap && this._snap.meal) || {}, st.meal || {}, fresh), mealLoadedMonth: mk }));');
    rep(J('  monthGrid(fn) {',
          '    const first = new Date(2026, 8, 1);',
          '    const pad = first.getDay();',
          '    const total = 30;',
          '    const nowD = this.state.now || new Date();',
          '    const nowInMonth = nowD.getFullYear() === 2026 && nowD.getMonth() === 8;',
          '    const out = [];',
          '    for (let i = 0; i < 35; i++) {'),
        J('  monthGrid(fn, y, m) {',
          '    // y·m(0부터)을 주면 그 달 — 급식 월간 ◀ ▶. 안 주면 예전처럼 2026년 9월(시간표 월간)',
          '    const Y = y == null ? 2026 : y, M = m == null ? 8 : m;',
          '    const first = new Date(Y, M, 1);',
          '    const pad = first.getDay();',
          '    const total = new Date(Y, M + 1, 0).getDate();',
          '    const nowD = this.state.now || new Date();',
          '    const nowInMonth = nowD.getFullYear() === Y && nowD.getMonth() === M;',
          '    const out = [];',
          '    const cells = Math.ceil((pad + total) / 7) * 7;   // 5주 또는 6주',
          '    for (let i = 0; i < cells; i++) {'));
    rep(J('    const tMeal = (s.meal || {})[ymd(todayObj)];',
          '    const todayMeal = {',
          "      date: todayObj.getFullYear() + '.' + ('0' + (todayObj.getMonth() + 1)).slice(-2) + '.' +",
          "        ('0' + todayObj.getDate()).slice(-2) + ' ' + dowEn[todayObj.getDay()],"),
        J('    // 오늘의 급식 · 일간 — 고른 날(mealDay, 비어 있으면 오늘). ◀ ▶ 는 하루씩 움직이되 토·일은 건너뛴다',
          '    //   (월요일에서 ◀ → 지난주 금요일, 금요일에서 ▶ → 다음 주 월요일). 다른 달로 넘어가면 그 달 급식을 받아 온다.',
          '    const todayYmd = ymd(todayObj);',
          '    const mealDayObj = s.mealDay ? new Date(+s.mealDay.slice(0, 4), +s.mealDay.slice(5, 7) - 1, +s.mealDay.slice(8, 10))',
          '      : new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());',
          '    const mealIsToday = ymd(mealDayObj) === todayYmd;',
          '    const stepMealDay = (dir) => () => {',
          '      const d = new Date(mealDayObj); d.setDate(d.getDate() + dir);',
          '      while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + dir);',
          "      this.setState({ mealDay: ymd(d) === todayYmd ? '' : ymd(d) });",
          '      this.loadMeal(d);',
          '    };',
          "    const korDate = (d) => d.getFullYear() + '년 ' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + ')';",
          "    const korShort = (d) => (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + ['일', '월', '화', '수', '목', '금', '토'][d.getDay()] + ')';",
          '    // 주간 ◀ ▶ = 한 주씩(월~금), 월간 ◀ ▶ = 한 달씩. 비어 있으면 이번 주·이번 달. 필요한 달의 급식을 받아 온다',
          '    const pYmd = (k) => new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));',
          '    const thisMon = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());',
          '    const mealWeekMon = s.mealWeek ? pYmd(s.mealWeek) : thisMon;',
          '    const mealWeekFri = new Date(mealWeekMon); mealWeekFri.setDate(mealWeekMon.getDate() + 4);',
          '    const stepMealWeek = (dir) => () => {',
          '      const d = new Date(mealWeekMon); d.setDate(d.getDate() + 7 * dir);',
          '      const fri = new Date(d); fri.setDate(d.getDate() + 4);',
          "      this.setState({ mealWeek: ymd(d) === ymd(thisMon) ? '' : ymd(d) });",
          '      this.loadMeal(d); this.loadMeal(fri);',
          '    };',
          "    const mealMonth0 = s.mealMonth ? pYmd(s.mealMonth + '-01') : new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);",
          '    const stepMealMonth = (dir) => () => {',
          '      const d = new Date(mealMonth0.getFullYear(), mealMonth0.getMonth() + dir, 1);',
          "      this.setState({ mealMonth: ymd(d).slice(0, 7) === todayYmd.slice(0, 7) ? '' : ymd(d).slice(0, 7) });",
          '      this.loadMeal(d);',
          '    };',
          '    const tMeal = (s.meal || {})[ymd(mealDayObj)];',
          '    const todayMeal = {',
          "      tag: mealIsToday ? 'TODAY_LUNCH' : 'LUNCH',",
          "      kcalLabel: mealIsToday ? '오늘 전체 칼로리' : '이 날 전체 칼로리',",
          "      date: mealDayObj.getFullYear() + '.' + ('0' + (mealDayObj.getMonth() + 1)).slice(-2) + '.' +",
          "        ('0' + mealDayObj.getDate()).slice(-2) + ' ' + dowEn[mealDayObj.getDay()],"));
    rep("[{ name: '오늘은 급식 정보가 없어요', al: [] }]", "[{ name: mealIsToday ? '오늘은 급식 정보가 없어요' : '이 날은 급식 정보가 없어요', al: [] }]");
    rep(J('    const weekMeals = DAYS.map((d, i) => {', '      const dt = new Date(monday); dt.setDate(monday.getDate() + i);'),
        J('    const weekMeals = DAYS.map((d, i) => {', '      const dt = new Date(mealWeekMon); dt.setDate(mealWeekMon.getDate() + i);'));
    rep(J('    const mealMonthCells = this.monthGrid((day) => {',
          '      const mm = (s.meal || {})[ymd(new Date(2026, 8, day))];',
          "      return { icon: '', main: '', menu: mm ? mm.items.map((it) => dishName(it.name)).slice(0, 6) : [], chips: [] };",
          '    });'),
        J('    const mealMonthCells = this.monthGrid((day) => {',
          '      const mm = (s.meal || {})[ymd(new Date(mealMonth0.getFullYear(), mealMonth0.getMonth(), day))];',
          "      return { icon: '', main: '', menu: mm ? mm.items.map((it) => dishName(it.name)).slice(0, 6) : [], chips: [] };",
          '    }, mealMonth0.getFullYear(), mealMonth0.getMonth());'));
    rep('      todayMeal, weekMeals, mealMonthCells,', J(
      '      todayMeal, weekMeals, mealMonthCells,',
      "      // 카드 문구는 두 조각(주간: '9월 28일 (월) ~' + '10월 2일 (금)') — 좁은 화면에서 날짜 중간이 아니라 조각 사이에서 줄바꿈",
      "      mealCardA: s.mealView === 'week' ? korShort(mealWeekMon) + ' ~'",
      "        : s.mealView === 'month' ? mealMonth0.getFullYear() + '년 ' + (mealMonth0.getMonth() + 1) + '월' : korDate(mealDayObj),",
      "      mealCardB: s.mealView === 'week' ? korShort(mealWeekFri) : '',",
      "      mealPrev: s.mealView === 'week' ? stepMealWeek(-1) : s.mealView === 'month' ? stepMealMonth(-1) : stepMealDay(-1),",
      "      mealNext: s.mealView === 'week' ? stepMealWeek(1) : s.mealView === 'month' ? stepMealMonth(1) : stepMealDay(1),",
      "      mealPrevAria: s.mealView === 'week' ? '지난주 급식' : s.mealView === 'month' ? '지난달 급식' : '이전 급식',",
      "      mealNextAria: s.mealView === 'week' ? '다음 주 급식' : s.mealView === 'month' ? '다음 달 급식' : '다음 급식',",
      "      mealNavStyle: this.chip(false, '#bfe9dd'),"));
    rep('fontSize:11px">TODAY_LUNCH</span>', 'fontSize:11px">{{ todayMeal.tag }}</span>');
    rep('fontSize:17px">오늘 전체 칼로리</span>', 'fontSize:17px">{{ todayMeal.kcalLabel }}</span>');
    const views = s.indexOf('<sc-for list="{{ mealViews }}"'); if (views < 0) throw new Error('mealViews 없음');
    const close = s.indexOf(`${E}              </div>`, views); if (close < 0) throw new Error('급식 보기 버튼 줄 닫는 곳 없음');
    const at = close + E.length + '              </div>'.length;
    const card = "border:3px solid #4b3b6b; borderRadius:10px; background:#fffdf7; padding:5px 14px; fontFamily:'CookieRun', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif; fontWeight:700; fontSize:16px; boxShadow:3px 3px 0 rgba(75,59,107,.18); whiteSpace:nowrap";
    s = s.slice(0, at) + E + J(
      '              <div class="meal-nav" style="display:flex; alignItems:center; justifyContent:center; gap:10px; marginTop:6px">',
      '                <div class="meal-nav-btn" role="button" aria-label="{{ mealPrevAria }}" title="{{ mealPrevAria }}" onClick="{{ mealPrev }}" style="{{ mealNavStyle }}">◀</div>',
      `                <div class="meal-date" style="${card}"><span class="md-part">{{ mealCardA }}</span><span class="md-part">{{ mealCardB }}</span></div>`,
      '                <div class="meal-nav-btn" role="button" aria-label="{{ mealNextAria }}" title="{{ mealNextAria }}" onClick="{{ mealNext }}" style="{{ mealNavStyle }}">▶</div>',
      '              </div>') + s.slice(at);
    addCss(J(
      '  .meal-date { display: flex; flex-wrap: wrap; justify-content: center; column-gap: .35em; }',
      '  .meal-date .md-part { white-space: nowrap; }',
      '  .meal-date .md-part:empty { display: none; }',
      '  /* 급식 ◀ 날짜 ▶ — 좁은 화면에서 창 안에 들어오게(인라인 스타일을 이기려고 !important) */',
      '  @media (max-width: 420px) {',
      '    .meal-nav { gap: 6px !important; }',
      '    .meal-nav-btn { padding: 6px 10px !important; }',
      '    .meal-date { padding: 5px 9px !important; font-size: 14px !important; white-space: normal !important; text-align: center; }',
      '  }', ''));
    done.push('meal-nav');
  }
  return { s, done };
}

if (process.argv[1] && path.basename(process.argv[1]) === 'portal-upgrade.mjs') {
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const picked = args.some((a) => !a.startsWith('--')) ? pickLessons(args) : pickLessons([]).filter((l) => l.meta.shell === 'portal');
let failed = 0;
for (const l of picked) {
  if (l.meta.shell !== 'portal') { console.log(`– ${l.id}: 4탭(portal) 차시가 아니라 건너뜀`); continue; }
  try {
    const src = readText(l.src);
    const { s, done } = upgrade(src);
    if (!done.length) { console.log(`✔ ${l.id}: 이미 모두 적용됨`); continue; }
    if (!dry) fs.writeFileSync(l.src, s, 'utf8');
    console.log(`${dry ? '·' : '✔'} ${l.id}: ${done.join(' · ')}${dry ? ' (--dry: 고치지 않음)' : ''} → ${rel(l.src)}`);
  } catch (e) {
    failed++;
    console.log(`✖ ${l.id}: ${e.message} — 이 차시는 고치지 않았어요`);
  }
}
if (failed) process.exit(1);
}
