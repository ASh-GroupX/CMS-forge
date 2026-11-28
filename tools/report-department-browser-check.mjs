import assert from 'node:assert/strict';
import { reportDetailText } from '../apps/web/src/i18n/report-detail-workspace.ts';
import { reportsAnalyticsI18n } from '../apps/web/src/i18n/staff-reports-analytics.ts';
import { reportWorkspaceText } from '../apps/web/src/i18n/report-workspace.ts';

export async function checkDepartmentWorkspace(browser, base, output, locale) {
  const copy = reportDetailText[locale], filters = reportsAnalyticsI18n[locale].filterBar, views = reportWorkspaceText[locale].views;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const requests = [], errors = [];
  let fail = false;
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/reports/*', async route => {
    const url = new URL(route.request().url()); requests.push(url);
    if (url.pathname.includes('department')) return route.fulfill({ json: [{ departmentId: 'service', nameEn: 'Service', nameAr: 'الصيانة', ticketsTargeted: 31, ticketsOpen: 20, ticketsResolved: 11, ticketsOverdue: 3, complaintsTotal: 7, complaintsOpen: 5, complaintsResolved: 2, complaintsOverdue: 1 }] });
    const ticket = url.pathname.includes('tickets');
    if (url.pathname.includes('analytics')) return route.fulfill({ json: {
      kpis: { totalCreated: ticket ? 31 : 7, openWorkload: ticket ? 20 : 5, inProgress: 2, waiting: 0, resolved: 2, closed: 0, overdue: 1, unassigned: 1, deltas: {} },
      timeline: [], statusBreakdown: [], agingBuckets: [], officers: [{ employeeId: 'owner', officerId: 'owner', nameEn: 'Amina', nameAr: 'أمينة', activeWorkload: ticket ? 20 : 5, resolved: ticket ? 11 : 2, overdue: ticket ? 3 : 1 }],
    } });
    if (fail) return route.fulfill({ status: 500, json: {} });
    const status = url.searchParams.get('status') || 'IN_PROGRESS';
    const total = status === 'IN_PROGRESS' ? ticket ? 31 : 7 : 0;
    const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 25);
    return route.fulfill({ json: { total, items: Array.from({ length: Math.max(0, Math.min(limit, total-offset)) }, (_, i) => ({
      id: (ticket ? 'T' : 'C') + (offset+i), referenceNumber: (ticket ? 'T' : 'C') + (offset+i), status,
      title: 'Repair inspection and follow-up', subject: 'Customer follow-up', priority: 'HIGH', severity: 'HIGH', createdAt: '2026-11-01T08:00:00Z',
      requestedByName: 'Requester', customerName: 'Customer', customerPhone: '000', assignedEmployeeName: 'Amina', ownerName: 'Amina',
      targetDepartmentName: 'Service', departmentName: 'Service', creatingDepartmentName: 'Reception',
    })) } });
  });
  await page.goto(base + '/?locale=' + locale);
  await page.getByRole('tab', { name: views.departments, exact: true }).click();
  const dept = locale === 'en' ? 'Service' : 'الصيانة', officer = locale === 'en' ? 'Amina' : 'أمينة';
  const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: copy.expand + ' · ' + dept, exact: true }) });
  await row.waitFor();
  assert.equal(await page.getByRole('heading', { name: copy.officers, exact: true }).count(), 1);
  assert.deepEqual((await row.getByRole('cell').allTextContents()).slice(1,5), ['38','25','13','4']);
  await page.getByRole('button', { name: filters.internalOnly, exact: true }).click();
  await page.waitForFunction(() => document.querySelector('tbody tr td:nth-child(2)')?.textContent === '31');
  assert.deepEqual((await row.getByRole('cell').allTextContents()).slice(1,5), ['31','20','11','3']);
  await page.getByRole('button', { name: copy.expand + ' · ' + dept, exact: true }).click();
  const section = page.getByRole('region', { name: `${copy.receiving} · ${dept} · ${copy.tickets}`, exact: true });
  await section.getByRole('link', { name: 'T0', exact: true }).waitFor();
  assert.equal(await page.getByRole('tab', { selected: true }).textContent(), views.departments);
  assert.equal(await page.getByRole('button', { name: copy.collapse + ' · ' + dept }).getAttribute('aria-expanded'), 'true');
  assert.ok(requests.some(url => url.pathname.includes('tickets-records') && url.searchParams.get('targetDepartmentId') === 'service'));
  assert.equal(requests.filter(url => url.pathname.includes('complaints-records')).length, 0);
  await section.getByRole('button', { name: copy.next, exact: true }).click();
  await section.getByRole('link', { name: 'T30', exact: true }).waitFor();
  assert.ok(requests.some(url => url.searchParams.get('offset') === '25'));
  await section.getByRole('button', { name: copy.columns, exact: true }).click();
  await section.getByRole('checkbox', { name: copy.labels.due, exact: true }).uncheck();
  await section.getByRole('checkbox', { name: copy.labels.creator, exact: true }).check();
  await section.getByRole('button', { name: copy.save, exact: true }).click();
  await section.getByText(copy.saved, { exact: true }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: copy.expand + ' · ' + dept, exact: true }).click();
  await section.getByRole('link', { name: 'T0', exact: true }).waitFor();
  assert.equal(await section.getByRole('columnheader', { name: copy.labels.due, exact: true }).count(), 0);
  assert.equal(await section.getByRole('columnheader', { name: copy.labels.creator, exact: true }).count(), 1);
  await page.screenshot({ path: `${output}/${locale}-department-details.png`, fullPage: true });
  await page.getByRole('button', { name: filters.crmOnly, exact: true }).click();
  await page.getByRole('link', { name: 'C0', exact: true }).waitFor();
  await page.getByRole('button', { name: copy.expand + ' · ' + officer, exact: true }).click();
  const officerSection = page.getByRole('region', { name: `${copy.owner} · ${officer} · ${copy.complaints}`, exact: true });
  await officerSection.getByRole('link', { name: 'C0', exact: true }).waitFor();
  assert.ok(requests.some(url => url.pathname.includes('complaints-records') && url.searchParams.get('ownerId') === 'owner'));
  const officerRow = page.getByRole('row').filter({ has: page.getByRole('button', { name: copy.collapse + ' · ' + officer, exact: true }) });
  assert.deepEqual((await officerRow.getByRole('cell').allTextContents()).slice(1,4), ['5','2','1']);
  // Error and retry must remain in place, never show stale success.
  await page.getByRole('button', { name: copy.collapse + ' · ' + officer, exact: true }).click();
  fail = true;
  await page.getByRole('button', { name: copy.expand + ' · ' + officer, exact: true }).click();
  await officerSection.getByRole('alert').waitFor();
  fail = false;
  await officerSection.getByRole('button', { name: copy.retry, exact: true }).click();
  await officerSection.getByRole('link', { name: 'C0', exact: true }).waitFor();
  await page.getByRole('button', { name: filters.allTypes, exact: true }).click();
  await page.getByRole('tab', { name: views.records, exact: true }).click();
  await page.getByRole('link', { name: 'T0', exact: true }).waitFor();
  const grid = page.locator('[role="region"].grid');
  const boxes = await grid.locator(':scope > section').evaluateAll(nodes => nodes.map(node => { const r=node.getBoundingClientRect();return { x:r.x,y:r.y }; }));
  assert.equal(boxes.length, 8);
  assert.equal(new Set(boxes.map(b=>b.x)).size, 4);
  assert.equal(new Set(boxes.map(b=>b.y)).size, 2);
  const state = grid.locator(':scope > section').filter({ has: page.getByRole('link', { name: 'T0', exact: true }) }).getByRole('region');
  assert.ok(await state.evaluate(node => node.scrollHeight > node.clientHeight));
  await state.evaluate(node => { node.scrollTop=200; });
  assert.equal(await state.evaluate(node=>node.scrollTop),200);
  assert.equal(await grid.locator(':scope > section').first().getByRole('region').evaluate(node=>node.scrollTop),0);
  await page.screenshot({ path: `${output}/${locale}-records-grid.png`, fullPage: true });
  await page.getByRole('navigation', { name: copy.statusPages }).getByRole('button', { name: copy.next }).click();
  assert.equal(await grid.locator(':scope > section').count(), 6);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('tab', { name: views.departments, exact: true }).click();
  await page.getByRole('button', { name: copy.expand + ' · ' + dept, exact: true }).click();
  await page.getByRole('link', { name: 'T0', exact: true }).waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+2));
  await page.screenshot({ path: `${output}/${locale}-department-mobile.png`, fullPage: true });
  assert.deepEqual(errors, []);
  await page.close();
}
