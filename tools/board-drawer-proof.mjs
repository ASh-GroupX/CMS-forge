// Card detail quick-look drawer e2e proof (docs/CMSS_REVAMP_PLAN.md Phase C: C1 open
// drawer registration + C2 drawer interaction). For BOTH boards, in en LTR and ar RTL,
// this hydrates the real island, proves click-a-card-title OPENS the drawer and renders
// the fetch-on-open payload, screenshots the open drawer (the Radix Sheet portal that
// renderToStaticMarkup could not mount — see the B6 handover), runs live axe on it, and
// proves a completed DRAG does NOT open the drawer (the 6px sensor threshold suppresses
// the trigger click).
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { complaintBoardFixture } from './web-proof-board-fixtures.mjs';
import { proofFetch } from './web-proof-fixtures.mjs';
import { assertNoSeriousAxe, bundleIsland, loadAxe, loadPlaywright, writeBoardPage } from './board-island-harness.mjs';

const taskBoard = await (await proofFetch('http://localhost:3000/tasks/board')).json();
const complaintBoard = complaintBoardFixture();

const boards = [
  {
    key: 'task',
    cardLabel: 'BOARD-PROOF-001 Call customer about delivery date',
    fetched: 'Proof task comment shown in the drawer',
    entry: (locale) => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TaskBoardScreen } from './src/components/task-board/index.tsx';
const board = ${JSON.stringify(taskBoard)};
const moveAction = async () => ({ status: 'success' });
const detailAction = async () => ({ status: 'ready', comments: [{ id: 'c1', body: 'Proof task comment shown in the drawer', authorName: 'Proof Author', authorNameAr: 'مؤلف الاختبار', createdAt: '2026-06-20T10:00:00.000Z' }] });
createRoot(document.getElementById('root')).render(React.createElement(TaskBoardScreen, { board, locale: '${locale}', moveAction, detailAction }));
`,
  },
  {
    key: 'complaint',
    cardLabel: 'CMP-BOARD-001',
    fetched: 'Proof timeline entry shown in the drawer',
    entry: (locale) => `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ComplaintBoardScreen } from './src/components/complaint-board/index.tsx';
const board = ${JSON.stringify(complaintBoard)};
const transitionAction = async () => ({ status: 'success' });
const detailAction = async () => ({ status: 'ready', timeline: [{ id: 't1', type: 'COMMENT', createdAt: '2026-06-20T10:00:00.000Z', actor: { id: 'u1', name: 'Proof Actor', role: 'CR_MANAGER' }, visibility: 'INTERNAL', customerVisible: false, summary: 'Proof timeline entry shown in the drawer' }] });
createRoot(document.getElementById('root')).render(React.createElement(ComplaintBoardScreen, { board, locale: '${locale}', staff: [], options: null, detailAction, transitionAction }));
`,
  },
];

const AxeBuilder = await loadAxe();
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
try {
  for (const board of boards) {
    for (const locale of ['en', 'ar']) {
      const name = `${board.key}-${locale}`;
      const dir = locale === 'ar' ? 'rtl' : 'ltr';
      const outDir = join('coverage', 'board-drawer', name);
      const url = writeBoardPage(outDir, await bundleIsland(board.entry(locale)), { lang: locale, dir });
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      try {
        await page.goto(url);
        const card = page.locator(`article[aria-label="${board.cardLabel}"]`).first();
        await card.waitFor();
        const trigger = card.locator('button').first();

        // 1) Click the title trigger → the drawer opens and shows the fetch-on-open payload.
        await trigger.click();
        const drawer = page.getByRole('dialog');
        await drawer.waitFor();
        await drawer.getByText(board.fetched).waitFor();
        assert.ok(await drawer.getByText(board.fetched).count() >= 1, `${name}: fetch-on-open content rendered in the drawer`);

        // C1 registration: screenshot the OPEN drawer + live a11y on it.
        await page.screenshot({ path: join(outDir, `${name}.png`), fullPage: false });
        await assertNoSeriousAxe(AxeBuilder, page, `${name} open drawer`);

        // Close, then prove a completed DRAG on the same trigger does NOT open the drawer.
        await page.keyboard.press('Escape');
        await drawer.waitFor({ state: 'hidden' });
        const box = await trigger.boundingBox();
        assert.ok(box, `${name}: trigger has geometry`);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2 + 24, { steps: 6 });
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
        await page.mouse.up();
        await page.waitForTimeout(150);
        // Assert the DRAWER specifically stayed closed via its fetch-on-open content —
        // a complaint drag legitimately opens the transition dialog (correct board
        // behaviour), so a blanket "no dialog" check would be wrong; the drawer's
        // payload text is the precise discriminator for "the trigger click was suppressed".
        assert.equal(await page.getByText(board.fetched).count(), 0, `${name}: a completed drag does not open the detail drawer`);
        console.log(`board drawer proof passed: ${name}`);
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}
console.log('board drawer proof passed: both boards (en + ar) open on click, render fetch-on-open, pass axe, and stay closed on drag');
