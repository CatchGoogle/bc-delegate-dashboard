import { describe, expect, it } from 'vitest';
import { buildPerson } from '../../store/reducers/_tests_/helpers';
import { preparePersonsForWcaPatch } from './prepareForWcaPatch';

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
});
