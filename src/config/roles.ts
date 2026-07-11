export type RoleExportStrategy = 'roles' | 'extension' | 'both';

export interface StaffRoleOption {
  id: string;
  name: string;
  /** Built-in roles always export to person.roles */
  builtIn?: boolean;
  exportStrategy?: RoleExportStrategy;
}

/** Standard staff roles available on the Staff page */
export const BUILT_IN_STAFF_ROLES: StaffRoleOption[] = [
  {
    id: 'staff-scrambler',
    name: 'Scrambler',
    builtIn: true,
    exportStrategy: 'roles',
  },
  {
    id: 'staff-judge',
    name: 'Judge',
    builtIn: true,
    exportStrategy: 'roles',
  },
  {
    id: 'staff-runner',
    name: 'Runner',
    builtIn: true,
    exportStrategy: 'roles',
  },
  {
    id: 'staff-dataentry',
    name: 'Data Entry',
    builtIn: true,
    exportStrategy: 'roles',
  },
];

export const STANDARD_WCIF_ROLES = ['delegate', 'trainee-delegate', 'organizer'] as const;

export const slugifyRoleId = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizeCustomRoleId = (id: string): string => {
  const normalized = id.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (!normalized) {
    return 'custom-role';
  }

  return normalized.startsWith('custom-') ? normalized : `custom-${normalized}`;
};
