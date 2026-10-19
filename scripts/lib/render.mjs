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

function mustExist(file, marker, lesson) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${lesson.id}] 표식이 가리키는 파일이 없어요: ${marker} → ${path.relative(ROOT, file)}`);
  }
}

// 표식(<script data-msi-src> · msi-asset:) → embed 는 파일 내용을 넣고, pages 는 상대 경로로 바꾸며 복사할 파일을 copies 에 모은다.
function swapMarkers(html, lesson, variant, copies) {
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
  const tag = `\n<script src="${relFromPage(MEMO_PATH, lesson)}"></script>\n`;
  const i = html.lastIndexOf('</body>');
  html = i >= 0 ? html.slice(0, i) + tag + html.slice(i) : html + tag;
  return { html, copies: [...copies].map(([to, from]) => ({ to, from })) };
}
