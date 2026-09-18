import { useState } from 'react';
import Seo from '../Components/Common/Seo/Seo';
import ServerErrorState from '../Components/Common/ServerErrorState/ServerErrorState';
import TrackingNavbar from '../Components/Tracking/TrackingNavbar/TrackingNavbar';
import TrackingSearch from '../Components/Tracking/TrackingSearch/TrackingSearch';
import TrackingResult from '../Components/Tracking/TrackingResult/TrackingResult';
import TrackingFooter from '../Components/Tracking/TrackingFooter/TrackingFooter';
import { getFriendlyErrorMessage } from '../Api/api';
import { trackPurchaseOrder } from '../Services/trackService';
import { mapPublicTrackOrder } from '../Utils/formatters';
import warehouseBackground from '../assets/tracking-warehouse.png';
import './TrackingPage.scss';

function ShipmentIcon() {
  return (
    <svg className="tracking-card__shipment-icon" viewBox="0 0 92 82" aria-hidden="true">
      <defs>
        <linearGradient id="boxTop" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#79b3ce" />
          <stop offset="1" stopColor="#376d89" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#346a86" />
          <stop offset="1" stopColor="#173c55" />
        </linearGradient>
      </defs>
      <path d="M14 23 43 7l29 16-29 17Z" fill="url(#boxTop)" />
      <path d="M14 23v34l29 17V40Z" fill="url(#boxSide)" />
      <path d="m72 23-29 17v34l29-17Z" fill="#23536e" />
      <path d="m27 16 29 17 8-5L35 11Z" fill="#071d2d" />
      <path d="M76 30c-11 0-20 8-20 19 0 15 20 31 20 31s20-16 20-31c0-11-9-19-20-19Z" fill="#62e5df" stroke="#061d2c" strokeWidth="4" />
      <circle cx="76" cy="49" r="7" fill="#0a3145" />
    </svg>
  );
}

function StatusIcon({ type }) {
  if (type === 'order') {
    return <path d="M8 5h8v2h3v14H5V7h3V5Zm2 2h4V6h-4v1Zm-2 4v2h8v-2H8Zm0 4v2h8v-2H8Z" fill="currentColor" />;
  }

  if (type === 'transit') {
    return <path d="M3 7h11v9H3V7Zm11 3h3l4 4v2h-2a3 3 0 0 1-6 0h-3a3 3 0 0 1-6 0H2V5h12v5Zm2 2v2h3l-2-2h-1Zm-9 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 0 2Z" fill="currentColor" />;
  }

  return <path d="m6.5 12.5 3.5 3.5 7.5-8 1.5 1.5-9 9-5-5 1.5-1.5Z" fill="currentColor" />;
}

function TrackingProgress() {
  const steps = [
    { label: 'Order Confirmed', type: 'order' },
    { label: 'In Transit', type: 'transit' },
    { label: 'Delivered', type: 'delivered' },
  ];

  return (
    <div className="tracking-progress" aria-label="Shipment progress">
      {steps.map((step) => (
        <div className="tracking-progress__step" key={step.type}>
          <span className="tracking-progress__circle">
            <svg viewBox="0 0 24 24" aria-hidden="true"><StatusIcon type={step.type} /></svg>
          </span>
          <span className="tracking-progress__label">{step.label}</span>
        </div>
      ))}
    </div>
  );
}

const SEARCH_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',
  FOUND: 'found',
  NOT_FOUND: 'not-found',
  ERROR: 'error',
};

export default function TrackingPage() {
  const [poNumberInput, setPoNumberInput] = useState('');
  const [searchState, setSearchState] = useState({
    status: SEARCH_STATE.IDLE,
    order: null,
    poNumber: '',
    errorMessage: '',
  });

  const handleSearch = async (poNumber) => {
    const trimmedPoNumber = poNumber.trim();
    setPoNumberInput(poNumber);
    setSearchState({
      status: SEARCH_STATE.LOADING,
      order: null,
      poNumber: trimmedPoNumber,
      errorMessage: '',
    });

    try {
      const response = await trackPurchaseOrder(trimmedPoNumber);
      const order = mapPublicTrackOrder(response.data);

      setPoNumberInput('');
      setSearchState({
        status: SEARCH_STATE.FOUND,
        order,
        poNumber: trimmedPoNumber,
        errorMessage: '',
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchState({
          status: SEARCH_STATE.NOT_FOUND,
          order: null,
          poNumber: trimmedPoNumber,
          errorMessage: '',
        });
        return;
      }

      setSearchState({
        status: SEARCH_STATE.ERROR,
        order: null,
        poNumber: trimmedPoNumber,
        errorMessage: getFriendlyErrorMessage(
          error,
          'Unable to load shipment details. Please refresh the page and try again.',
        ),
      });
    }
  };

  const handleRetry = () => {
    if (searchState.poNumber) {
      handleSearch(searchState.poNumber);
      return;
    }

    setSearchState({
      status: SEARCH_STATE.IDLE,
      order: null,
      poNumber: '',
      errorMessage: '',
    });
  };

  const isLoading = searchState.status === SEARCH_STATE.LOADING;
  const hasResult = searchState.status === SEARCH_STATE.FOUND;
  const isNotFound = searchState.status === SEARCH_STATE.NOT_FOUND;
  const hasError = searchState.status === SEARCH_STATE.ERROR;

  return (
    <>
      <Seo
        title="Track Shipment | TechnoAi"
        description="Track your shipment by entering PO number below."
        path="/"
      />

      <main
        className="tracking-page"
        style={{ '--tracking-background': `url(${warehouseBackground})` }}
      >
        <TrackingNavbar />

        <div className="tracking-page__body">
          {!hasResult && !hasError && !isNotFound && (
            <section className="tracking-card">
              <ShipmentIcon />
              <div className="tracking-page__hero">
                <h1 className="tracking-page__title">Track Shipment</h1>
                <p className="tracking-page__subtitle">
                  Track your shipment by entering PO number below
                </p>
              </div>

              <div className="tracking-page__search-row">
                <TrackingSearch
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  value={poNumberInput}
                  onChange={setPoNumberInput}
                  submitLabel="Track Shipment"
                />
              </div>

              <TrackingProgress />
            </section>
          )}

          {isNotFound && (
            <div className="tracking-page__message" role="alert">
              <p>
                No shipment found for PO number <strong>{searchState.poNumber}</strong>.
              </p>
              <p>Please check your PO number and try again.</p>
            </div>
          )}

          {hasError && (
            <ServerErrorState
              message={searchState.errorMessage}
              onRetry={handleRetry}
              retryLabel="Try again"
            />
          )}

          {hasResult && searchState.order && (
            <TrackingResult order={searchState.order} />
          )}

          {(hasResult || isNotFound || hasError) && (
            <div className="tracking-page__search-row tracking-page__search-row--secondary">
              <TrackingSearch
                onSearch={handleSearch}
                isLoading={isLoading}
                value={poNumberInput}
                onChange={setPoNumberInput}
                submitLabel="Track another Shipment"
                labelText="Track another Shipment"
              />
            </div>
          )}
        </div>

        <TrackingFooter />
      </main>
    </>
  );
}
