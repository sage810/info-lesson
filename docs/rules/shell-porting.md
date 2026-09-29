# 활동지 한 장(sheet)을 4탭 틀(portal)에 옮겨 담기

> 예: 6차시(`shell: sheet`)를 이용규칙·시간표·급식 탭이 있는 4탭 화면으로 바꾸고 싶을 때.
> 아래는 5차시를 4탭 틀로 옮길 때(2026-09) 실제로 쓴 절차입니다. 파일 이름은 개편 전 이름이에요 —
> "탭 있는 파일" = 4탭 차시의 `lesson.html`(예: 05), "탭 없는 활동지" = 옮길 차시의 `lesson.html`.
> 지금 구조에서는 두 `lesson.html` 이 이미 작아서(폰트·라이브러리가 빠져 있음) 문자열 치환이 훨씬 쉬워요.
> 옮긴 뒤 `lesson.json` 의 `"shell"` 을 `"portal"` 로 바꾸고, `npm run check -- <차시>` 로 확인하세요.
> 4탭 셸은 지금 차시(04·05·06)에서 가져온다 — 급식 일간이 `docs/rules/portal/lunch.md` §5.3 모양(`m.hasAl`)인 판이다.

## 4탭 셸에 다른 활동지 이식 (탭 있는 파일 ← 탭 없는 활동지)

**용도**: 「이용 규칙·시간표·오늘의 급식·수업 활동지」 4탭 셸을 가진 파일(예: `data4_5.html`)에,
탭이 없는 단일 활동지 파일(예: `data5_2.html`, `#sheetPrintArea` 만 있는 자체완결본)의
**수업 활동지 내용만** 갈아끼워, 셸은 4탭 버전 그대로 두고 활동지는 새 차시로 바꾼 파일을 만든다.
(2026-09 `data5_2.html` = data4_5 셸 + data5 데이터 시각화 활동지 로 생성.)

### 두 파일의 구조 차이

| | 4탭 셸 파일 (BASE) | 활동지-only 파일 (SHEET 출처) |
|---|---|---|
| 탭 | `<sc-if isRules/isTime/isMeal/isSheet>` 4개 | 없음 — `#sheetPrintArea` 가 `<div style="padding:24px 22px 30px">` 직속 |
| Component | 탭·시간표·급식·NEIS 스냅샷 + 활동지 진행률 전부 | 활동지 진행률(`_progressParts`)·형성평가(`fq`)·`savePdf` 만 |
| 진행률 위젯 | `style="display:{{ sheetWidgetDisplay }}"` (탭 게이팅) | `style="display:flex"` (항상) |
| 줄바꿈 | `data4_5.html` = LF | `data5_2.html` = CRLF ← **읽는 즉시 `-replace "\`r\`n","\`n"`** |
| 헬퍼 스크립트 | seq·ca·autoGrowBlank (동일) | + `[data5] .paste-zone` 스크립트(CODAP 붙여넣기) |

### 이식 절차 (문자열 치환 → 마지막에 DOM 스왑)

BASE 문자열 `$a` 를 LF 정규화한 뒤, **유일 매치** 문자열 치환을 순서대로 건다(각 치환 전
`[regex]::Matches(...).Count -eq 1` 확인 — 0 이나 2 면 앵커 문자열이 루틴 출력 변화로 어긋난 것이니 멈추고 고친다).
치환 앵커는 아래 목록의 주석·들여쓰기까지 그대로 복사해 쓴다.

1. **CSS 병합** — SHEET `<helmet><style>` 의 활동지 전용 규칙 블록(`.m-card`·`.callout`·`.type-table`·
   `.cap-guide`·`.shot-ph`·`.paste-zone`·`.pz-*`·`.rel-shapes`·`.miniflow`·`.key-list`·
   `ol.step-list`·`@media print` 추가분)을 BASE 의 `</style>\n</helmet>` 바로 앞에 삽입.
   - 경계: SHEET helmet 에서 `background-image: none !important;\n    }\n  }\n` 다음 ~ `</style>\n</helmet>` 앞.
2. **state 에 `fq: [null, null, null]` 추가** (형성평가용).
3. **`_watchSheetActivities` 의 진행률 시그니처**를 `this.sheetProgress()...` → `this._progressParts()` 기반으로,
   `paste`/`click` 리스너를 `.shot-paste` 한정 → 전역으로 교체.
4. **`_progressParts()` 메서드 신설** — `#sheetPrintArea` 안의 `textarea.blank[aria-label]` +
   `.paste-zone`(`_imgData`/`is-filled`) + `state.fq` 를 `{done,total}` 로 집계. (`pickInfoClass` 메서드 앞에 삽입.)
5. **`renderVals()` 활동지 진행률 구간 교체** — data4 의 `sheetProgress()` 배열 집계 →
   SHEET 의 `FQ`/`fqChipStyle`/`fqPick`/`fqItems` 블록 + `_progressParts()` 기반 `sheetDone/Total/Pct/...`.
   `sheetWidgetDisplay`(탭 게이팅) 줄은 **BASE 것 유지**.
6. **return 객체에 `fqItems` 추가.** (data4 의 `q1`·`a3Items`·`oxItems` 등은 지우지 않아도 무해 — 바인딩이 없어 죽은 값.)
7. **`savePdf` 를 SHEET 버전으로 교체** — 이름 미입력·진행률 ≤70% 제출 가드, 표 셀 안 늘어난 빈칸
   `scrollHeight` 고정, `.pz-controls` 숨김이 들어 있어 CODAP 활동지에 맞다.
8. **`[data5] .paste-zone` 헬퍼 스크립트**를 파일 맨 끝 `</script>\n</body>` 앞에 삽입.
9. **DOM 스왑 (맨 마지막, 위 치환들로 오프셋이 밀린 `$a` 에서 새로 계산)** —
   `<div id="sheetPrintArea"` 부터 `<div>`/`</div>` 깊이 카운트로 닫는 `</div>` 까지가 활동지 노드.
   BASE 의 그 노드를 SHEET 의 같은 노드로 통째 치환. **`<sc-if isSheet>` 래퍼는 BASE 것 그대로** 둔다.

푸터+위젯 구간(`<div id="appFooter">` ~ `</x-dc>`)은 위젯 `display` 한 줄 빼고 두 파일이 동일 → BASE 유지.

### 검증 (헤드리스 크롬, §5 방식)

```bash
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
# 기본(규칙) 탭 + state.tab 을 'sheet' 로 바꾼 임시본, 둘 다
sed "s/tab: 'rules', timeView:/tab: 'sheet', timeView:/" output/dataX.html > "$SCRATCH/t_sheet.html"
for f in "C:/.../output/dataX.html" "C:/.../t_sheet.html"; do
  "$CH" --headless=new --disable-gpu --no-sandbox --run-all-compositor-stages-before-draw \
    --virtual-time-budget=40000 --dump-dom "file:///$f" 2>err.log >dom.html
  grep -icE "SyntaxError|Uncaught|is not defined|TypeError|ReferenceError" err.log   # 0 이어야
done
```
- **file URL 은 반드시 `file:///C:/...` (윈도우 경로)** — `/c/...` POSIX 경로는 크롬이 못 열고 오류 페이지를 준다.
- 확인: 규칙 탭 스샷에 4탭(이용 규칙/시간표/오늘의 급식/수업 활동지) · sheet 임시본 스샷에 새 활동지 전체
  (제목·MY_INFO·미션 카드·CODAP 안내·형성평가·붙여넣기 칸·진행률 위젯 `0/N`).
