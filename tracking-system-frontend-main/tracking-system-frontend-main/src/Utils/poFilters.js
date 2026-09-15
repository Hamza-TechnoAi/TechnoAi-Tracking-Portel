import { toIsoDate } from './formatters';

export const INITIAL_PO_FILTERS = {
  dateFrom: '',
  dateTo: '',
  salesPerson: '',
  clientName: '',
  status: '',
  upcomingClosingBy: '',
  allPos: false,
  supplier: '',
  country: '',
  currency: '',
  poNumber: '',
  soNumber: '',
  contactPerson: '',
};

export function buildPoFilterParams(filters, page, limit) {
  const params = { page, limit };

  if (filters.allPos) return params;

  if (filters.dateFrom) params.poDateFrom = toIsoDate(filters.dateFrom);
  if (filters.dateTo) params.poDateTo = toIsoDate(filters.dateTo);
  if (filters.salesPerson) params.salesPerson = filters.salesPerson;
  if (filters.clientName) params.clientName = filters.clientName;
  if (filters.status) params.poStatus = filters.status;
  if (filters.upcomingClosingBy) params.upcomingClosingBy = toIsoDate(filters.upcomingClosingBy);
  if (filters.supplier) params.supplier = filters.supplier;
  if (filters.country) params.country = filters.country;
  if (filters.currency) params.lineCurrency = filters.currency;
  if (filters.poNumber?.trim()) params.poNumber = filters.poNumber.trim();
  if (filters.soNumber?.trim()) params.soNumber = filters.soNumber.trim();
  if (filters.contactPerson?.trim()) params.contactPerson = filters.contactPerson.trim();

  return params;
}
