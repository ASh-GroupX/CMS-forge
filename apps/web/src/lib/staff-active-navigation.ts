export function isActiveNav(key: string, href: string, activePath: string): boolean {
  if (!activePath) return false;
  if (key === 'operations') return activePath === '/operations' || activePath.startsWith('/operations/');
  if (key === 'complaints') return activePath === '/complaints' || activePath.startsWith('/complaints/') && activePath !== '/complaints/new';
  return activePath === href || activePath.startsWith(`${href}/`);
}
