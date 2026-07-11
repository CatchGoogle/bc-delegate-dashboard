import type { Competition, Person } from '@wca/helpers';
import { DD_NAMESPACE } from './delegateDashboard';
import type {
  CustomRoleAssignmentRecord,
  CustomRoleAssignmentsExtensionData,
  CustomRoleDefinition,
  CustomRoleDefinitionsExtensionData,
  CustomRoleExportStrategy,
  PersonCustomRolesExtensionData,
} from './types';

const CUSTOM_ROLE_DEFINITIONS_EXTENSION = 'customRoleDefinitions';
const CUSTOM_ROLE_ASSIGNMENTS_EXTENSION = 'customRoleAssignments';
const PERSON_CUSTOM_ROLES_EXTENSION = 'customRoles';
const DD_SPEC_URL_BASE =
  'https://github.com/coder13/delegateDashboard/blob/main/public/wcif-extensions';

const DEFAULT_EXPORT_STRATEGY: CustomRoleExportStrategy = 'both';

function getExtensionId(extensionName: string): string {
  return `${DD_NAMESPACE}.${extensionName}`;
}

function buildExtension(extensionName: string, data: object) {
  return {
    id: getExtensionId(extensionName),
    specUrl: `${DD_SPEC_URL_BASE}/${extensionName}.json`,
    data,
  };
}

export function getCustomRoleDefinitionsExtensionData(
  wcif: Competition
): CustomRoleDefinitionsExtensionData {
  const extension = wcif.extensions?.find(
    (ext) => ext.id === getExtensionId(CUSTOM_ROLE_DEFINITIONS_EXTENSION)
  );

  if (!extension?.data || typeof extension.data !== 'object') {
    return { roles: [] };
  }

  const data = extension.data as Partial<CustomRoleDefinitionsExtensionData>;
  if (!Array.isArray(data.roles)) {
    return { roles: [] };
  }

  return {
    roles: data.roles.filter(
      (role): role is CustomRoleDefinition =>
        !!role &&
        typeof role === 'object' &&
        typeof role.id === 'string' &&
        typeof role.name === 'string'
    ),
  };
}

export function setCustomRoleDefinitionsExtensionData(
  wcif: Competition,
  data: CustomRoleDefinitionsExtensionData
): Competition {
  const extensionId = getExtensionId(CUSTOM_ROLE_DEFINITIONS_EXTENSION);
  const otherExtensions = (wcif.extensions ?? []).filter((ext) => ext.id !== extensionId);

  return {
    ...wcif,
    extensions: [...otherExtensions, buildExtension(CUSTOM_ROLE_DEFINITIONS_EXTENSION, data)],
  };
}

export function getPersonCustomRolesExtensionData(
  person: Person
): PersonCustomRolesExtensionData {
  const extension = person.extensions?.find(
    (ext) => ext.id === getExtensionId(PERSON_CUSTOM_ROLES_EXTENSION)
  );

  if (!extension?.data || typeof extension.data !== 'object') {
    return { roles: [] };
  }

  const data = extension.data as Partial<PersonCustomRolesExtensionData>;
  if (!Array.isArray(data.roles)) {
    return { roles: [] };
  }

  return {
    roles: data.roles.filter((role): role is string => typeof role === 'string'),
  };
}

export function setPersonCustomRolesExtensionData(
  person: Person,
  data: PersonCustomRolesExtensionData
): Person {
  const extensionId = getExtensionId(PERSON_CUSTOM_ROLES_EXTENSION);
  const otherExtensions = (person.extensions ?? []).filter((ext) => ext.id !== extensionId);

  if (data.roles.length === 0) {
    return {
      ...person,
      extensions: otherExtensions,
    };
  }

  return {
    ...person,
    extensions: [...otherExtensions, buildExtension(PERSON_CUSTOM_ROLES_EXTENSION, data)],
  };
}

export function getExportStrategyForRole(
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[]
): CustomRoleExportStrategy {
  const customRole = customRoleDefinitions.find((role) => role.id === roleId);
  return customRole?.exportStrategy ?? DEFAULT_EXPORT_STRATEGY;
}

export function shouldExportRoleToPersonRoles(
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[]
): boolean {
  const strategy = getExportStrategyForRole(roleId, customRoleDefinitions);
  return strategy === 'roles' || strategy === 'both';
}

export function shouldExportRoleToExtension(
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[]
): boolean {
  const strategy = getExportStrategyForRole(roleId, customRoleDefinitions);
  return strategy === 'extension' || strategy === 'both';
}

export function isCustomRoleDefinition(
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[]
): boolean {
  return customRoleDefinitions.some((role) => role.id === roleId);
}

export function applyRoleChangeToPerson(
  person: Person,
  roleId: string,
  enabled: boolean,
  customRoleDefinitions: CustomRoleDefinition[]
): Person {
  const currentRoles = person.roles ?? [];
  const extensionRoles = getPersonCustomRolesExtensionData(person).roles;

  const addToRoles = shouldExportRoleToPersonRoles(roleId, customRoleDefinitions);
  const addToExtension = shouldExportRoleToExtension(roleId, customRoleDefinitions);

  const nextRoles = addToRoles
    ? enabled
      ? currentRoles.includes(roleId)
        ? currentRoles
        : [...currentRoles, roleId]
      : currentRoles.filter((role) => role !== roleId)
    : currentRoles;

  const nextExtensionRoles = addToExtension
    ? enabled
      ? extensionRoles.includes(roleId)
        ? extensionRoles
        : [...extensionRoles, roleId]
      : extensionRoles.filter((role) => role !== roleId)
    : extensionRoles;

  return setPersonCustomRolesExtensionData(
    {
      ...person,
      roles: nextRoles,
    },
    { roles: nextExtensionRoles }
  );
}

export function getEffectivePersonRoles(
  person: Person,
  customRoleDefinitions: CustomRoleDefinition[] = []
): string[] {
  const rolesFromField = person.roles ?? [];
  const rolesFromExtension = getPersonCustomRolesExtensionData(person).roles;

  const extensionOnlyRoleIds = new Set(
    customRoleDefinitions
      .filter((role) => role.exportStrategy === 'extension')
      .map((role) => role.id)
  );

  const merged = new Set([...rolesFromField, ...rolesFromExtension]);

  extensionOnlyRoleIds.forEach((roleId) => {
    if (rolesFromExtension.includes(roleId)) {
      merged.add(roleId);
    } else {
      merged.delete(roleId);
    }
  });

  return Array.from(merged);
}

export function personHasRole(
  person: Person,
  roleId: string,
  customRoleDefinitions: CustomRoleDefinition[] = []
): boolean {
  return getEffectivePersonRoles(person, customRoleDefinitions).includes(roleId);
}

export function applyRolesToPerson(
  person: Person,
  roleIds: string[],
  customRoleDefinitions: CustomRoleDefinition[]
): Person {
  const managedRoleIds = new Set([
    ...customRoleDefinitions.map((role) => role.id),
    ...roleIds,
  ]);

  let updatedPerson = { ...person };

  managedRoleIds.forEach((roleId) => {
    updatedPerson = applyRoleChangeToPerson(
      updatedPerson,
      roleId,
      roleIds.includes(roleId),
      customRoleDefinitions
    );
  });

  return updatedPerson;
}

export function syncCustomRolesFromAssignments(
  person: Person,
  customRoleDefinitions: CustomRoleDefinition[]
): Person {
  const perGroupRoleIds = customRoleDefinitions
    .filter((role) => role.assignPerGroup)
    .map((role) => role.id);

  return perGroupRoleIds.reduce((updatedPerson, roleId) => {
    const hasAssignment =
      updatedPerson.assignments?.some((assignment) => assignment.assignmentCode === roleId) ??
      false;

    return applyRoleChangeToPerson(
      updatedPerson,
      roleId,
      hasAssignment,
      customRoleDefinitions
    );
  }, person);
}

export function getCustomRoleAssignmentsExtensionData(
  wcif: Competition
): CustomRoleAssignmentsExtensionData {
  const extension = wcif.extensions?.find(
    (ext) => ext.id === getExtensionId(CUSTOM_ROLE_ASSIGNMENTS_EXTENSION)
  );

  if (!extension?.data || typeof extension.data !== 'object') {
    return { groupAssignments: [], rolesByRegistrantId: {} };
  }

  const data = extension.data as Partial<CustomRoleAssignmentsExtensionData>;
  const groupAssignments = Array.isArray(data.groupAssignments)
    ? data.groupAssignments.filter(
        (record): record is CustomRoleAssignmentRecord =>
          !!record &&
          typeof record === 'object' &&
          typeof record.registrantId === 'number' &&
          typeof record.activityId === 'number' &&
          typeof record.roleId === 'string'
      )
    : [];

  const rolesByRegistrantId: Record<string, string[]> = {};
  if (data.rolesByRegistrantId && typeof data.rolesByRegistrantId === 'object') {
    Object.entries(data.rolesByRegistrantId).forEach(([registrantId, roles]) => {
      if (Array.isArray(roles)) {
        rolesByRegistrantId[registrantId] = roles.filter(
          (role): role is string => typeof role === 'string'
        );
      }
    });
  }

  return { groupAssignments, rolesByRegistrantId };
}

export function buildCustomRoleAssignmentsExtensionData(
  extensions: Competition['extensions'],
  groupAssignments: CustomRoleAssignmentRecord[],
  rolesByRegistrantId: Record<number, string[]>
): Competition['extensions'] {
  const existing = extensions ?? [];
  const extensionId = getExtensionId(CUSTOM_ROLE_ASSIGNMENTS_EXTENSION);
  const otherExtensions = existing.filter((ext) => ext.id !== extensionId);

  const hasGroupAssignments = groupAssignments.length > 0;
  const hasRoleAssignments = Object.keys(rolesByRegistrantId).length > 0;

  if (!hasGroupAssignments && !hasRoleAssignments) {
    return otherExtensions;
  }

  const rolesByRegistrantIdPayload = Object.fromEntries(
    Object.entries(rolesByRegistrantId).map(([registrantId, roles]) => [
      registrantId,
      roles,
    ])
  );

  return [
    ...otherExtensions,
    buildExtension(CUSTOM_ROLE_ASSIGNMENTS_EXTENSION, {
      groupAssignments,
      rolesByRegistrantId: rolesByRegistrantIdPayload,
    }),
  ];
}

export function migrateCustomRoleId(
  wcif: Competition,
  fromId: string,
  toId: string
): Competition {
  if (fromId === toId) {
    return wcif;
  }

  const replaceRoleId = (roleId: string) => (roleId === fromId ? toId : roleId);

  const persons = wcif.persons.map((person) => {
    let updated = { ...person };

    if (updated.roles?.some((role) => role === fromId)) {
      updated = {
        ...updated,
        roles: updated.roles!.map(replaceRoleId),
      };
    }

    if (updated.assignments?.some((assignment) => assignment.assignmentCode === fromId)) {
      updated = {
        ...updated,
        assignments: updated.assignments!.map((assignment) =>
          assignment.assignmentCode === fromId
            ? { ...assignment, assignmentCode: toId }
            : assignment
        ),
      };
    }

    const extensionRoles = getPersonCustomRolesExtensionData(updated).roles;
    if (extensionRoles.includes(fromId)) {
      updated = setPersonCustomRolesExtensionData(updated, {
        roles: extensionRoles.map(replaceRoleId),
      });
    }

    return updated;
  });

  const { groupAssignments, rolesByRegistrantId } = getCustomRoleAssignmentsExtensionData(wcif);

  const migratedGroupAssignments = groupAssignments.map((record) =>
    record.roleId === fromId ? { ...record, roleId: toId } : record
  );

  const migratedRolesByRegistrantId: Record<number, string[]> = {};
  Object.entries(rolesByRegistrantId).forEach(([registrantId, roles]) => {
    migratedRolesByRegistrantId[Number(registrantId)] = roles.map(replaceRoleId);
  });

  return {
    ...wcif,
    persons,
    extensions: buildCustomRoleAssignmentsExtensionData(
      wcif.extensions ?? [],
      migratedGroupAssignments,
      migratedRolesByRegistrantId
    ),
  };
}

export function applyCustomRoleAssignmentsToPersons(wcif: Competition): Competition {
  const customRoleDefinitions = getCustomRoleDefinitionsExtensionData(wcif).roles;
  const { groupAssignments, rolesByRegistrantId } = getCustomRoleAssignmentsExtensionData(wcif);

  const wcifWithAssignments =
    groupAssignments.length === 0 && Object.keys(rolesByRegistrantId).length === 0
      ? wcif
      : {
          ...wcif,
          persons: wcif.persons.map((person) => {
            const backupRoles = rolesByRegistrantId[String(person.registrantId)] ?? [];
            let updatedPerson = { ...person };

            backupRoles.forEach((roleId) => {
              updatedPerson = applyRoleChangeToPerson(
                updatedPerson,
                roleId,
                true,
                customRoleDefinitions
              );
            });

            const backupAssignments = groupAssignments.filter(
              (record) => record.registrantId === person.registrantId
            );

            if (backupAssignments.length === 0) {
              return updatedPerson;
            }

            const otherAssignments = (updatedPerson.assignments ?? []).filter(
              (assignment) =>
                !backupAssignments.some((record) => record.activityId === assignment.activityId)
            );

            updatedPerson = {
              ...updatedPerson,
              assignments: [
                ...otherAssignments,
                ...backupAssignments.map((record) => ({
                  activityId: record.activityId,
                  assignmentCode: record.roleId,
                  stationNumber: null,
                })),
              ],
            };

            return syncCustomRolesFromAssignments(updatedPerson, customRoleDefinitions);
          }),
        };

  return mergeExtensionRolesIntoPersons(wcifWithAssignments);
}

export function mergeExtensionRolesIntoPersons(wcif: Competition): Competition {
  const customRoleDefinitions = getCustomRoleDefinitionsExtensionData(wcif).roles;

  return {
    ...wcif,
    persons: wcif.persons.map((person) => {
      const effectiveRoles = getEffectivePersonRoles(person, customRoleDefinitions);
      const extensionRoles = getPersonCustomRolesExtensionData(person).roles;

      const rolesForField = effectiveRoles.filter((roleId) =>
        shouldExportRoleToPersonRoles(roleId, customRoleDefinitions)
      );

      const rolesForExtension = effectiveRoles.filter((roleId) =>
        shouldExportRoleToExtension(roleId, customRoleDefinitions)
      );

      return setPersonCustomRolesExtensionData(
        {
          ...person,
          roles: rolesForField,
        },
        { roles: [...new Set([...extensionRoles, ...rolesForExtension])] }
      );
    }),
  };
}
