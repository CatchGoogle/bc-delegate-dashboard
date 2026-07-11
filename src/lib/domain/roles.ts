import type { Competition } from '@wca/helpers';
import {
  BUILT_IN_STAFF_ROLES,
  type StaffRoleOption,
} from '../../config/roles';
import {
  getCustomRoleDefinitionsExtensionData,
  getEffectivePersonRoles,
  personHasRole,
} from '../wcif/extensions/delegateDashboard/customRoles';
import type { CustomRoleDefinition } from '../wcif/extensions/delegateDashboard/types';
import type { Person } from '@wca/helpers';

export function getCustomRoleDefinitions(wcif: Competition): CustomRoleDefinition[] {
  return getCustomRoleDefinitionsExtensionData(wcif).roles;
}

export function getStaffPageRoles(wcif: Competition): StaffRoleOption[] {
  const customRoles = getCustomRoleDefinitions(wcif)
    .filter((role) => role.showOnStaffPage !== false)
    .map((role) => ({
      id: role.id,
      name: role.name,
      exportStrategy: role.exportStrategy,
    }));

  return [...BUILT_IN_STAFF_ROLES, ...customRoles];
}

export function getSelectableRoles(wcif: Competition): StaffRoleOption[] {
  const customRoles = getCustomRoleDefinitions(wcif).map((role) => ({
    id: role.id,
    name: role.name,
    exportStrategy: role.exportStrategy,
  }));

  return [...BUILT_IN_STAFF_ROLES, ...customRoles];
}

export function formatRolesForExport(
  person: Person,
  customRoleDefinitions: CustomRoleDefinition[]
): string {
  const effectiveRoles = getEffectivePersonRoles(person, customRoleDefinitions);
  const standardRoles = effectiveRoles.filter(
    (role) => !role.startsWith('staff-') && !role.startsWith('custom-')
  );
  const staffRoles = effectiveRoles.filter((role) => role.startsWith('staff-'));
  const customRoles = effectiveRoles.filter((role) => role.startsWith('custom-'));

  const roleLabels = [
    ...standardRoles,
    ...staffRoles.map((roleId) => {
      const builtIn = BUILT_IN_STAFF_ROLES.find((role) => role.id === roleId);
      return builtIn?.name ?? roleId;
    }),
    ...customRoles.map((roleId) => {
      const custom = customRoleDefinitions.find((role) => role.id === roleId);
      return custom?.name ?? roleId;
    }),
  ];

  return roleLabels.join(',');
}

export function countPersonsWithRole(
  persons: Person[],
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[]
): number {
  return persons.filter((person) => personHasRole(person, roleId, customRoleDefinitions)).length;
}
