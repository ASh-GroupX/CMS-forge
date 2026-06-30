export type ReportDeliveryStatus = 'DELIVERED' | 'DEFERRED';
export type ReportMvpScope = 'YES' | 'SHOULD';

export type ReportCatalogItem = {
  id: string;
  name: string;
  users: string;
  mvp: ReportMvpScope;
  requiredFilters: string[];
  requiredOutputs: string[];
  status: ReportDeliveryStatus;
  implemented: string[];
  deferred: string[];
  signoffRequired: boolean;
};

export type ReportCatalogSummary = {
  total: number;
  delivered: number;
  deferred: number;
  signoffRequired: number;
};

export type ReportCatalogResponse = {
  items: ReportCatalogItem[];
  summary: ReportCatalogSummary;
};

const REPORT_CATALOG: readonly ReportCatalogItem[] = [
  delivered('RPT-001', 'Open complaints summary', 'Managers, Management', 'YES', ['date', 'branch', 'department', 'category', 'severity', 'owner'], ['count', 'aging', 'SLA status'], ['Dashboard summary, generic report rows, scoped filters, and KPI aging buckets are implemented.']),
  deferred('RPT-002', 'Overdue complaints', 'Managers, Management', 'YES', ['branch', 'department', 'owner', 'severity', 'SLA stage'], ['complaint list', 'overdue duration', 'current owner'], ['Dashboard overdue count and filtered operational rows exist.'], ['Specialized overdue list with overdue duration, SLA stage filter, and current-owner output needs signed scope.']),
  deferred('RPT-003', 'SLA warning complaints', 'Managers, CR team', 'YES', ['branch', 'owner', 'severity'], ['complaint list', 'percent elapsed', 'deadline'], ['Dashboard SLA warning count exists.'], ['Specialized warning list with percent elapsed and deadline output needs signed scope.']),
  delivered('RPT-004', 'Average TAT', 'Management', 'YES', ['date', 'branch', 'department', 'category', 'severity'], ['average closure time', 'median closure time'], ['Average and median TAT are derived from closure/status-history timestamps.']),
  deferred('RPT-005', 'Closure performance by branch', 'Management', 'YES', ['date', 'branch'], ['created', 'closed', 'overdue', 'breach rate', 'avg TAT'], ['Branch filtering plus closed, overdue, breach-rate, and TAT formulas exist.'], ['Branch-grouped performance output needs signed scope.']),
  deferred('RPT-006', 'Complaints by category', 'Management, CR Manager', 'YES', ['date', 'branch', 'department', 'severity'], ['count', 'percentage', 'trend'], ['Category filtering exists on operational report rows.'], ['Category-grouped percentages and trend output need signed scope.']),
  deferred('RPT-007', 'Complaints by brand/model', 'Management', 'YES', ['date', 'brand', 'model', 'branch', 'department'], ['count', 'rate if denominator exists', 'trend'], ['Vehicle provenance and DMS lookup foundations exist.'], ['Brand/model report output and denominator policy need signed scope.']),
  deferred('RPT-008', 'Complaints by department', 'Management', 'YES', ['date', 'branch', 'department'], ['count', 'open', 'closed', 'overdue', 'avg TAT'], ['Department filtering exists on operational report rows.'], ['Department-grouped counts and TAT output need signed scope.']),
  deferred('RPT-009', 'Owner workload', 'CR Manager, Branch Manager', 'YES', ['branch', 'department', 'owner', 'status'], ['assigned', 'overdue', 'closed', 'avg handling time'], ['Owner filtering exists on operational report rows.'], ['Owner workload aggregation needs signed scope.']),
  deferred('RPT-010', 'Reopened complaints', 'Management, CR Manager', 'YES', ['date', 'branch', 'category', 'owner'], ['count', 'reopen rate', 'reason list'], ['Reopen count and reopen-rate KPI formulas are implemented.'], ['Reason-list output needs signed scope.']),
  deferred('RPT-011', 'Rejected complaints', 'CR Manager', 'YES', ['date', 'branch', 'rejection reason'], ['count', 'list', 'reason summary'], ['Rejected complaints are available as complaint statuses in scoped rows.'], ['Rejected report count/list/reason summary needs signed scope.']),
  deferred('RPT-012', 'Customer satisfaction', 'Management', 'YES', ['date', 'branch', 'department', 'category'], ['CSAT average', 'response count', 'comments'], ['Survey scheduling and portal survey surfaces exist.'], ['CSAT reporting output needs signed scope.']),
  delivered('RPT-013', 'Aging report', 'Management, Managers', 'YES', ['branch', 'owner', 'severity'], ['0-1 day bucket', '2-3 days bucket', '4-7 days bucket', '7+ days bucket'], ['Aging buckets are implemented in the KPI response for non-terminal complaints.']),
  deferred('RPT-014', 'Compensation tracking', 'Authorized managers', 'SHOULD', ['date', 'branch', 'category', 'amount/status'], ['proposed count/value', 'approved count/value'], [], ['Compensation report remains should-scope and needs signed MVP scope.']),
  deferred('RPT-015', 'DMS lookup failure report', 'Admin, IT', 'YES', ['date', 'provider result'], ['failures', 'latency', 'not-found count'], ['Read-only DMS lookup API exposes safe lookup result states for staff.'], ['Persisted DMS lookup telemetry/reporting needs signed scope; no live provider or writeback is added.']),
  deferred('RPT-016', 'Notification delivery report', 'Admin, CR Manager', 'YES', ['date', 'channel', 'event', 'status'], ['sent', 'failed', 'pending', 'provider result'], ['Notification queue, templates, and dispatch tests exist.'], ['Notification delivery aggregate report needs signed scope.']),
  delivered('RPT-017', 'Audit activity report', 'Admin', 'YES', ['actor', 'action', 'date', 'target'], ['audit entries', 'export'], ['Audit search/export module and guarded audit viewer are implemented.']),
];

export function reportCatalogResponse(): ReportCatalogResponse {
  const items = REPORT_CATALOG.map((item) => ({
    ...item,
    requiredFilters: [...item.requiredFilters],
    requiredOutputs: [...item.requiredOutputs],
    implemented: [...item.implemented],
    deferred: [...item.deferred],
  }));
  return {
    items,
    summary: {
      total: items.length,
      delivered: items.filter((item) => item.status === 'DELIVERED').length,
      deferred: items.filter((item) => item.status === 'DEFERRED').length,
      signoffRequired: items.filter((item) => item.signoffRequired).length,
    },
  };
}

function delivered(id: string, name: string, users: string, mvp: ReportMvpScope, requiredFilters: string[], requiredOutputs: string[], implemented: string[]): ReportCatalogItem {
  return { id, name, users, mvp, requiredFilters, requiredOutputs, status: 'DELIVERED', implemented, deferred: [], signoffRequired: false };
}

function deferred(id: string, name: string, users: string, mvp: ReportMvpScope, requiredFilters: string[], requiredOutputs: string[], implemented: string[], deferredScope: string[]): ReportCatalogItem {
  return { id, name, users, mvp, requiredFilters, requiredOutputs, status: 'DEFERRED', implemented, deferred: deferredScope, signoffRequired: true };
}