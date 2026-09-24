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
