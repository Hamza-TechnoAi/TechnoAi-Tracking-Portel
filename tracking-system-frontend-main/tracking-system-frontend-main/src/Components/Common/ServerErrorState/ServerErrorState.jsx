import './ServerErrorState.scss';

export default function ServerErrorState({
  message = 'Something went wrong. Please refresh the page and try again.',
  onRetry,
  retryLabel = 'Refresh page',
}) {
  const handleRefresh = () => {
    if (onRetry) {
      onRetry();
      return;
    }

    window.location.reload();
  };

  return (
    <div className="server-error-state" role="alert">
      <div className="server-error-state__icon" aria-hidden>
        !
      </div>
      <h2 className="server-error-state__title">Something went wrong</h2>
      <p className="server-error-state__message">{message}</p>
      <button type="button" className="server-error-state__refresh-btn" onClick={handleRefresh}>
        {retryLabel}
      </button>
    </div>
  );
}
