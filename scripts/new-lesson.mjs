#!/usr/bin/env node
// 새 차시 폴더 만들기 — 비슷한 기존 차시를 복사해서 출발한다(틀·디자인·PDF 버튼이 그대로 따라옴).
//
//   npm run new -- data-analysis/08 --from 07 --title "새 차시 제목"
//
// 만들어지는 것: lessons/<단원>/<차시>/ lesson.html(복사본) · assets/(복사본) · lesson.json(status: draft) · spec.md(빈 틀)
// 그다음: Claude 에게 "/lesson-new 08" 로 기획부터, 또는 "/lesson-edit 08 …" 로 내용 교체를 부탁하면 된다.
import fs from 'node:fs';
import path from 'node:path';
import { LESSONS_DIR, listLessons, pickLessons, writeText, rel } from './lib/common.mjs';

const argv = process.argv.slice(2);
const opt = {}; const pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) opt[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  else pos.push(argv[i]);
}
try {
  const target = pos[0];
  if (!target || !target.includes('/')) throw new Error('사용법: npm run new -- <단원>/<차시> --from <복사할 차시> --title "제목"');
  const [unit, no] = target.split('/');
  const dir = path.join(LESSONS_DIR, unit, no);
  if (fs.existsSync(path.join(dir, 'lesson.json'))) throw new Error(`${target} 는 이미 있어요.`);
  const all = listLessons();
  if (!all.length) throw new Error('복사해 올 차시가 하나도 없어요.');
  const from = opt.from ? pickLessons([opt.from])[0] : all[all.length - 1];

  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(from.src, path.join(dir, 'lesson.html'));
  const fromAssets = path.join(from.dir, 'assets');
  if (fs.existsSync(fromAssets)) fs.cpSync(fromAssets, path.join(dir, 'assets'), { recursive: true });
  const unitTitle = all.find((l) => l.unit === unit)?.meta.unitTitle || opt['unit-title'] || unit;
  writeText(path.join(dir, 'lesson.json'), JSON.stringify({
    unit, unitTitle, no, title: opt.title || `${no}차시 (제목 미정)`,
    shell: from.meta.shell, status: 'draft', copiedFrom: from.id,
  }, null, 2) + '\n');
  writeText(path.join(dir, 'spec.md'), `# ${opt.title || no + '차시'} — 기획

> /lesson-new 스킬이 채운다. 확정된 숫자·정답은 여기와 answers.json 에만 적고, 이후 바꾸지 않는다.

## 대상 · 시간
- 학년/반:
- 차시 길이: 45분

## 학습 목표
1.
2.
3.

## 활동 흐름 (도입 → 전개 → 정리)
| 순서 | 카드 | 활동 유형 | 시간 |
|---|---|---|---|

## 데이터 · 자료
- 원자료:
- 이미지(input/ 에 PNG 로 넣기):

## 정답 · 채점 기준
(빈칸 aria-label → 정답 은 answers.json 에)
`);
  console.log(`✔ ${rel(dir)} 만들었어요 (${from.id} 복사, status: draft — 목록 페이지에는 "준비 중"으로 보여요)`);
  console.log('  다음: Claude 에게 "/lesson-new ' + no + '" 로 기획을 부탁하세요.');
} catch (e) {
  console.error('✖ ' + e.message);
  process.exit(1);
}
