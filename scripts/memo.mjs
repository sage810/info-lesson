#!/usr/bin/env node
// "메모 켜줘" — 이 PC 에서 수정 요청 메모(shared/runtime/msi-memo.js)를 바로 쓸 수 있게 한다.
//   npm run memo              → 가장 최근에 고친 차시를 연다
//   npm run memo -- 03        → 3차시를 연다 (data-analysis/03 처럼 써도 됨)
// 하는 일: ① 빌드(최신 반영) ② 미리보기 서버(8080)가 꺼져 있으면 뒤에서 켬 ③ 주소 끝에 ?memo=1 을 붙여 브라우저로 연다.
// 서버는 PC 를 끄거나 `Stop-Process`/작업 관리자에서 node 를 끝내면 꺼진다.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ROOT, listLessons, pickLessons } from './lib/common.mjs';

const args = process.argv.slice(2);
const base = 'http://127.0.0.1:8080';

// 어느 차시 — 말한 차시, 없으면 lesson.html 을 가장 최근에 고친 차시
const lessons = listLessons().filter((l) => l.meta.status !== 'hidden');
const lesson = args.some((a) => !a.startsWith('--'))
  ? pickLessons(args)[0]
  : [...lessons].sort((a, b) => fs.statSync(b.src).mtimeMs - fs.statSync(a.src).mtimeMs)[0];
if (!lesson) { console.error('✖ 열 차시가 없어요.'); process.exit(1); }

// ① 빌드 — 방금 고친 내용이 미리보기에 보이게
console.log('… 빌드 중');
const b = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build.mjs')], { cwd: ROOT, encoding: 'utf8' });
if (b.status !== 0) { console.error(b.stdout || '', b.stderr || ''); console.error('✖ 빌드에 실패했어요. 위 메시지를 확인하세요.'); process.exit(1); }

// ② 서버
const up = async () => { try { return (await fetch(base + '/', { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; } };
let started = false;
if (!(await up())) {
  spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve.mjs')], { cwd: ROOT, detached: true, stdio: 'ignore', windowsHide: true }).unref();
  started = true;
  for (let i = 0; i < 20 && !(await up()); i++) await new Promise((r) => setTimeout(r, 300));
  if (!(await up())) { console.error('✖ 미리보기 서버를 켜지 못했어요. `npm run serve` 로 직접 켜 보세요.'); process.exit(1); }
}

// ③ 열기
const url = `${base}/${lesson.unit}/${lesson.no}/?memo=1`;
const page = await (await fetch(`${base}/${lesson.unit}/${lesson.no}/`)).text();
if (!page.includes('msi-memo')) console.log('△ 이 주소의 서버가 메모 기능이 없는 옛 화면이에요. 8080 을 쓰는 다른 프로그램을 끄고 다시 해 보세요.');
if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
console.log(`✔ 메모 켰어요${started ? ' (미리보기 서버도 새로 켬)' : ''}: ${url}`);
console.log('  글을 드래그 → 오른쪽 아래 📝 메모 → 목록에 담기 → 전체 복사 → Claude 에 붙여넣기');
