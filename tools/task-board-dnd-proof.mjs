// Task board drag & drop e2e proof (docs/CMSS_REVAMP_PLAN.md A8).
// Bundles the real TaskBoardScreen client island with the proof-board fixture
// and a recording move action, hydrates it in Chromium, performs a genuine
// pointer drag between columns, and asserts both the DOM move and the payload
// the island commits to the server action.
import assert from 'node:assert/strict';
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { compileTailwind } from './web-browser-check.mjs';
import { proofFetch } from './web-proof-fixtures.mjs';

const outDir = join('coverage', 'task-board-dnd');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const board = await (await proofFetch('http://localhost:3000/tasks/board')).json();
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TaskBoardScreen } from './src/components/task-board/index.tsx';
const board = ${JSON.stringify(board)};
window.__moves = [];
const moveAction = async (taskId, payload) => {
  window.__moves.push({ taskId, payload });
  const card = board.columns.flatMap((column) => column.cards).find((candidate) => candidate.id === taskId);
  return { status: 'success', card: { ...card, stageId: payload.stageId, boardPosition: payload.boardPosition } };
};
createRoot(document.getElementById('root')).render(
  React.createElement(TaskBoardScreen, { board, locale: 'en', moveAction }),
);
`;

const esbuild = createRequire(import.meta.url)(esbuildPath());
const bundle = await esbuild.build({
  bundle: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  format: 'iife',
  jsx: 'automatic',
  stdin: { contents: entry, loader: 'tsx', resolveDir: resolve('apps/web') },
  write: false,
});
compileTailwind(outDir);
writeFileSync(join(outDir, 'board.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>task board dnd proof</title><link rel="stylesheet" href="./proof.css" /></head>
<body><div id="root"></div><script>${bundle.outputFiles[0].text}</script></body></html>`);

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await page.goto(pathToFileURL(join(outDir, 'board.html')).href);
  const card = page.locator('li', { has: page.getByText('BOARD-PROOF-002', { exact: false }) }).last();
  const targetColumn = page.locator('section', { has: page.getByRole('heading', { name: 'In Progress' }) }).last();
  await card.waitFor();
  const from = await card.boundingBox();
  const to = await targetColumn.boundingBox();
  assert.ok(from && to, 'card and target column must render with geometry');

  // Real pointer drag: press, clear the 6px activation constraint, glide, drop.
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2 + 12, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height - 10, 200), { steps: 20 });
  await page.mouse.up();

  await page.waitForFunction(() => window.__moves.length === 1);
  const moves = await page.evaluate(() => window.__moves);
  assert.equal(moves[0].taskId, 'task_board_2', 'the dragged card commits the move');
  assert.equal(moves[0].payload.stageId, 'stage_in_progress', 'the drop column becomes the target stage');
  assert.ok(Number.isInteger(moves[0].payload.boardPosition) && moves[0].payload.boardPosition >= 0, 'a non-negative position is sent');

  const inProgressCards = await targetColumn.locator('article').allTextContents();
  assert.ok(inProgressCards.some((text) => text.includes('BOARD-PROOF-002')), 'card rendered inside the target column after drop');
  const toastVisible = await page.getByText('Task moved to In Progress.', { exact: false }).count();
  assert.ok(toastVisible >= 1, 'success toast announces the move');
} finally {
  await browser.close();
}
console.log('task board dnd proof passed: pointer drag moved the card and committed stage_in_progress');

function esbuildPath() {
  const pnpmDir = resolve('node_modules', '.pnpm');
  const entryDir = readdirSync(pnpmDir).find((name) => name.startsWith('esbuild@'));
  assert.ok(entryDir, 'esbuild package must be installed');
  return join(pnpmDir, entryDir, 'node_modules', 'esbuild', 'lib', 'main.js');
}

async function loadPlaywright() {
  const pnpmDir = resolve('node_modules', '.pnpm');
  const entryDir = readdirSync(pnpmDir).find((name) => name.startsWith('playwright-core@'));
  assert.ok(entryDir, 'playwright-core package must be installed');
  return import(pathToFileURL(join(pnpmDir, entryDir, 'node_modules', 'playwright-core', 'index.mjs')).href);
}
