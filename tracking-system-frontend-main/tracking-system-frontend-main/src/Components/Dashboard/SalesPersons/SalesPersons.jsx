import { useCallback, useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { toast } from 'react-toastify';
import {
  createSalesPerson,
  deleteSalesPerson,
  fetchSalesPersons,
  updateSalesPerson,
} from '../../../Services/salesPersonService';
import { getFriendlyErrorMessage } from '../../../Api/api';
import ConfirmToast from '../../../Design/ConfirmToast/ConfirmToast';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import './SalesPersons.scss';

const PANEL_CLOSE_MS = 320;

export default function SalesPersons() {
  const [salesPersons, setSalesPersons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [panelMode, setPanelMode] = useState('create');
  const [editingPerson, setEditingPerson] = useState(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const loadSalesPersons = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetchSalesPersons();
      setSalesPersons(response.data || []);
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Unable to load sales persons. Please refresh and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSalesPersons();
  }, [loadSalesPersons]);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const frame = requestAnimationFrame(() => setIsPanelActive(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelOpen]);

  const openCreatePanel = () => {
    setPanelMode('create');
    setEditingPerson(null);
    setName('');
    setNameError('');
    setIsPanelOpen(true);
  };

  const openEditPanel = (person) => {
    setPanelMode('edit');
    setEditingPerson(person);
    setName(person.name || '');
    setNameError('');
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelActive(false);
    window.setTimeout(() => {
      setIsPanelOpen(false);
      setPanelMode('create');
      setEditingPerson(null);
      setName('');
      setNameError('');
    }, PANEL_CLOSE_MS);
  };

  const validateName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name is required');
      return false;
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateName()) return;

    setIsSaving(true);
    try {
      if (panelMode === 'create') {
        await createSalesPerson({ name: name.trim() });
        toast.success('Sales person added');
      } else if (editingPerson?._id) {
        await updateSalesPerson(editingPerson._id, { name: name.trim() });
        toast.success('Sales person updated');
      }
      closePanel();
      loadSalesPersons();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to save sales person.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (person) => {
    setConfirmDialog({
      title: 'Delete sales person',
      message: `Remove "${person.name}" from the sales person list? Existing purchase orders keep their current sales person value.`,
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await deleteSalesPerson(person._id);
          toast.success('Sales person deleted');
          loadSalesPersons();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to delete sales person.'));
        }
      },
    });
  };

  return (
    <section className="sales-persons">
      <div className="sales-persons__head">
        <div>
          <h1 className="sales-persons__title">Sales Persons</h1>
          <p className="sales-persons__subtitle">
            Manage the sales person names used in purchase order forms and filters.
          </p>
        </div>
        <button type="button" className="sales-persons__add-btn" onClick={openCreatePanel}>
          + Add sales person
        </button>
      </div>

      {loadError ? (
        <ServerErrorState message={loadError} onRetry={loadSalesPersons} retryLabel="Try again" />
      ) : (
        <div className="sales-persons__table-wrap">
          {isLoading ? (
            <div className="sales-persons__state">
              <div className="sales-persons__loader" aria-hidden />
              <p>Loading sales persons...</p>
            </div>
          ) : salesPersons.length === 0 ? (
            <p className="sales-persons__empty">No sales persons yet. Add one to get started.</p>
          ) : (
            <table className="sales-persons__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesPersons.map((person) => (
                  <tr key={person._id}>
                    <td>{person.name}</td>
                    <td>
                      <span className={`sales-persons__badge${person.isActive === false ? ' is-inactive' : ''}`}>
                        {person.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="sales-persons__actions">
                        <button
                          type="button"
                          className="sales-persons__action-btn"
                          onClick={() => openEditPanel(person)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sales-persons__action-btn is-danger"
                          onClick={() => handleDelete(person)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isPanelOpen && (
        <>
          <div
            className={`sales-persons__panel-overlay${isPanelActive ? ' is-active' : ''}`}
            onClick={closePanel}
            role="presentation"
          />
          <aside className={`sales-persons__panel${isPanelActive ? ' is-active' : ''}`}>
            <div className="sales-persons__panel-header">
              <h2 className="sales-persons__panel-title">
                {panelMode === 'create' ? 'Add sales person' : 'Edit sales person'}
              </h2>
              <button
                type="button"
                className="sales-persons__panel-close"
                onClick={closePanel}
                aria-label="Close panel"
              >
                <IoMdClose size={22} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="sales-persons__field">
                <label className="sales-persons__label" htmlFor="sales-person-name">
                  Name *
                </label>
                <input
                  id="sales-person-name"
                  className="sales-persons__input"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError('');
                  }}
                  placeholder="Enter sales person name"
                  autoFocus
                />
                {nameError && <p className="sales-persons__error">{nameError}</p>}
              </div>

              <div className="sales-persons__panel-actions">
                <button type="button" className="sales-persons__cancel-btn" onClick={closePanel}>
                  Cancel
                </button>
                <button type="submit" className="sales-persons__save-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : panelMode === 'create' ? 'Add' : 'Save changes'}
                </button>
              </div>
            </form>
          </aside>
        </>
      )}

      {confirmDialog && (
        <ConfirmToast
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onConfirm={() => {
            confirmDialog.action();
            setConfirmDialog(null);
          }}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </section>
  );
}
