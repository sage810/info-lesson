# 수행평가(시험지) — 규칙과 자동 제출·채점(A+B)

수행평가 시험지를 만들고, 학생 답을 **자동으로 모아(A) · PDF 로도 꺼내(B) · 시트 한 곳에서 채점**하는 방법.
본보기는 `lessons/data-analysis/09`(데이터분석 수행평가 A형, 2026-10-02~04). 순서대로 만들 때는 스킬 **`lesson-exam`** 을 쓴다.

```
학생 "PDF로 저장하기"
 ├─ PDF 내려받기 ── 문서 정보(Keywords)에 답 기록을 숨겨 넣음 ─────────────── B
 └─ Apps Script 로 자동 전송(답 기록 + PDF + 그래프 작은 사본) ─────────────── A
        성공 → 시트 "제출 기록" 첫 탭에 한 줄          실패 → "다시 보내기" → 그래도 안 되면 USB 로 PDF
                                                         → npm run exam-pdf -- <폴더> --send (같은 길로 들어감)
선생님: npm run exam-key 로 정답 → 시트 "정답 <차시>" 탭 / 채점 도우미 페이지에서 채점하기 · 반별 그래프 점수
```

## 1. 꼭 지킬 것 — 저장소가 공개

- **정답은 `answers.json` 에만.** `lesson.html` 에 정답·채점·맞음/틀림 표시·`data-answer` 를 넣지 않는다(주석에도).
  `spec.md` 에도 정답을 적지 않는다(“정답은 answers.json 에만”이라고만 적는다). `apps-script/Code.gs` 에도 넣지 않는다.
- **`.gitignore`**: `answers.json` 은 영구히, 차시 폴더 전체는 시험 날까지. **정답을 쓰기 전에** 두 줄부터 넣는다.
  ```
  lessons/<단원>/<차시>/
  lessons/<단원>/<차시>/answers.json
  ```
- **정답 노출 검사**(고칠 때마다): 빌드 뒤 `answers.json` 의 정답·허용 답 문자열(3글자 이상, `#q2-1` 같은 선택자 제외)을
  `dist/pages/<단원>/<차시>/` 의 html·js 와 `apps-script/Code.gs` 에서 찾아 **0개**인지 본다. 보기 id 가 마크업에 있는 것은 정상.
- **시험 자료를 실제 Apps Script 로 보내며 시험하지 않는다.** 선생님 드라이브에 쌓인다. 화면 시험은 Playwright `page.route` 로,
  명령 시험은 `fetch` 를 가짜로 바꿔(`node --import <가짜 fetch>`) 가로챈다.

## 2. 시험지 화면 (09 틀)

`shell: standalone` 한 화면. 09 `spec.md` "선생님 결정" 표가 기준이고, 화면 결정은 이렇다.

- **차분한 톤**: design.md 토큰 그대로 + 채도 낮은 예비 파스텔. 09 만 쓰는 옅은 색은 `:root` 한 곳에 이름 붙여 둔다.
- **문항**: 번호는 Q 태그(Q1…), 보기는 둥근 네모 번호 배지(고르면 반전), 분석 유형은 칩(고르면 반전), 순서는 빈 점선 칸 + 버튼.
  맞음·틀림은 절대 보여 주지 않는다.
- **학생 정보**: 학년·반·번호·이름 칸. 필수는 **이름만**(09 결정).
- **답 보관**: localStorage, **첫 입력부터 45분** 지나면 열 때 지움(공용 PC 다음 반 대비). PDF 저장하면 지움. "답 모두 지우기" 버튼은 없음.
- **시험 기능**: 답 글자 칸 붙여넣기·끌어 놓기 막기, 그래프 칸은 그림만(포커스 때 깜박이는 커서), 나가기 경고(저장 안 했거나 보내는 중).
- **도움말**: 왼쪽 안내 카드 버튼(CODAP·캡처) → 평소 숨긴 NOTICE 가 나타나 펼침 → 닫으면 원래 스크롤·버튼으로.
- **PDF**: html2canvas + jsPDF, 문항·소문항·카드 경계에서 쪽 나눔, 안 푼 문항 목록 확인, 파일 이름 `학년반번호 이름 …`.
- **저장 버튼 위 안내 한 줄**, 아래에 저장 결과 줄(`#saveStatus`)과 제출 상태 줄(`#submitStatus`).

## 3. 시험지 구조 약속 — 코드(기록·채점·정답 표)가 기대는 것

채점하는 칸마다 `data-unit="<칸 이름>"` 을 **하나** 둔다. 칸 이름이 곧 시트·정답 표·배점의 열쇠다(소문항은 `4-(1)` 처럼).

| 종류(kind) | 마크업 | 기록 값 | 채점 |
|---|---|---|---|
| `one` 하나 고르기 | `[data-unit]` 안 `button[data-group][data-v]` (aria-pressed) | 고른 `data-v` | 정답과 같으면 ○ |
| `set` 여러 개 | 위 + 버튼에 `data-multi` | `1,3,5` (화면 순서) | 순서 무관, **전부 같아야** ○(부분 점수 없음) |
| `order` 순서 | `.order[data-unit]` 안 `.os` 칸, 고르는 `.oc[data-v]` | `c,d,a,b` | 순서까지 같아야 ○ |
| `text` 글자 | `textarea.blank[data-unit][aria-label]` | 적은 글 | 앞뒤 공백·대소문자 무시, 정답 또는 허용 답 중 하나 |
| `graph` 그래프 | `.pz[data-unit]` (role=button) | 넣었으면 `그래프` | 선생님이 직접 |

- 학생 정보 칸: `textarea[aria-label="학년|반|번호|이름"]` (data-unit 없음).
- 버튼·줄: `#pdfBtn` · `#saveStatus` · `#submitStatus`.
- **`window.MSI_SUBMIT`** (시험지 스크립트가 만든다)
  - `collect()` → `Promise<{ record, graphs }>` — 보낼 기록과 그래프 작은 사본(가로 900px JPEG, `{ "9-(2)": "data:image/jpeg;base64,…" }`)
  - `onResult(state, retry)` — `'sending' | 'ok' | 'fail'`, 실패 때 `retry()` 로 다시 보내기
  - `describe()` → `[{ unit, kind, label }]` — 정답 표 만들 때(exam-key)만
  - `lastRecord` — PDF 에 넣은 기록(보내는 기록과 저장 시각까지 같게)
- **지금은 이 코드가 09 `lesson.html` 안에 있다**(`record()` 의 차시 이름·보관 키도 09 로 적혀 있음).
  **두 번째 시험지를 만들 때 먼저 `shared/partials/exam.js` 로 빼서** 두 시험지가 같이 쓰게 한다(선생님께 확인 후).

## 4. 답 기록(msi-answers v1) — A 와 B 가 같은 모양

```json
{ "v": 1, "lesson": "data-analysis/09", "savedAt": "2026-10-05T00:39:28.575Z",
  "student": { "grade": "2", "cls": "3", "no": "7", "name": "홍길동" },
  "answers": { "1": "a,b,c,d", "2": "1", "3": "2,4", "4-(1)": "예시", "9-(2)": "그래프", "10-(3)": "" } }
```
(값은 예시 — 실제 정답 아님.) PDF 에는 문서 정보 `Keywords` = `msi-answers:v1:` + base64(UTF-8 JSON) 로 들어간다(`exam-pdf` 가 읽음).

## 5. answers.json — 이 PC 에만

```json
{
  "name": "교사용 정답지",
  "fill":  { "4-(1) 답": "예시 답" },
  "click": ["#q1-b", "#q1-a", "#q2-3", "#q3-2", "#q3-4"],
  "_채점_허용답": { "4-(1) 답": ["예시 답", "예시답"] },
  "_채점_배점":   { "기본": 1, "9-(1)": 2 }
}
```
- `fill`·`click` 은 정답지 PDF(`npm run teacher`)와 정답 표(`npm run exam-key`)가 같이 쓴다. **click 은 선택자 문자열만**, 순서 문항은 누를 차례대로.
- `_채점_허용답` 키는 글자 칸의 `aria-label`. `_채점_배점` 에 없는 칸은 `기본`. 그래프 칸 배점도 여기 적는다(직접 채점 만점).

## 6. 구성 파일

| 파일 | 역할 |
|---|---|
| `lessons/<단원>/<차시>/lesson.json` | `"submit": true` → **이 차시만** 자동 제출 켬(`site.config.json` 의 `submit` 은 전체용, 보통 false) |
| `shared/runtime/msi-hook.js` | PDF 저장을 가로채 Apps Script 로 보냄(3번 재시도). `MSI_SUBMIT` 이 있으면 그 기록·화면을 씀. 교사용 화면에선 꺼짐 |
| `scripts/lib/render.mjs` | 빌드 때 `MSI_CONFIG`(apiUrl·submit·token) 를 페이지에 넣음 |
| `apps-script/Code.gs` | 제출 받기(학생 정보·저장 시각·출처·그래프 사본) · `setKey` · 채점 · 채점 도우미 페이지 — 정답 없음 |
| `scripts/exam-key.mjs` | `npm run exam-key -- <차시> [--send]` 정답 표 확인·보내기(선생님 열쇠 필요) |
| `scripts/exam-pdf.mjs` | `npm run exam-pdf -- <폴더> [--send]` USB PDF 의 숨은 답 확인·보내기 |
| `apps-script/teacher.local.json` | `{"teacherKey":"…"}` — 이 PC 에만(gitignore) |

## 7. 채점 (시트)

- 탭: 첫 탭 **제출 기록**(원본) · **정답 <차시>**(exam-key) · **채점 <차시>** · **그래프 점수 <차시>** · **문항 분석 <차시>** (`<차시>` = `data-analysis-09`).
- **같은 학생**(학년·반·번호·이름)은 **저장 시각이 가장 늦은 것** 하나. 웹·PDF 어느 쪽이든 같다(같은 PDF 를 두 번 보내도 한 번).
- 채점 탭: 반·번호 순, 칸마다 `○ 값`/`✕ 값`, 자동 점수, 그래프 칸은 그래프 점수 탭을 읽는 수식, 총점. **반·번호 없음**·**같은 이름**은 노란 줄.
- 다시 "채점하기"를 눌러도 그래프 점수는 남는다(따로 탭).
- 채점 규칙은 `Code.gs` 의 순수 함수(`scoreUnit_`·`pickLatest_`·`buildGrade_`) — 고치면 Node `vm` 으로 불러 가짜 정답·가짜 학생으로 시험한다.

## 8. 선생님 체크리스트

자세한 클릭 순서는 `apps-script/README.md` "수행평가 자동 제출·채점".

- **시험 전**: (Code.gs 를 바꿨으면) 새 버전 배포 · 스크립트 속성 `TEACHER_KEY` · `teacher.local.json` · `npm run exam-key -- <차시>` 로 배점 합계 확인 → `--send` ·
  선생님이 학생처럼 한 번 제출해 리허설.
- **시험 뒤**: 채점 도우미(`웹앱주소?action=teacher&key=…`) → 채점하기 → 반별 그래프 점수 · 실패 학생 PDF 는 `npm run exam-pdf -- <폴더> --send`.

## 9. 시험 날 공개하기

1. `.gitignore` 에서 차시 폴더 줄만 지운다(`answers.json` 줄은 남긴다).
2. `lesson.json` 의 `status` 를 `live` 로. 3. `git status` 로 `answers.json` 이 안 잡히는지 확인 → commit · push.

## 10. 알려진 한계

- 실제 Apps Script·드라이브·시트 동작은 이 PC 에서 시험할 수 없다 → 리허설이 꼭 필요.
- Apps Script 동시 실행은 계정당 30건 — 수업 끝 몰림은 재시도·다시 보내기·USB 로 대비.
- PDF 로 들어온 학생은 그래프 사본이 없다 → 채점 도우미의 "PDF 열기"로 보고 점수.
- 45분 보관은 "열 때" 지운다. 시크릿 창이나 다른 브라우저로 열면 보관한 답이 안 보인다.
- 숨은 기록은 이론상 고칠 수 있다(중학생 시험에선 낮은 위험) — 의심되면 PDF 화면과 대조.

이력: 09 만들기(2026-10-02) · 피드백·검수 반영과 45분 보관(10-03) · 채점 설계 결정과 A+B 구현(10-04).
