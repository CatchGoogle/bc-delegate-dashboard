import { type Color } from '@mui/material';
import {
  brown,
  cyan,
  deepOrange,
  indigo,
  lightBlue,
  lime,
  orange,
  teal,
} from '@mui/material/colors';
import type { Competition } from '@wca/helpers';
import BuiltInAssignments, { AssignmentsMap as BuiltInAssignmentsMap } from '../../config/assignments';
import type { CustomRoleDefinition } from '../wcif/extensions/delegateDashboard/types';
import { getCustomRoleDefinitions } from './roles';

const CUSTOM_ROLE_COLORS: Color[] = [
  orange,
  cyan,
  lime,
  indigo,
  teal,
  brown,
  deepOrange,
  lightBlue,
];

export interface AssignmentDefinition {
  id: string;
  name: string;
  color: Color;
  key: string;
  letter: string;
  isCustom?: boolean;
}

export function buildCustomAssignmentDefinition(
  role: CustomRoleDefinition,
  index: number
): AssignmentDefinition {
  const trimmedName = role.name.trim();
  const defaultKey = trimmedName.charAt(0).toLowerCase() || 'x';
  const defaultLetter = trimmedName.slice(0, 2).toUpperCase() || 'CR';

  return {
    id: role.id,
    name: role.name,
    color: CUSTOM_ROLE_COLORS[index % CUSTOM_ROLE_COLORS.length],
    key: role.assignmentKey?.trim() || defaultKey,
    letter: role.assignmentLetter?.trim() || defaultLetter,
    isCustom: true,
  };
}

export function getCustomGroupAssignments(wcif: Competition): AssignmentDefinition[] {
  return getCustomRoleDefinitions(wcif)
    .filter((role) => role.assignPerGroup)
    .map((role, index) => buildCustomAssignmentDefinition(role, index));
}

export function getAssignmentsForCompetition(wcif: Competition | null): AssignmentDefinition[] {
  const builtIn = BuiltInAssignments as AssignmentDefinition[];
  if (!wcif) {
    return builtIn;
  }

  return [...builtIn, ...getCustomGroupAssignments(wcif)];
}

export function getAssignmentsMapForCompetition(
  wcif: Competition | null
): Record<string, AssignmentDefinition> {
  const map = { ...BuiltInAssignmentsMap } as Record<string, AssignmentDefinition>;

  if (!wcif) {
    return map;
  }

  getCustomGroupAssignments(wcif).forEach((assignment) => {
    map[assignment.id] = assignment;
  });

  return map;
}

export function isGroupStaffAssignmentCode(assignmentCode: string): boolean {
  return assignmentCode.startsWith('staff-') || assignmentCode.startsWith('custom-');
}

export function getAssignmentLabel(
  assignmentCode: string,
  wcif: Competition | null
): string {
  return getAssignmentsMapForCompetition(wcif)[assignmentCode]?.name ?? assignmentCode;
}

export function staffingAssignmentToText(
  assignmentCode: string,
  groupNumber: number | undefined,
  wcif: Competition | null
): string {
  const assignment = getAssignmentsMapForCompetition(wcif)[assignmentCode];
  const groupSuffix = groupNumber ?? '';
  const prefix = assignment?.letter?.[0]?.toUpperCase() ?? assignmentCode.charAt(0).toUpperCase();

  return `${prefix}${groupSuffix}`;
}
