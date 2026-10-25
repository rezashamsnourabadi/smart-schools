import { UserRole, VicePrincipalPermissions } from '../types';

export function canManageSchoolAction(
  role: UserRole,
  permissions: VicePrincipalPermissions,
  permission: keyof VicePrincipalPermissions
): boolean {
  return role === 'principal' || (role === 'vice_principal' && permissions[permission] === true);
}
