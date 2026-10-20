// 「활동지 양식.docx」 만들기 — 선생님이 이 양식에 내용을 적어 오면 활동지로 만든다(from-template.md).
// 2판(2026-10-17): 활동지 순서(docs/rules/order.md)와 같은 칸 — 기본 정보(학습 주제·차시·단원·학습 목표) → 도입(동기유발·학습주제 제시)
//   → 활동 1·2·3…(개수 자유) → 정리(핵심 정리·형성평가) → 만들 때 부탁. 꼭 = 학습 주제·활동, 나머지는 선택(비우면 Claude 초안, "없음"이면 뺌).
// 2판 고침(2026-10-20): 선생님이 Word 로 고친 판(10-17)에 맞춤 — 「만들 때 부탁」 칸 없음 · (선택) 표시 없음(「꼭」은 활동·한눈에 표만).
//   + ai/01 규칙 반영: 표기 [영상] · 핵심 정리 [[정답]] = 이름표 칸. 수업용 슬라이드는 양식에 칸을 두지 않고 활동지가 끝난 뒤 묻는다(lesson-new §6).
//   쪽 순서: 1쪽 사용법·한눈에 → ✍️ 여기부터 작성 → 📎 참고(표기법·작성 예시). Claude 는 ✍️ ~ 📎 사이만 읽는다.
// Google 문서 · Claude 웹에서 깨지지 않게: 기본 제목 스타일(제목 1~3), DXA 너비 표, 글상자·도형·양식 컨트롤 없음, 표기는 글자([ ], [[ ]])만.
// 실행(docx 패키지는 scratchpad 에만):
//   cd <scratchpad>/docx && npm init -y && npm i docx
//   cp .claude/skills/lesson-new/references/template-docx.mjs <scratchpad>/docx/
//   node template-docx.mjs "docs/templates/활동지 양식.docx"
import fs from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, LevelFormat, AlignmentType,
} from 'docx';

const out = process.argv[2] || '활동지 양식.docx';
const FONT = 'Malgun Gothic';
const INK = '4B3B6B', MARK = '6B3FA0', GRAY = '7A7489', LINE = 'B9B0D3', MUST = 'B3261E';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - MARGIN * 2;   // A4, 여백 2cm → 본문 9638

// 글 안의 [표기] · [[정답]] 은 굵은 보라 글씨로, **굵게** 는 굵은 글씨로
const runs = (str, base = {}) => String(str).split(/(\[\[[^\]]*\]\]|\[[^[\]]+\]|\*\*[^*]+\*\*)/).filter(Boolean)
  .map((t) => (/^\*\*/.test(t) ? new TextRun({ ...base, text: t.slice(2, -2), bold: true })
    : /^\[/.test(t) ? new TextRun({ ...base, text: t, bold: true, color: MARK }) : new TextRun({ ...base, text: t })));
const P = (str, opts = {}) => new Paragraph({ ...opts, children: runs(str, opts.run) });
const CELL = { after: 20, line: 264 };   // 표 칸 안 글은 촘촘하게
const note = (str) => new Paragraph({ keepNext: true, spacing: { after: 80 }, children: [new TextRun({ text: str, color: GRAY, size: 18 })] });
const label = (str, rest = '') => new Paragraph({ keepNext: true, spacing: { before: 120, after: 60 }, children: [new TextRun({ text: str, bold: true }), ...runs(rest)] });
const H = (level, text, opts = {}) => new Paragraph({ heading: level, ...opts, children: [new TextRun(text)] });
const bullet = (str) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 40, line: 276 }, children: runs(str) });
const goal = () => new Paragraph({ numbering: { reference: 'goal', level: 0 }, spacing: { after: 60 }, children: [] });
const blank = () => new Paragraph({ children: [] });

// 꼭 표시 — 굵은 빨강. 선택 표시는 선생님 판(10-17)에서 뺐다 → 찍지 않음
const tagRun = (kind, extra = '', size) => new TextRun({ text: ` (${kind}${extra})`, bold: kind === '꼭', color: kind === '꼭' ? MUST : GRAY, ...(size ? { size } : {}) });
const Hk = (level, text, kind, extra = '') => new Paragraph({ heading: level, children: [new TextRun(text), ...(kind === '꼭' ? [tagRun(kind, extra, 20)] : [])] });
const lab = (text) => new Paragraph({ spacing: CELL, children: [new TextRun({ text, bold: true })] });   // 기본 정보 칸 이름 — 표시 없음(선생님 판)
const kindP = (kind) => new Paragraph({ spacing: CELL, children: kind.startsWith('꼭') ? [new TextRun({ text: kind, bold: true, color: MUST })] : [] });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
// 표: 너비는 표(columnWidths)와 칸(width) 둘 다 DXA — 퍼센트는 Google 문서에서 깨짐
// 칸 = 글자 | [줄, 줄…] — 줄은 글자 · { note } · Paragraph
const table = (widths, rows, { head = true, labelCol = false } = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
  rows: rows.map((cells, r) => new TableRow({
    cantSplit: true,
    tableHeader: head && r === 0,
    children: cells.map((c, i) => {
      const lines = Array.isArray(c) ? c : [c];
      const isHead = head && r === 0;
      const shade = isHead ? 'E6DDF6' : labelCol && i === 0 ? 'F6F2FC' : null;
      return new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        margins: { top: 70, bottom: 70, left: 120, right: 120 },
        ...(shade ? { shading: { type: ShadingType.CLEAR, fill: shade, color: 'auto' } } : {}),
        children: lines.map((l) => (l instanceof Paragraph ? l
          : l && typeof l === 'object' && l.note ? new Paragraph({ spacing: CELL, children: [new TextRun({ text: l.note, color: GRAY, size: 17 })] })
          : new Paragraph({ spacing: CELL, children: runs(l ?? '', isHead || (labelCol && i === 0) ? { bold: true } : {}) }))),
      });
    }),
  })),
});

// ── 1쪽: 이렇게 써요 · 한눈에 ──
const howTo = [
  H(HeadingLevel.HEADING_1, '이렇게 써요'),
  bullet('다음 쪽 「✍️ 여기부터 작성」만 채워요. 회색 ※ 글과 「📎 참고」는 그대로 둬요.'),
  bullet('**꼭** 적을 것은 **학습 주제**와 **활동(1개 이상)** 뿐이에요. 나머지는 모두 선택이에요.'),
  bullet('선택 칸을 비워 두면 Claude 가 초안을 써서 확인받아요. 활동지에서 빼려면 **없음**, 만들 때 물어봐 주길 원하면 **물어봐 줘** 라고 적어요.'),
  bullet('활동 수는 자유예요. 「활동 3」 덩어리를 복사해 붙이고 번호만 바꿔요. 남는 활동은 지워요.'),
  bullet('빈칸·퀴즈는 대괄호 이름표로 적어요. 예) 데이터의 [[패턴]]을 찾아본다 · [O/X] · [쓰기 칸 3줄] — 목록은 「📎 참고 1」. 말로 적어도 돼요.'),
  bullet('내용만 적어요(색·배치는 틀대로). 그림은 [그림], 동영상은 [영상] 으로 설명하고 파일은 따로 줘요.'),
  bullet('Google 문서로 써도 돼요(파일 → 다운로드 → Microsoft Word). 학생 이름·학번은 적지 않아요.'),
];

const WM = [2900, 4300, CONTENT_W - 2900 - 4300];
const map = [
  H(HeadingLevel.HEADING_1, '한눈에 — 양식 칸이 활동지 어디로 가나요'),
  table(WM, [
    ['양식 칸', '활동지에서', '꼭 / 선택'],
    ['학습 주제 · 차시 · 단원', '맨 위 주제 카드 — 「단원 · N차시」와 큰 제목', [kindP('꼭 (학습 주제)'), kindP('선택 (차시 · 단원)')]],
    ['학습 목표', '오늘의 목표 카드(번호 붙은 목표)', [kindP('선택')]],
    ['도입 — 동기유발 · 학습주제 제시', '도입 카드 2장 — 수업을 여는 질문 · 오늘 배울 것 소개', [kindP('선택')]],
    ['활동 1, 2, 3 …', '전개 카드 — 활동마다 한 장', [kindP('꼭 (1개 이상)')]],
    ['정리 — 핵심 정리 · 형성평가', '정리 카드 2장 — 오늘 꼭 기억할 것 · 눌러서 채점하는 문제', [kindP('선택')]],
    ['만들 때 부탁', '틀 · 공개 · 파일 · 정답지 · 채점 방식', ''],
  ]),
];

// ── ✍️ 여기부터 작성 ──
const WI = [3400, CONTENT_W - 3400];
const activity = (n) => [
  H(HeadingLevel.HEADING_3, `활동 ${n}`),
  label('제목: '),
  label('내용: '),
  blank(), blank(), blank(),
];
const form = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('✍️ 여기부터 작성')] }),   // 새 쪽에서 시작(이 부분만 인쇄하기 쉽게)

  H(HeadingLevel.HEADING_2, '기본 정보'),
  table(WI, [
    ['항목', '적기'],
    [[lab('학습 주제', '꼭'), { note: '활동지 맨 위 큰 제목 · 예) 로블록스 데이터 분석하기' }], ''],
    [[lab('차시', '선택'), { note: '예) 08 — 비우면 다음 빈 번호로 정해 알려 드려요' }], ''],
    [[lab('단원', '선택'), { note: '데이터 분석 · 인공지능 · 정보 윤리 — 비우면 주제를 보고 골라 확인받아요' }], ''],
    [[lab('학습 목표', '선택'), { note: '한 줄에 하나, 보통 2~3개 · "~할 수 있어요"' }], [goal(), goal(), goal()]],
  ], { labelCol: true }),

  Hk(HeadingLevel.HEADING_2, '도입', '선택'),
  Hk(HeadingLevel.HEADING_3, '동기유발', '선택'),
  note('※ 수업을 여는 질문·영상·사진·사례. 제목은 카드 맨 위 큰 글이에요(보통 학생에게 던지는 질문).'),
  label('제목: '), label('내용: '), blank(), blank(),
  Hk(HeadingLevel.HEADING_3, '학습주제 제시', '선택'),
  note('※ 오늘 무엇을 배우고 어떤 활동을 하는지 한두 문장으로 알려 줘요.'),
  label('제목: '), label('내용: '), blank(), blank(),

  Hk(HeadingLevel.HEADING_2, '활동', '꼭', ' — 1개 이상'),
  note('※ 제목 = 카드 맨 위 큰 질문. 내용 = 학생이 할 일 — 1. 2. 3. 단계로 나누고, 단계마다 표기법 이름표를 써요. 표가 필요하면 워드 표를 넣어요.'),
  note('※ 활동이 더 필요하면 「활동 3」 덩어리(활동 3 ~ 내용)를 복사해 아래에 붙이고 번호만 바꿔요. 남는 활동은 지워요.'),
  ...activity(1), ...activity(2), ...activity(3),

  Hk(HeadingLevel.HEADING_2, '정리', '선택'),
  Hk(HeadingLevel.HEADING_3, '핵심 정리', '선택'),
  note('※ 오늘 꼭 기억할 것 — 문장이나 표로. [[정답]] 은 학생이 이름표를 끌어다 놓는 칸이 돼요(이름표 = 정답 낱말들). 표의 낱말 칸에도 써요.'),
  label('제목: '), label('내용: '), blank(), blank(),
  Hk(HeadingLevel.HEADING_3, '형성평가', '선택'),
  note('※ [O/X] · [하나 고르기] · [모두 고르기] 로 적어요. 예) [O/X] 다음 줄부터 「문장 → O」를 한 줄씩.'),
  label('문제: '), blank(), blank(), blank(),

  // 「만들 때 부탁」 칸은 선생님 판(10-17)에서 뺐다 — 기본값은 from-template.md §4
];

// ── 📎 참고 1. 활동 표기법 ──
const W3 = [2150, 3500, CONTENT_W - 2150 - 3500];
const notation = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('📎 참고 — 읽기만 하는 곳(활동지에 안 들어가요)')] }),
  H(HeadingLevel.HEADING_2, '참고 1. 활동 표기법'),
  P('표기는 대괄호 [ ] 로 써요. 정답은 두 겹 대괄호 [[ ]] 안에 적어요. 화살표 → 는 -> 로 써도 돼요.'),
  table(W3, [
    ['표기', '쓰는 법', '예시'],
    ['1. 2. 3. (단계)', '활동 안에서 학생이 할 일을 단계로 나눠요. 단계 글은 굵은 소제목이 되고, 단계 앞이나 아래에 이름표를 적어요.', ['1. [하나 고르기] 이 질문은 어떤 분석에 해당할까?', '2. CODAP 으로 그래프를 그려 붙여넣으세요.', '[붙여넣기 칸] 내가 그린 그래프']],
    ['[[정답]]', '문장 속 빈칸. 두 겹 대괄호 안에 정답을 적어요.', '데이터의 [[패턴]]과 [[규칙]]을 찾아본다.'],
    ['[[ ]]', '정답이 없는 짧은 칸(학생이 자기 생각·조사한 것을 적음)', '내가 관심 있는 직업: [[ ]]'],
    ['[쓰기 칸 N줄]', '서술형 큰 칸. 예시 답이 있으면 뒤에 "예시:"', ['[쓰기 칸 2줄] 두 사례에서 무엇이 공통으로 달라졌을까?', '예시: 예전에는 경험으로, 지금은 데이터로 결정한다.']],
    ['[안내] [Tip] [주의]', '안내 상자. 대괄호 뒤에 상자 제목(있으면)과 문장', '[Tip] 사례를 찾기 어렵다면? \'~ 빅데이터\'로 기사를 검색해 보세요.'],
    ['[제미나이]', '제미나이에게 물어보기 상자. 질문 예시와 정리할 칸', ['[제미나이] 질문: "exe 파일이 무엇인지 쉽게 설명해줘."', '정리: [쓰기 칸 2줄]']],
    ['[표]', '워드 표를 그대로 넣어요. 첫 줄은 제목 줄. 칸 안에도 [[정답]] · [[ ]] 를 써요.', '「참고 2」의 핵심 정리 표를 보세요.'],
    ['[하나 고르기]', '문제 다음 줄부터 보기를 한 줄에 하나. 정답 보기 끝에 (정답). 틀렸을 때 보여 줄 이유는 "이유:"(없으면 Claude 가 써요)', ['[하나 고르기] 확장자를 .gif 로 바꾸면 게임이 실행될까?', '실행된다 (이유: 게임을 켜는 파일은 .exe 하나예요)', '실행되지 않는다 (정답)']],
    ['[모두 고르기]', '정답이 여러 개인 문제. 정답 보기마다 (정답)', ['[모두 고르기] 디지털 데이터를 모두 고르세요.', '사진 파일 (정답)', '종이 편지', '음악 파일 (정답)']],
    ['[O/X]', '한 줄에 한 문장, 끝에 → O 또는 → X. 이유는 괄호로(선택)', ['[O/X]', '1. 표에서 가로줄은 \'행\'이다. → O', '2. 확장자만 바꾸면 파일 종류도 바뀐다. → X (이유: 안의 내용은 그대로예요)']],
    ['[이름표 끌어 놓기]', '이름표 목록 한 줄 + "칸 → 정답"을 한 줄씩', ['[이름표 끌어 놓기] 이름표: 아날로그, 디지털', '체온계(수은) → 아날로그', '디지털카메라 → 디지털']],
    ['[순서 배열]', '올바른 순서대로 적어요. 활동지에서는 섞어서 보여 줘요.', '[순서 배열] 1) 문제 정하기 2) 데이터 수집 3) 데이터 분석 4) 결과 공유'],
    ['[그림]', '필요한 그림을 말로 설명(또는 따로 줄 파일 이름)', '[그림] 체온계 그림, 화면에 36.5 표시'],
    ['[영상]', '보여 줄 동영상 파일(mp4, 따로 줌)과 틀 자리. 그림을 누르면 재생돼요. 유튜브 영상은 [링크] 로', '[영상] 일반몬스터와_AI몬스터.mp4 — 비교 그림을 누르면 재생'],
    ['[붙여넣기 칸]', '학생이 캡처한 그래프·화면을 붙여 넣는 칸', '[붙여넣기 칸] 내가 만든 막대그래프 캡처'],
    ['[링크]', '열어 볼 사이트·영상 주소', '[링크] 제미나이 열기 https://gemini.google.com'],
    ['[메모]', 'Claude 에게만 하는 말(활동지에는 안 나와요)', '[메모] 이 표는 폰에서 보기 좋게 세로로 바꿔 줘.'],
  ]),
];

// ── 📎 참고 2. 작성 예시 (07차시 활동지에서 가져옴) ──
const WS = [1700, 3300, CONTENT_W - 1700 - 3300];
const example = [
  H(HeadingLevel.HEADING_2, '참고 2. 작성 예시 (07차시 「로블록스 데이터 분석하기」 일부)'),
  note('※ 모양만 보는 곳이에요. 실제 07 활동지 내용을 이 양식에 옮겨 적은 모습이에요.'),
  H(HeadingLevel.HEADING_3, '기본 정보'),
  table(WI, [
    ['항목', '적기'],
    ['학습 주제', '로블록스 데이터 분석하기'],
    ['차시', '07'],
    ['단원', '데이터 분석'],
    ['학습 목표', ['1. 질문을 읽고 알맞은 분석 유형(구성·비교·분포·관계)을 고를 수 있어요.', '2. 로블록스 데이터를 CODAP으로 시각화하고 그래프를 해석할 수 있어요.']],
  ], { labelCol: true }),
  H(HeadingLevel.HEADING_3, '도입 — 동기유발'),
  label('제목: ', '로블록스에서 요즘 가장 인기 있는 게임은 어떤 장르일까?'),
  label('내용: ', '내가 해 본 로블록스 게임과 그 장르를 떠올려 적어 보세요. 친구들도 비슷할까요?'),
  P('[쓰기 칸 2줄] 예시: 펫 타기(시뮬레이션), 라이벌(슈팅)'),
  H(HeadingLevel.HEADING_3, '도입 — 학습주제 제시'),
  label('제목: ', '오늘은 데이터로 질문 4가지를 풀어요'),
  label('내용: ', '로블록스 인기 게임 96개의 데이터로 질문 4가지를 풀어요. 어떤 분석인지 고르고, CODAP으로 그래프를 그려 해석해 봐요.'),
  H(HeadingLevel.HEADING_3, '활동 1'),
  label('제목: ', '로블록스 인기 게임들은 장르별로 각각 몇 %를 차지하고 있을까?'),
  label('내용:'),
  P('1. [하나 고르기] 이 질문은 어떤 분석에 해당할까?'),
  P('구성 분석 (정답)'), P('비교 분석'), P('분포 분석'), P('관계 분석'),
  P('2. CODAP 으로 그래프를 그려 데이터를 시각화하고, 그래프를 붙여넣으세요.'),
  P('[붙여넣기 칸] 내가 그린 그래프 캡처'),
  P('[그림] CODAP 에서 그래프 그리는 순서 — 화면 캡처 roblox1.png 따로 줌'),
  P('3. 그래프를 해석한 결과를 적어주세요.'),
  P('[쓰기 칸 3줄] 예시: ○○ 장르가 약 ○○%로 가장 많아요.'),
  note('※ 활동 2~4 도 같은 모양이에요(질문만 달라요).'),
  H(HeadingLevel.HEADING_3, '정리 — 핵심 정리'),
  label('제목: ', '오늘 배운 것 — 질문에 맞는 분석과 CODAP 그래프'),
  label('내용: ', '[표]'),
  table(WS, [
    ['분석', '이런 질문', 'CODAP 에서'],
    ['구성 분석', '각각 몇 %를 차지할까?', '아래쪽 축 → Measure → 백분율'],
    ['비교 분석', '어느 쪽이 평균적으로 더 클까?', '두 축 → Measure → 측정 레이블 · Mean'],
    ['분포 분석', '주로 어느 구간에 몰려 있을까?', '아래쪽 축 → Measure → Box Plot'],
    ['관계 분석', '~할수록 ~도 커질까?', '두 축 → Measure → 최소제곱선 · Show r'],
  ]),
  H(HeadingLevel.HEADING_3, '정리 — 형성평가'),
  label('문제: ', '[O/X]'),
  P('1. 장르별로 몇 %인지 알고 싶을 때는 구성 분석을 한다. → O'),
  P('2. 두 속성의 관계를 볼 때 r 이 0 에 가까우면 관계가 뚜렷하다. → X (이유: r 이 0 에 가까우면 관계가 거의 없어요)'),
  P('3. Box Plot 은 데이터가 어느 구간에 몰려 있는지 볼 때 쓴다. → O'),
  note('※ 형성평가를 빼고 싶었다면 「문제:」 옆에 없음 이라고만 적으면 돼요.'),
];

const headStyle = (id, name, size, before, after, outlineLevel, extra = {}) => ({
  id, name, basedOn: 'Normal', next: 'Normal', quickFormat: true,
  run: { font: FONT, size, bold: true, color: INK },
  paragraph: { spacing: { before, after }, outlineLevel, keepNext: true, ...extra },
});
const doc = new Document({
  creator: '신현중학교 정보',
  title: '정보 수업 활동지 양식',
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: '26224A' }, paragraph: { spacing: { after: 100, line: 320 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 40, bold: true, color: INK }, paragraph: { spacing: { after: 120 } } },
      headStyle('Heading1', 'Heading 1', 30, 360, 160, 0, { border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: LINE, space: 4 } } }),
      headStyle('Heading2', 'Heading 2', 25, 320, 120, 1),
      headStyle('Heading3', 'Heading 3', 22, 240, 80, 2),
    ],
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 260 } } } }] },
      { reference: 'goal', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 380, hanging: 320 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    children: [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('정보 수업 활동지 양식')] }),
      P('내용을 적어 주면 Claude 가 수업 활동지로 만들어요. 칸은 활동지 순서 그대로예요.'),
      note('양식 2판 · 2026-10-17 (10-20 고침) · 신현중학교 정보'),
      ...howTo, ...map, ...form, ...notation, ...example,
    ],
  }],
});

fs.writeFileSync(out, await Packer.toBuffer(doc));
console.log('✔', out);
