import { describe, expect, it } from 'vitest';
import { buildPerson } from '../../store/reducers/_tests_/helpers';
import { preparePersonsForWcaPatch, prepareWcifForWcaPatch } from './prepareForWcaPatch';

describe('prepareForWcaPatch', () => {
  it('moves custom roles out of person.roles and assignments for WCA PATCH', () => {
    const persons = [
      buildPerson({
        registrantId: 1,
        roles: ['organizer', 'custom-commentator'],
        assignments: [
          {
            activityId: 10,
            assignmentCode: 'custom-commentator',
            stationNumber: null,
          },
          {
            activityId: 11,
            assignmentCode: 'staff-judge',
            stationNumber: null,
          },
        ],
        extensions: [
          {
            id: 'delegateDashboard.customRoles',
            specUrl: 'https://example.com/customRoles.json',
            data: { roles: ['custom-medical'] },
          },
        ],
      }),
    ];

    const prepared = preparePersonsForWcaPatch(persons);

    expect(prepared.persons[0].roles).toEqual(['organizer']);
    expect(prepared.persons[0].assignments).toEqual([
      {
        activityId: 11,
        assignmentCode: 'staff-judge',
        stationNumber: null,
      },
    ]);
    expect(prepared.persons[0].extensions).toEqual([]);
    expect(prepared.groupAssignments).toEqual([
      {
        registrantId: 1,
        activityId: 10,
        roleId: 'custom-commentator',
      },
    ]);
    expect(prepared.rolesByRegistrantId[1].sort()).toEqual(
      ['custom-commentator', 'custom-medical'].sort()
    );
  });

  it('persists custom role assignments in competition extensions when persons change', () => {
    const person = buildPerson({
      registrantId: 2,
      roles: [],
      assignments: [
        {
          activityId: 1,
          assignmentCode: 'custom-commentator',
          stationNumber: null,
        },
      ],
    });
    const wcif = {
      formatVersion: '1.0',
      persons: [person],
      extensions: [
        {
          id: 'delegateDashboard.customRoleDefinitions',
          specUrl: 'https://example.com/customRoleDefinitions.json',
          data: {
            roles: [{ id: 'custom-commentator', name: 'Commentator', assignPerGroup: true }],
          },
        },
      ],
    } as Parameters<typeof prepareWcifForWcaPatch>[0];

    const payload = prepareWcifForWcaPatch(wcif, new Set(['persons']));

    expect(payload.persons?.[0].assignments).toEqual([]);
    expect(payload.extensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'delegateDashboard.customRoleDefinitions',
        }),
        expect.objectContaining({
          id: 'delegateDashboard.customRoleAssignments',
          data: {
            groupAssignments: [
              {
                registrantId: 2,
                activityId: 1,
                roleId: 'custom-commentator',
              },
            ],
            rolesByRegistrantId: {
              '2': ['custom-commentator'],
            },
          },
        }),
      ])
    );
  });

  it('passes through custom role definition extensions when only extensions changed', () => {
    const wcif = {
      formatVersion: '1.0',
      extensions: [
        {
          id: 'delegateDashboard.groups',
          specUrl: 'https://example.com/groups.json',
          data: { groups: 2 },
        },
        {
          id: 'delegateDashboard.customRoleDefinitions',
          specUrl: 'https://example.com/customRoleDefinitions.json',
          data: { roles: [{ id: 'custom-commentator', name: 'Commentator' }] },
        },
      ],
    } as Parameters<typeof prepareWcifForWcaPatch>[0];

    const payload = prepareWcifForWcaPatch(wcif, new Set(['extensions']));

    expect(payload.extensions).toEqual(wcif.extensions);
  });
});
