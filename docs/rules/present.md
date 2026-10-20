# 수업용 슬라이드(수업용 화면) 규칙

선생님이 교실 화면에 띄워 개념을 설명하고 **빈칸 정답을 하나씩 공개**하는 한 장짜리 HTML.
본보기: `lessons/ai/01/present.html`(「인공지능이란?」, 2026-10-19 처음 만듦 · 이력 `docs/log/activity.md`).

## 1. 파일 하나만 두면 나머지는 빌드가 한다

- 차시 폴더에 **`present.html`** 을 둔다 → `npm run build` 가
  1. `dist/pages/<단원>/<차시>/present.html` 로 같이 올리고(`scripts/build.mjs` · `renderPage` — `msi-asset:` 표식만 바꿈, 제출 스크립트 없음),
  2. **사이트 첫 화면의 그 차시 줄에 `학생용 · 교사용 · 수업용 슬라이드` 버튼**을 붙인다(`scripts/lib/index-page.mjs`, 선생님 지시 2026-10-20).
     `present.html` 이 없는 차시에는 버튼이 생기지 않는다 — 첫 화면은 손으로 고치지 않는다.
- 주소: `https://sage810.github.io/info-lesson/<단원>/<차시>/present.html` · 이 PC `http://127.0.0.1:8080/<단원>/<차시>/present.html`
- 메모(피드백 모드)도 된다: `…/present.html?memo=1` (`#n` 을 붙이면 n번째 장부터 열림).

## 2. 새 차시에 만들 때

1. `lessons/ai/01/present.html` 을 새 차시 폴더로 복사하고 `<title>`(「<차시 제목> 수업용 화면」)과 `<section class="slide">` 장들만 바꾼다.
   머리의 `<meta name="robots" content="noindex">`, `<style id="msi-role-tokens">` 블록(자동 생성), 글꼴 `msi-asset:shared/fonts/…`, 아래 스크립트는 그대로 둔다.
2. 장은 활동지(`lesson.html`) 순서대로: 표지 → 내 정보 적기 → 사용 안내 → 도입 → 활동 1… → 정리 → 형성평가.
   장마다 `data-role`(색 역할) · `data-phase`(도입/전개/정리) · `data-code`(ACTIVITY_1 …) · `data-badge` · `data-title`(카드 제목) · `data-name`(장 이름)을 적는다.
3. 공개 부품(정답 가림 → 누르거나 Space 로 하나씩 열림): 글자 빈칸 `.qb` · 이름표 칸 `.lm-s`(+ 위 `.tray` 이름표) · 하나 고르기 `.pick` · O/X `.oxq` · 열 하나씩 `.colrv`.
   이름표 색은 같은 낱말이면 어느 장에서나 같게 — 머리 CSS 의 `[data-v="…"]{--cat:…}` 줄.
4. 색은 역할 토큰 `var(--msi-role-…)` 만. 그림·영상은 `assets/` + `msi-asset:./assets/…`.
5. 무대는 1600×900 고정(창 크기에 맞춰 줄였다 늘림, 스크롤 없음) — 한 장에 넘치면 두 장으로 나눈다.

## 3. 활동지를 고치면 수업용 화면도 맞춘다

활동지에서 활동·표 줄·이름표·O/X 를 빼거나 더하면 `present.html` 의 같은 장도 같이 고친다(2026-10-20 ai/01 활동 4 삭제 때처럼).
빠진 장에만 쓰던 CSS·이름표 색 줄도 함께 지우고, 장이 비면 남은 내용을 가운데에 크게 둔다.

## 4. 확인

- `npm run build` → 모든 장을 브라우저로 열어 오류·넘침 0, 바뀐 장은 「👀 이 화면 정답 모두 보기」 전후 캡처
  (Playwright 스크립트는 scratchpad 에 — 페이지의 `window.__present.go(i)` · `revealAll(true)` · `count` 를 쓴다).
- 첫 화면(`dist/pages/index.html`)에 그 차시의 「수업용 슬라이드」 버튼이 보이는지.
