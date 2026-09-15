const { LINE_STATUSES, LINE_CURRENCIES } = require('../constants');

const DELIVERED_STATUS = 'Delivered';

const normalizeLineItem = (line = {}) => {
  const quantity = Number(line.quantity) || 0;
  const unitPrice = Number(line.unitPrice) || 0;
  const totalPrice = quantity * unitPrice;

  return {
    lineNumber: Number(line.lineNumber),
    description: line.description?.trim() || '',
    quantity,
    unitPrice,
    currency: LINE_CURRENCIES.includes(line.currency) ? line.currency : 'AED',
    totalPrice,
    status: LINE_STATUSES.includes(line.status) ? line.status : 'Processing',
    eta: line.eta ? new Date(line.eta) : undefined,
    lastUpdated: line.lastUpdated ? new Date(line.lastUpdated) : new Date(),
    internalRemarks: line.internalRemarks?.trim() || '',
    shipmentTrackingLink: line.shipmentTrackingLink?.trim() || '',
  };
};

const normalizeLineItems = (lines = []) => lines.map(normalizeLineItem);

const syncPurchaseOrderState = (purchaseOrder) => {
  purchaseOrder.numberOfLines = purchaseOrder.lines?.length || 0;

  if (!purchaseOrder.lines?.length) {
    purchaseOrder.poStatus = 'Open';
    purchaseOrder.actualPoClosingDate = undefined;
    return purchaseOrder;
  }

  const allDelivered = purchaseOrder.lines.every(
    (line) => line.status === DELIVERED_STATUS,
  );

  if (allDelivered) {
    purchaseOrder.poStatus = 'Closed';
    // Keep a manually set date; otherwise use today (original automatic behaviour).
    if (!purchaseOrder.actualPoClosingDate) {
      purchaseOrder.actualPoClosingDate = new Date();
    }
  } else {
    purchaseOrder.poStatus = 'Open';
    purchaseOrder.actualPoClosingDate = undefined;
  }

  return purchaseOrder;
};

/**
 * Apply closing-date intent after syncPurchaseOrderState.
 * - useAutomaticClosingDate: restore original behaviour (today when Closed)
 * - actualPoClosingDate: keep a historical / corrected closing date when Closed
 */
const applyActualClosingDateIntent = (
  purchaseOrder,
  { actualPoClosingDate, useAutomaticClosingDate } = {},
) => {
  if (purchaseOrder.poStatus !== 'Closed') {
    return purchaseOrder;
  }

  if (useAutomaticClosingDate === true || useAutomaticClosingDate === 'true') {
    purchaseOrder.actualPoClosingDate = new Date();
    return purchaseOrder;
  }

  if (
    actualPoClosingDate !== undefined
    && actualPoClosingDate !== null
    && actualPoClosingDate !== ''
  ) {
    purchaseOrder.actualPoClosingDate = new Date(actualPoClosingDate);
  }

  return purchaseOrder;
};

const toPublicPurchaseOrder = (purchaseOrder) => ({
  poNumber: purchaseOrder.poNumber,
  poDate: purchaseOrder.poDate,
  numberOfLines: String(purchaseOrder.numberOfLines || 0).padStart(2, '0'),
  overallPoEta: purchaseOrder.overallPoEta,
  poClosingDate:
    purchaseOrder.poStatus === 'Closed'
      ? purchaseOrder.actualPoClosingDate
      : purchaseOrder.overallPoEta,
  poStatus: purchaseOrder.poStatus,
  items: (purchaseOrder.lines || []).map((line) => ({
    lineNumber: line.lineNumber,
    description: line.description,
    quantity: line.quantity,
    status: line.status,
    eta: line.eta,
    lastUpdated: line.lastUpdated,
    shipmentTrackingLink: line.shipmentTrackingLink || '',
  })),
});

const buildStaffName = (user) => {
  if (!user) return 'System';

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fullName) return fullName;

  const email = typeof user.email === 'string' ? user.email : user.email?.address;
  return email || 'Staff';
};

module.exports = {
  DELIVERED_STATUS,
  normalizeLineItem,
  normalizeLineItems,
  syncPurchaseOrderState,
  applyActualClosingDateIntent,
  toPublicPurchaseOrder,
  buildStaffName,
};
