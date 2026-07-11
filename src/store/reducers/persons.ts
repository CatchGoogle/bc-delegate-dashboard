import type { TogglePersonRolePayload, AddPersonPayload } from '../actions';
import type { AppState } from '../initialState';
import {
  applyRoleChangeToPerson,
  applyRolesToPerson,
  getCustomRoleDefinitionsExtensionData,
  personHasRole,
} from '../../lib/wcif/extensions/delegateDashboard/customRoles';

export const togglePersonRole = (state: AppState, action: TogglePersonRolePayload): AppState => {
  if (!('registrantId' in action && 'roleId' in action) || !state.wcif) return state;

  const customRoleDefinitions = getCustomRoleDefinitionsExtensionData(state.wcif).roles;

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: state.wcif.persons.map((person) => {
        if (person.registrantId !== action.registrantId) {
          return person;
        }

        const hasRole = personHasRole(person, action.roleId, customRoleDefinitions);
        return applyRoleChangeToPerson(person, action.roleId, !hasRole, customRoleDefinitions);
      }),
    },
  };
};

export const addPerson = (state: AppState, action: AddPersonPayload): AppState => {
  if (!('person' in action) || !state.wcif) return state;
  const { person } = action;
  const customRoleDefinitions = getCustomRoleDefinitionsExtensionData(state.wcif).roles;
  const personWithRoles = applyRolesToPerson(
    person,
    person.roles ?? [],
    customRoleDefinitions
  );

  return {
    ...state,
    needToSave: true,
    changedKeys: new Set([...state.changedKeys, 'persons']),
    wcif: {
      ...state.wcif,
      persons: [
        ...state.wcif.persons.filter((i) => i.wcaUserId !== person.wcaUserId),
        personWithRoles,
      ],
    },
  };
};
