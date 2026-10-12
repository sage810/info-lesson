// 「수행평가 양식.docx」 만들기 — 선생님이 이 양식에 문항·정답·배점을 적어 오면 09 처럼 생긴 수행평가(시험지)로 만든다(lesson-exam 스킬).
// Google 문서 · Claude 웹에서 깨지지 않게: 기본 제목 스타일(제목 1~3), DXA 너비 표, 글상자·도형·양식 컨트롤 없음, 표기는 글자([ ], [[ ]])만.
// 실행(docx 패키지는 scratchpad 에만):
//   cd <scratchpad>/docx && npm init -y && npm i docx
//   cp .claude/skills/lesson-exam/references/exam-template-docx.mjs <scratchpad>/docx/
//   node exam-template-docx.mjs "docs/templates/수행평가 양식.docx"
import fs from 'node:fs';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, LevelFormat, AlignmentType,
} from 'docx';

const out = process.argv[2] || '수행평가 양식.docx';
const FONT = 'Malgun Gothic';
const INK = '4B3B6B', MARK = '6B3FA0', GRAY = '7A7489', LINE = 'B9B0D3', WARN = 'B3261E';
const PAGE_W = 11906, MARGIN = 1134, CONTENT_W = PAGE_W - MARGIN * 2;   // A4, 여백 2cm → 본문 9638

// 글 안의 [표기] · [[정답]] 은 굵은 보라 글씨로
const runs = (str, base = {}) => String(str).split(/(\[\[[^\]]*\]\]|\[[^[\]]+\])/).filter(Boolean)
  .map((t) => (/^\[/.test(t) ? new TextRun({ ...base, text: t, bold: true, color: MARK }) : new TextRun({ ...base, text: t })));
const P = (str, opts = {}) => new Paragraph({ ...opts, children: runs(str, opts.run) });
const note = (str) => new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: str, color: GRAY, size: 18 })] });
const warn = (str) => new Paragraph({ spacing: { before: 60, after: 100 }, children: [new TextRun({ text: str, bold: true, color: WARN })] });
const label = (str, rest = '') => new Paragraph({ spacing: { before: 120, after: 60 }, children: [new TextRun({ text: str, bold: true }), ...runs(rest)] });
const H = (level, text) => new Paragraph({ heading: level, children: [new TextRun(text)] });
const bullet = (str) => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 }, children: runs(str) });
const blank = () => new Paragraph({ children: [] });

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
// 표: 너비는 표(columnWidths)와 칸(width) 둘 다 DXA — 퍼센트는 Google 문서에서 깨짐
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
  warn('⚠ 이 파일에는 정답이 들어가요. 학생에게 보내거나 공개 저장소·단체 채팅방에 올리지 마세요. (Claude 는 이 PC 의 input/ 폴더에만 두고 커밋하지 않아요.)'),
  bullet('「✍️ 여기부터 작성」 아래만 채우면 돼요. 위의 1~3은 설명이라 지우지 않아도 돼요 — Claude 는 「✍️ 여기부터 작성」 아래만 읽어요.'),
  bullet('문제 번호·발문·보기는 시험지에 나올 그대로 적어요. 띄어쓰기나 사실이 이상해 보이면 Claude 가 알려 드리고 고칠지 물어봐요.'),
  bullet('문항마다 ① 어떤 방식으로 답하는지 이름표 [하나 고르기]·[글자 답] 등 ② 배점 [1점] ③ 정답 을 적어요. 이름표는 「2. 문항 표기법」에서 골라요.'),
  bullet('정답과 허용 답은 학생 화면에 절대 안 나와요. Claude 가 이 PC 에만 있는 파일(answers.json)에 옮겨 담아서, 구글 시트에서 자동 채점할 때만 써요.'),
  bullet('채점 기본값: 부분 점수 없음 · 글자 답은 앞뒤 공백·대소문자 무시 · 마지막으로 제출한 답으로 채점. 다르게 하고 싶으면 「기본 정보」 표에 적어요.'),
  bullet('문항 속 표는 워드 표를 그대로 넣거나 [표] 로, 데이터 파일(CSV)은 [데이터] 로 적어요. 그림은 [그림] 으로 설명만 적고 파일은 따로 주면 더 선명해요.'),
  bullet('문항이 더 필요하면 문항 한 덩어리(번호 ~ 정답)를 복사해 붙이고, 필요 없는 문항은 지워요. 미션(영역)을 더 나눠도 돼요.'),
  bullet('정하지 못한 것은 비워 두거나 (물어봐 줘) 라고 적어요. 만들 때 골라 달라고 물어볼게요.'),
  bullet('학생 이름·학번 같은 개인정보는 적지 않아요.'),
  bullet('Google 문서에서 써도 돼요. 다 쓰면 파일 → 다운로드 → Microsoft Word(.docx) 로 받아서 주거나, Claude 에 그대로 올려요.'),
];

// ── 2. 문항 표기법 ──
const W3 = [2000, 3700, CONTENT_W - 2000 - 3700];
const notation = [
  H(HeadingLevel.HEADING_1, '2. 문항 표기법'),
  P('표기는 대괄호 [ ] 로 써요. 배점은 [1점], 정답은 "정답:" 으로 시작하는 줄에 적어요. 화살표 → 는 -> 로 써도 돼요.'),
  table(W3, [
    ['표기', '쓰는 법', '예시'],
    ['[하나 고르기]', '보기를 한 줄에 하나(①②③…). 정답 보기 끝에 (정답). 보기 번호 자체는 시험지에 쓰는 번호로 적어요.', ['3. [하나 고르기] [1점] 다음 중 알맞은 것은?', '① …', '② … (정답)', '③ …']],
    ['[모두 고르기]', '정답이 여러 개인 문제. 정답 보기마다 (정답). 전부 맞아야 점수(부분 점수 없음).', ['[모두 고르기] [1점] 기준 3가지를 모두 고르시오.', '① … (정답)', '② …', '③ … (정답)']],
    ['[순서 배열]', '(a)~(d) 보기를 한 줄씩 적고 마지막 줄에 정답 순서. 학생은 보기를 차례로 눌러 순서를 만들어요.', ['[순서 배열] [1점] 알맞은 순서로 나열하세요.', '(a) … / (b) … / (c) … / (d) …', '정답: c → a → d → b']],
    ['[칩 고르기]', '짧은 이름표(분석 유형 같은) 중 하나를 눌러 고르는 문항. 보기 목록 한 줄 + 정답.', ['[칩 고르기] [1점] 알맞은 분석 유형은?', '보기: 구성 분석, 비교 분석, 분포 분석, 관계 분석', '정답: 비교 분석']],
    ['[글자 답]', '학생이 짧게 직접 적는 칸. 정답 한 줄, 같이 인정할 답은 "허용:" 에 쉼표로.', ['[글자 답] [1점] 이 표의 속성은 몇 개인가?', '정답: 4개', '허용: 4, 네 개, 네개']],
    ['[그래프 칸]', '학생이 CODAP 그래프를 캡처해 붙여넣는 칸. 구글 시트 채점 도우미에서 선생님이 직접 점수를 줘요. 배점을 적어요.', '[그래프 칸] [2점] CODAP 으로 그래프를 그려 붙이세요.'],
    ['[표]', '문항 속에 보여 줄 표(읽기용). 워드 표를 그대로 넣고 첫 줄은 제목 줄. 열 머리글(A, B…)과 행 번호도 표에 적어요.', '표 아래에 문항을 이어 적어요.'],
    ['[데이터]', '시험지에 내려받기 버튼으로 줄 파일. 파일 이름과 열 설명을 적어요(파일은 따로 줘요).', '[데이터] 유튜버100.csv — 열: 채널이름, 구독자수(만명), 분야'],
    ['[그림]', '필요한 그림을 말로 설명(또는 따로 줄 파일 이름)', '[그림] 점들이 오른쪽 위로 올라가는 산점도'],
    ['[배점]', '문항 끝에 [1점]. 소문항이 같은 점수면 미션/문항 머리에 [각 2점]. 적지 않으면 기본 1점.', '5. (1)~(5) 각각 [1점]'],
    ['소문항', '(1) (2) (3) 을 한 줄씩. 소문항마다 표기·배점·정답을 따로 적어요. 채점은 소문항 하나가 한 칸이에요.', '9. (1) [칩 고르기] [2점] …  /  (2) [그래프 칸] [2점] …'],
    ['[안내] [주의]', '문항 사이에 넣는 안내 상자(시험지에 보여 줄 말)', '[주의] 답 칸에 붙여넣기는 막혀 있어요.'],
    ['[메모]', 'Claude 에게만 하는 말(시험지에는 안 나와요)', '[메모] 이 문항은 표를 보면서 풀게 표 아래에 놓아 줘.'],
  ]),
];

// ── 3. 작성 예시 (가짜 내용 — 실제 시험과 무관) ──
const exTable = [
  ['', 'A', 'B', 'C'],
  ['1', '번호', '이름', '점수'],
  ['2', '1', '가나', '80'],
  ['3', '2', '다라', '95'],
];
const example = [
  H(HeadingLevel.HEADING_1, '3. 작성 예시 (모양만 보세요 — 내용은 가짜예요)'),
  note('※ 이 부분은 시험지에 들어가지 않아요.'),
  H(HeadingLevel.HEADING_3, '미션 1 — 개념 확인'),
  P('1. [순서 배열] [1점] 데이터 분석 과정에 맞게 (a)~(d)를 나열하세요.'),
  P('(a) 결과를 정리해 발표한다. / (b) 분석할 문제를 정한다. / (c) 데이터를 모아 표로 정리한다. / (d) 그래프로 살펴본다.'),
  P('정답: b → c → d → a'),
  P('2. [하나 고르기] [1점] 데이터로 풀기에 알맞은 질문은?', { spacing: { before: 160 } }),
  P('① 어떤 노래가 최고일까? ② 이번 달 우리 반 지각은 몇 번일까? (정답) ③ 우리 학교는 좋은 학교일까?'),
  P('3. [표] 아래 표를 보고 물음에 답하시오.', { spacing: { before: 160 } }),
  table([700, 1500, 1500, 1500], exTable, { head: true }),
  P('(1) [글자 답] [1점] 이 표의 속성은 몇 개인가?', { spacing: { before: 100 } }),
  P('정답: 3개'), P('허용: 3, 세 개, 세개'),
  P('(2) [글자 답] [1점] 점수 95가 들어 있는 셀의 주소는?'),
  P('정답: C3'), P('허용: c3'),
  H(HeadingLevel.HEADING_3, '미션 2 — 그래프 [각 2점]'),
  P('4. 어떤 분야의 평균 조회수가 가장 높을까?'),
  P('(1) [칩 고르기] [2점] 이 질문은 어떤 분석일까?'),
  P('보기: 구성 분석, 비교 분석, 분포 분석, 관계 분석'), P('정답: 비교 분석'),
  P('(2) [그래프 칸] [2점] CODAP 으로 그래프를 그려 붙이세요.'),
  P('(3) [하나 고르기] [2점] 그래프를 해석한 것으로 알맞은 것은?'),
  P('① … ② … (정답) ③ …'),
];

// ── ✍️ 여기부터 작성 ──
const WI = [3900, CONTENT_W - 3900];
const mission = (n) => [
  H(HeadingLevel.HEADING_2, `미션 ${n}`),
  label('미션 제목: ', '(없으면 비워요)'),
  label('머리 안내: ', '(예: 다음 물음에 답하시오. [각 2점] — 없으면 비워요)'),
  label('문항:'),
  note('※ 번호. [표기] [배점] 발문 → 보기 → 정답 줄 순서로 적어요. 필요하면 소문항 (1)(2)(3).'),
  P('1. '), P('정답: '), P('2. '), P('정답: '), P('3. '), P('정답: '),
  blank(),
];
const form = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun('✍️ 여기부터 작성')] }),   // 새 쪽에서 시작
  H(HeadingLevel.HEADING_2, '기본 정보'),
  table(WI, [
    ['항목', '적기'],
    [['단원', { note: '데이터 분석 · 인공지능 · 정보 윤리' }], ''],
    [['시험 이름', { note: '예) 데이터분석 수행평가 B형 — 학생 화면 제목과 PDF 파일 이름에 써요' }], ''],
    [['총점', { note: '문항 배점을 더한 값 — Claude 가 만든 뒤 합계가 맞는지 확인해요' }], ''],
    [['시험 날짜 · 공개', { note: '시험 날까지는 이 PC 에만 두고 날짜에 공개해요 — 비우면 그렇게 해요' }], ''],
    [['데이터 파일', { note: '[데이터] 로 줄 파일 이름과 열 설명(없으면 비워요)' }], ''],
    [['틀', { note: '비우면 09 와 같은 한 화면(standalone)·시험 안내·왼쪽 도움말 카드' }], ''],
    [['도움말 카드', { note: '비우면 09 처럼 「CODAP 들어가는 법」「캡처해서 붙여넣기」 두 개 — 다른 도움말이 필요하면 적어요' }], ''],
    [['필수 입력', { note: '비우면 이름만 필수(학년·반·번호는 칸만) — 09 와 같음' }], ''],
    [['답 보관 시간', { note: '새로고침·재시작해도 첫 입력부터 이 시간 동안 답이 남아요 — 비우면 45분' }], ''],
    [['부분 점수', { note: '비우면 없음(모두 고르기·순서는 전부 맞아야 점수)' }], ''],
    [['글자 답 허용 범위', { note: '비우면 앞뒤 공백·대소문자 무시 + 문항마다 적은 "허용:" 답' }], ''],
    [['직접 채점할 칸', { note: '[그래프 칸] 외에 선생님이 직접 점수를 줄 칸이 있으면 적어요(지금 시스템은 그래프 칸만 직접 채점)' }], ''],
    [['원자료', { note: '함께 주는 PDF·한글 파일 이름(있으면)' }], ''],
  ], { labelCol: true }),
  H(HeadingLevel.HEADING_2, '시험 안내 (학생이 맨 앞에서 읽는 말)'),
  note('※ 비우면 09 의 안내(제출 방법 · 정답이 안 나옴 · 붙여넣기 불가 · 자동 보관 · 다른 사람 답이 보이면 지우기)를 그대로 써요. 바꿀 말이 있으면 아래에 적어요.'),
  blank(), blank(),
  ...mission(1), ...mission(2),
  H(HeadingLevel.HEADING_2, '배점 확인'),
  note('※ 미션별 합계와 총점을 적으면 만든 뒤 맞춰 봐요(자동 채점 점수 + 직접 채점 점수).'),
  table(WI, [
    ['항목', '적기'],
    ['미션 1 합계', ''],
    ['미션 2 합계', ''],
    ['자동 채점 / 직접 채점 점수', ''],
    ['총점', ''],
  ], { labelCol: true }),
  H(HeadingLevel.HEADING_2, '그 밖에'),
  table(WI, [
    ['항목', '적기'],
    ['그 밖에 부탁할 것', ''],
  ], { labelCol: true }),
];

const doc = new Document({
  creator: '신현중학교 정보',
  title: '정보 수행평가 양식',
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
    ],
  },
  sections: [{
    properties: { page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
    children: [
      new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun('정보 수행평가 양식')] }),
      P('이 양식에 문항·정답·배점을 적어 주면, Claude 가 09 처럼 생긴 수행평가(시험지)로 만들어요 — 정답은 화면에 안 나오고, 학생이 PDF 로 저장하면 구글 시트로 자동 제출·채점돼요.'),
      note('양식 1판 · 2026-10-12 · 신현중학교 정보'),
      ...howTo, ...notation, ...example, ...form,
    ],
  }],
});

fs.writeFileSync(out, await Packer.toBuffer(doc));
console.log('✔', out);
