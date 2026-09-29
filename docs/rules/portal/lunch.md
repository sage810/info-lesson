# 오늘의 급식 탭 — 재현 명세

> 📌 **구조 개편(2026-09-24) 전에 쓴 문서입니다.** 본문 속 `output/dataN.html`·`data4_1.html` 같은 이름은 지금의 `lessons/<단원>/<차시>/lesson.html` 에 해당하고, 폰트·라이브러리·이미지는 빌드 때 자동으로 인라인됩니다(`npm run build`). 여기 적힌 **디자인·동작 규칙**은 그대로 유효합니다.


`output/data4.html` 의 세 번째 탭(`🍚 오늘의 급식`). 다른 AI 에이전트가 이 문서만 보고 동일한 결과를 만들 수 있도록 정리한다.
시각 토큰의 근거는 `docs/rules/design.md`. 상단 창 껍데기는 `docs/rules/portal/rule.md` §2, 데이터 파이프라인 공통 사항은 `docs/rules/portal/timetable.md` §2 참고.

---

## 1. 개요

- **위치**: `<sc-if value="{{ isMeal }}">` 블록. `state.tab === 'meal'` 일 때 렌더.
- **성격**: 신현중학교 **실데이터**. NEIS `open.neis.go.kr/hub` 의 `mealServiceDietInfo`(급식식단정보).
  - 학교: `ATPT_OFCDC_SC_CODE = J10`, `SD_SCHUL_CODE = 7692151`
- **3가지 보기**: 일간 / 주간 / 월간 (`state.mealView` = `'day'|'week'|'month'`, 기본 `'day'`)
- 급식은 **중식(점심)** 만 다룬다.

---

## 2. 데이터 파이프라인

`docs/rules/portal/timetable.md` §2 와 동일한 2단계(스냅샷 → 실시간) + 무인증 5행/페이지 페이지네이션.

### 2.1 스냅샷

`<script id="neis-snapshot">` JSON 의 `meal` 부분. `scripts/build-webapp-data.ps1` 이 `data/meal.json` 에서 만들어 주입한다.
- 앱이 쓰는 형태: `meal["YYYY-MM-DD"] = { items: [ { name, al:[번호,…] } ], kcal, type }`
- `data/meal.json` 원본은 `dishes: [ { name, raw, allergens } ]` — `raw` 는 NEIS 원문 보존, `name` 은 §4 규칙으로 정리된 것.

### 2.2 실시간 갱신

`componentDidMount` → `loadMeal(new Date())` → `neisFetchAll('mealServiceDietInfo', { MLSV_FROM_YMD, MLSV_TO_YMD })`
- 범위: **이번 달 1일 ~ 말일**.
- 각 행(`r`): `DDISH_NM` 을 `<br/>` 로 나눠 각 줄을 `parseDish` → `{ name, al }`. `CAL_INFO` 에서 숫자만 뽑아 반올림 → `kcal`.
- 스냅샷 `meal` 위에 날짜별로 덮어씀. 결과가 있으면 `setState({ meal })`.

---

## 3. 알레르기 (ALLERGENS)

### 3.1 파싱

`parseDish(line)` 은 **원문 줄 끝의 `(숫자.숫자.…)`** 를 알레르기 번호로 본다: `line.match(/\(([\d.\s]+)\)\s*$/)` → `[5,6,13,16]`.
(이름 정리(§4)와 별개로, 번호 추출은 **원문에서** 먼저 한다.)

### 3.2 번호 → {이름, 색} 표 (교육부 19종)

`ALLERGENS[n]` (1-based; `ALLERGENS[0] = null`):

| n | 이름 | 색 | n | 이름 | 색 |
|---|---|---|---|---|---|
| 1 | 난류 | `#ff4d6d` | 11 | 복숭아 | `#7c4dff` |
| 2 | 우유 | `#ff7a1a` | 12 | 토마토 | `#b429ff` |
| 3 | 메밀 | `#ffb800` | 13 | 아황산류 | `#e040fb` |
| 4 | 땅콩 | `#e8d000` | 14 | 호두 | `#ff2d95` |
| 5 | 대두 | `#9ed900` | 15 | 닭고기 | `#ff5252` |
| 6 | 밀 | `#2fc744` | 16 | 소고기 | `#c1440e` |
| 7 | 고등어 | `#00c9a7` | 17 | 오징어 | `#00867d` |
| 8 | 게 | `#00bcd4` | 18 | 조개류 | `#5d6dff` |
| 9 | 새우 | `#0091ff` | 19 | 잣 | `#8d6e00` |
| 10 | 돼지고기 | `#3d5afe` | | | |

### 3.3 표시 (일간 보기)

메뉴 옆 태그로. **번호 없이 이름만** (`label = ALLERGENS[n].name`). 태그 스타일: `borderRadius:6px; padding:2px 7px; CookieRun 700 11px; color:#fff; background:<해당 색>`.
- 미등록 번호 → 라벨은 숫자 그대로, 배경 `#9c8dc4`.
- **주간·월간 보기에는 알레르기 태그 없음**(메뉴 이름만).

---

## 4. 메뉴 이름 정리 규칙 (일간·주간·월간 공통)

`dishName(s)` 로 처리. 3단계:

1. **`(...)` 괄호 묶음을 모두 제거** — `String(s).replace(/\([^)]*\)/g, '')`
   (끝의 알레르기 번호 `(5.6.13)`, `(S)`, `(21-중-식)` 같은 내부 코드가 여기서 사라진다. 괄호 안에 `-`·`.` 가 있어 먼저 지워야 함.)
2. **첫 `.` 또는 첫 `-` 이후를 버린다** — `.split(/[.\-]/)[0]`
3. **trim**

`(` 는 자르는 기준이 아니다. `+`, `/`, `,`, `&`, 숫자, `g` 등 그 외 문자는 유지.

| 원문(raw) | 표시(name) |
|---|---|
| `베리무스케익.27g` | `베리무스케익` |
| `국수장국-국(S) (5.6.9.13)` | `국수장국` (태그 5·6·9·13 유지) |
| `아삭이고추무침.자율.중 (5.6.13)` | `아삭이고추무침` |
| `쇠고기미역국.중.신 (5.6.13.16)` | `쇠고기미역국` |
| `매운돼지갈비찜(21-중-식).중 (5.6.10.13)` | `매운돼지갈비찜` |
| `연두부찜(벌크,원통형)/양념장` | `연두부찜/양념장` (`/` 는 대상 아님) |
| `훈제오리+무쌈+치폴레마요소스` | `훈제오리+무쌈+치폴레마요소스` (변화 없음) |

> `scripts/fetch-neis.ps1` 도 같은 규칙으로 `data/meal.json` 의 `name` 을 만든다:
> `((($line -replace '\([^)]*\)', '') -split '[.\-]', 2)[0]).Trim()` — `raw` 는 원문 보존.

---

## 5. 화면 구성

바깥 `display:flex; flexDirection:column; gap:18px`.

### 5.1 헤더 줄 (가운데)

- `오늘의 급식` — `GangwonEdu 30px`
- 픽셀 태그 `LUNCH.EXE` — `Silkscreen 11px; background:#bfe9dd; border:3px solid #4b3b6b; borderRadius:6px`

### 5.2 보기 전환 칩

`mealViews` = `[['day','일간'],['week','주간'],['month','월간']]` → `chip(active, '#bfe9dd')`. 클릭 시 `setState({ mealView })`.

### 5.3 일간 보기 (`mealIsDay`) — `todayMeal`

- 카드: `maxWidth:560px; border:3px solid #4b3b6b; borderRadius:12px; overflow:hidden; background:#fffdf7; boxShadow:6px 6px 0 …`
- 헤더 스트립: `padding:9px 14px; borderBottom:3px solid #4b3b6b; background:#f9cade; display:flex; justifyContent:space-between`
  - 왼쪽 `TODAY_LUNCH`(Silkscreen 11px), 오른쪽 `{{ todayMeal.date }}` → `"2026.09.03 THU"` 형식(Silkscreen 10px)
- 본문: `padding:18px; gap:12px`
  - `todayMeal.items` 각각: `display:flex; flexDirection:column; alignItems:center; justifyContent:center; gap:6px; padding:10px 12px; border:3px solid #4b3b6b; borderRadius:10px; background:#fdf6fa; textAlign:center`
    - 첫 줄: 메뉴 이름(`CookieRun 700 19px`) 가운데
    - 둘째 줄: 알레르기 태그들(§3.3) — `display:flex; gap:5px; flexWrap:wrap; justifyContent:center`.
      항목에 `hasAl: it.al.length > 0` 을 두고 `<sc-if value="{{ m.hasAl }}">` 로 감싸서, 태그 없는 메뉴는 둘째 줄을 그리지 않는다(2026-09-29)
  - 마지막 TOTAL 줄: `background:#bfe9dd; border:3px solid #4b3b6b; borderRadius:10px` — `TOTAL`(Silkscreen 10px `#3d7f6c`) · `오늘 전체 칼로리`(CookieRun 700 17px) · `{{ todayMeal.kcal }} kcal`(CookieRun 700 20px)
- **데이터 없는 날**: `items` = `[{ name: '오늘은 급식 정보가 없어요', al: [] }]`, `kcal: 0`

### 5.4 주간 보기 (`mealIsWeek`) — `weekMeals`

- 그리드: `gridTemplateColumns:repeat(auto-fit, minmax(190px,1fr)); gap:14px`
- 월~금 카드(`DAYS`). `weekMeals[i]`:
  - `day` = `"월요일"` …, `date` = `"09.01"`, `color` = 요일별 `['#f9cade','#c4d8f7','#bfe9dd','#fbe6a2','#d6c4f5'][i]`
  - `items` = 그날 메뉴 이름 배열(`dishName` 적용). 급식 없으면 `['급식 없음']`
  - `kcal` = 숫자(없으면 0)
- 카드: `border:3px solid #4b3b6b; borderRadius:12px; overflow:hidden; background:#fffdf7; boxShadow:4px 4px 0 …`
  - 헤더 스트립 배경 = `w.color`, 요일(CookieRun 700 17px) + 날짜(Silkscreen 9px)
  - 본문: `padding:12px 14px; gap:6px; fontSize:14px` — 각 메뉴 `· 메뉴이름`, 맨 아래 `{{ w.kcal }} KCAL`(Silkscreen 9px `#9c8dc4`)

### 5.5 월간 보기 (`mealIsMonth`) — `mealMonthCells`

- `monthGrid(fn)`(timetable.md §4.6 와 같은 **2026년 9월** 달력). 요일 헤더 배경 `#bfe9dd`.
- 각 날짜 칸: `fn(day)` 이 `menu` = 그날 메뉴 이름 배열 **최대 6개**(`dishName` 적용) 반환. 급식 없으면 빈 배열. 주말은 `휴무`.
- 칸 안 메뉴: `display:flex; flexDirection:column; alignItems:center; gap:2px; fontSize:11px; lineHeight:1.4; color:#6b5b93; textAlign:center` — 한 줄에 하나씩.
- 오늘 칸 강조/주말 배경은 `monthGrid` 규칙(timetable.md §4.6) 그대로.

---

## 6. 엣지 케이스

- **급식 없는 날**(주말·공휴일·방학): 실시간/스냅샷 모두 그 날짜 키가 없음 → 일간 "오늘은 급식 정보가 없어요", 주간 "급식 없음", 월간 빈 칸.
- **주간이 두 달 걸침**: `loadMeal` 은 오늘이 속한 달만 받으므로, 그 주에 지난달 날짜가 섞이면 그 칸은 "급식 없음" 이 될 수 있다(허용).
- **kcal 파싱**: `CAL_INFO` 예 `"803.7 Kcal"` → 숫자만 추출 후 `Math.round` → `804`. 값 없으면 0.
- **알레르기 없는 메뉴**: `al` 빈 배열 → 태그 없이 이름만.
- **CORS/네트워크 실패**: 스냅샷만 표시(앱 계속 동작).

---

## 7. 재현 체크리스트

- [ ] `mealServiceDietInfo` 무인증 호출 → `neisFetchAll` 페이지네이션(5행/페이지). `window.NEIS_KEY` 있으면 키
- [ ] 인라인 스냅샷 즉시 렌더 → 이번 달 실시간으로 덮어씀
- [ ] `dishName`: `(...)` 제거 → 첫 `.`/`-` 컷 → trim. §4 표의 원문→표시가 글자까지 일치
- [ ] 알레르기: 원문 끝 `(숫자.숫자…)` 파싱 → `ALLERGENS` 표. **일간만** 태그 표시, **이름만(번호 X)**, 색 일치
- [ ] 일간: TODAY_LUNCH 카드 + 메뉴별 태그 + TOTAL kcal 줄. 없는 날 문구
- [ ] 주간: 월~금 카드, 요일별 헤더색, `· 메뉴` 목록, `KCAL`
- [ ] 월간: 9월 달력, 칸당 최대 6개 메뉴, 주말 `휴무`, 오늘 강조
- [ ] 중식만. 단일 라이트 테마, 하드 섀도우 blur 0
