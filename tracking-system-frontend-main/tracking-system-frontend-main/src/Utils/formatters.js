const PO_SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatPoDate(dateString) {
  if (!dateString) return '—';

  const calendarDate = toDateInputValue(dateString);
  if (!calendarDate) return '?';
  const [year, monthNumber, day] = calendarDate.split('-');
  const month = PO_SHORT_MONTHS[Number(monthNumber) - 1];

  return `${day}-${month}-${year}`;
}

export function parsePoDateInput(value) {
  if (!value?.trim()) return '';

  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);

  if (!match) return null;

  const [, day, monthStr, year] = match;
  const monthIndex = PO_SHORT_MONTHS.findIndex(
    (month) => month.toLowerCase() === monthStr.toLowerCase(),
  );

  if (monthIndex === -1) return null;

  const date = new Date(Number(year), monthIndex, Number(day));

  if (
    date.getFullYear() !== Number(year)
    || date.getMonth() !== monthIndex
    || date.getDate() !== Number(day)
  ) {
    return null;
  }

  return toDateInputValue(date);
}

export function isValidEmail(value) {
  if (!value?.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function formatRelativeActivityTime(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return diffMin === 1 ? '1 min ago' : `${diffMin} min ago`;

  const startOfDay = (value) => {
    const copy = new Date(value);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };

  const dayDiff = Math.round(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  if (dayDiff === 1) return 'Yesterday';

  if (dayDiff < 7) {
    return date.toLocaleDateString('en-GB', { weekday: 'long' });
  }

  return formatPoDate(dateString);
}

export function formatLineCount(count) {
  return String(count).padStart(2, '0');
}

export function toDateInputValue(value) {
  if (!value) return '';
  // PO/ETA values are calendar dates, including API midnight-UTC strings.
  // Preserve their written date instead of shifting it into the browser timezone.
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (match) {
      const [, year, month, day] = match;
      const check = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (check.getUTCFullYear() !== Number(year) || check.getUTCMonth() + 1 !== Number(month) || check.getUTCDate() !== Number(day)) return '';
      return `${year}-${month}-${day}`;
    }
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toIsoDate(value) {
  if (!value) return undefined;
  return new Date(value).toISOString();
}

export function calculatePoStatusPercent(items = [], poStatus) {
  if (!items.length) return poStatus === 'Closed' ? 100 : 0;

  const deliveredCount = items.filter((item) => item.status === 'Delivered').length;
  return Math.round((deliveredCount / items.length) * 100);
}

export function mapPublicTrackOrder(data) {
  const items = (data.items || []).map((item) => ({
    lineNo: item.lineNumber,
    description: item.description,
    quantity: item.quantity,
    status: item.status,
    eta: item.eta,
    shipmentTrackingLink: item.shipmentTrackingLink || '',
  }));

  return {
    poNumber: data.poNumber,
    poStatus: data.poStatus,
    poStatusPercent: calculatePoStatusPercent(data.items, data.poStatus),
    poClosingDate: data.poClosingDate,
    numberOfLines: data.numberOfLines,
    items,
  };
}
