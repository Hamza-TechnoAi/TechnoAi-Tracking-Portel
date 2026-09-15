import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IoMdClose } from 'react-icons/io';
import './ConfirmToast.scss';

export default function ConfirmToast({
  message,
  title = 'Are you sure?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) {
  const [exiting, setExiting] = useState(false);

  const handleCancel = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      onCancel();
    }, 220);
  }, [exiting, onCancel]);

  const handleConfirm = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    window.setTimeout(() => {
      onConfirm();
    }, 220);
  }, [exiting, onConfirm]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCancel]);

  return createPortal(
    <div
      className={`confirm-toast-overlay${exiting ? ' is-exiting' : ''}`}
      onClick={handleCancel}
      role="presentation"
    >
      <div
        className={`confirm-toast-modal${variant === 'danger' ? ' is-danger' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-toast-title"
      >
        <button
          type="button"
          className="confirm-toast-modal__close"
          onClick={handleCancel}
          aria-label="Close"
        >
          <IoMdClose size={20} />
        </button>

        <h3 id="confirm-toast-title" className="confirm-toast-modal__title">
          {title}
        </h3>
        <p className="confirm-toast-modal__message">{message}</p>

        <div className="confirm-toast-modal__actions">
          <button
            type="button"
            className="confirm-toast-modal__cancel-btn"
            onClick={handleCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-toast-modal__confirm-btn${variant === 'danger' ? ' is-danger' : ''}`}
            onClick={handleConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
