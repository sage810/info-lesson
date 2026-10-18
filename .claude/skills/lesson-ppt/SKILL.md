---
name: lesson-ppt
description: >
  정보 수업 활동지 차시를 보고 같은 톤의 수업 PPT(.pptx, 시안 A「카드」)를 만들어 캔바에 올릴 수 있게 하는 루틴 —
  spec.md·활동지 카드를 장으로 옮겨 ppt.json 작성 → npm run ppt 로 만들기 → PowerPoint 로 그려 넘침 점검 → 받는 링크(아티팩트) 게시.
  "N차시 PPT 만들어줘", "수업 PPT", "피피티", "캔바용 PPT·슬라이드", "PPT 템플릿으로", "/lesson-ppt" 에 사용.
  활동지 자체를 고치는 건 lesson-edit, 새 차시 활동지는 lesson-new.
---

# lesson-ppt — 활동지 차시 → 수업 PPT(캔바용)

**기준 문서: `docs/rules/ppt.md`** — 디자인 약속(§1) · 활동지 카드 → 장 표(§3) · 장 모양 13가지와 칸 이름·분량(§4) · 점검(§5) · 받는 링크(§6) · 캔바 안내(§7).
처음 쓰는 대화라면 §1·§3·§4 를 먼저 읽는다. 본보기: `lessons/ai/01/ppt.json`(16장).

## 순서

1. **준비** — `scripts/ppt/node_modules` 가 없으면 `npm --prefix scripts/ppt install`(처음 한 번). 점검에는 이 PC 의 PowerPoint 를 쓴다.
2. **차시 정하기** — `<단원>/<차시>`(예 `ai/02`). "02"처럼 번호만 들으면 `lessons/` 에서 찾고, 여러 단원에 있으면 묻는다.
3. **재료 읽기** — 그 차시의 `spec.md` 전부(흐름·시간·카드 문장·발문·정답) · `lesson.json` · `assets/` 목록. `lesson.html` 은 커서 필요한 곳만 Grep.
4. **장 짜기** — §3 표대로 바로 짠다(표지 · 목표 · 단계마다 간지 · 활동마다 내용 장 · 정리 표 · 형성평가 · 마무리 · 안내 장).
   선생님께 먼저 묻는 것(CLAUDE.md — 선택지와 추천을 함께): 활동지에 없는 문장을 새로 써야 할 때 · 20장을 넘길 때 · 정답이 드러나는 장을 활동 앞에 둘지.
5. **`ppt.json` 쓰기** — 활동지 문장 그대로, §4 분량 안에서. `notes` 에 단계·시간·발문, 정답과 겹치는 장은 "활동 뒤에 보여 주세요".
6. **만들고 점검** — `npm run ppt -- <단원>/<차시> --check` → **넘침 0** + `dist/ppt/<단원>-<차시>/render/_sheet.png` 를 눈으로(제목 자리 같은지 · 칸 간격 · 그림 잘림).
   넘치면 글을 줄이거나 장을 나눈다(26px 아래로 줄이지 않는다). 고친 뒤 다시 돌린다.
7. **받는 링크** — `npm run ppt -- <단원>/<차시> --page` → 끝에 찍힌 값(`file_path`·`root`·`files`·`capabilities {"downloads": true}`·`icon "slides"`) 그대로 Artifact 게시.
   같은 차시를 다시 올릴 땐 같은 `file_path`(다른 대화면 그 링크를 `url` 로) → 링크가 그대로다.
8. **알리기** — 링크 · 장 수 · "글꼴 꾸러미를 캔바 브랜드 키트에 먼저(처음 한 번)"를 선생님께. `PushNotification` 한 줄.
   커밋은 선생님이 "완료/올려줘" 할 때만.

## 꼭 지킬 것

- **새 색·새 글꼴을 만들지 않는다** — 역할 색(`role`)과 글꼴 4개 그대로. 단계는 머리 이름표로 알리고 진행 지도 줄은 넣지 않는다.
- 활동지 문장을 지어내지 않는다. 줄이거나 바꾼 문장은 선생님께 알린다.
- **수행평가(시험지) 답은 `ppt.json`·발표자 메모 어디에도 넣지 않는다** — 저장소가 공개라 `ppt.json` 도 올라간다(`docs/rules/exam.md`).
- `dist/ppt/` 를 손으로 고치지 않는다 — `ppt.json` 을 고치고 다시 만든다.
- 새 장 모양이 필요하면 `scripts/ppt/layouts.mjs` 에 함수 하나 + `docs/rules/ppt.md` §4 표에 한 줄. 그 뒤 `npm run ppt -- ai/01 --check` 로 본보기가 그대로인지 확인.
- 틀 디자인(색·자리·글꼴 크기, `scripts/ppt/theme.mjs`)을 바꾸면 모든 차시 PPT 가 바뀐다 → 선생님께 먼저 묻는다.

## 자주 걸리는 것

- 쿠키런은 이름이 `CookieRun Bold` 이고 굵게를 켜지 않는다(켜면 두 번 굵어짐). 큰 제목은 `GangwonEduPower`(강원교육튼튼).
- 문장 끝 마침표·물음표가 상자 끝에 살짝 걸치는 건 PowerPoint 의 문장 부호 내어쓰기라 정상이다.
- 점검 중 Silkscreen 은 잠깐만 불러온다(설치 아님). 켜 둔 PowerPoint 는 끄지 않는다.
- `.pptx`·`.zip` 은 아티팩트에 딸린 파일로 못 올린다 → 페이지 안 데이터 + downloads 기능(이미 `--page` 가 그렇게 만든다).
