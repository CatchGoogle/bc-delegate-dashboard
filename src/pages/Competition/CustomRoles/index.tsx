import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppDispatch, useAppSelector } from '../../../store';
import { updateCustomRoleDefinitions } from '../../../store/actions';
import {
  normalizeCustomRoleId,
  slugifyRoleId,
  type RoleExportStrategy,
} from '../../../config/roles';
import { getCustomRoleDefinitions } from '../../../lib/domain/roles';
import type { CustomRoleDefinition } from '../../../lib/wcif/extensions/delegateDashboard/types';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useEffect, useState } from 'react';

const EXPORT_STRATEGY_OPTIONS: Array<{ value: RoleExportStrategy; label: string; help: string }> =
  [
    {
      value: 'both',
      label: 'Both (recommended)',
      help: 'Writes to person.roles and person.extensions for maximum compatibility.',
    },
    {
      value: 'roles',
      label: 'Standard WCIF roles',
      help: 'Writes only to person.roles. Use for roles the WCA API accepts.',
    },
    {
      value: 'extension',
      label: 'Extension only',
      help: 'Writes only to person.extensions. Use for roles outside the base WCIF spec.',
    },
  ];

const emptyDraft = (): CustomRoleDefinition => ({
  id: '',
  name: '',
  exportStrategy: 'both',
  showOnStaffPage: true,
  assignPerGroup: false,
  assignmentKey: '',
  assignmentLetter: '',
});

const normalizeRoleDraft = (draft: CustomRoleDefinition): CustomRoleDefinition => ({
  ...draft,
  id: normalizeCustomRoleId(draft.id.trim()),
  name: draft.name.trim(),
  assignmentKey: draft.assignmentKey?.trim() || undefined,
  assignmentLetter: draft.assignmentLetter?.trim() || undefined,
});

const CustomRolesPage = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const dispatch = useAppDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [draft, setDraft] = useState<CustomRoleDefinition>(emptyDraft);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CustomRoleDefinition | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Custom Roles',
      },
    ]);
  }, [setBreadcrumbs]);

  if (!wcif) {
    return null;
  }

  const customRoles = getCustomRoleDefinitions(wcif);

  const saveRoles = (
    roles: CustomRoleDefinition[],
    renamedRole?: { fromId: string; toId: string }
  ) => {
    dispatch(updateCustomRoleDefinitions(roles, renamedRole));
  };

  const handleAddRole = () => {
    const normalized = normalizeRoleDraft(draft);
    if (!normalized.name) {
      return;
    }

    if (customRoles.some((role) => role.id === normalized.id)) {
      return;
    }

    saveRoles([...customRoles, normalized]);
    setDraft(emptyDraft());
  };

  const handleDeleteRole = (roleId: string) => {
    saveRoles(customRoles.filter((role) => role.id !== roleId));
  };

  const handleUpdateRole = (roleId: string, updates: Partial<CustomRoleDefinition>) => {
    saveRoles(customRoles.map((role) => (role.id === roleId ? { ...role, ...updates } : role)));
  };

  const openEditDialog = (role: CustomRoleDefinition) => {
    setEditingRoleId(role.id);
    setEditDraft({ ...role });
    setEditError(null);
  };

  const closeEditDialog = () => {
    setEditingRoleId(null);
    setEditDraft(null);
    setEditError(null);
  };

  const handleSaveEdit = () => {
    if (!editDraft || !editingRoleId) {
      return;
    }

    const normalized = normalizeRoleDraft(editDraft);
    if (!normalized.name) {
      setEditError('Display name is required.');
      return;
    }

    if (
      normalized.id !== editingRoleId &&
      customRoles.some((role) => role.id === normalized.id)
    ) {
      setEditError('A role with this ID already exists.');
      return;
    }

    const updatedRoles = customRoles.map((role) =>
      role.id === editingRoleId ? normalized : role
    );

    saveRoles(
      updatedRoles,
      normalized.id !== editingRoleId
        ? { fromId: editingRoleId, toId: normalized.id }
        : undefined
    );
    closeEditDialog();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Custom Roles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define competition-specific roles that export into WCIF. Enable per-group assignment to
          paint roles onto specific groups in Configure Assignments, similar to judging.
        </Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Add Custom Role
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Display Name"
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              setDraft((current) => ({
                ...current,
                name,
                id: current.id || normalizeCustomRoleId(slugifyRoleId(name)),
                assignmentLetter:
                  current.assignmentLetter ||
                  name.trim().slice(0, 2).toUpperCase(),
                assignmentKey: current.assignmentKey || name.trim().charAt(0).toLowerCase(),
              }));
            }}
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Role ID"
            value={draft.id}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                id: normalizeCustomRoleId(event.target.value),
              }))
            }
            helperText="Stored in WCIF. Prefixed with custom- if needed."
            sx={{ minWidth: 220 }}
          />
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>Export Strategy</InputLabel>
            <Select
              label="Export Strategy"
              value={draft.exportStrategy ?? 'both'}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  exportStrategy: event.target.value as RoleExportStrategy,
                }))
              }>
              {EXPORT_STRATEGY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={draft.showOnStaffPage ?? true}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    showOnStaffPage: event.target.checked,
                  }))
                }
              />
            }
            label="Show on Staff page"
          />
          <FormControlLabel
            control={
              <Switch
                checked={draft.assignPerGroup ?? false}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assignPerGroup: event.target.checked,
                  }))
                }
              />
            }
            label="Assign per group"
          />
          {draft.assignPerGroup && (
            <>
              <TextField
                label="Assignment Key"
                value={draft.assignmentKey ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assignmentKey: event.target.value,
                  }))
                }
                helperText="Keyboard shortcut in Configure Assignments"
                sx={{ width: 120 }}
              />
              <TextField
                label="Cell Label"
                value={draft.assignmentLetter ?? ''}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    assignmentLetter: event.target.value,
                  }))
                }
                helperText="Shown in assignment cells"
                sx={{ width: 120 }}
              />
            </>
          )}
          <Button variant="contained" onClick={handleAddRole} disabled={!draft.name.trim()}>
            Add Role
          </Button>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Role ID</TableCell>
              <TableCell>Export Strategy</TableCell>
              <TableCell>Staff Page</TableCell>
              <TableCell>Per Group</TableCell>
              <TableCell>Key / Label</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {customRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">
                    No custom roles yet. Built-in staff roles (scrambler, judge, runner, data entry)
                    are always available on the Staff page and in Configure Assignments.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customRoles.map((role) => (
                <TableRow key={role.id} hover>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>
                    <code>{role.id}</code>
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <Select
                        value={role.exportStrategy ?? 'both'}
                        onChange={(event) =>
                          handleUpdateRole(role.id, {
                            exportStrategy: event.target.value as RoleExportStrategy,
                          })
                        }>
                        {EXPORT_STRATEGY_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={role.showOnStaffPage !== false}
                      onChange={(event) =>
                        handleUpdateRole(role.id, { showOnStaffPage: event.target.checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={role.assignPerGroup === true}
                      onChange={(event) =>
                        handleUpdateRole(role.id, { assignPerGroup: event.target.checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {role.assignPerGroup ? (
                      <Typography variant="body2">
                        {role.assignmentKey || role.name.charAt(0).toLowerCase()} /{' '}
                        {role.assignmentLetter || role.name.slice(0, 2).toUpperCase()}
                      </Typography>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton aria-label={`Edit ${role.name}`} onClick={() => openEditDialog(role)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      aria-label={`Delete ${role.name}`}
                      onClick={() => handleDeleteRole(role.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editDraft} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Custom Role</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label="Display Name"
            value={editDraft?.name ?? ''}
            onChange={(event) =>
              setEditDraft((current) =>
                current
                  ? {
                      ...current,
                      name: event.target.value,
                    }
                  : current
              )
            }
          />
          <TextField
            label="Role ID"
            value={editDraft?.id ?? ''}
            onChange={(event) =>
              setEditDraft((current) =>
                current
                  ? {
                      ...current,
                      id: normalizeCustomRoleId(event.target.value),
                    }
                  : current
              )
            }
            helperText="Changing the ID updates existing assignments and role data for this role."
          />
          <FormControl fullWidth>
            <InputLabel>Export Strategy</InputLabel>
            <Select
              label="Export Strategy"
              value={editDraft?.exportStrategy ?? 'both'}
              onChange={(event) =>
                setEditDraft((current) =>
                  current
                    ? {
                        ...current,
                        exportStrategy: event.target.value as RoleExportStrategy,
                      }
                    : current
                )
              }>
              {EXPORT_STRATEGY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={
              <Switch
                checked={editDraft?.showOnStaffPage !== false}
                onChange={(event) =>
                  setEditDraft((current) =>
                    current
                      ? {
                          ...current,
                          showOnStaffPage: event.target.checked,
                        }
                      : current
                  )
                }
              />
            }
            label="Show on Staff page"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editDraft?.assignPerGroup === true}
                onChange={(event) =>
                  setEditDraft((current) =>
                    current
                      ? {
                          ...current,
                          assignPerGroup: event.target.checked,
                        }
                      : current
                  )
                }
              />
            }
            label="Assign per group"
          />
          {editDraft?.assignPerGroup && (
            <>
              <TextField
                label="Assignment Key"
                value={editDraft.assignmentKey ?? ''}
                onChange={(event) =>
                  setEditDraft((current) =>
                    current
                      ? {
                          ...current,
                          assignmentKey: event.target.value,
                        }
                      : current
                  )
                }
                helperText="Keyboard shortcut in Configure Assignments"
              />
              <TextField
                label="Cell Label"
                value={editDraft.assignmentLetter ?? ''}
                onChange={(event) =>
                  setEditDraft((current) =>
                    current
                      ? {
                          ...current,
                          assignmentLetter: event.target.value,
                        }
                      : current
                  )
                }
                helperText="Shown in assignment cells"
              />
            </>
          )}
          {editError && (
            <Typography variant="body2" color="error">
              {editError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={!editDraft?.name.trim()}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Export strategies
        </Typography>
        {EXPORT_STRATEGY_OPTIONS.map((option) => (
          <Typography key={option.value} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <strong>{option.label}:</strong> {option.help}
          </Typography>
        ))}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          <strong>Assign per group:</strong> Adds the role to Configure Assignments so you can paint
          it onto specific groups. Stored in person.assignments and exported in WCIF like judge
          assignments.
        </Typography>
      </Paper>
    </Box>
  );
};

export default CustomRolesPage;
