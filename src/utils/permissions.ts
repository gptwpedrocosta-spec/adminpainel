export type UserRole = 'super_admin' | 'admin' | 'support';

export type AppFeature = 
  | 'dashboard' 
  | 'users' 
  | 'drivers' 
  | 'rides' 
  | 'deliveries' 
  | 'financial' 
  | 'map' 
  | 'notifications'
  | 'settings'
  | 'registrations'
  | 'security'
  | 'audit_logs'
  | 'backup_security'
  | 'actions.approve_driver'   // approve/reject drivers
  | 'actions.block_user'       // block/unblock users
  | 'actions.send_notification' // trigger PUSH alarms
  | 'actions.simulate_ride';   // launch simulated test rides

/**
 * Validates if a user is authorized to access/perform a specific application feature.
 * @param admin The admin profile object of the currently logged-in administrator or their role string.
 * @param feature The target system section or functional capability.
 */
export function canAccess(admin: any, feature: AppFeature): boolean {
  if (!admin) return false;

  const role = typeof admin === 'string' ? admin : admin.role;
  if (!role) return false;

  // super_admin has total access
  if (role === 'super_admin') return true;

  // admin has general access
  if (role === 'admin') {
    return true;
  }

  // support has limited access
  if (role === 'support') {
    switch (feature) {
      case 'financial':
      case 'notifications':
      case 'settings':
      case 'registrations':
      case 'audit_logs':
      case 'backup_security':
      case 'actions.send_notification':
      case 'actions.simulate_ride':
        return false; // support cannot access finance, send notification, system settings, registrations, audit logs, backups or simulations
      default:
        return true; // support can access dashboard, users, drivers, rides, deliveries, map, security
    }
  }

  return false;
}
