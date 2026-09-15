const LINE_STATUSES = [
  'Processing',
  'Ready to Ship from Supplier',
  'In Transit',
  'In Inventory',
  'Ready for Delivery',
  'Delivered',
];

const LINE_CURRENCIES = ['AED', 'USD', 'CNY'];

const PO_STATUSES = ['Open', 'Closed'];

const USER_ROLES = {
  ADMINISTRATOR: 'administrator',
  DATA_ENTRY: 'dataEntry',
  VIEWER: 'viewer',
};

const STAFF_ROLES = Object.values(USER_ROLES);
const EDIT_ROLES = [USER_ROLES.ADMINISTRATOR, USER_ROLES.DATA_ENTRY];
const ADMIN_ROLES = [USER_ROLES.ADMINISTRATOR];

module.exports = {
  LINE_STATUSES,
  LINE_CURRENCIES,
  PO_STATUSES,
  USER_ROLES,
  STAFF_ROLES,
  EDIT_ROLES,
  ADMIN_ROLES,
};
