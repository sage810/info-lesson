# 수업 PPT — 활동지 차시를 보고 PPT 만들기 (시안 A「카드」, 선생님 결정 2026-10-18)

차시 활동지를 읽고, 같은 톤의 수업 PPT(.pptx)를 만들어 **캔바에 올릴 수 있게** 한다.
틀은 시안 A「카드」: 라벤더 모눈 책상 위에 활동지 카드 한 장. 내용은 차시마다 `lessons/<단원>/<차시>/ppt.json` 에 적고,
엔진(`scripts/ppt/`)이 PPT 를 만든다. 첫 차시 본보기: `lessons/ai/01/ppt.json`(16장).
스킬: **`lesson-ppt`**("2차시 PPT 만들어줘" · `/lesson-ppt ai/02`) — 이 문서의 순서를 따른다.

## 0. 한눈에

```
npm --prefix scripts/ppt install            # 처음 한 번(PPT 전용 패키지 — 루트 npm install 과 따로)
npm run ppt -- ai/01 --check                # 만들기 + PowerPoint 로 그려 넘침 검사 + 한눈에 보기
npm run ppt -- ai/01 --page                 # + 받는 링크용 페이지(PPT·글꼴 꾸러미 넣음) → 아티팩트로 게시
```

결과는 `dist/ppt/<단원>-<차시>/`(git 에 안 올라감): `<파일>.pptx` · `render/sNN.png`·`_sheet.png` · `site/index.html`.

## 1. 디자인 약속 (바꾸지 않는다)

- **틀**: 내용 장 = 모눈 책상 위 카드 한 장(머리 띠 + 몸통) · 간지 = 가운데 창 카드 · 표지·마무리 = TODAY_TOPIC 카드 + 위에 학교 이름·`LESSON_NN`.
- **색**: 카드 머리 색 = 활동지 카드 머리 역할 색(`color-map.md`) — 목표 로즈 · 도입 세이지/연두 · 활동 1~4 하늘/민트/라임/라벤더 · 핵심 정리 연어 · 형성평가 라일락. **새 색을 만들지 않는다.**
- **단계 알림**: 머리의 흰 이름표(도입·전개·정리) + 픽셀 이름(`ACTIVITY_1`). 진행 지도 줄(도입→전개→정리)은 넣지 않는다(`order.md`).
- **글꼴(설치된 이름 그대로)**: 큰 제목 `GangwonEduPower`(강원교육튼튼 — 활동지 'GangwonEdu' 파일의 실제 글꼴) · 제목·이름표 `CookieRun Bold`(굵게 끔) · 본문 `Maplestory`(Light, 굵게 = Bold) · 영문 라벨 `Silkscreen`.
- **캔바용으로 만든 방식**: 모눈 책상·카드 틀·유리 머리는 배경 그림(JPEG)에 굽는다. 글·이름표·칸·동전·표·단추는 고칠 수 있는 PowerPoint 요소. 그라데이션은 쓰지 않고(캔바가 잃음) 한 색으로, 흐림 0 그림자는 "뒤에 깐 도형"으로.
- **글 크기**: 제목 60px(30pt) · 본문 30~36px · 캡션 26px. **26px 아래로 줄이지 않는다** — 넘치면 글을 줄이거나 장을 나눈다.

## 2. 순서 (Claude 가 할 일)

1. **재료 읽기** — `spec.md`(흐름·시간·카드 문장·정답·발문) · `lesson.json`(단원 이름·제목) · `assets/`(그림 SVG). `lesson.html` 은 크니 필요한 곳만 찾아 읽는다.
2. **장 짜기** — 아래 §3 표대로 활동지 카드를 장으로 옮긴다. 활동지 문장을 그대로 쓰고, 줄여야 하면 뜻이 같게 줄인다(바꾼 곳은 선생님께 말한다).
3. **`ppt.json` 쓰기** — §4 표의 모양(layout)과 칸 이름으로. 본보기 `lessons/ai/01/ppt.json`.
4. **만들고 점검** — `npm run ppt -- <단원>/<차시> --check` → **넘침 0** 이어야 한다(PowerPoint 가 잰 글 크기로 검사).
   그다음 `render/_sheet.png` 를 눈으로: 제목 자리가 장마다 같은지, 칸끼리 붙거나 겹치지 않는지, 그림이 잘리지 않는지. 고치고 다시.
5. **받는 링크** — `npm run ppt -- <단원>/<차시> --page` → 끝에 찍히는 값 그대로 Artifact 게시(§6).
6. **알리기** — 링크 · 장 수 · 캔바에 올리는 순서(글꼴 먼저)를 선생님께. `PushNotification` 도 보낸다(CLAUDE.md).

## 3. 활동지 카드 → 장

| 활동지 카드 | 장(layout) | role | 메모 |
|---|---|---|---|
| 맨 위 TODAY_TOPIC | `cover` | — | 단원·차시·제목은 `lesson.json` 에서. `sub` = 도입 학습주제 카드 제목 |
| TODAY_GOALS | `goals` | — | 목표 2~3개 그대로 |
| 도입 · WARM_UP(동기유발) | `divider` + `activity` | `warmup` | 사이트를 여는 활동이면 `link`(단추에 링크) |
| 도입 · TODAY_TOPIC(학습주제 제시) | `topic` | `intro` | `lead` 첫 줄은 **굵게**(발문), `keywords` 2~3개 |
| 전개 · ACTIVITY_n | `divider` + 내용 장 1~2 | `act<n>` | 개념·그림 `concept` · 둘 비교 `compare` · 낱말 셋 `cards3` · 따라 하기 `activity` · 큰 그림 `image` · 글 목록 `bullets` |
| 정리 · KEY_SUMMARY | `divider` + `table` | `summary` | 표 6줄까지 권장, `key` = 한 줄 정리 |
| 정리 · CHECK_UP | `quiz` | `checkup` | 3문항씩 장을 자동으로 나눔. 정답·까닭은 발표자 메모로 |
| PDF로 저장하기 | `end` | — | 마무리 인사 + 제출 안내 |
| (자동) | `guide` | `help` | 맨 끝 선생님용 "쓰는 법" 장. 빼려면 `"guide": false` |

- 활동지 빈칸·이름표의 **정답과 겹치는 장**(개념 정리·예시)은 발표자 메모에 "활동 뒤에 보여 주세요"라고 적는다.
- 활동이 5개 이상이면 `act5` 부터 활동 1~4 색을 돌려 쓰고 이름표는 `ACTIVITY_5` … 로 나온다.
- **정답 맞히기 묶음**(선생님 요청 2026-10-18, 본보기 ai/01): 빈칸·이름표·순서·고르기 활동마다 `fill`·`fillcards`·`match`·`order`·`choice` 한 장을 적으면
  「안내 1장(학생이 보고 활동지에 함) + 답 1개씩 채워지는 장」으로 펼쳐진다(캔바엔 클릭해서 하나씩 나타나기가 없어 장을 나눔). 정답 장 아래 「왜 그럴까?」 상자에 `why`.
  활동 장 바로 뒤에 두고, 정답과 겹치는 개념 장(`concept`·`compare`·`cards3`·`table`)은 그 뒤에. 정답 없는 칸(개수·한 줄 쓰기)은 만들지 않는다.
  `why` 는 활동지의 안내 상자·뜻 칸·피드백 문장을 바탕으로 쓰고, 활동지에 없던 문장은 선생님께 확인받는다.

## 4. `ppt.json` 장 모양

맨 위 칸: `file`(파일 이름, 기본 `정보수업_<단원>_<차시>차시.pptx`) · `guide`(기본 true) · `unit`·`no`·`title`·`tag`·`school`(보통 비움 — `lesson.json` 에서) · `titleSize`(장 제목 글자 px, 기본 60) · `slides`.
캔바 화면의 글자 크기 숫자 = px × 0.75 — 선생님이 "제목 30" 이라 하면 `titleSize: 40`(ai/01 이 40).
모든 장 공통: `notes`(발표자 메모) · `role` · `chip`·`name`(머리 이름표를 바꿀 때만) · `section`(PowerPoint 구역 이름, 보통 비움).
본문 글은 `**굵게**` 와 `\n`(줄바꿈)을 읽는다.

| layout | 칸 | 분량 기준(넘치면 줄이기·나누기) |
|---|---|---|
| `cover` | `sub` · (`unit` `no` `title` `pixel`) | 제목 8자 안팎, `sub` 한 줄 |
| `goals` | `goals[]` · `title` | 3개까지, 한 줄 32자 안팎 |
| `divider` | `role` · `lines[]` · `time` | 두 줄, 줄마다 11자 안팎 |
| `activity` | `role` · `title` · `intro` · `steps[]` · `link{pixel,name,sub,button,url}` · `callout{tag,text,tone}` | 단계 5개까지 한 줄씩. `tone` = `ask`·`tip`·`warn`·`reason` |
| `topic` | `role`(`intro`) · `title` · `lead` · `label` · `keywords[[낱말, 질문]]` | 낱말 2~3개 |
| `concept` | `role` · `title` · `figure` · `figureAlt` · `caption` · `terms[[낱말, 뜻]]` | 낱말 4개, 뜻 두 줄(30자 안팎) |
| `compare` | `role` · `title` · `lead` · `label` · `columns[{name, desc, examples[], color?, tint?}]` | 두 칸, 예 4개씩 |
| `cards3` | `role` · `title` · `cards[{term, text, analogy?}]` · `analogyLabel` · `foot` | 카드 3장, 뜻 세 줄 |
| `table` | `role`(`summary`) · `title` · `header[]` · `colW[%]` · `rows[][]` · `key` | 6줄까지(7줄부터 글이 작아짐) |
| `quiz` | `items[{q, a, why}]` · `perSlide`(3) · `guide` · `choices`(기본 O·X) | 문장 두 줄 |
| `bullets` | `role` · `title` · `items[]` · `figure?` | 6줄까지 |
| `image` | `role` · `title` · `figure` · `figureAlt` · `caption` | 그림 하나 |
| `end` | `title` · `sub` · `button` · `pixel` | — |
| `fill` | `role` · `title` · `pill` · `task` · `header[]` · `colW[%]` · `rows[][]`(칸 글의 `{정답}`) · `after[]`(표 아래 문장) · `bank[]`(이름표 보기) · `why[]` · `hint{tag,text}` · `check` | 표 4줄(글 두 줄) 또는 6줄(한 줄)+문장 두 줄. 긴 칸은 `\n` 으로 줄을 직접 나눔 |
| `fillcards` | `role` · `title` · `pill` · `task` · `cards[{term, text, ex}]`(`{정답}`) · `exLabel` · `why[]` · `hint` | 카드 3장, 뜻 네 줄 — 줄은 `\n` 으로 직접 나눔(한 줄 15자 안팎) |
| `match` | `role` · `title` · `pill` · `task` · `bank[]` · `items[{t, a, why}]` · `hint` | 문장 3개(두 줄)·5개(두 줄)·8개(한 줄 40자 안팎) |
| `order` | `role` · `title` · `pill` · `task` · `cards[]`(활동지에 보이는 순서) · `order[]`(정답 순서, 0부터) · `short[]` · `why[]` | 카드 4장, 두 줄씩 |
| `choice` | `role` · `title` · `pill` · `task` · `q` · `opts[]` · `a` · `short` · `why` · `w{보기: 틀린 까닭}` | 문제 세 줄, 보기 3개까지 |

- 정답 맞히기 모양(`fill`~`choice`)은 장 하나가 「안내 + 답 수만큼」 장으로 펼쳐진다. `{정답}` 은 안내 장에서 `( ① )`, 정답 장에서 초록 굵은 글(방금 나온 답은 밑줄),
  이름표·순서 칸은 초록 칩(방금 나온 칸은 분홍 테두리) — 색은 역할 색 `ui-feedback-ok-ink`·`chip-ok`·`ui-focus-pink`. 정답 장의 안내 줄은 `check`(기본 「내 답과 비교하며, 왜 그 답인지 같이 이야기해 봐요.」).
- 정답 글자는 본문보다 크게(선생님 요청 2026-10-18): 표 칸 +8px · 표 아래 문장·카드 38px · 이름표 칸 28~36px · 고른 보기 38px · 「왜 그럴까?」 앞 정답 36px.
  PowerPoint 는 표 줄 높이를 최소값으로 보고 글이 크면 줄을 늘린다(넘침 검사에 안 잡힘) → 표 칸 위아래 여백을 1pt 로 두고, 표 아래 글이 붙지 않았는지 그림으로 확인한다.
- 줄 끝 마침표·쉼표가 상자 오른쪽에 걸치면(문장 부호 내어쓰기) `--check` 가 넘침으로 잡는다 → 그 글은 `\n` 으로 줄을 직접 나눈다.
- `figure` 는 차시 폴더 기준 경로(`assets/a1-neural.svg`). SVG 는 3배 PNG 로 바꿔 넣는다(캔바·PowerPoint 가 똑같이 보이게). `figureAlt` 를 꼭 적는다.
- 새 모양이 필요하면 `scripts/ppt/layouts.mjs` 에 함수 하나를 더하고 이 표에 한 줄 적는다.

## 5. 점검 기준 (`--check`)

- **넘침 0**: PowerPoint 를 열어(창 없이) 장마다 PNG 로 내보내고, 글상자마다 PowerPoint 가 잰 글 크기와 상자 크기를 비교한다. 표는 카드 아래(966px)를 넘지 않아야 한다.
- 켜 둔 PowerPoint 가 있어도 괜찮다 — 점검은 자기가 연 파일만 닫는다. 이 PC 에 없는 Silkscreen 은 점검하는 동안만 불러온다(설치 아님).
- 문장 끝 마침표·물음표가 상자 오른쪽에 살짝 걸치는 것은 PowerPoint 의 문장 부호 내어쓰기라 정상이다(검사에서도 걸리지 않게 글상자에 여유를 둠).

## 6. 받는 링크 (`--page` → 아티팩트)

- `.pptx`·`.zip` 은 아티팩트에 딸린 파일로 올릴 수 없다. 그래서 두 파일을 페이지 안 데이터 칸(base64)에 넣고, 받기 단추가 **downloads 기능**(저장 확인 창)으로 저장한다.
- `--page` 가 끝에 찍는 값으로 Artifact 를 게시한다: `file_path`(site/index.html) · `root`(site) · `files`(thumbs/sNN.jpg) · `capabilities: {"downloads": true}` · `icon: "slides"`.
  같은 차시를 다시 게시할 때도 같은 `file_path` 로 하면 링크가 그대로다(다른 대화에서는 `url` 로).
- 페이지에는 받기 단추 2개(PPT · 글꼴 꾸러미), 캔바에 올리는 순서, PowerPoint 가 그린 미리보기, 알아 둘 점이 들어 있다.

## 7. 캔바에 올리기 (선생님께 안내할 것)

1. 글꼴 꾸러미(.zip)를 풀어 **글꼴부터** 올린다 — 캔바 「브랜드」(브랜드 키트) → 글꼴 → 「글꼴 업로드」에 .ttf 5개(교육용·Pro 계정). 한 번 올리면 다음 차시부터는 건너뛴다.
2. 캔바 홈의 「업로드」로 .pptx 를 올리면 고칠 수 있는 프레젠테이션이 된다.
3. 글꼴이 다르게 보이는 글은 브랜드 글꼴의 같은 이름으로 바꾼다. 글꼴을 올릴 수 없는 계정이면 비슷한 캔바 글꼴: 큰 제목 Do Hyeon · 제목 Jua · 본문 Gowun Dodum.
4. PowerPoint 로 발표할 PC 에는 꾸러미의 .ttf 5개를 설치한다.

## 8. 주의

- **수행평가(시험지) 답은 PPT·`ppt.json` 에 넣지 않는다** — 저장소가 공개라 `ppt.json` 도 올라간다(`exam.md`).
- 발표자 메모에 정답이 있으니, 화면을 공유할 때 메모가 학생에게 보이지 않게 하라고 안내한다.
- `dist/ppt/` 는 git 에 안 올라간다(필요할 때마다 다시 만든다). 배경 그림은 `dist/ppt/_bg/` 에 남겨 두고, 디자인 값이 바뀌면 이름(해시)이 바뀌어 새로 굽는다.

## 9. 코드 지도

| 파일 | 무엇 |
|---|---|
| `scripts/ppt/index.mjs` | 명령(`npm run ppt`) — 그림 → PPT → 점검 → 페이지 |
| `scripts/ppt/theme.mjs` | 색·역할(role)·틀 자리·글꼴 이름·글 폭 재기·`**굵게**` 읽기 |
| `scripts/ppt/layouts.mjs` | 장 모양 함수(§4) · 링크 밑줄 걷기(pptxgenjs 가 도형 링크를 글에도 붙임) |
| `scripts/ppt/media.mjs` | 배경 굽기·그림 PNG·한눈에 보기·미리보기·글꼴 꾸러미 |
| `scripts/ppt/render.ps1` | PowerPoint 점검(**UTF-8 BOM 유지** — Windows PowerShell 5.1 이 한글을 읽도록) |
| `scripts/ppt/page.html` · `page.mjs` | 받는 링크 페이지 |
| `scripts/ppt/package.json` | PPT 전용 패키지(pptxgenjs · fontkit · jszip · wawoff2 · subset-font) |

## 이력

- 2026-10-18 · 시안 세 가지(A 카드 · B 띠 · C 여백)를 같은 내용으로 비교 → 선생님이 **A 카드** 선택. 시안 비교 페이지: https://claude.ai/artifact/KeTLVZk8Yy8rJZ9LiE2gsf
- 2026-10-18 · ai/01 「인공지능이란?」으로 첫 PPT 16장 → 캔바용 받는 링크: https://claude.ai/artifact/KyQgad5yVHUr69PmTCk281 · 같은 날 만드는 코드를 저장소로(`scripts/ppt/`, `ppt.json`).
- 2026-10-18 · 캔바에서 영상 장 2장(7·8쪽)을 직접 더한 뒤, 활동별 정답 맞히기 묶음 11개(56장, 형성평가 O/X 는 선생님 결정으로 뺌)를 더해 74장 — 같은 받는 링크 2판. 새 장 모양 `fill`·`fillcards`·`match`·`order`·`choice`.
  캔바 MCP 의 업로드 도구는 .pptx 를 받지 않아(「ZIP 형식 미지원」) 선생님이 받는 링크에서 받아 캔바에 올린 뒤, 그 디자인에서 새 장만 원본 덱에 넣는다(merge-designs).
- 2026-10-18 · 선생님 요청으로 장 제목 캔바 45 → 30(`titleSize: 40`, 이 차시만 — 다른 차시 기본은 60 그대로)·정답 글자 크게 → 받는 링크 3판. 캔바 원본 덱(LESSON_01)의 기존 13쪽 제목도 같은 크기로 저장.
