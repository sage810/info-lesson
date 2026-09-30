# PDF 로 새 차시 만들기 — 절차 (01차시 "디지털 데이터", 2026-09-30 에서 정리)

선생님이 PDF(학습지 저장본·수업 자료)를 주고 **"이 내용으로 N차시 만들어줘, 디자인은 무시하고 내용만"** 이라고 할 때 따른다.
`SKILL.md` 의 흐름(확인 → ✋ → spec → ✋ → 조립 → 확인)은 그대로이고, 이 문서는 PDF 에서 오는 차이만 적는다.

원칙
- **내용(질문·안내 문장·표·보기)만 옮긴다.** 색·배치·아이콘은 `docs/rules/design.md` 로 새로 만든다.
- **결정할 것은 선생님께 묻는다**(AskUserQuestion, 한 번에 4개까지, 추천안에 `(Recommended)`). 정한 것은 spec.md 에 날짜와 함께 적는다.
- PDF 가 **학생이 작성해 저장한 판**이면(이름·학번·답이 채워져 있음) 이름·답은 가져오지 않는다. 학생 답은 "정답 후보"로만 보여 주고 확인받는다.

## 1. PDF 읽기

이 PC 에는 Python·poppler 가 없어 Read 도구로 PDF 를 바로 못 연다. pdf.js 를 **scratchpad 에만** 설치해 쪽 그림을 뽑는다.

```
cd <scratchpad>/pdf && npm init -y && npm i pdfjs-dist@4
cp ".claude/skills/lesson-new/references/pdf-pages.mjs" <scratchpad>/pdf/
node pdf-pages.mjs "<PDF 경로>" "<scratchpad>/pdf/l1" 1400
```
- 결과: `l1.txt`(쪽별 글자·그림 수) + `l1-1.png, l1-2.png …` → **모든 쪽**을 Read 로 연다.
- 학습지 저장본은 보통 "쪽마다 그림 한 장, 글자 0"이다. 글자가 있으면 `.txt` 에 나온다.
- 원본 PDF 는 `input/<단원>/` 에 두고 **커밋하지 않는다**(학생 이름 · 한 파일 100MB 한계).

## 2. PDF 요소 → 이 저장소 부품

| PDF 에 나오는 것 | 쓸 부품 | 원본 코드 |
|---|---|---|
| 안내 · 팁 상자 | `.callout--info`(연파랑) · `.callout--reason`(민트) — 콜아웃은 **냉색만** | 01 |
| "AI(제미나이)에게 물어보기" + 답변 요약 | `.callout--gemini`(연보라, **제미나이 전용 색**) + `textarea.blank rows=2` | 01 M1·M3 |
| 같은 이름표를 여러 칸에 끌어 놓기 | 공용 `chip-slot`(`.ca-tray` · `.ca-chip[data-v]` · `.ca-slot[data-answer]` · `#caResult`) | 01 M1, 04 |
| 끌어 놓기 활동이 **여러 개** / **✅ 정답 확인 · 🔀 다시 섞기 버튼**으로 채점 | 같은 `chip-slot` — 활동마다 `<div data-ca-group="이름" data-ca-check="button">` 로 감싸고 안에 `.ca-tray` · 칸 · `button.ca-check` · `button.ca-reset` · `.ca-result`(묶음 없으면 예전처럼 페이지 전체·바로 채점) | 02 M1 ①② |
| 사진 + 이름 + 칸 줄 | `.m1-grid > .m1-row > .m1-pic + .m1-info(.m1-cap + .ca-slot.m1-slot)` — 넓으면 2×2, 700px 이하 1열 | 01 M1 |
| 표 안 빈칸 | `.type-scroll > table.type-table` + `textarea.blank`, 긴 첫 칸은 `style="whiteSpace:normal; wordBreak:keep-all"` | 01 M2·M3 |
| 하나 고르기 퀴즈(누르면 채점) | `FQ` + `fqItems`(여러 문항) · `VQ` + `vqItems`(한 문항, 긴 보기 카드) | 06 형성평가 · 02 M3 |
| 사례마다 "맞다 / 아니다" 고르기(누르면 채점, 여러 문항) | `DQ` + `dqItems`(문항 글 + 보기 2개 + 이유) | 03 M2 |
| **문장 속 빈칸**(정해진 낱말을 글자로 쓰기) | `.st-mean` 안 `textarea.blank.blank--inline` + `style="width:…px"`, 단계별 줄은 `.st-row` | 03 M1·M2 |
| 대화형 사례(❌ 직관 / ✅ 데이터 / → 결정) | `.case-box` · `.case-lbl--no/--ok` · `.case-ar` (굵은 글씨는 `<b>` 말고 `.case-lbl`) | 03 M2 |
| O/X 묶음(고른 뒤 **✅ 정답 확인** 으로 한꺼번에 채점, 🔀 다시 풀기) | `OXQ` + `oxqItems` + `#oxqCheck` · `#oxqReset`, 틀린 문항만 이유 한 줄 | 02 M5 |
| **모두 고르기** 퀴즈("해당하는 것을 모두") | `MQ` + `mqItems` + "✅ 정답 확인" 버튼(`#mqCheck`) | 01 M2 |
| 서술형 | `textarea.blank rows=2` | 01 M3 |
| 그래프 캡처 붙여넣기 | `paste-zone` | 06 |
| 순서 배열 | `seq-order` | 04 |

- 부품 규칙(유일한 `aria-label`, 오답 피드백은 보기마다 이유)은 `docs/rules/components.md` §2.
- 모두 고르기 퀴즈의 피드백: 고른 오답·빠뜨린 정답마다 이유 한 줄 → "정답은 ○○예요."(01 `const MQ = [` 의 `no`/`miss`).

## 3. 선생님께 물을 것 (체크리스트)

| 항목 | 보기 (01 에서 고른 것 **굵게**) |
|---|---|
| 틀 | **4탭**(이용 규칙·시간표·급식·활동지) / 활동지 한 화면(07 처럼) |
| 그림 | PDF 에서 잘라 쓰기 / **새로 그리기(SVG)** / 선생님이 사진 주기 |
| 정답 | PDF(학생) 답을 **그대로 정답** / 일부 바꾸기 |
| PDF 에 없는 자료 | 예: "뉴스로 확인해봅시다"인데 뉴스가 없음 → 문구만 / 링크 넣기 / **문장 빼기** |
| 서술형 예시 답 | **정답지에서 비워 두기** / 예시 답을 써서 확인받기 |
| PDF 에 없던 추가 요소 | 예: **제미나이 열기 버튼**(gemini.google.com 새 탭) — 넣기 전에 묻는다 |
| 공개 | **바로 live** / draft("준비 중" 표시) |

## 4. 폴더 · spec.md ✋

```
npm run new -- <단원>/<차시> --from 01 --title "제목"
```
- 4탭 + 제미나이 상자·끌어 놓기·모두 고르기가 필요하면 `--from 01` 이 가장 가깝다(06 은 그래프 붙여넣기·형성평가 중심).
- spec.md: 원자료 경로(학생 작성본이면 그 사실), 목표, 흐름 표, **카드별 내용은 PDF 문장 그대로**, 정답, 진행률 합계, 결정 사항.

## 5. 조립 (4탭 복사본 기준)

- **바꿀 곳**: `#sheetPrintArea` 안 `TODAY_TOPIC` 카드부터 PDF 버튼 묶음(`<div id="pdfBtn"` 바로 앞 `<div … alignItems:center; gap:12px">`) 전까지.
  `MY_INFO` 카드는 그대로 옮겨 쓴다. 새 본문은 scratchpad 에 HTML 조각으로 쓰고 node 스크립트로 끼워 넣는다.
- **로직**(같은 파일 `class Component`):
  - `state` — 퀴즈 상태(01: `mq, mqTried, mqFb, mqOk`)
  - `_progressParts()` — 셀 것만: 빈칸(`textarea.blank[aria-label]`) + 끌어 놓기 칸(`.ca-slot.is-filled`) + 퀴즈(정답 확인 1번 이상)
  - `renderVals()` — 퀴즈 코드와 `return { … }` 에 넘길 값
- **스크립트로 바꿀 때**: 앵커 문자열이 "정확히 1번" 찾히는지 먼저 확인하고, 파일 줄바꿈(CRLF)을 그대로 쓴다.
- 복사해 온 **안 쓰는 그림**은 지운다(`msi-asset:./assets/…` 로 안 쓰이는 파일).
- **NEIS 스냅샷**이 표식 `/*NEIS_SNAPSHOT_START*/@msi:neis-snapshot/*NEIS_SNAPSHOT_END*/` 인지 확인 —
  가져오기(import)한 차시를 복사하면 옛 데이터가 박혀 있을 수 있다(06 이 그랬음, 2026-09-30 고침).
- `npm run portal-upgrade -- <차시>` — 4탭 화면 규칙(칩 탭·시간표 날짜 카드·급식 ◀ ▶·급식 일간 가운데)이 다 들어갔는지 확인("이미 모두 적용됨"이면 정상).
- 제목·안내 문장에 `word-break: keep-all`(01 의 `.m-title, .m-say`) — 좁은 화면에서 단어 중간이 안 끊기게.

## 6. 그림을 새로 그릴 때 (SVG)

- `assets/<이름>.svg` 로 두고 `<img src="msi-asset:./assets/<이름>.svg" alt="…">` 로 쓴다
  (dc-runtime 템플릿에 SVG 를 직접 넣으면 `stroke-width` 같은 속성 이름이 문제가 될 수 있음).
- ⚠️ **`<svg>` 에 `width`·`height` 를 꼭 적는다** — `viewBox` 만 있으면 화면엔 보여도 **PDF 저장(html2canvas)에서 빈 칸**이 된다.
- 색은 design.md 토큰(선 `#4b3b6b` 3~5px, 파스텔 채움). 01 의 `assets/m1-*.svg` 참고.
- 그림 이름(캡션)이 **정답을 알려 주지 않게**: "디지털 체온계"(✗) → "체온계", 대신 그림 안에 `36.5` 표시처럼 단서를 그린다.

## 7. 확인

1. `npm run check`(공용 `shared/partials` 를 고쳤으면 **전체**) — ✖ 없어야 함.
2. **학생 흉내**(Playwright, 수업 활동지 탭 누른 뒤):
   - 끌어 놓기: 한 칸 일부러 틀리기 → `#caResult` 문구 → 고치기 → "⭕ N칸 모두 정답"
   - 퀴즈: 빈 채로 / 오답 / 정답 각각 피드백, 진행률 숫자가 오르는지
   - 빈칸은 `pressSequentially(…, { delay: 70 })` 로 입력(빠르게 넣으면 안티치트가 되돌림)
   - 선택자에 `:visible` 을 붙인다 — x-dc 가 화면 밖에 **숨은 원본 복제본**을 남긴다.
   - 4탭 틀은 `zoom` 이 걸려 있어 `getBoundingClientRect` 좌표가 어긋난다 → 넘침 여부는 **요소 캡처로 눈 확인**.
   - 폰 폭 360px 가로 스크롤 없음 + 카드 캡처.
3. **정답지**: `answers.json`
   - 끌어 놓기 = 두 번 클릭: `".ca-chip[data-v='아날로그']:visible"`, `"#m1Slot1:visible"`
   - 모두 고르기 = `"#mq-image:visible"`, `"#mq-sound:visible"`, `"#mqCheck:visible"`
   - 묶음 끌어 놓기 = `"[data-ca-group='m1a'] .ca-chip[data-v='.txt']:visible"` → `"#m1a-1-ext:visible"` … → `"#m1aCheck:visible"`(02 answers.json)
   - 서술형 정답이 없으면 활동지의 70% 확인을 `if (_pct <= 70 && !window.__MSI_ANSWER_SHEET)` 로(`lesson-teacher` 스킬 참고).
   - `npm run teacher -- <차시>` → 정답지 PDF 를 `pdf-pages.mjs` 로 쪽 그림 뽑아 **그림·정답 칸이 들어갔는지** 눈으로 확인.
4. README "차시 목록" 한 줄, `lesson.json` 의 `status`.
