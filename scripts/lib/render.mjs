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

/**
 * @param lesson  listLessons() 의 한 항목
 * @param opts    { variant: 'embed'|'pages', raw?: boolean, teacher?: boolean, hook?: boolean }
 * @returns       { html, copies: [{ from, to }] }  — copies 는 pages 변형에서 dist/pages 로 복사할 파일
 */
export function renderLesson(lesson, opts) {
  const { variant, raw = false, teacher = false, hook = true } = opts;
  const copies = new Map();
  let html = readText(lesson.src);

  // 1) 표식이 없는 곳에 우연히 들어간 경우를 막기 위해, 모든 치환은 함수형 replacer 로 한다($ 문자 보호).
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
      inject.push('<style id="msi-teacher">/* 교사용: 옆 고정 "활동 진행률" 위젯 숨김 */'
        + '.sheet-progress{display:none!important}</style>');
    }
    if (hook && cfg.apiUrl) { // Apps Script 주소가 없으면 아무것도 덧붙이지 않는다 → 예전 배포본과 똑같음
      const runtime = {
        lesson: lesson.id,
        title: lesson.meta.title || '',
        teacher,
        apiUrl: cfg.apiUrl || '',
        submit: !!cfg.submit && !teacher,
        neisProxy: !!cfg.neisProxy,
        token: cfg.submitToken || '',
      };
      inject.push(`<script id="msi-config">window.MSI_CONFIG=${JSON.stringify(runtime)};</script>`);
      const hookFile = path.join(ROOT, HOOK_PATH);
      if (variant === 'embed') inject.push('<script>' + readText(hookFile) + '</script>');
      else { copies.set(HOOK_PATH, hookFile); inject.push(`<script src="${relFromPage(HOOK_PATH, lesson)}"></script>`); }
    }
    if (inject.length) {
      const block = '\n' + inject.join('\n') + '\n';
      const i = html.lastIndexOf('</body>');
      html = i >= 0 ? html.slice(0, i) + block + html.slice(i) : html + block;
    }
  }

  return { html, copies: [...copies].map(([to, from]) => ({ to, from })) };
}
