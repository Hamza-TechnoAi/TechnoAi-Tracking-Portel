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
import './TrackingPage.scss';

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

      <main className="tracking-page">
        <TrackingNavbar />

        <div className="tracking-page__body">
          {!hasResult && !hasError && !isNotFound && (
            <section className="tracking-page__hero">
              <h1 className="tracking-page__title">Track Shipment</h1>
              <p className="tracking-page__subtitle">
                Track your shipment by entering PO number below
              </p>
            </section>
          )}

          {!hasResult && !hasError && !isNotFound && (
            <div className="tracking-page__search-row">
              <TrackingSearch
                onSearch={handleSearch}
                isLoading={isLoading}
                value={poNumberInput}
                onChange={setPoNumberInput}
                submitLabel="Track Shipment"
              />
            </div>
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
