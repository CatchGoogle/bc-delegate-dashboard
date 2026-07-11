import { describe, expect, it } from 'vitest';
import { buildWcif } from '../../store/reducers/_tests_/helpers';
import {
  buildCustomAssignmentDefinition,
  getAssignmentsForCompetition,
  getAssignmentsMapForCompetition,
  getCustomGroupAssignments,
  isGroupStaffAssignmentCode,
  staffingAssignmentToText,
} from './assignmentDefinitions';
import { setCustomRoleDefinitionsExtensionData } from '../wcif/extensions/delegateDashboard/customRoles';

describe('assignmentDefinitions', () => {
  it('includes custom per-group roles in assignment picker options', () => {
    const wcif = setCustomRoleDefinitionsExtensionData(buildWcif([], []), {
      roles: [
        {
          id: 'custom-commentator',
          name: 'Commentator',
          assignPerGroup: true,
          assignmentKey: 'm',
          assignmentLetter: 'CO',
        },
        {
          id: 'custom-photographer',
          name: 'Photographer',
          assignPerGroup: false,
        },
      ],
    });

    const customAssignments = getCustomGroupAssignments(wcif);
    expect(customAssignments).toHaveLength(1);
    expect(customAssignments[0]).toMatchObject({
      id: 'custom-commentator',
      name: 'Commentator',
      key: 'm',
      letter: 'CO',
      isCustom: true,
    });

    const allAssignments = getAssignmentsForCompetition(wcif);
    expect(allAssignments.some((assignment) => assignment.id === 'custom-commentator')).toBe(true);
    expect(allAssignments.some((assignment) => assignment.id === 'custom-photographer')).toBe(
      false
    );
  });

  it('builds assignment map entries for custom roles', () => {
    const role = buildCustomAssignmentDefinition(
      {
        id: 'custom-medical',
        name: 'Medical',
        assignPerGroup: true,
      },
      0
    );

    expect(role.id).toBe('custom-medical');
    expect(role.key).toBe('m');
    expect(role.letter).toBe('ME');
  });

  it('treats custom assignment codes as group staff assignments', () => {
    expect(isGroupStaffAssignmentCode('staff-judge')).toBe(true);
    expect(isGroupStaffAssignmentCode('custom-commentator')).toBe(true);
    expect(isGroupStaffAssignmentCode('competitor')).toBe(false);
  });

  it('formats custom staffing assignments for export', () => {
    const wcif = setCustomRoleDefinitionsExtensionData(buildWcif([], []), {
      roles: [
        {
          id: 'custom-commentator',
          name: 'Commentator',
          assignPerGroup: true,
          assignmentLetter: 'CO',
        },
      ],
    });

    expect(staffingAssignmentToText('custom-commentator', 3, wcif)).toBe('C3');
    expect(getAssignmentsMapForCompetition(wcif)['custom-commentator']?.letter).toBe('CO');
  });
});
