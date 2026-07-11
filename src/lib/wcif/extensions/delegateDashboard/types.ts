/**
 * Type definitions for Delegate Dashboard WCIF extensions
 */

/**
 * Extension data for configuring groups in a round
 */
export interface GroupsExtensionData {
  /**
   * Number of groups or a mapping of stage number to group count
   */
  groups?: number | Record<number, number>;
  /**
   * Whether to spread groups across all stages
   */
  spreadGroupsAcrossAllStages?: boolean;
}

/**
 * Extension data for configuring an activity
 */
export interface ActivityConfigExtensionData {
  /**
   * Number of groups for this activity
   */
  groupCount?: number;
}

/**
 * Extension data for configuring a round
 */
export interface RoundConfigExtensionData {
  [key: string]: unknown;
}

/**
 * How a custom role is persisted when saving WCIF.
 * - roles: standard person.roles array
 * - extension: person.extensions only (for unsupported roles)
 * - both: both locations for maximum compatibility
 */
export type CustomRoleExportStrategy = 'roles' | 'extension' | 'both';

/**
 * A custom role definition stored at the competition level.
 */
export interface CustomRoleDefinition {
  id: string;
  name: string;
  exportStrategy?: CustomRoleExportStrategy;
  showOnStaffPage?: boolean;
  /** When true, this role can be painted per-group in Configure Assignments */
  assignPerGroup?: boolean;
  /** Keyboard shortcut for assignment painting (e.g. "m" for medical) */
  assignmentKey?: string;
  /** Short label shown in assignment cells (e.g. "CO" for commentator) */
  assignmentLetter?: string;
}

/**
 * Competition-level extension data for custom role definitions.
 */
export interface CustomRoleDefinitionsExtensionData {
  roles: CustomRoleDefinition[];
}

/**
 * Person-level extension data for custom roles.
 */
export interface PersonCustomRolesExtensionData {
  roles: string[];
}

/**
 * Competition-level backup for custom role data the WCA API may not accept on persons.
 */
export interface CustomRoleAssignmentRecord {
  registrantId: number;
  activityId: number;
  roleId: string;
}

export interface CustomRoleAssignmentsExtensionData {
  groupAssignments: CustomRoleAssignmentRecord[];
  rolesByRegistrantId: Record<string, string[]>;
}
