---
name: lesson-theme
description: >
  정보 수업 활동지의 차시 테마(색·모양) 루틴 — Claude Design 에서 받은 테마(handoff zip·견본 HTML)를
  design/themes/<이름>/theme.css 로 옮기고, 틀 미리보기로 견본과 비교하고, 차시에 입히고(숫자 모양 차시는 변수로 바꾼 뒤),
  아이콘을 그림으로 바꾸고, PDF 까지 확인한다. "Claude Design 이 테마 만들어줬어", "이 zip 테마로", "견본으로 적용",
  "N차시에 테마 입혀줘", "테마 바꿔줘", 테마 미리보기에서 온 「아이콘 변경」 피드백, "/lesson-theme" 에 사용.
  테마와 상관없는 활동지 고치기는 lesson-edit, 새 차시는 lesson-new(`--theme <이름>`).
---

# lesson-theme — 차시 테마 만들기 · 입히기

**기준 문서는 `docs/rules/theme.md`**(먼저 읽는다). 본보기 테마는 `design/themes/sticker/`(theme.css · theme.md · icons/).
테마는 `lesson.json` 의 `"theme": "<이름>"` 한 줄로 고르고, 빌드가 theme.css 를 `</body>` 앞에 넣는다 — lesson.html 은 원칙적으로 안 고친다.
도구는 `references/`(모두 저장소 루트에서 `node .claude/skills/lesson-theme/references/<도구>.mjs …`). 서버: `node scripts/serve.mjs`.

## 순서

1. **받기** — zip 은 scratchpad 의 **빈 폴더**에 풀고 `README.md` → 견본 HTML 을 끝까지 → 토큰 표(md)를 읽는다.
   원본은 `input/claude-design/<이름>/` 에 복사(견본 HTML · md). **업로드 사진·원작 캐릭터 그림은 넣지 않는다**(공개 저장소).
2. **먼저 물을 것**(선생님 결정 규칙 — 선택지 + 추천):
   - 테마 이름(영문 소문자·숫자·`-`) · 어느 차시에 입힐지
   - 견본에 **마크업을 바꿔야 하는 장식**이 있으면(예: 단계 번호를 별 안에) 할지 말지 — 기본은 안 함
   - 메뉴 탭 모양(테마가 바꿀 수 있음, 2026-10-22) · 견본과 규칙이 어긋나는 곳
   - 차시 내용이 틀과 다를 때 **통째로 덮어쓰지 않는다** — 「내용은 그대로, 모양만」이 기본
3. **theme.css 쓰기** — `:root` 변수 덮어쓰기가 중심(색 `--msi-role-*` · 잉크 바꾸면 `--msi-rgb-ink` · 모양 `--msi-shape-*` · 유리 `--msi-glass-*` · 움직임),
   변수로 안 되는 장식만 선택자 규칙. 견본 값 ↔ 우리 변수 대응은 sticker/theme.css 를 본보기로. 설명은 `design/themes/<이름>/theme.md`.
4. **틀에서 보기** — `npm run template-preview -- order --theme <이름>` → http://127.0.0.1:8080/_preview/template-order/
   - `node scripts/template-capture.mjs order "<scratchpad>/shots" --theme <이름>`(20장) ↔ `references/shot-design.mjs "<견본.html>" "<폴더>"` 나란히 Read
   - 견본과 다른 곳을 고치고 다시. 시안을 둘 이상 보여 줄 땐 dist/pages/_preview/ 아래에 비교 페이지(저장소 파일은 안 건드림)
5. **PDF 리허설** — `references/pdf-rehearse.mjs "<주소>" "<폴더>"` → `.claude/skills/lesson-new/references/pdf-pages.mjs` 로 쪽 그림 → 테마 색·모양·아이콘이 PDF 에도 있는지
6. **차시에 입히기**
   - 틀에서 만든 차시(`--msi-shape-*` 를 씀): `lesson.json` 에 `"theme": "<이름>"` 한 줄
   - 숫자 모양 차시(틀을 변수로 바꾸기 전에 복사한 차시): lesson.html 을 scratchpad 에 복사 → `references/to-vars.mjs <단원/차시>`
     → `references/style-compare.mjs <단원/차시> "<사본>"` 이 **✔ 전후 계산 스타일 같음**일 때만 테마 줄을 넣는다
   - 수업용 화면(present.html)이 있으면: 사본 → `references/to-vars.mjs <단원/차시> --file present.html` → `references/style-compare.mjs <단원/차시> "<사본>" --present`(모든 장 × 가림/열림)
     → theme.css 「수업용 화면」 묶음(`#stage …`)으로 장식 · 아이콘. 모든 장을 캡처해 넘침 · 오류 0(`window.__present`)
   - `npm run check -- <차시>` → 캡처 확인 → PDF 리허설
7. **아이콘 그림**(피드백 「아이콘 변경」) — 원작 캐릭터·브랜드 그림이면 공개 사이트에 올라간다는 것을 먼저 알리고 묻는다(한 번 정하면 같은 종류는 따름).
   받은 파일을 scratchpad 로 복사 → `references/icon-make.mjs "<입력>" "design/themes/<이름>/icons/<이름>.png"`(128px, 단색 바탕 지움) → 색 바탕 위에서 Read 로 확인
   → theme.css 에 `[data-ic="<이모지>"]` 규칙(아래 함정 참고). 틀·차시의 이모지 자리에 `data-ic` 가 없으면 붙인다(테마 없을 때 화면 같은지 확인).
8. **기록** — `design/themes/<이름>/theme.md`(바꾼 것 · 견본과 다르게 둔 것 · 확인) · 피드백이면 `.claude/feedback.md` `[x]` · 새 방식이면 `docs/rules/theme.md` · `docs/log/activity.md`.
   미리보기 주소를 알리고 PushNotification(CLAUDE.md 알림 규칙). 올리기는 선생님이 「올려줘」 할 때만.

## 함정 (모두 겪은 것)

- 색은 `#hex`·`rgba()` 만 — `color-mix()`·`oklch()` 등은 빌드가 멈춘다(PDF html2canvas). 요소 자신의 `inset` 그림자 X(PDF 흰 판) → `::after`.
- 유리·오로라 끄기: `--msi-glass-top/-top-head/-sheen/-white: none` · `--msi-glass-inset*: 0 0 0 0 rgba(0,0,0,0)` · `--msi-glass-backdrop: none` · `aurora-*-aNN: rgba(0,0,0,0)`.
- **인라인 style** 로 그리는 것(메뉴 탭 `tabChip()` · 창 단추 · 카드 머리 · 아이콘 칸 배경)은 선택자에 `!important`. 아이콘 칸 배경은 그림 longhand(`background-image` 등)만 `!important` 하면 카드 색은 남는다.
- **「글자 16px 이상」 강제 규칙**(`#sheetPrintArea :is(… .ai-ox .q .why …)`, 세기 1·3·0)을 이기려면 같은 세기 이상 — 예 `.m-badge.m-badge:is(…)`.
- **PDF 는 id 를 지운 복제본(`.msi-pdf-clone`)을 찍는다** → 카드 쪽 규칙은 `:is(#sheetPrintArea, .msi-pdf-clone) …` 로 써야 PDF 에도 나온다.
- 테마 그림은 `url(msi-asset:design/themes/<이름>/…)`(저장소 루트 기준) — 빌드가 사이트용은 파일로, 한 파일(embed)은 data URI 로. SVG data URI(`url("data:image/svg+xml,…")`)는 안에서 `var()` 를 못 쓴다.
- 탭 이모지와 카드 이모지가 같아도(🍚) 그림은 따로 — `#appTitlebar .tab-chip [data-ic]` / `.m-badge[data-ic]`.
- 비교 캡처 md5 가 가끔 다르면 화면에 떠 있는 「📊 진행률」 버튼이 걸친 것 — 다시 돌려 보고, 계산 스타일 비교(style-compare)를 기준으로.
