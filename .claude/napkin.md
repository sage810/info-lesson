# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-09-24] dist/ 는 빌드 결과라 고쳐도 다음 빌드에 사라짐**
   Do instead: `lessons/<단원>/<차시>/lesson.html` 을 고치고 `npm run check -- <차시>` 로 확인.
2. **[2026-09-24] 전체 캡처는 너무 길어서 고친 곳이 안 보임**
   Do instead: `npm run check -- <차시> --find "<고친 곳 근처 글자>"` → `dist/check/<단원>-<차시>-find.png` 를 연다.
3. **[2026-09-24] 완성본 HTML(3~4MB)을 손으로 옮기면 표식이 깨짐**
   Do instead: `npm run import -- <파일> <단원>/<차시>` — 원본과 바이트 단위로 같은지 스스로 확인한다.
4. **[2026-09-30] 4탭 차시를 Playwright 로 재면 좌표가 어긋남(x-dc 숨은 복제본 + `zoom`)**
   Do instead: 선택자에 `:visible` 을 붙이고, 넘침·정렬은 `getBoundingClientRect` 대신 요소 캡처로 눈 확인.

## Shell & Command Reliability
1. **[2026-09-24] file:// 로 연 활동지에서 `fetch at 'file:…'` CORS 콘솔 오류가 뜸**
   Do instead: 개편 전 원본도 똑같이 뜨는 기존 경고 — 무시(`npm run check` 도 걸러냄).
2. **[2026-09-24] 헤드리스 브라우저로 PDF 버튼을 누르면 받은 파일 이름이 `download` 로 나옴**
   Do instead: 원본도 같음. 파일 이름 검증은 실제 브라우저로 하고, 스크립트에선 `saveAs(경로)` 로 이름을 정한다.
3. **[2026-09-24] 이 환경은 Windows PowerShell — 한글 파일을 PowerShell 로 읽고 쓰면 인코딩이 깨지기 쉬움**
   Do instead: 파일 가공은 Node 스크립트(`scripts/`)로 한다. NEIS 받기(`fetch-neis.ps1`)만 pwsh 7.
4. **[2026-09-30] Read 도구로 PDF 가 안 열림(pdftoppm 없음), Python 도 없음**
   Do instead: `.claude/skills/lesson-new/references/pdf-pages.mjs`(pdf.js 를 scratchpad 에 설치)로 쪽 그림을 뽑아 Read.

## Domain Behavior Guardrails
1. **[2026-09-24] x-dc 는 화면에 안 보이는 원본 템플릿 복제본을 남김 → 전역 querySelector 가 엉뚱한 요소를 잡음**
   Do instead: `document` 위임 IIFE + 이벤트 대상 기준 `closest()`·형제 탐색.
2. **[2026-09-24] lesson.html 의 표식(`<script data-msi-src>`, `msi-asset:`, NEIS 스냅샷)을 지우면 빌드가 깨짐**
   Do instead: 표식은 그대로 두고, 그림은 `assets/` 에 넣고 `msi-asset:./assets/이름.png` 로 참조.
3. **[2026-09-24] 진행률 계산 방식이 차시마다 다름(05 `_progressParts` · 04 `sheetProgress` · 06 `sheetChecklist`)**
   Do instead: 빈칸·퀴즈를 추가하면 그 차시 방식에 맞춰 진행률도 함께 고친다. 새 차시는 05 방식.
4. **[2026-09-24] 외부 디자인 스킬(better-colors 등)은 새 팔레트·새 스타일을 제안할 수 있음**
   Do instead: `docs/rules/design.md` 토큰이 우선. 토큰 밖 색·서체는 제안만 하고 적용하지 않는다.
5. **[2026-09-29] 4탭 활동지 시간표·급식이 "–"로 빔 = NEIS 스냅샷 기간이 끝난 것**
   (인증키 없는 실시간 조회는 pIndex 를 무시하고 샘플 5행만 줘서 스냅샷을 못 메움)
   Do instead: `pwsh scripts/fetch-neis.ps1 -TimetableWeeks 8` → `npm run neis` → check → push.
   급식은 한 달치씩 덮어쓰므로 새 달이 시작된 뒤에 받는다. 근본 해결은 Apps Script 프록시(`neisProxy`).
6. **[2026-09-30] SVG 그림에 width·height 가 없으면 "PDF로 저장하기"(html2canvas)에서 빈 칸**
   Do instead: `<svg width="96" height="96" viewBox="0 0 96 96">` 처럼 크기를 적고, 정답지 PDF 를 쪽 그림으로 뽑아 확인.

## User Directives
1. **[2026-09-24] "고민만", "가능 여부만" 이라고 하면 만들지 않는다**
   Do instead: 판단·선택지·근거만 답하고, 파일을 만들거나 고치지 않는다.
2. **[2026-09-24] 같은 활동지 파일을 계속 고친다**
   Do instead: `_v2`·새 파일을 만들지 말고 같은 `lesson.html` 을 최소 diff 로 수정. "새로 만들자"고 할 때만 `/lesson-new`.
