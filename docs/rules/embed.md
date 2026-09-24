# data4_1.html이 data4.html 대비 지키는 규칙

> 📌 **구조 개편(2026-09-24) 전에 쓴 문서입니다.** 본문 속 `output/dataN.html`·`data4_1.html` 같은 이름은 지금의 `lessons/<단원>/<차시>/lesson.html` 에 해당하고, 폰트·라이브러리·이미지는 빌드 때 자동으로 인라인됩니다(`npm run build`). 여기 적힌 **디자인·동작 규칙**은 그대로 유효합니다.


> 목적: `data4.html`(원본 Design Component 파일)을 `data4_1.html`(자체완결형/self-contained 배포판)로
> 변환할 때 적용된 규칙을 정리한다. 다른 AI 에이전트가 이 문서만 보고도, 임의의
> `dataN.html` 원본으로부터 동일한 규칙을 적용한 `dataN_1.html`을 만들 수 있어야 한다.

## 0. 컨텍스트 요약

- `data4.html`은 `<x-dc>...</x-dc>` 블록(Design Component 템플릿)을 담은 원본 파일이며,
  외부 리소스(구글 폰트, 커스텀 웹폰트, `support.js`, `neis.config.js`)를 `<link>` / `<script src>`
  로 참조한다.
- `data4_1.html`은 **"Google Sites 코드삽입(embed)용" 자체완결(self-contained) 버전**이다.
  파일 최상단에 다음 주석이 명시되어 있다:
  ```html
  <!-- [자체완결화 / Google Sites 코드삽입용] 아래 3블록은 외부 리소스 인라인본. 원본 재생성 시 scripts 참조. -->
  ```
- 핵심 목적: Google Sites(또는 유사한 "코드 삽입" iframe/CSP 제한 환경)에 붙여넣었을 때
  **외부 네트워크 요청 없이 동일하게 동작**하도록 만드는 것. 즉, "포팅 규칙"이지
  콘텐츠(활동지 내용, 로직)를 바꾸는 규칙이 아니다.

이 문서에서 말하는 "규칙"은 전부 **data4.html → data4_1.html 변환 시 기계적으로 적용된 것**이며,
`<x-dc>...</x-dc>` 내부의 실제 콘텐츠(문구, 컴포넌트 구조, 상태 로직)는 **글자 하나 다르지 않게 보존**된다
(예외: 아래 규칙 2의 폰트 fallback 삽입, 규칙 5의 PDF 저장 로직 강화). 즉 이 변환은
"재작성"이 아니라 "래핑 + 치환"이다.

---

## 규칙 1 — 모든 외부 리소스를 인라인화한다 (핵심 규칙)

data4.html이 참조하는 모든 외부 `<link>` / `<script src="...">` 는 data4_1.html에서 **전부 제거**되고,
그 실제 내용(바이너리 포함)이 `<head>` 안에 인라인으로 삽입된다. data4_1.html에는 `<script src=`,
`<link rel=`가 **단 한 줄도 남지 않는다.**

`<head>` 최상단에 다음 3블록이 이 순서로 인라인 삽입된다:

1. **웹폰트 (`<style>` 블록, `@font-face` × N)**
   - data4.html의 `<link rel="preconnect" ...>`, Google Fonts `<link href="https://fonts.googleapis.com/css2?...">`,
     그리고 `<x-dc><helmet><style>` 안에 있던 `url('https://cdn.jsdelivr.net/...')` / `url('fonts/...')` 형태의
     `@font-face` 선언을 전부 걷어낸다.
   - 실제로 사용되는 웹폰트(예: GangwonEdu, CookieRun, Maplestory, Silkscreen 등) 각각을
     `src: url(data:font/woff2;base64,....) format('woff2')` 형태의 **base64 데이터 URI**로 변환해
     새로운 `@font-face` 블록으로 `<head>` 맨 위에 넣는다.
   - 라틴 전용 서체(Silkscreen 등)는 `unicode-range`를 지정해 필요한 코드포인트만 로드되게 유지한다.
   - 주석: `/* [자체완결화] 디자인 실서체 N종 woff2 base64 인라인 (출처: ..., data4.html 과 동일 서체). 외부 @import 제거. */`

2. **UI 런타임 라이브러리 (`<script>` 블록)**
   - `react@18.3.1` UMD production, `react-dom@18.3.1` UMD production을 각각 통째로 인라인.
     (data4.html은 이를 외부 `support.js`/CDN을 통해 런타임에 로드했다.)
   - 주석: `<!-- react@18.3.1 UMD production (unpkg 인라인) — loadReactUmd() 가 window.React 존재 시 fetch 스킵 -->`
   - 이어서 **DC 런타임**(`dc-runtime`, `x-dc` 파서/템플릿 컴파일러/부트스트랩 로직 — 원래
     `support.js`가 제공하던 것)을 `// GENERATED from dc-runtime/src/*.ts — do not edit.` 주석과 함께
     통째로 인라인한다. 이 코드는 `<x-dc>` 태그를 파싱해 React 컴포넌트로 마운트하는 부트로더이며
     `<script src="./support.js">` 를 완전히 대체한다.

3. **선택적 기능 라이브러리 (파일이 필요로 하는 경우에만)**
   - 이 파일은 "PDF로 저장하기" 버튼(`savePdf`)이 있으므로 `html2canvas@1.4.1` UMD와
     `jsPDF@2.5.1` UMD를 인라인한다.
   - 주석 예:
     ```
     <!-- html2canvas 1.4.1 (cdnjs 인라인) — savePdf() 화면 캡처용. 구글 사이트 임베드 CSP 회피 위해 외부 src 대신 인라인. -->
     <!-- jsPDF 2.5.1 UMD (cdnjs 인라인) — savePdf() PDF 생성·다운로드용. window.jspdf.jsPDF 로 노출. -->
     ```
   - **일반화 규칙**: 원본이 어떤 외부 라이브러리(차트, 캡처, PDF, QR코드 등)를 쓰든,
     그 라이브러리의 CDN 배포용 UMD/단일파일 번들을 통째로 인라인하고 그 목적을 주석으로 남긴다.
     써드파티 API 키가 필요 없는, 브라우저 전역(`window.XXX`)에 노출되는 라이브러리를 우선 선택한다.

- **`<script src="./neis.config.js" onerror="void 0"></script>`** (인증키가 있으면 선택적으로 로드하는 외부 스크립트)는
  data4_1.html에서 **완전히 삭제**된다 — 대체 인라인본을 넣지 않는다. 이유: 이 스크립트는
  "있으면 쓰고 없어도 무인증으로 동작"하는 선택적 설정 파일이라, Google Sites 배포판에서는
  애초에 로드를 시도할 필요가 없다(로드 실패 시 `onerror="void 0"`로 무시되던 것과 최종 동작은 동일).
  → **규칙**: 필수(폰트, 런타임, 기능 라이브러리)는 인라인하고, 실패해도 앱이 정상 동작하는
  "선택적 외부 설정 스크립트"는 그냥 제거한다.

- `<meta charset>`, `<meta name="viewport">` 등 인라인할 필요가 없는 일반 `<head>` 메타는 그대로 유지된다.

---

## 규칙 2 — 모든 커스텀 웹폰트 `font-family` 선언 뒤에 한글 시스템 폰트 폴백을 추가한다

`<x-dc>` 내부 CSS(`<style>` 블록)와 인라인 `style="..."` 속성 양쪽에서, 커스텀 웹폰트를 쓰는
모든 `font-family` 선언에 대해 **일관된 규칙**으로 폴백 폰트 목록을 확장한다.

- 한글 텍스트에 쓰이는 서체(`GangwonEdu`, `CookieRun`, `Maplestory` 등)는:
  ```
  font-family: 'XXX', sans-serif;
  →
  font-family: 'XXX', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif;
  ```
- 라틴 전용/픽셀 서체(`Silkscreen`)는 (한글을 그릴 필요가 없으므로 Noto Sans KR은 넣지 않고) `monospace` 앞에만 추가:
  ```
  font-family: 'Silkscreen', monospace;
  →
  font-family: 'Silkscreen', Apple SD Gothic Neo, Malgun Gothic, monospace;
  ```
- 이 치환은 **모든 발생 위치**(전역 `<style>` CSS 규칙, 각 컴포넌트의 인라인 `style="fontFamily:'...'"` 속성,
  이후 추가되는 PDF 캡처용 임시 DOM 스타일 문자열 등)에 예외 없이 적용된다.
- 목적: 웹폰트 로딩이 늦거나(특히 CSP/네트워크 제약이 있는 Google Sites 임베드 환경) 실패했을 때,
  한글이 브라우저 기본 세리프/고딕이 아니라 각 OS의 표준 한글 서체로 안전하게 폴백되게 하기 위함.
  (원본 폰트 자체는 규칙 1에서 이미 base64로 인라인되므로 "로드 실패"는 드물지만, `font-display: swap`
  적용 중 깜빡임·레이아웃 흔들림을 줄이기 위한 보험 성격의 폴백이다.)
- **문서 comment 유지**: 이 폴백 삽입은 CSS 선언의 의미(색상, 크기, weight 등)를 바꾸지 않으며,
  기존 코드 주석(`/* [design.md §...] ... */` 등)은 그대로 보존한다.

---

## 규칙 3 — `<x-dc>...</x-dc>` 템플릿 내용 자체는 절대 변경하지 않는다

- 컴포넌트 구조, 문구, 클래스명, `sc-if` / `sc-for` 바인딩, 데이터 속성, 이벤트 핸들러 바인딩(`onClick="{{ ... }}"`)
  등 **`<x-dc>` 블록 안의 실질적인 UI/로직은 규칙 2의 font-family 폴백 삽입을 제외하고 100% 동일하게 보존**한다.
- `<x-dc>` 블록의 시작·종료 위치, 내부의 `<helmet>` 서브블록, `data-dc-script` 로직 스크립트도
  구조적으로 동일하게 유지된다(코멘트의 `design.md §N` 참조 번호까지 그대로).
- 즉, "자체완결화"는 **UI 재구현이 아니라 배포 포맷 변환**이라는 원칙을 지킨다.

---

## 규칙 4 — `<x-dc>` 이후의 데이터/스크립트 블록은 그대로 유지하되, 선택적 외부 설정만 제거한다

`</x-dc>` 뒤에 이어지는 블록들(둘 다 동일 순서로 존재):

1. `<script type="application/json" id="neis-snapshot"> ... /*NEIS_SNAPSHOT_START*/ {...} /*NEIS_SNAPSHOT_END*/ </script>`
   — 정적 스냅샷 데이터(급식/시간표 등). **완전히 동일하게 보존**(바이트 단위로 동일).
2. `<script type="text/x-dc" data-dc-script data-props="...">` — 컴포넌트 로직(state, actions).
   **거의 동일**하나, 규칙 5에서 설명하는 `savePdf` 함수만 기능이 확장된다.
3. 이후의 순수 DOM 이벤트 바인딩 스크립트들(드래그&드롭 엔진, `textarea.blank` 자동 높이 조절 등)은
   **완전히 동일**하게 보존된다.

제거되는 것은 오직:
```html
<script src="./neis.config.js" onerror="void 0"></script>
```
(규칙 1 참고 — 선택적 외부 설정 스크립트이므로 삭제)

---

## 규칙 5 — 기능이 인라인 라이브러리를 실제로 활용하도록 관련 로직을 보강한다 (그레이스풀 폴백 포함)

data4.html의 `savePdf()`는 단순히 `window.print()`를 호출해 브라우저 인쇄창을 여는 방식이었다.
data4_1.html에서는 규칙 1-3에서 인라인한 `html2canvas` + `jsPDF`를 실제로 사용해
**진짜 PDF 파일을 생성해 다운로드**하는 방식으로 로직이 강화된다:

- `window.html2canvas`, `window.jspdf.jsPDF`가 존재하면:
  1. 인쇄 대상 DOM(`#sheetPrintArea`)을 화면 밖에 복제(clone)한다.
  2. 복제본에서 PDF에 불필요한 요소(버튼, 미배치 트레이 등)를 숨긴다.
  3. `textarea.blank`(사용자가 입력한 답안 칸)는 `html2canvas`가 textarea 내부 텍스트를
     그리지 못하므로, 실제 입력값(`live.value`)을 읽어 동일한 스타일의 `<div>`로 치환한다.
  4. 중복 `id`를 제거한다(원본 드래그 엔진 오염 방지).
  5. 웹폰트 로딩 완료(`document.fonts.ready`, 최대 1.5초 타임아웃)를 기다린 뒤 `html2canvas`로 캡처한다.
  6. 캡처된 캔버스를 A4 페이지 크기로 나눠 `jsPDF`로 여러 페이지에 걸쳐 `addImage`(JPEG, 품질 0.9)하고
     `pdf.save(파일명.pdf)`로 실제 다운로드를 트리거한다.
  7. 진행 중 버튼에 로딩 텍스트(`⏳ PDF 만드는 중...`)를 표시하고 클릭을 막는다.
- **`html2canvas`나 `jsPDF`를 로드하지 못했거나(`typeof !== 'function'`) 대상 DOM이 없으면**,
  원래의 `window.print()` 폴백 로직(`printFallback`)으로 **자동 대체**한다. 즉 기능이 실패해도
  화이트 스크린이 아니라 원본과 동일한 인쇄 흐름으로 우아하게 저하(graceful degradation)된다.
- **일반화 규칙**: 자체완결화 과정에서 어떤 기능이 "인라인해도 되는 라이브러리가 존재한다"는 이유로
  기능 자체가 개선될 수 있다. 단, 반드시 라이브러리가 없거나 실패하는 경우를 대비한 **원본 동작으로의
  폴백 경로**를 유지해야 한다.

---

## 규칙 6 — 그 외에는 어떤 것도 바꾸지 않는다 (변경 최소화 원칙)

data4.html과 data4_1.html을 base64 블록을 제거하고 diff했을 때, 위 규칙 1·2·5에서
설명한 변경(외부 리소스 인라인, font-family 폴백, savePdf 강화) **외의 차이는 전혀 없다**.
구체적으로 다음은 **절대 변경되지 않는다**:

- 색상 팔레트, 여백/크기 수치, 애니메이션, `box-shadow` 등 시각 디자인 값 전체
- 컴포넌트 마크업 구조, 클래스명, HTML 속성 순서
- 정적 데이터(시간표/급식 스냅샷 JSON) — 바이트 단위로 동일
- 주석에 남아있는 `[design.md §N]` 스펙 참조 번호와 설명 문구
- 드래그&드롭, 진행률 위젯 등 나머지 모든 JS 로직

---

## 요약 체크리스트 (다른 dataN.html → dataN_1.html 변환 시 적용)

1. `<head>` 최상단에 아래 순서로 인라인 블록을 추가한다:
   - [ ] 실제 사용 중인 모든 커스텀 웹폰트를 `data:font/woff2;base64,...`로 인라인한 `@font-face` `<style>`
   - [ ] React + ReactDOM UMD (또는 원본이 쓰는 프레임워크의 UMD 빌드)
   - [ ] `dc-runtime`(또는 `support.js`에 해당하는 부트스트랩 스크립트) 전체
   - [ ] 파일이 실제로 사용하는 추가 기능 라이브러리(캡처/PDF/차트 등)가 있다면 그 UMD 빌드
   - [ ] 각 블록 위에 왜 인라인했는지 설명하는 한국어 주석을 남긴다
2. 기존 `<link rel="preconnect|stylesheet" ...>` 와 `<script src="...">` 태그를 전부 제거한다.
   - [ ] 단, "있으면 쓰고 없어도 되는" 선택적 외부 설정 스크립트(`onerror="void 0"` 등으로 실패를
     흡수하던 것)는 대체 없이 그냥 삭제한다.
3. `<x-dc>` 내부(전역 CSS + 인라인 style 속성) 전체를 훑어, 커스텀 웹폰트를 쓰는 모든
   `font-family` 선언 뒤에 `Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR`(라틴 전용 서체는
   `Noto Sans KR` 제외)을 제네릭 폴백(`sans-serif`/`monospace`) 앞에 삽입한다.
4. `<x-dc>` 템플릿의 실제 내용(마크업, 바인딩, 로직, 데이터)은 규칙 3 그대로 손대지 않는다.
5. 인라인한 라이브러리를 실제로 활용할 수 있는 기능(예: PDF 저장)이 있다면, 그 기능을
   "라이브러리 사용 → 실패 시 원본 동작으로 폴백" 구조로 강화한다.
6. 그 외에는 diff가 나지 않아야 한다 — 변경은 위 5가지 항목으로 한정한다.
