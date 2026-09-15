import { useState } from 'react';
import { toast } from 'react-toastify';
import { getFriendlyErrorMessage } from '../../../Api/api';
import { subscribeToTrackUpdates } from '../../../Services/trackService';
import './SubscribeUpdatesModal.scss';

export default function SubscribeUpdatesModal({ poNumber, isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await subscribeToTrackUpdates(poNumber, email.trim());
      toast.success('You are subscribed to shipment updates for this PO.');
      setEmail('');
      onClose();
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Unable to subscribe. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="subscribe-updates">
      <button
        type="button"
        className="subscribe-updates__overlay"
        aria-label="Close subscribe dialog"
        onClick={onClose}
      />
      <div className="subscribe-updates__dialog" role="dialog" aria-modal="true" aria-labelledby="subscribe-updates-title">
        <h2 id="subscribe-updates-title" className="subscribe-updates__title">
          Subscribe for Updates
        </h2>
        <p className="subscribe-updates__subtitle">
          Get email alerts whenever the status changes for PO {poNumber}.
        </p>

        <form className="subscribe-updates__form" onSubmit={handleSubmit}>
          <label className="subscribe-updates__label" htmlFor="subscribe-email">
            Email address
          </label>
          <input
            id="subscribe-email"
            type="email"
            className="subscribe-updates__input"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            placeholder="you@example.com"
            autoComplete="email"
          />
          {error && <p className="subscribe-updates__error">{error}</p>}

          <div className="subscribe-updates__actions">
            <button type="button" className="subscribe-updates__cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="subscribe-updates__submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
