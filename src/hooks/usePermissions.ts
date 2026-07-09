import { useAuth } from '../contexts/AuthContext';
import { canAccess, AppFeature, UserRole } from '../utils/permissions';

export function usePermissions() {
  const { admin } = useAuth();
  
  const role = admin?.role as UserRole | undefined;

  const hasAccess = (feature: AppFeature) => {
    return canAccess(admin, feature);
  };

  return {
    role,
    admin,
    hasAccess,
    canAccess: hasAccess, // alias
  };
}
export type { AppFeature, UserRole };
