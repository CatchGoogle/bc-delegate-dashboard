import { type Person, type Assignment } from '@wca/helpers';
import { useMemo } from 'react';

export interface PersonWithAssignment extends Person {
  assignedActivity: Assignment;
}

/**
 * Helper to filter persons by assignment code for a specific activity
 */
const withAssignmentCode =
  (activityId: number, assignmentCode: string) =>
  ({ assignedActivity }: PersonWithAssignment): boolean =>
    assignedActivity.activityId === activityId &&
    assignedActivity.assignmentCode.indexOf(assignmentCode) > -1;

const withExactAssignmentCode =
  (activityId: number, assignmentCode: string) =>
  ({ assignedActivity }: PersonWithAssignment): boolean =>
    assignedActivity.activityId === activityId &&
    assignedActivity.assignmentCode === assignmentCode;

/**
 * Hook to categorize persons by their assignment types for a specific activity
 * @param personsAssigned - Array of persons with their assigned activity
 * @param activityId - The activity ID to filter by
 * @returns Object with competitors, staff, judges, scramblers, runners, customRoles, and other
 */
export const usePersonsByAssignment = (
  personsAssigned: PersonWithAssignment[],
  activityId: number
) => {
  const competitors = useMemo(
    () => personsAssigned.filter(withAssignmentCode(activityId, 'competitor')),
    [personsAssigned, activityId]
  );

  const staff = useMemo(
    () =>
      personsAssigned.filter(
        ({ assignedActivity }) =>
          assignedActivity.activityId === activityId &&
          (assignedActivity.assignmentCode.startsWith('staff-') ||
            assignedActivity.assignmentCode.startsWith('custom-'))
      ),
    [personsAssigned, activityId]
  );

  const judges = useMemo(
    () => staff.filter(withExactAssignmentCode(activityId, 'staff-judge')),
    [staff, activityId]
  );

  const scramblers = useMemo(
    () => personsAssigned.filter(withExactAssignmentCode(activityId, 'staff-scrambler')),
    [personsAssigned, activityId]
  );

  const runners = useMemo(
    () => staff.filter(withExactAssignmentCode(activityId, 'staff-runner')),
    [staff, activityId]
  );

  const customRoles = useMemo(
    () =>
      staff.filter(
        ({ assignedActivity }) =>
          assignedActivity.activityId === activityId &&
          assignedActivity.assignmentCode.startsWith('custom-')
      ),
    [staff, activityId]
  );

  const other = useMemo(
    () =>
      staff.filter((p) =>
        p.assignments?.find(
          ({ activityId: aId, assignmentCode }) =>
            aId === activityId &&
            assignmentCode.startsWith('staff-') &&
            ['staff-judge', 'staff-scrambler', 'staff-runner'].indexOf(assignmentCode) === -1
        )
      ),
    [activityId, staff]
  );

  return {
    competitors,
    staff,
    judges,
    scramblers,
    runners,
    customRoles,
    other,
  };
};
