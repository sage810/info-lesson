# 활동 부품 모양 — ai/01 기준 (선생님 피드백 2026-10-17~18 확정)

새 차시는 틀 `lessons/_templates/order`(= ai/01 「인공지능이란?」)에서 출발한다. 이 문서는 **틀 안 부품을 어떻게 쓰는지**와
**왜 그렇게 정했는지(피드백)**를 적는다. 순서·색은 `order.md`, 색 값은 `color-map.md`(역할 토큰) — 이번 부품은 새 색을 만들지 않았다.
부품 CSS 는 틀 `lesson.html` 의 `/* ── [ai/01] 활동 부품 …` 블록(이름은 `ai-` 로 시작하지만 모든 차시용), 동작은 같은 파일 `class Component` 와 맨 끝 `<script>`.

**디자인 시스템에 기록된 곳**
| 무엇 | 어디 |
|---|---|
| 치수 토큰 | `design/tokens.json` 의 `part` → `--msi-part-figure-max`(680px) · `-slot-min`(176px) · `-choice-radius`(22px) · `-ox-min`(56px) · `-gap`(10px) · `-figure-ratio`(680 / 300). `node design/build.mjs` 가 활동지 토큰 블록(틀·ai/01·07)에도 넣는다 |
| 색 | 새 색 없음 — 역할 토큰(`color-map.md`) |
| 다른 웹앱용 부품 | `design/components.css` 활동 부품(`msi-ctl` · `msi-match` · `msi-concept-table` · `msi-cards` · `msi-pick` · `msi-ox` · `msi-figure`), 미리보기 `design/preview.html` ACTIVITY_PARTS |
| 규칙 요약 | `DESIGN.md` Components › Activity Parts · Do's and Don'ts |

## 1. 카드 · 글

| 규칙 | 모양 | 근거(피드백) |
|---|---|---|
| 카드 제목은 **글자만** | `<div class="m-title-row"><div class="m-badge">아이콘</div><div class="m-title" role="heading" aria-level="2">…</div></div>` — 질문 스티커(`m-title--q`)는 쓰지 않는다 | 10-17 「텍스트만」 ×4 |
| 단계 소제목은 `1. 2. 3.` | `<div class="m-hd2">1. 인공지능이란?</div>` — 짧은 명사형도 됨. 지운 단계가 있으면 번호를 다시 매긴다 | 10-17 |
| 설명 글 | 본문 `p.ord-p`, 작은 안내 `p.m-sub`, 가운데가 필요하면 `.ai-center` | 10-18 |
| 안내 상자 | `.callout.callout--tip`(📌 기준·개념) · `.callout--reason`(💡 Tip) — 냉색만 | order.md |
| **글자는 모두 16px 이상** | 본문·작은 안내·표·버튼·칩·입력칸·번호·픽셀 라벨까지. 틀의 `/* ── 글자 최소 16px … */` 묶음(`--msi-size-text-min`)이 끌어올리지만, 새로 쓰는 글자도 처음부터 16px 이상. 이름표 줄 설명·하나 고르기 보기 17px | 10-20 「눈에 안 보여」 · `design.md` §2.2 |

## 2. 가운데 정렬 (모든 활동 공통)

- 버튼 줄 `.ai-ctl`(✅ 정답 확인 · 🔀 다시 섞기) · 순서 배열 버튼 `.seq-controls` · 바깥 사이트 버튼 `.ai-links` · 이름표 모음 `.ai-match .ca-tray` → **가운데**.
- 이름표 줄 `.ai-row` = **가로를 반씩 2열(설명 | 칸), 각각 가운데**. 폰(≤560px)은 한 열로 쌓는다.
- 짧은 보기 2개짜리 하나 고르기는 `.ai-pick.ai-pick--row` = **나란히 가운데**. 보기가 긴 문장이면 `.ai-pick`(세로, 왼쪽).

## 3. 활동 부품

| 부품 | 쓰는 곳 | 마크업·동작 | 근거 |
|---|---|---|---|
| **개념 표** `table.ord-sum.ai-sum.ai-def` | 낱말 정의(활동 1) | 열: 낱말 · 뜻 · (이 차시 사례). **1열·1행 가운데**. 빈칸은 낱말 하나 + **뜻의 핵심어**(예: 학습·인식·추론, 결과물)에 `textarea.blank.blank--inline`. 사례 칸에 바로 아래 활동의 정답(비유)을 쓰지 않는다 | 10-17 「줄글이 눈에 안 들어와」 → 표, 10-18 빈칸 위치 |
| **개념 카드** `.ai-cards > .ai-card` 3장 | 낱말 3개(활동 4) | 아이콘 · 낱말 · 뜻(핵심어 빈칸) · `p.ai-card__ex` 「시험공부라면? → [빈칸]」. **흐름 그림을 카드 위에** | 10-17 「문장 설명 별로」, 10-18 자리 바꿈 |
| **이름표 끌어 놓기** `.ai-match[data-ca-group][data-ca-check="button"]` | 분류·비유·핵심 정리 | 이름표 `span.ca-chip`(유리 알약) → 칸 `span.ca-slot#id[data-answer]`. ✅ 정답 확인 · 🔀 다시 섞기. 같은 이름표를 여러 칸에 써도 됨 | 공용 `chip-slot.js` |
| **핵심 정리 = 이름표** | 정리 KEY_SUMMARY | 표 + 문장 속 `span.ca-slot`(글자 빈칸 대신). 이름표 모음 위 안내 「같은 이름표를 두 번 써도 돼요」 | 10-18 「이름표 끌어다두기로」 |
| **순서 배열** `.seq-activity#id` | 과정 순서 | 칸 `data-answer` 차례가 정답, 피드백 `data-fb-all/-partial/-none/-incomplete`, 버튼 `glass-pill[data-seq-check]`·`[data-seq-reset]` | 공용 `seq-order.js`(10-17 여러 차시용) |
| **하나 고르기** `.ai-pick` + `fqA*` | 판단 문제 | `button.glass-chip` — 누르면 바로 ✓/✗ + `.ai-fb`(맞으면 왜 맞는지, 틀리면 왜 틀렸는지). 정답 이름은 숨김 | 07 리허설 |
| **형성평가 O/X** `.ord-ox.ai-ox` | 정리 CHECK_UP | `num-coin--lilac` 번호 · 문장 · O/X `glass-chip`. **누르면 바로 채점, 맞아도 틀려도 이유**(같은 설명 문장 하나로 둘 다 씀). 정답 확인·다시 풀기 버튼 없음 | 10-18 |
| **글자 빈칸** `textarea.blank(.blank--inline)` | 짧은 낱말·생각 | 채점하지 않음 — 정답은 `answers.json` fill(허용 답은 괄호)로 정답지에만. `aria-label` 은 페이지 안에서 유일 | 10-17 결정 |

## 4. 그림 · 영상

- **그림은 SVG 로 새로 그린다** (`assets/*.svg`, `<img class="ai-fig" … width height alt>`) — `width`·`height` 필수(PDF).
  - 글자는 **CookieRun Bold**: `<img>` SVG 는 페이지 글꼴을 못 쓰므로 `.claude/skills/lesson-new/references/svg-font.mjs` 로 그림 글자만 담은 글꼴을 SVG 안에 넣는다(그림 글자를 고치면 다시 돌림). (10-18)
  - **비교 그림은 두 칸**: 왼쪽 | 오른쪽, 칸 맨 위 큰 색 띠 제목(20px↑), 같은 줄끼리 비교(재료 → 만들어진 것 → 결과). 이름을 작은 네모 칸에 넣지 않는다. (10-18 a2)
  - **화살표 이름(「학습」 등)은 화살표 옆·위로 띄운다** — 화살표와 겹치지 않게. (10-18 a2·a4)
  - 그림 글자가 바로 옆 빈칸의 정답을 알려 주지 않게(「인공 신경망」 칸 위 그림에는 「컴퓨터 속 구조」).
- 선생님이 그림(PNG)을 주면 그대로 `assets/` 에 넣고 `width`·`height` 를 그 그림 크기로(ai/01 활동 4 = 1920×1080). 영상 비율이 기본(680:300)과 다르면 그 영상에만 `style="aspectRatio:16 / 9"`.
- **그림을 누르면 영상**: `.ai-vid` 안에 그림 `img.ai-fig.ai-vid__img` + `video.ai-vid__v.no-pdf`(msi-asset mp4) + 그림 **아래** `button.glass-pill.ai-vid__btn.no-pdf` 「▶ 움직이는 모습 보기」. 끝나면 그림으로 돌아옴, PDF 에는 그림만. 영상은 그림과 같은 가로세로 비(지금 680:300 — 다르면 `.ai-vid__v` 의 `aspect-ratio` 를 맞춘다). (10-18)
  - 영상은 `assets/` 에 mp4 로(빌드가 mp4 를 앎 — `scripts/lib/common.mjs`). 구글 사이트 붙여넣기(embed)용 파일에는 영상이 통째로 들어가 커진다(ai/01: 영상 2개 ≈ +1.5MB).

## 5. 동작 (틀에 들어 있음 — 손대지 않아도 됨)

- **자동 보관**: 글자 칸 · 붙여넣기 · 하나 고르기 · O/X · **이름표 칸 · 순서 칸**까지. 탭 누를 때·페이지 떠날 때 바로 보관, PDF 저장 뒤 지움(미뤄 둔 보관 취소).
- **진행률**: 빈칸 하나 = 1 · 이름표 묶음은 칸이 다 차면 1 · 순서 배열 1 · 하나 고르기 1 · O/X 1. PDF 저장은 70% 초과.
- **정답지**(`answers.json`): 이름표·순서 = 선택자 클릭(`"[data-ca-group='…'] .ca-chip[data-v='…']:visible"` → `"#칸id:visible"` → 확인 버튼), 하나 고르기·O/X = 묶음 aria-label 선택자(`button.glass-chip:has-text('…')`, `button:text-is('O')`). `{near,text}` 는 glass-chip 을 못 누른다.

## 6. 새 차시에서 바꾸는 것 / 지우는 것

1. `npm run new -- <단원>/<차시> --title "…" --unit-title "…"` → 틀(= ai/01)이 복사된다.
2. 본문 카드 내용만 바꾼다 — 부품 class·순서·CSS·동작은 그대로. 쓰지 않는 부품 카드는 통째로 지운다.
3. `assets/` 의 ai/01 그림·영상(a1/a2/a4 svg, *-motion.mp4)은 새 그림으로 바꾸거나 지운다(쓰지 않는 파일은 지움).
4. `answers.json` 을 새로 쓴다(틀에는 없음 — ai/01 것을 본보기로).
5. 리허설: `node scripts/serve.mjs` 켜고 http 주소로 — 채점 · 탭 다녀오기 · 새로고침 · 폰 360px · PDF 저장 · 정답지(`npm run teacher`).

예전 07 모양(CODAP 그래프 붙여넣기 · 분석 유형 칩 · 「그래프 시각화하기」 도움말 · 왼쪽 HELP 카드)이 필요하면 `--from data-analysis/07`.
