# PDF 저장(제출) 버튼 — 규칙과 동작

활동지 틀(shell)마다 PDF 버튼 구현이 달라서 두 부분으로 나눠 적었습니다. **내 차시의 `lesson.json` 의 `shell` 값**을 보고 해당 부분만 읽으세요.

| shell | 해당 차시(2026-09 기준) | 버튼 · 함수 | 읽을 부분 |
|---|---|---|---|
| `portal` (이용규칙·시간표·급식·활동지 4탭) | 04, 05 | `#pdfBtn` · `savePdf` (`<script type="text/x-dc">` 안) | **A부** |
| `sheet` (활동지 한 장) | 06 | `#pdfBtn` · `savePdf` | **A부** |
| `standalone` (x-dc 없이 순수 HTML) | 02 | `#saveBtn` · `handleSavePdf` | **B부** |
| `standalone` | 07 | PDF 버튼 없음 | — |

> 공통 규칙: 새로 만든 조작 버튼·트레이는 PDF 캡처용 복제본에서 숨겨야 합니다(A부 §4.3의 hide 목록).
> 여러 줄로 늘어난 빈칸이 PDF에서 잘리지 않게 하는 처리(A부 §4.3.1)와, 이름 미입력·진행률 부족 시 막는 가드(A부 §5.3)는
> 새 활동지에도 그대로 유지합니다. 원래 문서 속 파일명(data4_1.html 등)은 구조 개편 전 이름이에요 — 지금은 `lessons/<단원>/<차시>/lesson.html`.

---

# A부 — x-dc 활동지(`portal`·`sheet`)의 `savePdf`

## data4_1.html — "PDF로 저장하기(제출)" 버튼 동작 문서

> 대상 파일: `data4_1.html`
> 목적: 다른 AI 에이전트가 이 파일을 열람/수정할 때, "PDF로 저장하기" 버튼(사실상 "제출" 기능을 겸함)이
> 어떻게 동작하는지 코드 재분석 없이 바로 파악할 수 있게 정리한다.

### 1. 한눈에 보는 요약

- 화면상 라벨은 **"📄 PDF로 저장하기"** 이지만, 클릭 시 학생이 작성한 수업 활동지를 **PDF 파일로
  다운로드**시키는 동시에 화면 진행률 위젯에 **"✓ 제출" 배지**를 띄우는 **저장 = 제출** 겸용 버튼이다.
  파일 안에 "제출하기"라는 별도 문구/버튼은 없고, 이 PDF 저장 동작이 곧 제출 행위로 취급된다.
- 버튼 id: `pdfBtn` / 클릭 핸들러: `{{ savePdf }}` (data-dc-script 로직의 `savePdf` 함수).
- 정상 경로: `html2canvas`로 활동지 DOM을 캡처 → `jsPDF`로 A4 여러 페이지 PDF 생성 → 브라우저 다운로드.
- 라이브러리 로드 실패/미지원 환경이면: 자동으로 `window.print()` 인쇄창을 여는 방식으로 **폴백**.
- 두 경로 모두 성공하면 컴포넌트 상태 `saved: true`, `savedName: <학생 이름>`을 설정하고,
  이 값이 하단의 "SAVED! 활동지 저장 완료" 배지와 좌측 하단 플로팅 위젯의 "✓ 제출" 배지에 반영된다.

---

### 2. 관련 UI 요소 (템플릿, `<x-dc>` 내부)

#### 2.1 버튼 자체
```html
<div id="pdfBtn" onClick="{{ savePdf }}"
     style="cursor:pointer; padding:12px 24px; border:3px solid #4b3b6b; borderRadius:10px;
            background:#9db2f2; color:#26224a; fontFamily:'CookieRun', ...; fontWeight:700; fontSize:18px;
            boxShadow:4px 4px 0 rgba(75,59,107,.3)"
     style-active="... background:#8296e0; boxShadow:1px 1px 0 rgba(75,59,107,.3); transform:translate(3px,3px)">
  📄 PDF로 저장하기
</div>
```
- "수업 활동지" 탭(`isSheet` / `s.tab === 'sheet'`)의 맨 아래에 위치.
- `style-active`는 눌림(active) 상태 스타일(디자인 시스템의 클릭 피드백 패턴).

#### 2.2 저장 완료 안내 (버튼 바로 아래)
```html
<sc-if value="{{ saved }}" hint-placeholder-val="{{ false }}">
  <div style="... background:#fffdf7 ...">SAVED! 활동지 저장 완료</div>
</sc-if>
```
- `saved`가 `true`가 되면(=PDF 저장 또는 인쇄 폴백 성공 시) 나타남.

#### 2.3 캡처 대상 DOM
```html
<div id="sheetPrintArea" style="display:flex; flexDirection:column; gap:18px">
  ... 활동지 전체 콘텐츠 (학번/이름 입력, 문제, 답안 textarea 등) ...
</div>
```
- `savePdf`가 캡처하는 루트 요소. **원본이 아니라 이 요소를 clone한 복제본**을 화면 밖에 렌더링해서 캡처한다
  (원본 화면은 건드리지 않음, 뒤쪽 §4 참고).

#### 2.4 좌측 플로팅 "활동 진행률" 위젯의 제출 배지
```html
<div class="sheet-progress" aria-label="활동 진행률" style="display:{{ sheetWidgetDisplay }}">
  <div class="sp-head">PROGRESS</div>
  <div class="sp-body">
    <div class="sp-title">활동 진행률</div>
    <div class="sp-count">
      <span class="big">{{ sheetPct }}%</span>
      <span class="sub">{{ sheetDone }}/{{ sheetTotal }}</span>
    </div>
    <div class="track" role="progressbar" ...>
      <div class="fill" style="{{ sheetFillStyle }}"></div>
    </div>
    <sc-if value="{{ sheetSaved }}" hint-placeholder-val="{{ false }}">
      <span class="sp-done">✓ 제출</span>
    </sc-if>
  </div>
</div>
```
- `<x-dc>` 직속(줌 래퍼 밖)에 고정 위치(`position: fixed`)로 떠 있는 위젯.
- **"✓ 제출"** 문구가 실제로 "제출"이라는 단어가 등장하는 유일한 위치이며, `sheetSaved`(= `!!s.saved`)가
  true일 때만 표시된다. 즉 PDF 저장 버튼을 눌러 성공해야 이 배지가 뜬다.
- `sheetPct/sheetDone/sheetTotal`(진행률 %)은 **PDF 저장 여부와 무관**하게 별도 체크리스트로 계산되며
  (§3.2 참고), "제출" 배지만 저장 성공 여부에 연동된다 — 즉 진행률 100%가 아니어도 저장/제출은 가능하다.

---

### 3. 관련 상태(state) & 파생 값 (`data-dc-script` 로직)

#### 3.1 초기 상태
```js
{
  fGrade: '', fClass: '', fNum: '', fName: '',   // 학년/반/번호/이름 입력값
  saved: false, savedName: '',                    // 저장(제출) 여부, 저장 시점의 이름
  ...
}
```
- `fGrade/fClass/fNum/fName`은 활동지 상단의 학번·이름 입력란(`textarea.blank`)과 바인딩되어 있으며,
  PDF 파일명 생성에 쓰인다(§4 참고).

#### 3.2 진행률 위젯 파생 값 (render 시 매번 계산)
```js
const sheetChecklist = [
  !!(s.fName && s.fName.trim()),   // 이름을 적었는가
  !!s.q1Pick,                       // 1번 문제에 답했는가
  !!(s.prog2 && s.prog2.trim())     // 서술형 답안(prog2)을 적었는가
];
const sheetDone = sheetChecklist.filter(Boolean).length;
const sheetTotal = sheetChecklist.length;
const sheetPct = Math.round(sheetDone / sheetTotal * 100);
const sheetFillStyle = 'width:' + sheetPct + '%';
const sheetSaved = !!s.saved;                     // 진행률 집계엔 미포함, "제출" 배지 전용
const sheetAria = sheetTotal + '개 중 ' + sheetDone + '개 완료';
const sheetWidgetDisplay = s.tab === 'sheet' ? 'flex' : 'none';  // '수업 활동지' 탭에서만 위젯 표시
```
- **중요**: `sheetSaved`(제출 배지)는 진행률 체크리스트(`sheetChecklist`)에 포함되지 않는다.
  진행률 100%와 "제출 완료" 배지는 서로 독립적인 신호다.

---

### 4. `savePdf` 함수 상세 동작

버튼 클릭 → `savePdf()` 실행. 아래는 로직을 순서대로 정리한 것이다.

#### 4.0 준비: 파일명 생성
```js
const dig = v => 숫자만 추출;
const pad2 = v => 2자리로 zero-padding (예: '3' → '03');
const name = s.fName.trim();
const code = dig(fGrade) + pad2(fClass) + pad2(fNum);   // 예: 2학년 3반 5번 → "2035"
const fname = (code ? code+' ' : '') + (name ? name+' ' : '') + '활동지';  // 예: "2035 홍길동 활동지"
const pdfName = fname + '.pdf' (이미 .pdf로 끝나면 그대로)
```
- **학번(학년+반+번호)이 파일명 앞에 붙고, 없으면 생략**된다. 이름도 없으면 "활동지.pdf"만 남는다.

#### 4.1 라이브러리 사용 가능 여부 체크
```js
const H2C = window.html2canvas;
const JSPDF = window.jspdf && window.jspdf.jsPDF;
const src = document.getElementById('sheetPrintArea');
if (typeof H2C !== 'function' || typeof JSPDF !== 'function' || !src) {
  printFallback();  // §4.5 참고 — 여기서 함수 종료
  return;
}
```
- `html2canvas`/`jsPDF`는 data4_1.html의 `<head>`에 **인라인 base64로 이미 로드되어 있음**
  (Google Sites 임베드 시 CSP 때문에 외부 CDN `<script src>` 대신 인라인한 것 — 별도 문서
  `data4_1-self-containment-rules.md` 규칙 1/5 참고).
- 둘 중 하나라도 없거나 캡처 대상이 없으면 즉시 인쇄 폴백으로 넘어간다.

#### 4.2 버튼 잠금 + 로딩 표시
```js
btn.textContent = '⏳ PDF 만드는 중...';
btn.style.pointerEvents = 'none';
btn.style.opacity = '0.6';
```
- 중복 클릭 방지.

#### 4.3 캡처용 복제본(clone) 준비 — 화면에 보이는 원본은 절대 건드리지 않음
1. `#sheetPrintArea`를 `cloneNode(true)`로 복제.
2. 복제본을 화면 밖(`position:fixed; left:-10000px`)의 흰 배경(`background:#ffffff`) 컨테이너
   (`width:820px; padding:24px`)에 넣어 `document.body`에 임시로 append.
3. 복제본 안에서 다음을 정리:
   - **"PDF로 저장하기" 버튼(#pdfBtn) 자체는 결과물에서 숨김** (부모 요소 `display:none`).
   - `.seq-tray`, `.ca-tray`(아직 배치하지 않은 드래그 칩 트레이)는 인쇄 불필요하므로 숨김.
   - **`textarea.blank`(학생이 입력한 모든 답안 칸)를 `<div>`로 치환**:
     - `html2canvas`는 `<textarea>` 내부 텍스트를 그리지 못하므로, 실제 입력값(`live.value`,
       원본 DOM에서 읽음)을 텍스트로 넣은 `<div>`로 바꿔치기.
     - inline형 답안 칸(`blank--inline`)과 블록형 답안 칸에 대해 서로 다른 스타일을 재현.
   - 복제본과 그 하위 요소들의 `id` 속성을 전부 제거(중복 id로 인해 원본 드래그&드롭
     엔진이 복제본을 잘못 조작하는 것을 방지).

#### 4.3.1 늘어난 빈칸 클리핑 방지 — 여러 줄 답안이 PDF에서 잘리는 문제 (data5_1.html, 2026-09-10)

**증상**: 학생이 긴 답을 적어 `textarea.blank`가 2줄 이상으로 늘어난 상태에서 "PDF로 저장하기"를
누르면, PDF 안 해당 칸의 **아랫줄 텍스트가 테두리 밖으로 잘려 안 보인다**. 특히 표 셀(`<td>`) 안
빈칸(예: 데이터 시각화 4유형 표의 "의미" 칸)에서 재현된다.

**원인**: §4.3에서 `textarea.blank` → `<div>` 치환 시 그 `<div>`에는 `white-space:pre-wrap`만 있고
높이는 `min-height`뿐이라 브라우저에서는 콘텐츠에 맞게 자동으로 늘어난다. 그런데
**html2canvas 1.4.1**은 표 셀 등 안에서 여러 줄로 자란 블록 요소의 높이를 "자연 높이"(줄바꿈 전
높이)로 잘못 계산해, 넘치는 줄을 그리지 않고 잘라 버린다.

**해결**: 복제본(`clone`)을 `document.body`에 append한 **뒤**(레이아웃이 실제로 잡힌 시점),
치환해 만든 모든 빈칸 `<div>`의 실제 콘텐츠 높이(`scrollHeight`)를 재서 그 값을 인라인
`height`로 **명시적으로 고정**한다. html2canvas는 auto 높이는 무시해도, 픽셀로 박힌 높이는
그대로 그린다.

```js
// (§4.3 루프에서) 치환한 div 들을 배열에 모아 둔다
const blankBoxes = [];
...
if (ta.parentNode) { ta.parentNode.replaceChild(box, ta); blankBoxes.push(box); }

// holder 를 document.body 에 append 한 직후 — 레이아웃이 잡힌 뒤 높이 고정
for (let i = 0; i < blankBoxes.length; i++) {
  const b = blankBoxes[i];
  b.style.height = 'auto';          // 먼저 auto 로 되돌려 정확히 측정
  b.style.overflow = 'visible';
  const h = b.scrollHeight;
  if (h > 0) b.style.height = (h + 6) + 'px';   // +6 = border-box 보정 여유
  const cell = b.closest ? b.closest('td, th') : null;
  if (cell) cell.style.height = 'auto';         // 부모 셀도 자동 높이
}
```

- **순서가 중요**: 이 루프는 반드시 `document.body.appendChild(holder)` **다음**에 와야 한다
  (append 전에는 `scrollHeight`가 0). §4.3의 치환 루프(append 전)와는 분리된 두 번째 패스다.
- `overflow:visible` + `height` 고정을 함께 걸어, 측정이 1~2px 모자라도 마지막 줄이 안 잘린다.
- inline형(`blank--inline`)·블록형 빈칸 모두 같은 배열에 담아 처리한다.
- 새 활동지 파일에 이 `savePdf`를 이식할 때 이 두 번째 패스도 함께 가져올 것.

#### 4.4 캡처 → PDF 생성 → 다운로드
```js
await (document.fonts?.ready ?? Promise.resolve())  // 최대 1.5초까지만 기다림
await 80ms 대기                                       // 복제본 레이아웃 안정화
const canvas = await H2C(clone, { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false });

const pdf = new JSPDF('p', 'pt', 'a4');
// canvas를 A4 페이지 높이 단위로 잘라 페이지마다 JPEG(품질 0.9)로 addImage, 필요시 addPage 반복
pdf.save(pdfName);                     // 브라우저 표준 다운로드 트리거 (보통 "다운로드" 폴더)
this.setState({ saved: true, savedName: name });
```
- 세로로 긴 활동지도 여러 페이지 A4 PDF로 자동 분할된다.
- PNG 대신 **JPEG(품질 0.9)**를 쓰는 이유가 주석으로 명시되어 있음: "흰 배경·검정 글씨라 열화가
  거의 안 보이고, PNG로 하면 페이지당 십수 MB가 되기 때문".
- 성공 시 `saved: true`, `savedName: <이름>` 상태 갱신 → §2.2/§2.4 UI가 반응.

#### 4.5 에러 처리 및 정리
```js
.catch(err => { console.error('[savePdf]', err); alert('PDF를 만드는 중 문제가 생겼어요. 잠시 후 다시 눌러 주세요.'); })
.then(done, done);  // 성공/실패 모두 실행되는 정리 단계

function done() {
  임시 clone 컨테이너를 DOM에서 제거;
  버튼 텍스트/pointerEvents/opacity를 원래대로 복원;
}
```

#### 4.6 `printFallback()` — 라이브러리가 없을 때의 대체 경로 (§4.1에서 분기)
```js
const prevTitle = document.title;
function cleanup() {
  document.body.classList.remove('print-sheet-only');
  document.title = prevTitle;
}
window.addEventListener('afterprint', cleanup);
document.title = fname;                          // 인쇄 대화상자의 기본 파일명으로 활용됨
document.body.classList.add('print-sheet-only');  // 아래 §5 CSS가 적용됨
this.setState({ saved: true, savedName: name });
setTimeout(() => { window.print(); setTimeout(cleanup, 1000); }, 60);
```
- 이 경로는 실제 PDF 파일을 만들지 않고 **브라우저 표준 인쇄창**을 연다(사용자가 "PDF로 저장"을
  직접 선택해야 함). 그래도 `saved: true`는 동일하게 설정되어 "제출" 배지는 뜬다.
- 참고: `data4.html`(자체완결화 이전 원본)의 `savePdf`는 **이 폴백 로직 하나만** 갖고 있었다.
  data4_1.html에서는 이게 "실패 시 대비책"으로 격하되고, §4.3~§4.4의 실제 PDF 생성 경로가
  기본 동작이 되었다.

---

### 5. 엣지 케이스: 이름 미입력 / 진행률 낮음 상태에서 버튼을 눌렀을 때

> **버전 주의**: 아래 §5.1~§5.2 는 **`data4_1.html` 기준**(가드 없음). `data5_1.html`·`data5_2.html`
> 은 §5.3 의 **제출 전 확인 가드**가 들어가 있어 동작이 다르다(이름 없거나 진행률 ≤70% 면 팝업 후 중단).

**결론부터: (data4_1.html 은) 코드 전체(`savePdf`, `printFallback`)에 이름·진행률을 검사해서 저장을 막는
로직(validation/guard)이 전혀 없다.** 두 경우 모두 **버튼은 정상적으로 동작하며 PDF 저장(또는
인쇄)과 "제출" 처리가 그대로 진행된다.** 막지 않는 대신, 아래처럼 결과물/표시에 소소한 차이만 생긴다.

#### 5.1 이름(`fName`)을 적지 않고 버튼을 눌렀을 때

- **막히지 않는다.** `savePdf` 어디에도 `if (!name) return`류의 체크가 없으므로 즉시 PDF 생성(또는
  인쇄 폴백)이 진행되고 `saved: true`가 설정된다.
- **파일명에서 이름 부분만 빠진다** (§4.0 로직 그대로 적용):
  ```js
  const name = String(s.fName == null ? '' : s.fName).trim();   // '' (빈 문자열)
  const fname = (code ? code+' ' : '') + (name ? name+' ' : '') + '활동지';
  ```
  - 학번(학년/반/번호)까지 비어 있으면 파일명은 그냥 `활동지.pdf`가 된다.
  - 학번만 채워져 있으면 예: `2035 활동지.pdf` (이름 세그먼트만 생략).
- **PDF 본문 내용도 그대로 캡처된다** — 이름 입력칸(`textarea.blank`)이 비어 있으면 그 칸은
  §4.3에서 값이 `''`인 빈 `<div>`로 치환되어, **PDF 안에 이름 칸이 빈 채로 그대로 남는다**
  (즉 시스템이 대신 채워주지 않고, "이름 없이 제출된 흔적"이 PDF에 고스란히 보인다).
- `sc-if value="{{ saved }}"` 조건으로 뜨는 **"SAVED! 활동지 저장 완료"** 문구와, 진행률 위젯의
  **"✓ 제출"** 배지도 이름 여부와 무관하게 동일하게 표시된다.
- 참고: 상태값 `savedName`은 `s.savedName || '이름 없는 친구'`로 계산되어 render()가 반환하는
  props에는 포함되지만(§3.1), **`<x-dc>` 템플릿 어디에도 `{{ savedName }}`을 실제로 출력하는 곳이
  없다** (현재 UI에 노출되지 않는 값). 따라서 화면에서 "이름 없는 친구" 같은 문구가 보이지는 않는다.
- 다만 이름은 **진행률 체크리스트 3항목 중 하나**(`!!(s.fName && s.fName.trim())`, §3.2)이므로,
  이름을 비워두면 §5.2에서 설명하는 "진행률 100% 미만" 상태가 함께 발생하는 것이 일반적이다
  (진행률과 저장 가능 여부는 별개지만, 이름 누락은 진행률 계산에는 영향을 준다).

#### 5.2 진행률(%)이 낮은 상태(체크리스트 미완료)에서 버튼을 눌렀을 때

- **역시 막히지 않는다.** `savePdf` 함수는 `sheetPct`/`sheetDone`/`sheetTotal`/`sheetChecklist`
  값을 참조하지 않으며, 이 값들과 무관하게 항상 실행된다. 즉 **경고창(confirm)이나 "진행률
  N% 이상이어야 저장 가능" 같은 임계치 로직은 존재하지 않는다.**
  - 진행률 체크리스트는 §3.2의 3항목(이름 작성 / 1번 문제 답 선택(`q1Pick`) / 서술형 답안
    `prog2` 작성)뿐이며, 활동지의 다른 문제(4단계 순서 배열, O/X 문제, 3지선다 등)는 진행률
    계산에 아예 포함되지 않는다. 따라서 "진행률 0%"라도 다른 문제엔 답을 다 채웠을 수 있다.
- 진행률이 0%(아무것도 안 채운 상태)여도:
  - PDF 생성(또는 인쇄 폴백)이 정상적으로 실행된다.
  - 캡처되는 PDF에는 **미완성 상태 그대로**(빈 답안칸, 미선택 문제 등)가 담긴다 — 시스템이
    별도로 "미완료" 워터마크나 경고를 추가하지 않는다.
  - `saved: true`가 설정되어 "SAVED!" 문구와 "✓ 제출" 배지가 정상적으로 나타난다.
- **결과적으로**: 진행률 위젯(§2.4)은 어디까지나 학생에게 "얼마나 작성했는지" 보여주는
  **정보성 표시일 뿐, 저장/제출을 제한하는 게이트가 아니다.** 진행률 0%든 100%든 버튼을 누르면
  동일하게 저장·제출 처리가 완료된다.

> **요약**: (data4_1.html 은) "필수 항목 완료 후 제출 가능"과 같은 서버/폼 검증 개념이 없는,
> **클라이언트 전용(로컬 다운로드) 활동지**다. 이름 미입력·낮은 진행률 모두 버튼 동작을
> 막지 않으며, 유일한 차이는 (a) PDF 파일명에서 이름이 빠지는 것과 (b) PDF/인쇄물 안에
> 빈 칸이 그대로 남는 것뿐이다.

#### 5.3 제출 전 확인 가드 — 이름 미입력 · 진행률 부족 (data5_1.html · data5_2.html, 2026-09-10)

학생이 **이름을 안 적고** 또는 **활동지를 덜 채우고** "PDF로 저장하기"를 누르는 것을 막기 위해,
`savePdf` **맨 앞**(라이브러리 체크·`printFallback` 분기보다 먼저)에 두 개의 가드를 넣는다. 조건에
걸리면 `window.alert` 로 안내하고 `return` — PDF 생성도 인쇄 폴백도 안 하고, `saved` 도 안 바뀐다.

```js
savePdf: () => {
  // ① 이름 미입력
  if (!String(this.state.fName == null ? '' : this.state.fName).trim()) {
    window.alert('이름을 적어주세요.');
    const _nf = document.querySelector('#sheetPrintArea textarea[placeholder="이름을 적어요"]');
    if (_nf) _nf.focus();                 // 이름칸으로 포커스 이동
    return;
  }
  // ② 진행률 ≤ 70%  (임계값은 상수 하나만 바꾸면 됨)
  const _pp = (typeof this._progressParts === 'function')
    ? this._progressParts()               // data5_2: DOM 세분화 집계 (build.md "항목 단위 세분화 진행률")
    : { done: sheetDone, total: sheetTotal };  // data5_1: renderVals 의 sheetChecklist 값
  const _pct = _pp.total ? Math.round(_pp.done / _pp.total * 100) : 0;
  if (_pct <= 70) {
    window.alert('활동지를 모두 채워주세요.\n(현재 ' + _pct + '% 완료)');
    return;
  }
  // …이하 기존 savePdf(파일명 → 라이브러리 체크 → 클론 캡처 → pdf.save) 그대로…
}
```

**설계 포인트 / 재사용**

- **위치**: `savePdf` 첫 줄. `printFallback` 경로(§4.6)도 이 뒤에서 갈리므로, 라이브러리 유무와 상관없이 가드가 먼저 걸린다.
- **이름 판정**: `this.state.fName`(React state, 항상 최신). 캡처된 `s.fName` 대신 `this.state` 를 써야 클릭 시점 값이 정확하다.
- **진행률 판정**: 클릭 시점에 **다시 계산**한다. `renderVals` 가 마지막으로 돈 뒤 학생이 더 입력했을 수 있으므로(특히 data5_2 는 비제어 DOM + 디바운스 갱신이라), 캡처된 `sheetPct` 를 믿지 말고 `this._progressParts()`(있으면) 로 재집계.
  - `_progressParts` 가 없는 파일(data5_1 등)은 `renderVals` 스코프의 `sheetDone/sheetTotal` 로 폴백 — 이 값들이 `savePdf` 클로저에 잡혀 있다.
- **임계값**: `<= 70` 의 `70` 만 바꾸면 기준 조정. "모두 채워야" 로 하려면 `_pct < 100`.
- **문구**: `alert` 는 이 파일에서 이미 쓰는 패턴(§4.5 의 실패 안내). 팝업 대신 인라인 메시지를 원하면 `this.setState({ saveError: '…' })` 후 버튼 옆에 `<sc-if>` 로 표시하는 식으로 바꿀 수 있다(마크업 추가 필요).
- **자동 채우기 테스트**: 헤드리스에서 `window.alert` 를 가로채 메시지를 배열에 모으고, `#pdfBtn` 클릭 후 배열을 확인. 두 조건 다 통과하면 그때부터 실제 html2canvas/jsPDF 가 돌아 느리므로, 가드만 검증할 땐 조건 통과 케이스를 클릭하지 말 것.

**검증 (헤드리스, 2026-09-10)**

- 이름 없이 `#pdfBtn` 클릭 → `alert("이름을 적어주세요.")`, 저장 안 됨.
- 이름 입력 + 진행률 0% 로 클릭 → `alert("활동지를 모두 채워주세요.\n(현재 0% 완료)")`, 저장 안 됨.
- 이름 + 진행률 70% 초과 → 가드 통과, 기존 PDF 생성 경로 진행.

---

### 6. `printFallback` 경로가 의존하는 인쇄 전용 CSS

```css
/* [design.md §6] 전역 인쇄 규칙 */
@media print {
  ...
  /* "PDF로 저장하기" — 수업 활동지 탭 내용만 인쇄 (savePdf 가 body.print-sheet-only 토글) */
  body.print-sheet-only #appTitlebar,
  body.print-sheet-only #appFooter,
  body.print-sheet-only #pdfBtn { display: none !important; }
  body.print-sheet-only #appPage {
    zoom: 1 !important; min-height: 0 !important; padding: 0 !important;
    background: #fff !important; background-image: none !important;
  }
}
```
- `body.print-sheet-only` 클래스가 있을 때만 적용되며, 상단 타이틀바/하단 푸터/PDF 버튼을 인쇄에서
  제외하고 배경을 흰색으로, 확대(zoom) 배율을 1로 리셋해 활동지 본문만 깔끔하게 인쇄되도록 한다.
- `.seq-tray`, `.ca-tray`(미배치 드래그 칩), 정답/오답 표시의 색 의존을 텍스트(`✓ 정답`/`✗ 다시`)로
  보완하는 등, 인쇄(흑백 프린터 포함) 환경을 고려한 규칙도 같은 `@media print` 블록에 포함되어 있다.

---

### 7. 다른 에이전트가 알아야 할 요점 정리

| 항목 | 내용 |
|---|---|
| 버튼 라벨 | "📄 PDF로 저장하기" (별도의 "제출" 버튼은 없음) |
| 클릭 핸들러 | `savePdf` (data-dc-script 내부 함수) |
| 정상 경로 | `html2canvas` + `jsPDF`로 실제 PDF 파일 생성·다운로드 |
| 폴백 경로 | 라이브러리 부재/캡처 대상 없음 → `window.print()` |
| "제출" 표시 위치 | 좌측 플로팅 진행률 위젯의 `✓ 제출` 배지 (`sheetSaved` = `!!s.saved`) |
| 제출 조건 | 두 경로 중 하나라도 성공하면 `saved: true` — 진행률 체크리스트 완료 여부와 무관 |
| 파일명 규칙 | `"{학년}{반 2자리}{번호 2자리} {이름} 활동지.pdf"` (값이 없으면 해당 부분 생략) |
| 캡처 대상 | `#sheetPrintArea` (원본이 아닌 화면 밖 복제본을 캡처, 원본 DOM은 무변경) |
| textarea 처리 | 캡처 전, 답안 `textarea.blank`를 실제 입력값을 담은 `<div>`로 치환 (html2canvas 제약 회피) |
| 늘어난 빈칸 클리핑 방지 | 복제본을 body에 append한 뒤, 치환한 빈칸 `<div>`의 `scrollHeight`를 재서 `height`로 고정 → 여러 줄 답안이 PDF에서 안 잘림 (§4.3.1, data5_1.html) |
| 이미지 포맷 | JPEG 품질 0.9 (파일 용량 절감 목적, 주석 명시) |
| 진행률과의 관계 | 진행률(%)과 "제출" 배지는 서로 다른 상태값이며 100% 미만이어도 제출 가능 |
| **이름 미입력 시** | **data4_1**: 막히지 않음(파일명에서 이름만 생략). **data5_1/5_2(§5.3)**: `alert("이름을 적어주세요.")` 후 중단, 이름칸으로 포커스 |
| **진행률 낮을 때(0% 포함)** | **data4_1**: 막히지 않음(임계치 로직 없음). **data5_1/5_2(§5.3)**: 진행률 ≤70% 면 `alert("활동지를 모두 채워주세요.")` 후 중단 |
| 검증(validation) 존재 여부 | **data4_1**: 없음(클라이언트 전용). **data5_1/5_2**: `savePdf` 맨 앞 제출 전 가드 2개(이름·진행률) — §5.3 |

---

# B부 — 순수 HTML 활동지(`standalone`, 예: 02차시)의 `handleSavePdf`

## 신현중학교 컴퓨터실 활동지 — "PDF로 저장하기" 버튼 동작 가이드 (AI 에이전트용)

이 문서는 `computer_lab_page_digital_data_v3.html` 하단의 **📄 활동지 PDF로 저장하기** 버튼이 정확히 무엇을 하는지, 다른 AI 에이전트가 코드를 다시 읽지 않고도 이해할 수 있도록 정리한 기술 참고 문서입니다. 같은 구조를 쓰는 다른 단원 파일에도 동일하게 적용됩니다.

### 결론 먼저

버튼을 누르면 **별도의 인쇄창(다이얼로그) 없이, 학생이 입력한 내용이 그대로 담긴 PDF 파일이 브라우저를 통해 즉시 다운로드**됩니다. 파일은 브라우저의 기본 다운로드 동작을 그대로 타므로, 대부분의 환경에서 **사용자(브라우저)가 설정해 둔 "다운로드" 폴더**에 저장됩니다 — 코드가 "다운로드 폴더"라는 특정 경로를 지정하는 것이 아니라, jsPDF 라이브러리의 `pdf.save(파일이름)` 호출이 내부적으로 브라우저 표준 파일 다운로드(a 태그 + Blob URL 클릭과 동일한 동작)를 일으키는 것이고, 그 결과 저장 위치는 전적으로 브라우저 설정(자동으로 다운로드 폴더에 저장 / 매번 저장 위치를 물어봄)을 따릅니다.

### 전체 동작 순서 (한눈에)

1. 학생이 버튼(`#saveBtn`, "📄 활동지 PDF로 저장하기")을 클릭 → `handleSavePdf()` 실행.
2. **사전 검증 2단계** — 통과 못 하면 `alert()` 팝업만 뜨고 아무 파일도 생성되지 않음:
   - 이름 칸(`input[aria-label="이름"]`)이 비어 있으면 "이름을 입력하세요" 알림 후 중단.
   - 진행률(`currentProgressPct`, `updateProgress()`가 계속 갱신하는 전역 변수)이 70% 이하이면 "모든 문제를 풀어주세요" 알림 후 중단.
3. **라이브러리 가용성 확인** — `html2canvas`/`window.jspdf`가 로드되지 않았으면(학교 네트워크가 cdnjs.cloudflare.com을 막은 경우 등) 그냥 `window.print()`(브라우저 기본 인쇄창)로 대체하고 함수 종료. 즉 **이 기능은 인터넷에서 외부 CDN 스크립트 2개를 성공적으로 불러왔을 때만 "버튼 한 번 → 바로 다운로드" 방식으로 동작**하고, 실패하면 조용히 예전 방식(Ctrl+P와 동일한 인쇄창)으로 폴백합니다.
4. 버튼을 비활성화하고 문구를 "⏳ PDF 만드는 중..."으로 바꿔 중복 클릭을 막음.
5. **인쇄용 복제본(clone) 생성** — `buildPrintableClone()`. 화면에 보이는 원본을 절대 건드리지 않고, 화면 밖(`left:-10000px`)에 같은 내용의 복제 DOM을 하나 더 만들어서 그것만 캡처합니다.
6. 복제본이 실제로 레이아웃을 계산할 시간을 확보하기 위해 60ms 대기.
7. **`html2canvas(wrapper, {scale:2, backgroundColor:'#ffffff', useCORS:true})`** — 복제본 전체를 고해상도(2배) PNG 캔버스로 캡처.
8. **`jsPDF`로 A4 세로(`'p','pt','a4'`) 문서 생성** 후, 캡처된 캔버스를 페이지 높이 단위로 여러 장으로 나눠(`computePdfBreakPoints`/`findSafeBreak`로 "이 부분은 잘리면 안 된다"는 구간을 피해서 안전한 위치에서만 페이지를 나눔) 각 페이지에 이미지로 삽입.
9. **`pdf.save(buildPdfFileName())`** 호출 — 이 한 줄이 실제 다운로드를 일으키는 지점. jsPDF 내부에서 Blob을 만들고 `<a download="파일이름">` 클릭을 시뮬레이션하는 방식으로 동작하며, 별도의 "저장 위치 선택 코드"는 없습니다.
10. 성공하면 자동저장(`localStorage`) 초안을 지움(`clearDraft()`) — 컴퓨터실은 여러 학생이 한 컴퓨터를 돌아가며 쓰므로, 다음 학생이 이전 학생의 답을 보지 않도록 하기 위함.
11. 성공/실패 여부와 무관하게(`finally`) 복제본 DOM 제거, 버튼을 다시 원래 문구·활성 상태로 복구.

### 왜 "화면을 그대로 캡처"하지 않고 별도 복제본을 만드는가

이 페이지는 밝은 파스텔 테마에 CSS 커스텀 프로퍼티(`--color-*`, `background` 그라디언트 등)를 광범위하게 씁니다. 초기 버전에서는 화면을 그대로 캡처했더니 html2canvas가 CSS 변수/그라디언트를 완벽히 재현하지 못해 글씨가 흐리게 나오는 문제가 있었습니다. 그래서 지금은 **캡처 전용 복제본에만 "흰 배경 + 진한 검정 글씨(#111111)"를 인라인 스타일로 직접 박아 넣어서**(CSS 변수를 전혀 참조하지 않도록) 캡처 결과를 항상 예측 가능하게 만들었습니다. 화면에 보이는 원본 페이지(학생이 보는 화면)는 이 과정에서 전혀 바뀌지 않습니다.

#### `buildPrintableClone()`이 복제본에 적용하는 주요 변환

- `#tab-worksheet .sheet` 전체를 `cloneNode(true)`로 복제하고, 화면 밖(`position:fixed; left:-10000px`)의 `#pdf-export-root` 래퍼(`width:800px`, 흰 배경) 안에 넣음.
- **모든 `textarea.blank`를 일반 `<div class="pdf-answer-block">`로 바꿔치기.** html2canvas가 textarea 내부의 줄바꿈을 정확히 캡처하지 못하는 문제가 있어서, 학생이 입력한 실제 값(`liveEl.value` — 원본 DOM에서 직접 읽음, 복제 시점의 스냅샷이 아님)을 담은 일반 텍스트 상자로 대체합니다. 표(td) 밖에 있고 `blank--autogrow` 클래스가 붙은 인라인 빈칸은, 화면에서 실제 측정된 폭(`getBoundingClientRect().width`)을 그대로 유지한 `inline-block` 상자로 만들어 원래 문장 속에서 보이던 것과 같은 자리·같은 줄바꿈 모양을 재현합니다.
- 미션 헤더(`.section-block h3`)의 색색 배경을 전부 흰 배경+검정 글씨+검정 밑줄로, 표/콜아웃/객관식 카드/OX 문항/짝짓기 칩과 칸/흐름도를 전부 흑백 인쇄에 적합한 밝은 회색조 + 진한 글자색으로 바꿔치기(정답/오답 표시가 있으면 그 상태에 맞춰 초록/빨강 테두리도 유지).
- `.no-print` 클래스가 붙은 요소(진행률 바, 자동저장 표시줄, 각종 버튼 등 화면 전용 UI)는 `display:none`으로 숨겨서 PDF 결과물에 나오지 않게 함.

### 페이지 나누기(멀티 페이지) 로직

캡처된 캔버스 하나를 그냥 A4 페이지 높이대로 기계적으로 자르면 표/콜아웃/문항 중간이 페이지 경계에서 잘릴 수 있습니다. 이를 막기 위한 3단계 로직:

1. `collectPdfBreakBlocks(root)` — "절대 이 안에서 자르면 안 되는 블록" 목록을 수집. 소제목(`h3`)·안내문(`p.hint`)·문장(`p.fill-line`)은 바로 다음 요소와 한 덩어리로 묶고, `.sheet-header`, `.callout`, `.table-scroll`(표), `.choice-card-row`, `.quiz-item`, `.ox-quiz-item`, `.dnd-tray`, `.dnd-row`, `.dnd-grid-2col`, `.pdf-answer-block`, `input.blank`, `.flow-diagram`, `.mc-quiz-item` 각각을 하나의 통짜 블록으로 취급.
2. `computePdfBreakPoints(wrapper, canvas)` — 위 블록들의 화면상 좌표를, 캡처된 캔버스의 픽셀 좌표로 환산해 "금지 구간" 목록을 만듦.
3. `findSafeBreak(cursor, idealEnd, canvasHeight, forbidden)` — "이상적으로는 여기서 페이지를 끊고 싶다(A4 한 페이지 분량)"는 위치(`idealEnd`)가 금지 구간 안에 걸리면, 그 금지 구간의 시작 지점까지 끊는 위치를 앞으로 당김. 당긴 위치가 또 다른 금지 구간에 걸리면 안전해질 때까지 반복. 블록 하나가 페이지 한 장보다 커서 도저히 못 피하면 그때만 원래 위치에서 자름(안전장치).

이 로직 덕분에 표 한 줄이나 콜아웃 박스 하나가 페이지 경계에서 위아래로 쪼개져 보이는 일이 없습니다. **주의**: 이 페이지 나누기 로직은 이 "PDF로 저장하기" 버튼(html2canvas 경로) 전용입니다. `@media print` CSS를 통한 네이티브 인쇄(Ctrl+P, 또는 라이브러리 로드 실패 시 폴백되는 `window.print()`) 경로에는 이 로직이 적용되지 않습니다 — 그쪽은 브라우저 자체의 인쇄 페이지 나누기를 그대로 씁니다.

### 파일 이름 자동 생성 규칙

`buildPdfFileName()`:

- 학습지 상단 `id-fields`의 반(`input[aria-label="반"]`)·번호(`input[aria-label="번호"]`)·이름(`input[aria-label="이름"]`) 값을 읽음.
- 반/번호는 각각 숫자만 남기고(`pad2`) 2자리로 0-패딩(예: "5" → "05").
- 이름은 파일명에 쓸 수 없는 문자(`\ / : * ? " < > |`)만 제거(`sanitizeForFilename`), 그 외 검증은 하지 않음.
- 학년은 상수 `var GRADE = '2';`로 **코드에 하드코딩**되어 있음(현재 이 학습지는 2학년 고정 표기이기 때문). 다른 학년 학습지에 재사용하려면 이 값을 수동으로 바꿔야 함.
- 세 값이 모두 채워졌으면: `GRADE + 반(2자리) + 번호(2자리) + ' ' + 이름 + ' 활동지.pdf'` (예: 2반 5번 홍길동 → `"20205 홍길동 활동지.pdf"`).
- 셋 중 하나라도 비어 있으면 기본값 `"활동지.pdf"`.
- **참고**: 사전 검증(2단계) 때문에 실제로 이 함수가 호출되는 시점에는 이름 칸이 항상 채워져 있지만, 반/번호는 검증 대상이 아니므로 비어 있으면 기본 파일명으로 저장될 수 있습니다.

### 조건: 언제 다운로드가 실제로 일어나는가

| 상황 | 결과 |
|---|---|
| 이름 칸이 비어 있음 | `alert('이름을 입력하세요')`, 다운로드 없음 |
| 진행률 ≤ 70% | `alert('모든 문제를 풀어주세요')`, 다운로드 없음 |
| 이름 O, 진행률 > 70%, html2canvas/jsPDF 로드 실패(네트워크 차단 등) | `window.print()` 브라우저 인쇄창 열림(PDF 자동 다운로드 아님, 학생이 인쇄창에서 "PDF로 저장"을 직접 선택해야 함) |
| 이름 O, 진행률 > 70%, 라이브러리 정상 로드 | html2canvas 캡처 → jsPDF 생성 → `pdf.save()`로 즉시 다운로드 (이 문서가 다루는 주된 케이스) |
| 캡처/PDF 생성 중 예외 발생 | `alert('PDF를 만드는 중 문제가 생겼어요...')`, 다운로드 없음(자동저장 초안은 지워지지 않음) |

### 저장 위치에 대해 정확히 알아야 할 것

- 코드 어디에도 "다운로드 폴더 경로"를 지정하는 부분은 없습니다. `pdf.save(fileName)`은 jsPDF 라이브러리 내부에서 `Blob` → `URL.createObjectURL` → 숨겨진 `<a href="..." download="fileName">` 요소를 만들어 클릭하는 방식으로 구현되어 있고, 이는 사용자가 웹사이트에서 파일을 "다운로드"할 때의 표준 브라우저 동작과 동일합니다.
- 따라서 실제 저장 위치는 **그 컴퓨터/브라우저의 다운로드 설정**을 따릅니다. 크롬/엣지 등 대부분의 브라우저는 기본값이 "다운로드 폴더에 자동 저장"이라, 결과적으로 사용자가 체감하기엔 "버튼을 누르면 다운로드 폴더에 파일이 생긴다"처럼 동작합니다. 다만 브라우저 설정이 "다운로드할 때마다 저장 위치를 물어봄"으로 되어 있으면 저장 위치 선택 창이 뜨며, 이 동작을 이 웹페이지 코드가 바꿀 방법은 없습니다(웹 표준상 JS가 파일 시스템 경로를 직접 지정할 수 없음).
- 즉, "다운로드 폴더에 저장되게 만드는 기능"은 이미 이 버튼의 기본 동작이며, 별도로 구현해야 할 추가 기능이 아닙니다. 만약 사용자가 "항상 정확히 다운로드 폴더에" 강제하고 싶다면, 그것은 이 HTML/JS로는 할 수 없고 브라우저 자체 설정(다운로드 시 저장 위치 확인 끄기)에서 제어해야 합니다.

### 이 기능을 수정할 때 참고할 것 (다른 AI 에이전트용)

- 로직은 전부 `<script>` 안, `[수정 3]`, `[수정 3-1]`, `[수정 3-2]`, `[수정 19]`, `[수정 20]`, `[수정 21-1]`, `[수정 21-2]` 주석 근처에 모여 있습니다. Ctrl+F로 `[수정 3]`을 검색하면 관련 코드 전체를 빠르게 찾을 수 있습니다.
- 외부 라이브러리 버전은 `<head>`에 고정 핀 되어 있습니다: `html2canvas 1.4.1`, `jspdf 2.5.1` (`cdnjs.cloudflare.com`에서 로드). 버전을 올리면 캡처 결과나 API가 달라질 수 있으니, 바꾼 뒤에는 반드시 실제 PDF 생성을 테스트해야 합니다.
- 새로운 컴포넌트(활동 유형)를 학습지에 추가했다면, `buildPrintableClone()`에 그 컴포넌트의 흑백/인쇄용 스타일 처리를 추가하지 않는 한 PDF에는 화면과 다르게(또는 깨져) 나올 수 있습니다 — 이 부분은 별도 문서(`활동지_활동유형_가이드_AI에이전트용.md`)의 "PDF 인쇄 처리" 항목과 연결됩니다.
- 사전 검증 기준(이름 필수, 진행률 70% 초과)은 하드코딩된 값입니다. 기준을 바꾸려면 `handleSavePdf()` 맨 앞부분만 수정하면 됩니다.
- 파일명 규칙(학년 하드코딩 `GRADE = '2'`)은 이 학습지가 2학년 전용이라는 전제에 의존합니다. 다른 학년/여러 학년이 함께 쓰는 페이지로 재사용한다면, 학년을 `id-fields`에서 직접 입력받도록 바꾸거나 `GRADE` 값을 그 페이지에 맞게 고쳐야 합니다.
