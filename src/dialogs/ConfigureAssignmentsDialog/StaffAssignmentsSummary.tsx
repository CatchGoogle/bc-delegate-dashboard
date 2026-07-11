import { getAssignmentsMapForCompetition } from '../../lib/domain/assignmentDefinitions';
import { useAppSelector } from '../../store';
import { memo } from 'react';

interface StaffAssignmentsSummaryProps {
  totalStaffAssignments: Record<string, number>;
}

const StaffAssignmentsSummary = memo(({ totalStaffAssignments }: StaffAssignmentsSummaryProps) => {
  const wcif = useAppSelector((state) => state.wcif);
  const assignmentsMap = getAssignmentsMapForCompetition(wcif);

  return (
    <>
      {Object.keys(totalStaffAssignments)
        .filter((key) => assignmentsMap[key])
        .sort((a, b) => a.localeCompare(b))
        .map((key, index, arry) => {
          const assignment = assignmentsMap[key];
          if (!assignment) return '';

          return (
            <div
              key={key}
              style={{
                marginRight: '0.25em',
                display: 'inline',
              }}>
              <b>{totalStaffAssignments[key]}</b>
              {assignment.letter}
              {index < arry.length - 1 ? ', ' : ''}
            </div>
          );
        })}
    </>
  );
});

StaffAssignmentsSummary.displayName = 'StaffAssignmentsSummary';

export default StaffAssignmentsSummary;
