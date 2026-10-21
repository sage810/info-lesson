// lesson.html(소스) → 배포용 HTML 로 바꾸는 핵심 로직.
//   variant 'embed' : 모든 것을 한 파일에 인라인 (구글 사이트 "삽입할 코드"용, 예전 방식과 동일)
//   variant 'pages' : 폰트·라이브러리·이미지를 별도 파일로 링크 (GitHub Pages용, 가볍고 캐시됨)
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT, SCRIPT_MARKER_RE, ASSET_MARKER_RE, SNAPSHOT_MARKER, MIME_BY_EXT,
  readText, resolveMarkerPath, loadConfig,
} from './common.mjs';

const HOOK_PATH = 'shared/runtime/msi-hook.js';
const MEMO_PATH = 'shared/runtime/msi-memo.js';   // 선생님 전용 수정 요청 메모(?memo=1 로 켬). pages 변형에만 붙는다

// pages 변형에서 파일이 놓일 위치(dist/pages 기준 경로)
function pagesTarget(markerPath, lesson) {
  if (markerPath.startsWith('./')) return `${lesson.unit}/${lesson.no}/${markerPath.slice(2)}`;
  return markerPath; // shared/...
}
const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/');
function relFromPage(target, lesson) {
  const pageDir = `${lesson.unit}/${lesson.no}`;
  return encodePath(path.posix.relative(pageDir, target));
}

// 차시 테마(2026-10-21, docs/rules/theme.md) — lesson.json 의 "theme": "<이름>" 이면 design/themes/<이름>/theme.css 를
// </body> 바로 앞에 <style id="msi-theme"> 로 넣는다. 맨 끝이라 기본 토큰(:root)과 화면 프로그램이 나중에 붙이는 본문 CSS 를 모두 이긴다.
// 테마가 없거나, PDF 저장(html2canvas 1.4.1)이 못 읽는 색 함수를 쓰면 빌드를 멈춘다.
export const THEMES_DIR = path.join(ROOT, 'design', 'themes');
export function themeBlock(meta, where = '') {
  const name = meta && meta.theme;
  if (!name) return '';
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error(`${where}테마 이름은 영문 소문자·숫자·- 만: "${name}"`);
  const file = path.join(THEMES_DIR, name, 'theme.css');
  if (!fs.existsSync(file)) throw new Error(`${where}테마가 없어요: design/themes/${name}/theme.css (lesson.json 의 "theme")`);
  const css = readText(file).trim();
  const bad = css.replace(/\/\*[\s\S]*?\*\//g, '').match(/(?<![\w-])(color-mix|color|oklch|oklab|lab|lch|hwb)\(/);
  if (bad) throw new Error(`${where}테마 ${name}: ${bad[1]}() 는 PDF 저장(html2canvas 1.4.1)이 못 읽어요 — #hex·rgba() 로 (docs/rules/theme.md)`);
  return `<style id="msi-theme" data-theme="${name}">\n${css}\n</style>`;
}

function mustExist(file, marker, lesson) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${lesson.id}] 표식이 가리키는 파일이 없어요: ${marker} → ${path.relative(ROOT, file)}`);
  }
}

// 표식(<script data-msi-src> · msi-asset:) → embed 는 파일 내용을 넣고, pages 는 상대 경로로 바꾸며 복사할 파일을 copies 에 모은다.
function swapMarkers(html, lesson, variant, copies) {
  // 한쪽에만 넣는 부분(2026-10-20, 큰 영상 등): <!--msi-pages-only-->…<!--/msi-pages-only--> 는 embed(구글 사이트 한 파일)에서,
  // <!--msi-embed-only-->…<!--/msi-embed-only--> 는 pages(사이트)에서 뺀다. 표식을 먼저 걷어 내야 빠진 쪽 그림·영상이 붙지 않는다.
  const drop = variant === 'embed' ? 'pages-only' : 'embed-only';
  html = html.replace(new RegExp(`<!--msi-${drop}-->[\\s\\S]*?<!--/msi-${drop}-->`, 'g'), () => '');
  // 표식이 없는 곳에 우연히 들어간 경우를 막기 위해, 모든 치환은 함수형 replacer 로 한다($ 문자 보호).
  html = html.replace(SCRIPT_MARKER_RE, (m, p) => {
    const file = resolveMarkerPath(p, lesson.dir);
    mustExist(file, p, lesson);
    if (variant === 'embed') return '<script>' + readText(file) + '</script>';
    const target = pagesTarget(p, lesson);
    copies.set(target, file);
    return `<script src="${relFromPage(target, lesson)}"></script>`;
  });

  html = html.replace(ASSET_MARKER_RE, (m, p) => {
    const file = resolveMarkerPath(p, lesson.dir);
    mustExist(file, p, lesson);
    if (variant === 'embed') {
      const mime = MIME_BY_EXT[path.extname(file).toLowerCase()];
      if (!mime) throw new Error(`[${lesson.id}] 지원하지 않는 파일 형식: ${p}`);
      return `data:${mime};base64,` + fs.readFileSync(file).toString('base64');
    }
    const target = pagesTarget(p, lesson);
    copies.set(target, file);
    return relFromPage(target, lesson);
  });
  return html;
}

/**
 * @param lesson  listLessons() 의 한 항목
 * @param opts    { variant: 'embed'|'pages', raw?: boolean, teacher?: boolean, hook?: boolean }
 * @returns       { html, copies: [{ from, to }] }  — copies 는 pages 변형에서 dist/pages 로 복사할 파일
 */
export function renderLesson(lesson, opts) {
  const { variant, raw = false, teacher = false, hook = true } = opts;
  const copies = new Map();
  let html = swapMarkers(readText(lesson.src), lesson, variant, copies);

  if (html.includes(SNAPSHOT_MARKER)) {
    const snapFile = path.join(ROOT, 'data', 'neis-snapshot.json');
    if (!fs.existsSync(snapFile)) throw new Error('data/neis-snapshot.json 이 없어요. `npm run neis` 로 만들어 주세요.');
    const snap = readText(snapFile).replace(/\s+$/, '');
    html = html.split(SNAPSHOT_MARKER).join('/*NEIS_SNAPSHOT_START*/' + snap + '/*NEIS_SNAPSHOT_END*/');
  }

  // 2) raw 는 "원본과 바이트 단위로 같은지" 확인할 때만 쓴다. 평소 빌드에서는 아래를 덧붙인다.
  if (!raw) {
    const cfg = loadConfig();
    const inject = [];
    const theme = themeBlock(lesson.meta, `[${lesson.id}] `);
    if (theme) inject.push(swapMarkers(theme, lesson, variant, copies));   // 테마 그림도 msi-asset: 표식(저장소 루트 기준, 예: design/themes/<이름>/x.png)
    if (teacher) {
      // 교사용 규칙(2026-10-13 선생님 지시): 왼쪽 고정바는 절대 없다 — docs/rules/teacher.md
      //   알려진 것: 진행률 위젯(.sheet-progress) · 07 묶음(.sheet-side) · 09·10 도움말 카드(.guide-card)
      //   이름을 모르는 새 고정바도 아래 스크립트가 숨긴다(화면 왼쪽에 붙은 position:fixed 덩어리). npm run check 가 다시 확인한다.
      inject.push('<style id="msi-teacher">.sheet-progress,.sheet-side,.guide-card{display:none!important}</style>');
      inject.push('<script id="msi-teacher-nofix">(function(){'
        + 'function sweep(){var vw=window.innerWidth||1;document.querySelectorAll("body *").forEach(function(e){'
        + 'if(e.id==="toast"||e.closest("[data-msi-memo]"))return;var cs=getComputedStyle(e);if(cs.position!=="fixed"||cs.display==="none")return;'
        + 'var r=e.getBoundingClientRect();if(r.height>=40&&r.left<vw*0.25&&r.width<vw*0.4)e.style.setProperty("display","none","important");});}'
        + 'var t;function later(){clearTimeout(t);t=setTimeout(sweep,60);}'
        + 'window.addEventListener("load",sweep);window.addEventListener("resize",later);'
        + 'if(window.MutationObserver)new MutationObserver(later).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:["style","class"]});'
        + 'sweep();})();</script>');
    }
    if (hook && cfg.apiUrl) { // Apps Script 주소가 없으면 아무것도 덧붙이지 않는다 → 예전 배포본과 똑같음
      const runtime = {
        lesson: lesson.id,
        title: lesson.meta.title || '',
        teacher,
        apiUrl: cfg.apiUrl || '',
        submit: (!!cfg.submit || !!lesson.meta.submit) && !teacher,   // lesson.json 의 "submit": true 면 그 차시만 켬(09 수행평가)
        neisProxy: !!cfg.neisProxy,
        token: cfg.submitToken || '',
      };
      inject.push(`<script id="msi-config">window.MSI_CONFIG=${JSON.stringify(runtime)};</script>`);
      const hookFile = path.join(ROOT, HOOK_PATH);
      if (variant === 'embed') inject.push('<script>' + readText(hookFile) + '</script>');
      else { copies.set(HOOK_PATH, hookFile); inject.push(`<script src="${relFromPage(HOOK_PATH, lesson)}"></script>`); }
    }
    if (variant === 'pages') { // 켜지 않으면 아무것도 하지 않는 작은 스크립트 — 학생 화면은 그대로
      const memoFile = path.join(ROOT, MEMO_PATH);
      copies.set(MEMO_PATH, memoFile);
      inject.push(`<script src="${relFromPage(MEMO_PATH, lesson)}"></script>`);
    }
    if (inject.length) {
      const block = '\n' + inject.join('\n') + '\n';
      const i = html.lastIndexOf('</body>');
      html = i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + block;
    }
  }

  return { html, copies: [...copies].map(([to, from]) => ({ to, from })) };
}

/**
 * 차시 폴더의 다른 페이지(present.html = 선생님이 띄우는 수업용 화면) — 표식만 바꾸고 제출 스크립트는 붙이지 않는다.
 * 수정 요청 메모(?memo=1)만 차시 페이지처럼 붙인다. 차시 페이지와 같은 폴더(dist/pages/<단원>/<차시>/)라 상대 경로 계산이 같다.
 */
export function renderPage(lesson, file) {
  const copies = new Map();
  let html = swapMarkers(readText(file), lesson, 'pages', copies);
  copies.set(MEMO_PATH, path.join(ROOT, MEMO_PATH));
  let theme = themeBlock(lesson.meta, `[${lesson.id}] `);   // 수업용 화면도 차시 테마 색을 따른다
  if (theme) theme = swapMarkers(theme, lesson, 'pages', copies);
  const tag = `\n${theme ? theme + '\n' : ''}<script src="${relFromPage(MEMO_PATH, lesson)}"></script>\n`;
  const i = html.lastIndexOf('</body>');
  html = i >= 0 ? html.slice(0, i) + tag + html.slice(i) : html + tag;
  return { html, copies: [...copies].map(([to, from]) => ({ to, from })) };
}
