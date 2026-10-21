# 토큰 대응표 — theme-sticker → `--msi-role-*`

왼쪽이 우리 활동지 변수, 오른쪽이 새 값. `theme-sticker.html` 의 `:root` 와 1:1.

## 바탕
| 변수 | 값 | 쓰는 곳 |
|---|---|---|
| --msi-role-page-bg | #FAF2E1 | 바깥 배경 (크림 종이, 벽지 #F8F0E0) |
| --msi-role-page-grid | #E8D9C0 | 배경 점무늬 (radial-gradient 1.4px, 22px 간격) |
| --msi-role-base-night-sky-ink | #4A3B32 | 테두리·본문 글자 (갈색 잉크) |
| --msi-role-base-cream-paper | #FFFDF8 | 창·카드 몸통 기본·줄 배경 |
| --msi-role-base-blush-paper | #FEF2F5 | 입력칸·빈칸 바탕 |
| --msi-role-base-muted-violet | #7A6A60 | 흐린 설명 글자 (크림 위 5.3:1) |
| --msi-role-ui-placeholder | #857062 | 입력칸 안내 글 (blush 위 4.6:1) |

## 카드 한 벌 (-head / -body) — 위→아래 순서, 따뜻함(W)·차가움(C) 교대
첨부 벽지 6장에서 추출한 밀키 파스텔: 크림 #F8F0E0 · 베이비블루 #D8E8F8 · 밀키핑크 #F8B8C0 · 버터 #F8F0B8 · 민트 #98D8B8 · 피치 #F8E0D0 · 라벤더 #D0D0E8 · 연두 #B8D878 · 라일락 #F0C8E0. 머리색은 이 값들을 뽀얗게 올린 것.

| 순서 | 카드 | head | body |
|---|---|---|---|
| 1 | topic | #F9C4D0 밀키핑크 (W) | #FEF2F5 |
| 2 | **myinfo (새 이름)** | #D4E6F7 베이비블루 (C) | #F2F7FC |
| 3 | goals | #FBEFB4 버터 (W) | #FFFBE9 |
| 4 | warmup | #BFE6D6 민트 (C) | #EFF9F5 |
| 5 | intro | #FBDCC8 피치 (W) | #FEF6F0 |
| 6 | act1 | #DCD6EE 라벤더 (C) | #F6F4FB |
| 7 | act2 | #EFD0E6 라일락핑크 (W) | #FAF2F8 |
| 8 | act3 | #BFE1E6 아쿠아 (C) — 바다 | #EFF8F9 |
| 9 | act4 | #F8CFC4 살몬 (W) — 밥 | #FEF4F1 |
| 10 | summary | #D9E8B4 연두 (C) | #F5F9EC |
| 11 | checkup | #CDD9F3 페리윙클 (C) | #F2F5FC |
| 옆 | progress | #FBE3E8 블러시 | #FFFDF8 |

번호 동전(말풍선 동그라미: 44×44, 잉크선 2.5 + 왼쪽 아래 작은 꼬리, 파스텔 채움. 모양은 SVG data URI 배경 → `background: var(--…-coin-shape) center/44px 44px no-repeat`, 번호는 padding-bottom 5px 로 살짝 위):
- --msi-role-goals-coin #F6A8BC → --msi-role-goals-coin-shape (목표)
- --msi-role-checkup-coin #FBEFB4 → --msi-role-checkup-coin-shape (형성평가)
- **--msi-role-order-coin #D4E6F7 (새 이름, 순서 배열 ①~④)** — 이것만 말풍선이 아니라 **말랑 네모**: 40×40, radius 13px, 잉크 테두리 3px, chip 그림자, ①~④ 글자 20px. (--msi-role-order-coin-shape 는 예비)
- data URI 안에서는 var() 를 못 쓰므로 채움색을 바꾸면 *-coin-shape 의 fill 도 같이 바꿀 것 (잉크선 %234A3B32).
바깥 사이트 버튼 속 색은 새 토큰 --msi-role-btn-link #D4E6F7, 정답 확인 버튼은 warmup-head(#BFE6D6).

## 탭 (고른 탭 색)
| 변수 | 값 |
|---|---|
| --msi-role-tab-rules | #FFFDF8 |
| --msi-role-tab-time | #FFFDF8 |
| --msi-role-tab-meal | #FFFDF8 |
| --msi-role-tab-sheet | #FFFDF8 |

고른 탭은 네 탭 모두 흰 종이 알약(+ chip 그림자). 구별은 트랙(분홍) 위 흰 알약 하나로 충분.

## 버튼
| 변수 | 값 | 비고 |
|---|---|---|
| --msi-role-chip-glass | #FFFDF8 | 이름표·버튼 평소 속 색 (크림) |
| --msi-role-chip-ok | #DDF2E6 | 맞음 (= feedback-ok-bg) |
| --msi-role-chip-no | #FBE0E0 | 틀림 (= feedback-no-bg) |
| --msi-role-pdf-btn | #F7AEC0 | 평소 (밀키핑크, 글자 잉크) |
| --msi-role-pdf-done | #BFE6D6 | 저장했어요 (민트) |
| --msi-role-pdf-error | #F6B4AE | 다시 눌러 주세요 (살몬) |

정답 확인 버튼 속 색은 warmup-head(#BFE6D6), 바깥 사이트 버튼은 --msi-role-btn-link(#D4E6F7).

## 안내·채점
| 변수 | 값 |
|---|---|
| --msi-role-ui-callout-tip (📌) | #F1EEF9 (라벤더) |
| --msi-role-ui-callout-reason (💡) | #EEF7F2 (민트) |
| --msi-role-ui-feedback-ok-bg | #DDF2E6 |
| --msi-role-ui-feedback-ok-ink | #2F6B48 (bg 위 6:1) |
| --msi-role-ui-feedback-no-bg | #FBE0E0 |
| --msi-role-ui-feedback-no-ink | #A64A4A (bg 위 4.9:1) |
| --msi-role-ui-focus-pink | #E56A8E (크림 위 3.3:1) |

## 모양
| 변수 | 값 |
|---|---|
| --msi-radius-window | 22px |
| --msi-radius-card | 18px |
| --msi-radius-box | 14px (상자·표·그림·PDF 버튼) |
| --msi-radius-btn | 999px (버튼·이름표·O/X·탭) |
| --msi-radius-input | 12px |
| --msi-radius-tag | 8px (차시 태그·단계 이름표·빈칸) |
| --msi-border-window | 3px |
| --msi-border-base | 3px |
| --msi-border-small | 2px |
| --msi-shadow-window | 0 14px 34px rgba(74,59,50,0.14) |
| --msi-shadow-card | 0 8px 20px rgba(74,59,50,0.10) |
| --msi-shadow-btn | 0 4px 10px rgba(74,59,50,0.14) |
| --msi-shadow-chip | 0 3px 8px rgba(74,59,50,0.14) |
| --msi-shadow-press | 0 1px 2px rgba(74,59,50,0.12) |

## 새 값 (맞는 자리 없음 — 새 이름)
| 변수 | 값 | 쓰는 곳 |
|---|---|---|
| --msi-role-titlebar-bg | #FBE3E8 | 제목줄 바탕 |
| --msi-role-titlebar-stripe | rgba(255,255,255,0.45) | 제목줄 세로 줄무늬 (repeating-linear-gradient 10px/20px) |
| --msi-role-tabbar-track | #F3C9D5 | 탭 4개를 감싸는 알약 트랙 (밀키핑크) |
| --msi-role-tab-ink-idle | #4A3B32 | 고르지 않은 탭 글자 |
| --msi-role-tab-hover | rgba(255,255,255,0.5) | 탭 마우스 올림 |
| --msi-role-pdf-busy | #FBEFB4 | PDF 처리 중 |
| --msi-role-btn-link | #D4E6F7 | 🔗 바깥 사이트 열기 버튼 속 색 |
| --msi-role-pdf-stitch | rgba(74,59,50,0.35) | PDF 버튼 ::before 박음질 점선 (inset 6px, 2px dashed) |
| --msi-role-pdf-glow | rgba(247,174,192,0.55) | PDF 버튼 분홍 번짐 그림자 |
| --msi-role-ui-tagpool-bg / -dash | #FFFDF8 / #E0CBB0 | 이름표 모음 상자 (3px dashed) |
| --msi-role-ui-drop-dash / -ink | #C9ADA1 / #857062 | 빈 칸 점선·DROP HERE 글자 |
| --msi-role-ui-progress-fill | #F6A8BC | 진행률 막대 (= goals-coin) |
| --msi-role-ui-table-head | #F3EAE0 | 표 머리줄 |
| --msi-role-ui-step-mark / -shape | #F6A8BC / SVG data URI (별 + 흰 반짝) | 단계 소제목 번호 반짝 별 방울(3d). **마크업 변경 1건**: `<p class="sub">1. 글</p>` → `<p class="sub"><span class="sub__n">1</span>글</p>` (마침표 제거). `.sub` 는 flex(gap 10px), `.sub__n` 34×34·`background: var(--…-shape) center/34px no-repeat`·번호 정중앙(쿠키런 16px, padding-top 3px 로 별 시각 중심 보정). 선·그림자 없음. 채움색 바꾸면 data URI 안 fill 도 함께 |
| --msi-role-ui-disabled-bg / -ink | #EFE8DF / #9A8C82 | 꺼진 버튼·보기 |
| --msi-role-ui-win-dot-1/2/3 | #FBEFB4 / #BFE6D6 / #F6B4AE | 창 단추 3개 |
| --msi-space-1…5 | 6 / 10 / 16 / 22 / 30px | 간격 |
| --msi-motion | 160ms | 모든 transition·pop 애니메이션 길이 |

## 글꼴 (역할 4개, 변경 없음)
| 변수 | 값 |
|---|---|
| --msi-font-display | 'GangwonEdu' — 큰 제목 40px, 주제 카드 제목 40px, 제목줄 26px |
| --msi-font-title | 'CookieRun' 700 — 카드 제목 24px, 버튼·이름표·탭 17px, PDF 22px, 단계 이름표 16px |
| --msi-font-body | 'Maplestory' — 본문 17px(300), 소제목 18px(700), 작은 안내 16px |
| --msi-font-label | 'Silkscreen' — 영문 라벨·차시 태그·DROP HERE 16px |
