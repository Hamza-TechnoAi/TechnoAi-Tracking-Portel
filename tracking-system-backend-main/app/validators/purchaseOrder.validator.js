const { LINE_STATUSES, LINE_CURRENCIES } = require('../constants');
const PurchaseOrder = require('../models/purchaseOrder.model');

const lineItemSchema = {
  lineNumber: {
    notEmpty: { errorMessage: 'Line number is required' },
    isInt: { options: { min: 1 }, errorMessage: 'Line number must be a positive integer' },
  },
  description: {
    notEmpty: { errorMessage: 'Description is required' },
    trim: true,
  },
  quantity: {
    notEmpty: { errorMessage: 'Quantity is required' },
    isFloat: { options: { min: 0 }, errorMessage: 'Quantity must be zero or greater' },
  },
  unitPrice: {
    notEmpty: { errorMessage: 'Unit price is required' },
    isFloat: { options: { min: 0 }, errorMessage: 'Unit price must be zero or greater' },
  },
  currency: {
    notEmpty: { errorMessage: 'Currency is required' },
    isIn: { options: [LINE_CURRENCIES], errorMessage: 'Invalid currency' },
  },
  status: {
    notEmpty: { errorMessage: 'Status is required' },
    isIn: { options: [LINE_STATUSES], errorMessage: 'Invalid line status' },
  },
  eta: {
    notEmpty: { errorMessage: 'ETA is required' },
    isISO8601: { errorMessage: 'Invalid ETA date format' },
    toDate: true,
  },
  internalRemarks: {
    optional: true,
    trim: true,
  },
  shipmentTrackingLink: {
    optional: true,
    trim: true,
  },
};

const createPurchaseOrderSchema = {
  poNumber: {
    notEmpty: { errorMessage: 'PO Number is required' },
    trim: true,
    custom: {
      options: async (value) => {
        const existing = await PurchaseOrder.findOne({ poNumber: value.trim() });
        if (existing) throw new Error('PO Number already exists');
        return true;
      },
    },
  },
  soNumber: {
    notEmpty: { errorMessage: 'SO Number is required' },
    trim: true,
    custom: {
      options: async (value) => {
        const existing = await PurchaseOrder.findOne({ soNumber: value.trim() });
        if (existing) throw new Error('SO Number already exists');
        return true;
      },
    },
  },
  poDate: {
    notEmpty: { errorMessage: 'PO Date is required' },
    isISO8601: { errorMessage: 'Invalid PO Date format' },
    toDate: true,
  },
  paymentTerms: {
    notEmpty: { errorMessage: 'Payment terms are required' },
    trim: true,
  },
  overallPoEta: {
    notEmpty: { errorMessage: 'Overall PO ETA is required' },
    isISO8601: { errorMessage: 'Invalid overall PO ETA format' },
    toDate: true,
  },
  clientName: {
    notEmpty: { errorMessage: 'Client name is required' },
    trim: true,
  },
  salesPerson: {
    notEmpty: { errorMessage: 'Sales person is required' },
    trim: true,
  },
  contactPerson: {
    notEmpty: { errorMessage: 'Contact person is required' },
    trim: true,
  },
  contactPersonEmail: {
    notEmpty: { errorMessage: 'Contact person email is required' },
    isEmail: { errorMessage: 'Contact person email must be a valid email address' },
    normalizeEmail: {
      options: {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
      },
    },
    trim: true,
  },
  subject: {
    notEmpty: { errorMessage: 'Subject is required' },
    trim: true,
  },
  internalNotes: { optional: true, trim: true },
  'lines.*.lineNumber': lineItemSchema.lineNumber,
  'lines.*.description': lineItemSchema.description,
  'lines.*.quantity': lineItemSchema.quantity,
  'lines.*.unitPrice': lineItemSchema.unitPrice,
  'lines.*.currency': lineItemSchema.currency,
  'lines.*.status': lineItemSchema.status,
  'lines.*.eta': lineItemSchema.eta,
  'lines.*.internalRemarks': lineItemSchema.internalRemarks,
  'lines.*.shipmentTrackingLink': lineItemSchema.shipmentTrackingLink,
};

const updatePurchaseOrderSchema = {
  poNumber: {
    optional: true,
    trim: true,
  },
  soNumber: {
    optional: true,
    trim: true,
  },
  poDate: {
    optional: true,
    isISO8601: { errorMessage: 'Invalid PO Date format' },
    toDate: true,
  },
  paymentTerms: { optional: true, trim: true },
  overallPoEta: {
    optional: true,
    isISO8601: { errorMessage: 'Invalid overall PO ETA format' },
    toDate: true,
  },
  clientName: { optional: true, trim: true },
  salesPerson: { optional: true, trim: true },
  contactPerson: { optional: true, trim: true },
  contactPersonEmail: {
    optional: true,
    isEmail: { errorMessage: 'Contact person email must be a valid email address' },
    normalizeEmail: {
      options: {
        gmail_remove_dots: false,
        gmail_remove_subaddress: false,
      },
    },
    trim: true,
  },
  subject: {
    optional: true,
    notEmpty: { errorMessage: 'Subject is required' },
    trim: true,
  },
  internalNotes: { optional: true, trim: true },
};

const updateLineItemSchema = {
  description: {
    optional: true,
    notEmpty: { errorMessage: 'Description is required' },
    trim: true,
  },
  quantity: {
    optional: true,
    isFloat: { options: { min: 0 }, errorMessage: 'Quantity must be zero or greater' },
  },
  unitPrice: {
    optional: true,
    isFloat: { options: { min: 0 }, errorMessage: 'Unit price must be zero or greater' },
  },
  currency: {
    optional: true,
    isIn: { options: [LINE_CURRENCIES], errorMessage: 'Invalid currency' },
  },
  status: {
    optional: true,
    isIn: { options: [LINE_STATUSES], errorMessage: 'Invalid line status' },
  },
  eta: {
    optional: true,
    isISO8601: { errorMessage: 'Invalid ETA date format' },
    toDate: true,
  },
  internalRemarks: { optional: true, trim: true },
  shipmentTrackingLink: { optional: true, trim: true },
};

const createLineItemSchema = {
  lineNumber: lineItemSchema.lineNumber,
  description: lineItemSchema.description,
  quantity: lineItemSchema.quantity,
  unitPrice: lineItemSchema.unitPrice,
  currency: lineItemSchema.currency,
  status: lineItemSchema.status,
  eta: lineItemSchema.eta,
  internalRemarks: lineItemSchema.internalRemarks,
  shipmentTrackingLink: lineItemSchema.shipmentTrackingLink,
};

module.exports = {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  updateLineItemSchema,
  createLineItemSchema,
};
