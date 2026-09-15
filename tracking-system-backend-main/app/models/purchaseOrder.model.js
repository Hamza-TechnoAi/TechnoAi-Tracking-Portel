const { Schema, model } = require('mongoose');
const { LINE_STATUSES, PO_STATUSES, LINE_CURRENCIES } = require('../constants');

const lineItemSchema = new Schema(
  {
    lineNumber: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      enum: LINE_CURRENCIES,
      default: 'AED',
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: LINE_STATUSES,
      default: 'Processing',
      required: true,
    },
    eta: {
      type: Date,
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    internalRemarks: {
      type: String,
      default: '',
      trim: true,
    },
    shipmentTrackingLink: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true },
);

const purchaseOrderSchema = new Schema(
  {
    poNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    soNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    poDate: {
      type: Date,
      required: true,
    },
    paymentTerms: {
      type: String,
      required: true,
      trim: true,
    },
    actualPoClosingDate: {
      type: Date,
    },
    overallPoEta: {
      type: Date,
      required: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    salesPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactPerson: {
      type: String,
      required: true,
      trim: true,
    },
    contactPersonEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    supplier: {
      type: String,
      default: '',
      trim: true,
    },
    country: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      default: '',
      trim: true,
    },
    internalNotes: {
      type: String,
      default: '',
      trim: true,
    },
    poStatus: {
      type: String,
      enum: PO_STATUSES,
      default: 'Open',
    },
    lines: {
      type: [lineItemSchema],
      default: [],
    },
    numberOfLines: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true },
);

purchaseOrderSchema.index({ clientName: 1 });
purchaseOrderSchema.index({ salesPerson: 1 });
purchaseOrderSchema.index({ poStatus: 1 });
purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ updatedAt: -1 });

module.exports = model('PurchaseOrder', purchaseOrderSchema);
