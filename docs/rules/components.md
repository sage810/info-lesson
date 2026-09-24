# 신현중학교 컴퓨터실 활동지 — 활동 유형 가이드 (AI 에이전트용)

> 📌 **구조 개편(2026-09-24) 전에 쓴 문서입니다.** 본문 속 `output/dataN.html`·`data4_1.html` 같은 이름은 지금의 `lessons/<단원>/<차시>/lesson.html` 에 해당하고, 폰트·라이브러리·이미지는 빌드 때 자동으로 인라인됩니다(`npm run build`). 여기 적힌 **디자인·동작 규칙**은 그대로 유효합니다.


이 문서는 새로운 학습 활동을 추가하려는 AI 에이전트를 위한 기술 참고 문서입니다. 사람이 아니라 다른 AI가 이 파일을 이어받아 작업할 것을 가정하고, 코드 패턴·클래스 이름·주의사항을 구체적으로 적었습니다.

## 0. 파일 구조와 전제 조건

- **단일 파일(self-contained) HTML.** `<style>` 전체가 `<head>` 안 한 블록, `<script>` 전체가 `</body>` 직전 한 블록입니다. 이 파일은 구글 사이트(Google Sites)의 "삽입할 코드" 임베드 박스에 통째로 붙여넣기 때문에, 외부 CSS/JS 파일 분리나 상대경로 참조를 쓸 수 없습니다.
- **이미지는 반드시 base64 data URI로 삽입**합니다 (`<img src="data:image/png;base64,...">`). 외부 이미지 호스팅에 의존하면 안 됩니다.

## 1. 이미 구현되어 있는 활동 유형 (그대로 재사용 가능)

### 1-1. 빈칸 채우기 (텍스트 입력)
```html
<textarea class="blank blank--autogrow" rows="1" aria-label="고유한-식별자" placeholder="빈칸"></textarea>
```
- 한 줄 답이면 `blank--autogrow`를 붙여 입력한 글자 길이에 맞춰 가로·세로가 자동으로 늘어나게 합니다 (이 파일의 최신 관례 — 모든 빈칸은 이 방식을 씁니다). `<input>`이 아니라 `<textarea rows="1">`을 씁니다.
- 여러 줄 서술형이면 `blank`만 붙이고 `blank--autogrow`는 생략 — 세로로만 자동으로 늘어납니다.
- `aria-label`은 페이지 전체에서 유일해야 합니다. 자동저장(`saveDraft`/`loadDraft`)과 진행률 계산이 이 속성으로 칸을 식별하기 때문입니다. **이 속성이 없으면 자동저장·진행률에서 아예 빠집니다.**
- 정답이 정해진 빈칸이 아니라 학번/번호/이름 같은 식별 칸은 `.id-fields` 안의 `input.blank`를 그대로 씁니다 (기존 패턴, 진행률 계산에서는 제외되도록 이미 별도 처리됨).

#### 1-1-a. 자동 확장 동작 (넘치는 텍스트가 다 보이게)

`#tab-worksheet`의 **모든 답 빈칸은 `<textarea class="blank">`** 입니다. 과거엔 `<input type="text" class="blank" style="width:90px">` 같은 고정폭 칸이 섞여 있었으나(흐름도·의사결정·판단의열쇠·표 안 빈칸 등), `<input>`은 줄바꿈이 불가능해 긴 답이 잘리므로 **전부 `<textarea class="blank blank--autogrow" rows="1">`로 변환**했습니다. 예외는 `.id-fields`의 반·번호·이름 3개뿐(짧은 식별자라 `input.blank` 유지).

관련 JS 함수(이미 구현되어 있음, 새로 짤 필요 없음):

| 함수 | 역할 |
|---|---|
| `autoGrowTextarea(el)` | 높이만: `height:auto`로 비웠다가 `el.scrollHeight + 테두리` 로 재설정. `blank--autogrow`가 **아닌** 여러 줄 답란용. |
| `autoSizeGrowBlank(el)` | 가로→세로: 화면 밖 mirror `<span>`에 같은 글꼴로 값을 넣어 필요한 px를 재고 `el.style.width`를 그만큼 지정. **최대 폭**은 표 안이면 `el.closest('.table-scroll').clientWidth − 첫 칸 폭 − 40`, 표 밖(문장 속)이면 `el.parentElement.clientWidth`. 폭이 최대에 닿으면 그 뒤론 줄바꿈되며 `autoGrowTextarea(el)`로 높이가 늘어남. 측정 실패(탭 비표시) 시 폴백 520px. `blank--autogrow` 전용. |
| `sizeWorksheetTextarea(el)` | 위 둘 중 선택: `el.classList.contains('blank--autogrow')` 면 `autoSizeGrowBlank`, 아니면 `autoGrowTextarea`. |

배선(변환 시 코드 수정 불필요 — 기존 셀렉터가 전부 커버):
- 입력 리스너: `worksheetInputs()`(`#tab-worksheet input[aria-label], textarea[aria-label]`) 에 `input` 이벤트 → `if (el.tagName === 'TEXTAREA') sizeWorksheetTextarea(el)`.
- 초기 크기 + 탭 열 때 재계산: `worksheetTextareas`(`#tab-worksheet textarea.blank` 스냅샷)을 페이지 로드 후, 그리고 `[수정 43-2]` 에서 `tab-worksheet` 탭이 실제로 보이게 될 때마다 `forEach(sizeWorksheetTextarea)`. (탭이 `display:none`일 땐 폭이 0으로 잡혀 잘못 계산되므로 탭 표시 직후 반드시 다시 계산.)
- 붙여넣기/드래그 차단, 진행률(`.section-block textarea.blank`), 타이핑 속도 가드 — 셀렉터가 이미 `textarea.blank`를 포함하므로 변환분도 자동 적용.
- CSS: `textarea.blank.blank--autogrow{ display:inline-block; width:auto; min-width:90px; max-width:100%; vertical-align:middle }`, `.wide`면 `min-width:160px`, 표(td) 안이면 `display:block`.
- **표 안 빈칸을 쓸 때는 반드시 `.table-scroll` 래퍼 유지** — `autoSizeGrowBlank`의 최대 폭 계산 기준이라 없으면 칸이 무한정 늘어남(1-7 참고).

#### 1-1-b. PDF 저장 시 빈칸 처리 (`buildPrintableClone()`)

"학습지 PDF로 저장하기"(`#saveBtn`, html2canvas + jsPDF)는 `buildPrintableClone()`이 `#tab-worksheet .sheet`를 복제한 뒤, **각 `textarea.blank`를 `<div class="pdf-answer-block">`로 바꿔치기**합니다(html2canvas가 textarea 줄바꿈을 정확히 못 그려서). 값은 원본 live 요소의 `.value`(aria-label로 조회). `[수정 43-3]`에서 이 치환을 **문맥에 맞게** 분기:

- `inlineMode = liveEl.classList.contains('blank--autogrow') && !el.closest('td')` (문장 속 인라인 빈칸):
  `display:inline-block; vertical-align:middle; width:<Math.ceil(liveEl.getBoundingClientRect().width)>px; max-width:100%; min-width:<liveEl minWidth>px` — **화면에서 늘어난 폭 그대로** → 같은 자리에서 같은 방식으로 줄바꿈되고 뒤 문장("분명히 정한다." 등)이 이어짐. `rect.width`가 0이면 폴백 220px.
- 그 외(표 td 안 / `blank--autogrow` 아닌 큰 답란): 기존대로 `display:block; width:100%; margin-top:4px`.
- 공통: `min-height:38px; height:auto`(**고정 height 금지**) + `white-space:pre-wrap; overflow-wrap:break-word; word-break:break-word` → 세로로 얼마든 늘어나고 한 글자도 안 잘림. 빈 값이면 작은 빈 상자.
- 치환 뒤 **복제본에서만**(화면 원본 불변) 세로 클리핑 해제: `clone.querySelectorAll('.flow-fill, .fill-line')` → `overflow:visible; height:auto; maxHeight:none`, `clone.querySelectorAll('table.sheet-table--fit td')` → `height:auto`(`height:1px` 트릭 무력화).

> 새로 만드는 빈칸이 `textarea.blank`(+필요시 `blank--autogrow`) 패턴을 그대로 쓰면 위 PDF 처리가 자동 적용됩니다. 완전히 새로운 입력 클래스를 만들면 `buildPrintableClone()`에 그 클래스의 치환/스타일을 추가해야 합니다(2장 4번).

### 1-2. 객관식 카드 퀴즈 (자동 채점, 단일 정답)
```html
<div class="mc-quiz-item">
  <p>질문 문장</p>
  <div class="choice-card-row">
    <button type="button" class="choice-card" data-item="고유값-1" data-group="문제그룹명">① 보기1</button>
    <button type="button" class="choice-card" data-item="고유값-2" data-group="문제그룹명" data-correct="true">② 보기2</button>
    <button type="button" class="choice-card" data-item="고유값-3" data-group="문제그룹명">③ 보기3</button>
  </div>
  <p class="mc-feedback"></p>
</div>
```
- `.mc-quiz-item`으로 감싸야 클릭 즉시 자동 채점(정답/오답 표시, `.mc-feedback` 문구)이 동작합니다.
- 같은 `data-group` 값을 가진 카드끼리는 하나만 선택되도록 자동 처리됩니다(라디오 버튼처럼 동작).
- 정답 카드에만 `data-correct="true"`를 붙입니다. 보기가 여러 개여도 정답은 하나만 표시하세요 (현재 코드는 단일 정답 기준으로 채점).
- `data-item` 값은 페이지 전체에서 유일해야 합니다 (자동저장의 선택 상태 키).

#### 1-2-a. 오답별 맞춤 피드백 (오답 클릭 시 내용 관련 피드백) — data5_2.html 형성평가, 2026-09-10

**문제**: 오답을 눌러도 "❌ 다시 생각해 봐요. 정답은 ○○예요." 처럼 **모든 오답에 똑같은 일반 문구**만 나오면,
학생은 자기가 왜 틀렸는지, 자기가 고른 보기가 어떤 상황에 맞는 건지 알 수 없다.

**해결**: 고른 오답 보기별로 **"그 보기는 언제 쓰는 것" + "이 문제는 실제로 무엇을 묻는지"**를 짚어 주는
문구를 따로 준비해, 선택한 보기에 해당하는 문구를 피드백으로 보여준다. (정답을 그냥 알려 주는 대신
판단 기준을 다시 세워 준다.)

- **`.choice-card`(속성 기반) 방식**: 오답 카드마다 `data-feedback="..."` 속성을 달고, 채점 로직에서
  `선택된카드.dataset.feedback` 을 `.mc-feedback` 에 넣는다. 정답 카드의 `data-feedback` 에는 "왜 정답인지"를 쓴다.
  값이 없는 카드는 기존 일반 문구로 폴백.
- **`fqItems`/`renderVals`(data5 계열 React dc-runtime) 방식**: 각 문항 객체에 오답 보기 → 문구 맵을 추가한다.
  ```js
  const FQ = [
    {
      t: '우리 반 친구들이 좋아하는 계절은 봄·여름·가을·겨울 각각 몇 %일까?', a: '구성',
      why: "'몇 %'를 묻고 있으니 … 구성 분석이에요.",          // 정답 클릭 시
      no: {                                                    // 오답 보기값 → 맞춤 문구
        '비교': "'비교'는 서로 다른 두 그룹을 콕 집어 '어느 쪽이 더 큰지' 견줄 때 써요. 이 질문은 계절 4개가 전체에서 각각 몇 %인지 비율을 묻고 있어요."
      }
    }, …
  ];
  // 피드백 계산: 오답이면 no[pick] 을 앞에 붙이고, 없으면 일반 문구로 폴백
  fb: !pick ? '' : (right
    ? '⭕ 정답이에요. ' + q.why
    : '❌ ' + ((q.no && q.no[pick]) ? q.no[pick] + ' → ' : '') + '정답은 ' + q.a + ' 분석이에요.'),
  ```
  - `pick` 이 없거나(`no` 에 그 보기가 없으면) 자동으로 `❌ … 정답은 ○○예요.` 일반 문구로 떨어진다 → 모든 보기를 다 채우지 않아도 안전.
  - `no` 는 **오답 보기별로 1개씩만** 있으면 된다(정답 보기는 `why` 가 담당).

**문구 작성 팁**: ① 학생이 고른 보기가 *맞는* 상황을 한 줄로("'비교'는 ~할 때"), ② 이 문제가 *실제로* 묻는 것을 한 줄로("이 질문은 ~를 묻고 있어요"). 정답 단어만 통보하지 말 것.

### 1-3. OX 퀴즈 (여러 문항 묶음 채점)
```html
<div class="ox-quiz-item" data-ox-answer="O">
  <p>문항 문장</p>
  <div class="choice-card-row">
    <button type="button" class="choice-card choice-card--ox" data-group="퀴즈그룹-1" data-item="퀴즈그룹-1-O" data-value="O">O</button>
    <button type="button" class="choice-card choice-card--ox" data-group="퀴즈그룹-1" data-item="퀴즈그룹-1-X" data-value="X">X</button>
  </div>
</div>
...
<button type="button" class="ox-check-btn">✅ 정답 확인</button>
<button type="button" class="ox-reset-btn">❎ 다시 풀기</button>
<span id="oxResultXXX"></span>
```
- `data-ox-answer`는 "O" 또는 "X". `ox-check-btn`을 누르면 그 순간 선택된 답과 비교해 문항 상자 전체를 초록(정답)/빨강(오답)으로 칠하고 `✅`/`❌` 표시를 붙입니다.
- `ox-check-btn`/`ox-reset-btn`은 `data-result-id`로 결과 요약을 표시할 `<span id="...">`를 가리킵니다. 채점은 "누르는 순간"에만 일어나는 일괄 채점이며, 실시간 채점이 아닙니다.
- 주의: 현재 코드의 `ox-check-btn`/`ox-reset-btn` 핸들러는 페이지에 있는 **모든** `.ox-quiz-item`을 한꺼번에 채점/초기화합니다(그룹별 분리 기능 없음). 한 페이지에 서로 다른 OX 퀴즈 묶음을 두 개 이상 넣고 싶다면, 채점 함수에 그룹 필터링을 추가하는 수정이 필요합니다.

### 1-4. 드래그 짝짓기 (이미 완전히 구현되어 있음 — CSS/JS 전부 준비되어 있어 마크업만 추가하면 바로 동작합니다)
```html
<div class="dnd-tray" id="dndTray1">
  <span class="dnd-chip" data-value="칩A" data-answer-key="키A">이름표1</span>
  <span class="dnd-chip" data-value="칩B" data-answer-key="키B">이름표2</span>
</div>

<div class="dnd-row">
  <p>설명 문장 1</p>
  <div class="dnd-slot" data-slot="slot1" data-check-group="dndTray1" data-answer="키A"></div>
</div>
<div class="dnd-row">
  <p>설명 문장 2</p>
  <div class="dnd-slot" data-slot="slot2" data-check-group="dndTray1" data-answer="키B"></div>
</div>

<button type="button" class="dnd-check-btn" data-target-tray="dndTray1" data-result-id="dndResult1">✅ 정답 확인</button>
<button type="button" class="dnd-reset-btn" data-target-tray="dndTray1" data-result-id="dndResult1">🔄 다시 섞기</button>
<span id="dndResult1"></span>
```
- 마우스로는 드래그 앤 드롭, 터치/키보드 기기에서는 "칩 클릭(선택) → 칸 클릭(놓기)" 대체 방식이 이미 둘 다 구현되어 있습니다.
- `.dnd-tray`는 `id`가 필요합니다(칩이 "제자리"를 기억하는 기준). 한 페이지에 짝짓기 활동이 여러 개면 트레이 id를 서로 다르게 주면 각각 독립적으로 동작합니다.
- `.dnd-chip`의 `data-value`는 트레이 전체에서 유일해야 합니다. `data-answer-key`는 채점 시 정답 판정에 쓰는 값이고, 생략하면 `data-value`가 그대로 정답 키로 쓰입니다.
- `.dnd-slot`의 `data-slot`은 유일 식별자(자동저장용), `data-check-group`은 채점 버튼의 `data-target-tray`와 같은 값을 써서 "이 칸들을 함께 채점"하도록 묶습니다, `data-answer`는 이 칸에 들어와야 할 정답 키입니다.
- 이름표가 2개 이상인 줄을 가운데 정렬하고 싶으면 `.dnd-row`에 `.dnd-row--center`를 추가로 붙입니다. 줄이 많아 세로로 길어지면 `.dnd-grid-2col`로 감싸 2열 배치할 수 있습니다.
- 진행률 계산(`.dnd-slot`이 채워졌는지), 자동저장(`data.dnd`), PDF 인쇄(`buildPrintableClone`의 흑백 대비 스타일)까지 전부 이미 연결되어 있습니다. **즉, "드래그 짝짓기" 활동을 새로 넣을 때 JS를 새로 짤 필요가 없고, 위 마크업 패턴만 그대로 복사해서 문항 내용만 바꾸면 됩니다.**

### 1-5. 흐름도 (순서가 있는 단계 시각화, 읽기 전용)
```html
<div class="flow-diagram">
  <div class="flow-step"><span class="flow-num">1</span><p>단계 설명</p></div>
  <!-- 화살표는 CSS로 자동 처리 -->
</div>
```
- 클릭/입력 상호작용은 없고 순서를 보여주기만 하는 정적 컴포넌트입니다. `.flow-num`은 프로그램 실행 단계 이미지(예: "프로그램 들어가는 방법", "파일 저장하는 방법" 섹션)에서 번호 배지로도 재사용 중입니다.

### 1-6. 콜아웃 박스 (안내/팁/질문 강조)
```html
<div class="callout callout--goal">...</div>  <!-- 주황, 오늘의 목표용 -->
<div class="callout callout--tip">...</div>   <!-- 초록, 팁 -->
<div class="callout callout--gemini">...</div> <!-- 보라, 질문/설명 강조  -->
```

### 1-7. 표
```html
<div class="table-scroll">
  <table class="sheet-table">...</table>
</div>
```
- 가로로 넘칠 수 있는 표는 `.table-scroll`로 감싸 가로 스크롤이 생기게 합니다. `.blank--autogrow` 칸이 표 안에 있을 때 최대 너비 계산이 이 래퍼를 기준으로 하므로, 표 안 빈칸을 쓸 때는 반드시 이 래퍼를 유지하세요.

### 1-8. 표·데이터를 복사 못 하게 막기 (제공 자료 보호)

학생이 답을 유추할 근거가 되는 **제공 자료**(예: "○○ 판매량 TOP 10" 같은 데이터 표)를 드래그로 긁어 복사·붙여넣지 못하게 막는 패턴입니다. 표는 그대로 읽히고, 가로 스크롤도 유지됩니다. (`data4.html` ACTIVITY_5 "일본 만화 판매량 TOP 10" 표에 적용 — `docs/log/build.md` "만화 판매량 표 복사 방지" 절 참고.)

**CSS** (`<style>`에 한 번만):
```css
.no-copy{ user-select:none; -webkit-user-select:none; -ms-user-select:none; }
```

**마크업** — 보호할 컨테이너에 유일 `id` + `class="no-copy"`. `.table-scroll` 스크롤 래퍼에는 걸지 말고 그 **안쪽** 요소에 겁니다(스크롤·`pointer-events` 유지).
```html
<div class="table-scroll">
  <div id="mangaTable" class="no-copy"> …표… </div>
</div>
```
- `user-select:none`은 자식이 상속하므로 컨테이너 하나에만 걸면 됩니다.

**JS** — `user-select:none`만으로도 드래그 선택이 막히지만, `copy`/`cut`/우클릭 메뉴/드래그까지 확실히 막으려면 **`document`에 위임**하고 `closest('#id')`로 그 표에서 난 이벤트만 막습니다.
```js
['copy','cut','contextmenu','dragstart'].forEach(function (ev) {
  document.addEventListener(ev, function (e) {
    var n = e.target;
    if (n && n.closest && n.closest('#mangaTable')) e.preventDefault();
  }, true);
});
```
- **왜 위임인가**: 요소가 탭 전환 시점에야 렌더되는 구조(예: `data4.html`의 `<sc-if>`)에서는 초기화 때 `getElementById`가 `null`입니다. 이 파일(`data3.html`)은 요소가 항상 DOM에 있어 직접 `getElementById(...).addEventListener`도 되지만, 위임이 마운트 타이밍에 안전하고 표를 여러 개로 늘릴 때도 그대로 확장됩니다.
- `#tab-worksheet input.blank`의 붙여넣기 차단(§2-2)과 **별개**입니다: 그건 "입력칸에 못 붙여넣게", 이건 "제공 자료를 못 복사하게".
- 표 **밖**(다른 입력칸·본문)의 복사는 정상 동작해야 합니다 — `closest` 조건으로 한정하므로 부작용 없음.

**검증**: `getComputedStyle(el).userSelect === 'none'`, 표 셀에서 `copy`/`cut`/`contextmenu`/`dragstart` 이벤트를 dispatch 했을 때 `e.defaultPrevented === true`, 표 밖 요소에서는 `false`. `.table-scroll` 이 좁은 뷰포트에서 여전히 가로 스크롤되는지도 확인.

### 1-9. 이미지 붙여넣기 칸 (CODAP 그래프 등 캡처 붙여넣기)

학생이 화면 캡처(Win+Shift+S)한 그래프를 활동지 안에 직접 붙여넣는 칸입니다. `output/data5.html`(데이터 시각화)의
"📷 여기에 CODAP 그래프를 붙여넣으세요" 칸에 적용. **상태는 DOM-only**(칸 안 `<img>` 1장) — `Component.state` 에 넣지 않습니다.

**마크업** — 칸 + 조작 버튼 묶음(둘은 형제):
```html
<div class="ans-lbl">📷 여기에 CODAP 그래프를 붙여넣으세요</div>
<div class="paste-zone" data-zone="유일값" role="button" tabindex="0" aria-label="… 그래프 붙여넣기 칸">
  <div class="paste-empty"><span class="pz-caret" aria-hidden="true"></span>📷 이 칸을 <span class="kbd">클릭</span>한 뒤 <span class="kbd">Ctrl + V</span> 로 …<br><span class="sm">(그림 파일을 끌어다 놓아도 돼요 · 지우기: 🗑 버튼 또는 Delete)</span></div>
</div>
<div class="pz-controls">
  <button type="button" class="pz-clear">🗑 지우기</button>   <!-- 📋 복사 버튼은 data5_1/5_2 에서 제거됨 -->
</div>
```

**조작 버튼 줄(`.pz-controls`) 레이아웃** — 붙여넣기 칸 **바로 아래에서 가운데 정렬**한다(버튼이 1개든 여러 개든 칸 중앙 밑에 오게):
```css
.pz-controls { display: flex; justify-content: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
@media print { .pz-controls { display: none !important; } }   /* 인쇄·PDF 결과물엔 안 나옴 */
```
- 같은 패턴을 **다른 컴포넌트의 "칸 + 아래 조작 버튼 줄" 조합**(예: 그리기 영역 지우기, 표 초기화 버튼 등)에도 그대로 쓴다 — 조작 버튼 줄은 그 컴포넌트 폭 안에서 `justify-content:center` 로 가운데.
- 버튼 자체 스타일은 §3.10(design.md) primary/secondary 버튼을 재사용하고, 이 줄은 **정렬만** 담당.

**동작** (`</body>` 앞 vanilla IIFE 하나, `document` 위임):
- **붙여넣기**: `paste` 이벤트에서 `document.activeElement.closest('.paste-zone')` 또는 마지막으로 누른 칸(`lastZone`, `mousedown`/`focusin` 으로 기록)을 대상으로, `clipboardData.items`/`files` 에서 `type` 이 `image/*` 인 것을 `FileReader.readAsDataURL` → `<img>` 로 삽입, `.is-filled` 부여. 이미 그림이 있으면 교체.
- **드래그&드롭**: `dragover` `preventDefault` + `.is-over`, `drop` 에서 `dataTransfer.files[0]` 를 같은 경로로 처리.
- **삭제**: `.pz-clear` 클릭 → **`btn.parentElement(.pz-controls).previousElementSibling`** 로 같은 렌더 복제본의 칸을 찾아 비운다(전역 `document.querySelector('[data-zone=…]')` 는 `<x-dc>` 의 **숨은 raw 템플릿 복제본**을 먼저 잡아 화면 칸이 안 지워짐 — §1-9 주의). 칸에 포커스가 있을 때 `Delete`/`Backspace` 로도 삭제.
- **복사**: `.pz-copy` 클릭 → 저장해 둔 dataURL(`zone._imgData`)을 `Blob` 으로 바꿔 `navigator.clipboard.write([new ClipboardItem({'image/png': blob})])`. 실패(비보안 컨텍스트 등)하면 "그림 우클릭 → 복사" 안내로 폴백.

**커서(캐럿) 보이기** — 학생이 "여기를 눌러 Ctrl+V 하면 되는구나"를 알도록, 칸을 텍스트 입력칸처럼 보이게 한다:
- CSS: `.paste-zone{cursor:text}` (마우스 I-beam), `.paste-zone:focus{border-style:solid;border-color:#4b3b6b;background:#fff;box-shadow:inset 0 0 0 3px #ee9dbf}` (강한 포커스 링).
- 깜빡이는 캐럿: `.pz-caret{display:none}` → `.paste-zone:focus:not(.is-filled) .pz-caret{display:inline-block;width:2px;height:1.15em;background:#4b3b6b;animation:pzblink 1s step-end infinite}`,
  `@keyframes pzblink{50%{opacity:0}}`, `@media (prefers-reduced-motion:reduce){.pz-caret{animation:none!important}}`.
- 칸은 `tabindex="0"` 라 클릭·Tab 으로 포커스를 받는다. 그림이 들어가면(`.is-filled`) 캐럿·`cursor:text` 는 사라진다.

**통합 주의**:
- **진행률**: `updateProgress`/`sheetChecklist` 계산 대상 아님(§2-3). 넣으려면 붙여넣기/삭제 시 `Component.state` 에 플래그를 write 하고 체크리스트에 원소 추가.
- **자동저장**: 이미지가 커서 localStorage 부적합 — 저장 안 함(칸은 세션 동안만 유지).
- **PDF (`savePdf` / html2canvas)**: 칸 안 `<img>`(dataURL)는 그대로 캡처된다. **조작 버튼은 결과물에서 숨긴다** — `savePdf` 복제본 처리에서 `clone.querySelectorAll('.seq-tray, .ca-tray, .pz-controls')` 를 `display:none`.
- **인쇄(`@media print`)**: `.pz-controls{display:none!important}`, `.paste-zone{border:2px solid #4b3b6b;background:#fff;min-height:150px}`.
- **안티치트**: `.paste-zone` 은 `<div>` 라 `input.blank`/`textarea.blank` 스코프의 붙여넣기 차단·타이핑 가드와 무관. 전역 `paste` `preventDefault` 는 없어야 한다(있으면 이미지 붙여넣기가 막힘).

**검증**: 칸 클릭 → 강한 테두리 + 깜빡이는 세로 막대(캐럿). Ctrl+V(또는 그림 드래그) → `<img>` 표시·`.is-filled`. 🗑/Delete → 원상복귀. 📋 → 클립보드에 이미지. "PDF로 저장하기" 결과에 그림 포함, 버튼은 미포함.

## 2. 새 활동을 추가할 때 반드시 지켜야 하는 공통 규칙

1. **모든 입력형 요소(input/textarea)에 `aria-label` 유일값 부여.** 자동저장·불러오기·타이핑 속도 감지(부정행위 방지)가 전부 이 속성 기준으로 동작합니다.
2. **붙여넣기 방지·타이핑 속도 감지(안티치트)가 이미 걸려 있음.** `input.blank`/`textarea.blank` 클래스가 붙은 요소는 자동으로 붙여넣기(Ctrl+V, 드래그 텍스트 놓기)가 막히고, 2초 동안 분당 800자를 넘는 속도로 값이 바뀌면 직전 값으로 되돌아갑니다. **이 페이지를 Playwright 등으로 자동 채우기 테스트할 때는 반드시 `locator.pressSequentially(text, {delay: 65~70})`처럼 사람 타이핑 속도로 입력해야 합니다. `.fill()`이나 짧은 delay(예: 25ms)를 쓰면 안티치트가 입력값을 조용히 되돌려서 값이 깨집니다.**
3. **진행률(`updateProgress()`) 계산 대상은 정확히 3종류뿐입니다**: `#tab-worksheet .section-block` 안의 `input.blank`/`textarea.blank`, `.ox-input`(현재 파일엔 실사용 안 됨, 구형 패턴), `.dnd-slot`. 객관식 카드(`.choice-card`)는 정답 개수가 정해져 있지 않다는 이유로 진행률 계산에서 의도적으로 제외되어 있습니다. 새 활동 유형을 진행률에 포함시키고 싶으면 `updateProgress()` 함수 자체를 수정해야 합니다.
4. **PDF 인쇄(html2canvas 경로, `buildPrintableClone()`)는 컴포넌트별로 흑백 대비용 스타일을 하드코딩**해서 적용합니다(예: `.dnd-slot`, `.mc-quiz-item`, `.callout` 등). 완전히 새로운 클래스로 활동을 만들면 이 함수에도 해당 클래스의 인쇄용 스타일 처리를 추가해야, "PDF로 저장하기" 버튼을 눌렀을 때 새 활동이 깨지지 않고 보기 좋게 나옵니다. 반대로 기존 클래스(1장에 정리한 것들)를 그대로 재사용하면 이 작업이 필요 없습니다.
5. **네이티브 인쇄(`@media print` CSS, Ctrl+P/Playwright `page.pdf()` 경로)에는 `break-inside:avoid` 규칙이 없습니다.** 이 경로로 PDF를 뽑는 스크립트를 짤 때는 `.flow-diagram, .callout, .table-scroll, .mc-quiz-item, .ox-quiz-item, .dnd-row, .choice-card-row` 등에 `break-inside:avoid`를 임시로 주입(`page.addStyleTag()`)해서 요소가 페이지 경계에서 잘리지 않게 하세요. 실제 배포 파일 자체는 건드리지 않는 것이 지금까지의 관례입니다.
6. **미션 색상 테마**: `.section-block.mission-color-1/2/3/...` 클래스로 미션마다 헤더 색이 자동 지정됩니다(`h3` 배경색). 새 미션을 추가하면 `mission-color-N`을 이어서 쓰고, 필요하면 CSS에 해당 번호의 색상 규칙을 추가합니다.
7. **한 파일 안에서 검증**: 수정 후에는 (a) `<script>...</script>` 블록만 추출해 JS 문법 검사, (b) `<div>`/`</div>` 개수 등 태그 균형 확인(단, 이 파일은 JS 문자열 안에 `<div`가 섞여 있어 순수 카운트만으로는 100% 정확하지 않을 수 있음 — 기존 파일 대비 "델타"로 비교), (c) Playwright로 실제 렌더링 스크린샷을 찍어 육안 확인하는 3단계를 거치는 것이 이 프로젝트의 기존 관례입니다.
8. **형성평가·객관식 퀴즈의 오답 피드백은 "왜 그게 오답인지"를 보기별로 적는다.** 클릭 즉시 채점되는 퀴즈(형성평가 4지선다, `.mc-quiz-item`, OX 등)에서 학생이 오답을 골랐을 때 `❌ 다시 생각해 봐요. 정답은 ○○이에요.` 처럼 정답만 알려 주고 끝내지 않는다. **학생이 실제로 클릭한 보기**를 기준으로, 그 보기가 왜 이 문제의 답이 아닌지(그 분석/개념의 정의는 무엇이고, 이 질문은 그것과 어떻게 다른지)를 한 문장으로 붙인 뒤 정답을 알려 준다.
   - 데이터 구조: 문항마다 정답 해설 `why` 와 **오답 보기별 해설 맵** `w: { '비교': '…', '분포': '…', '관계': '…' }`(정답이 아닌 보기 전부)를 함께 둔다. 피드백 조립은 `right ? '⭕ 정답이에요. ' + q.why : '❌ ' + (q.w && q.w[pick] ? q.w[pick] + ' ' : '') + '정답은 ' + q.a + '이에요.'` 형태. `pick`(학생이 고른 값)이 `q.w`의 키와 같은 형식이어야 한다.
   - 해설 문구는 원본 학습 자료의 정의를 근거로 쓰고(추측 금지, §4-3과 동일 원칙), "이 개념은 ~를 본다 → 그런데 이 질문은 ~를 묻는다"의 대비 구조로 쓴다. 정답 문자열 자체를 학생 지면 다른 곳에 노출하지 않는다.

## 3. 아직 구현되어 있지 않지만 이 구조 위에 자연스럽게 추가할 수 있는 활동 유형 아이디어

아래는 기존 컴포넌트(위 1장)를 최대한 재사용하면서 만들 수 있는, 아직 없는 활동 유형입니다.
카테고리별로 묶었고, 각 항목에 간단한 예시를 붙였습니다. 실제로 만들 때는 4장 체크리스트를 따릅니다.

### 3.1 텍스트/입력 기반

**복수 정답 빈칸** — 여러 문자열 중 하나만 맞으면 정답 처리 (예: "사과"와 "apple" 둘 다 인정).
```html
<textarea class="blank blank--autogrow" data-accept="사과,apple,APPLE" aria-label="q1"></textarea>
```
채점 시 `data-accept`를 쉼표로 나눠 그 중 하나와 일치하는지 비교하도록 채점 함수만 살짝 손보면 됩니다.

**순서 있는 빈칸(클로즈 테스트)** — 문장 하나에 빈칸 여러 개, 전부 채워야 그 문항이 완료된 것으로 침.
```html
<p class="fill-line">데이터 분석의 첫 단계는
  <textarea class="blank blank--autogrow" aria-label="cloze1"></textarea> 이고,
  두 번째는 <textarea class="blank blank--autogrow" aria-label="cloze2"></textarea> 입니다.</p>
```
기존 `.fill-line` + `textarea.blank` 패턴 그대로, 한 문장 안에 여러 개만 넣으면 됩니다.

**자유 서술형 + 글자 수 표시** — 서술형 답 밑에 "지금 87자 작성" 같은 카운터.
```html
<textarea class="blank" aria-label="essay1" data-count-target="essay1-count"></textarea>
<span id="essay1-count" class="char-count">0자</span>
```
`input` 이벤트에서 `el.value.length`를 세어 대상 span에 써주는 짧은 리스너 하나만 추가.

### 3.2 선택/클릭 기반

**복수선택 체크박스 퀴즈** — "해당하는 것 모두 고르세요"처럼 정답이 여럿인 문제.
```html
<div class="mc-quiz-item mc-quiz-item--multi">
  <p>다음 중 개인정보인 것을 모두 고르세요.</p>
  <div class="choice-card-row">
    <button class="choice-card" data-item="p1" data-group="g1" data-correct="true">① 이름</button>
    <button class="choice-card" data-item="p2" data-group="g1">② 좋아하는 색</button>
    <button class="choice-card" data-item="p3" data-group="g1" data-correct="true">③ 전화번호</button>
  </div>
</div>
```
기존 `.mc-quiz-item`은 "한 개만 선택"이 전제라, `data-correct="true"`가 여러 개인 그룹에서는
클릭할 때마다 선택을 토글(라디오 대신 체크박스처럼)하고 "확인" 버튼을 눌렀을 때 한꺼번에
채점하는 로직이 새로 필요합니다.

**이미지 핫스팟 클릭** — 캡처 이미지 위에 투명 버튼을 좌표로 겹쳐 "여기를 클릭하세요"형 문제.
```html
<div class="hotspot-wrap" style="position:relative">
  <img src="data:image/png;base64,..." style="width:100%">
  <button class="choice-card hotspot" data-item="save-icon" data-group="hs1" data-correct="true"
          style="position:absolute; left:62%; top:18%; width:40px; height:40px; opacity:0"></button>
</div>
```
1-2 객관식 채점 패턴을 그대로 재사용, 버튼만 이미지 위에 투명하게 겹쳐 놓습니다.

**클릭해서 펼치기(아코디언/스포일러)** — 힌트·해설을 눌러야 보이게.
```html
<button class="reveal-toggle" data-target="hint1">💡 힌트 보기</button>
<div id="hint1" class="reveal-body" hidden>이 활동에서는 표의 '행'과 '열'을 먼저 구분해보세요.</div>
```
클릭 시 `hidden` 속성만 토글하는 짧은 JS.

**순차 클릭 스테퍼** — 카드 한 장씩 "다음" 버튼으로 넘기며 진행하는 설명형 활동.
```html
<div class="stepper" data-step="0">
  <div class="stepper-panel">1단계: 문제 정하기 — ...</div>
  <div class="stepper-panel" hidden>2단계: 데이터 모으기 — ...</div>
  <button class="stepper-next">다음 →</button>
</div>
```

**토글 스위치형 판단 문제** — OX 대신 스위치를 켜고 끄듯 판단하게 하는 시각적 변형.
```html
<label class="toggle-quiz" data-answer="true">
  <input type="checkbox" class="toggle-input">
  <span class="toggle-track"></span> 이 문장은 사실이다
</label>
```

### 3.3 드래그 기반 (1-4 짝짓기 엔진 응용)

**순서 배열(시퀀싱) 드래그** — 슬롯을 "①②③④" 순서 칸으로 만들고, 칩에 뒤섞인 단계를 담아 올바른
순서로 놓게 합니다. `data4`의 "데이터 분석 4단계" 활동에서 이미 만들어 쓰신 방식입니다.
```html
<div class="dnd-tray" id="seqTray1">
  <span class="dnd-chip" data-value="step3" data-answer-key="step3">데이터 분석하기</span>
  <span class="dnd-chip" data-value="step1" data-answer-key="step1">문제 정하기</span>
</div>
<div class="dnd-slot" data-slot="seqSlot1" data-check-group="seqTray1" data-answer="step1"></div>
```

**분류하기(카테고리 나누기)** — 트레이 하나에 여러 항목 칩을 두고, 슬롯 대신 "구체적인 질문" /
"모호한 질문" 같은 카테고리 상자 2~3개에 여러 칩을 나눠 담게 합니다.
```html
<div class="dnd-category" data-category="specific" data-check-group="catTray1"></div>
<div class="dnd-category" data-category="vague" data-check-group="catTray1"></div>
```
현재 `placeChipInSlot`은 칸 하나에 칩 하나만 들어가도록 되어 있어, 카테고리당 여러 개를
담으려면 "칸이 여러 칩을 품을 수 있도록" 로직을 살짝 수정해야 합니다(부분 수정 필요).

**크기순/순위 정렬** — 숫자·데이터 카드를 드래그로 크고 작은 순서로 줄 세우기. 데이터 분석
수업에서 "가장 판매량이 많은 순서로 배열해보세요" 같은 문제에 잘 맞습니다. 순서 배열
드래그와 구조가 같고, 칩 문구만 숫자/데이터로 바뀝니다.

**타임라인에 배치하기** — 가로 시간축 위에 사건 카드를 드래그로 놓기.
```html
<div class="timeline-track" data-check-group="tlTray1">
  <div class="timeline-slot" data-slot="tl1" data-answer="event-a"></div>
  <div class="timeline-slot" data-slot="tl2" data-answer="event-b"></div>
</div>
```
가로 배치 CSS만 다르고 채점 로직은 순서 배열 드래그와 동일합니다.

**이미지 라벨링** — 다이어그램 이미지 위에 이름표를 드래그로 붙여 부품 이름 맞추기.
```html
<div style="position:relative">
  <img src="data:image/png;base64,..." style="width:100%">
  <div class="dnd-slot dnd-slot--overlay" data-slot="lbl1" data-answer="cpu"
       style="position:absolute; left:40%; top:30%"></div>
</div>
```

**블록 조립(엔트리 스타일)** — 엔트리 블록처럼 생긴 조각을 순서대로 드래그해 "코드"를
완성합니다. 엔트리·순서도 수업에 특화된 아이디어입니다.
```html
<div class="dnd-tray" id="blockTray1">
  <span class="dnd-chip dnd-chip--block" data-value="b1" data-answer-key="move">10만큼 움직이기</span>
  <span class="dnd-chip dnd-chip--block" data-value="b2" data-answer-key="wait">1초 기다리기</span>
</div>
<div class="block-stack" data-check-group="blockTray1">
  <div class="dnd-slot" data-slot="bs1" data-answer="move"></div>
  <div class="dnd-slot" data-slot="bs2" data-answer="wait"></div>
</div>
```
구조는 순서 배열 드래그와 같고, 칩 모양을 엔트리 블록처럼 CSS로 꾸미면 됩니다. 새 엔진은
필요 없고 스타일만 새로 필요합니다.

### 3.4 캔버스/그리기 기반 (이미 쓰시는 캔버스 드로잉 응용)

**이미지 위에 형광펜 표시** — 캡처 이미지에서 중요한 부분을 색칠하듯 표시.
```html
<canvas class="mark-canvas" data-bg="data:image/png;base64,..." width="600" height="400"></canvas>
```
기존 캔버스 드로잉 컴포넌트와 동일한 구조, 배경 이미지 위에 반투명 색으로 그리게 하면 됩니다.

**SVG 영역 클릭 색칠** — 지도나 다이어그램의 특정 영역을 클릭하면 색이 채워짐. 데이터 시각화
강조나 순서도 단계 강조에 씁니다.
```html
<svg viewBox="0 0 400 300">
  <path class="region" data-region="step1" onclick="toggleFill(this)" d="M10 10 L100 10 L100 100 Z"/>
</svg>
```

**좌표에 점 찍기** — 빈 좌표평면(캔버스)을 클릭해서 산점도 데이터 점을 직접 찍어보기. 데이터
분석 수업에 좋습니다.
```html
<canvas class="scatter-canvas" width="500" height="400" data-axis-x="0,10" data-axis-y="0,10"></canvas>
```
클릭 좌표를 축 값으로 환산해 점을 찍고 `state`에 좌표 배열로 저장.

**5×5 격자 클릭 토글(마이크로비트 LED 패턴)** — 칸을 클릭하면 켜짐/꺼짐 전환. 마이크로비트
LED 매트릭스 패턴 학습에 딱 맞고 구현도 쉽습니다.
```html
<div class="led-grid" data-size="5" data-answer="0,4,8,12,16">
  <!-- 5x5 = 25개 버튼을 JS로 자동 생성, 클릭 시 .lit 토글 -->
</div>
```

### 3.5 미디어 기반

**좌우 비교 슬라이더(before/after)** — 가운데 막대를 드래그하면 왼쪽/오른쪽 이미지가 겹쳐
보임. 원본 사진 vs AI 생성 이미지 비교(디지털윤리·AI기초)에 잘 맞습니다.
```html
<div class="compare-slider">
  <img class="compare-before" src="data:image/png;base64,...">
  <img class="compare-after" src="data:image/png;base64,...">
  <input type="range" class="compare-handle" min="0" max="100" value="50">
</div>
```
`input` 값에 따라 after 이미지의 `clip-path` 폭을 조절.

**카드 뒤집기(짝맞추기 메모리 게임)** — 카드 배열을 클릭해 뒤집고, 두 장이 열렸을 때 짝이
맞는지 비교.
```html
<button class="flip-card" data-pair="A"><span class="card-back">?</span><span class="card-front">개념 A</span></button>
<button class="flip-card" data-pair="A"><span class="card-back">?</span><span class="card-front">뜻 A</span></button>
```
클릭 시 `.flipped` 토글, 두 장 열렸을 때 `data-pair` 일치 여부 비교하는 새 JS 필요.

### 3.6 게임/타이머 요소

**타이머 챌린지** — 기존 활동(빈칸/퀴즈/짝짓기) 위에 "제한 시간" 요소만 얹기.
```html
<div class="timed-activity" data-seconds="60">
  <span class="timer-display">01:00</span>
  <!-- 안에 기존 활동 마크업 그대로 -->
</div>
```
`setInterval`로 카운트다운 표시 후 시간 종료 시 입력을 막는 정도, 별도 채점 시스템 불필요.

**단계 잠금 해제(언락형 진행)** — 이전 섹션을 다 풀어야 다음 섹션이 열림.
```html
<div class="section-block locked" data-unlock-after="mission-1">...</div>
```
`updateProgress()`가 이전 섹션 완료를 감지하면 `.locked` 클래스를 제거.

**슬라이더 평가/추정** — 값을 조절하면 피드백 문구가 바뀜.
```html
<input type="range" class="estimate-slider" min="0" max="100" data-feedback-target="est1">
<p id="est1" class="estimate-feedback"></p>
```
`input.blank`가 아니므로 진행률·자동저장에 넣으려면 `worksheetInputs()`/`updateProgress()`가
range input도 인식하도록 조건을 추가해야 합니다.

### 3.7 판단·시나리오형 (디지털윤리·AI기초 수업에 특히 유용)

**분기형 시나리오** — 선택지를 고르면 그 결과에 따라 다른 다음 카드가 보임. 딜레마 토론 수업에
강력합니다.
```html
<div class="branch-scenario" data-node="start">
  <p>친구가 SNS에 내 사진을 허락 없이 올렸어요. 어떻게 할까요?</p>
  <button class="branch-choice" data-goto="node-a">바로 항의한다</button>
  <button class="branch-choice" data-goto="node-b">먼저 이유를 물어본다</button>
</div>
<div class="branch-scenario" data-node="node-a" hidden>...</div>
```
선택한 `data-goto` 값의 노드로 전환, 나머지는 숨김.

**찬반 스펙트럼 슬라이더** — "매우 반대 — 매우 찬성" 축 위에 자기 생각 위치를 표시.
```html
<div class="spectrum">
  <span>매우 반대</span>
  <input type="range" class="spectrum-slider" min="-2" max="2" value="0">
  <span>매우 찬성</span>
</div>
```

**간단한 규칙기반 미니 판정기** — 학생이 몇 가지 값을 입력하면, 실제 AI API 호출 없이 미리
정해둔 if-else 규칙으로 "AI라면 이렇게 판단했을 거예요" 결과를 즉석에서 보여줌. 서버 호출이
없어 자체완결 원칙에도 맞고, "규칙 기반 vs 학습 기반" 개념 설명에도 쓸 수 있습니다.
```html
<select class="rule-input" data-key="weather">
  <option value="rain">비</option><option value="sunny">맑음</option>
</select>
<button onclick="runRuleEngine()">AI라면?</button>
<p class="rule-output"></p>
```
`runRuleEngine()`은 서버 호출 없이 로컬 if-else로 결과 문구를 조립해 `.rule-output`에 표시.

## 4. 새 활동 추가 시 체크리스트

1. 어느 MISSION(`section-block`)에 넣을지, 기존 활동 유형(1장)으로 충분한지 먼저 판단 — 충분하면 마크업만 복사해 문항 내용 교체.
2. 모든 입력/식별 요소에 유일한 `aria-label` 또는 `data-value`/`data-item`/`data-slot` 부여.
3. 정답 판정 값(`data-correct`, `data-ox-answer`, `data-answer`)을 정확히 지정하고, 실제로 문제/자료 내용과 논리적으로 맞는지 검증(추측 금지 — 이 파일의 다른 문항들도 원본 학습 자료의 정의를 근거로 정답을 정했습니다).
4. 자동저장 대상에 포함되었는지, 진행률 계산에 포함할지 여부를 결정하고 필요하면 2장 3번 규칙에 따라 `updateProgress()`를 수정.
5. `buildPrintableClone()`에 새 클래스의 인쇄 스타일이 필요한지 확인(기존 클래스만 재사용했다면 생략 가능).
6. 학생용 파일 수정 → 파일 JS 문법 검사 → Playwright 스크린샷으로 시각 확인 → 필요시 `pressSequentially(delay:65~70)`로 실제 입력·채점 동작까지 검증.
