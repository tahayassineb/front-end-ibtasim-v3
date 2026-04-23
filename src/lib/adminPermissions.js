export const roleLabels = {
  owner: 'مالك',
  manager: 'مدير',
  validator: 'محقق',
  viewer: 'مشاهد',
};

const permissions = {
  'admin:read': ['owner', 'manager', 'validator', 'viewer'],
  'admin:manage_team': ['owner'],
  'admin:invite': ['owner', 'manager'],
  'admin:settings': ['owner'],
  'admin:error_logs': ['owner'],
  'content:write': ['owner', 'manager'],
  'verification:write': ['owner', 'manager', 'validator'],
  'receipts:export': ['owner', 'manager'],
  'activity:read': ['owner', 'manager'],
};

export const can = (role, permission) => (permissions[permission] || []).includes(role || 'owner');

export const canAccessPath = (role, path) => {
  if (path.includes('/error-logs')) return can(role, 'admin:error_logs');
  if (path.includes('/settings')) return can(role, 'admin:settings') || can(role, 'admin:invite');
  if (path.includes('/activity') || path.includes('/team-performance')) return can(role, 'activity:read');
  if (path.includes('/receipts')) return can(role, 'admin:read');
  if (path.includes('/verification')) return can(role, 'verification:write');
  return can(role, 'admin:read');
};

