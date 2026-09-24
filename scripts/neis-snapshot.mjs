#!/usr/bin/env node
// data/timetable.json + data/meal.json → data/neis-snapshot.json
// (예전 scripts/build-webapp-data.ps1 을 Node 로 옮긴 것. 이제 HTML 에 직접 넣지 않고 JSON 하나만 만든다.
//  빌드할 때 이 스냅샷이 시간표·급식 탭이 있는 활동지에 자동으로 들어간다.)
//
//   1) pwsh scripts/fetch-neis.ps1   ← NEIS 에서 최신 데이터 받기 (인증키 필요, 기존과 동일)
//   2) npm run neis                  ← 스냅샷 만들기
//   3) npm run build                 ← 활동지에 반영
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, readText, writeText } from './lib/common.mjs';

const dataDir = path.join(ROOT, 'data');
const load = (n) => {
  const p = path.join(dataDir, n);
  if (!fs.existsSync(p)) throw new Error(`${n} 가 없어요 — 먼저 pwsh scripts/fetch-neis.ps1 을 실행하세요.`);
  return JSON.parse(readText(p).replace(/^﻿/, ''));
};
// PowerShell 의 [int] 변환과 같은 반올림(가운데 값은 짝수 쪽으로)
const roundHalfEven = (x) => {
  const f = Math.floor(x); const d = x - f;
  if (d > 0.5) return f + 1; if (d < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
};

try {
  const tt = load('timetable.json');
  const mealJson = load('meal.json');
  const meal = {};
  for (const [day, entries] of Object.entries(mealJson.days || {})) {
    const list = Array.isArray(entries) ? entries : [entries];
    const pick = list.find((e) => e.type === '중식') || list[0];
    if (!pick) continue;
    meal[day] = {
      items: (pick.dishes || []).map((d) => ({ name: d.name, al: [...(d.allergens || [])] })),
      kcal: roundHalfEven(Number(pick.kcal) || 0),
      type: pick.type,
    };
  }
  const snapshot = { generatedAt: tt.generatedAt, school: tt.school, timetable: tt.classes, meal };
  const json = JSON.stringify(snapshot);
  writeText(path.join(dataDir, 'neis-snapshot.json'), json);
  console.log(`✔ data/neis-snapshot.json — 시간표 학년 ${Object.keys(tt.classes || {}).length}개 · 급식 ${Object.keys(meal).length}일 · ${json.length.toLocaleString()}자`);
  console.log('  이제 `npm run build` 하면 시간표·급식 탭이 있는 활동지에 들어가요.');
} catch (e) {
  console.error('✖ ' + e.message);
  process.exit(1);
}
