# teacher.md — 교사용 정답본 (HTML + PDF) 생성

> 🗂 **작업 기록(이력) 문서입니다.** 당시의 파일명·에이전트 이름(builder-agent 등)이 나오지만 지금 구조와는 다를 수 있어요. 규칙은 `docs/rules/`, 작업 방법은 `README.md`·`.claude/README.md` 를 보세요.


수업 활동지(`output/dataN.html` 계열)의 **교사용 정답본**을 만드는 절차와 재사용 스크립트를 정리한다.
산출물은 두 개:

| 파일 | 무엇 |
|---|---|
| `output/dataN_teacher.html` | 원본(`dataN.html`)에서 **진행률 고정 위젯만 제거**한 복제본. **답은 안 채운다** — 빈 활동지. 정답 주입 스크립트를 여기에 넣지 않는다. |
| `output/dataN_teacher.pdf` | `_teacher.html` 을 **PDF 렌더 직전에만** 정답 주입한 임시본으로 인쇄한 PDF (배포·출력용 정답지). |

> 정답 주입은 **PDF 를 뽑을 때만** `output/` 밖 임시 사본에 적용하고 버린다. `output/` 에는 답 없는
> `_teacher.html` 과 답 있는 `_teacher.pdf` 두 개만 남는다.
>
> 현재 산출물: `data5_1_teacher.pdf`(구 버전) · `data5_2_teacher.html`(답 없음) + `data5_2_teacher.pdf`(정답).

---

## 1. 절차 요약

### 1-A. `output/dataN_teacher.html` — 배포용, 답 없음
1. `cp output/dataN.html output/dataN_teacher.html`
2. **진행률 고정 위젯 제거** — `<!-- … 활동 진행률 … --> <div class="sheet-progress" …>…</div>` 블록을 통째로 삭제
   (`</x-dc>` 바로 앞에 있음). `<style>` 안 `.sheet-progress*` 규칙은 남겨도 무해(요소가 없어 아무 일 안 함).
3. **끝.** 정답 주입 스크립트는 여기 넣지 않는다 — 이 파일은 답이 안 채워진 빈 활동지여야 한다
   (원본과의 diff 가 위젯 블록 딱 하나뿐이어야 정상).

### 1-B. `output/dataN_teacher.pdf` — 정답지
4. `cp output/dataN_teacher.html <scratch>/dataN_fill.html` — **임시본**(`output/` 밖, 스크래치패드).
5. 임시본 `</body>` **바로 앞**에 정답 주입 `<style>`+`<script>` 삽입 (§2 내용, §3 명령). 이 스크립트가 렌더 후
   `textarea.blank` 를 정답으로 채우고, 형성평가 정답을 표시하고, 상단에 배너를 단다.
6. **PDF 렌더** — 임시본을 헤드리스 크롬 `--print-to-pdf` 로 `output/dataN_teacher.pdf` 생성 (§4).
7. 임시본은 버린다. `output/` 에는 `dataN_teacher.html`(답 없음)·`dataN_teacher.pdf`(정답) 만.
8. **검증** — 헤드리스 스크린샷으로 눈으로 확인 (§5).

### 채우지 않는 것 (의도적 제외)
- **CODAP 그래프 붙여넣기 칸**(`.paste-zone`) — 학생이 화면 캡처해 붙이는 활동이라 "정답"이 없다. 빈 상태로 둔다.
- **MY_INFO**(학년·반·번호·이름) — 학생마다 다른 식별칸. 비운다. (셀렉터가 `textarea.blank[aria-label]` 라
  `aria-label` 없는 MY_INFO 칸은 자동 제외됨.)

---

## 2. 정답 주입 스크립트 (§1-B 임시본의 `</body>` 앞에 붙이는 블록 — `_teacher.html` 에는 넣지 않음)

```html
<style>
  textarea.blank.teacher-ans{
    color:#c0392b !important; -webkit-text-fill-color:#c0392b !important;
    font-weight:700 !important; background:#fff5f3 !important; border-color:#c0392b !important;
  }
  .teacher-banner{
    margin:0 0 14px; padding:10px 16px; border:3px solid #c0392b; border-radius:12px;
    background:#fdecea; color:#8f2419;
    font-family:'CookieRun', Apple SD Gothic Neo, Malgun Gothic, Noto Sans KR, sans-serif; font-weight:700; font-size:15px;
    display:flex; align-items:center; gap:8px;
  }
  .teacher-banner .sm{ font-weight:400; font-size:13px; color:#b04a3a; }
  @media print{
    textarea.blank.teacher-ans{ color:#c0392b !important; -webkit-text-fill-color:#c0392b !important;
      background:#fff !important; border:2px solid #c0392b !important; }
  }
</style>
<script>
(function () {
  // aria-label → 정답. 클로즈 빈칸은 원문 정답 단어, 서술형(그래프 해석/나의 결정)은 데이터 기반 모범답안.
  var ANS = {
    "M1 시각화 개념 빈칸: 데이터를 바꾸는 대상": "그래프",
    /* … 전체 목록은 dataN 의 aria-label 을 grep 해서 채운다 … */
    "M3 나의 결정": "격투·바위 타입은 평균 공격력이 높아 …"
  };
  // 형성평가: 질문 키워드 → 정답 선택지 텍스트
  var QUIZ = [
    { kw: "계절", ans: "구성 분석" },
    { kw: "평균 키", ans: "비교 분석" },
    { kw: "타입별로 나누면", ans: "구성 분석" }
  ];

  function fill() {
    var list = document.querySelectorAll('textarea.blank[aria-label]'), n = 0;
    for (var i = 0; i < list.length; i++) {
      var el = list[i], k = el.getAttribute('aria-label');
      if (!Object.prototype.hasOwnProperty.call(ANS, k)) continue;
      if (el.value !== ANS[k]) { el.value = ANS[k]; el.dispatchEvent(new Event('input', { bubbles: true })); }
      el.classList.add('teacher-ans');
      n++;
    }
    return n;
  }
  function markQuiz() {
    var spans = document.querySelectorAll('span'), n = 0;
    for (var q = 0; q < QUIZ.length; q++) {
      var host = null;
      for (var i = 0; i < spans.length; i++) {
        var tx = spans[i].textContent || '';
        if (tx.indexOf(QUIZ[q].kw) !== -1 && tx.length < 130 && /\?$/.test(tx.trim())) { host = spans[i].parentElement; break; }
      }
      if (!host) continue;
      var cand = host.querySelectorAll('span');
      for (var j = 0; j < cand.length; j++) {
        if ((cand[j].textContent || '').trim() === QUIZ[q].ans && !cand[j].__tmark) {
          cand[j].__tmark = 1;
          cand[j].style.outline = '3px solid #1e8449';
          cand[j].style.outlineOffset = '2px';
          cand[j].style.background = '#e8f8ef';
          var tag = document.createElement('span');
          tag.textContent = ' ✓정답';
          tag.style.cssText = 'color:#1e8449;font-weight:700;font-size:12px;white-space:nowrap';
          cand[j].parentNode.insertBefore(tag, cand[j].nextSibling);
          n++; break;
        }
      }
    }
    return n;
  }
  function banner() {
    if (document.querySelector('.teacher-banner')) return;
    var host = document.querySelector('.wrap, .win-body, body') || document.body;
    var b = document.createElement('div');
    b.className = 'teacher-banner';
    b.innerHTML = '🔑 교사용 정답본 · <제목>' +
      '<span class="sm">빨간 글씨 = 정답 / 서술형은 예시 모범답안 · CODAP 그래프 붙여넣기 칸은 제외</span>';
    host.insertBefore(b, host.firstChild);
  }
  // React(dc-runtime) 하이드레이션을 기다리며 폴링 → 다 되면(또는 상한) 정지
  var tries = 0, iv = setInterval(function () {
    var n = 0, qn = 0;
    try { n = fill(); } catch (e) {}
    try { banner(); } catch (e) {}
    try { qn = markQuiz(); } catch (e) {}
    if ((n >= /*빈칸수*/ 33 && qn >= QUIZ.length && document.querySelector('.teacher-banner')) || ++tries > 70) clearInterval(iv);
  }, 120);
  window.addEventListener('load', function () { try { fill(); banner(); markQuiz(); } catch (e) {} });
})();
</script>
```

### ANS 맵 만들기
```bash
grep -oE 'aria-label="(M[0-9][^"]*)"' output/dataN.html | sed 's/aria-label=//' | sort -u
```
- 나온 `aria-label` 전부에 정답을 매핑한다. 하나라도 빠지면 그 칸만 안 채워짐(에러는 안 남).
- **클로즈 빈칸**: 원본에서 빈칸으로 바꾸기 전 원문 단어 그대로.
- **서술형**(`… 그래프 해석`, `… 나의 결정`): `input/포켓몬.txt`(또는 그 활동지의 데이터셋)로 실제 계산한
  값을 넣은 1~2문장 모범답안. 정답만 통보하지 말고 근거(수치·이유)를 함께.

---

## 3. 명령 (perl)

### 3-A. `_teacher.html` — 위젯만 제거 (output/ 에 저장)
```bash
cp output/dataN.html output/dataN_teacher.html

# 진행률 위젯 블록 삭제 ( "<!-- … 활동 진행률 …" 주석부터 그 div 의 </div> + </x-dc> 직전까지 )
perl -0777 -i -pe 's{\r\n<!-- \[design\.md §10\] 활동 진행률[^\r\n]*\r\n<div class="sheet-progress".*?</div>\r\n</x-dc>}{\r\n</x-dc>}s' output/dataN_teacher.html

# 확인: 원본과의 diff 가 위젯 블록 하나뿐 · sheet-progress 마크업 0 · <div> 균형
diff <(tr '>' '\n' < output/dataN.html) <(tr '>' '\n' < output/dataN_teacher.html) | grep -E '^[<>]' | grep -v '^[<>] *$'
grep -c 'class="sheet-progress"' output/dataN_teacher.html   # 0
```

### 3-B. 임시본 — 정답 주입 (scratch, output/ 밖)
```bash
SCR="$SCRATCH/dataN_fill.html"          # 스크래치패드 경로
cp output/dataN_teacher.html "$SCR"

# §2 블록을 저장해 둔 파일(teacher_inject.html)을 임시본의 "마지막" </body> 앞에 삽입
perl -0777 -e '
  my($inj,$html)=@ARGV;
  open F,"<:raw",$inj; local $/; my $x=<F>;
  open G,"<:raw",$html; my $d=<G>;
  my $m="</"."body>";
  $d=~s{(.*)\Q$m\E}{$1$x\n$m}s or die "no </body>";   # ★ 반드시 "마지막" </body> — jsPDF 코드에 리터럴 </body> 가 있음
  open O,">:raw",$html; print O $d;
' "$SCRATCH/teacher_inject.html" "$SCR"
```
- **`(.*)</body>` 로 마지막 것에 매칭**하는 게 핵심. `s{</body>}{…}` 는 파일 앞쪽 jsPDF 문자열 안의
  `</body>` 를 먼저 잡아 스크립트가 JS 문자열 한가운데 박힌다(과거 실수).
- CRLF 파일이라 정규식에 `\r\n` 을 쓴다.
- 주입은 **`$SCR`(임시본)에만**. `output/dataN_teacher.html` 은 건드리지 않는다.

---

## 4. PDF 렌더 (헤드리스 크롬)

```bash
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"   # 또는 Edge
"$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
  --run-all-compositor-stages-before-draw --virtual-time-budget=50000 --no-pdf-header-footer \
  --print-to-pdf="C:\\…\\output\\dataN_teacher.pdf" \
  "file:///C:/…/<scratch>/dataN_fill.html"      # ← 정답 주입된 임시본 (output/ 의 _teacher.html 아님)
```
- `--print-to-pdf` 는 `@media print` CSS 를 쓰므로 `textarea.blank` 값이 그대로 렌더된다
  (in-app "PDF로 저장하기"의 html2canvas 경로와 달리 textarea 글자가 안 잘림).
- `--virtual-time-budget` 은 하이드레이션 + 폰트 + 주입 폴링(≤~9s)을 덮을 만큼 크게(45000~50000).
- 세로로 긴 활동지는 자동으로 A4 여러 장으로 잘린다. data5_2_teacher = 8쪽 · ~1.8MB.

---

## 5. 검증

```bash
# JS 에러 0 (임시본 · output/ _teacher.html 둘 다)
"$CHROME" --headless=new --disable-gpu --no-sandbox --virtual-time-budget=20000 --dump-dom \
  "file:///…/<scratch>/dataN_fill.html" 2>err.log >/dev/null
grep -icE "SyntaxError|Uncaught|is not defined" err.log     # 0 이어야

# 전체 스크린샷 → 잘라서 눈으로 (정답 확인은 임시본으로)
"$CHROME" --headless=new … --window-size=920,15000 --screenshot="shot.png" "file:///…/<scratch>/dataN_fill.html"
```
확인 항목 — **임시본(`dataN_fill.html`) 기준** 1~3·5~6, **`output/dataN_teacher.html` 기준** 4:
1. 상단에 "🔑 교사용 정답본" 배너.
2. 모든 클로즈·서술형 빈칸이 **빨간 글씨**로 차 있음(`.teacher-ans`).
3. 형성평가 정답 선택지에 초록 테두리 + `✓정답`.
4. `output/dataN_teacher.html` 을 열어도 **진행률 고정바가 화면 어디에도 없음** (그리고 §2 배너·빨간 답이 **안** 보여야 정상 — 답 없는 배포본).
5. **CODAP "여기에 …붙여넣으세요" 칸은 빈 점선 상자 그대로**.
6. MY_INFO(이름 등)는 비어 있음.

---

## 6. 원본이 바뀌면 재생성

1. §3-A 재실행 → `output/dataN_teacher.html` 새로 생성(위젯만 제거).
2. `grep` 으로 `aria-label` 목록 다시 뽑아 **새 빈칸이 있으면 ANS 맵에 추가**. 미션이 추가/삭제됐으면
   `QUIZ` 배열·`n >= 33` 상한 숫자도 맞춘다.
3. §3-B(임시본 주입) → §4(임시본 → PDF) 재실행.

원본(`dataN.html`)도 `output/dataN_teacher.html` 도 정답 주입으로 오염시키지 않는다 — 주입은 스크래치 임시본에만.

---

## 7. 4탭 셸에 다른 활동지 이식 (탭 있는 파일 ← 탭 없는 활동지)

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
