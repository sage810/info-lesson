# activity.md — 학습 활동 설계 기록

> 🗂 **작업 기록(이력) 문서입니다.** 당시의 파일명·에이전트 이름(builder-agent 등)이 나오지만 지금 구조와는 다를 수 있어요. 규칙은 `docs/rules/`, 작업 방법은 `README.md`·`.claude/README.md` 를 보세요.


`docs/log/build.md` 가 "data4.html 을 어떻게 구현했는가"라면, 이 문서는
**개별 학습 활동(활동 유형 단위)을 어떻게 설계했는가**를 기록한다.
각 활동은 `activity-agent` 가 spec 을 내고(`spec/*.activity.md`),
design-agent 가 build-brief 로, builder-agent 가 조립으로 이어받는다.

- 앞으로 활동을 하나 설계할 때마다 이 문서에 절(##)을 이어 붙인다.

---

## 데이터 분석 4단계 "순서 배열 드래그" (output/data4.html · PREVIOUSLY 카드 · NOTE 박스 아래 추가) — 2026-09-03

### 목적
"데이터로 문제를 해결하는 4단계"의 **순서 자체**를 학생이 직접 복원하게 한다.
PREVIOUSLY 카드의 "지난 시간 복습 → (NOTE) 오늘 배울 것" 흐름을 이어,
NOTE 박스 바로 아래에서 오늘 수업의 4단계 골격을 미리 세우는 선행 조직자 역할.
ACTIVITY_2 의 같은 4단계 "이해 체크"와 역할을 분리(여기=순서 세우기, 거기=이해 확인).

### 활동 유형 / 정답 근거
- 유형: 순서 배열(시퀀싱) 드래그 — activity guide §3 항목, §1-4 드래그 짝짓기 컴포넌트 응용.
  채점 계약(`data-slot`/`data-check-group`/`data-answer` + 칩 `data-answer-key`)은 §1-4 와 동일,
  슬롯만 "①②③④ 순서 칸"으로 바꾼 형태.
- **엔진 신규 필요**: data4.html 에 dnd 자산(`.dnd-*` CSS/JS, `placeChipInSlot`, check/reset 핸들러,
  `updateProgress` 의 `.dnd-slot` 스캐너, `buildPrintableClone`)이 전혀 없음을 파일에서 확인.
  요구 동작(마우스 드래그 + 터치/키보드 클릭-투-플레이스 + 채점 + 무작위 다시 섞기 + `<sc-if>` 재마운트
  안전 + zoom:1.1 좌표 대응)만 명세하고 JS 구현은 builder-agent 에 위임.
- 정답 순서 근거: 각 단계가 앞 단계 산출물을 입력으로 쓰므로 순서가 인과적으로 고정(유일 해).
  문제를 정해야 필요한 데이터를 알고 → 그 데이터를 모아 특성을 보고 → 분석하고 → 결과를 해석·공유.

### 항목·정답 순서
| 순서 | key | 카드 텍스트 |
|---|---|---|
| ① | step1 | 문제 정하기 |
| ② | step2 | 데이터 수집·특성 파악 |
| ③ | step3 | 데이터 분석하기 |
| ④ | step4 | 결과 해석·공유 |

- 정답 배열: `["step1","step2","step3","step4"]`
- 초기 뒤섞인 배열: `["step3","step1","step4","step2"]` (완전 어긋남 — 어떤 칩도 정답 자리에 없음)
- "다시 섞기"는 매번 정답과 다른 무작위 순열로.
- 문구는 data4 의 ACTIVITY_2 흐름 칩 / `stepLabels`(1448행) 표기에 맞춤
  (학습 원문 "결과 해석하기" → 파일 표기 "결과 해석·공유"로 통일).

### 식별자 (aria-label / data-*)
- 트레이: `id="seqTrayPrev"`
- 칩: `data-value` = `seq-prev-step1..4`, `data-answer-key` = `step1..4`,
  `aria-label` = `순서 카드: <텍스트>`
- 슬롯: `data-slot` = `seqSlotPrev1..4`, `data-check-group="seqTrayPrev"`,
  `data-answer` = `step1..4`, `aria-label` = `순서 N번 자리` (①·④ 는 "가장 먼저/마지막" 부기)
- 버튼: `✅ 순서 확인` / `🔄 다시 섞기`, 둘 다 `data-target-tray="seqTrayPrev"` `data-result-id="seqResultPrev"`
- 결과: `id="seqResultPrev"` `role="status"` `aria-live="polite"`
- 활동 래퍼: `class="seq-activity"` (인쇄 break-inside 대상), 미니 라벨 `ORDER`
- 접두사 `seq-prev-` / `seqSlotPrev` / `seqTrayPrev` 는 기존 파일에 없음(확인).

### 통합 주의 (진행률 / 자동저장 / PDF / 인쇄 / 안티치트)
- **진행률**: data4 진행률 = `renderVals` 의 `sheetChecklist`(7항목, 위젯 `n/7`).
  기본은 **제외**(MC 카드 제외와 같은 취지). 포함하려면 엔진이 4/4 결과를 component state 에 write →
  `sheetChecklist` 에 8번째 원소 추가 → `reset` 핸들러(1509행)에 초기화 추가. DOM-only 엔진이면 제외가 기본.
- **자동저장**: data4 에 localStorage 저장 계약 없음("제출"은 `saved=true` 만, "다시 쓰기"는 state 비움).
  칩 순서·배치를 `state.seqOrder` / `state.seqPlaced` 로 보관 권장 → `<sc-if>` 재마운트에도 유지,
  기존 `reset` 에 함께 초기화.
- **PDF**: html2canvas/`buildPrintableClone` 경로 없음 — 무관. 새 클래스에 `@media print` 흑백 대비
  (채운 슬롯 흰 배경+검정 테두리+텍스트, 미배치 칩 숨김/평문, 채점색은 테두리·✓/✗ 아이콘 병행) 필요.
- **인쇄(네이티브)**: design.md §6 print 블록의 `break-inside:avoid` 셀렉터에 `.seq-activity` 추가
  (PREVIOUSLY 카드는 `.card` 클래스가 아닌 인라인 `<div>` 라 자동 적용 안 됨).
- **안티치트**: data4 에 붙여넣기·타이핑 가드 없음, 자유 입력 없어 무관.
  1071행 document 위임 `dragstart` preventDefault 는 `closest('#mangaTable')` 스코프 —
  **이 셀렉터를 넓히면 seq 칩 드래그가 막힘**. 넓히지 말 것.
  Playwright 검증은 클릭(칩→슬롯) 경로 권장(HTML5 드래그+zoom:1.1 좌표 오차 위험).

### 산출 spec 경로
`spec/data4-4steps-sequencing.activity.md`

---

## 데이터 시각화 활동지 다듬기 (output/data5.html) — 2026-09-09

data4_2 브랜치본 `data5.html`(데이터 시각화 · CODAP · 포켓몬)을 완성한 뒤,
guide 7문서 기준으로 점검·보강한 세션 기록.

### 추가/변경한 활동 요소
- **형성평가 오답 해설**: DC `Component` 4지선다. 문항마다 정답 해설 `why` + **오답 보기별 해설 맵 `w`**
  (`{'비교':…,'분포':…,'관계':…}` 등 정답 아닌 보기 전부). 피드백 조립
  `right ? '⭕ ' + q.why : '❌ ' + (q.w && q.w[pick] ? q.w[pick] + ' ' : '') + '정답은 ' + q.a + ' 분석이에요.'`.
  `pick`(고른 값, bare '구성'…)이 `w` 키와 동일 형식. → `activity guide.md §2-8` 로 규칙화.
- **`4. [데이터 해석하기]`**: 각 미션 붙여넣기 칸과 `📝 그래프 해석` 사이에 `.proc-list` 단일 `<li>`
  (`<span class="tag">` 재사용, `margin-top:8px`). "데이터 분석 과정" 1~3 항목과 같은 디자인.
- **이상치(outlier) 개념 카드**(분포 분석): `callout--tip`(정의형 = 용어 카드와 동일 변형).
- **핵심 개념 확인 표**: `key-list` → `type-scroll > table.type-table`(개념/뜻 2열, `td.k`),
  이번 수업에서 새로 배운 `이상치(outlier)` 행 포함.
- **관계 분석 재배치**: `📐 용어`(최소제곱선·r) + r값 표를 CODAP 그리기 단계에서 빼
  `4. [데이터 해석하기]` 아래 · `📝 그래프 해석 — r 값…` 앞으로 이동.
- **CODAP에 데이터 올리기 이미지**: `코답1~4` 를 앞에, 기존 `m1-drop`/`m1-resize` 를 ⑤⑥ 으로 이어 6장.
- **활동 구분선**: `.m-divider` → `::before { content: "✨ ✨ ✨" }` (색·radius·서체 미추가, `letter-spacing:10px`).

### 색 밸런스 (design.md §4.1 준수 확인)
- 미션 헤더·배지 accent = §4.1 8색 순환 그대로: aqua→blue→yellow→purple→mint,
  형성평가=lilac(#6), RECAP=salmon(#7). 카드 바탕 틴트도 §3.5 목록값(`#eef9f8`·`#f4f8fe`·`#fffaee`·`#f8f4fe`·`#f1fbf7`) 일치.
- **수정**: 이상치 카드가 유일한 난색 `callout--ask #fff6e6` 이라 냉색 파스텔 사이에서 튐 →
  `callout--tip`(#f3eefe) 으로 변경. 이후 콜아웃은 전부 냉색(`--reason` mint / `--tip` lilac / `--warn`).
- 예비 파스텔 5색(`--sage`·`--sky-2`·`--moss`·`--rose-dust`·`--peri`)을 design.md §2.1·§4.1 에 등록.

### 통합 주의
- **외부 리소스 0** 확인(코드 내 `@import`/`url(` 은 html2canvas 라이브러리 JS 내부 문자열).
- **진행률**: `sheetChecklist = [이름, fq[0], fq[1], fq[2]]` 4항목 그대로. 새 요소는 읽기 전용이라 미포함.
- **PDF(savePdf)**: hide 목록 `.pz-controls` 유지로 충분(신규 요소는 인쇄돼야 정상).
- 헤드리스 렌더는 이 환경에서 Edge 불가 → Chrome `--headless=new` `--dump-dom` 으로 하이드레이션 확인
  (`데이터 시각화`×10, `형성평가`×3, MISSION_1~5, 미치환 `{{ }}` 0).

## 디지털 데이터 — PDF 학습지에서 만든 4탭 차시 (lessons/data-analysis/01) — 2026-09-30

`input/데이터분석/데이터 1차시.pdf`(학생 작성본, 쪽마다 그림 한 장)의 **내용만** 옮겨 06 복사본 위에 조립.
다시 할 때의 절차는 `.claude/skills/lesson-new/references/from-pdf.md`.

### 새로 쓴 활동 요소 (원본 코드: `lessons/data-analysis/01/lesson.html`)
- **제미나이에게 물어보기 상자** `.callout--gemini`(#f3eefe) — 질문 예시 + "제미나이 답변 요약 ▸" + `textarea.blank rows=2`.
  안내 문구의 "보라색 상자"와 맞추려고 **연보라는 제미나이 전용**, 안내는 `.callout--info`(#f4f8fe), Tip 은 `--reason`(민트).
  안내 상자에 `a.gm-btn` "🤖 제미나이 열기"(gemini.google.com 새 탭, 인쇄 시 숨김).
- **사진 + 이름표 끌어 놓기** — 공용 `chip-slot` 재사용(이름표 2장을 4칸에 복사해 놓기). 줄 배치 `.m1-grid/.m1-row/.m1-pic/.m1-info`
  (넓으면 2×2, 700px 이하 1열). 그림은 새로 그린 SVG(`assets/m1-*.svg`, **width·height 필수** — 없으면 PDF 에서 빈 칸).
  `chip-slot.js` 채점 문구를 칸 수에 맞게 일반화(2칸이면 예전과 같은 "두 칸").
- **모두 고르기 퀴즈** `MQ`/`mqItems` — 보기 토글(`this.chip(on, '#d6c4f5')`) + "✅ 정답 확인"(`#mqCheck`)으로 채점.
  오답 피드백은 고른 오답(`no`)·빠뜨린 정답(`miss`)마다 이유 한 줄 + 정답.

### 통합 주의
- **진행률** `_progressParts()` = 빈칸 15 + `.ca-slot.is-filled` 4 + 퀴즈(정답 확인 1번 이상) 1 → 20.
- **정답지**: 서술형 정답이 없어 진행률이 25% → `npm run teacher` 가 `window.__MSI_ANSWER_SHEET` 를 붙이고, 활동지는 그때만 70% 확인을 건너뜀.
  끌어 놓기 정답은 `answers.json` click 에 `".ca-chip[data-v='…']:visible"` → `"#m1SlotN:visible"` 두 번.
- **NEIS 스냅샷**: 06 에서 복사해 온 옛 데이터(9/3 판)를 표식으로 되돌림 — 06 도 함께 고침(가져오기 때 박힌 것).

## 4탭 화면 다듬기 — 칩 탭 · 시간표 날짜 카드 · 급식 ◀ 날짜 ▶ (01·04·05·06) — 2026-09-30

04 에서 선생님과 하나씩 맞춘 뒤 `scripts/portal-upgrade.mjs`(`npm run portal-upgrade`)로 묶어 01·05·06 에 적용.
스크립트는 옛 04 에 돌린 결과가 손으로 고친 04 와 바이트 단위로 같은지 확인했고, 두 번 돌려도 바뀌지 않는다(멱등).

### 바뀐 것 (규칙: `docs/rules/portal/rule.md` §2 · `timetable.md` §4.1 · `lunch.md` §2.2·§5)
- **제목줄 탭** — 제목줄 아래에 걸린 탭(`tabStyle`) → 첫 화면과 같은 **칩 버튼**(`tabChip(active,color)`), 오른쪽 정렬.
  고른 탭 = 탭 색 + 눌린 모양, 안 고른 탭 hover = 떠오르기만(노랑으로 바꾸면 고른 "이용 규칙"과 헷갈려서). 560px 이하 2×2.
- **시간표 날짜 카드** — 제목 옆 → 제목 아래 줄.
- **급식 `◀ 날짜 ▶`** — 일간: 하루씩, 토·일 건너뜀 / 주간: `9월 28일 (월) ~ 10월 2일 (금)` 한 주씩 / 월간: `2026년 10월` 한 달씩.
  `monthGrid(fn, 연, 월)` 로 일반화(안 주면 예전 2026년 9월 — 시간표 월간은 그대로). 다른 달은 그때 받아 합침.

### 통합 주의
- 처음 열 때 이번 주가 두 달에 걸치면(9/28~10/2) 다음 달 급식도 받아야 주간 10/1·10/2 가 "급식 없음"이 안 된다.
- 두 달을 연달아 받을 때 `setState({ meal })` 로 덮어쓰면 한쪽이 사라짐 → 함수형 `setState((st) => …)` 로 합친다.
- 주간 카드 문구는 두 조각(`md-part`) — 폰에서 "~ 10 / 월 2일" 처럼 날짜 중간이 끊기지 않게.
- 인라인 스타일(dc-runtime)이라 hover·좁은 화면 조정은 CSS 에서 `!important` 로 덮는다.
- 확인: 날짜를 고정(`page.clock.install`)하고 월 ◀ → 지난주 금, 금 ▶ → 다음 주 월, 추석(9/24·25)·대체공휴일(10/5) = "이 날은 급식 정보가 없어요".

## 파일과 확장자 — PDF 학습지로 02 덮어쓰기 (lessons/data-analysis/02) — 2026-09-30

`input/데이터분석/데이터 2차시 활동지.pdf`(학생 작성본 6쪽) → 01 복사본 위에 조립(절차: `.claude/skills/lesson-new/references/from-pdf.md`).
예전 02(한 화면 "파일과 확장자", data2.html 가져온 판)는 통째로 바꿈 — git 기록에 있음.

### 새로 쓴 활동 요소 (원본 코드: `lessons/data-analysis/02/lesson.html`)
- **끌어 놓기 묶음 · 버튼 채점** — 공용 `shared/partials/chip-slot.js` 확장: `[data-ca-group]` 안의 칸끼리만 채점하고 결과는 묶음 안 `.ca-result`,
  `data-ca-check="button"` 이면 `button.ca-check`(✅ 정답 확인)로만 채점(빈 칸 있으면 알려만 줌), `button.ca-reset`(🔀 다시 섞기) = 칸 비우고 이름표 순서 섞기.
  다른 묶음 이름표는 놓이지 않음. 묶음 없는 01·04 는 예전 그대로(바로 채점, "두 칸/4칸 모두 정답") — 둘 다 눌러서 확인.
- **파일 줄**(`.fx-row`: 파일 이름 + 확장자 칸 + 데이터 종류 칸) · **정리함 칸**(`.box-grid`, 700px 이하 1열) · 채점 버튼 `.ca-btn`(PDF 저장·인쇄에선 숨김).
- **한 문항 고르기** `VQ`(긴 보기 카드, 누르면 바로 ✅/❌ + 이유) · **O/X 묶음** `OXQ`(고른 뒤 정답 확인, 틀린 문항만 "정답은 X — 이유", 다시 풀기).
  오답 이유 문구는 PDF 내용을 근거로 새로 씀(components.md §2-8).

### 통합 주의
- 진행률 `_progressParts()` = 빈칸 9 + `.ca-slot.is-filled` 20 + 미니 퀴즈 1 + O/X 고른 문항 수 7 → 37. 다시 섞기·다시 풀기 하면 줄어듦.
- 버튼 채점 묶음은 칸을 새로 놓으면 그 칸의 맞음/틀림 표시와 결과 문구를 지운다(옛 채점이 남지 않게).
- 정답지: `answers.json` click 에 묶음별 이름표 → 칸 → 정답 확인, `#vq-norun`, `#oxq-N-O/X` → `#oxqCheck`. M2 3칸만 fill.

## 데이터 과학 — PDF 학습지로 03 만들기 (lessons/data-analysis/03) — 2026-09-30

`input/데이터분석/데이터 3차시 활동지.pdf`(학생 작성본 8쪽) → 02 복사본 위에 조립(절차: `.claude/skills/lesson-new/references/from-pdf.md`).

### 새로 쓴 활동 요소 (원본 코드: `lessons/data-analysis/03/lesson.html`)
- **과정 줄** `.st-row`(단계 이름 + 문장 속 글자 칸 `textarea.blank.blank--inline`, 칸 너비는 `style="width:…px"`, 700px 이하 위아래) — 정해진 낱말 빈칸을 PDF 처럼 글자로 쓰게 할 때.
  `.st-mean` 은 콜아웃 안 문장 빈칸(정의·판단의 열쇠)에도 씀. PDF 저장에선 인라인 칸이 글자 길이만큼(최소 120px) 그려짐.
- **사례 상자** `.case-box`(`.case-lbl--no` ❌ 직관 / `.case-lbl--ok` ✅ 데이터 / `.case-ar` → 결정 줄).
- **둘 중 하나 고르기 여러 문항** `DQ` + `dqItems`(문항마다 "맞다/아니다", 누르면 바로 ✅/❌ + 이유) — 02 `VQ`(한 문항)의 여러 문항판.
- `.miniflow` 는 700px 이하에서 세로로 쌓고 화살표를 ↓ 로 돌림(03 CSS 에만).
- `<b>` 는 본문 글꼴(Maplestory)에서 굵게 안 보임 → 굵게 할 말은 `.case-lbl`(CookieRun 700) 로.

### 통합 주의
- 진행률 `_progressParts()` = 빈칸 28 + 사례 퀴즈 고른 문항 2 + O/X 고른 문항 5 → 35.
- 정답지: `answers.json` fill 15칸(낱말 11 + 사례 이름 2 + 직업 2), 생각을 쓰는 13칸은 비움. click `#dq-1-Y`·`#dq-2-N`, `#oxq-N-O/X` → `#oxqCheck`.

## 04·05·07차시 정답지 PDF 만들기 — 2026-09-30

`npm run teacher` 가 답을 채우려면 `answers.json` 이 있어야 하는데 04·07 은 `answers.md`(글), 05 는 정답 파일이 없었다.
세 차시 모두 `answers.json` 을 새로 쓰고, 이제 01~07 전부 정답지 PDF 를 뽑을 수 있다(`dist/answers/`, 깃에 올리지 않음).

### 정답을 어디서 가져왔나
- **04**: 표 문제(포켓몬·만화)는 표에서 바로 나오는 값. 개념 빈칸 6개(문제 정의·확인 항목 3·속성 정의·프로그램 이름)는
  학습지의 힌트 문장을 근거로 정하고 **선생님 확인**. 순서 배열 4단계는 `answers.md` 그대로.
- **05**: 개념 빈칸은 이 학습지 **뒷부분 "핵심 개념 확인"·형성평가 표에 이미 적힌 표현**을 그대로 옮겼다
  (숨겨진 "패턴과 추세", "무엇을 알고 싶은가에 따라", 4유형 의미 4줄). 처음엔 문맥으로 추측했다가 이 표를 보고 고침 —
  **개념 빈칸 정답은 그 학습지 안에 이미 있는지부터 찾는다.** 포켓몬 표 속성 7칸은 `materials/포켓몬.txt` 머리줄.
- **07**: CODAP 으로 학생이 직접 계산하는 차시라 정해진 숫자 답이 없다 → 정답 대신 **채점 기준**(무엇을 확인해야 맞는지)을
  각 칸에 넣어 "교사용 채점 기준" PDF 로 만든다(선생님 결정). 내용은 `answers.md` 에서 옮김.
- 학생이 스스로 정하는 칸(05 문제 정하기·그래프 해석·나의 결정, 04 그래프 붙여넣기)은 **비운다** — 01·02·03 과 같은 결정.

### 고친 것
- `scripts/teacher.mjs` 의 `{near, text}` 찾기 버그: x-dc 가 화면 밖에 남기는 **숨은 원본 복제본**의 글자에서 위로 올라가면
  곧장 `body` 라 hop 이 1 이 되고, 그게 최소 hop 으로 뽑혀 **문서 전체에서 맨 처음 나오는 버튼**을 눌렀다.
  (04 행·열·셀 3문항이 모두 1번 문항에 눌려 마지막 "셀"만 남음.)
  → 글자 자체가 안 보이면(`parentElement.getClientRects()` 없음) 건너뛰고, 올라가다 `body` 를 만나면 멈춘다. 06 도 다시 뽑아 이상 없음 확인.
- 04 의 이름표 없는 빈칸 7개에 `aria-label` 추가(프로그램 이름·셀 주소 4문항·만화 표 2문항) — 정답지가 칸을 찾으려면 필요.
  04 진행률은 `[data-act] textarea.blank` 로 세므로 숫자는 그대로.

## 수정 요청 메모 — A안(복사·붙여넣기) — 2026-10-01

선생님이 활동지 화면에서 고칠 글을 직접 가리켜 요청을 남기는 기능. html-doc(tonywjs)의 "메모"에서 아이디어만 가져와 우리 구조에 맞게 따로 만듦
(html-doc 은 화면을 그대로 저장하는 편집기라 `lesson.html` 소스·표식·정답 속성을 망가뜨릴 수 있어 쓰지 않기로 함).

- `shared/runtime/msi-memo.js` — 주소에 `?memo=1` 이 있거나 그 브라우저에 켠 기록이 있을 때만 동작(없으면 아무것도 안 함). `?memo=0` 으로 끔.
- `scripts/lib/render.mjs` — **pages 변형에만** 붙임(구글 사이트용 embed·정답지 PDF 만들기에는 안 붙음). 학생·교사용 화면 모두 같은 스크립트를 받지만 켜기 전엔 보이지 않음.
- 글을 드래그(빈칸 안 글도 됨) → 📝 메모 → 요청 적기 → 목록에 담기 → 전체 복사. 위치는 탭 › MISSION_n › 가장 가까운 소제목·상자 이름 + 칸의 `aria-label`.
  폰에서는 버튼을 눌러도 선택이 풀릴 수 있어 **마지막 선택을 기억**한다. 목록은 `localStorage`(`msi-memo-items:<차시>`), 서버로 안 감.
- 활동지 영역(`#sheetPrintArea`) 밖의 고정 위젯이라 진행률·PDF 저장에 영향 없음, 인쇄 때 숨김.
- 붙여넣은 "[수정 요청]" 글을 처리하는 순서는 `lesson-edit` 스킬에 적음.
- B안(내 PC 미리보기에서 `memos/<차시>.json` 파일로 저장)은 아직 안 만듦 — 필요해지면 `scripts/serve.mjs` 에 저장 주소를 추가하는 식으로 확장.
- 확인(Playwright): 꺼짐 0개 · 켜짐/기억 · 일반 글·빈칸 안 글·선택 없는 메모 · 복사 글 모양 · 새로고침 후 목록 유지 · 끄기 · 폰 360px 가로 스크롤 없음.

- **"메모 켜줘" 한 번에 켜기** — `scripts/memo.mjs`(`npm run memo -- <차시>`): 빌드 → 8080 서버가 꺼져 있으면 뒤에서 켜기 → `?memo=1` 주소를 브라우저로 열기. 차시를 안 주면 lesson.html 을 가장 최근에 고친 차시. 서버가 꺼진 상태에서도 되는지 확인함. 규칙은 `CLAUDE.md` "메모 켜줘" 절·메모리(feedback-memo-on-command).
