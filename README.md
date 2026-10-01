# 신현중학교 정보 수업 활동지

차시별 인터랙티브 활동지(HTML)를 만들고 배포하는 저장소입니다.
**소스는 작게(`lessons/`), 배포본은 자동으로(`npm run build` → GitHub Pages)** 가 기본 원칙이에요.

- 학생용 사이트: <https://sage810.github.io/info-lesson/> (main 에 push 하면 자동 배포)
- 구글 사이트에서는 **삽입 → URL** 로 위 주소의 차시 페이지를 한 번만 연결해 두면, 이후 수정은 push 만 하면 반영돼요.
  (예전처럼 3~4MB 코드를 붙여넣고 싶을 땐 `dist/embed/` 의 파일을 쓰면 됩니다.)

## 폴더 지도

| 폴더 | 무엇 | 손으로 고치나? |
|---|---|---|
| `lessons/<단원>/<차시>/` | **차시 하나의 모든 것**: `lesson.html`(소스) · `assets/`(그 차시 그림) · `answers.json`(정답) · `spec.md`(기획) · `lesson.json`(제목·상태) | ✅ 여기만 고쳐요 |
| `lessons/units.json` | 첫 화면 "수업 활동지"의 **단원 순서·이름·예정 차시 수** (예정인데 아직 없는 차시는 "준비 중" 칸으로 보여요). 새 단원 폴더 이름: 데이터 분석 `data-analysis` · 인공지능 `ai` · 정보 윤리 `ethics` | 단원·차시 수가 바뀔 때 |
| `materials/` | 첫 화면 "수업 자료"에 올릴 파일(PDF·슬라이드 등). 넣기만 하면 카드가 생기고, 제목·설명·순서는 `materials.json` 에 `[{ "file": "파일.pdf", "title": "…", "desc": "…" }]` (안 적으면 파일 이름이 제목). PDF·그림은 새 탭에서 열리고 나머지는 내려받기. 한 파일 100MB 까지 | ✅ 자료를 올릴 때 |
| `shared/` | 여러 차시가 같이 쓰는 것: `fonts/` · `vendor/`(React·jsPDF 등 라이브러리) · `partials/`(순서배열·붙여넣기 칸 등 동작 스크립트) · `images/` · `runtime/msi-hook.js`(제출·NEIS 연결) | 가끔 (바꾸면 모든 차시에 반영) |
| `docs/rules/` | 규칙: 디자인(`design.md`) · 활동 유형(`components.md`) · PDF 버튼(`pdf.md`) · 임베드(`embed.md`) · 4탭 탭 명세(`portal/`) · 4탭으로 옮기기(`shell-porting.md`) | 규칙이 바뀔 때 |
| `docs/log/` | 작업 이력(구현 노트·활동 설계 기록) | 새 활동 유형을 만들면 한 절 추가 |
| `docs/legacy-files.md` | 옛 `output/` 파일이 어디로 갔는지, 꺼내는 법 | — |
| `scripts/` | Node 스크립트(빌드·검사·정답지·가져오기) + NEIS 데이터 받기(PowerShell) | 거의 안 고쳐요 |
| `data/` | NEIS 시간표·급식 원자료와 `neis-snapshot.json` | `npm run neis` 가 갱신 |
| `apps-script/` | Google Apps Script 작은 API (제출 PDF 모으기 · NEIS 프록시) + 배포 방법 | 배포할 때 한 번 |
| `input/` | 원자료: 캡처 이미지·CSV·Claude Design 원본 | 자료를 넣을 때 |
| `.claude/` | Claude Code 스킬 — 우리 스킬 5개(`.claude/README.md`) + 가져온 외부 스킬 10개(`.claude/external-skills.md`) · 저장소 요령 모음 `napkin.md` | — |
| `dist/` | 빌드 결과 (git 에 안 올라감) | ❌ |

## 차시 목록

| 차시 | 제목 | 틀(shell) | 정답 |
|---|---|---|---|
| `data-analysis/01` | 디지털 데이터 | portal (4탭) | `answers.json` (끌어 놓기·미니 퀴즈, 정답지 PDF 가능) |
| `data-analysis/02` | 파일과 확장자 | portal (4탭) | `answers.json` (끌어 놓기·미니 퀴즈·O/X, 정답지 PDF 가능) |
| `data-analysis/03` | 데이터 과학 | portal (4탭) | `answers.json` (빈칸·사례 고르기·O/X, 정답지 PDF 가능) |
| `data-analysis/04` | 데이터로 문제 해결하기 — 4단계와 표 읽기 | portal (4탭) | `answers.json` (빈칸·순서 배열·끌어 놓기·O/X, 정답지 PDF 가능) · `answers.md`(순서 배열 설명) |
| `data-analysis/05` | 데이터 시각화 ① 구성·비교 분석 | portal (4탭) | `answers.json` (빈칸·유형 고르기, 정답지 PDF 가능) |
| `data-analysis/06` | 데이터 시각화 ② 분포·관계 분석 | portal (4탭) | `answers.json` (정답지 PDF 가능) |
| `data-analysis/07` | 신입 유튜버의 국내 TOP 100 채널 분석 | standalone | `answers.json` (정답 대신 **채점 기준** PDF) · `answers.md`(채점 기준 원문) |

## 처음 한 번 (Windows)

1. Node.js LTS 설치: PowerShell 에서 `winget install OpenJS.NodeJS.LTS` (또는 nodejs.org) → VSCode 재시작
2. 저장소 폴더에서 `npm install` — 브라우저 검사용 `playwright-core` 만 받아요. 브라우저는 **이미 깔린 Edge** 를 씁니다(따로 안 받음).
3. GitHub 저장소 **Settings → Pages → Source: GitHub Actions** 로 바꾸기 (자동 배포 켜기)

## 자주 하는 일

Claude Code 에게 말로 부탁하면 스킬이 알아서 합니다. 직접 할 때의 명령은 이렇습니다.

| 하고 싶은 것 | Claude 에게 | 직접 |
|---|---|---|
| 활동지 고치기 | "06 이상치 카드 빈칸으로 만들어줘" | `lessons/…/lesson.html` 수정 → `npm run check -- 06` |
| 새 차시 | "/lesson-new 08 …" | `npm run new -- data-analysis/08 --from 07 --title "…"` (새 단원: `ai/01` · `ethics/01`) |
| 양식으로 새 차시 | `docs/templates/활동지 양식.docx` 를 채워서 "이 양식으로 08차시 만들어줘" | (Word · Google 문서 둘 다 됨) |
| 수업 자료 올리기 | "이 PDF 수업 자료에 올려줘" | 파일을 `materials/` 에 넣기 → (제목·설명은 `materials.json`) → `npm run build` |
| 교사용 · 정답지 | "06 정답지 PDF" | `npm run teacher -- 06` (교사용 화면은 build 때 자동) |
| 점검 | "05, 06 검수해줘" | `npm run check` |
| 수정 요청 메모 (선생님 전용) | **"03차시 메모 켜줘"** → 빌드·미리보기 서버·`?memo=1` 열기까지 한 번에. 고칠 글을 선택해 요청을 적고 "전체 복사" → Claude 에 붙여넣기 | `npm run memo -- 03` (끄려면 주소 끝 `?memo=0`. 학생 화면에는 안 보임, 메모는 그 브라우저에만 저장) |
| 완성된 HTML 파일 들여오기 | "이 파일 06차시로 가져와줘" | `npm run import -- <파일> data-analysis/06` |
| 4탭 화면을 지금 규칙대로 맞추기 (가져온 뒤·옛 차시) | "06 4탭 화면 최신으로" | `npm run portal-upgrade -- 06` (이미 적용된 건 건너뜀, `--dry` 로 미리 보기) |
| 시간표·급식 데이터 갱신 | "NEIS 데이터 새로 받아서 반영" | `pwsh scripts/fetch-neis.ps1` → `npm run neis` → `npm run build` |
| 내 컴퓨터에서 미리 보기 | — | `npm run build` → `npm run serve` |
| 배포 | "완료, 올려줘" | 커밋 → `git push` (Pages 자동 배포) |

## 제출을 선생님 드라이브로 모으기 (선택)

`apps-script/README.md` 대로 Apps Script 를 한 번 배포하고 `site.config.json` 에 주소를 넣으면,
학생이 "PDF로 저장하기"를 누를 때 PDF 가 선생님 드라이브 폴더에도 저장되고 시트에 학년·반·번호·이름·빈칸 답이 쌓여요.
주소를 넣기 전까지는 활동지가 예전과 똑같이 동작합니다.

## 빌드가 하는 일 (궁금할 때만)

`lesson.html` 안의 표식을 실제 내용으로 바꿉니다.

| 소스의 표식 | `dist/embed` (구글 사이트 붙여넣기용) | `dist/pages` (GitHub Pages) |
|---|---|---|
| `<script data-msi-src="shared/vendor/react….js"></script>` | 스크립트 본문을 그대로 넣음 | `<script src="../../shared/vendor/…">` |
| `msi-asset:shared/fonts/….woff2` · `msi-asset:./assets/….png` | `data:…;base64,…` | 상대 경로 |
| `/*NEIS_SNAPSHOT_START*/@msi:neis-snapshot/*…END*/` | `data/neis-snapshot.json` 내용 | 같음 |

`site.config.json` 이 비어 있으면 학생용 `dist/embed` 파일은 개편 전 `output/` 파일과 **바이트 단위로 같습니다.**
