# 활동 spec — 데이터 분석 4단계 "순서 배열 드래그"

- 대상 파일: `output/data4.html`
- 배치 카드: PREVIOUSLY(`<span ...>PREVIOUSLY</span>` / "지난 시간 복습", 약 496~526행)
- 작성일: 2026-09-03
- 소비자: design-agent(build-brief), builder-agent(구현)

---

## 0. 요약 (activity spec 블록)

```json
{
  "id": "prev-seq-4steps",
  "placement": "output/data4.html · PREVIOUSLY 카드 · NOTE 박스(약 521~524행) 바로 아래 · 카드 본문의 마지막 요소로 추가 (기존 복습 불릿 3개 + NOTE 유지, 교체 아님)",
  "type": "순서 배열(시퀀싱) 드래그 (activity guide §3 '순서 배열' — §1-4 드래그 짝짓기 컴포넌트 응용)",
  "engine": "신규 필요 — data4.html 에 dnd 엔진(CSS/JS)이 전혀 없음 (아래 §5 확인 근거). 요구 동작만 명세, JS 는 builder-agent 구현",
  "title": "오늘 쓸 4단계, 순서부터 맞춰 보기",
  "prompt": "데이터로 문제를 해결할 때는 정해진 차례가 있어요. 아래 4장의 카드를 올바른 순서(① → ④)로 끌어다 놓아 보세요. 오늘 수업은 이 순서대로 진행돼요.",
  "items": [
    { "key": "step1", "text": "문제 정하기",              "correctOrder": 1 },
    { "key": "step2", "text": "데이터 수집·특성 파악",       "correctOrder": 2 },
    { "key": "step3", "text": "데이터 분석하기",            "correctOrder": 3 },
    { "key": "step4", "text": "결과 해석·공유",             "correctOrder": 4 }
  ],
  "initialOrder": ["step3", "step1", "step4", "step2"],
  "answerKeyBySlot": { "seqSlotPrev1": "step1", "seqSlotPrev2": "step2", "seqSlotPrev3": "step3", "seqSlotPrev4": "step4" },
  "controls": { "check": "✅ 순서 확인", "reset": "🔄 다시 섞기", "resultId": "seqResultPrev" },
  "feedback": {
    "allCorrect": "정확해요! 데이터로 문제를 해결할 때는 ① 문제 정하기 → ② 데이터 수집·특성 파악 → ③ 데이터 분석하기 → ④ 결과 해석·공유 순서로 나아가요. 오늘은 이 흐름을 따라 활동해요.",
    "partial": "거의 왔어요! 4칸 중 {n}칸이 제자리예요. '무엇을 알아볼지(문제)'를 먼저 정하고, 그 다음에 데이터를 모아요. 분석은 데이터를 모은 뒤에, 해석·공유는 맨 마지막이에요. 초록색이 아닌 칸을 다시 옮겨 봐요.",
    "none": "순서를 다시 생각해 봐요. 가장 먼저 할 일은 '어떤 문제를 풀지 정하는 것'이고, 결과 해석·공유는 가장 마지막이에요.",
    "incomplete": "빈 칸이 있어요. 4칸을 모두 채운 뒤 '순서 확인'을 눌러요.",
    "howScored": "슬롯 4칸의 data-answer 와 그 칸에 놓인 칩의 data-answer-key 가 모두 일치해야 정답(4/4). 부분 정답은 일치한 칸 수만 표시하고 칸별로 초록/빨강 표시. 정답 순서는 유일(다른 배열은 오답)."
  },
  "identifiers": {
    "tray": "seqTrayPrev",
    "chips": ["seq-prev-step1", "seq-prev-step2", "seq-prev-step3", "seq-prev-step4"],
    "slots": ["seqSlotPrev1", "seqSlotPrev2", "seqSlotPrev3", "seqSlotPrev4"],
    "checkGroup": "seqTrayPrev",
    "resultId": "seqResultPrev"
  },
  "integration": {
    "progress": "기본은 포함 안 함(§7-1). data4 진행률은 renderVals 의 sheetChecklist(7항목)로 계산되고 .dnd-slot DOM 스캐너가 없음. 포함하려면 renderVals 수정 필요 — engine 이 결과(4/4 여부)를 component state 에 써야 함.",
    "autosave": "data4 에는 localStorage 자동저장이 없음(§7-2). 칩 배열을 state.seqOrder 로 보관하고 기존 reset 핸들러(약 1509행)에 seqOrder 초기화를 추가 권장. DOM-only 로 두면 탭 전환(sc-if 언마운트) 시 배치가 사라짐.",
    "pdf": "html2canvas/buildPrintableClone 경로 없음(§7-3). 네이티브 @media print 만 존재. 새 클래스(.seq-slot/.seq-chip/.seq-activity)에 흑백 대비 인쇄 규칙 + break-inside:avoid 추가 필요.",
    "print": "design.md §6 print 블록의 break-inside:avoid 셀렉터 목록에 .seq-activity 추가. 미배치 칩 트레이는 인쇄에서 숨기거나 평문 나열.",
    "anticheat": "data4 에는 붙여넣기 차단·타이핑 속도 가드가 없음(§7-4). 자유 입력이 없어 무관. 단, 1071행의 document 위임 dragstart preventDefault 는 closest('#mangaTable') 로 스코프됨 — 이 셀렉터를 넓히지 말 것(넓히면 seq 칩 드래그가 막힘)."
  }
}
```

---

## 1. 활동 유형 선택 근거

- 학습 목표: "데이터로 문제를 해결하는 4단계"의 **순서 자체**를 학생이 능동적으로 복원하게 한다.
  단순 체크(ACTIVITY_2 의 `<sc-for steps>` 체크리스트)는 "이해했는지" 확인용이고,
  이 활동은 그 **직전 단계**로서 "순서를 스스로 세워 보게" 하는 역할이다.
- activity guide **§3 "순서 배열(시퀀싱) 드래그"** 항목을 그대로 채택.
  guide 원문: "1-4 짝짓기 컴포넌트를 응용 — 슬롯을 ①/②/③/④ 순서 칸으로 만들고, 칩에 뒤섞인 단계 설명을 담아
  올바른 순서로 놓게 한다. 채점 로직(`data-answer`)을 그대로 재사용."
- 즉 **채점 계약은 §1-4 와 동일**(`data-slot` / `data-check-group` / `data-answer` / 칩 `data-answer-key`),
  다른 점은 슬롯이 "설명 문장 옆 짝"이 아니라 "번호가 매겨진 순서 칸"이라는 것뿐이다.

## 2. 배치 결정과 근거

### 결정
PREVIOUSLY 카드 본문의 **맨 끝**, 현재 NOTE 박스(약 521~524행: "오늘은 그렇게 표에 모은 데이터로 '문제를
해결하는 방법'을 배워요.") **바로 아래**에 새 블록으로 추가한다.
기존 복습 불릿 3개(📁🔎📊)와 NOTE 박스는 **그대로 유지**(교체·삭제 없음).

NOTE 박스와 이 활동 사이에 design.md §2.4 "내부 구분선"(`2px dashed rgba(75,59,107,.22~.3)`)을 한 줄 넣어
"복습" → "오늘 미리보기"로 넘어가는 지점을 시각적으로 구분한다.

### 근거
1. **흐름**: 카드는 이미 "지난 시간 3가지(입력·수집·표 정리) → NOTE(오늘은 문제 해결을 배운다)"로
   과거→미래 전환 문장을 품고 있다. NOTE 가 "오늘 배울 것"을 여는 문장이므로, 그 **직후**에
   "그 방법은 이 4단계예요 — 순서를 맞춰 보세요"가 오는 것이 자연스럽다.
2. **선행 조직자(advance organizer)**: 학생이 ACTIVITY_1~5 를 만나기 전에 전체 4단계 골격을
   스스로 세워 두면, 이후 각 활동이 "몇 번째 단계 이야기인지" 위치를 잡기 쉽다.
3. **복습 불릿을 건드리지 않음**: 불릿 3개는 "이전 차시"의 사실 회상이라 손대면 복습 기능이 약해진다.
   활동은 카드 끝에 얹어 "복습 → 미리보기"의 2박자를 만든다.
4. **중복 회피**: ACTIVITY_2 가 같은 4단계를 "체크"로 다룬다. 여기서는 **순서 세우기**,
   거기서는 **이해 확인**으로 역할을 분리한다(문구도 ACTIVITY_2 의 흐름 칩 표기와 일치시켜 혼란 없음).
5. **탭 게이팅 안전**: PREVIOUSLY 카드는 `<sc-if value="{{ isSheet }}">`(430행) 안이라
   수업 활동지 탭에서만 렌더된다 — 활동이 다른 탭에 새어 나가지 않는다.

## 3. 항목·정답 순서 (학습 내용 근거로 확정, 추측 아님)

"데이터로 문제를 해결하는 4단계"의 정의상 순서는 인과적으로 고정된다:

| 순서 | key | 카드 텍스트 | 왜 이 자리인가 |
|---|---|---|---|
| ① | `step1` | 문제 정하기 | 무엇을 알아볼지 정해야 어떤 데이터가 필요한지 알 수 있다. 나머지 모든 단계의 기준. |
| ② | `step2` | 데이터 수집·특성 파악 | 문제가 정해진 뒤에야 관련 데이터를 모으고, 그 데이터가 어떤 값·형식·범위인지 살핀다. |
| ③ | `step3` | 데이터 분석하기 | 모아서 정리한 데이터를 실제로 비교·계산·시각화한다. 수집 이후에만 가능. |
| ④ | `step4` | 결과 해석·공유 | 분석 결과가 문제에 대해 무엇을 말하는지 해석하고 정리·공유한다. 마지막. |

- **정답 배열**: `["step1", "step2", "step3", "step4"]` (슬롯 ①②③④ 순).
- **유일 해**: 각 단계는 앞 단계의 산출물을 입력으로 쓰므로 다른 순서는 성립하지 않는다.
  → 부분 정답만 인정하고, "또 다른 정답 순서"는 없다.
- **표기 일치**: data4 의 ACTIVITY_2 흐름 칩("1 문제 정하기 / 2 데이터 수집·특성 파악 / 3 데이터 분석하기 /
  4 결과 해석·공유", 576~582행)과 `stepLabels`(1448행)의 문구를 그대로 따랐다.
  학습 내용 원문의 "결과 해석하기"는 파일 표기 "결과 해석·공유"로 통일(같은 단계).

### 초기(뒤섞인) 배열

`initialOrder = ["step3", "step1", "step4", "step2"]` — 트레이에 이 순서로 칩을 놓는다.

- 완전 어긋남(derangement): 어떤 칩도 자기 정답 자리에 있지 않다
  (자리1=step3, 자리2=step1, 자리3=step4, 자리4=step2 — 정답 자리는 각각 3·1·4·2).
- 첫 칸이 "데이터 분석하기"라 "분석 전에 뭔가 있어야 하지 않나?"라는 인지 갈등을 바로 유발한다.
- "다시 섞기"는 매번 **정답 배열과 다른** 무작위 순열로 섞는다(가능하면 직전 섞임과도 다르게).
  구현: Fisher–Yates 후 `배열 === 정답`이면 재시도(선택적으로 고정점 있는 순열도 배제).

## 4. 채점 · 피드백

### 채점 규칙 (`howScored`)
1. "순서 확인" 클릭 시, 4개 슬롯 각각에 대해 `slot.dataset.answer === placedChip.dataset.answerKey` 비교.
2. 일치 칸 → 초록(정답), 불일치 칸 → 빨강(오답)으로 칸 테두리/배경 표시 + 아이콘(✓ / ✗).
3. `#seqResultPrev`(role="status", aria-live="polite")에
   `"4칸 중 n칸 정답"` + 아래 표의 피드백 문구 1개를 함께 출력.
4. **빈 칸이 하나라도 있으면 채점하지 않고** `incomplete` 문구만 표시.

| 조건 | 결과 텍스트(`#seqResultPrev`) |
|---|---|
| 빈 칸 있음 | `빈 칸이 있어요. 4칸을 모두 채운 뒤 '순서 확인'을 눌러요.` |
| 4/4 정답 | `4칸 모두 정답! ` + `feedback.allCorrect` |
| 1~3칸 정답 | `4칸 중 {n}칸 정답. ` + `feedback.partial`({n} 치환) |
| 0칸 정답 | `4칸 중 0칸 정답. ` + `feedback.none` |

### 다시하기 동작 (`🔄 다시 섞기`)
- 모든 슬롯 비우기 → 모든 칩 트레이로 복귀 → 트레이를 새 무작위(정답≠) 순열로 재배치
  → 초록/빨강 표시 및 `#seqResultPrev` 초기화 → 선택 상태(터치/키보드) 해제.

### 부분 정답 처리
- 부분 정답은 "몇 칸 맞음"만 알려 주고 **어느 칸이 틀렸는지는 색으로만** 보여 준다
  (정답 배열을 텍스트로 노출하지 않는다). 학생이 스스로 다시 옮기게 유도.

## 5. "엔진 신규 필요" — 파일에서 확인한 근거

`output/data4.html` 를 직접 확인한 결과 **드래그 관련 자산이 전혀 없다**:

| 확인 항목 | data4.html 실태 |
|---|---|
| `.dnd-tray` / `.dnd-chip` / `.dnd-slot` CSS | 없음 (`<style>` 은 27~92행: `.sheet-progress` 계열 + `.no-copy` 뿐) |
| dnd 드래그/드롭 JS, `placeChipInSlot` | 없음 |
| `dnd-check-btn` / `dnd-reset-btn` 핸들러 | 없음 |
| `updateProgress()` (`.dnd-slot` 스캐너) | 없음 — 진행률은 `renderVals` 의 `sheetChecklist` 배열(1456~1464행) |
| `buildPrintableClone()` / html2canvas PDF | 없음 — 인쇄는 네이티브 `@media print`(design.md §6)만 |
| 붙여넣기 차단 / 타이핑 속도 가드 | 없음 (data3 계열 기능) |
| 유일 copy 방어 | `#mangaTable` 의 `.no-copy` + document 위임(1071행), `closest('#mangaTable')` 스코프 |

파일 구조: 하단 `<script type="text/x-dc" data-dc-script>` 안
`class Component extends DCLogic { state = {…}; renderVals() {…} }`,
템플릿은 `{{ }}` 바인딩 · `<sc-if>` · `<sc-for as=>`,
최상위 본문 래퍼에 `zoom:1.1`(94행). 활동 진행률 위젯만 그 zoom 래퍼 **밖**(890행)에 있다.

### 요구 동작 (명세만 — JS 는 builder-agent)

1. **마우스 드래그**: 트레이 칩을 눌러 4개 슬롯 중 하나에 끌어다 놓기.
   - 이미 찬 슬롯에 놓으면 → 두 칩 자리 교환(또는 기존 칩을 트레이로 되돌림).
   - 슬롯 밖에 놓으면 → 칩은 트레이로 복귀.
2. **터치/키보드 대체 조작** (guide §1-4 와 동일 계약):
   - 칩 클릭/탭 → "선택"(시각 강조 + `aria-pressed="true"`), 다시 누르면 해제.
   - 선택 상태에서 슬롯 클릭/탭 → 그 슬롯에 배치.
   - 키보드: 칩·슬롯 `tabindex="0"`, Enter/Space = 선택/놓기, Esc = 선택 해제.
3. **슬롯당 칩 1개** (guide §1-4 `placeChipInSlot` 의 1:1 규칙 재사용). 트레이는 남은 칩만 리플로우.
4. **채점** (`✅ 순서 확인`, `data-target-tray="seqTrayPrev"` `data-result-id="seqResultPrev"`): §4 규칙대로.
5. **리셋** (`🔄 다시 섞기`, 같은 `data-target-tray`/`data-result-id`): §4 "다시하기"대로, 새 무작위 순열.
6. **초기 렌더**: 트레이 = `initialOrder`, 슬롯 4칸 비움.
7. **재마운트 안전**: PREVIOUSLY 카드는 `<sc-if isSheet>` 안 → 탭 전환 때 언마운트/재마운트된다.
   - 권장 A: 칩 배열을 `state.seqOrder`(+ `state.seqPlaced`)로 보관해 재마운트에도 유지, `reset` 핸들러에서 함께 초기화.
   - 대안 B: DOM-only 로 두되 **매 마운트마다 재초기화**(`#mangaTable` 위임과 같은 패턴). 이 경우 탭 전환 시 배치가 리셋됨을 감수.
8. **zoom:1.1 대응**: 카드가 zoom 래퍼 안이라, 드래그 좌표 계산은 `getBoundingClientRect()`(zoom 반영됨) 기준으로만.
   `clientX` − `offsetLeft` 식 수동 산술 금지. 터치/키보드 경로(클릭→클릭)는 zoom 영향이 없으므로 **주 테스트 경로**로 삼는다.
9. **접근성**: 아래 §6 의 유일 `aria-label` 부여. 슬롯에 칩이 놓이면 `aria-label` 또는 보조 텍스트로 "① 자리: 문제 정하기"처럼 현재 내용 announce.
   `#seqResultPrev` 는 `role="status"`/`aria-live="polite"`. `:focus-visible` 아웃라인 유지(design §7). `prefers-reduced-motion` 시 칩 이동 애니메이션 생략.

### 권장 구현 방향 (design/builder 공통)
data4 에 **guide §1-4 dnd 엔진 계약(클래스명 + data 속성 + 위임 리스너)을 1회 이식**하면,
이 활동과 앞으로의 모든 드래그 활동이 "마크업만 추가"로 끝난다.
엔진은 `#mangaTable` 처럼 **document 위임 + `closest()` 스코프**로 붙여 `<sc-if>` 늦은 마운트에 견디게 한다.

## 6. 식별자 (페이지 전체 유일)

접두사 `seq-prev-` / `seqSlotPrev` / `seqTrayPrev` 로 통일 — 기존 파일에 이 토큰 없음(확인함).

### 트레이
| 요소 | 속성 | 값 |
|---|---|---|
| 트레이 컨테이너 | `id` | `seqTrayPrev` |

### 칩 (4개)
| key | `data-value` | `data-answer-key` | `aria-label` |
|---|---|---|---|
| step1 | `seq-prev-step1` | `step1` | `순서 카드: 문제 정하기` |
| step2 | `seq-prev-step2` | `step2` | `순서 카드: 데이터 수집·특성 파악` |
| step3 | `seq-prev-step3` | `step3` | `순서 카드: 데이터 분석하기` |
| step4 | `seq-prev-step4` | `step4` | `순서 카드: 결과 해석·공유` |

### 슬롯 (4개)
| 순서 | `data-slot` | `data-check-group` | `data-answer` | `aria-label` |
|---|---|---|---|---|
| ① | `seqSlotPrev1` | `seqTrayPrev` | `step1` | `순서 1번 자리 (가장 먼저 하는 단계)` |
| ② | `seqSlotPrev2` | `seqTrayPrev` | `step2` | `순서 2번 자리` |
| ③ | `seqSlotPrev3` | `seqTrayPrev` | `step3` | `순서 3번 자리` |
| ④ | `seqSlotPrev4` | `seqTrayPrev` | `step4` | `순서 4번 자리 (가장 마지막 단계)` |

### 조작부
| 요소 | 속성 | 값 |
|---|---|---|
| 확인 버튼 | 텍스트 / `data-target-tray` / `data-result-id` | `✅ 순서 확인` / `seqTrayPrev` / `seqResultPrev` |
| 리셋 버튼 | 텍스트 / `data-target-tray` / `data-result-id` | `🔄 다시 섞기` / `seqTrayPrev` / `seqResultPrev` |
| 결과 표시 | `id` / `role` / `aria-live` | `seqResultPrev` / `status` / `polite` |
| 활동 래퍼 | `class` | `seq-activity` (인쇄 `break-inside:avoid` 대상) |
| 미니 라벨 | Silkscreen 텍스트 | `ORDER` (design §3.3 동작어) |

## 7. 통합 주의 (항목별)

### 7-1. 진행률 (design.md §10 / activity guide §2-3)
- data4 진행률은 `renderVals()` 의 `sheetChecklist`(7항목: fName, a1, checks[0~3], reflect / 1456~1464행)로만 계산.
  위젯은 `n/7` 로 표기(`sheetTotal = 7`).
- **기본 권장: 이 활동을 진행률에서 제외**(MC 카드가 제외된 것과 같은 취지 — guide §2-3).
- 포함하려면:
  1. dnd 엔진이 채점 결과(4/4 정답 여부, 또는 "4칸 모두 채움")를 **component state 로 write**
     (예: `this.setState({ seqAllCorrect: true })`).
  2. `renderVals()` 의 `sheetChecklist` 에 그 값을 8번째 원소로 추가 → 위젯이 자동으로 `n/8`.
  3. `reset` 핸들러(1509행)에 해당 state 초기화 추가.
- DOM-only 엔진이면 renderVals 가 그 상태를 볼 수 없으므로 **제외가 기본값**.

### 7-2. 자동저장 (activity guide §2-1)
- **data4 에는 localStorage 자동저장/불러오기가 없다.** "💾 제출하기"는 `state.saved=true` 만 세팅(1508행),
  "다시 쓰기"는 state 를 비운다(1509행). 즉 저장 계약 자체가 없다.
- 권장: 칩 순서를 `state.seqOrder`(배열), 슬롯 배치를 `state.seqPlaced`(slotId→key 맵)로 보관.
  - `<sc-if>` 재마운트에도 배치가 유지된다.
  - 기존 `reset` 핸들러에 `seqOrder`(초기 뒤섞임으로), `seqPlaced`({}), `seqAllCorrect`(false) 초기화를 함께 넣는다.

### 7-3. PDF 저장 (activity guide §1-1-b / §2-4)
- data4 에 **html2canvas·jsPDF·`buildPrintableClone()` 경로가 없다.** 해당 규칙 무관.
- 새 클래스(`.seq-chip`, `.seq-slot`, `.seq-activity`)에 대해 `@media print` 흑백 대비 스타일 필요:
  - 채워진 슬롯: 흰 배경 + 검정 테두리 + 놓인 단계 텍스트가 보이게, `box-shadow:none`.
  - 트레이의 미배치 칩: 인쇄에서 숨기거나(활동이 미완료면) 평문 목록으로.
  - 초록/빨강 채점색은 인쇄 시 테두리 굵기/아이콘(✓·✗)으로도 구분되게(색만 의존 금지, §7 접근성).

### 7-4. 네이티브 인쇄 (activity guide §2-5 / design.md §6)
- design.md §6 print 블록: `figure,table,.card{break-inside:avoid}` + `*{box-shadow:none}` + `.toolbar{display:none}`.
- **`.seq-activity` 를 `break-inside:avoid` 목록에 추가**(PREVIOUSLY 카드는 `.card` 클래스가 아닌 인라인 스타일 `<div>` 라 자동 적용 안 됨).
- 4개 슬롯 그리드와 트레이가 페이지 경계에서 쪼개지지 않도록 활동 전체를 한 덩어리로.

### 7-5. 안티치트 (activity guide §2-2)
- data4 에는 붙여넣기 차단·타이핑 속도 가드가 **없다.** 이 활동엔 자유 텍스트 입력도 없어 무관.
- **주의**: 1071행 `['copy','cut','contextmenu','dragstart'].forEach(... document.addEventListener ...)` 는
  `e.target.closest('#mangaTable')` 인 경우에만 `preventDefault()` 한다.
  seq 칩은 `#mangaTable` 밖이라 영향 없지만, **이 셀렉터를 넓히면 seq 칩의 `dragstart` 가 막힌다** — 넓히지 말 것.
- Playwright 등 자동 테스트: 이 활동은 클릭 기반(칩 클릭 → 슬롯 클릭) 경로로 검증하는 것이 가장 안정적
  (HTML5 드래그 시뮬레이션 + zoom:1.1 조합은 좌표 오차 위험).

## 8. 마크업 스케치 (참고용 — 최종본 아님)

> data4 에 §1-4 엔진 계약을 이식했다는 전제. 클래스명은 엔진 계약과 맞추되,
> 레이아웃/인쇄용 래퍼로 `.seq-activity`, 순서 칸 번호 배지로 design §3.5 `.num` 패턴을 쓴다.

```html
<!-- NOTE 박스 아래, 내부 구분선 다음 -->
<div style="borderTop:2px dashed rgba(75,59,107,.28)"></div>

<div class="seq-activity" style="display:flex; flexDirection:column; gap:10px">
  <div style="display:flex; alignItems:center; gap:8px">
    <span style="fontFamily:'Silkscreen',monospace; fontSize:10px; color:#6b559b">ORDER</span>
    <span style="fontFamily:'CookieRun',sans-serif; fontWeight:700; fontSize:16px">오늘 쓸 4단계, 순서부터 맞춰 보기</span>
  </div>
  <p style="fontSize:14px; color:#8b7cb8">아래 4장의 카드를 올바른 순서(① → ④)로 끌어다 놓아 보세요. 오늘 수업은 이 순서대로 진행돼요.</p>

  <div class="dnd-tray" id="seqTrayPrev" style="display:flex; gap:8px; flexWrap:wrap">
    <span class="dnd-chip" data-value="seq-prev-step3" data-answer-key="step3" aria-label="순서 카드: 데이터 분석하기">데이터 분석하기</span>
    <span class="dnd-chip" data-value="seq-prev-step1" data-answer-key="step1" aria-label="순서 카드: 문제 정하기">문제 정하기</span>
    <span class="dnd-chip" data-value="seq-prev-step4" data-answer-key="step4" aria-label="순서 카드: 결과 해석·공유">결과 해석·공유</span>
    <span class="dnd-chip" data-value="seq-prev-step2" data-answer-key="step2" aria-label="순서 카드: 데이터 수집·특성 파악">데이터 수집·특성 파악</span>
  </div>

  <div style="display:flex; flexDirection:column; gap:8px">
    <div class="dnd-row" style="display:flex; alignItems:center; gap:10px">
      <div class="num">①</div>
      <div class="dnd-slot seq-slot" data-slot="seqSlotPrev1" data-check-group="seqTrayPrev" data-answer="step1" aria-label="순서 1번 자리 (가장 먼저 하는 단계)"></div>
    </div>
    <div class="dnd-row" style="display:flex; alignItems:center; gap:10px">
      <div class="num">②</div>
      <div class="dnd-slot seq-slot" data-slot="seqSlotPrev2" data-check-group="seqTrayPrev" data-answer="step2" aria-label="순서 2번 자리"></div>
    </div>
    <div class="dnd-row" style="display:flex; alignItems:center; gap:10px">
      <div class="num">③</div>
      <div class="dnd-slot seq-slot" data-slot="seqSlotPrev3" data-check-group="seqTrayPrev" data-answer="step3" aria-label="순서 3번 자리"></div>
    </div>
    <div class="dnd-row" style="display:flex; alignItems:center; gap:10px">
      <div class="num">④</div>
      <div class="dnd-slot seq-slot" data-slot="seqSlotPrev4" data-check-group="seqTrayPrev" data-answer="step4" aria-label="순서 4번 자리 (가장 마지막 단계)"></div>
    </div>
  </div>

  <div style="display:flex; gap:10px; flexWrap:wrap; alignItems:center">
    <button type="button" class="dnd-check-btn" data-target-tray="seqTrayPrev" data-result-id="seqResultPrev">✅ 순서 확인</button>
    <button type="button" class="dnd-reset-btn" data-target-tray="seqTrayPrev" data-result-id="seqResultPrev">🔄 다시 섞기</button>
    <span id="seqResultPrev" role="status" aria-live="polite" style="fontFamily:'CookieRun',sans-serif; fontWeight:700; fontSize:14px"></span>
  </div>
</div>
```

- 칩/슬롯/버튼의 실제 시각 토큰은 design-agent build-brief 에서 design.md §3.5(`.num`)·§3.7(칩)·§3.10(버튼)·
  §2.4(테두리·그림자)·§2.1(초록 `#d8f0c4`/`#eaf8f2`, 빨강 계열은 팔레트 내 `--salmon #f7bfb2` 등)으로 매핑.
- PREVIOUSLY 카드 정체성(보라 `#d6c4f5`)을 잇도록 번호 배지 배경은 `#d6c4f5`.

## 9. 자문 — 이 spec 만으로 design-agent / builder-agent 작업 가능한가?

- 항목 텍스트·정답 배열·초기 뒤섞임·정답 키(슬롯별)·4종 피드백 문구: **모두 확정**. ✅
- 모든 칩/슬롯/버튼/결과의 유일 `aria-label`·`data-*`: **표로 명시**. ✅
- 엔진 부재 근거와 요구 동작 9가지(마우스/터치/키보드/채점/리셋/초기/재마운트/zoom/접근성): **명시**. ✅
- 진행률·자동저장·PDF·인쇄·안티치트 통합 주의: data4 실태 기준으로 **항목별 정리**. ✅
- 남는 판단(빌더 재량): 상태 보관(state vs DOM-only) 최종 선택, 채점색의 정확한 hex,
  칩 스왑 vs 되돌림 정책 — 어느 쪽이든 §4·§5 계약을 지키면 됨. 명시해 둠.
