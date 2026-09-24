# 스킬 모음 — 무엇이 있고 어떻게 부르나

이 저장소에는 **스킬 4개**가 있고 **에이전트는 없습니다.** 모든 일은 메인 대화에서 선생님과 주고받으며 하고,
"새 눈으로 검수"처럼 따로 떼는 게 나은 일만 `lesson-check` 가 필요할 때 기본(범용) 서브에이전트를 잠깐 씁니다.
(같은 서브에이전트 호출을 자꾸 반복하게 되면 그때 `.claude/agents/` 에 에이전트 파일을 하나씩 추가하면 됩니다.)

| 스킬 | 언제 | 이렇게 말하면 돼요 | 하는 일 |
|---|---|---|---|
| **lesson-edit** | 활동지를 고칠 때 (가장 많이 씀) | `/lesson-edit 06 MISSION_1 이유 카드 삭제` · "6차시 이상치 부분 빈칸으로" · "이 파일 06차시로 가져와줘" | lesson.html 최소 수정 → 빌드 → 브라우저 자동 검사 → 고친 곳 캡처 확인 |
| **lesson-new** | 새 차시를 처음 만들 때 | `/lesson-new 08 유튜브 데이터로 관계 분석` · "이 PDF 로 8차시 만들어줘" | 아이디어 2~3개 → 선택 → spec.md → 차시 폴더 → 본문 조립 (단계마다 멈춰서 확인) |
| **lesson-teacher** | 교사용 화면·정답지 PDF | `/lesson-teacher 06` · "6차시 정답지 PDF" | answers.json 채우기 → `npm run teacher` → PDF 확인 |
| **lesson-check** | 배포 전 점검·검수 | `/lesson-check 06` · "05, 06 새 눈으로 검수해줘" | 자동 검사 + (요청 시) 서브에이전트 검수 보고 → 고를 항목만 수정 |

## 스킬 폴더 구조

```
.claude/
├─ README.md                ← 지금 이 문서 (목록·사용법)
├─ settings.json            ← 허용된 명령(npm run …, git status 등)
└─ skills/
   ├─ lesson-edit/   SKILL.md + references/rules.md        (수정 규칙 요약 · 원문 위치)
   ├─ lesson-new/    SKILL.md
   ├─ lesson-teacher/SKILL.md
   └─ lesson-check/  SKILL.md + references/review-prompt.md (서브에이전트에 보낼 검수 지시문)
```

- `SKILL.md` 는 짧게(순서와 꼭 지킬 것만), 긴 규칙은 `references/` 나 `docs/rules/` 에 두고 **필요할 때만 읽게** 했습니다.
  그래서 매번 문서 260KB 를 다 읽지 않아요.
- 스킬을 새로 만들 땐 `skills/<이름>/SKILL.md` 를 만들고 위 표에 한 줄 추가하면 됩니다. (Claude Code 는 `.claude/skills/` 아래만 스킬로 인식해요.)

## 스킬이 쓰는 명령 (직접 쳐도 됨)

| 명령 | 하는 일 |
|---|---|
| `npm run build` | 소스 → 배포본 (`dist/pages` = GitHub Pages, `dist/embed` = 구글 사이트 붙여넣기용, 둘 다 교사용 포함) |
| `npm run check -- 06` | 빌드 + 브라우저 자동 검사 + 캡처 (`--find "글자"` 로 특정 부분 캡처) |
| `npm run teacher -- 06` | answers.json 으로 정답지 PDF |
| `npm run new -- data-analysis/08 --from 07 --title "…"` | 새 차시 폴더 |
| `npm run import -- <파일> data-analysis/06` | 완성된 한 파일짜리 HTML 을 차시 소스로 가져오기 (원본과 바이트 단위 동일 확인) |
| `npm run neis` | `data/timetable.json`·`meal.json` → `data/neis-snapshot.json` (시간표·급식 탭 데이터) |
| `npm run serve` | `dist/pages` 를 내 컴퓨터에서 열어 보기 |
