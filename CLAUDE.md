# 작업 규칙

## 시작할 때

1. `git status` 로 변경사항 확인 — 커밋 안 된 게 있으면 먼저 알린다.
2. 충돌 위험이 없으면 `git pull`.
3. `node_modules` 가 없으면 `npm install` (처음 한 번. 브라우저 검사용 playwright-core 만 설치됨).

## 구조 한눈에

- **고치는 곳**: `lessons/<단원>/<차시>/lesson.html` (작은 소스) · `assets/` · `answers.json` · `spec.md` · `lesson.json`
- **공용**: `shared/` (폰트·라이브러리·여러 차시가 같이 쓰는 그림·동작 스크립트) — 바꾸면 모든 차시에 영향
- **배포본**: `dist/` — `npm run build` 결과. **손으로 고치지 않는다**(git 에도 안 올라감)
- **규칙 문서**: `docs/rules/` (디자인·활동 유형·PDF·임베드) · 이력: `docs/log/`
- **스킬 목록·사용법**: `.claude/README.md` · 사람용 안내: `README.md`

## 꼭 지킬 것

- 활동지 수정은 `lesson-edit` 스킬 규칙대로: 최소 diff, 표식(`<script data-msi-src>`·`msi-asset:`·NEIS 스냅샷) 보존,
  그림은 base64 로 붙이지 말고 `assets/` + `msi-asset:./assets/…`.
- 수정할 때마다 `npm run check -- <차시>` 를 돌리고 캡처로 확인한 뒤 결과를 알린다.
- API 키·비밀번호·`.env` 는 커밋하지 않는다. NEIS 키는 Apps Script 의 스크립트 속성(NEIS_KEY)에만 둔다.
  (`site.config.json` 의 apiUrl·submitToken 은 페이지에 공개되는 값이라 커밋해도 된다.)

## 작업 완료 (사용자가 "완료/올려줘" 할 때)

1. `npm run check` (바뀐 차시만 또는 전체) — ✖ 가 없어야 한다.
2. 새 차시·새 폴더가 생겼으면 `README.md` 의 "차시 목록" 표를 갱신한다.
3. 이번에 반복될 만한 새 방식(새 활동 유형 등)이 생겼으면 `docs/log/activity.md` 에 한 절 덧붙이고,
   스킬로 만들지 사용자에게 한 줄로 제안한다.
4. 한국어 커밋 메시지로 커밋 → `git push`.
5. push 하면 GitHub Actions 가 GitHub Pages 에 자동 배포한다 → 주소를 알려 준다:
   `https://sage810.github.io/middle_school_info_class/<단원>/<차시>/`
