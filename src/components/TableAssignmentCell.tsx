// Shows a Table Cell for configuring an assignment
import { getAssignmentsMapForCompetition } from '../lib/domain/assignmentDefinitions';
import { useAppSelector } from '../store';
import { type Color, TableCell } from '@mui/material';
import { styled } from '@mui/system';
import React from 'react';

interface TableButtonProps {
  assignmentColor?: Color;
}

const TableButton = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'assignmentColor',
})<TableButtonProps>(
  ({ theme, assignmentColor }) => `
  text-align: center;
  vertical-align: middle;
  font-size: 1em;
  padding: 0;
  border-left: 1px dashed ${theme.palette.divider};
  border-right: 1px dashed ${theme.palette.divider};
  border-bottom: 1px solid ${theme.palette.divider};
  border-radius: 0px;
  transition: background-color 0.2s ease-in-out;
  ${assignmentColor ? `background-color: ${assignmentColor[200]};` : ''}
  cursor: pointer;
  
  &:hover {
    filter: brightness(95%);
  }
`
);

interface TableAssignmentCellProps {
  value?: string;
  onClick: () => void;
}

function TableAssignmentCell({ value, onClick }: TableAssignmentCellProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const assignmentsMap = getAssignmentsMapForCompetition(wcif);
  const assignment = value ? assignmentsMap[value] : undefined;

  return (
    <TableButton
      onMouseEnter={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.bubbles = false;
        if ((e.nativeEvent as MouseEvent).buttons === 1) {
          onClick();
        }
      }}
      onMouseDown={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.bubbles = false;
        onClick();
      }}
      assignmentColor={assignment?.color}>
      {assignment?.letter}
    </TableButton>
  );
}

export default TableAssignmentCell;
