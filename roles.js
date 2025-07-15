// Role definitions and hierarchy
// Level: 0 = Main, 1 = Owner, 2 = Admin, 3 = Reseller

export const ROLES = {
  MAIN: {
    name: 'Main',
    level: 0,
    permissions: [
      'all', // Full access
      'private_dashboard',
      'manage_users',
      'manage_keys',
      'manage_roles',
      'assign_balance',
      'set_owner_balance',
      'view_all_hierarchies',
      'set_custom_server_link',
    ],
  },
  OWNER: {
    name: 'Owner',
    level: 1,
    permissions: [
      'dashboard',
      'manage_own_hierarchy',
      'create_admin',
      'create_reseller',
      'transfer_balance_no_deduct',
      'set_custom_server_link',
    ],
  },
  ADMIN: {
    name: 'Admin',
    level: 2,
    permissions: [
      'dashboard',
      'manage_own_hierarchy',
      'transfer_balance_with_deduct',
    ],
  },
  RESELLER: {
    name: 'Reseller',
    level: 3,
    permissions: [
      'dashboard',
      'manage_own_keys',
    ],
  },
};

export const ROLE_LABELS = {
  0: 'Main',
  1: 'Owner',
  2: 'Admin',
  3: 'Reseller',
};

// Helper to get role by level
export function getRoleByLevel(level) {
  return Object.values(ROLES).find(role => role.level === level);
}

// Helper to check if a user has a permission
export function hasPermission(user, permission) {
  const role = getRoleByLevel(user.level);
  if (!role) return false;
  if (role.permissions.includes('all')) return true;
  return role.permissions.includes(permission);
} 