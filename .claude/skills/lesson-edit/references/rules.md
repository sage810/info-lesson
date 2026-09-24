# 활동지 수정 규칙 — 요약과 원문 위치

필요한 절만 열어 본다. 전부 읽을 필요 없다.

## 1. lesson.html 의 세 가지 틀(shell) — `lesson.json` 의 `shell`

| shell | 구조 | 예 |
|---|---|---|
| `portal` | `<x-dc>` 템플릿 + 이용규칙·시간표·급식·수업 활동지 4탭. 로직은 `<script type="text/x-dc" data-dc-script>` 의 `Component` | 04, 05 |
| `sheet` | `<x-dc>` 템플릿, 활동지 한 장 | 06 |
| `standalone` | x-dc 없는 순수 HTML + 작은 스크립트 | 02, 07 |

x-dc 문법: 바인딩 `{{ 표현식 }}`, 분기 `<sc-if value="{{ bool }}">`, 반복 `<sc-for list="{{ arr }}" as="x">`.
템플릿 안 `style="…"` 은 React 식(카멜케이스: `borderRadius:14px`) — 주변 코드와 같은 방식으로 쓴다.
상세: `docs/log/build.md` 개요 절.

## 2. 새 동작(JS)을 넣을 때

- `document` 에 이벤트를 위임하는 즉시실행함수(IIFE)로. x-dc 는 화면에 안 보이는 원본 템플릿 복제본을 남기므로
  **전역 `querySelector` 대신 이벤트 대상 기준 `closest()`·형제 탐색**을 쓴다.
- 퀴즈를 추가하면 `Component` 의 `state` 배열 · 채점 함수 · 진행률 계산을 함께 고친다. 진행률 방식은 차시마다 달라요:
  05 = `_progressParts()`(빈칸 aria-label·붙여넣기 칸·형성평가를 항목 단위로 셈 — 앞으로의 기본), 04 = `sheetProgress()`, 06 = `sheetChecklist`(이름+형성평가만).
  새 차시는 05 방식을 따른다(`docs/log/build.md` "항목 단위 세분화 진행률" 절).
- 새 조작 버튼·트레이는 PDF 캡처 때 숨겨야 한다 → `docs/rules/pdf.md` A부 §4.3 hide 목록.
- 원문: `docs/rules/components.md` §0·§2(공통 규칙), 이미 만든 활동 유형은 §1 을 그대로 재사용.

## 3. 활동 유형 (재사용 우선)

- x-dc 차시(04·05·06): 빈칸 `textarea.blank`(문장 속 짧은 칸은 `.blank--inline`), 순서 배열 `.seq-*`(`shared/partials/seq-order.js`),
  칩→슬롯 `.ca-*`(`chip-slot.js`), 그래프 붙여넣기 `.paste-zone`(`paste-zone.js`), 자동 높이(`autogrow.js`),
  형성평가 칩은 `Component` state + `<sc-for>`(예: 06 의 `fqItems`).
- standalone 차시(02): 객관식 `.choice-card`, OX `.ox-quiz-item`, 드래그 짝짓기 `.dnd-*`.
- 원문 카탈로그: `docs/rules/components.md` §1 (standalone 계열 기준으로 쓰였지만 동작 원리는 같다)

## 4. 식별자와 정답

- 모든 입력·슬롯·칩: 페이지 전역 유일 `aria-label`/`data-*`. 진행률은 `textarea.blank[aria-label]` 을 센다.
- 정답은 학습 내용 근거로 확정(추측 금지). 학생 화면에 정답 문자열 노출 금지.
- 정답은 `answers.json` 에: `"fill": { "<aria-label>": "정답" }`, 눌러야 하는 퀴즈는 `"click": [{ "near": "문항 앞부분", "text": "버튼 글자" }]`.

## 5. 디자인 (docs/rules/design.md)

- 색은 §2.1 토큰만. 미션 카드 accent 는 §4.1 8색 순환(aqua·blue·yellow·purple·mint·lilac·salmon·olive),
  빠지는 카드는 예비 파스텔(`--sage`·`--sky-2`·`--moss`·`--rose-dust`·`--peri`).
- 한 미션 안의 박스·표·콜아웃은 그 미션 accent 와 같은 온도(냉색/난색). 대비 ≥ 4.5:1.
- 분석 유형별 색(구성·비교·분포·관계)은 §4.4.

## 6. PDF · 진행률 · 제출

- PDF 버튼 구조와 가드(이름 미입력 · 진행률 70% 이하면 막음): `docs/rules/pdf.md`
- "제출"을 선생님 드라이브로 보내는 기능은 활동지 코드가 아니라 빌드 때 붙는 `shared/runtime/msi-hook.js` 가 한다
  (`site.config.json` 의 `apiUrl`·`submit`). 활동지 안에서 따로 구현하지 않는다.

## 7. 4탭 틀로 옮기기

한 장짜리(sheet) 활동지를 4탭(portal)으로: `docs/rules/shell-porting.md`
