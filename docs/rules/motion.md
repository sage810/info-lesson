# 수업용 모션그래픽 — 활동지 차시를 보고 영상 만들기 (선생님 결정 2026-10-18)

차시 활동지(`spec.md`·카드 문장·그림)를 읽고, **같은 톤의 모션그래픽**(웹 애니메이션 페이지 + MP4)을 만든다.
첫 본보기: `lessons/ai/01/motion/index.html`「인공지능이란?」(2분 48초, 자막만·소리 없음).

## 0. 한눈에

```
npm run motion -- ai/01 --sheet 5                 5초마다 한 장씩 격자(sheet.png) — 전체 흐름 확인
npm run motion -- ai/01 --snap 3,46,120           장면 PNG(초) — 자세히 볼 때
npm run motion -- ai/01 --mp4                     MP4(1920×1080 · 30fps · H.264 QP 24) — 7분쯤 걸림
npm run motion -- ai/01 --mp4 --from 0 --to 12 --out dist/motion/ai-01/test.mp4   짧게 시험
npm run motion -- ai/01 --page                    받는 링크용 페이지(site/index.html) + Artifact 게시 값
```

결과는 `dist/motion/<단원>-<차시>/`(git 에 안 올라감): `정보수업_<단원>_<차시>차시_모션그래픽.mp4` · `sheet.png` · `snap/` · `site/`.
ffmpeg 가 없어도 된다 — Chrome(또는 Edge)이 장면을 그리고(WebCodecs H.264) `scripts/motion/vendor/mp4-muxer.js` 가 MP4 로 묶는다.

## 1. 디자인 약속 (활동지·PPT 와 같은 세계)

- **무대 1920×1080, 크림 바탕**(`window-body`) — 선생님이 만든 활동 1·4 영상(10초, `assets/*-motion.mp4`)과 같은 톤: 밤하늘 잉크 선 3px · 파스텔 역할 색 · 어긋난 그림자 · 요소가 하나씩 나타남.
- **장면 머리 띠** = 활동지 카드 머리: 단계 흰 이름표(도입·전개·정리) + Silkscreen 픽셀 이름(`ACTIVITY_1`) + 이모지 배지 + 제목. 색은 역할 토큰 값(도입 세이지 · 활동 1 하늘 · 2 민트 · 4 라벤더 · 정리 연어). **새 색을 만들지 않는다.**
- **자막**: 아래 가운데 흰 상자(3px 잉크, 38px Maplestory), 핵심어는 `**굵게**` → CookieRun Bold + 노란 형광펜. 활동지 문장을 그대로 쓴다(줄이면 뜻이 같게).
- **글꼴**: 활동지와 같은 파일(`shared/fonts`) — 큰 제목 GangwonEdu · 제목·이름표 CookieRun Bold · 본문 Maplestory · 픽셀 Silkscreen. 페이지는 `fonts/…` 로 참조하고, 미리보기 서버·아티팩트가 그 경로를 준다.
- **소리 없음** — 선생님이 설명하며 틀어 준다. 그림은 활동지 그림(a1·a2·a4)과 같은 구성으로 다시 그린다(활동지와 눈에 익은 모양).
- **버튼(웹 보기)은 오로라 유리 알약**(`glass-pill`, DESIGN.md). 무대 안의 이름표·칩은 선생님 영상처럼 평평한 파스텔 알약.

## 2. 장면 짜기 (활동지 흐름 그대로)

| 장(챕터) | 활동지 | 담는 것 |
|---|---|---|
| 표지 | TODAY_TOPIC | `LESSON_NN` 픽셀 이름표 · 큰 제목 + 형광펜 줄 · 한 줄 소개 · 장 미리보기 칩 |
| 도입 | WARM_UP | 동기유발 장면 + 「오늘은 …를 밝혀요」 질문 |
| ①②③④ | ACTIVITY_n | 개념 그림이 단계별로 쌓임(선이 그려지고, 카드가 날아오고, 이름표가 떨어짐) + 자막 |
| 정리 | KEY_SUMMARY | 낱말 카드 격자(역할 색) → 핵심 문장 → 「활동지에 정리해요」 끝 장면 |

- **빈칸 정답이 나온다**(인공 신경망·인공지능 모델 등). 도입에 틀면 활동 1 빈칸이 쉬워지니, 활동 뒤·정리 때 틀거나 장(챕터)을 골라 튼다 — 선생님께 알린다.
- 길이는 2~3분. 장면마다 자막 하나(2~4초), 요소는 0.3~0.5초 간격으로.

## 3. 만드는 법 (코드)

- 한 파일 `lessons/<단원>/<차시>/motion/index.html`. 빌드(`npm run build`)는 이 폴더를 건드리지 않는다(활동지엔 안 들어감).
- **모든 움직임은 WAAPI 한 시계**: `anim(el, keyframes, 시작초, 길이초)` 로 0초 기준 절대 시각에 적는다. 첫 움직임은 `fill: both`(그 전엔 첫 키프레임 = 숨김), 다음부터 `forwards`.
  재생기는 `anims.forEach(a => a.currentTime = now)` 로 돌리고, `window.__motion.seek(ms)` 로 아무 시각이나 그릴 수 있다 → 캡처가 결정적(프레임 빠짐·흔들림 없음).
- 도우미: `scene(t0,t1)` · `head(…)` · `cap(scene, '문장 **핵심어**', t0, t1)` · `fadeIn/pop/flyIn/move/draw(선 그리기)/flash` · `network(층)` · `arrow(선 + 머리)` · `doodle/photo(그림 조각 `<use>`)`.
- 좌표는 무대 px 절대값(`box(parent,{x,y,w,h})`) — 글 흐름에 기대지 않아 화면이 일정하다.
- `?render=1` 이면 조작 줄을 숨기고 무대만 1920×1080 으로. `render.mjs` 가 이 모드로 열어 `Page.captureScreenshot` → 인코더 페이지(`enc.html`)로 넘긴다.

## 4. 점검

1. `--sheet 5` 격자를 보고 장면 순서·겹침·잘림을 본다. 의심스러운 곳은 `--snap` 으로 원본 크기.
2. 자주 나는 실수: `display:flex` 상자 안 글과 `<b>` 사이 띄어쓰기가 사라짐(`<span>` 으로 감싼다) · 스티커가 제목과 겹침 · 열 안 칩이 열 바닥을 넘음 · 끝 장면이 너무 짧음(END 를 늘린다).
3. MP4 는 `--from/--to` 로 12초쯤 먼저 뽑아 보고 전체를 돌린다. 만든 MP4 는 Chrome 으로 열어 장면을 캡처해 디코딩을 확인한다.

## 5. 받는 링크 (`--page` → 아티팩트)

- `site/index.html` = 문서 껍데기를 걷어 낸 페이지(아티팩트가 자기 틀로 감쌈), 글꼴 7벌은 딸린 파일 `fonts/…`.
- MP4 가 15MB 아래면 딸린 파일로 함께 올릴 수 있다(받기 단추는 `downloads` 기능). 크면 `dist/motion/…` 의 파일을 그대로 쓴다(OneDrive 폴더라 선생님 PC 에 있음).
- 같은 차시를 다시 게시할 때는 같은 `file_path` 로(링크 유지), 다른 대화에서는 `url` 로.

## 6. 코드 지도

| 파일 | 무엇 |
|---|---|
| `scripts/motion/render.mjs` | 명령(`npm run motion`) — 미리보기 서버(모션 폴더 + `/fonts/`) · 장면 캡처 · 격자 · MP4 · 받는 링크 페이지 |
| `scripts/motion/enc.html` | 인코더 페이지 — PNG → VideoFrame → WebCodecs H.264(QP 고정, 안 되면 가변 비트레이트) → mp4-muxer |
| `scripts/motion/vendor/mp4-muxer.js` | MP4 묶기(MIT, `LICENSE-mp4-muxer.txt`) |
| `lessons/ai/01/motion/index.html` | 첫 본보기 — 장면 7개(표지·도입·①~④·정리), 2분 48초 |

## 이력

- 2026-10-18 · ai/01 「인공지능이란?」 첫 모션그래픽 — 선생님 결정: 차시 전체 한 편 · 웹 페이지 + MP4 · 자막만 · 파일로 받기(활동지에는 안 넣음). 받는 링크 1판: https://claude.ai/artifact/T4Tecto1G4RdpNsrndaGT8 (MP4 11.4MB, QP 24).
