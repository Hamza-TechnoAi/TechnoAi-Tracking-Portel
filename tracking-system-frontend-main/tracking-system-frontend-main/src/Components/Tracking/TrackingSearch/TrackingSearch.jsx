import './TrackingSearch.scss';

function SearchIcon() {
  return (
    <svg
      className="tracking-search__icon"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      className="tracking-search__icon tracking-search__icon--loading"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path
        d="M12 3C16.9706 3 21 7.02944 21 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TrackingSearch({
  onSearch,
  isLoading = false,
  value = '',
  onChange,
  submitLabel = 'Track Shipment',
  labelText = 'Track Shipment',
}) {
  const handleSubmit = (event) => {
    event.preventDefault();

    if (value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <form className="tracking-search" onSubmit={handleSubmit}>
      <div className="tracking-search__group">
        <span className="tracking-search__label">{labelText}</span>

        <input
          className="tracking-search__input"
          type="text"
          name="poNumber"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="Enter PO Number"
          autoComplete="off"
          disabled={isLoading}
          required
          aria-label="PO Number"
        />
      </div>

      <button
        className="tracking-search__icon-btn"
        type="submit"
        disabled={isLoading}
        aria-label={isLoading ? 'Searching…' : submitLabel}
      >
        {isLoading ? <LoadingIcon /> : <SearchIcon />}
      </button>
    </form>
  );
}
