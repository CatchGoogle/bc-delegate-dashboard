import Link from '../../../components/MaterialLink';
import { acceptedRegistration, isOrganizerOrDelegate } from '../../../lib/domain/persons';
import {
  countPersonsWithRole,
  getCustomRoleDefinitions,
  getStaffPageRoles,
} from '../../../lib/domain/roles';
import { personHasRole } from '../../../lib/wcif/extensions/delegateDashboard/customRoles';
import { pluralize } from '../../../lib/utils';
import { useBreadcrumbs } from '../../../providers/BreadcrumbsProvider';
import { useAppDispatch, useAppSelector } from '../../../store';
import { togglePersonRole } from '../../../store/actions';
import AddNonCompetingStaffDialog from '../../../dialogs/AddNonCompetingStaffDialog';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableFooter from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { grey, red, yellow } from '@mui/material/colors';
import { type ChangeEvent, useEffect, useState } from 'react';
import { type Person } from '@wca/helpers';
import { useParams } from 'react-router-dom';

type CompetitorSort = 'name' | 'wcaId' | 'dob';

const Staff = () => {
  const wcif = useAppSelector((state) => state.wcif);
  const { competitionId = '' } = useParams<{ competitionId?: string }>();
  const dispatch = useAppDispatch();
  const { setBreadcrumbs } = useBreadcrumbs();
  const [competitorSort, setCompetitorSort] = useState<CompetitorSort>('name');
  const [nonCompetingStaffDialogOpen, setNonCompetingStaffDialogOpen] = useState(false);

  useEffect(() => {
    setBreadcrumbs([
      {
        text: 'Staff',
      },
    ]);
  }, [setBreadcrumbs]);

  const [filterDeleted] = useState(true);
  const [filterPending] = useState(true);

  if (!wcif) {
    return null;
  }

  const customRoleDefinitions = getCustomRoleDefinitions(wcif);
  const staffRoles = getStaffPageRoles(wcif);
  const acceptedPersons = wcif.persons.filter(acceptedRegistration);

  const filteredPersons =
    filterDeleted || filterPending
      ? wcif.persons.filter((person) => {
          if (filterDeleted && person.registration?.status === 'deleted') {
            return false;
          }

          if (filterDeleted && person.registration?.status === 'pending') {
            return false;
          }

          return true;
        })
      : wcif.persons;

  const handleChange = (
    _event: ChangeEvent<HTMLInputElement>,
    registrantId: number,
    roleId: string
  ) => {
    const person = filteredPersons.find((p) => p.registrantId === registrantId);
    if (person && acceptedRegistration(person)) {
      dispatch(togglePersonRole(registrantId, roleId));
    }
  };

  const boldCellSx = { fontWeight: 600 };
  const getRowSx = (person: Person) => {
    const isAccepted = acceptedRegistration(person);
    if (!isAccepted) {
      return { backgroundColor: red[50], '&:hover': { backgroundColor: red[100] } };
    }

    if (isOrganizerOrDelegate(person)) {
      return { backgroundColor: yellow[50], '&:hover': { backgroundColor: yellow[100] } };
    }

    if (!person.wcaId) {
      return { backgroundColor: grey[50], '&:hover': { backgroundColor: grey[100] } };
    }

    return undefined;
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <FormControl margin="none">
          <FormLabel>Sort</FormLabel>
          <RadioGroup
            row
            value={competitorSort}
            onChange={(e) => setCompetitorSort(e.target.value as CompetitorSort)}>
            <FormControlLabel value="name" control={<Radio />} label="Name" />
            <FormControlLabel value="wcaId" control={<Radio />} label="Wca ID" />
            <FormControlLabel value="dob" control={<Radio />} label="Age" />
          </RadioGroup>
        </FormControl>
        <Box sx={{ display: 'flex', flex: 1 }} />
        <Button component={Link} to={`/competitions/${competitionId}/custom-roles`} sx={{ mr: 1 }}>
          Manage Custom Roles
        </Button>
        <Button onClick={() => setNonCompetingStaffDialogOpen(true)}>
          Add Non-Competing Staff
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={boldCellSx}>Name</TableCell>
              <TableCell sx={boldCellSx}>WCA ID</TableCell>
              <TableCell sx={boldCellSx}>DOB</TableCell>
              <TableCell
                sx={boldCellSx}
                colSpan={staffRoles.length + 2}
                style={{
                  textAlign: 'center',
                }}>
                Role
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={boldCellSx} />
              <TableCell sx={boldCellSx} />
              <TableCell sx={boldCellSx} />
              <TableCell sx={boldCellSx}>Delegate</TableCell>
              <TableCell sx={boldCellSx}>Organizer</TableCell>
              {staffRoles.map((role) => (
                <TableCell key={role.id} sx={boldCellSx}>
                  {role.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPersons
              .sort((a, b) => {
                if (competitorSort === 'name') {
                  return a.name.localeCompare(b.name);
                }

                if (competitorSort === 'wcaId') {
                  return (a.wcaId || '').localeCompare(b.wcaId || '');
                }

                if (competitorSort === 'dob') {
                  return (a.birthdate ?? '').localeCompare(b.birthdate ?? '');
                }

                return 0;
              })
              .map((person) => (
                <TableRow key={person.registrantId} hover sx={getRowSx(person)}>
                  <TableCell>
                    <Link to={`/competitions/${competitionId}/persons/${person.registrantId}`}>
                      {person.name}
                    </Link>
                  </TableCell>
                  <TableCell>{person.wcaId}</TableCell>
                  <TableCell>{person.birthdate}</TableCell>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      disabled
                      checked={(person.roles ?? []).includes('delegate')}
                    />
                  </TableCell>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      disabled
                      checked={(person.roles ?? []).includes('organizer')}
                    />
                  </TableCell>
                  {staffRoles.map((role) => (
                    <TableCell key={role.id} padding="checkbox">
                      <Checkbox
                        disabled={!acceptedRegistration(person)}
                        color="primary"
                        checked={personHasRole(person, role.id, customRoleDefinitions)}
                        onChange={(e) => handleChange(e, person.registrantId, role.id)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell sx={boldCellSx}>
                {acceptedPersons.filter((person) => (person.roles ?? []).length > 0).length}
                {' / '}
                {wcif.persons.filter(acceptedRegistration).length}
                {' Staff'}
              </TableCell>
              <TableCell sx={boldCellSx}>
                {pluralize(
                  wcif.persons.filter(acceptedRegistration).filter((person) => !person.wcaId)
                    .length,
                  'First-Timer'
                )}
              </TableCell>
              <TableCell />
              <TableCell sx={boldCellSx}>
                {
                  acceptedPersons.filter((person) =>
                    (person.roles ?? []).some((r) => r.includes('delegate'))
                  ).length
                }
              </TableCell>
              <TableCell sx={boldCellSx}>
                {
                  acceptedPersons.filter((person) => (person.roles ?? []).includes('organizer'))
                    .length
                }
              </TableCell>
              {staffRoles.map((role) => (
                <TableCell key={role.id} sx={boldCellSx}>
                  {countPersonsWithRole(
                    wcif.persons.filter(acceptedRegistration),
                    role.id,
                    customRoleDefinitions
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <AddNonCompetingStaffDialog
        open={nonCompetingStaffDialogOpen}
        onClose={() => setNonCompetingStaffDialogOpen(false)}
      />
    </>
  );
};

export default Staff;
