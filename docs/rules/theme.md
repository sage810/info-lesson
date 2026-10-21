# 차시 테마 — 차시마다 색·모양 바꾸기 (선생님 결정 2026-10-21)

- **바꾸는 것**: 색 + 모양(모서리 · 테두리 두께 · 그림자). **글꼴은 모든 차시가 같다**(DESIGN.md 의 네 글꼴).
- **고르는 곳**: 차시 `lesson.json` 의 `"theme": "<이름>"` 한 줄. 줄이 없으면 기본 테마(DESIGN.md 「파스텔 레트로 OS」).
- **테마 파일**: `design/themes/<이름>/theme.css`(+ 설명 `theme.md`). Claude Design 원본 자료는 `input/claude-design/<이름>/`.
- 지난 차시(data-analysis 01~10)는 줄이 없으니 지금 모양 그대로다. **ai/01 은 `sticker`**(선생님 결정 2026-10-22).

## 1. 어떻게 입혀지나

- 빌드(`scripts/lib/render.mjs` 의 `themeBlock`)가 theme.css 를 `<style id="msi-theme" data-theme="<이름>">` 로 **`</body>` 바로 앞**에 넣는다.
  차시 페이지 · 교사용 · 구글 사이트용 한 파일(embed) · 수업용 화면(present.html) 모두.
- 맨 끝이라 기본 토큰(`<style id="msi-role-tokens">` 의 `:root`)과, 화면 프로그램(dc-runtime)이 나중에 붙이는 본문 CSS 를 **모두 이긴다**.
  그래서 theme.css 는 `:root{}` 변수 덮어쓰기가 중심이고, 변수로 안 되는 장식만 선택자 규칙으로 더한다.
- `lesson.html` 은 건드리지 않는다. 테마를 고치면 그 테마를 쓰는 차시가 다음 빌드 때 함께 바뀐다.
- 빌드가 멈추는 경우: 테마 폴더가 없음 · 이름에 영문 소문자·숫자·`-` 말고 다른 글자 · PDF 가 못 읽는 색 함수(아래 3절).
- **모양 변수는 틀(`_templates/order`)과 거기서 만든 차시만 쓴다**(2026-10-21 틀을 변수로 바꿈 — 바꾸기 전후 계산 스타일 4탭·폰·올림·누름·포커스 모두 같음 확인).
  ai/01 도 2026-10-22 변수로 바꿈(틀 줄을 숫자로 되돌려 같은 줄은 틀 줄로 — 전후 계산 스타일 4탭 × 1280/390 모두 같음).
  예전 차시(data-analysis)는 숫자 그대로라 테마를 걸어도 색 일부만 바뀐다 → 걸지 않는다. present.html 도 색만 따른다.

## 2. 바꿀 수 있는 변수

### 색 — 역할 토큰 `--msi-role-*` (전체 표: `color-map.md`)
| 자리 | 변수(`--msi-role-` 뒤) |
|---|---|
| 바탕 · 잉크 | `page-bg`(바깥) · `page-grid`(바탕 모눈 선) · `base-night-sky-ink`(테두리·본문 글자) · `base-cream-paper`(창·카드 몸통 기본) · `base-blush-paper`(입력칸) · `base-muted-violet`(흐린 설명 글자) · `ui-placeholder`(입력칸 안내 글) |
| 카드 한 벌 | `<카드>-head` · `<카드>-body` — topic · goals · warmup · intro · act1 · act2 · act3 · act4 · summary · checkup · progress, 번호 동전 `goals-coin` · `checkup-coin` |
| 탭 | `tab-rules` · `tab-time` · `tab-meal` · `tab-sheet` |
| 버튼 | `chip-glass` · `chip-ok` · `chip-no` · `pdf-btn` · `pdf-done` · `pdf-error` |
| 안내 · 채점 | `ui-callout-tip`(📌) · `ui-callout-reason`(💡) · `ui-feedback-ok-bg/-ink` · `ui-feedback-no-bg/-ink` · `ui-focus-pink`(포커스) |
| 창 · 공통 | `window-body` · `titlebar-head` · `ui-date-ink` · `ui-footer-ink` · 보기 버튼 `view-day` · `view-week` · `view-month` |
| 이용 규칙 | `howto-head/-body` · `rule1`~`rule3-head/-body` · `message-head/-body` · `loading-head/-body` |
| 시간표 | `tt-grade-box` · `tt-week-head` · `tt-time-col` · `tt-month-head` · 상태 `ui-live-row` · `base-live-violet` · `ui-status-past-bg/-ink` · `ui-status-upcoming-ink/-line` · `ui-today-cell` · `ui-empty-cell/-ink` · `ui-time-end-ink` · `ui-note-ink` · 과목 `subj-*` 19개 |
| 급식 | `lunch-head/-body` · `lunch-total` · `ui-total-ink` · `lunch-mon`~`lunch-fri` · `lunch-month-head` · 알레르기 `allergen-1`~`19`(대비 7:1↑) |

- **`--msi-rgb-ink`**(기본 `75,59,107`): 잉크의 R,G,B 세 숫자. 반투명 잉크(그림자 · 점선 · 옅은 선 85곳)가 `rgba(var(--msi-rgb-ink),.3)` 로 쓴다.
  **잉크 색을 바꾸면 이것도 같은 색으로** 바꾼다(안 바꾸면 그림자만 보랏빛으로 남음).

### 모양 — `--msi-shape-*` (원본 `design/tokens.json` 의 `shape`)
| 변수 | 기본 | 뜻 |
|---|---|---|
| `radius-k` | `1` | **둥글기 배율** — 0 이면 네모, 1.5 면 더 둥글게. 알약(`r-pill`)·동그라미(50%)는 그대로 |
| `r2` `r4` `r5` `r6` `r7` `r8` `r9` `r10` `r11` `r12` `r14` `r16` `r20` | `calc(Npx * k)` | 하나씩 덮어쓸 때 — r16 창 · r12~r14 카드 · r11 상자 · r10 버튼·칩 · r9 입력칸 · r7~r8 작은 칸 · r6 태그 · r2~r5 잔 장식 |
| `r-pill` | `999px` | 알약 버튼·칩(The Aurora Pill Rule). 바꾸면 버튼이 알약이 아니게 된다 |
| `bw1` `bw2` `bw3` `bw4` | `1px`~`4px` | 테두리 두께 — bw4 창·주제 카드 · bw3 카드·버튼·입력칸(가장 많음) · bw2 작은 칩·점선 · bw1 가는 선 |
| `shadow-k` | `1` | **어긋난 그림자 거리 배율** — 0 이면 그림자 없음 |
| `shadow-blur` | `0px` | 그림자 흐림 — 기본 0(The Zero-Blur Rule), 부드러운 그림자 테마만 |
| `sh1` `sh2` `sh3` `sh4` `sh5` `sh6` `sh8` | `calc(N*k) calc(N*k) blur` | 하나씩 덮어쓸 때(그림자의 위치·흐림, 색은 `--msi-rgb-ink`) — sh8 창 · sh6 주제 카드 · sh5 카드 · sh4 버튼 · sh3 칩 · sh2 동전 · sh1 눌림 |

### 그 밖
- 유리 층 `--msi-glass-*` · 움직임 `--msi-motion-*` 도 덮어쓸 수 있다(값 형식은 tokens.json 그대로).
- 간격 · 글자 크기 · 글꼴은 테마가 바꾸지 않는다.
- **메뉴 탭 모양**은 테마가 바꿀 수 있다(선생님 결정 2026-10-22). 보기 버튼(일간/주간/월간) · 급식 ◀ ▶ 는 네모 칩 그대로(색 · 모서리 · 테두리 · 그림자만).
  탭 모양은 `tabChip()` 인라인이라 `#appTitlebar .tab-chip` 에 `!important`(본보기 sticker: 분홍 트랙 안 알약).
- **테마 그림**(2026-10-21): 테마 폴더에 두고 `url(msi-asset:design/themes/<이름>/x.png)`(저장소 루트 기준) — 빌드가 사이트에선 파일로 복사, 한 파일(embed)에선 data URI 로 바꾼다. 작게 줄여서(아이콘 128px 안팎) 넣는다.
- **제목줄 학교 아이콘**: 틀의 `<span class="app-ic">🏫</span>` — 테마가 `#appTitlebar .app-ic{font-size:0 !important; background:url(…)}` 로 그림을 씌운다(본보기 `sticker`).
- **이모지 아이콘 → 그림**(2026-10-21): 틀의 이모지 자리에 `data-ic="<이모지>"` 이름표(메뉴 탭 4 · 오늘의 목표 🎯 · 카드 `.m-badge`). 테마가 `[data-ic="🎨"]` 마다 그림을 씌우고, 그림 없는 이모지는 글자 그대로.
  - 카드 쪽은 `:is(#sheetPrintArea, .msi-pdf-clone)` 로 쓴다 — PDF 는 id 를 지운 복제본을 찍는다. `.m-badge.m-badge` 처럼 세기를 올려야 「글자 16px 이상」 규칙을 이긴다.
  - 같은 이모지라도 탭(`#appTitlebar .tab-chip [data-ic]`)과 카드(`.m-badge[data-ic]`)는 따로 고를 수 있다(sticker 의 🍚).

## 3. 테마도 지킬 것

- 색은 `#hex` · `rgba()` 로만. `color-mix()` · `color()` · `oklch()` · `oklab()` · `lab()` · `lch()` · `hwb()` 를 쓰면 **빌드가 멈춘다**(PDF 저장 html2canvas 1.4.1 이 못 읽음).
- 요소 자신의 `inset` 그림자로 칠하지 않는다(PDF 에서 흰 판) — 필요하면 `::after`.
- `backdrop-filter` · `mix-blend-mode` · `filter` 는 PDF 에서 빠진다 — 빠져도 어색하지 않게.
- 글자 16px 이상 · 누르는 것 44px 이상 · 본문 대비 4.5:1 · 상태는 색 + 글/기호(✓ ✗) — 테마가 바꾼 색으로도 지켜야 한다.
- 밝은 바탕만, 형광·네온 X(DESIGN.md The No-Neon Rule).

## 4. 새 테마 만들기 순서

> 받은 테마를 옮기고 입히는 일(2~5)은 스킬 **`lesson-theme`** 이 한다 — 도구: `.claude/skills/lesson-theme/references/`.

1. **Claude Design** — 프롬프트 `docs/templates/claude-design-prompt.md`, 첨부할 지금 틀 캡처는 `node scripts/template-capture.mjs`.
2. 받은 결과물(견본 HTML · theme.css · 테마 설명)을 `input/claude-design/<이름>/` 에 둔다.
3. Claude Code 가 `design/themes/<이름>/theme.css` + `theme.md` 를 쓴다 — Claude Design 의 theme.css 를 바탕으로 2절 변수만 남기고,
   변수로 안 되는 장식은 선택자 규칙으로(부품 class 는 `parts.md`). 잉크를 바꿨으면 `--msi-rgb-ink` 확인.
4. 확인
   - `npm run template-preview -- order --theme <이름>` → http://127.0.0.1:8080/_preview/template-order/ (서버: `node scripts/serve.mjs`)
   - `node scripts/template-capture.mjs order "<폴더>" --theme <이름>` → Claude Design 견본과 나란히 비교
   - PDF 저장 리허설(이름 칸 채우기 → 저장 → 쪽 그림 확인) — 테마 색·모양이 PDF 에도 나오는지
5. 쓰기
   - 새 차시: `npm run new -- <단원>/<차시> --theme <이름> --title "…"` → `npm run portal-upgrade -- <차시>` → `npm run check -- <차시>`
   - 이미 있는 차시(틀에서 만든 것): `lesson.json` 에 `"theme": "<이름>"` 한 줄 → `npm run check -- <차시>`

### theme.css 본보기
```css
/* <이름> — 한 줄 분위기. 원본: input/claude-design/<이름>/ (Claude Design, 날짜) */
:root{
  /* 바탕 · 잉크 */
  --msi-role-page-bg: #e3f1f6;
  --msi-role-base-night-sky-ink: #1f3b5c;
  --msi-rgb-ink: 31,59,92;              /* 잉크와 같은 색 */
  --msi-role-base-cream-paper: #fffdf8;
  /* 카드 한 벌 */
  --msi-role-act1-head: #ffd27a;
  --msi-role-act1-body: #fff8e6;
  /* 모양 */
  --msi-shape-radius-k: 0.6;
  --msi-shape-bw3: 2px;
  --msi-shape-shadow-k: 0.6;
  --msi-shape-shadow-blur: 6px;
}
/* 변수로 안 되는 장식만 아래에 — 예) 카드 머리 영문 라벨 자간 */
.m-head .mono { letter-spacing: 2px; }
```

## 5. 틀을 고칠 때 (2026-10-21 이후)

- 새 모서리 · 테두리 · 그림자는 숫자 대신 변수로 쓴다:
  `border:var(--msi-shape-bw3) solid var(--msi-role-base-night-sky-ink)` · `border-radius:var(--msi-shape-r10)` ·
  `box-shadow:var(--msi-shape-sh4) rgba(var(--msi-rgb-ink),.3)` · 반투명 잉크 `rgba(var(--msi-rgb-ink),.2)`.
- 캔버스(`fillStyle` 등)와 SVG 속성(`fill="…"`)에는 CSS 변수를 못 쓴다 — 거기는 색 글자 그대로.
- 새 크기가 필요하면 `design/tokens.json` 의 `shape` 에 더하고 `node design/build.mjs`(틀 · ai/01 · 07 토큰 블록이 함께 갱신).
- ai/01 도 변수다(2026-10-22). 틀의 부품을 ai/01 로 옮길 때는 변수 그대로 옮긴다.
