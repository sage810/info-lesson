# 작업 규칙

## 시작할 때

1. `git status` 로 변경사항 확인 — 커밋 안 된 게 있으면 먼저 알린다.
2. 충돌 위험이 없으면 `git pull`.
3. `node_modules` 가 없으면 `npm install` (처음 한 번. 브라우저 검사용 playwright-core 만 설치됨).
4. `.claude/napkin.md`(이 저장소에서 반복된 실수·요령)를 읽고 따른다 — napkin 스킬. 새로 배운 요령은 거기에 정리한다.

## 구조 한눈에

- **고치는 곳**: `lessons/<단원>/<차시>/lesson.html` (작은 소스) · `assets/` · `answers.json` · `spec.md` · `lesson.json`
- **공용**: `shared/` (폰트·라이브러리·여러 차시가 같이 쓰는 그림·동작 스크립트) — 바꾸면 모든 차시에 영향
- **배포본**: `dist/` — `npm run build` 결과. **손으로 고치지 않는다**(git 에도 안 올라감)
- **규칙 문서**: `docs/rules/` (디자인·활동 유형·PDF·임베드·수행평가 `exam.md`·교사용 `teacher.md` — 교사용엔 왼쪽 고정바 절대 없음 · 새 활동지 순서 `order.md` — 도입·전개·정리 · 역할→색 표 `color-map.md`(자동 생성)) · 이력: `docs/log/`
- **새 차시 틀**: `lessons/_templates/order`(사이트에 안 올라감, = ai/01 「인공지능이란?」 2026-10-18) — `npm run new -- <단원>/<차시>` 의 **기본**(선생님 결정 2026-10-16: 새 차시는 지금 틀 그대로, 본문만 바꿈).
  **부품 모양 규칙 `docs/rules/parts.md`**(글자만 제목 · 가운데 정렬 · 이름표 2열 · 개념 표/카드 · O/X 즉시 채점 · 핵심 정리 이름표 · SVG 글꼴 · 그림+영상).
  미리보기 `npm run template-preview`. 색은 역할 토큰 `var(--msi-role-…)`, 유리·움직임·손가락 크기는 `--msi-glass-*`·`--msi-motion-*`·`--msi-size-touch-min`.
  바꿀 땐 `design/tokens.json`(role·glass·motion·size) → `node design/build.mjs`(틀·07·틀에서 만든 차시까지 함께 바뀜). 틀의 부품을 고치면 ai/01 도 같이.
- **버튼은 모두 오로라 유리 알약**(선생님 지시 2026-10-16): 일반 `glass-pill` · 고르기 `glass-chip` — 기준 `DESIGN.md`(The Aurora Pill Rule)·`docs/rules/order.md` §2-1.
  예외(지금 모양 유지): 메뉴 탭 · 보기 버튼(일간/주간/월간) · 급식 ◀ ▶ · HELP 버튼 · 태블릿 도움말 버튼.
- **다른 웹앱용 디자인 토큰**: `design/` (`tokens.json` 원본 → `node design/build.mjs` → `tokens.css`·`preview.html`, 부품 `components.css`, 이름은 모두 `msi-`). 활동지 디자인 값을 바꾸면 여기도 맞춘다.
- **스킬 목록·사용법**: `.claude/README.md`(우리 스킬) · `.claude/external-skills.md`(가져온 외부 스킬) · 사람용 안내: `README.md`

## 꼭 지킬 것

- **결정해야 할 사안이 있으면 반드시 선생님께 먼저 물어본다**(선생님 지시 2026-10-02) — 혼자 정하고 진행하지 않는다.
  선택지와 추천안을 함께 보여 드리고, 답을 받은 뒤에 진행한다.
- 활동지 수정은 `lesson-edit` 스킬 규칙대로: 최소 diff, 표식(`<script data-msi-src>`·`msi-asset:`·NEIS 스냅샷) 보존,
  그림은 base64 로 붙이지 말고 `assets/` + `msi-asset:./assets/…`.
- 수정할 때마다 `npm run check -- <차시>` 를 돌리고 캡처로 확인한 뒤 결과를 알린다.
- 4탭(이용 규칙·시간표·오늘의 급식·수업 활동지) 차시를 새로 만들거나 가져오면(`npm run new`·`npm run import`)
  **`npm run portal-upgrade -- <차시>`** 를 돌린다 — 지금 4탭 화면 규칙을 한 번에 맞추고 이미 적용된 건 건너뛴다:
  제목줄 칩 탭(`docs/rules/portal/rule.md` §2) · 시간표 날짜 카드는 제목 아래(`timetable.md` §4.1) ·
  급식 `◀ 날짜 ▶`(일간 하루·토일 건너뜀 / 주간 한 주 / 월간 한 달, `lunch.md` §5.2) · 급식 일간 메뉴 가운데·태그 다음 줄(`lunch.md` §5.3).
  4탭 화면을 새로 바꾸면 이 스크립트(`scripts/portal-upgrade.mjs`)에도 묶음을 추가한다.
- API 키·비밀번호·`.env` 는 커밋하지 않는다. NEIS 키는 Apps Script 의 스크립트 속성(NEIS_KEY)에만 둔다.
  (`site.config.json` 의 apiUrl·submitToken 은 페이지에 공개되는 값이라 커밋해도 된다.)

## 알림 (선생님 지시 2026-09-30 — 항상)

**작업이 끝나면 매번 `PushNotification` 도구로 알림을 보낸다.** (Remote Control 이 연결돼 있으면 선생님 아이폰 Claude 앱까지 간다.)
- 어떤 작업이든 끝났을 때(만들기·고치기·정답지·commit and push 등), 그리고 선생님 결정이 필요해서 멈췄을 때.
- 한 줄, 200자 이내, 마크다운 없음. 선생님이 바로 볼 것을 앞에 쓴다. 예) "03차시 완성 — 미리보기 http://127.0.0.1:8080/data-analysis/03/", "push 완료·배포 성공".
- 도구가 `Not sent`(선생님이 화면을 보고 있어 중복)라고 답하면 정상이다. 다시 보내지 말고 평소처럼 답하면 된다.
- 알림이 딸린 도구는 미리 불러 둔다: ToolSearch `select:PushNotification`.
- 그날 안에 여러 작은 단계가 이어지면 단계마다 보내지 말고, 맨 마지막(선생님이 이어서 할 일이 생기는 때)에 한 번 보낸다.

## 수행평가(시험지) — 저장소가 공개라서 (2026-10-02)

- **답을 절대 노출하지 않는다**: `lesson.html` 에 정답·채점·맞음/틀림 표시·`data-answer` 를 넣지 않는다(주석에도). 빌드 뒤 `dist/pages/<차시>/` 를 정답 낱말로 grep 해 0개인지 확인.
- 정답은 `answers.json` 에만 두고 **`.gitignore` 로 영구히 안 올린다**. 시험 날까지는 차시 폴더 전체도 `.gitignore`(공개할 때 그 줄만 지움).
- 본보기: `lessons/data-analysis/09`(A형) — 한 화면 틀, 버튼 고르기·순서·그래프 칸, 답 글자 칸 붙여넣기 막기, 이 컴퓨터에 답 보관(PDF 저장하면 지움), 나가기 경고, 문항 경계에서 쪽 나누는 PDF. 공개 순서는 그 폴더 `spec.md` 끝.
- **새 수행평가는 스킬 `lesson-exam`**, 기준 문서는 **`docs/rules/exam.md`**(구조 약속·자동 제출 A + PDF 숨은 답 B·시트 채점·선생님 체크리스트, 2026-10-04).
  시험 자료를 실제 Apps Script 로 보내며 시험하지 않는다(가로채서 시험).

## "메모 켜줘" (선생님 지시 2026-10-01)

선생님이 **"메모 켜줘"** 라고 하면 **이 PC 에서 쓰는 방법**으로 켠다 — 사이트(GitHub Pages)·push 얘기는 꺼내지 않는다.
**"피드백 모드"** 라는 말만 해도(선생님 지시 2026-10-02) 똑같이 켠다 — `/feedback_mode` 스킬의 "애매하면 처리 모드" 보다 이 규칙이 우선.
단 "피드백 처리해줘"·"쌓인 피드백"처럼 **처리**를 말하면 아래 처리 순서로 한다.
- 실행: `npm run memo -- <차시>` (예: `npm run memo -- 03`). 차시를 말하지 않았으면 인자 없이 `npm run memo`(가장 최근에 고친 차시).
  → 빌드 → 미리보기 서버(8080)가 꺼져 있으면 뒤에서 켜기 → `http://127.0.0.1:8080/<단원>/<차시>/?memo=1` 을 브라우저로 연다.
- 끝나면 열린 주소 한 줄과 쓰는 법(글 드래그 또는 🎯 요소 고르기로 클릭 → 📝 메모 → 요청 적기 → 📤 보내기 → Claude 에 "피드백 처리해줘")을 알린다.
- **피드백 모드**(2026-10-02): 이 PC 미리보기(127.0.0.1)에서는 "📤 보내기"가 `.claude/feedback.md` 에 바로 쌓는다(`scripts/serve.mjs` 의 `/__feedback`, git 에 안 올림).
  **세션 시작 때 `.claude/feedback.md` 에 `[ ]` 항목이 있으면 먼저 알리고 처리한다** — `/feedback_mode` 처리 순서 + `lesson-edit` 규칙(최소 diff·check·캡처).
  찾는 열쇠는 `선택한 글`·`위치`(탭 › MISSION_n › 소제목 · 칸)·`요소`(클릭으로 고른 요소 이름, 인라인 스타일 요소는 이름이 약하니 글로 찾는다). 디자인 토큰은 `docs/rules/design.md`. 처리하면 `[x]` + 한 줄.
- GitHub Pages 에서 켠 메모는 예전처럼 "전체 복사 → 붙여넣기". 붙여넣은 "[수정 요청]" 글은 `lesson-edit` 스킬의 "[수정 요청] 메모를 붙여넣었을 때" 순서로 처리한다.
- "메모 꺼줘" → 주소 끝에 `?memo=0` 으로 열게 안내한다(서버를 끌 필요는 없다).
- 설명: **`docs/feedback-mode.md`**(켜기·쓰는 법·기록 형식·처리 순서·문제 해결) · `README.md` "자주 하는 일" · `docs/log/activity.md`(2026-10-01) · 기능 코드 `shared/runtime/msi-memo.js`.

## 작업 완료 (사용자가 "완료/올려줘" 할 때)

1. `npm run check` (바뀐 차시만 또는 전체) — ✖ 가 없어야 한다.
2. 새 차시·새 폴더가 생겼으면 `README.md` 의 "차시 목록" 표를 갱신한다.
3. 이번에 반복될 만한 새 방식(새 활동 유형 등)이 생겼으면 `docs/log/activity.md` 에 한 절 덧붙이고,
   스킬로 만들지 사용자에게 한 줄로 제안한다.
4. 한국어 커밋 메시지로 커밋 → `git push`.
5. push 하면 GitHub Actions 가 GitHub Pages 에 자동 배포한다 → 주소를 알려 준다:
   `https://sage810.github.io/info-lesson/<단원>/<차시>/`
