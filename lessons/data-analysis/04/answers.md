# data4.html — 정답키

> spec `spec/data4-4steps-sequencing.activity.md` 값을 그대로 옮김. 빌더가 계산하지 않음.
> 학생 지면(화면 표시 문구)에는 정답 순서를 노출하지 않는다. 자동 채점을 위해 슬롯의
> `data-answer` / 칩의 `data-answer-key` 속성에만 값이 들어 있다(프로젝트의 기존 dnd 활동과 동일).

## PREVIOUSLY 카드 · 순서 배열 드래그 (`prev-seq-4steps`)

데이터로 문제를 해결하는 4단계 — 유일 정답 순서:

| 슬롯 | data-answer | 단계 텍스트 |
|---|---|---|
| ① `seqSlotPrev1` | `step1` | 문제 정하기 |
| ② `seqSlotPrev2` | `step2` | 데이터 수집·특성 파악 |
| ③ `seqSlotPrev3` | `step3` | 데이터 분석하기 |
| ④ `seqSlotPrev4` | `step4` | 결과 해석·공유 |

- 정답 배열: `["step1", "step2", "step3", "step4"]`
- 초기(뒤섞인) 배열: `["step3", "step1", "step4", "step2"]` (완전 어긋남, 정답 자리에 놓인 칩 0개)
- 채점: 슬롯 4칸의 `data-answer` 와 그 칸에 놓인 칩의 `data-answer-key` 가 모두 일치해야 4/4.
  부분 정답은 일치한 칸 수만 "4칸 중 n칸 정답" 으로 표시하고 칸별 초록/빨강 + `✓`/`✗`.
- 다른 배열은 모두 오답(정답 순서는 유일).
