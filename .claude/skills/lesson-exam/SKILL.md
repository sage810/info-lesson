---
name: lesson-exam
description: >
  정보 수업 수행평가(시험지)를 만드는 루틴 — 답이 화면에 없는 시험지, 정답은 answers.json(이 PC 에만), 학생이 PDF 로 저장하면
  자동 제출(A) + PDF 속 숨은 답(B) → 구글 시트에서 자동 채점·반별 그래프 채점. "수행평가 만들어줘", "시험지", "평가 문항으로 화면",
  "수행평가 B형", "/lesson-exam" 에 사용. 일반 활동지는 lesson-new, 이미 있는 시험지 고치기는 lesson-edit(이 스킬의 "꼭 지킬 것"도 지킴).
---

# lesson-exam — 수행평가 시험지 (A+B 자동 제출·채점)

**먼저 `docs/rules/exam.md` 를 읽는다**(규칙·구조 약속·기록 모양·채점·체크리스트가 다 거기 있다). 본보기는 `lessons/data-analysis/09`
(그 폴더 `spec.md` 의 "선생님 결정"·"채점 설계" 표). 이 파일은 **순서와 꼭 지킬 것**만 적는다.

## 순서 — 단계마다 선생님께 보이고 확인받는다

1. **문항·결정 받기.** 문항(양식.docx·PDF·글)을 받고, 정해야 할 것을 **선택지와 추천을 붙여 묻는다**(CLAUDE.md "결정은 묻는다"):
   배점(문항당/소문항당), 부분 점수, 글자 답의 허용 범위, 필수 칸(09 는 이름만), 그래프 칸 여부, 답 보관 시간(09 는 45분).
2. **비공개부터.** 차시 폴더를 만들기 **전에** `.gitignore` 에 차시 폴더 줄과 `answers.json` 줄을 넣고 `git check-ignore` 로 확인한다.
3. **틀 만들기.** 09 `lesson.html` 을 복사해 문항을 바꾼다. 구조 약속(`data-unit`·kind 별 마크업, exam.md §3)을 그대로 지킨다.
   - **두 번째 시험지라면 먼저**: 09 안의 `MSI_SUBMIT`·기록·PDF 숨기기·제출 상태 코드를 `shared/partials/exam.js` 로 빼서
     두 시험지가 같이 쓰게 할지 선생님께 묻는다(exam.md §3 끝). 빼지 않으면 `record()` 의 차시 이름과 보관 키(`KEY`)를 꼭 바꾼다.
   - `lesson.json`: `"shell": "standalone"`, `"status": "draft"`, **`"submit": true`**.
   - `spec.md`: 결정 표와 채점 설계 — **정답은 적지 않는다**("answers.json 에만").
4. **answers.json.** `fill`·`click`(선택자 문자열만, 순서 문항은 누를 차례대로)·`_채점_허용답`·`_채점_배점`(exam.md §5).
   정답은 선생님이 준 답에서 그대로 — 추측하지 않는다. 데이터로 확인할 수 있는 보기는 데이터로 확인해 사실과 다르면 알린다(09 에서 2위가 달랐음).
5. **검사.** `npm run check -- <차시>` → 캡처 확인 → **정답 노출 검사**(exam.md §1, 0개) →
   `npm run exam-key -- <차시>` 로 정답 표·**배점 합계가 선생님 말과 같은지** → `npm run teacher -- <차시>` 정답지 PDF.
6. **학생처럼 끝까지.** Playwright 로 풀고 저장하되 Apps Script 는 `page.route` 로 **가로챈다**(실제로 보내지 않음):
   보낸 기록 = PDF 숨은 기록(저장 시각까지) · 실패 3번 → "다시 보내기" → 성공 · `npm run exam-pdf -- <받은 PDF 폴더>` 로 숨은 답 읽힘.
   Code.gs 를 고쳤다면 순수 함수(`scoreUnit_`·`pickLatest_`·`buildGrade_`)를 Node `vm` 으로 가짜 데이터 시험.
7. **선생님께 넘기기.** 미리보기 주소와 함께 exam.md §8 체크리스트(필요하면 Code.gs 새 버전 배포 · TEACHER_KEY ·
   teacher.local.json · `exam-key --send` · 리허설)와 §9 시험 날 공개 순서를 짧게 알린다. 커밋은 "올려줘" 할 때만(차시 폴더는 gitignore).

## 꼭 지킬 것

- 정답·채점 표시를 `lesson.html`·`spec.md`·`Code.gs`·주석·커밋 메시지·답장에 넣지 않는다. 답장에 정답 표를 보일 땐 이 PC 화면 출력으로만.
- 시험 자료를 실제 Apps Script 로 보내며 시험하지 않는다(선생님 드라이브에 쌓임). 보내기는 선생님이 `--send` 로.
- 결정이 필요한 것은 묻는다. 문항 문구·보기 문장은 선생님 글 그대로(띄어쓰기·사실 오류는 알리고 고칠지 묻는다).
- 고칠 때마다 `npm run check` + 정답 노출 검사. 정답이 바뀌면 `answers.json` → `exam-key`(합계) → `teacher` 까지.
- 새로 배운 요령은 `docs/rules/exam.md` 에 적고(이 파일은 순서만), 반복 실수는 `.claude/napkin.md`.
