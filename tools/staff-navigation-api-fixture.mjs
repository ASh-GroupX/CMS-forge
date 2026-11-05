import { createServer } from 'node:http';

export function navigationApiFixture() {
  const state = { created: null, notes: [] };
  const phoneField = { id: 'customer-phone', departmentId: 'dept-1', nameEn: 'Customer phone', nameAr: 'هاتف العميل', fieldType: 'TEXT', isRequired: true, isActive: true, phoneDuplicateCheck: true, options: [], order: 0 };
  const departments = [{ id: 'dept-1', nameEn: 'Service', nameAr: 'الصيانة', name: 'Service' }, { id: 'dept-2', nameEn: 'Sales', nameAr: 'المبيعات', name: 'Sales' }];
  const ticket = { id: 'existing', referenceNumber: 'TKT-100', title: 'Existing customer problem', description: 'Inspect this original problem before deciding.', status: 'IN_PROGRESS', priority: 'NORMAL', createdAt: '2026-11-05T08:00:00Z', updatedAt: '2026-11-05T08:00:00Z', requestedById: 'staff-1', targetDepartmentId: 'dept-1', assignedEmployeeId: 'staff-1',
    requestedBy: { id: 'staff-1', nameEn: 'Test Staff', departmentId: 'dept-1' }, assignedEmployee: { id: 'staff-1', nameEn: 'Test Staff' }, targetDepartment: { ...departments[0], ticketCustomFields: [phoneField] }, category: { id: 'category-1', nameEn: 'Customer problem' }, attachments: [], activities: [], customFields: { 'customer-phone': '+962790000000' }, dueAt: null };
  const options = { departments, categories: [{ id: 'category-1', nameEn: 'Customer problem' }], employees: [{ id: 'staff-1', departmentId: 'dept-1', nameEn: 'Test Staff' }], waitingReasons: [], resolutionReasons: [], rejectReasons: [] };
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    let body = '';
    for await (const chunk of req) body += chunk;
    const input = body ? JSON.parse(body) : {};
    const send = (value, status = 200) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(value)); };
    if (path === '/auth/me') {
      if (!req.headers.cookie?.includes('cms_staff_session=')) return send({}, 401);
      return send({ user: { sessionId: 'test-session', userId: 'staff-1', nameEn: 'Test Staff', nameAr: 'موظف تجريبي', roleCode: 'ADMIN', permissions: ['STAFF_LOGIN'], branchId: null, departmentId: 'dept-1', email: null, branchName: null, branchNameAr: null, branchTimezone: 'Asia/Amman' } });
    }
    if (path === '/auth/logout') return send({ success: true });
    if (path === '/notifications') return send({ items: [] });
    if (path === '/internal-tickets/options') return send(options);
    if (path.endsWith('/fields')) return send({ config: { enablePriorityField: true, enableDueDateField: true, enableAttachmentsField: true, enableOfficerSelection: true }, customFields: [phoneField] });
    if (path === '/internal-tickets/phone-duplicates') return send({ items: [{ id: ticket.id, referenceNumber: ticket.referenceNumber, title: ticket.title, status: ticket.status }] });
    if (path === '/internal-tickets/existing/notes' && req.method === 'POST') {
      state.notes.push({ id: `note-${state.notes.length}`, content: input.content, createdAt: new Date().toISOString(), author: { nameEn: 'Test Staff' }, attachments: [] });
      return send(state.notes.at(-1));
    }
    if (path === '/internal-tickets/existing') return send({ ...ticket, notes: state.notes });
    if (path === '/internal-tickets' && req.method === 'POST') { state.created = input; return send({ ...ticket, ...input, id: 'created-ticket' }, 201); }
    if (path.startsWith('/internal-tickets')) return send([]);
    if (path.endsWith('/tickets-records') || path.endsWith('/complaints-records')) {
      const rows = path.endsWith('/tickets-records') && url.searchParams.get('status') === 'IN_PROGRESS' ? [{ ...ticket, requestedByName: 'Test Staff', acceptedByName: 'Test Staff', assignedEmployeeName: 'Test Staff', creatingDepartmentName: 'Sales', targetDepartmentName: 'Service' }] : [];
      return send({ items: rows, total: rows.length });
    }
    if (path.includes('department') || path === '/branches') return send({ departments, items: departments, branches: [] });
    return send({}, 503);
  });
  return { server, state };
}
