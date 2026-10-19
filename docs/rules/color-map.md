# 역할 → 색 표 (자동 생성)

> **직접 고치지 않는다.** `design/tokens.json` 의 `role` 을 고치고 `node design/build.mjs` 를 돌리면
> 이 표와 `design/tokens.css`, 그리고 `<style id="msi-role-tokens">` 표식이 있는 활동지(새 차시 틀 `lessons/_templates/order`)가 함께 바뀐다.
> 색을 왜 그렇게 정했는지(선생님 피드백 이력)는 `docs/rules/order.md`.

- 활동지에서는 `var(--msi-role-이름)` 으로 쓴다(예: `background:var(--msi-role-progress-head)`).
- 카드는 **머리(-head) · 몸통(-body)** 를 한 벌로 쓴다. 활동이 5개 이상이면 act1~act4 를 차례로 돌려 쓴다.
- 오로라 빛처럼 투명도가 필요한 곳은 `color-mix(in srgb, var(--msi-role-aurora-pink) 60%, transparent)`.


## 창·배경

| 역할 | 토큰 | 값 |
|---|---|---|
| 창 바깥 배경 바탕 라벤더 | `--msi-role-page-bg` | `#e7e3f7` |
| 바깥 배경 모눈 선(28px) | `--msi-role-page-grid` | `rgba(216,210,238,.75)` |
| 오로라 빛 — 분홍(바깥 배경·창·TODAY_TOPIC·MY_INFO·PDF 버튼 뒤 빛) | `--msi-role-aurora-pink` | `#f7b3d6` |
| 오로라 빛 — 하늘 | `--msi-role-aurora-sky` | `#9fd3f7` |
| 오로라 빛 — 라벤더 | `--msi-role-aurora-lavender` | `#c4b2f7` |
| 오로라 lavender 20% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a20` | `rgba(196,178,247,.2)` |
| 오로라 lavender 28% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a28` | `rgba(196,178,247,.28)` |
| 오로라 lavender 60% — aurora-lavender 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-lavender-a60` | `rgba(196,178,247,.6)` |
| 오로라 pink 20% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a20` | `rgba(247,179,214,.2)` |
| 오로라 pink 32% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a32` | `rgba(247,179,214,.32)` |
| 오로라 pink 60% — aurora-pink 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-pink-a60` | `rgba(247,179,214,.6)` |
| 오로라 sky 20% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a20` | `rgba(159,211,247,.2)` |
| 오로라 sky 32% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a32` | `rgba(159,211,247,.32)` |
| 오로라 sky 60% — aurora-sky 를 바꾸면 같이 바꾼다(PDF 캡처가 color-mix 를 못 읽어 따로 둠) | `--msi-role-aurora-sky-a60` | `rgba(159,211,247,.6)` |
| 창 몸통(크림 서리 유리의 바탕) | `--msi-role-window-body` | `#fffdf7` |
| 제목줄(학교 이름 + 탭) | `--msi-role-titlebar-head` | `linear-gradient(90deg,#f9cade 0%,#d6c4f5 55%,#c4d8f7 100%)` |

## 메뉴 탭(고른 탭)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고른 탭 — 이용 규칙(솜사탕) | `--msi-role-tab-rules` | `linear-gradient(135deg,#fff6d6 0%,#ffe6c7 55%,#ffd6d6 100%)` |
| 고른 탭 — 시간표 | `--msi-role-tab-time` | `linear-gradient(135deg,#e3f4ff 0%,#d9e2ff 55%,#e6d9ff 100%)` |
| 고른 탭 — 오늘의 급식 | `--msi-role-tab-meal` | `linear-gradient(135deg,#e8fbe9 0%,#d4f4ec 55%,#d6ecff 100%)` |
| 고른 탭 — 수업 활동지(오로라) | `--msi-role-tab-sheet` | `linear-gradient(135deg,#fde1f3 0%,#e7dcff 50%,#d6f1ff 100%)` |

## 수업 활동지 카드

| 역할 | 토큰 | 값 |
|---|---|---|
| TODAY_TOPIC 머리(보라→하늘) | `--msi-role-topic-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| TODAY_TOPIC 몸통 | `--msi-role-topic-body` | `#f6f8fd` |
| MY_INFO 머리(노랑) | `--msi-role-myinfo-head` | `#fbe6a2` |
| MY_INFO 몸통 | `--msi-role-myinfo-body` | `#fffdf7` |
| TODAY_GOALS 머리(로즈 더스트) | `--msi-role-goals-head` | `#e8c4c4` |
| TODAY_GOALS 몸통 | `--msi-role-goals-body` | `#fcf5f5` |
| 오늘의 목표 번호 동전 | `--msi-role-goals-coin` | `linear-gradient(135deg,#f8e6e6,#e8c4c4)` |
| 도입 WARM_UP 머리(세이지) | `--msi-role-warmup-head` | `#c9e4dc` |
| 도입 WARM_UP 몸통 | `--msi-role-warmup-body` | `#f3faf7` |
| 도입 TODAY_TOPIC(학습주제 제시) 머리(연두) | `--msi-role-intro-head` | `#d8f0c4` |
| 도입 TODAY_TOPIC 몸통 | `--msi-role-intro-body` | `#f7fcf2` |
| 전개 ACTIVITY_1 머리·질문 스티커(하늘) | `--msi-role-act1-head` | `#c4d8f7` |
| ACTIVITY_1 몸통 | `--msi-role-act1-body` | `#f4f8fe` |
| ACTIVITY_2 머리·질문 스티커(민트) | `--msi-role-act2-head` | `#bfe9dd` |
| ACTIVITY_2 몸통 | `--msi-role-act2-body` | `#f1fbf7` |
| ACTIVITY_3 머리·질문 스티커(라임 소다) | `--msi-role-act3-head` | `linear-gradient(90deg,#f1f8b8 0%,#d6f0a8 100%)` |
| ACTIVITY_3 몸통 | `--msi-role-act3-body` | `#fbfdf0` |
| ACTIVITY_4 머리·질문 스티커(라벤더) | `--msi-role-act4-head` | `#d6c4f5` |
| ACTIVITY_4 몸통 | `--msi-role-act4-body` | `#f8f4fe` |
| 정리 KEY_SUMMARY 머리(연어) | `--msi-role-summary-head` | `#f7bfb2` |
| KEY_SUMMARY 몸통 | `--msi-role-summary-body` | `#fff4f1` |
| 정리 CHECK_UP 머리(라일락) | `--msi-role-checkup-head` | `#eec6ea` |
| CHECK_UP 몸통 | `--msi-role-checkup-body` | `#fdf5fc` |
| 형성평가 번호 동전 | `--msi-role-checkup-coin` | `linear-gradient(135deg,#f9e3f6,#eec6ea)` |

## 왼쪽 고정 카드

| 역할 | 토큰 | 값 |
|---|---|---|
| 왼쪽 PROGRESS 머리(살구) | `--msi-role-progress-head` | `#ffe0cc` |
| PROGRESS 몸통 | `--msi-role-progress-body` | `#fffdf7` |
| 왼쪽 HELP 머리(베이지) | `--msi-role-help-head` | `#e8d9b8` |
| HELP 몸통 | `--msi-role-help-body` | `#fffdf7` |

## PDF 버튼

| 역할 | 토큰 | 값 |
|---|---|---|
| PDF 버튼 유리 속(오로라) | `--msi-role-pdf-btn` | `linear-gradient(120deg,rgba(253,225,243,.75),rgba(231,220,255,.75) 50%,rgba(214,241,255,.75))` |
| PDF 저장 끝남(민트) | `--msi-role-pdf-done` | `linear-gradient(135deg,#a8e6cf 0%,#7fd6c0 100%)` |
| PDF 저장 실패(연어) | `--msi-role-pdf-error` | `linear-gradient(135deg,#ffb3bd 0%,#f58a9b 100%)` |

## 고르기 칩(분석 유형)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고르기 칩(분석 유형) 유리 속 — PDF 버튼과 같은 오로라 | `--msi-role-chip-glass` | `linear-gradient(120deg,rgba(253,225,243,.75),rgba(231,220,255,.75) 50%,rgba(214,241,255,.75))` |
| 고르기 칩 — 맞게 고름(민트 + ✓) | `--msi-role-chip-ok` | `linear-gradient(135deg,#a8e6cf 0%,#7fd6c0 100%)` |
| 고르기 칩 — 틀리게 고름(연어 + ✗) | `--msi-role-chip-no` | `linear-gradient(135deg,#ffb3bd 0%,#f58a9b 100%)` |

## 이용 규칙 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 이용 규칙 HOW_TO_USE 머리 | `--msi-role-howto-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| HOW_TO_USE 몸통 | `--msi-role-howto-body` | `#f6f8fd` |
| RULE_01 머리(피치 셔벗) | `--msi-role-rule1-head` | `linear-gradient(90deg,#ffe3d0,#ffd0c4)` |
| RULE_01 몸통 | `--msi-role-rule1-body` | `#fff8f4` |
| RULE_02 머리(라임 소다) | `--msi-role-rule2-head` | `linear-gradient(90deg,#f1f8b8,#d6f0a8)` |
| RULE_02 몸통 | `--msi-role-rule2-body` | `#fbfdf0` |
| RULE_03 머리(민트) | `--msi-role-rule3-head` | `#bfe9dd` |
| RULE_03 몸통 | `--msi-role-rule3-body` | `#f2fbf7` |
| MESSAGE 머리(라벤더) | `--msi-role-message-head` | `#d6c4f5` |
| MESSAGE 몸통 | `--msi-role-message-body` | `#fffdf7` |
| LOADING 머리(노랑) | `--msi-role-loading-head` | `#fbe6a2` |
| LOADING 몸통 | `--msi-role-loading-body` | `#fffdf7` |

## 보기 버튼(시간표·급식)

| 역할 | 토큰 | 값 |
|---|---|---|
| 고른 보기 버튼 — 일간(바닐라) · 시간표·급식 같음 | `--msi-role-view-day` | `linear-gradient(135deg,#fbf1d2,#f1dfb6)` |
| 고른 보기 버튼 — 주간(세이지) | `--msi-role-view-week` | `linear-gradient(135deg,#e7f1e4,#d2e5cc)` |
| 고른 보기 버튼 — 월간(로즈) | `--msi-role-view-month` | `linear-gradient(135deg,#f6e1e6,#e8cad3)` |

## 시간표 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 시간표 주간 머리 줄(TIME·월~금) | `--msi-role-tt-week-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| 시간표 월간 요일 줄(SUN~SAT) | `--msi-role-tt-month-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| 시간표 주간 첫 열(교시 칸) | `--msi-role-tt-time-col` | `#f7f4fd` |
| 시간표 GRADE/CLASS 상자 | `--msi-role-tt-grade-box` | `#f7f4fd` |

## 오늘의 급식 탭

| 역할 | 토큰 | 값 |
|---|---|---|
| 급식 일간 TODAY_LUNCH 머리 | `--msi-role-lunch-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| TODAY_LUNCH 몸통 | `--msi-role-lunch-body` | `#fffdf7` |
| 급식 TOTAL 칼로리 상자(피치 셔벗) | `--msi-role-lunch-total` | `linear-gradient(90deg,#ffe3d0,#ffd0c4)` |
| 급식 월간 요일 줄 | `--msi-role-lunch-month-head` | `linear-gradient(90deg,#d6c4f5 0%,#c4d8f7 55%,#cfeaf5 100%)` |
| 급식 주간 월요일 카드 머리(코랄) | `--msi-role-lunch-mon` | `linear-gradient(135deg,#ffc9bf,#ffb3a7)` |
| 화요일(살구노랑) | `--msi-role-lunch-tue` | `linear-gradient(135deg,#ffe4a3,#ffd685)` |
| 수요일(연두) | `--msi-role-lunch-wed` | `linear-gradient(135deg,#d9f2b4,#c2e89a)` |
| 목요일(청록) | `--msi-role-lunch-thu` | `linear-gradient(135deg,#b5e8e4,#99dbd6)` |
| 금요일(라벤더블루) | `--msi-role-lunch-fri` | `linear-gradient(135deg,#c9cbf7,#b3b6ef)` |

## 과목 색(시간표 19과목)

| 역할 | 토큰 | 값 |
|---|---|---|
| 국어 — 언어(분홍) | `--msi-role-subj-korean` | `linear-gradient(135deg,#f8b8ca,#fca3be)` |
| 영어 — 언어 | `--msi-role-subj-english` | `linear-gradient(135deg,#fed5e0,#ffc3d4)` |
| 한문 — 언어 | `--msi-role-subj-hanmun` | `linear-gradient(135deg,#ffedff,#fddbfd)` |
| 생활 중국어 — 언어 | `--msi-role-subj-chinese` | `linear-gradient(135deg,#fef2f1,#ffe4e1)` |
| 사회 — 사회(주황·금빛) | `--msi-role-subj-social` | `linear-gradient(135deg,#f2c19a,#f5b076)` |
| 역사 — 사회 | `--msi-role-subj-history` | `linear-gradient(135deg,#fed9c3,#fec9aa)` |
| 도덕 — 사회 | `--msi-role-subj-ethics` | `linear-gradient(135deg,#fff4dd,#fde9be)` |
| 체육 — 예체능(연두·초록) | `--msi-role-subj-pe` | `linear-gradient(135deg,#c6d59c,#b8cc79)` |
| 미술 — 예체능 | `--msi-role-subj-art` | `linear-gradient(135deg,#e8e4b4,#e0d993)` |
| 음악 — 예체능 | `--msi-role-subj-music` | `linear-gradient(135deg,#e4fde5,#d2f7d4)` |
| 수학 — 수리·과학(민트·하늘) | `--msi-role-subj-math` | `linear-gradient(135deg,#93ddce,#64d8c4)` |
| 과학 — 수리·과학 | `--msi-role-subj-science` | `linear-gradient(135deg,#c2eecf,#a7e8bb)` |
| 정보 — 수리·과학 | `--msi-role-subj-info` | `linear-gradient(135deg,#e1fbfe,#bdf7ff)` |
| 기술·가정 — 수리·과학 | `--msi-role-subj-tech-home` | `linear-gradient(135deg,#b0eef6,#8ae7f3)` |
| 동아리활동 — 창체(파랑·보라) | `--msi-role-subj-club` | `linear-gradient(135deg,#d4c2f8,#ccb1fe)` |
| 자율·자치활동 — 창체 | `--msi-role-subj-autonomy` | `linear-gradient(135deg,#a0d3f8,#7ecaff)` |
| 진로활동 — 창체 | `--msi-role-subj-career` | `linear-gradient(135deg,#ecd8ff,#e5c8ff)` |
| 자율활동 — 창체 | `--msi-role-subj-self` | `linear-gradient(135deg,#d0e3fe,#bdd8fe)` |
| 봉사활동 — 창체 | `--msi-role-subj-volunteer` | `linear-gradient(135deg,#f1f5fe,#e2ebff)` |

## 급식 알레르기 19가지

| 역할 | 토큰 | 값 |
|---|---|---|
| 급식 알레르기 1 난류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff4d6d) | `--msi-role-allergen-1` | `#ffd1d3` |
| 급식 알레르기 10 돼지고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #3d5afe) | `--msi-role-allergen-10` | `#d1deff` |
| 급식 알레르기 11 복숭아 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #7c4dff) | `--msi-role-allergen-11` | `#dcd9fe` |
| 급식 알레르기 12 토마토 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #b429ff) | `--msi-role-allergen-12` | `#ead3ff` |
| 급식 알레르기 13 아황산류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #e040fb) | `--msi-role-allergen-13` | `#f7cdfe` |
| 급식 알레르기 14 호두 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff2d95) | `--msi-role-allergen-14` | `#fecfde` |
| 급식 알레르기 15 닭고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff5252) | `--msi-role-allergen-15` | `#fed2ce` |
| 급식 알레르기 16 소고기 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #c1440e) | `--msi-role-allergen-16` | `#ffd3c4` |
| 급식 알레르기 17 오징어 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00867d) | `--msi-role-allergen-17` | `#95f2e7` |
| 급식 알레르기 18 조개류 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #5d6dff) | `--msi-role-allergen-18` | `#d3ddff` |
| 급식 알레르기 19 잣 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #8d6e00) | `--msi-role-allergen-19` | `#f6dc98` |
| 급식 알레르기 2 우유 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ff7a1a) | `--msi-role-allergen-2` | `#fed4be` |
| 급식 알레르기 3 메밀 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #ffb800) | `--msi-role-allergen-3` | `#fdd899` |
| 급식 알레르기 4 땅콩 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #e8d000) | `--msi-role-allergen-4` | `#ebe09a` |
| 급식 알레르기 5 대두 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #9ed900) | `--msi-role-allergen-5` | `#ceeaa9` |
| 급식 알레르기 6 밀 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #2fc744) | `--msi-role-allergen-6` | `#b9eeb9` |
| 급식 알레르기 7 고등어 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00c9a7) | `--msi-role-allergen-7` | `#9cf2da` |
| 급식 알레르기 8 게 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #00bcd4) | `--msi-role-allergen-8` | `#98eefe` |
| 급식 알레르기 9 새우 — 파스텔 칩(잉크 글자 7:1↑, 2026-10-16 시안 A · 원래 형광 #0091ff) | `--msi-role-allergen-9` | `#c6e1ff` |

## 기본 색(DESIGN.md 팔레트)

| 역할 | 토큰 | 값 |
|---|---|---|
| DESIGN.md 팔레트 — apricot | `--msi-role-base-apricot` | `#ffe0cc` |
| DESIGN.md 팔레트 — blush-paper | `--msi-role-base-blush-paper` | `#fdf6fa` |
| DESIGN.md 팔레트 — butter | `--msi-role-base-butter` | `#fbe6a2` |
| DESIGN.md 팔레트 — button-ink | `--msi-role-base-button-ink` | `#26224a` |
| DESIGN.md 팔레트 — cotton-pink | `--msi-role-base-cotton-pink` | `#f9cade` |
| DESIGN.md 팔레트 — cream-paper | `--msi-role-base-cream-paper` | `#fffdf7` |
| DESIGN.md 팔레트 — grid-line | `--msi-role-base-grid-line` | `#d8d2ee` |
| DESIGN.md 팔레트 — lavender | `--msi-role-base-lavender` | `#d6c4f5` |
| DESIGN.md 팔레트 — lavender-desk | `--msi-role-base-lavender-desk` | `#e7e3f7` |
| DESIGN.md 팔레트 — lilac | `--msi-role-base-lilac` | `#eec6ea` |
| DESIGN.md 팔레트 — link-berry | `--msi-role-base-link-berry` | `#c96a97` |
| DESIGN.md 팔레트 — live-violet | `--msi-role-base-live-violet` | `#7b5cd6` |
| DESIGN.md 팔레트 — mint | `--msi-role-base-mint` | `#bfe9dd` |
| DESIGN.md 팔레트 — muted-violet | `--msi-role-base-muted-violet` | `#6b5b93` |
| DESIGN.md 팔레트 — night-sky-ink | `--msi-role-base-night-sky-ink` | `#4b3b6b` |
| DESIGN.md 팔레트 — periwinkle | `--msi-role-base-periwinkle` | `#c4d8f7` |
| DESIGN.md 팔레트 — periwinkle-strong | `--msi-role-base-periwinkle-strong` | `#9db2f2` |
| DESIGN.md 팔레트 — placeholder-haze | `--msi-role-base-placeholder-haze` | `#b3a8cc` |
| DESIGN.md 팔레트 — salmon | `--msi-role-base-salmon` | `#f7bfb2` |
| DESIGN.md 팔레트 — sand | `--msi-role-base-sand` | `#e8d9b8` |
| DESIGN.md 팔레트 — sky | `--msi-role-base-sky` | `#cfeaf5` |
| DESIGN.md 팔레트 — sprout | `--msi-role-base-sprout` | `#d8f0c4` |
| DESIGN.md 팔레트 — white | `--msi-role-base-white` | `#ffffff` |

## 4탭 공통 화면(상태·칸·안내 상자 등)

| 역할 | 토큰 | 값 |
|---|---|---|
| 아쿠아 칩(동아리 시간 등) | `--msi-role-ui-aqua` | `#a9dce4` |
| 월간 시간표 표시 글자 | `--msi-role-ui-badge-ink` | `#6b5b93` |
| 처리 중 줄무늬 A | `--msi-role-ui-busy-a` | `#c4cce8` |
| 처리 중 줄무늬 B | `--msi-role-ui-busy-b` | `#d6dcf3` |
| 안내 상자 — 질문 | `--msi-role-ui-callout-ask` | `#fff6e6` |
| 안내 상자 — 이유 | `--msi-role-ui-callout-reason` | `#eef9f3` |
| 안내 상자 — 팁 | `--msi-role-ui-callout-tip` | `#f3eefe` |
| 안내 상자 — 주의 | `--msi-role-ui-callout-warn` | `#fdf0ee` |
| 작은 캡션 글자(EMPTY · DROP HERE · KCAL 등) | `--msi-role-ui-caption-violet` | `#6b5b93` |
| 날짜 글자 | `--msi-role-ui-date-ink` | `#5a4a86` |
| 진한 보라 글자(순서 배열 태그 등) | `--msi-role-ui-deep-violet` | `#6b559b` |
| 빈 칸·다른 달 칸 바탕 | `--msi-role-ui-empty-cell` | `#f1edf9` |
| 빈 시간표 칸 글자 | `--msi-role-ui-empty-ink` | `#b9aedb` |
| 퀴즈 틀림 바탕 | `--msi-role-ui-feedback-no-bg` | `#fdf3f0` |
| 퀴즈 틀림 글자 · GOAL 라벨 | `--msi-role-ui-feedback-no-ink` | `#a65a86` |
| 퀴즈 맞음 바탕 | `--msi-role-ui-feedback-ok-bg` | `#eaf8f2` |
| 퀴즈 맞음 글자 | `--msi-role-ui-feedback-ok-ink` | `#3d7f6c` |
| 입력·끌어 놓기 칸 포커스·강조 테두리 | `--msi-role-ui-focus-pink` | `#ee9dbf` |
| 맨 아래 @sage810 | `--msi-role-ui-footer-ink` | `#556485` |
| 작은 보조 버튼 올림 | `--msi-role-ui-ghost-hover` | `#fff1ee` |
| 흐린 초록(예전 과목 색 · 체육) | `--msi-role-ui-green-mut` | `#c9e8b8` |
| 도움말 펼침 카드 바탕 | `--msi-role-ui-guide-body` | `#eef9f8` |
| 예전 과목 색 · 보건 | `--msi-role-ui-health-pink` | `#f5b7c8` |
| 그래프 시각화하기 도움말 바탕 | `--msi-role-ui-help-box` | `#faf8ff` |
| HELP 버튼 올림 | `--msi-role-ui-help-btn-hover` | `#f1eff7` |
| HELP 버튼 펼침 | `--msi-role-ui-help-btn-open` | `#e6def7` |
| 형광펜 라일락 | `--msi-role-ui-hl-lilac` | `#f6d3f0` |
| 링크 올림 | `--msi-role-ui-link-hover` | `#5e498d` |
| 시간표 — 지금 교시 줄 바탕 | `--msi-role-ui-live-row` | `#f6f2ff` |
| 시간표 NOTE 라벨 글자 | `--msi-role-ui-note-ink` | `#79632c` |
| 올리브(예전 과목 색 · 자율) | `--msi-role-ui-olive` | `#e3e0b0` |
| 아주 옅은 보라 바탕 | `--msi-role-ui-pale-violet` | `#faf7ff` |
| 붙여넣기 칸 안내 글자 | `--msi-role-ui-paste-hint-ink` | `#6b5b93` |
| 종이 버튼 눌림 바탕 | `--msi-role-ui-periwinkle-press` | `#8296e0` |
| 창 X 버튼 · 진한 분홍 칸 | `--msi-role-ui-pink-strong` | `#f7a8c4` |
| 흐린 보라 칩(동아리 활동 등) | `--msi-role-ui-purple-mut` | `#c9c2ea` |
| 연보라 칸 바탕(주말·교시 칸·GRADE 상자) | `--msi-role-ui-soft-lavender` | `#f7f4fd` |
| 상태 — 완료 바탕 | `--msi-role-ui-status-past-bg` | `#ece9f3` |
| 상태 — 완료 글자 | `--msi-role-ui-status-past-ink` | `#6b5b93` |
| 상태 — 예정 글자 | `--msi-role-ui-status-upcoming-ink` | `#7b6ba8` |
| 상태 — 예정 점선 | `--msi-role-ui-status-upcoming-line` | `#cfc6e6` |
| 단계 번호 빨강(흰 글자) | `--msi-role-ui-step-red` | `#c0392b` |
| 빈 칸 줄무늬 크림 | `--msi-role-ui-stripe-cream` | `#f8f1e2` |
| 빈 칸 줄무늬 연보라 | `--msi-role-ui-stripe-violet-a` | `#fbf8ff` |
| 빈 칸 줄무늬 보라 | `--msi-role-ui-stripe-violet-b` | `#f1ecfb` |
| 핵심 요약 표 머리 | `--msi-role-ui-summary-th` | `#f6e6e6` |
| 시간표 끝나는 시각 글자 | `--msi-role-ui-time-end-ink` | `#6b5b93` |
| 달력 오늘 칸 바탕 | `--msi-role-ui-today-cell` | `#fdeaf3` |
| 급식 TOTAL 글자 | `--msi-role-ui-total-ink` | `#8a4f36` |
| 입력칸 자리표시자 글자(분홍 종이 위 4.5:1↑, 2026-10-16 audit) | `--msi-role-ui-placeholder` | `#746d85` |
| 수업용 화면 「일반 소프트웨어」 이름표(선생님 지정 2026-10-19, 「인공지능 소프트웨어」는 base-lilac) | `--msi-role-ui-label-general` | `#ffd685` |

## 유리 · 움직임 · 손가락 크기 (색이 아닌 토큰 — 활동지 블록에 함께 들어감)

| 쓰임 | 토큰 | 값 |
|---|---|---|
| 유리 알약 윗면 빛띠(버튼·칩·PDF) | `--msi-glass-top` | `radial-gradient(120% 70% at 50% 0%,rgba(255,255,255,.75),rgba(255,255,255,0) 62%)` |
| 유리 머리 윗면 빛띠(카드 머리·탭·보기 버튼) | `--msi-glass-top-head` | `radial-gradient(120% 70% at 50% 0%,rgba(255,255,255,.7),rgba(255,255,255,0) 62%)` |
| 올리면 지나가는 빛 한 줄(background-size 300%, position 100% → 0%) | `--msi-glass-sheen` | `linear-gradient(100deg,rgba(255,255,255,0) 42%,rgba(255,255,255,.6) 50%,rgba(255,255,255,0) 58%)` |
| 흰 유리 막(오로라 속 위) | `--msi-glass-white` | `linear-gradient(150deg,rgba(255,255,255,.62),rgba(255,255,255,.14) 55%,rgba(255,255,255,.42))` |
| 유리 알약 안쪽 흰 테(위 1.5px · 아래 속광) — box-shadow 앞쪽에 | `--msi-glass-inset` | `inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 -8px 14px -10px rgba(255,255,255,.9)` |
| PDF 큰 알약 안쪽 흰 테 | `--msi-glass-inset-big` | `inset 0 1.5px 0 rgba(255,255,255,.95),inset 0 -10px 18px -12px rgba(255,255,255,.9)` |
| 유리 머리 안쪽 흰 테(::after 에) | `--msi-glass-inset-head` | `inset 0 2px 0 rgba(255,255,255,.95), inset 0 -8px 12px -8px rgba(255,255,255,.95)` |
| PDF 버튼 뒤 흐림(backdrop-filter) — 터치 기기에선 끔 | `--msi-glass-backdrop` | `blur(14px) saturate(170%)` |
| 물방울 꾹(누름) — 튕기는 곡선 | `--msi-motion-ease-spring` | `cubic-bezier(.34,1.56,.64,1)` |
| 빛 쓱 · 그림자 · 펼침 | `--msi-motion-ease-out` | `cubic-bezier(.2,0,0,1)` |
| 유리 알약·칩 누름 | `--msi-motion-press` | `scale(1.04,.9)` |
| PDF 큰 알약 누름 | `--msi-motion-press-big` | `scale(1.03,.92)` |
| content-max | `--msi-size-content-max` | `1080px` |
| 문서형 화면 | `--msi-size-doc-max` | `980px` |
| 손가락으로 누르는 것의 최소 높이(태블릿·크롬북) | `--msi-size-touch-min` | `44px` |
| 그림·영상 최대 폭 | `--msi-part-figure-max` | `680px` |
| 이름표를 놓는 칸 최소 폭 | `--msi-part-slot-min` | `176px` |
| 여러 줄이 되는 알약(긴 보기 고르기 칩·순서 카드) 모서리 | `--msi-part-choice-radius` | `22px` |
| O/X 버튼 최소 폭 | `--msi-part-ox-min` | `56px` |
| 버튼 줄·개념 카드·이름표 줄 사이 | `--msi-part-gap` | `10px` |
| 그림을 누르면 나오는 영상 칸 기본 비율(그림과 같게, 다르면 그 영상에만 style 로) | `--msi-part-figure-ratio` | `680 / 300` |
