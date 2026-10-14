# 교사용 화면 규칙

교사용 화면(`…/<단원>/<차시>/teacher.html`, `dist/embed/<단원>-<차시>.teacher.html`)은 `npm run build` 가 **모든 차시마다 자동으로** 만든다.
학생용 `lesson.html` 하나에서 만들어지므로, 아래 규칙은 차시 파일을 고치지 않고 빌드(`scripts/lib/render.mjs`)가 지킨다.

## 1. 왼쪽 고정바는 절대 없다 (선생님 지시 2026-10-13)

교사용 화면에는 화면 왼쪽에 붙어 따라다니는 고정바(진행률 위젯·도움말 카드 등)가 **하나도 보이지 않아야 한다.**

- **알려진 것** — 빌드가 CSS 로 숨긴다(`<style id="msi-teacher">`):
  `.sheet-progress`(01~06 진행률 위젯) · `.sheet-side`(07 진행률+도움말 묶음) · `.guide-card`(09·10 시험 도움말 카드).
- **이름을 모르는 새 고정바** — 빌드가 넣는 작은 스크립트(`<script id="msi-teacher-nofix">`)가 숨긴다:
  `position: fixed` 이고, 높이 40px 이상, 왼쪽 끝이 화면 폭의 25% 안, 폭이 화면의 40% 미만인 덩어리. 화면이 그려진 뒤·바뀔 때마다 다시 본다.
  (알림 `#toast`, 메모 창 `[data-msi-memo]` 는 빼고)
- **검사** — `npm run check` 가 교사용 화면에서 위 조건의 고정바가 보이면 **✖ 실패**로 알린다.

### 새 차시·새 고정바를 만들 때
- 새 활동지에 왼쪽 고정 요소를 넣으면 `render.mjs` 의 `msi-teacher` CSS 목록에 그 클래스 이름을 **덧붙인다**(스크립트가 잡아도 이름으로 확실히 숨기는 것이 우선).
- 교사용에서 따로 할 일은 없다 — 위 규칙은 빌드·검사가 자동으로 적용한다. `npm run check -- <차시>` 의 교사용 결과만 확인한다.

## 2. 그 밖에
- 교사용 화면에서는 "제출"(Apps Script 로 보내기)이 꺼진다(`MSI_CONFIG.submit = false`).
- 정답이 채워진 정답지 PDF 는 `npm run teacher -- <차시>`(스킬 `lesson-teacher`).
