# 옛 output/ 파일은 어디로 갔나

2026-09-24 구조 개편 때 `output/` 폴더를 없앴습니다. 파일은 **git 기록에 그대로 남아 있어서** 언제든 꺼낼 수 있어요.

- 정본(각 차시의 최종본)은 `lessons/<단원>/<차시>/lesson.html` 로 옮겼고, `npm run build` 결과가 **원본과 바이트 단위로 똑같은지** 확인했습니다.
- 나머지(중복·구버전·수동 교사용 파일)는 저장소 트리에서만 뺐습니다.

## 옛 파일 꺼내는 법

```powershell
# 예: 5차시 5미션 구버전(data5_1b) 꺼내 보기
git show f1049a7:"output/데이터분석/5차시/data5_1b.html" > data5_1b.html
```

`f1049a7` = 개편 직전 커밋(2026-09-15 "2차시·6차시 활동지 추가, 4차시 활동지 대폭 갱신").

## 파일별 행방

| 옛 경로 | 지금 | 설명 | md5 앞 10자리 |
|---|---|---|---|
| `output/데이터분석/2차시/data2.html` | `lessons/data-analysis/02` | **정본** — 그대로 가져옴(빌드 결과가 원본과 바이트 단위로 같음) | `a8033acf55` |
| `output/데이터분석/4차시/data4_5.html` | `lessons/data-analysis/04` | **정본** — 그대로 가져옴(바이트 단위 동일) | `2dfe4bdc10` |
| `output/데이터분석/4차시/data4.html` | — | data4_5.html 과 완전히 같은 파일(중복) | `2dfe4bdc10` |
| `output/데이터분석/4차시/data4_4.html` | — | data4_5.html 과 완전히 같은 파일(중복) | `2dfe4bdc10` |
| `output/데이터분석/4차시/data4_5_teachers.html` | — | 교사용 — 이제 `npm run build` 가 자동 생성(`dist/…/teacher.html`) | `18b564b559` |
| `output/데이터분석/4차시/data4_1.html` | — | 초기 자체완결판(구버전) | `0043cb9b33` |
| `output/데이터분석/4차시/data4_3.html` | — | 활동지 탭만 있는 초기 작업본(구버전) | `c8ff8255e7` |
| `output/데이터분석/4차시/data4_act.html` | — | 활동지 탭만 뗀 작업용 소형 파일(구버전) | `f8c13d0db3` |
| `output/데이터분석/5차시/data5_2.html` | `lessons/data-analysis/05` | **정본** — 구성·비교 분석(4탭). 분포·관계는 6차시로 분리됨 | `d55d78cc6e` |
| `output/데이터분석/5차시/data5_2_teacher.html` | — | 교사용 — 이제 자동 생성 | `59284e99ed` |
| `output/데이터분석/5차시/data5.html` | — | data5_1.html 과 완전히 같은 파일(중복) | `41e0993387` |
| `output/데이터분석/5차시/data5_1.html` | — | 구버전: 구성·비교·분포·관계를 한 차시에 담은 5미션판 | `41e0993387` |
| `output/데이터분석/5차시/data5_1b.html` | — | 구버전: 위와 같은 5미션판의 다른 세션 발전본 | `c59c730f81` |
| `output/데이터분석/5차시/data5.pdf` | — | 구버전 5미션판을 PDF 로 뽑은 것 | `2a81f8b18e` |
| `output/데이터분석/6차시/data6.html` | `lessons/data-analysis/06` | **정본** — 그대로 가져옴(바이트 단위 동일) | `342df54465` |
| `output/데이터분석/7차시/data7.html` | `lessons/data-analysis/07` | **정본** — 그대로 가져옴(바이트 단위 동일) | `03f5e930ff` |
| `output/데이터분석/4차시/support.js` | `shared/vendor/dc-runtime.js` | 뷰어용 런타임 사본(인라인판과 같은 역할) | `951ae391b8` |
| `output/데이터분석/5차시/support.js` | `shared/vendor/dc-runtime.js` | 〃 | `951ae391b8` |
| `output/데이터분석/4차시/neis.config.example.js` | — | NEIS 키 설정 예시 — 이제 키는 Apps Script 의 스크립트 속성(NEIS_KEY)에 | `b6da6e8a92` |
| `output/데이터분석/5차시/neis.config.example.js` | — | 〃 | `b6da6e8a92` |

## 아직 저장소에 없는 것

6차시는 저장소에 올라간 판(빈칸 10개)보다, 이후 수업 대화에서 만든 판이 더 새것일 수 있어요
(빈칸 47개로 늘리고, 진행률 규칙·복사 버튼 삭제·교사용 판을 적용한 버전). 그 파일이 컴퓨터에 있다면:

```powershell
npm run import -- "<그 파일 경로>" data-analysis/06
npm run check -- 06
```

`lessons/data-analysis/06/answers.json` 은 이미 빈칸 47개 판 기준으로 적혀 있어서, 가져온 뒤 `npm run teacher -- 06` 을 하면 정답지가 바로 나와요.
