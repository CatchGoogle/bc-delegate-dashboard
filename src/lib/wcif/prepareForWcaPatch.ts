import type { Competition, Person } from '@wca/helpers';
import { pick } from 'lodash';
import {
  buildCustomRoleAssignmentsExtensionData,
  getPersonCustomRolesExtensionData,
} from './extensions/delegateDashboard/customRoles';

const isCustomRoleId = (roleId: string): boolean => roleId.startsWith('custom-');

/**
 * The WCA production API accepts WCIF patches for persons/assignments but rejects
 * custom role codes on person records. Competition-level delegateDashboard extensions
 * (customRoleDefinitions, customRoleAssignments) are persisted on the server.
 */
export function prepareWcifForWcaPatch(
  wcif: Competition,
  changedKeys: Set<keyof Competition>
): Partial<Competition> {
  const keys = new Set<keyof Competition>(['formatVersion', ...changedKeys]);
  let payload = pick(wcif, Array.from(keys)) as Partial<Competition>;

  if (!payload.persons) {
    return payload;
  }

  const prepared = preparePersonsForWcaPatch(payload.persons);

  payload = {
    ...payload,
    persons: prepared.persons,
    extensions: buildCustomRoleAssignmentsExtensionData(
      wcif.extensions ?? [],
      prepared.groupAssignments,
      prepared.rolesByRegistrantId
    ),
  };

  keys.add('extensions');

  return pick(payload, Array.from(keys)) as Partial<Competition>;
}

export function preparePersonsForWcaPatch(persons: Person[]): {
  persons: Person[];
  groupAssignments: Array<{ registrantId: number; activityId: number; roleId: string }>;
  rolesByRegistrantId: Record<number, string[]>;
} {
  const groupAssignments: Array<{ registrantId: number; activityId: number; roleId: string }> =
    [];
  const rolesByRegistrantId: Record<number, string[]> = {};

  const sanitizedPersons = persons.map((person) => {
    const customRolesForPerson = new Set<string>([
      ...(person.roles ?? []).filter(isCustomRoleId),
      ...getPersonCustomRolesExtensionData(person).roles,
    ]);

    (person.assignments ?? []).forEach((assignment) => {
      if (isCustomRoleId(assignment.assignmentCode)) {
        groupAssignments.push({
          registrantId: person.registrantId,
          activityId: assignment.activityId,
          roleId: assignment.assignmentCode,
        });
        customRolesForPerson.add(assignment.assignmentCode);
      }
    });

    if (customRolesForPerson.size > 0) {
      rolesByRegistrantId[person.registrantId] = Array.from(customRolesForPerson);
    }

    return {
      ...person,
      roles: (person.roles ?? []).filter((role) => !isCustomRoleId(role)),
      assignments: (person.assignments ?? []).filter(
        (assignment) => !isCustomRoleId(assignment.assignmentCode)
      ),
      extensions: [],
    };
  });

  return {
    persons: sanitizedPersons,
    groupAssignments,
    rolesByRegistrantId,
  };
}
