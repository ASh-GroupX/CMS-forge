// Ticket board denied-scope + transition-with-reason e2e proof (docs/CMSS_REVAMP_PLAN.md
// Phase C: C2). Hydrates the real ComplaintBoardScreen island with the shared board
// fixture and a recording transition action, then drives genuine pointer drags.
//
// Denied-scope is driven through the card's server-computed `allowedTransitions`
// (NOT an ad-hoc flag): an illegal target column is aria-disabled and refuses the
// drop highlight, so the backend state machine is never asked for an out-of-scope
// move. It is paired with a legal drop on the SAME board that DOES open + commit,
// so the rejection is provably scope-specific, not general brokenness. That the
// server actually withholds transitions by role/branch is proven in the API suite
// (apps/api .../workflow/complaint-board.test.ts) — this proves the client honours it.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { complaintBoardFixture } from './web-proof-board-fixtures.mjs';
import { bundleIsland, loadPlaywright, writeBoardPage } from './board-island-harness.mjs';

const outDir = join('coverage', 'complaint-board-proof');
const board = complaintBoardFixture();
const staff = [{ userId: 'usr_owner', displayName: 'Omar Owner', displayNameAr: 'عمر', role: 'CR Officer', roleAr: 'مسؤول', branchLabel: 'Main Branch', branchLabelAr: 'الفرع الرئيسي' }];

const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ComplaintBoardScreen } from './src/components/complaint-board/index.tsx';
const board = ${JSON.stringify(board)};
window.__transitions = [];
const transitionAction = async (complaintId, payload) => {
  window.__transitions.push({ complaintId, payload });
  return { status: 'success' };
};
const detailAction = async () => ({ status: 'ready', timeline: [] });
createRoot(document.getElementById('root')).render(
  React.createElement(ComplaintBoardScreen, { board, locale: 'en', staff: ${JSON.stringify(staff)}, options: null, detailAction, transitionAction }),
);
`;

const url = writeBoardPage(outDir, await bundleIsland(entry), { lang: 'en', dir: 'ltr' });
const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await page.goto(url);
  await page.locator('article[aria-label="CMP-BOARD-001"]').waitFor();

  // --- Denied-scope: SUBMITTED ticket may only go to MANAGER_REVIEW / REJECTED. ---
  const card = page.locator('article[aria-label="CMP-BOARD-001"]');
  const inProgress = column(page, 'In progress');   // IN_PROGRESS: out of scope for this card
  const managerReview = column(page, 'Manager review'); // MANAGER_REVIEW: the one legal target
  const from = await card.boundingBox();
  const illegal = await inProgress.boundingBox();
  const legal = await managerReview.boundingBox();
  assert.ok(from && illegal && legal, 'card and target columns must render with geometry');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height - 12);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 14, from.y + from.height - 12, { steps: 4 });
  // Hover the illegal column: it must stay inert (aria-disabled, no drop highlight).
  await page.mouse.move(illegal.x + illegal.width / 2, illegal.y + 80, { steps: 12 });
  assert.equal(await inProgress.getAttribute('aria-disabled'), 'true', 'illegal column is a disabled drop target during the drag');
  assert.ok(!(await inProgress.evaluate((el) => el.className.includes('bg-board-drop'))), 'illegal column never shows the drop highlight');
  assert.equal(await managerReview.getAttribute('aria-disabled'), null, 'the one legal column stays enabled');

  // Complete the gesture on the legal column → the transition dialog opens.
  await page.mouse.move(legal.x + legal.width / 2, legal.y + 80, { steps: 16 });
  await page.mouse.up();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  await dialog.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.__transitions.length === 1);
  const accept = (await page.evaluate(() => window.__transitions))[0];
  assert.equal(accept.complaintId, 'cmp_cmp_board_001', 'the dragged ticket is the one committed');
  assert.equal(accept.payload.action, 'ACCEPT_INTAKE', 'the legal drop commits the in-scope action');
  assert.equal(accept.payload.fromStatus, 'SUBMITTED', 'the transition carries the optimistic-free source status');

  // --- Transition-with-reason: BRANCH_REVIEW → IN_PROGRESS (ASSIGN_INVESTIGATION). ---
  const reasonCard = page.locator('article[aria-label="CMP-BOARD-003"]');
  const rFrom = await reasonCard.boundingBox();
  const rTo = await column(page, 'In progress').boundingBox();
  await page.mouse.move(rFrom.x + rFrom.width / 2, rFrom.y + rFrom.height - 12);
  await page.mouse.down();
  await page.mouse.move(rFrom.x + rFrom.width / 2 + 14, rFrom.y + rFrom.height - 12, { steps: 4 });
  await page.mouse.move(rTo.x + rTo.width / 2, rTo.y + 80, { steps: 18 });
  await page.mouse.up();
  const reasonDialog = page.getByRole('dialog');
  await reasonDialog.waitFor();
  await reasonDialog.locator('textarea[name="reason"]').fill('Routing to service for on-site inspection.');
  await reasonDialog.locator('select').selectOption({ index: 1 }); // first real staff option
  await reasonDialog.locator('button[type="submit"]').click();
  await page.waitForFunction(() => window.__transitions.length === 2);
  const assign = (await page.evaluate(() => window.__transitions))[1];
  assert.equal(assign.complaintId, 'cmp_cmp_board_003', 'the second ticket is committed');
  assert.equal(assign.payload.action, 'ASSIGN_INVESTIGATION', 'the reason-bearing action is committed');
  assert.equal(assign.payload.reason, 'Routing to service for on-site inspection.', 'the typed reason is carried to the server action');
  assert.equal(assign.payload.ownerId, 'usr_owner', 'the picked owner is carried to the server action');

  // Invariant: no out-of-scope transition (e.g. a raw IN_PROGRESS move of the
  // SUBMITTED ticket) was ever committed.
  const all = await page.evaluate(() => window.__transitions);
  assert.ok(!all.some((t) => t.complaintId === 'cmp_cmp_board_001' && t.payload.action !== 'ACCEPT_INTAKE'), 'the scoped ticket only ever commits its allowed transition');
} finally {
  await browser.close();
}
console.log('complaint board proof passed: illegal columns are inert, a legal drop commits ACCEPT_INTAKE, and a reason-bearing ASSIGN_INVESTIGATION carries reason + owner');

function column(page, heading) {
  // `li > section` is the column's droppable shell (aria-disabled + drop classes
  // live here); it excludes the outer board <section> that wraps every column.
  return page.locator('li > section', { has: page.getByRole('heading', { name: heading, exact: true }) });
}
