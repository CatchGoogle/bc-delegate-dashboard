import { describe, expect, it } from 'vitest';
import { buildPerson, buildWcif } from '../../../../store/reducers/_tests_/helpers';
import {
  applyRoleChangeToPerson,
  getEffectivePersonRoles,
  getCustomRoleAssignmentsExtensionData,
  getPersonCustomRolesExtensionData,
  mergeExtensionRolesIntoPersons,
  migrateCustomRoleId,
  personHasRole,
  setCustomRoleDefinitionsExtensionData,
  syncCustomRolesFromAssignments,
} from './customRoles';

describe('customRoles extension helpers', () => {
  const customRoleDefinitions = [
    {
      id: 'custom-photographer',
      name: 'Photographer',
      exportStrategy: 'extension' as const,
    },
    {
      id: 'custom-emcee',
      name: 'Emcee',
      exportStrategy: 'both' as const,
    },
    {
      id: 'custom-announcer',
      name: 'Announcer',
      exportStrategy: 'roles' as const,
    },
  ];

  it('stores extension-only roles in person.extensions', () => {
    const person = buildPerson({ roles: [] });
    const updated = applyRoleChangeToPerson(
      person,
      'custom-photographer',
      true,
      customRoleDefinitions
    );

    expect(updated.roles).toEqual([]);
    expect(getPersonCustomRolesExtensionData(updated).roles).toEqual(['custom-photographer']);
    expect(personHasRole(updated, 'custom-photographer', customRoleDefinitions)).toBe(true);
  });

  it('stores both-strategy roles in person.roles and extensions', () => {
    const person = buildPerson({ roles: [] });
    const updated = applyRoleChangeToPerson(person, 'custom-emcee', true, customRoleDefinitions);

    expect(updated.roles).toEqual(['custom-emcee']);
    expect(getPersonCustomRolesExtensionData(updated).roles).toEqual(['custom-emcee']);
  });

  it('stores roles-strategy roles only in person.roles', () => {
    const person = buildPerson({ roles: [] });
    const updated = applyRoleChangeToPerson(
      person,
      'custom-announcer',
      true,
      customRoleDefinitions
    );

    expect(updated.roles).toEqual(['custom-announcer']);
    expect(getPersonCustomRolesExtensionData(updated).roles).toEqual([]);
  });

  it('merges effective roles from both sources', () => {
    const person = buildPerson({
      roles: ['custom-announcer', 'organizer'],
      extensions: [
        {
          id: 'delegateDashboard.customRoles',
          specUrl: 'https://example.com/customRoles.json',
          data: { roles: ['custom-photographer'] },
        },
      ],
    });

    expect(getEffectivePersonRoles(person, customRoleDefinitions).sort()).toEqual(
      ['custom-announcer', 'custom-photographer', 'organizer'].sort()
    );
  });

  it('normalizes persons when loading WCIF', () => {
    const wcif = setCustomRoleDefinitionsExtensionData(
      buildWcif([], []),
      {
        roles: customRoleDefinitions,
      }
    );

    wcif.persons = [
      buildPerson({
        roles: ['custom-emcee'],
        extensions: [
          {
            id: 'delegateDashboard.customRoles',
            specUrl: 'https://example.com/customRoles.json',
            data: { roles: ['custom-photographer'] },
          },
        ],
      }),
    ];

    const merged = mergeExtensionRolesIntoPersons(wcif);
    const person = merged.persons[0];

    expect(person.roles).toEqual(['custom-emcee']);
    expect(getPersonCustomRolesExtensionData(person).roles.sort()).toEqual(
      ['custom-emcee', 'custom-photographer'].sort()
    );
  });

  it('syncs per-group custom roles from assignments', () => {
    const customRoleDefinitions = [
      {
        id: 'custom-commentator',
        name: 'Commentator',
        assignPerGroup: true,
        exportStrategy: 'both' as const,
      },
    ];

    const person = buildPerson({
      roles: [],
      assignments: [
        {
          activityId: 11,
          assignmentCode: 'custom-commentator',
          stationNumber: null,
        },
      ],
    });

    const synced = syncCustomRolesFromAssignments(person, customRoleDefinitions);

    expect(synced.roles).toEqual(['custom-commentator']);
    expect(getPersonCustomRolesExtensionData(synced).roles).toEqual(['custom-commentator']);
  });

  it('removes per-group custom roles when no assignments remain', () => {
    const customRoleDefinitions = [
      {
        id: 'custom-commentator',
        name: 'Commentator',
        assignPerGroup: true,
        exportStrategy: 'both' as const,
      },
    ];

    const person = buildPerson({
      roles: ['custom-commentator'],
      extensions: [
        {
          id: 'delegateDashboard.customRoles',
          specUrl: 'https://example.com/customRoles.json',
          data: { roles: ['custom-commentator'] },
        },
      ],
      assignments: [],
    });

    const synced = syncCustomRolesFromAssignments(person, customRoleDefinitions);

    expect(synced.roles).toEqual([]);
    expect(getPersonCustomRolesExtensionData(synced).roles).toEqual([]);
  });

  it('migrates custom role IDs across persons and assignment backup data', () => {
    const person = buildPerson({
      registrantId: 42,
      roles: ['custom-comentator'],
      assignments: [{ activityId: 101, assignmentCode: 'custom-comentator', stationNumber: null }],
      extensions: [
        {
          id: 'delegateDashboard.customRoles',
          specUrl: 'https://example.com/customRoles.json',
          data: { roles: ['custom-comentator'] },
        },
      ],
    });

    let wcif = buildWcif([], [person]);
    wcif = {
      ...wcif,
      extensions: [
        {
          id: 'delegateDashboard.customRoleAssignments',
          specUrl: 'https://example.com/customRoleAssignments.json',
          data: {
            groupAssignments: [{ registrantId: 42, activityId: 101, roleId: 'custom-comentator' }],
            rolesByRegistrantId: { '42': ['custom-comentator'] },
          },
        },
      ],
    };

    const migrated = migrateCustomRoleId(wcif, 'custom-comentator', 'custom-commentator');
    const migratedPerson = migrated.persons[0];

    expect(migratedPerson.roles).toEqual(['custom-commentator']);
    expect(migratedPerson.assignments?.[0].assignmentCode).toBe('custom-commentator');
    expect(getPersonCustomRolesExtensionData(migratedPerson).roles).toEqual(['custom-commentator']);

    const backup = getCustomRoleAssignmentsExtensionData(migrated);
    expect(backup.groupAssignments[0].roleId).toBe('custom-commentator');
    expect(backup.rolesByRegistrantId['42']).toEqual(['custom-commentator']);
  });
});
