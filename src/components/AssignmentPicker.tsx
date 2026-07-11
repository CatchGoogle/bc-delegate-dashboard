import { FormControl, FormHelperText, FormLabel, ListItemText, ListSubheader, MenuItem, Select, Typography } from '@mui/material';
import {
  getAssignmentsForCompetition,
  getCustomGroupAssignments,
} from '../lib/domain/assignmentDefinitions';
import { useAppSelector } from '../store';
import { useMemo } from 'react';

interface AssignmentPickerProps {
  value: string;
  setValue: (value: string) => void;
}

export default function AssignmentPicker({ value, setValue }: AssignmentPickerProps) {
  const wcif = useAppSelector((state) => state.wcif);
  const assignments = getAssignmentsForCompetition(wcif);
  const customAssignments = useMemo(
    () => (wcif ? getCustomGroupAssignments(wcif) : []),
    [wcif]
  );
  const builtInAssignments = useMemo(
    () => assignments.filter((assignment) => !assignment.isCustom),
    [assignments]
  );

  return (
    <FormControl margin="none" fullWidth>
      <FormLabel>Assignment</FormLabel>
      <Select
        className="paintingAssignment"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        renderValue={(selectedValue) => {
          const assignment = assignments.find((a) => a.id === selectedValue);
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ListItemText
                primary={assignment?.name}
                secondary={assignment?.isCustom ? 'Custom role' : undefined}
              />
            </div>
          );
        }}>
        <ListSubheader>Built-in assignments</ListSubheader>
        {builtInAssignments.map((assignment) => (
          <MenuItem key={assignment.id} value={assignment.id}>
            <ListItemText>{assignment.name}</ListItemText>
            {assignment.key && <Typography>{assignment.key.toUpperCase()}</Typography>}
          </MenuItem>
        ))}
        {customAssignments.length > 0 && [
          <ListSubheader key="custom-header">Custom roles (per group)</ListSubheader>,
          ...customAssignments.map((assignment) => (
            <MenuItem key={assignment.id} value={assignment.id}>
              <ListItemText primary={assignment.name} secondary={assignment.id} />
              {assignment.key && <Typography>{assignment.key.toUpperCase()}</Typography>}
            </MenuItem>
          )),
        ]}
      </Select>
      <FormHelperText>
        Click cells to paint, or press the assignment key. Add custom roles under Custom Roles with
        &quot;Assign per group&quot; enabled.
      </FormHelperText>
    </FormControl>
  );
}
