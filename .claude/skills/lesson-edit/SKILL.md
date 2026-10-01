---
name: lesson-edit
description: >
  이미 있는 정보 수업 활동지(lessons/<단원>/<차시>/lesson.html)를 고치는 반복 루틴 — "06 이상치 카드 삭제",
  "복사 버튼 없애줘", "빈칸으로 만들어줘", "활동 하나 추가", "색 바꿔줘", "문구 수정"처럼 활동지 내용·디자인을
  바꾸는 모든 요청에 사용. 수정 → 빌드 → 브라우저 자동 검사 → 캡처 확인까지 한 번에 한다.
  완성된 한 파일짜리 HTML(3~4MB)을 받아 차시에 넣는 일(가져오기)도 여기서 한다.
---

# lesson-edit — 활동지 고치기

**고치는 파일은 `lessons/<단원>/<차시>/lesson.html` 하나뿐.** 이 파일은 폰트·라이브러리·그림이 빠진 "작은 소스"(20~200KB)이고,
배포본(`dist/`)은 `npm run build` 가 만든다. `dist/` 는 절대 손으로 고치지 않는다.

## 순서

1. **차시 찾기** — "06", "6차시" → `lessons/*/06/`. `lesson.json`(제목·shell) 과 있으면 `spec.md` 를 먼저 읽는다.
2. **고칠 곳만 찾아 읽기** — 파일 전체를 읽지 말고 Grep 으로 화면 글자·`aria-label`·`MISSION_2` 같은 표식을 찾아 그 주변만 Read.
3. **최소 diff 로 Edit** — 같은 파일을 계속 고친다. 새 파일·`_v2` 금지(사용자가 "새로 만들자"고 할 때만 `/lesson-new`).
4. **검사** — `npm run check -- <차시> --find "<고친 곳 근처 글자>"`
   - ✖ 가 있으면 고치고 다시. △(콘솔 경고)는 학교망 밖 NEIS 호출 실패 등일 수 있으니 내용만 확인.
   - `dist/check/<단원>-<차시>-find.png` 를 Read 로 열어 **고친 부분을 눈으로 확인**한다. 전체 흐름은 `…-pages-01.png` 부터.
5. **보고** — 무엇을 어디서 바꿨는지 한두 문장 + 캡처에서 확인한 것. 새 빈칸을 만들었으면 `answers.json` 도 채웠는지 말한다.

## 꼭 지킬 것 (자세한 근거는 references/rules.md)

- 표식은 건드리지 않는다: `<script data-msi-src="…"></script>` · `msi-asset:…` · `/*NEIS_SNAPSHOT_START*/@msi:neis-snapshot/*NEIS_SNAPSHOT_END*/`
- 그림을 넣을 땐 base64 를 붙이지 말고: `input/` 의 PNG 를 `lessons/<단원>/<차시>/assets/` 로 복사 → `src="msi-asset:./assets/파일.png"`
  (파일 이름에 공백·괄호 금지 → `_` 로)
- 모든 입력칸에 **페이지 안에서 유일한 `aria-label`** (진행률 집계·정답지 자동 생성의 기준). 정답은 화면에 쓰지 않고 `answers.json` 에만.
- 새 빈칸·퀴즈를 만들면 `answers.json` 의 `fill`(aria-label → 정답) / `click` 도 함께 고친다 → `/lesson-teacher` 가 바로 쓸 수 있게.
- 디자인은 `docs/rules/design.md` 토큰만. 새 색·서체·모서리 값 발명 금지.
- `shared/partials/*.js`(순서배열·칩슬롯·자동높이·붙여넣기 칸)를 고치면 **모든 차시**에 영향 → `npm run check`(전체)로 확인.

## 사용자가 "완성된 HTML 파일"을 줬을 때 (가져오기)

구글 사이트에 붙여 쓰던 한 파일짜리를 그대로 받았다면 손으로 옮기지 말고:

```
npm run import -- "<파일 경로>" <단원>/<차시>        # 예: data-analysis/06
npm run check -- <차시>
```

가져오기는 원본과 **바이트 단위로 같게** 되돌려지는지 스스로 확인하고, 다르면 실패한다. 이미 있는 차시면 lesson.html·assets 만 바뀐다.

**4탭 화면이면 가져온 뒤 `npm run portal-upgrade -- <차시>` 를 돌린다** — 밖에서 만든 HTML 은 옛 모양이라,
제목줄 칩 탭 · 시간표 날짜 카드 위치 · 급식 `◀ 날짜 ▶` · 급식 일간 가운데 정렬을 한 번에 맞춘다(이미 적용된 건 건너뜀).
✖ 가 나오면 그 차시 구조가 달라 앵커가 안 맞는 것 — 메시지의 앵커를 보고 `docs/rules/portal/*.md` 규칙대로 손으로 맞춘다.
가져오면 `lesson.json`·`answers.json` 은 그대로라, 틀(shell)이 바뀌었거나 빈칸 이름이 달라졌으면 그 둘도 맞춘다(`npm run teacher -- <차시>` 경고 확인).

## 선생님이 "[수정 요청]" 메모를 붙여넣었을 때

활동지 화면의 메모 기능(`?memo=1`, `shared/runtime/msi-memo.js`)으로 복사한 글이다. 모양:
`[수정 요청] data-analysis/03 「데이터 과학」` 아래에 번호별로 요청 · 위치(탭 › MISSION_n › 소제목 · 칸 이름) · 선택한 글.
1. 차시 폴더 `lessons/<단원>/<차시>/lesson.html` 에서 **선택한 글의 짧은 조각**을 Grep 한다(글이 태그로 쪼개져 있을 수 있어 앞·뒤 한 토막씩). 위치와 칸 이름(`aria-label`)이 찾는 데 도움이 된다.
2. 요청마다 위 "꼭 지킬 것"대로 **최소 diff** 로 고친다. 요청이 모호하거나 정답·진행률·정답지에 영향이 있으면(칸을 늘리거나 정답을 바꿈) 고치기 전에 묻는다.
3. 번호마다 고친 것·못 고친 것을 한 줄씩 알린다. `npm run check -- <차시>` + 캡처, 정답이 바뀌었으면 `answers.json` 도 맞춘다.

## 끝나면

사용자가 "완료/올려줘"라고 하면 `CLAUDE.md` 의 "작업 완료" 순서대로 커밋·푸시. 푸시하면 GitHub Pages 가 자동 배포된다.
