# build-brief — 데이터 분석 4단계 "순서 배열 드래그" (PREVIOUSLY 카드)

- 소스 spec: `spec/data4-4steps-sequencing.activity.md`
- 대상 파일: `output/data4.html` (수정은 builder-agent 몫 — 이 문서는 지시서)
- 근거: `docs/rules/design.md` (§2 토큰, §3 컴포넌트, §4.1 accent, §6 인쇄, §7 접근성)
- 작성일: 2026-09-03 / 작성: design-agent (모드 A)

이 활동은 **design.md 에 없는 패턴**(순서 배열 / 드래그 슬롯)을 요구한다. 아래 8절은
**기존 토큰만으로 구성한 추가안**이며, 같은 내용을 `docs/rules/design.md` §11 로 정식 기록했다.
빌더는 §11 과 이 문서를 함께 본다.

---

## 1. 배치 (spec §2 확정)

- PREVIOUSLY 카드(`output/data4.html` 496–526행, 헤더 `#d6c4f5`, 카드 바탕 `#f8f4fe`) **본문의 마지막 요소**로 추가.
- 위치: 525행 NOTE 박스(`background:#fbe6a2`) `</div>` **직후**, 카드 본문 래퍼(501행 `padding:18px 20px 20px; display:flex; flexDirection:column; gap:12px`) **안**.
- 기존 복습 불릿 3개(📁🔎📊)·NOTE 박스는 **유지**. 교체·삭제 없음.
- NOTE 와 활동 사이에 **내부 구분선 1줄**(§2.4): `<div style="borderTop:2px dashed rgba(75,59,107,.28)"></div>`.
  - `.22~.3` 범위 안 값. 카드 본문이 이미 `gap:12px` 이므로 구분선에 개별 margin 을 주지 않는다(§2.3).
- 카드 본문 래퍼가 `zoom:1.1` 안에 있다(94행). 드래그 좌표 계산은 `getBoundingClientRect()` 기준만 (spec §5-8). 시각 토큰(px)은 그대로 두고 zoom 이 확대하게 둔다.

---

## 2. 컴포넌트 매핑 (§3 이름 → 이 활동)

| spec 요소 | design.md 컴포넌트 | 비고 |
|---|---|---|
| 활동 래퍼 `.seq-activity` | §3.5 카드 본문 내부 서브블록 (flex column, `gap:10px`) | 카드 껍데기는 새로 만들지 않음. PREVIOUSLY 카드 안에 얹는다. 인쇄 `break-inside:avoid` 대상 |
| 미니 라벨 `ORDER` | §3.3 픽셀 태그 (라벨만, 테두리 없는 인라인) | Silkscreen 10px `#6b559b` (PREVIOUSLY 헤더의 `RECALL` 보조 라벨과 같은 색) |
| 활동 제목 | §3.5 `.act-title` 축소판 | CookieRun 700 16px (subtitle, §2.2 스케일). 카드에 이미 `.act-title` 20px 이 있으므로 서브블록은 한 단계 낮춤 |
| 안내문(prompt) | §3.5 `.hint-line` | 14px `#8b7cb8` (`--muted`) |
| 뒤섞인 칩 트레이 `.seq-tray` | §3.12 그리기/드롭 영역 껍데기 + §3.7 칩 | 트레이는 "칩이 돌아오는 드롭 영역"이므로 §3.12 점선 존 스타일로 감싼다 |
| 순서 칩 4개 `.seq-chip` | §3.7 칩 / 토글 버튼 | 선택 상태 = `.is-on` (`aria-pressed="true"`) |
| 번호 배지 ①~④ `.seq-num` | §3.5 `.num` 배지 | 배경 `#d6c4f5` (PREVIOUSLY 정체성 유지, spec §8) |
| 순서 칸 `.seq-slot` | §3.12 드롭 영역(빈칸) → 채워지면 §2.4 "칩/입력" 스케일 솔리드 | 슬롯당 칩 1개 |
| 확인 버튼 | §3.10 `.btn` (primary) | data4 의 `💾 제출하기` 버튼(870행)과 동일 토큰, 폰트만 16px |
| 다시 섞기 버튼 | §3.10 `.btn.secondary` | data4 의 `다시 쓰기` 버튼(871행)과 동일 토큰, 폰트만 16px |
| 결과 문구 `#seqResultPrev` | 신규 (텍스트만) | CookieRun 700 14px `#4b3b6b`, `role="status" aria-live="polite"` |

- 표/그래프 없음 → `overflow-x:auto` 래퍼 불필요. 단 트레이·슬롯 행이 좁은 화면에서 넘치지 않도록 `flex-wrap:wrap`(트레이) / 슬롯 `flex:1`(행).
- 폰트: data4 는 로컬 TTF(`fonts/`) + Silkscreen CDN 을 이미 로드한다(§2.2 원본 스니펫). 대체 서체 지정 불필요. 새 텍스트도 CookieRun / Maplestory / Silkscreen 만 쓴다(한글엔 Silkscreen 금지 — §2.2).

---

## 3. 순서 배열 블록 — 정확한 시각 스펙 (§2 토큰만)

모든 테두리색 = `#4b3b6b` (`--ink`). 모든 그림자 = 오프셋만·blur 0·`rgba(75,59,107,α)` (§2.4).

### 3.1 활동 래퍼 `.seq-activity`
- `display:flex; flex-direction:column; gap:10px` (§2.3 카드 안 간격). 개별 margin 없음.
- 배경·테두리 없음(부모 카드 바탕 `#f8f4fe` 위에 그대로).

### 3.2 헤더 줄 (라벨 + 제목)
- `display:flex; align-items:center; gap:8px`.
- `ORDER` : `font-family:'Silkscreen',monospace; font-size:10px; color:#6b559b`.
- 제목 "오늘 쓸 4단계, 순서부터 맞춰 보기" : `font-family:'CookieRun',sans-serif; font-weight:700; font-size:16px; color:#4b3b6b`.
- 안내문 : `font-size:14px; color:#8b7cb8; line-height:1.6` (별도 `<p>`, margin:0).

### 3.3 칩 트레이 `.seq-tray` (드롭 영역 겸용, §3.12)
- `border:3px dashed #b3a8cc; border-radius:10px; padding:10px;`
- `background:repeating-linear-gradient(45deg,#fffdf7,#fffdf7 10px,#f8f1e2 10px,#f8f1e2 20px);` (§3.12 그대로)
- `display:flex; gap:8px; flex-wrap:wrap; align-items:center; min-height:56px;`
- 비었을 때(모든 칩 배치됨) 안내 텍스트: `font-family:'Silkscreen',monospace; font-size:11px; color:#9c8dc4` — "EMPTY".
- 드래그 오버 상태 `.is-over`: `border-color:#ee9dbf; background:#fdf6fa;` (필도 dashed 유지).

### 3.4 순서 칩 `.seq-chip` (§3.7)
- 기본:
  `cursor:pointer; padding:8px 15px; border:3px solid #4b3b6b; border-radius:9px;`
  `background:#fffdf7; font-family:'CookieRun',sans-serif; font-weight:700; font-size:15px; color:#4b3b6b;`
  `box-shadow:3px 3px 0 rgba(75,59,107,.15);` (`--sh-soft`)
  `user-select:none;`
- 선택됨 `.is-on` (터치/키보드, `aria-pressed="true"`):
  `background:#d6c4f5;` (이 서브블록의 accent = PREVIOUSLY 보라 — §4.1 순환과 충돌 없음, 카드 정체성 재사용)
  `box-shadow:2px 2px 0 rgba(75,59,107,.35);` (`--sh-press`) `transform:translate(1px,1px);`
- 드래그 중 `.is-dragging`: §2.4 눌림 효과 — `box-shadow:1px 1px 0 rgba(75,59,107,.35); transform:translate(3px,3px);` (opacity 로 흐리게 하지 않음 — design.md 는 하드엣지)
- 슬롯 안에 놓인 칩: 같은 `.seq-chip` 스타일 유지(트레이/슬롯 어디서든 동일 모양), 슬롯이 `align-self:stretch` 로 감싼다.

### 3.5 순서 행 `.seq-row` + 번호 배지 `.seq-num`
- 행: `display:flex; align-items:center; gap:10px;` (§3.5 `.act-line`). 행끼리 `gap:8px` 로 세로 스택.
- `.seq-num` (§3.5 `.num`):
  `width:30px; height:30px; flex:none; border:3px solid #4b3b6b; border-radius:8px;`
  `background:#d6c4f5;` (PREVIOUSLY 정체성)
  `display:flex; align-items:center; justify-content:center;`
  `font-family:'CookieRun',sans-serif; font-weight:700; font-size:14px; color:#4b3b6b;`
  글자 = `①` `②` `③` `④` (원문자 글리프. Silkscreen 은 라틴 전용이라 금지 — §2.2).

### 3.6 순서 칸 `.seq-slot`
- 빈칸(§3.12 드롭존 축소):
  `flex:1; min-height:44px; display:flex; align-items:center; justify-content:center;`
  `padding:6px 12px; border:3px dashed #b3a8cc; border-radius:10px; background:#fdf6fa;`
  placeholder 텍스트: `font-family:'Silkscreen',monospace; font-size:10px; color:#9c8dc4` — "DROP HERE".
- 드래그 오버 `.is-over`: `box-shadow:inset 0 0 0 4px #ee9dbf;` (§3.11 "오늘 칸" 강조 패턴 재사용) — 테두리색·굵기는 그대로.
- 채워짐 `.is-filled`: `border:3px solid #4b3b6b; background:#fffdf7; justify-content:flex-start;` (점선 → 솔리드).
- 채점 결과색(§3.8 참고): `.is-correct` / `.is-wrong` 만 배경·아이콘 변경. **테두리색은 언제나 `#4b3b6b`** (§2.4·§7 — 파스텔 테두리 금지).

### 3.7 조작부 `.seq-controls`
- `display:flex; gap:10px; flex-wrap:wrap; align-items:center;` (§2.3 gap 기반).
- 확인 버튼 `.seq-check-btn` (§3.10 primary, data4 870행과 동일):
  `cursor:pointer; padding:11px 20px; border:3px solid #4b3b6b; border-radius:10px;`
  `background:#9db2f2; color:#26224a; font-family:'CookieRun',sans-serif; font-weight:700; font-size:16px;`
  `box-shadow:4px 4px 0 rgba(75,59,107,.3);`
  눌림(`style-active` 또는 `:active`): `background:#8296e0; box-shadow:1px 1px 0 rgba(75,59,107,.3); transform:translate(3px,3px);`
- 다시 섞기 버튼 `.seq-reset-btn` (§3.10 secondary, data4 871행과 동일):
  `background:#fffdf7; color:#4b3b6b; box-shadow:4px 4px 0 rgba(75,59,107,.2);` 나머지 동일.
- 텍스트: `✅ 순서 확인` / `🔄 다시 섞기` (spec §6 그대로).

### 3.8 결과 문구 `#seqResultPrev`
- `font-family:'CookieRun',sans-serif; font-weight:700; font-size:14px; color:#4b3b6b;` (상태에 따라 색을 바꾸지 않음 — 의미는 아이콘·문장으로).
- `role="status" aria-live="polite"`. 빈 문자열로 시작.
- 문구는 spec §4 표 그대로. 부분 정답은 `{n}` 치환, 정답 배열을 텍스트로 노출하지 않음.

---

## 4. 정답 / 오답 상태색 (accent 와 별개인 의미색, §2.1 팔레트 안)

| 상태 | 배경 | 아이콘 박스 | 아이콘 | 비색 채널(§7) |
|---|---|---|---|---|
| 정답 `.seq-slot.is-correct` | `#d8f0c4` (`--green`) | `#bfe9dd` (`--mint`) 24×24 `border:3px solid #4b3b6b; border-radius:6px` | `✓` | 아이콘 + 결과 문장 "n칸 정답" |
| 오답 `.seq-slot.is-wrong` | `#f7bfb2` (`--salmon`) | `#fffdf7` 24×24 동일 테두리 | `✗` | 아이콘 + 결과 문장 |
| 미채점 | `#fffdf7` (채워짐) / `#fdf6fa` (빈칸) | — | — | — |

- 근거: §3.9 체크 행이 on-state 에 `#eaf8f2`·박스 `#bfe9dd` 를 쓰는 것과 같은 계열. 오답색은 §4.1 이 salmon 을 팔레트 정식 토큰으로 확인(`--ink` 대비 ≈ 6:1).
- **테두리는 정답/오답 모두 `#4b3b6b` 유지.** 색만으로 구분하지 않도록 `✓`/`✗` 글리프를 반드시 함께 렌더(§7).
- 채점 전(리셋·재섞기 후)에는 `.is-correct`/`.is-wrong` 클래스를 모두 제거.

---

## 5. 터치 / 키보드 대체 조작의 시각 상태 (§7)

- **선택된 칩**: `.seq-chip.is-on` + `aria-pressed="true"` → `background:#d6c4f5` + 눌림 그림자(3.4). 다시 누르면 해제.
- **포커스 링**: `:focus-visible { outline:3px solid #ee9dbf; outline-offset:2px; }` (§7 그대로).
  - data4 는 현재 `:focus-visible` **전역 규칙이 없고** 인라인 `outline:none` + support.js `style-focus` 만 쓴다.
  - 키보드 DnD 가 핵심 요구(spec §5-2,5-9)이므로, 빌더는 `<style>` 블록에 실제 규칙을 추가한다:
    ```css
    .seq-chip:focus-visible,
    .seq-slot:focus-visible,
    .seq-check-btn:focus-visible,
    .seq-reset-btn:focus-visible { outline:3px solid #ee9dbf; outline-offset:2px; }
    ```
  - 칩/슬롯에 인라인 `outline:none` 을 넣지 말 것.
- **드래그 오버 대상**: 슬롯 `.is-over` = `inset 0 0 0 4px #ee9dbf`, 트레이 `.is-over` = `border-color:#ee9dbf`.
- **놓인 슬롯 안내**: 슬롯 `aria-label` 을 "① 자리: 문제 정하기" 형태로 갱신(빈칸일 때는 spec §6 표의 기본 `aria-label`).
- **모션(§5)**: 칩 이동에 트랜지션을 쓰면 `transform`/`opacity` 만, `@media (prefers-reduced-motion:reduce)` 에서 `transition:none`.

---

## 6. 인쇄 (§6)

**중요**: `output/data4.html` 에는 현재 **전역 `@media print` 블록이 없다** (27–92행 `<style>` 에 `.sheet-progress` 전용 `@media print` 만 존재). PREVIOUSLY 카드는 `.card` 클래스가 아니라 인라인 스타일 `<div>` 라 어떤 `break-inside` 규칙도 자동 적용되지 않는다.

빌더는 `<style>` 블록에 **design.md §6 전역 print 블록을 새로 추가**하고, 그 안에 이 컴포넌트 규칙을 포함한다:

```css
@media print {
  @page { margin: .5cm; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact;
      animation: none !important; transition-duration: 0s !important; }
  * { box-shadow: none !important; }          /* 잉크 절약 (§6) */

  .seq-activity { break-inside: avoid; }      /* 활동 전체가 페이지 경계에서 안 쪼개짐 */
  .seq-tray { display: none; }                /* 미배치 칩 풀은 인쇄 불필요 */
  .seq-slot { border: 2px solid #4b3b6b; background: #fff; }
  .seq-slot.is-correct { background: #fff; }  /* 색 대신 아이콘으로 */
  .seq-slot.is-wrong   { background: #fff; }
  .seq-slot.is-correct .seq-mark::after { content: ' ✓ 정답'; }
  .seq-slot.is-wrong   .seq-mark::after { content: ' ✗ 다시'; }
  .seq-num { background: #d6c4f5; }           /* 색 헤더·배지 정보위계는 인쇄에서도 유지 (§6) */
}
```

- 채점 색(초록/살구)은 인쇄에서 흰 배경으로 떨어뜨리고 **`✓`/`✗` 글리프 + 텍스트**로만 정오답을 구분(§7, spec §7-3).
- 번호 배지 `#d6c4f5` 는 정보 위계라 인쇄에서도 유지(§6 "색 헤더 스트립 유지").
- 트레이(미배치 칩)는 인쇄에서 숨긴다. 슬롯이 다 안 찼으면 빈칸이 그대로 인쇄돼 "직접 적어 보기" 지면이 된다.
- `.seq-mark` = 슬롯 안 아이콘 span (`✓`/`✗` 를 담는 24×24 박스). 화면에선 글리프만, 인쇄에선 `::after` 로 라벨 덧붙임.

---

## 7. 통합 주의 (spec §7 재확인)

- **진행률(§10)**: **포함하지 않음**(기본). data4 진행률은 `renderVals()` 의 `sheetChecklist` 7항목(1456행)으로 계산되고 `.seq-slot` DOM 스캐너가 없다. 이 활동은 "선행 조직자"라 완료 집계 대상 아님(MC 카드 제외와 같은 취지). 포함하려면 엔진이 `this.setState({ seqAllCorrect })` 로 쓰고 `sheetChecklist` 에 8번째 원소 추가 + `reset`(1509행) 에 초기화 — 별도 요청 시에만.
- **상태 보관**: 칩 순서 `state.seqOrder`(배열), 슬롯 배치 `state.seqPlaced`(slotId→key). `state`(1049행) 에 초깃값 추가, `reset`(1509행) 에 `seqOrder`(초기 뒤섞임), `seqPlaced`({}), `seqAllCorrect`(false) 초기화 추가. `<sc-if isSheet>` 재마운트에도 배치 유지.
- **dragstart 위임 스코프**: 1074행 `n.closest('#mangaTable')` 셀렉터를 **넓히지 말 것**. 넓히면 `.seq-chip` 드래그가 `preventDefault` 로 막힌다.
- **인쇄 클래스 목록**: 위 6절의 `@media print` 를 새로 추가.

---

## 8. design.md 제안 — §3.15 순서 배열 / 드래그 슬롯 컴포넌트 (초안)

> design.md 에 순서배열/드래그 슬롯 패턴이 없어 아래 추가안을 제시한다. **새 색·서체·radius 를 만들지 않았고**, §2.1 팔레트·§2.2 서체·§2.4 스케일·§3.7 칩·§3.12 드롭존·§3.5 `.num`·§3.11 강조(inset ring) 안에서만 구성했다. 같은 내용을 `docs/rules/design.md` **§11** 로 정식 기록했다.

### 3.15 순서 배열 / 드래그 슬롯

번호가 매겨진 칸(①②③④…)에 뒤섞인 칩을 올바른 순서로 놓게 하는 컴포넌트.
칩은 §3.7, 빈 칸·트레이는 §3.12, 번호 배지는 §3.5 `.num` 을 재사용한다.

```css
/* 래퍼 — 활동 카드(§3.5) 본문 안 서브블록 */
.seq-activity{ display:flex; flex-direction:column; gap:10px; }

/* 트레이 = 미배치 칩 풀 + 드롭 영역 (§3.12) */
.seq-tray{
  display:flex; gap:8px; flex-wrap:wrap; align-items:center; min-height:56px;
  border:3px dashed #b3a8cc; border-radius:10px; padding:10px;
  background:repeating-linear-gradient(45deg,#fffdf7,#fffdf7 10px,#f8f1e2 10px,#f8f1e2 20px);
}
.seq-tray.is-over{ border-color:#ee9dbf; background:#fdf6fa; }

/* 순서 칩 (§3.7 칩) */
.seq-chip{
  cursor:pointer; user-select:none;
  padding:8px 15px; border:3px solid #4b3b6b; border-radius:9px;
  background:#fffdf7; box-shadow:3px 3px 0 rgba(75,59,107,.15);
  font-family:'CookieRun',sans-serif; font-weight:700; font-size:15px; color:#4b3b6b;
}
.seq-chip.is-on{                 /* 터치/키보드 선택 · aria-pressed="true" */
  background:#d6c4f5;            /* 서브블록 accent = 부모 카드 헤더색 재사용 */
  box-shadow:2px 2px 0 rgba(75,59,107,.35); transform:translate(1px,1px);
}
.seq-chip.is-dragging{ box-shadow:1px 1px 0 rgba(75,59,107,.35); transform:translate(3px,3px); }

/* 순서 행 + 번호 배지 (§3.5 .act-line / .num) */
.seq-row{ display:flex; align-items:center; gap:10px; }
.seq-num{
  width:30px; height:30px; flex:none;
  border:3px solid #4b3b6b; border-radius:8px; background:#d6c4f5;
  display:flex; align-items:center; justify-content:center;
  font-family:'CookieRun',sans-serif; font-weight:700; font-size:14px; color:#4b3b6b;
}

/* 순서 칸 (§3.12 빈칸 → 채워지면 솔리드) */
.seq-slot{
  flex:1; min-height:44px; display:flex; align-items:center; justify-content:center;
  padding:6px 12px; border:3px dashed #b3a8cc; border-radius:10px; background:#fdf6fa;
  font-family:'Silkscreen',monospace; font-size:10px; color:#9c8dc4;   /* placeholder */
}
.seq-slot.is-over{ box-shadow:inset 0 0 0 4px #ee9dbf; }               /* §3.11 강조 */
.seq-slot.is-filled{ border:3px solid #4b3b6b; background:#fffdf7; justify-content:flex-start; }

/* 채점 상태색 — accent 와 별개인 의미색 (§2.1) · 테두리는 항상 #4b3b6b */
.seq-slot.is-correct{ background:#d8f0c4; }   /* --green  + .seq-mark 에 ✓ */
.seq-slot.is-wrong{   background:#f7bfb2; }   /* --salmon + .seq-mark 에 ✗ */
.seq-mark{
  width:24px; height:24px; flex:none; border:3px solid #4b3b6b; border-radius:6px;
  display:flex; align-items:center; justify-content:center; font-size:14px; background:#fffdf7;
}
.seq-slot.is-correct .seq-mark{ background:#bfe9dd; }   /* --mint */

/* 조작부 (§3.10) */
.seq-controls{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.seq-check-btn,.seq-reset-btn{
  cursor:pointer; padding:11px 20px; border:3px solid #4b3b6b; border-radius:10px;
  font-family:'CookieRun',sans-serif; font-weight:700; font-size:16px;
}
.seq-check-btn{ background:#9db2f2; color:#26224a; box-shadow:4px 4px 0 rgba(75,59,107,.3); }
.seq-reset-btn{ background:#fffdf7; color:#4b3b6b; box-shadow:4px 4px 0 rgba(75,59,107,.2); }
.seq-check-btn:active{ background:#8296e0; box-shadow:1px 1px 0 rgba(75,59,107,.3); transform:translate(3px,3px); }

/* 결과 문구 */
.seq-result{ font-family:'CookieRun',sans-serif; font-weight:700; font-size:14px; color:#4b3b6b; }

/* 포커스 (§7) */
.seq-chip:focus-visible,.seq-slot:focus-visible,
.seq-check-btn:focus-visible,.seq-reset-btn:focus-visible{
  outline:3px solid #ee9dbf; outline-offset:2px;
}

/* 모션 (§5) */
@media (prefers-reduced-motion:reduce){ .seq-chip{ transition:none !important; } }

/* 인쇄 (§6) */
@media print{
  .seq-activity{ break-inside:avoid; }
  .seq-tray{ display:none; }
  .seq-slot{ border:2px solid #4b3b6b; background:#fff; }
  .seq-slot.is-correct,.seq-slot.is-wrong{ background:#fff; }
  .seq-slot.is-correct .seq-mark::after{ content:' ✓ 정답'; }
  .seq-slot.is-wrong .seq-mark::after{ content:' ✗ 다시'; }
}
```

**상태·규칙 요약**
- 상태 = 색 + 글자(§7): 정답/오답은 배경색 **그리고** `✓`/`✗` 글리프 + 결과 문장("4칸 중 n칸 정답")을 항상 함께. 정답 배열은 텍스트로 노출하지 않음.
- 테두리색은 어떤 상태에서도 `#4b3b6b` (§2.4). 파스텔 테두리 금지(§7).
- 토글 칩 = `<button type="button" aria-pressed>` (§7). 빈 슬롯·결과에 `aria-label` / `role="status"`.
- 진행률(§10) 비포함: 이 컴포넌트는 DOM/`state` 기반이라 `renderVals` 의 체크리스트 집계에 자동으로 잡히지 않고, 역할이 "선행 조직자"라 완료율 대상이 아님. 포함이 필요하면 엔진이 채점 결과를 `state` 에 write 하고 체크리스트에 원소를 추가.
- 인쇄: 활동 전체 `break-inside:avoid`, 미배치 칩 트레이 숨김, 채점색은 흰 배경 + 아이콘/텍스트로 대체, 번호 배지 색은 정보 위계라 유지.

---

## 9. 빌더 체크리스트 (요약)

1. NOTE 박스(525행) 직후, 카드 본문 안에 `2px dashed rgba(75,59,107,.28)` 구분선 + `.seq-activity` 블록 추가. 복습 불릿·NOTE 유지.
2. `<style>`(helmet) 에 §8 CSS 스니펫 + **design.md §6 전역 `@media print` 블록**(현재 파일에 없음) 추가.
3. 칩 = `<button type="button" aria-pressed>` + `data-value`/`data-answer-key`/`aria-label`(spec §6 표). 슬롯 = `data-slot`/`data-check-group`/`data-answer`/`aria-label`.
4. `state`(1049행) 에 `seqOrder`/`seqPlaced`/`seqAllCorrect` 초깃값, `reset`(1509행) 에 초기화 추가.
5. 1074행 `closest('#mangaTable')` 셀렉터 **불변**.
6. 좌표 계산은 `getBoundingClientRect()` 만(zoom:1.1). 클릭→클릭(터치/키보드) 경로를 주 테스트 경로로.
