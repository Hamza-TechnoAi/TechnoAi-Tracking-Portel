import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IoMdClose } from 'react-icons/io';
import { MdCheck, MdClose, MdEdit, MdMoreVert } from 'react-icons/md';
import { toast } from 'react-toastify';
import { LINE_STATUSES, LINE_CURRENCIES } from '../../../Constants/purchaseOrders';
import { EDIT_ROLES } from '../../../Constants/roles';
import { useAuth } from '../../../Context/AuthContext';
import {
  addLineItem,
  createPurchaseOrder,
  deletePurchaseOrder,
  fetchPurchaseOrderActivity,
  fetchPurchaseOrderById,
  fetchPurchaseOrders,
  removeLineItem,
  updateLineItem,
  updatePurchaseOrder,
} from '../../../Services/purchaseOrderService';
import { fetchSalesPersons } from '../../../Services/salesPersonService';
import ConfirmToast from '../../../Design/ConfirmToast/ConfirmToast';
import ServerErrorState from '../../Common/ServerErrorState/ServerErrorState';
import { getFriendlyErrorMessage } from '../../../Api/api';
import {
  formatPoDate,
  formatRelativeActivityTime,
  isValidEmail,
  toDateInputValue,
  toIsoDate,
} from '../../../Utils/formatters';
import PoDateInput from './PoDateInput';
import PoFilters from '../PoFilters/PoFilters';
import { buildPoFilterParams, INITIAL_PO_FILTERS } from '../../../Utils/poFilters';
import ShipmentTrackingLink from '../../Common/ShipmentTrackingLink/ShipmentTrackingLink';
import { matchSalesPerson, matchDeliveryLines } from '../../../Utils/poPdfParser';
import './PurchaseOrders.scss';

const PANEL_CLOSE_MS = 320;
const PAGE_SIZE = 15;

const INITIAL_PO_FORM = {
  poNumber: '',
  soNumber: '',
  poDate: '',
  paymentTerms: '',
  overallPoEta: '',
  actualPoClosingDate: '',
  clientName: '',
  salesPerson: '',
  contactPerson: '',
  contactPersonEmail: '',
  subject: '',
  internalNotes: '',
};

const EMPTY_LINE = {
  lineNumber: '',
  description: '',
  quantity: '',
  unitPrice: '',
  currency: 'AED',
  status: 'Processing',
  eta: '',
  internalRemarks: '',
  shipmentTrackingLink: '',
};

const validateLineFields = (line) => {
  const errors = {};
  if (!line.lineNumber) errors.lineNumber = 'Line number is required';
  if (!line.description?.trim()) errors.description = 'Description is required';
  if (line.quantity === '' || Number(line.quantity) < 0) {
    errors.quantity = 'Valid quantity is required';
  }
  if (line.unitPrice === '' || Number(line.unitPrice) < 0) {
    errors.unitPrice = 'Valid unit price is required';
  }
  if (!line.currency) errors.currency = 'Currency is required';
  if (!line.status) errors.status = 'Status is required';
  if (!line.eta) errors.eta = 'ETA is required';
  return errors;
};

const poFormFromRecord = (po) => ({
  poNumber: po.poNumber || '',
  soNumber: po.soNumber || '',
  poDate: toDateInputValue(po.poDate),
  paymentTerms: po.paymentTerms || '',
  overallPoEta: toDateInputValue(po.overallPoEta),
  actualPoClosingDate: toDateInputValue(po.actualPoClosingDate),
  clientName: po.clientName || '',
  salesPerson: po.salesPerson || '',
  contactPerson: po.contactPerson || '',
  contactPersonEmail: po.contactPersonEmail || '',
  subject: po.subject || '',
  internalNotes: po.internalNotes || '',
});

const lineFormFromRecord = (line) => ({
  lineNumber: String(line.lineNumber ?? ''),
  description: line.description || '',
  quantity: String(line.quantity ?? ''),
  unitPrice: String(line.unitPrice ?? ''),
  currency: line.currency || 'AED',
  status: line.status || 'Processing',
  eta: toDateInputValue(line.eta),
  internalRemarks: line.internalRemarks || '',
  shipmentTrackingLink: line.shipmentTrackingLink || '',
});

const buildLinePayload = (line) => ({
  lineNumber: Number(line.lineNumber),
  description: line.description.trim(),
  quantity: Number(line.quantity),
  unitPrice: Number(line.unitPrice),
  currency: line.currency,
  status: line.status,
  eta: toIsoDate(line.eta),
  internalRemarks: line.internalRemarks?.trim() || '',
  shipmentTrackingLink: line.shipmentTrackingLink?.trim() || '',
});

export default function PurchaseOrders() {
  const location = useLocation();
  const { user } = useAuth();
  const canEdit = EDIT_ROLES.includes(user?.role);
  const canDelete = EDIT_ROLES.includes(user?.role);

  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(INITIAL_PO_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_PO_FILTERS);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isPanelActive, setIsPanelActive] = useState(false);
  const [panelMode, setPanelMode] = useState(null);
  const [selectedPo, setSelectedPo] = useState(null);
  const [detailTab, setDetailTab] = useState('lines');

  const [formData, setFormData] = useState(INITIAL_PO_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [useAutomaticClosingDate, setUseAutomaticClosingDate] = useState(false);
  const [createLines, setCreateLines] = useState([]);
  const [createLineErrors, setCreateLineErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [pdfError, setPdfError] = useState('');
  const pdfRequest = useRef(0);
  const poPdfInput = useRef(null);
  const soPdfInput = useRef(null);
  const deliveryPdfInput = useRef(null);

  const handleDeliveryPdfUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++pdfRequest.current;
    setIsPdfLoading(true);
    setPdfError('');
    setPdfResult(null);
    try {
      const { importPoPdf } = await import('../../../Utils/importPoPdf');
      const result = await importPoPdf(file, 'delivery');
      if (request !== pdfRequest.current) return;
      const { updates, additions, warnings } = matchDeliveryLines(result, createLines);
      const preparedBy = result.fields.salesPerson?.trim();
      const matchedSalesPerson = preparedBy && matchSalesPerson(preparedBy, salesPersonOptions);
      if (preparedBy) {
        setFormData(previous => ({ ...previous, salesPerson: matchedSalesPerson || preparedBy }));
        setFormErrors(previous => ({ ...previous, salesPerson: '' }));
      }
      setCreateLines(previous => [
        ...previous.map((line,index) => {
          const update = updates.find(item => item.index === index);
          return update ? { ...line, eta: update.eta, status: update.status } : line;
        }),
        ...additions.map(line => ({ ...EMPTY_LINE, ...line, status: 'Delivered' })),
      ]);
      setCreateLineErrors({});
      setPdfResult({ ...result, filename: file.name, warnings: [
        `${updates.length} matching lines updated and ${additions.length} missing lines added as Delivered. Review before creating the PO.`,
        ...(preparedBy
          ? [`Sales person set to ${matchedSalesPerson || preparedBy} from Prepared by.`]
          : []),
        ...warnings,
      ] });
    } catch (error) {
      if (request === pdfRequest.current) setPdfError(error.message || 'Unable to read delivery PDF.');
    } finally {
      if (request === pdfRequest.current) setIsPdfLoading(false);
    }
  };

  const handlePdfUpload = async (event, documentType = 'po') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const request = ++pdfRequest.current;
    setIsPdfLoading(true);
    setPdfError('');
    setPdfResult(null);
    try {
      const { importPoPdf } = await import('../../../Utils/importPoPdf');
      const result = await importPoPdf(file, documentType);
      if (request !== pdfRequest.current) return;
      if (documentType === 'so') {
        const soNumber = result.fields.soNumber;
        if (!soNumber) throw new Error('SO number or Quotation Ref No. was not found in this PDF. Enter the SO number manually.');
        const extractedName = result.fields.salesPerson;
        const matchingName = extractedName && matchSalesPerson(extractedName, salesPersonOptions);
        const soFields = {
          ...result.fields,
          soNumber,
          // An SO is not the source of the customer's PO number.
          poNumber: '',
          salesPerson: matchingName || extractedName || '',
        };
        setFormData(previous => Object.fromEntries(Object.entries(previous).map(([key, value]) => [
          key,
          key === 'salesPerson' && soFields.salesPerson ? soFields.salesPerson : value || soFields[key] || '',
        ])));
        setCreateLines(previous => previous.length
          ? previous
          : result.lines.map(line => ({ ...EMPTY_LINE, ...line })));
        setFormErrors({});
        setCreateLineErrors({});
        setPdfResult({ ...result, fields: soFields, filename: file.name,
          warnings: [
            `SO number ${soNumber}, available form details, and ${result.lines.length} line items imported.`,
            ...(extractedName && !matchingName
              ? [`Prepared by "${extractedName}" was not found in the sales person list. Select it manually.`]
              : []),
            ...result.warnings,
          ] });
        return;
      }
      if (result.fields.salesPerson) {
        const extractedName = result.fields.salesPerson;
        const matchingName = matchSalesPerson(extractedName, salesPersonOptions);
        result.fields.salesPerson = matchingName || extractedName;
        if (!matchingName) result.warnings.push(`Sales person set to "${extractedName}" from Prepared by.`);
      }
      // Overall PO ETA is a manual business decision; never populate it from a PDF.
      // Preserve other user-entered values and only fill empty fields from the import.
      setFormData(prev => Object.fromEntries(Object.entries(prev).map(([key, value]) =>
        [key, key === 'overallPoEta'
          ? value
          : key === 'salesPerson' && result.fields.salesPerson
            ? result.fields.salesPerson
            : value || result.fields[key] || ''])));
      setCreateLines(prev => prev.length ? prev : result.lines.map(line => ({ ...EMPTY_LINE, ...line })));
      setPdfResult({ ...result, filename: file.name });
      setFormErrors({});
      setCreateLineErrors({});
    } catch (error) {
      if (request === pdfRequest.current) setPdfError(error.message || 'Unable to read this PDF.');
    } finally {
      if (request === pdfRequest.current) setIsPdfLoading(false);
    }
  };

  const [lineForm, setLineForm] = useState(EMPTY_LINE);
  const [lineFormMode, setLineFormMode] = useState(null);
  const [lineFormErrors, setLineFormErrors] = useState({});
  const [isLineSaving, setIsLineSaving] = useState(false);
  const [statusEditLineNumber, setStatusEditLineNumber] = useState(null);
  const [statusDraft, setStatusDraft] = useState('');
  const [isStatusSaving, setIsStatusSaving] = useState(false);

  const [activity, setActivity] = useState([]);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [salesPersonOptions, setSalesPersonOptions] = useState([]);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  const loadPurchaseOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await fetchPurchaseOrders(
        buildPoFilterParams(appliedFilters, page, PAGE_SIZE),
      );
      setPurchaseOrders(response.data || []);
      setPagination(response.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (error) {
      setLoadError(getFriendlyErrorMessage(error, 'Unable to load purchase orders. Please refresh the page and try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPurchaseOrders(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPurchaseOrders]);

  useEffect(() => {
    fetchSalesPersons({ activeOnly: 'true' })
      .then((response) => {
        const names = (response.data || []).map((person) => person.name).filter(Boolean);
        setSalesPersonOptions(names);
      })
      .catch(() => setSalesPersonOptions([]));
  }, []);

  useEffect(() => {
    if (!isPanelOpen) return undefined;
    const frame = requestAnimationFrame(() => setIsPanelActive(true));
    return () => cancelAnimationFrame(frame);
  }, [isPanelOpen]);

  useEffect(() => {
    if (!openActionMenuId) return undefined;

    const closeActionMenu = (event) => {
      if (!actionMenuRef.current?.contains(event.target)) setOpenActionMenuId(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenActionMenuId(null);
    };

    document.addEventListener('mousedown', closeActionMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeActionMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openActionMenuId]);

  const closePanel = () => {
    pdfRequest.current += 1;
    setIsPdfLoading(false);
    setPdfResult(null);
    setPdfError('');
    setIsPanelActive(false);
    window.setTimeout(() => {
      setIsPanelOpen(false);
      setPanelMode(null);
      setSelectedPo(null);
      setFormData(INITIAL_PO_FORM);
      setFormErrors({});
      setUseAutomaticClosingDate(false);
      setCreateLines([]);
      setCreateLineErrors({});
      setLineForm(EMPTY_LINE);
      setLineFormMode(null);
      setLineFormErrors({});
      setStatusEditLineNumber(null);
      setStatusDraft('');
      setActivity([]);
      setDetailTab('lines');
    }, PANEL_CLOSE_MS);
  };

  const openCreatePanel = () => {
    setPdfResult(null);
    setPdfError('');
    setPanelMode('create');
    setFormData(INITIAL_PO_FORM);
    setFormErrors({});
    setUseAutomaticClosingDate(false);
    setCreateLines([]);
    setCreateLineErrors({});
    setIsPanelOpen(true);
  };

  const refreshSelectedPo = async (poId) => {
    const response = await fetchPurchaseOrderById(poId);
    setSelectedPo(response.data);
    return response.data;
  };

  const openDetailPanel = async (poId) => {
    try {
      const po = await refreshSelectedPo(poId);
      setSelectedPo(po);
      setPanelMode('detail');
      setDetailTab('lines');
      setIsPanelOpen(true);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to load purchase order.'));
    }
  };

  useEffect(() => {
    const poId = new URLSearchParams(location.search).get('po');
    if (!poId) return;
    let cancelled = false;
    fetchPurchaseOrderById(poId).then(response => {
      if (cancelled) return;
      setSelectedPo(response.data);
      setPanelMode('detail');
      setDetailTab('lines');
      setIsPanelOpen(true);
    }).catch(error => {
      if (!cancelled) toast.error(getFriendlyErrorMessage(error, 'This purchase order is no longer available.'));
    });
    return () => { cancelled = true; };
  }, [location.search, location.key]);

  const openEditPanel = () => {
    if (!selectedPo) return;
    setFormData(poFormFromRecord(selectedPo));
    setFormErrors({});
    setUseAutomaticClosingDate(false);
    setPanelMode('edit');
  };

  const openEditPanelById = async (poId) => {
    try {
      const po = await refreshSelectedPo(poId);
      setFormData(poFormFromRecord(po));
      setFormErrors({});
      setUseAutomaticClosingDate(false);
      setPanelMode('edit');
      setIsPanelOpen(true);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to load purchase order.'));
    }
  };

  const handleResetClosingDateToAutomatic = () => {
    setFormData((prev) => ({ ...prev, actualPoClosingDate: '' }));
    setUseAutomaticClosingDate(true);
    setFormErrors((prev) => ({ ...prev, actualPoClosingDate: '' }));
  };

  const loadActivity = async (poId) => {
    setIsActivityLoading(true);
    try {
      const response = await fetchPurchaseOrderActivity(poId, { limit: 50 });
      setActivity(response.data || []);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to load activity.'));
    } finally {
      setIsActivityLoading(false);
    }
  };

  useEffect(() => {
    if (panelMode === 'detail' && detailTab === 'activity' && selectedPo?._id) {
      const timer = window.setTimeout(() => { void loadActivity(selectedPo._id); }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [panelMode, detailTab, selectedPo?._id]);

  const handleFormChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
    setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validatePoForm = () => {
    const errors = {};
    if (!formData.poNumber.trim()) errors.poNumber = 'PO number is required';
    if (!formData.soNumber.trim()) errors.soNumber = 'SO number is required';
    if (!formData.poDate) errors.poDate = 'PO date is required';
    if (!formData.clientName.trim()) errors.clientName = 'Client name is required';
    if (!formData.salesPerson.trim()) errors.salesPerson = 'Sales person is required';
    if (!formData.contactPerson.trim()) errors.contactPerson = 'Contact person is required';
    if (!formData.contactPersonEmail.trim()) {
      errors.contactPersonEmail = 'Contact person email is required';
    } else if (!isValidEmail(formData.contactPersonEmail)) {
      errors.contactPersonEmail = 'Enter a valid email address';
    }
    if (!formData.paymentTerms.trim()) errors.paymentTerms = 'Payment terms are required';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildPoPayload = (includeLines = false) => {
    const payload = {
      poNumber: formData.poNumber.trim(),
      soNumber: formData.soNumber.trim(),
      poDate: toIsoDate(formData.poDate),
      paymentTerms: formData.paymentTerms.trim(),
      clientName: formData.clientName.trim(),
      salesPerson: formData.salesPerson.trim(),
      contactPerson: formData.contactPerson.trim(),
      contactPersonEmail: formData.contactPersonEmail.trim(),
      subject: formData.subject.trim(),
      internalNotes: formData.internalNotes.trim(),
    };

    if (formData.overallPoEta) payload.overallPoEta = toIsoDate(formData.overallPoEta);

    if (useAutomaticClosingDate) {
      payload.useAutomaticClosingDate = true;
    } else if (formData.actualPoClosingDate) {
      payload.actualPoClosingDate = toIsoDate(formData.actualPoClosingDate);
    }

    if (includeLines && createLines.length > 0) {
      payload.lines = createLines.map(buildLinePayload);
    }

    return payload;
  };

  const handleCreatePo = async (event) => {
    event.preventDefault();
    if (isPdfLoading || !validatePoForm()) return;

    if (createLines.length > 0) {
      const nextErrors = {};
      let hasLineErrors = false;

      createLines.forEach((line, index) => {
        const errors = validateLineFields(line);
        if (Object.keys(errors).length > 0) {
          nextErrors[index] = errors;
          hasLineErrors = true;
        }
      });

      setCreateLineErrors(nextErrors);
      if (hasLineErrors) return;
    }

    setIsSaving(true);
    try {
      await createPurchaseOrder(buildPoPayload(true));
      toast.success('Purchase order created successfully');
      closePanel();
      loadPurchaseOrders();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to create purchase order.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePo = async (event) => {
    event.preventDefault();
    if (!validatePoForm() || !selectedPo) return;

    setIsSaving(true);
    try {
      await updatePurchaseOrder(selectedPo._id, buildPoPayload(false));
      toast.success('Purchase order updated successfully');
      await refreshSelectedPo(selectedPo._id);
      setPanelMode('detail');
      loadPurchaseOrders();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to update purchase order.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePo = (poId) => {
    setConfirmDialog({
      title: 'Delete purchase order',
      message: 'Delete this purchase order permanently? All line items and activity history will be removed.',
      confirmLabel: 'Delete',
      action: async () => {
        try {
          await deletePurchaseOrder(poId);
          toast.success('Purchase order deleted');
          if (selectedPo?._id === poId) closePanel();
          loadPurchaseOrders();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to delete purchase order.'));
        }
      },
    });
  };

  const handleApplyFilters = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setPage(1);
    setAppliedFilters(INITIAL_PO_FILTERS);
  };

  const handleCreateLineChange = (index, field) => (event) => {
    setCreateLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: event.target.value };
      return next;
    });
    setCreateLineErrors((prev) => {
      if (!prev[index]?.[field]) return prev;
      const next = { ...prev };
      next[index] = { ...next[index], [field]: '' };
      if (Object.values(next[index]).every((value) => !value)) {
        delete next[index];
      }
      return next;
    });
  };

  const addCreateLineRow = () => {
    setCreateLines((prev) => [...prev, { ...EMPTY_LINE, lineNumber: String((prev.length + 1) * 10) }]);
  };

  const removeCreateLineRow = (index) => {
    setCreateLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineFormChange = (field) => (event) => {
    setLineForm((prev) => ({ ...prev, [field]: event.target.value }));
    setLineFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateLineForm = () => {
    const errors = validateLineFields(lineForm);
    setLineFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const cancelStatusEdit = () => {
    setStatusEditLineNumber(null);
    setStatusDraft('');
  };

  const startStatusEdit = (line) => {
    setStatusEditLineNumber(line.lineNumber);
    setStatusDraft(line.status || 'Processing');
  };

  const handleConfirmStatusChange = async (lineNumber) => {
    if (!selectedPo || !statusDraft) return;

    const currentLine = selectedPo.lines?.find((line) => line.lineNumber === lineNumber);
    if (!currentLine || currentLine.status === statusDraft) {
      cancelStatusEdit();
      return;
    }

    setIsStatusSaving(true);
    try {
      await updateLineItem(selectedPo._id, lineNumber, { status: statusDraft });
      toast.success(`Line ${lineNumber} status updated`);
      await refreshSelectedPo(selectedPo._id);
      loadPurchaseOrders();
      cancelStatusEdit();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to update line status.'));
    } finally {
      setIsStatusSaving(false);
    }
  };

  const startAddLine = () => {
    const nextLineNumber = selectedPo?.lines?.length
      ? Math.max(...selectedPo.lines.map((l) => l.lineNumber)) + 10
      : 10;
    setLineForm({ ...EMPTY_LINE, lineNumber: String(nextLineNumber) });
    setLineFormMode('add');
    setLineFormErrors({});
    cancelStatusEdit();
  };

  const startEditLine = (line) => {
    setLineForm(lineFormFromRecord(line));
    setLineFormMode('edit');
    setLineFormErrors({});
    cancelStatusEdit();
  };

  const cancelLineForm = () => {
    setLineForm(EMPTY_LINE);
    setLineFormMode(null);
    setLineFormErrors({});
  };

  const handleSaveLine = async (event) => {
    event.preventDefault();
    if (!validateLineForm() || !selectedPo) return;

    setIsLineSaving(true);
    try {
      const payload = buildLinePayload(lineForm);

      if (lineFormMode === 'add') {
        await addLineItem(selectedPo._id, payload);
        toast.success('Line item added');
      } else {
        await updateLineItem(selectedPo._id, Number(lineForm.lineNumber), payload);
        toast.success('Line item updated');
      }

      await refreshSelectedPo(selectedPo._id);
      loadPurchaseOrders();
      cancelLineForm();
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error, 'Failed to save line item.'));
    } finally {
      setIsLineSaving(false);
    }
  };

  const handleRemoveLine = (lineNumber) => {
    if (!selectedPo) return;

    setConfirmDialog({
      title: 'Remove line item',
      message: `Remove line ${lineNumber} from this purchase order? This action cannot be undone.`,
      confirmLabel: 'Remove',
      action: async () => {
        try {
          await removeLineItem(selectedPo._id, lineNumber);
          toast.success('Line item removed');
          await refreshSelectedPo(selectedPo._id);
          loadPurchaseOrders();
        } catch (error) {
          toast.error(getFriendlyErrorMessage(error, 'Failed to remove line item.'));
        }
      },
    });
  };

  const salesPersonSelectOptions = useMemo(() => {
    return [...new Set([
      ...salesPersonOptions,
      formData.salesPerson,
    ].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [salesPersonOptions, formData.salesPerson]);

  const renderPoFormFields = () => (
    <div className="po-management__form-grid">
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="poNumber">PO number *</label>
        <input id="poNumber" className="po-management__input" value={formData.poNumber} onChange={handleFormChange('poNumber')} />
        {formErrors.poNumber && <p className="po-management__error">{formErrors.poNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="soNumber">SO number *</label>
        <input id="soNumber" className="po-management__input" value={formData.soNumber} onChange={handleFormChange('soNumber')} />
        {formErrors.soNumber && <p className="po-management__error">{formErrors.soNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="poDate">PO date *</label>
        <PoDateInput
          id="poDate"
          value={formData.poDate}
          onChange={(nextValue) => {
            setFormData((prev) => ({ ...prev, poDate: nextValue }));
            setFormErrors((prev) => ({ ...prev, poDate: '' }));
          }}
          error={formErrors.poDate}
        />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="clientName">Client name *</label>
        <input id="clientName" className="po-management__input" value={formData.clientName} onChange={handleFormChange('clientName')} />
        {formErrors.clientName && <p className="po-management__error">{formErrors.clientName}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="salesPerson">Sales person *</label>
        <select
          id="salesPerson"
          className="po-management__select"
          value={formData.salesPerson}
          onChange={handleFormChange('salesPerson')}
        >
          <option value="">Select sales person</option>
          {salesPersonSelectOptions.map((person) => (
            <option key={person} value={person}>{person}</option>
          ))}
        </select>
        {formErrors.salesPerson && <p className="po-management__error">{formErrors.salesPerson}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="paymentTerms">Payment terms *</label>
        <input id="paymentTerms" className="po-management__input" value={formData.paymentTerms} onChange={handleFormChange('paymentTerms')} />
        {formErrors.paymentTerms && <p className="po-management__error">{formErrors.paymentTerms}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="contactPerson">Contact person *</label>
        <input id="contactPerson" className="po-management__input" value={formData.contactPerson} onChange={handleFormChange('contactPerson')} />
        {formErrors.contactPerson && <p className="po-management__error">{formErrors.contactPerson}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="contactPersonEmail">Contact person email *</label>
        <input
          id="contactPersonEmail"
          type="email"
          className="po-management__input"
          value={formData.contactPersonEmail}
          onChange={handleFormChange('contactPersonEmail')}
        />
        {formErrors.contactPersonEmail && <p className="po-management__error">{formErrors.contactPersonEmail}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor="overallPoEta">Overall PO ETA</label>
        <PoDateInput
          id="overallPoEta"
          value={formData.overallPoEta}
          onChange={(nextValue) => {
            setFormData((prev) => ({ ...prev, overallPoEta: nextValue }));
            setFormErrors((prev) => ({ ...prev, overallPoEta: '' }));
          }}
          error={formErrors.overallPoEta}
        />
      </div>
      <div className="po-management__field">
        <div className="po-management__label-row">
          <label className="po-management__label" htmlFor="actualPoClosingDate">
            Actual closing date
          </label>
          <button
            type="button"
            className="po-management__text-btn"
            onClick={handleResetClosingDateToAutomatic}
          >
            Reset to automatic
          </button>
        </div>
        <PoDateInput
          id="actualPoClosingDate"
          value={formData.actualPoClosingDate}
          onChange={(nextValue) => {
            setFormData((prev) => ({ ...prev, actualPoClosingDate: nextValue }));
            setUseAutomaticClosingDate(false);
            setFormErrors((prev) => ({ ...prev, actualPoClosingDate: '' }));
          }}
          error={formErrors.actualPoClosingDate}
        />
        <p className="po-management__hint">
          {useAutomaticClosingDate
            ? 'Automatic mode: when all lines are Delivered, closing date will be set to today.'
            : 'Optional. Leave empty for automatic (today when all lines are Delivered). For historical closed POs, enter the real closing date.'}
        </p>
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor="subject">Subject *</label>
        <input id="subject" className="po-management__input" value={formData.subject} onChange={handleFormChange('subject')} />
        {formErrors.subject && <p className="po-management__error">{formErrors.subject}</p>}
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor="internalNotes">Internal notes</label>
        <textarea id="internalNotes" className="po-management__textarea" rows={3} value={formData.internalNotes} onChange={handleFormChange('internalNotes')} />
      </div>
    </div>
  );

  const renderLineFormFields = ({
    prefix = 'line',
    line,
    onChange,
    errors = {},
    disableLineNumber = false,
  }) => (
    <div className="po-management__line-form-grid">
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-lineNumber`}>Line # *</label>
        <input
          id={`${prefix}-lineNumber`}
          className="po-management__input"
          value={line.lineNumber}
          onChange={onChange('lineNumber')}
          disabled={disableLineNumber}
        />
        {errors.lineNumber && <p className="po-management__error">{errors.lineNumber}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-quantity`}>Quantity *</label>
        <input id={`${prefix}-quantity`} type="number" min="0" className="po-management__input" value={line.quantity} onChange={onChange('quantity')} />
        {errors.quantity && <p className="po-management__error">{errors.quantity}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-unitPrice`}>Unit price *</label>
        <input id={`${prefix}-unitPrice`} type="number" min="0" step="0.01" className="po-management__input" value={line.unitPrice} onChange={onChange('unitPrice')} />
        {errors.unitPrice && <p className="po-management__error">{errors.unitPrice}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-currency`}>Currency *</label>
        <select id={`${prefix}-currency`} className="po-management__select" value={line.currency} onChange={onChange('currency')}>
          {LINE_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>{currency}</option>
          ))}
        </select>
        {errors.currency && <p className="po-management__error">{errors.currency}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-status`}>Status *</label>
        <select id={`${prefix}-status`} className="po-management__select" value={line.status} onChange={onChange('status')}>
          {LINE_STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        {errors.status && <p className="po-management__error">{errors.status}</p>}
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor={`${prefix}-description`}>Description *</label>
        <input id={`${prefix}-description`} className="po-management__input" value={line.description} onChange={onChange('description')} />
        {errors.description && <p className="po-management__error">{errors.description}</p>}
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-eta`}>ETA *</label>
        <PoDateInput
          id={`${prefix}-eta`}
          value={line.eta}
          onChange={(nextValue) => onChange('eta')({ target: { value: nextValue } })}
          error={errors.eta}
        />
      </div>
      <div className="po-management__field">
        <label className="po-management__label" htmlFor={`${prefix}-remarks`}>Internal remarks</label>
        <input id={`${prefix}-remarks`} className="po-management__input" value={line.internalRemarks} onChange={onChange('internalRemarks')} />
      </div>
      <div className="po-management__field po-management__field--full">
        <label className="po-management__label" htmlFor={`${prefix}-shipmentTrackingLink`}>Shipment tracking link (optional)</label>
        <input
          id={`${prefix}-shipmentTrackingLink`}
          className="po-management__input"
          value={line.shipmentTrackingLink}
          onChange={onChange('shipmentTrackingLink')}
          placeholder="Enter tracking link or ID"
        />
      </div>
    </div>
  );

  const panelTitle = {
    create: 'Create Purchase Order',
    edit: 'Edit Purchase Order',
    detail: selectedPo ? `PO ${selectedPo.poNumber}` : 'Purchase Order',
  }[panelMode] || '';

  const isWidePanel = panelMode === 'create';
  const isDetailPanel = panelMode === 'detail';

  return (
    <section className="po-management">
      <div className="po-management__head">
        <div>
          <h1 className="po-management__title">Purchase Orders</h1>
          <p className="po-management__subtitle">
            Manage purchase orders, line items, and shipment status.
          </p>
        </div>
        {canEdit && (
          <button type="button" className="po-management__add-btn" onClick={openCreatePanel}>
            + Create PO
          </button>
        )}
      </div>

      <PoFilters
        mode="search"
        filters={filters}
        onChange={setFilters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {loadError ? (
        <ServerErrorState message={loadError} onRetry={loadPurchaseOrders} retryLabel="Try again" />
      ) : (
        <div className="po-management__table-wrap">
          {isLoading ? (
            <div className="po-management__state">
              <div className="po-management__loader" aria-hidden />
              <p>Loading purchase orders...</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <p className="po-management__empty">No purchase orders found.</p>
          ) : (
            <table className="po-management__table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>SO Number</th>
                  <th>Client</th>
                  <th>PO Date</th>
                  <th>Status</th>
                  <th>Lines</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po._id}>
                    <td>{po.poNumber}</td>
                    <td>{po.soNumber}</td>
                    <td>{po.clientName}</td>
                    <td>{formatPoDate(po.poDate)}</td>
                    <td>
                      <span className={`po-management__badge${po.poStatus === 'Closed' ? ' is-closed' : ''}`}>
                        {po.poStatus}
                      </span>
                    </td>
                    <td>{po.numberOfLines ?? po.lines?.length ?? 0}</td>
                    <td>
                      <div
                        ref={openActionMenuId === po._id ? actionMenuRef : null}
                        className="po-management__action-menu"
                      >
                        <button
                          type="button"
                          className="po-management__more-btn"
                          aria-label={`Actions for PO ${po.poNumber}`}
                          aria-expanded={openActionMenuId === po._id}
                          aria-haspopup="menu"
                          onClick={() => setOpenActionMenuId((current) => current === po._id ? null : po._id)}
                        >
                          <MdMoreVert aria-hidden="true" />
                        </button>
                        {openActionMenuId === po._id && (
                          <div className="po-management__action-dropdown" role="menu">
                            <button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); openDetailPanel(po._id); }}>
                              View
                            </button>
                            {canEdit && (
                              <button type="button" role="menuitem" onClick={() => { setOpenActionMenuId(null); openEditPanelById(po._id); }}>
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button type="button" className="is-danger" role="menuitem" onClick={() => { setOpenActionMenuId(null); handleDeletePo(po._id); }}>
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="po-management__pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {isPanelOpen && (
        <>
          <div className={`po-management__panel-overlay${isPanelActive ? ' is-active' : ''}`} onClick={closePanel} role="presentation" />
          <aside className={`po-management__panel${isPanelActive ? ' is-active' : ''}${isWidePanel ? ' is-wide' : ''}${isDetailPanel ? ' is-detail' : ''}`}>
            <div className="po-management__panel-header">
              <h2 className="po-management__panel-title">{panelTitle}</h2>
              <button type="button" className="po-management__panel-close" onClick={closePanel} aria-label="Close panel">
                <IoMdClose size={22} />
              </button>
            </div>

            {(panelMode === 'create' || panelMode === 'edit') && (
              <form onSubmit={panelMode === 'create' ? handleCreatePo : handleUpdatePo}>
                {panelMode === 'create' && (
                  <section className="po-management__pdf-import" aria-busy={isPdfLoading}>
                    <div className="po-management__pdf-buttons">
                      <button type="button" className="po-management__pdf-button" onClick={() => poPdfInput.current?.click()} disabled={isPdfLoading || isSaving}>
                        Upload PO PDF
                      </button>
                      <button type="button" className="po-management__pdf-button is-secondary" onClick={() => soPdfInput.current?.click()} disabled={isPdfLoading || isSaving}>
                        Upload SO PDF
                      </button>
                      <button type="button" className="po-management__pdf-button is-secondary" onClick={() => deliveryPdfInput.current?.click()} disabled={isPdfLoading || isSaving || !createLines.length} title={!createLines.length ? 'Add PO lines first' : 'Upload delivery PDF'}>
                        Upload Delivery PDF
                      </button>
                    </div>
                    <input ref={poPdfInput} id="po-pdf-upload" type="file" accept=".pdf,application/pdf" onChange={handlePdfUpload} hidden disabled={isPdfLoading || isSaving} />
                    <input ref={soPdfInput} id="so-pdf-upload" type="file" accept=".pdf,application/pdf" onChange={event => handlePdfUpload(event, 'so')} hidden disabled={isPdfLoading || isSaving} />
                    <input ref={deliveryPdfInput} id="po-delivery-pdf" type="file" accept=".pdf,application/pdf" onChange={handleDeliveryPdfUpload} hidden disabled={isPdfLoading || isSaving || !createLines.length} />
                    {isPdfLoading && <p role="status">Reading PDF...</p>}
                    {pdfError && <p role="alert" className="po-management__error">{pdfError}</p>}
                    {pdfResult && <div role="status">
                      <details>
                        <summary>Import details</summary>
                        <p className="po-management__pdf-filename">{pdfResult.filename}</p>
                        {pdfResult.warnings.map(message => <p key={message}>{message}</p>)}
                        <details><summary>Extracted text</summary><pre>{pdfResult.text}</pre></details>
                      </details>
                    </div>}
                  </section>
                )}
                {renderPoFormFields()}

                {panelMode === 'create' && (
                  <div className="po-management__lines-section">
                    <div className="po-management__lines-head">
                      <h3 className="po-management__section-title">Line items (optional)</h3>
                      <button type="button" className="po-management__action-btn" onClick={addCreateLineRow}>
                        + Add line item
                      </button>
                    </div>
                    {createLines.map((line, index) => (
                      <div key={index} className="po-management__line-form">
                        <div className="po-management__line-form-header">
                          <h4 className="po-management__section-title">Line item {index + 1}</h4>
                          <button
                            type="button"
                            className="po-management__action-btn is-danger"
                            onClick={() => removeCreateLineRow(index)}
                          >
                            Remove
                          </button>
                        </div>
                        {renderLineFormFields({
                          prefix: `create-line-${index}`,
                          line,
                          onChange: (field) => handleCreateLineChange(index, field),
                          errors: createLineErrors[index] || {},
                        })}
                      </div>
                    ))}
                  </div>
                )}

                <div className="po-management__panel-actions">
                  {panelMode === 'edit' && (
                    <button type="button" className="po-management__cancel-btn" onClick={() => setPanelMode('detail')}>
                      Back
                    </button>
                  )}
                  {panelMode === 'create' && (
                    <button type="button" className="po-management__cancel-btn" onClick={closePanel}>Cancel</button>
                  )}
                  <button type="submit" className="po-management__save-btn" disabled={isSaving || isPdfLoading}>
                    {isSaving ? 'Saving...' : panelMode === 'create' ? 'Create PO' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {panelMode === 'detail' && selectedPo && (
              <div className="po-management__detail">
                <div className="po-management__detail-header">
                  <div className="po-management__detail-meta">
                    <span className={`po-management__badge${selectedPo.poStatus === 'Closed' ? ' is-closed' : ''}`}>
                      {selectedPo.poStatus}
                    </span>
                    <span className="po-management__detail-text">{selectedPo.clientName}</span>
                    <span className="po-management__detail-text">SO: {selectedPo.soNumber}</span>
                  </div>
                  {canEdit && (
                    <button type="button" className="po-management__action-btn" onClick={openEditPanel}>
                      Edit header
                    </button>
                  )}
                </div>

                <div className="po-management__info-grid">
                  <div><span>PO Date</span><strong>{formatPoDate(selectedPo.poDate)}</strong></div>
                  <div><span>Overall ETA</span><strong>{formatPoDate(selectedPo.overallPoEta)}</strong></div>
                  <div><span>Actual closing</span><strong>{formatPoDate(selectedPo.actualPoClosingDate)}</strong></div>
                  <div><span>Sales person</span><strong>{selectedPo.salesPerson || '—'}</strong></div>
                  <div><span>Supplier name</span><strong>{selectedPo.supplier || '-'}</strong></div>
                  <div><span>Supplier contact</span><strong>{selectedPo.supplierContact || '-'}</strong></div>
                  <div><span>Supplier phone</span><strong>{selectedPo.supplierPhone || '-'}</strong></div>
                  <div><span>Supplier email</span><strong>{selectedPo.supplierEmail || '-'}</strong></div>
                  <div><span>Payment terms</span><strong>{selectedPo.paymentTerms || '—'}</strong></div>
                  <div><span>Contact person</span><strong>{selectedPo.contactPerson || '—'}</strong></div>
                  <div><span>Contact email</span><strong>{selectedPo.contactPersonEmail || '—'}</strong></div>
                  <div className="po-management__info-full"><span>Subject</span><strong>{selectedPo.subject || '—'}</strong></div>
                  <div className="po-management__info-full"><span>Internal notes</span><strong>{selectedPo.internalNotes || '—'}</strong></div>
                </div>

                <div className="po-management__tabs">
                  <button type="button" className={`po-management__tab${detailTab === 'lines' ? ' is-active' : ''}`} onClick={() => setDetailTab('lines')}>Line items</button>
                  <button type="button" className={`po-management__tab${detailTab === 'activity' ? ' is-active' : ''}`} onClick={() => setDetailTab('activity')}>Activity</button>
                </div>

                {detailTab === 'lines' && (
                  <div className="po-management__lines-section">
                    {canEdit && !lineFormMode && (
                      <div className="po-management__lines-head po-management__lines-head--end">
                        <button type="button" className="po-management__dark-btn" onClick={startAddLine}>
                          + Add line item
                        </button>
                      </div>
                    )}

                    {lineFormMode && (
                      <form className="po-management__line-form" onSubmit={handleSaveLine}>
                        <h4 className="po-management__section-title">
                          {lineFormMode === 'add' ? 'Add line item' : `Edit line ${lineForm.lineNumber}`}
                        </h4>
                        {renderLineFormFields({
                          prefix: 'detail-line',
                          line: lineForm,
                          onChange: handleLineFormChange,
                          errors: lineFormErrors,
                          disableLineNumber: lineFormMode === 'edit',
                        })}
                        <div className="po-management__line-form-actions">
                          <button type="button" className="po-management__cancel-btn" onClick={cancelLineForm}>Cancel</button>
                          <button type="submit" className="po-management__save-btn" disabled={isLineSaving}>
                            {isLineSaving ? 'Saving...' : 'Save line'}
                          </button>
                        </div>
                      </form>
                    )}

                    <div className="po-management__table-wrap po-management__table-wrap--nested">
                      <table className="po-management__table po-management__table--lines">
                        <colgroup>
                          <col className="po-management__col-line" />
                          <col className="po-management__col-desc" />
                          <col className="po-management__col-qty" />
                          <col className="po-management__col-price" />
                          <col className="po-management__col-currency" />
                          <col className="po-management__col-status" />
                          <col className="po-management__col-eta" />
                          <col className="po-management__col-tracking" />
                          {canEdit && <col className="po-management__col-actions" />}
                        </colgroup>
                        <thead>
                          <tr>
                            <th>Line #</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Unit price</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>ETA</th>
                            <th>Tracking</th>
                            {canEdit && <th>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedPo.lines || []).length === 0 ? (
                            <tr><td colSpan={canEdit ? 9 : 8}>No line items yet.</td></tr>
                          ) : (
                            selectedPo.lines.map((line) => {
                              const isEditingStatus = statusEditLineNumber === line.lineNumber;

                              return (
                                <tr key={line._id || line.lineNumber}>
                                  <td>{line.lineNumber}</td>
                                  <td>
                                    <span className="po-management__cell-text" title={line.description || undefined}>
                                      {line.description || '—'}
                                    </span>
                                  </td>
                                  <td>{line.quantity}</td>
                                  <td>{line.unitPrice ?? '—'}</td>
                                  <td>{line.currency || '—'}</td>
                                  <td>
                                    <div className="po-management__status-slot">
                                      {canEdit && isEditingStatus ? (
                                        <div className="po-management__status-edit">
                                          <select
                                            className="po-management__status-select"
                                            value={statusDraft}
                                            onChange={(event) => setStatusDraft(event.target.value)}
                                            disabled={isStatusSaving}
                                            aria-label={`Update status for line ${line.lineNumber}`}
                                          >
                                            {LINE_STATUSES.map((status) => (
                                              <option key={status} value={status}>{status}</option>
                                            ))}
                                          </select>
                                          <button
                                            type="button"
                                            className="po-management__icon-btn is-confirm"
                                            onClick={() => handleConfirmStatusChange(line.lineNumber)}
                                            disabled={isStatusSaving}
                                            aria-label="Confirm status change"
                                            title="Save status"
                                          >
                                            <MdCheck size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            className="po-management__icon-btn"
                                            onClick={cancelStatusEdit}
                                            disabled={isStatusSaving}
                                            aria-label="Cancel status change"
                                            title="Cancel"
                                          >
                                            <MdClose size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="po-management__status-cell">
                                          <span className="po-management__badge">{line.status}</span>
                                          {canEdit && (
                                            <button
                                              type="button"
                                              className="po-management__icon-btn"
                                              onClick={() => startStatusEdit(line)}
                                              aria-label={`Edit status for line ${line.lineNumber}`}
                                              title="Edit status"
                                            >
                                              <MdEdit size={15} />
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td>{formatPoDate(line.eta)}</td>
                                  <td>
                                    <ShipmentTrackingLink
                                      value={line.shipmentTrackingLink}
                                      className="po-management__tracking-link"
                                    />
                                  </td>
                                  {canEdit && (
                                    <td>
                                      <div className="po-management__actions">
                                        <button type="button" className="po-management__action-btn" onClick={() => startEditLine(line)}>Edit</button>
                                        <button type="button" className="po-management__action-btn is-danger" onClick={() => handleRemoveLine(line.lineNumber)}>Remove</button>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {detailTab === 'activity' && (
                  <div className="po-management__activity">
                    {isActivityLoading ? (
                      <p className="po-management__empty">Loading activity...</p>
                    ) : activity.length === 0 ? (
                      <p className="po-management__empty">No activity recorded yet.</p>
                    ) : (
                      <ul className="po-management__activity-list">
                        {activity.map((entry) => (
                          <li key={entry._id} className="po-management__activity-item">
                            <div className="po-management__activity-top">
                              <strong>{entry.action?.replace(/_/g, ' ')}</strong>
                              <span>{formatRelativeActivityTime(entry.createdAt)}</span>
                            </div>
                            <p>{entry.description}</p>
                            {entry.performedByName && (
                              <span className="po-management__activity-by">By {entry.performedByName}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )}
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
