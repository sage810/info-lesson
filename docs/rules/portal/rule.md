# 이용 규칙 탭 — 재현 명세

> 📌 **구조 개편(2026-09-24) 전에 쓴 문서입니다.** 본문 속 `output/dataN.html`·`data4_1.html` 같은 이름은 지금의 `lessons/<단원>/<차시>/lesson.html` 에 해당하고, 폰트·라이브러리·이미지는 빌드 때 자동으로 인라인됩니다(`npm run build`). 여기 적힌 **디자인·동작 규칙**은 그대로 유효합니다.


`output/data4.html` 의 첫 번째 탭(`📜 이용 규칙`). 다른 AI 에이전트가 이 문서만 보고 동일한 결과를 만들 수 있도록 정리한다.
시각 토큰·컴포넌트 규칙의 근거는 `docs/rules/design.md` 다. 이 문서는 그 위에서 **이 탭의 내용·구조**를 고정한다.

---

## 1. 개요

- **위치**: `data4.html` 의 `<x-dc>` 안 `<sc-if value="{{ isRules }}">` 블록. 탭 상태 `state.tab === 'rules'` 일 때 렌더.
- **성격**: **완전 정적**. API·입력·상태 없음. 문구/색/구조가 전부 하드코딩.
- **초기 탭**: `state.tab` 의 기본값이 `'rules'` 이므로 페이지를 열면 이 탭이 먼저 보인다.
- **런타임**: Claude Design `<x-dc>` + `support.js`. 재구현 시 `<x-dc>`/`{{ }}`/`support.js` 는 버리고 정적 HTML/CSS 로 옮기되 시각 결과만 픽셀 단위로 맞춘다(design.md §8).

---

## 2. 상단 창(모든 탭 공통)

이 탭만이 아니라 4개 탭이 공유하는 껍데기. `docs/rules/design.md` §3.2 · §9 와 동일.

- 바깥: `background:#fffdf7; border:4px solid #4b3b6b; borderRadius:16px; boxShadow:8px 8px 0 rgba(75,59,107,.22); overflow:hidden`
- 타이틀바: `padding:14px 16px 0; borderBottom:4px solid #4b3b6b; background:linear-gradient(90deg,#f9cade 0%,#d6c4f5 55%,#c4d8f7 100%)`
  - 제목 `🏫 신현중학교 정보` — `fontFamily:'GangwonEdu'; fontSize:25px; letterSpacing:.5px`
  - 창 버튼 3개 `_ □ X` — 각 `26×22px; border:3px solid #4b3b6b; borderRadius:5px; fontFamily:'Silkscreen'`, `X` 만 배경 `#f7a8c4`
  - 탭 버튼 4개(순서 고정): `📜 이용 규칙` / `🕒 시간표` / `🍚 오늘의 급식` / `✏️ 수업 활동지`
    - 스타일은 `tabStyle(active,color,cap)` (design.md §3.4). 탭별 `color`/`cap`:
      | 탭 | color | cap |
      |---|---|---|
      | 이용 규칙 | `#fbe6a2` | `#f0c95c` |
      | 시간표 | `#c4d8f7` | `#7fa9e8` |
      | 오늘의 급식 | `#bfe9dd` | `#6fc9b0` |
      | 수업 활동지 | `#f9cade` | `#ee9dbf` |
- 창 본문 컨테이너: `padding:24px 22px 30px`
- 전체 래퍼: `zoom:1.1`, 페이지 배경은 격자(`#e7e3f7` + `#d8d2ee` 1px 격자, `backgroundSize:28px 28px`), `maxWidth:1080px; margin:0 auto`
- 하단 푸터: `@sage810` (GitHub 아이콘 + 텍스트, `Maplestory` 14px `#6b7fa8`)

---

## 3. 이용 규칙 탭 본문 — 구조와 문구(고정)

바깥은 `display:flex; flexDirection:column; gap:18px`.

### 3.1 헤더 줄

- `컴퓨터실 이용 규칙` — `fontFamily:'GangwonEdu'; fontSize:30px`
- 픽셀 태그 `READ ME` — `Silkscreen 11px; background:#fbe6a2; border:3px solid #4b3b6b; borderRadius:6px; padding:4px 8px`

### 3.2 HOW_TO_USE.txt 카드

- 카드: `border:4px solid #4b3b6b; borderRadius:14px; background:#fdf6fa; boxShadow:6px 6px 0 rgba(75,59,107,.2); overflow:hidden`
- 헤더 스트립: `padding:9px 14px; borderBottom:3px solid #4b3b6b; background:linear-gradient(90deg,#f9cade,#d6c4f5); Silkscreen 11px` → 텍스트 `HOW_TO_USE.txt`
- 본문: `padding:18px 20px 20px; gap:14px`
  - 소제목 `컴퓨터실, 이렇게 사용해요!` — `GangwonEdu 26px`
  - 4칸 그리드: `gridTemplateColumns:repeat(auto-fit, minmax(220px,1fr)); gap:12px`. 각 칸 `padding:12px 14px; border:3px solid #4b3b6b; borderRadius:11px; CookieRun 700 16px`, 왼쪽 `30×30px` 아이콘 배지(`border:3px solid #4b3b6b; borderRadius:8px; background:#fffdf7`).
    | 아이콘 | 문구 | 칸 배경 |
    |---|---|---|
    | 🧴 | 손소독제 or 손씻기 | `#bfe9dd` |
    | 🪑 | 자기 자리 앉기 | `#c4d8f7` |
    | 🚫 | 물 & 음료 & 간식 X | `#fbe6a2` |
    | 🚫 | 의자 이동 X | `#f7bfb2` |

### 3.3 RULE_0N.txt 카드 3개

- 그리드: `gridTemplateColumns:repeat(auto-fit, minmax(260px,1fr)); gap:16px`
- 각 카드: `border:3px solid #4b3b6b; borderRadius:12px; boxShadow:5px 5px 0 rgba(75,59,107,.18); overflow:hidden`
- 헤더 스트립: `padding:8px 12px; borderBottom:3px solid #4b3b6b; Silkscreen 11px` + 파일명 텍스트
- 본문: `padding:14px 16px; gap:8px; fontSize:15px; lineHeight:1.7`, 소제목은 `CookieRun 700 19px`
- 항목은 `• ` 접두. 문구 그대로:

| 태그 | 카드 배경 | 헤더 배경 | 소제목 | 항목 |
|---|---|---|---|---|
| `RULE_01.txt` | `#fdf3f8` | `#f9cade` | 들어올 때 | • 손을 씻고 들어와요.<br>• 내 자리 번호를 확인하고 앉아요.<br>• 수업을 위해 로그인을 먼저 하고, 타자 연습을 해요. |
| `RULE_02.txt` | `#f2f6fe` | `#c4d8f7` | 사용할 때 | • 수업 할 때는 수업과 관련되지 않은 걸 하지 않아요.<br>• 친구 노트북을 함부로 만지지 않아요.<br>• 궁금한 건 손을 들고 물어봐요. |
| `RULE_03.txt` | `#f2fbf7` | `#bfe9dd` | 나갈 때 | • 노트북 모니터를 닫지 않아요.<br>• 의자를 제자리에 넣어요. |

### 3.4 하단 두 박스 (MESSAGE + LOADING)

`display:flex; gap:14px; flexWrap:wrap; alignItems:stretch`

**MESSAGE** (`flex:1; minWidth:280px`)
- 카드: `border:3px solid #4b3b6b; borderRadius:12px; background:#fffdf7; boxShadow:5px 5px 0 rgba(75,59,107,.18)`
- 헤더: `padding:8px 12px; borderBottom:3px solid #4b3b6b; background:#d6c4f5; Silkscreen 11px` → `MESSAGE`
- 본문: `padding:16px; display:flex; gap:14px; alignItems:center`
  - 원형 아이콘: `54×54px; borderRadius:50%; border:3px solid #4b3b6b; background:#f9cade; fontSize:26px; animation:floaty 3s ease-in-out infinite` — 내용 `♥`
  - 문구: `fontSize:15px; lineHeight:1.7` — `약속을 지키면 모두가 즐거운 수업이 돼요.` 줄바꿈 `세 가지만 기억해요 — ` + `<b>조용히, 함께, 깨끗하게!</b>`

**LOADING** (`width:210px`)
- 카드 스타일 동일, 헤더 배경 `#fbe6a2` → `LOADING`
- 본문: `padding:16px; gap:10px`
  - `> GOOD MANNERS 100%` — `Silkscreen 10px`
  - 진행 막대: `height:16px; border:3px solid #4b3b6b; borderRadius:4px; padding:2px; gap:2px; background:#fff`, 안에 6칸 `flex:1` — 색 순서: `#f7a8c4 #f7a8c4 #d6c4f5 #d6c4f5 #c4d8f7 #c4d8f7`

---

## 4. 인쇄 / 접근성

- design.md §6 `@media print` 그대로: 조작 UI 숨김, 그림자 제거, 색 헤더 유지, `break-inside:avoid`, `@page{margin}`.
- 이 탭엔 입력·상태가 없으므로 특별한 a11y 처리는 없다. `floaty` 애니메이션은 `@media (prefers-reduced-motion:reduce)` 로 끈다(design.md §5).
- 단일 라이트 테마. 모든 색을 토큰으로 명시(design.md §8).

---

## 5. 재현 체크리스트

- [ ] 4개 탭 껍데기 + 타이틀바 그라디언트/창버튼/탭 스타일이 design.md §3.2·§3.4 와 일치
- [ ] 이 탭이 기본 활성(첫 화면)
- [ ] HOW_TO_USE 카드: 4칸 그리드, 아이콘/문구/배경색이 §3.2 표와 동일
- [ ] RULE_01~03 카드: 파일명 태그·배경·소제목·`•` 항목 문구가 §3.3 표와 글자까지 동일
- [ ] MESSAGE(♥, floaty) + LOADING(6칸 막대, 색 순서) 박스
- [ ] 하드 섀도우는 항상 오프셋만(blur 0), 색 `rgba(75,59,107,α)`
- [ ] Silkscreen 은 라틴 라벨에만(한글에 쓰지 않음)
