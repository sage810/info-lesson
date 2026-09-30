// 「활동지 양식.docx」 만들기 — 선생님이 이 양식에 내용을 적어 오면 활동지로 만든다(from-template.md).
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
const INK = '4B3B6B', MARK = '6B3FA0', GRAY = '7A7489', LINE = 'B9B0D3';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - MARGIN * 2;   // A4, 여백 2cm → 본문 9638

// 글 안의 [표기] · [[정답]] 은 굵은 보라 글씨로
const runs = (str, base = {}) => String(str).split(/(\[\[[^\]]*\]\]|\[[^[\]]+\])/).filter(Boolean)
  .map((t) => (/^\[/.test(t) ? new TextRun({ ...base, text: t, bold: true, color: MARK }) : new TextRun({ ...base, text: t })));
const P = (str, opts = {}) => new Paragraph({ ...opts, children: runs(str, opts.run) });
const note = (str) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: str, color: GRAY, size: 18 })] });
const label = (str, rest = '') => new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: str, bold: true }), ...runs(rest)] });
const H = (level, text) => new Paragraph({ heading: level, children: [new TextRun(text)] });
const bullet = (str) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 }, children: runs(str) });
const goal = () => new Paragraph({ numbering: { reference: 'goal', level: 0 }, spacing: { after: 100 }, children: [] });
const blank = () => new Paragraph({ children: [] });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
// 표: 너비는 표(columnWidths)와 칸(width) 둘 다 DXA — 퍼센트는 Google 문서에서 깨짐
const table = (widths, rows, { head = true, labelCol = false } = {}) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  borders: { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border },
  rows: rows.map((cells, r) => new TableRow({
    tableHeader: head && r === 0,
    children: cells.map((c, i) => {
      const lines = Array.isArray(c) ? c : [c];
      const isHead = head && r === 0;
      const shade = isHead ? 'E6DDF6' : labelCol && i === 0 ? 'F6F2FC' : null;
      return new TableCell({
        width: { size: widths[i], type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        ...(shade ? { shading: { type: ShadingType.CLEAR, fill: shade, color: 'auto' } } : {}),
        children: lines.map((l) => (l && typeof l === 'object' && l.note
          ? new Paragraph({ children: [new TextRun({ text: l.note, color: GRAY, size: 17 })] })
          : new Paragraph({ spacing: { after: 40 }, children: runs(l ?? '', isHead || (labelCol && i === 0) ? { bold: true } : {}) }))),
      });
    }),
  })),
});

// ── 1. 이렇게 써요 ──
const howTo = [
  H(HeadingLevel.HEADING_1, '1. 이렇게 써요'),
  bullet('「✍️ 여기부터 작성」 아래만 채우면 돼요. 위의 1~3은 설명이라 지우지 않아도 돼요 — Claude 는 「✍️ 여기부터 작성」 아래만 읽어요.'),
  bullet('내용만 적어요. 색·배치·아이콘 같은 디자인은 활동지 디자인 규칙으로 새로 만들어요.'),
  bullet('활동은 「2. 활동 표기법」의 이름표(예: [O/X], [하나 고르기])로 시작해서 적어요. 헷갈리면 그냥 말로 적어도 돼요.'),
  bullet('문장 속 빈칸은 두 겹 대괄호 안에 정답을 적어요. 예) 데이터의 [[패턴]]을 찾아본다.'),
  bullet('미션이 더 필요하면 미션 한 덩어리(미션 제목 ~ 활동)를 복사해 붙이고, 필요 없는 미션은 지워요.'),
  bullet('정하지 못한 것은 비워 두거나 (물어봐 줘) 라고 적어요. 만들 때 골라 달라고 물어볼게요.'),
  bullet('학생 이름·학번 같은 개인정보는 적지 않아요.'),
  bullet('Google 문서에서 써도 돼요. 다 쓰면 파일 → 다운로드 → Microsoft Word(.docx) 로 받아서 주거나, Claude 웹에 그대로 올려요.'),
  bullet('그림·사진은 [그림] 으로 설명만 적고, 파일은 따로 주면 더 선명해요.'),
];

// ── 2. 활동 표기법 ──
const W3 = [2150, 3500, CONTENT_W - 2150 - 3500];
const notation = [
  H(HeadingLevel.HEADING_1, '2. 활동 표기법'),
  P('표기는 대괄호 [ ] 로 써요. 정답은 두 겹 대괄호 [[ ]] 안에 적어요. 화살표 → 는 -> 로 써도 돼요.'),
  table(W3, [
    ['표기', '쓰는 법', '예시'],
    ['[[정답]]', '문장 속 빈칸. 두 겹 대괄호 안에 정답을 적어요.', '데이터의 [[패턴]]과 [[규칙]]을 찾아본다.'],
    ['[[ ]]', '정답이 없는 짧은 칸(학생이 자기 생각·조사한 것을 적음)', '내가 관심 있는 직업: [[ ]]'],
    ['[쓰기 칸 N줄]', '서술형 큰 칸. 예시 답이 있으면 뒤에 "예시:"', ['[쓰기 칸 2줄] 두 사례에서 무엇이 공통으로 달라졌을까?', '예시: 예전에는 경험으로, 지금은 데이터로 결정한다.']],
    ['[안내] [Tip] [주의]', '안내 상자. 대괄호 뒤에 상자 제목(있으면)과 문장', '[Tip] 사례를 찾기 어렵다면? \'~ 빅데이터\'로 기사를 검색해 보세요.'],
    ['[제미나이]', '제미나이에게 물어보기 상자. 질문 예시와 정리할 칸', ['[제미나이] 질문: "exe 파일이 무엇인지 쉽게 설명해줘."', '정리: [쓰기 칸 2줄]']],
    ['[표]', '워드 표를 그대로 넣어요. 첫 줄은 제목 줄. 칸 안에도 [[정답]] · [[ ]] 를 써요.', '「3. 작성 예시」의 표를 보세요.'],
    ['[하나 고르기]', '문제 다음 줄부터 보기를 한 줄에 하나. 정답 보기 끝에 (정답). 틀렸을 때 보여 줄 이유는 "이유:"(없으면 Claude 가 써요)', ['[하나 고르기] 확장자를 .gif 로 바꾸면 게임이 실행될까?', '실행된다 (이유: 게임을 켜는 파일은 .exe 하나예요)', '실행되지 않는다 (정답)']],
    ['[모두 고르기]', '정답이 여러 개인 문제. 정답 보기마다 (정답)', ['[모두 고르기] 디지털 데이터를 모두 고르세요.', '사진 파일 (정답)', '종이 편지', '음악 파일 (정답)']],
    ['[O/X]', '한 줄에 한 문장, 끝에 → O 또는 → X. 이유는 괄호로(선택)', ['[O/X]', '1. 표에서 가로줄은 \'행\'이다. → O', '2. 확장자만 바꾸면 파일 종류도 바뀐다. → X (이유: 안의 내용은 그대로예요)']],
    ['[이름표 끌어 놓기]', '이름표 목록 한 줄 + "칸 → 정답"을 한 줄씩', ['[이름표 끌어 놓기] 이름표: 아날로그, 디지털', '체온계(수은) → 아날로그', '디지털카메라 → 디지털']],
    ['[순서 배열]', '올바른 순서대로 적어요. 활동지에서는 섞어서 보여 줘요.', '[순서 배열] 1) 문제 정하기 2) 데이터 수집 3) 데이터 분석 4) 결과 공유'],
    ['[그림]', '필요한 그림을 말로 설명(또는 따로 줄 파일 이름)', '[그림] 체온계 그림, 화면에 36.5 표시'],
    ['[붙여넣기 칸]', '학생이 캡처한 그래프·화면을 붙여 넣는 칸', '[붙여넣기 칸] 내가 만든 막대그래프 캡처'],
    ['[링크]', '열어 볼 사이트·영상 주소', '[링크] 제미나이 열기 https://gemini.google.com'],
    ['[메모]', 'Claude 에게만 하는 말(활동지에는 안 나와요)', '[메모] 이 표는 폰에서 보기 좋게 세로로 바꿔 줘.'],
  ]),
];

// ── 3. 작성 예시 ──
const W2 = [3600, CONTENT_W - 3600];
const example = [
  H(HeadingLevel.HEADING_1, '3. 작성 예시 (03차시 「데이터 과학」 일부)'),
  note('※ 모양만 보는 곳이에요. 이 부분은 활동지에 들어가지 않아요.'),
  H(HeadingLevel.HEADING_3, '미션 1'),
  label('미션 제목: ', '데이터 과학은 어떤 순서로 문제를 해결할까?'),
  label('도입 문장: ', '유튜버는 어떻게 인기 콘텐츠를 만들까? 그냥 느낌대로 찍는 게 아니라, 데이터를 분석해서 결정한다.'),
  label('활동:'),
  P('각 단계 옆 문장의 빈칸에, 그 단계에서 하는 일을 알맞게 채워보세요.'),
  P('1. 문제 정하기: [[해결하고 싶은 문제]] 분명히 정한다.'),
  P('3. 데이터 분석하기: 데이터의 [[패턴]]과 [[규칙]]을 찾아본다.'),
  P('[표] 내 유튜브 키우기 — 위 4단계를 "내 유튜브 키우기" 문제에 적용해 보세요.'),
  table(W2, [
    ['단계', '내 유튜브 키우기 문제를 해결하기 위해서는'],
    ['1. 문제 정하기', '[[ ]]'],
    ['2. 데이터 수집 및 특성 파악하기', '[[ ]]'],
  ]),
  P('[Tip] 사례를 찾기 어렵다면? \'~ 데이터 분석\', \'~ 빅데이터\'로 기사를 검색해 보세요.', { spacing: { before: 120 } }),
  H(HeadingLevel.HEADING_3, '미션 5 — 형성평가'),
  P('[O/X] 다 고른 뒤 정답 확인 버튼으로 채점'),
  P('1. 카페 사장님이 지난 3개월간의 영수증 데이터를 분석해서 원인을 찾았다. 이것은 데이터 기반 의사 결정이다. → O'),
  P('2. 반장이 "작년 축제 때 반응이 좋았으니까 올해도 똑같이 하자"라고 결정했다. 이것은 데이터 기반 의사 결정이다. → X (이유: 경험에만 기댄 결정이에요)'),
];

// ── ✍️ 여기부터 작성 ──
const mission = (n) => [
  H(HeadingLevel.HEADING_2, `미션 ${n}`),
  label('미션 제목: '),
  label('도입 문장: '),
  label('활동:'),
  note('※ 표기법 이름으로 시작해서 한 줄씩 적어요. 표가 필요하면 워드 표를 넣어요.'),
  blank(), blank(), blank(),
];
const WI = [3900, CONTENT_W - 3900];
const form = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('✍️ 여기부터 작성')] }),   // 새 쪽에서 시작(이 부분만 인쇄하기 쉽게)
  H(HeadingLevel.HEADING_2, '기본 정보'),
  table(WI, [
    ['항목', '적기'],
    [['단원', { note: '데이터 분석 · 인공지능 · 정보 윤리' }], ''],
    [['차시', { note: '예) 04' }], ''],
    ['제목', ''],
    [['한 줄 소개', { note: '제목 아래 설명 — 비우면 Claude 가 써요' }], ''],
    [['틀', { note: '4탭(이용 규칙·시간표·급식·활동지) 또는 한 화면 — 비우면 4탭' }], ''],
    [['공개', { note: '바로 공개 또는 준비 중 — 비우면 바로 공개' }], ''],
    [['원자료', { note: '함께 주는 PDF·한글 파일 이름(있으면)' }], ''],
    [['맨 앞 안내 상자', { note: '「이 학습지는 이렇게 써요」·제미나이 Tip: 넣기 또는 빼기 — 비우면 넣기' }], ''],
  ], { labelCol: true }),
  H(HeadingLevel.HEADING_2, '오늘의 목표'),
  goal(), goal(), goal(),
  ...mission(1), ...mission(2), ...mission(3), ...mission(4),
  H(HeadingLevel.HEADING_2, '미션 5 — 형성평가'),
  note('※ 없으면 이 부분을 지워요. [O/X] 또는 [하나 고르기]로 적어요.'),
  P('[O/X]'),
  P('1. '), P('2. '), P('3. '), P('4. '), P('5. '),
  H(HeadingLevel.HEADING_2, '정답지 · 그 밖에'),
  table(WI, [
    ['항목', '적기'],
    [['교사용 정답지에 채울 칸', { note: '정답 있는 칸만 또는 예시 답도 — 비우면 정답 있는 칸만' }], ''],
    [['채점 방식', { note: '누르면 바로 채점 또는 다 고른 뒤 ✅ 정답 확인 — 비우면 활동마다 알맞게' }], ''],
    ['그 밖에 부탁할 것', ''],
  ], { labelCol: true }),
];

const doc = new Document({
  creator: '신현중학교 정보',
  title: '정보 수업 활동지 양식',
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: '26224A' }, paragraph: { spacing: { after: 100, line: 320 } } } },
    paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 40, bold: true, color: INK }, paragraph: { spacing: { after: 120 } } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 30, bold: true, color: INK },
        paragraph: { spacing: { before: 400, after: 160 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: LINE, space: 4 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 25, bold: true, color: INK }, paragraph: { spacing: { before: 320, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { font: FONT, size: 22, bold: true, color: INK }, paragraph: { spacing: { before: 240, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 260 } } } }] },
      { reference: 'goal', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 440, hanging: 320 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    children: [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('정보 수업 활동지 양식')] }),
      P('이 양식에 내용을 적어 주면, Claude 가 수업 활동지(웹 활동지)로 만들어요.'),
      note('양식 1판 · 2026-09-30 · 신현중학교 정보'),
      ...howTo, ...notation, ...example, ...form,
    ],
  }],
});

fs.writeFileSync(out, await Packer.toBuffer(doc));
console.log('✔', out);
