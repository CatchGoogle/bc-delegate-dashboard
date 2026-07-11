import { getSelectableRoles } from '../lib/domain/roles';
import { useAppSelector } from '../store';
import { Autocomplete, TextField } from '@mui/material';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { useMemo } from 'react';

interface RoleOption {
  value: string;
  label: string;
}

const filter = createFilterOptions<RoleOption>();

export default function RoleSelect({
  roles,
  setRoles,
}: {
  roles: string[];
  setRoles: (roles: string[]) => void;
}) {
  const wcif = useAppSelector((state) => state.wcif);
  const options = useMemo(() => {
    if (!wcif) {
      return [];
    }

    return getSelectableRoles(wcif).map((role) => ({
      value: role.id,
      label: role.name,
    }));
  }, [wcif]);

  const selectedOptions = useMemo(() => {
    const knownOptions = options.filter((option) => roles.includes(option.value));
    const customValues = roles
      .filter((role) => !options.some((option) => option.value === role))
      .map((role) => ({ value: role, label: role }));

    return [...knownOptions, ...customValues];
  }, [options, roles]);

  return (
    <Autocomplete
      multiple
      freeSolo
      id="role-select"
      options={options}
      value={selectedOptions}
      onChange={(_, value) => {
        const nextRoles = value.map((option) => {
          if (typeof option === 'string') {
            return option.trim();
          }

          return option.value;
        });

        setRoles(nextRoles.filter(Boolean));
      }}
      filterOptions={(opts, params) => {
        const filtered = filter(opts, params);
        const input = params.inputValue.trim();

        if (input && !opts.some((option) => option.value === input)) {
          filtered.push({
            value: input,
            label: `Add "${input}"`,
          });
        }

        return filtered;
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params) => <TextField {...params} label="Roles" />}
    />
  );
}
