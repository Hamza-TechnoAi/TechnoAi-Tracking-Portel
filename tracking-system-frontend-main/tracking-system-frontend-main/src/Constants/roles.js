export const USER_ROLES = {
  ADMINISTRATOR: 'administrator',
  DATA_ENTRY: 'dataEntry',
  VIEWER: 'viewer',
};

export const STAFF_ROLES = Object.values(USER_ROLES);

export const EDIT_ROLES = [USER_ROLES.ADMINISTRATOR, USER_ROLES.DATA_ENTRY];

export const ADMIN_ROLES = [USER_ROLES.ADMINISTRATOR];

export const ROLE_LABELS = {
  [USER_ROLES.ADMINISTRATOR]: 'Administrator',
  [USER_ROLES.DATA_ENTRY]: 'Data Entry',
  [USER_ROLES.VIEWER]: 'Viewer',
};

export const CREATABLE_STAFF_ROLES = [
  USER_ROLES.DATA_ENTRY,
  USER_ROLES.VIEWER,
];
