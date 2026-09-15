export default function ShipmentTrackingLink({ value, className = '' }) {
  if (!value?.trim()) return '—';

  const trimmed = value.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return (
      <a
        href={trimmed}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
      >
        {trimmed}
      </a>
    );
  }

  return trimmed;
}
