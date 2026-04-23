export const roleLabels = {
  owner: 'مالك',
  manager: 'مدير',
  validator: 'محقق',
  viewer: 'مشاهد',
};

const validRoles = new Set(['owner', 'manager', 'validator', 'viewer']);
const legacyOwnerRoles = new Set(['admin', 'super_admin', 'superadmin', 'administrator']);

export const normalizeAdminRole = (role) => {
  if (!role || typeof role !== 'string') return 'owner';

  const normalized = role.trim().toLowerCase();
  if (validRoles.has(normalized)) return normalized;
  if (legacyOwnerRoles.has(normalized)) return 'owner';

  // Existing admin sessions may contain stale role values after the role migration.
  return 'owner';
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

export const can = (role, permission) => {
  const normalizedRole = normalizeAdminRole(role);
  return (permissions[permission] || []).includes(normalizedRole);
};

export const canAccessPath = (role, path) => {
  const normalizedRole = normalizeAdminRole(role);

  if (path.includes('/error-logs')) return can(normalizedRole, 'admin:error_logs');
  if (path.includes('/settings')) return can(normalizedRole, 'admin:settings') || can(normalizedRole, 'admin:invite');
  if (path.includes('/activity') || path.includes('/team-performance')) return can(normalizedRole, 'activity:read');
  if (path.includes('/receipts')) return can(normalizedRole, 'admin:read');
  if (path.includes('/verification')) return can(normalizedRole, 'verification:write');
  return can(normalizedRole, 'admin:read');
};
