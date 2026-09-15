const { default: mongoose } = require('mongoose');
const PurchaseOrder = require('../models/purchaseOrder.model');
const ActivityHistory = require('../models/activityHistory.model');
const SalesPerson = require('../models/salesPerson.model');
const returnError = require('./dto.service');
const {
  normalizeLineItem,
  normalizeLineItems,
  syncPurchaseOrderState,
  applyActualClosingDateIntent,
} = require('../utils/purchaseOrder.helpers');
const logActivity = require('../utils/activityLogger');
const {
  notifyPoCreated,
  notifyLineStatusChange,
  notifyPoClosed,
} = require('../services/notificationService/poNotification.service');
const salesPersonCtlr = require('./salesPerson.controller');
const { seedFromPurchaseOrdersIfEmpty } = salesPersonCtlr;

const purchaseOrderCtlr = {};

const findPurchaseOrderOrFail = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw returnError(400, 'Invalid purchase order ID');
  }

  const purchaseOrder = await PurchaseOrder.findById(id);
  if (!purchaseOrder) {
    throw returnError(404, 'Purchase order not found');
  }

  return purchaseOrder;
};

const ensureUniqueNumbers = async ({ poNumber, soNumber, excludeId }) => {
  if (poNumber) {
    const existingPo = await PurchaseOrder.findOne({
      poNumber: poNumber.trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (existingPo) throw returnError(400, 'PO Number already exists');
  }

  if (soNumber) {
    const existingSo = await PurchaseOrder.findOne({
      soNumber: soNumber.trim(),
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    });
    if (existingSo) throw returnError(400, 'SO Number already exists');
  }
};

const buildListFilter = (query = {}) => {
  const filter = {};

  if (query.search) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    filter.$or = [
      { poNumber: searchRegex },
      { soNumber: searchRegex },
      { clientName: searchRegex },
      { salesPerson: searchRegex },
      { contactPerson: searchRegex },
      { contactPersonEmail: searchRegex },
      { subject: searchRegex },
      { 'lines.description': searchRegex },
    ];
  }

  if (query.poNumber) filter.poNumber = query.poNumber.trim();
  if (query.soNumber) filter.soNumber = query.soNumber.trim();
  if (query.clientName) filter.clientName = { $regex: query.clientName.trim(), $options: 'i' };
  if (query.salesPerson) filter.salesPerson = { $regex: query.salesPerson.trim(), $options: 'i' };
  if (query.subject) filter.subject = { $regex: query.subject.trim(), $options: 'i' };
  if (query.poStatus) filter.poStatus = query.poStatus;
  if (query.lineStatus) filter['lines.status'] = query.lineStatus;

  if (query.poDateFrom || query.poDateTo) {
    filter.poDate = {};
    if (query.poDateFrom) filter.poDate.$gte = new Date(query.poDateFrom);
    if (query.poDateTo) filter.poDate.$lte = new Date(query.poDateTo);
  }

  if (query.overallPoEtaFrom || query.overallPoEtaTo) {
    filter.overallPoEta = {};
    if (query.overallPoEtaFrom) filter.overallPoEta.$gte = new Date(query.overallPoEtaFrom);
    if (query.overallPoEtaTo) filter.overallPoEta.$lte = new Date(query.overallPoEtaTo);
  }

  if (query.closingDateFrom || query.closingDateTo) {
    filter.overallPoEta = filter.overallPoEta || {};
    if (query.closingDateFrom) filter.overallPoEta.$gte = new Date(query.closingDateFrom);
    if (query.closingDateTo) filter.overallPoEta.$lte = new Date(query.closingDateTo);
  }

  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {};
    if (query.createdFrom) filter.createdAt.$gte = new Date(query.createdFrom);
    if (query.createdTo) filter.createdAt.$lte = new Date(query.createdTo);
  }

  if (query.updatedFrom || query.updatedTo) {
    filter.updatedAt = {};
    if (query.updatedFrom) filter.updatedAt.$gte = new Date(query.updatedFrom);
    if (query.updatedTo) filter.updatedAt.$lte = new Date(query.updatedTo);
  }

  if (query.contactPerson) {
    filter.contactPerson = { $regex: query.contactPerson.trim(), $options: 'i' };
  }
  if (query.supplier) filter.supplier = { $regex: query.supplier.trim(), $options: 'i' };
  if (query.country) filter.country = { $regex: query.country.trim(), $options: 'i' };
  if (query.lineCurrency) filter['lines.currency'] = query.lineCurrency;

  if (query.upcomingClosingBy) {
    filter.poStatus = 'Open';
    filter.overallPoEta = {
      ...(filter.overallPoEta || {}),
      $lte: new Date(query.upcomingClosingBy),
    };
  }

  return filter;
};

purchaseOrderCtlr.filterOptions = async () => {
  await seedFromPurchaseOrdersIfEmpty();

  const [salesPersons, clientNames, suppliers, countries] = await Promise.all([
    SalesPerson.find({ isActive: true }).sort({ name: 1 }).select('name'),
    PurchaseOrder.distinct('clientName'),
    PurchaseOrder.distinct('supplier'),
    PurchaseOrder.distinct('country'),
  ]);

  return {
    message: 'Filter options fetched successfully',
    data: {
      salesPersons: salesPersons.map((person) => person.name),
      clientNames: clientNames.filter(Boolean).sort(),
      suppliers: suppliers.filter(Boolean).sort(),
      countries: countries.filter(Boolean).sort(),
    },
  };
};

purchaseOrderCtlr.create = async ({ body, user }) => {
  await ensureUniqueNumbers({ poNumber: body.poNumber, soNumber: body.soNumber });

  const purchaseOrder = new PurchaseOrder({
    poNumber: body.poNumber.trim(),
    soNumber: body.soNumber.trim(),
    poDate: body.poDate,
    paymentTerms: body.paymentTerms.trim(),
    overallPoEta: body.overallPoEta,
    clientName: body.clientName.trim(),
    salesPerson: body.salesPerson.trim(),
    contactPerson: body.contactPerson.trim(),
    contactPersonEmail: body.contactPersonEmail.trim(),
    subject: body.subject || '',
    internalNotes: body.internalNotes || '',
    lines: normalizeLineItems(body.lines || []),
    createdBy: user?.id,
    updatedBy: user?.id,
  });

  // Optional historical closing date — applied only if PO ends up Closed.
  if (body.actualPoClosingDate) {
    purchaseOrder.actualPoClosingDate = new Date(body.actualPoClosingDate);
  }

  syncPurchaseOrderState(purchaseOrder);
  applyActualClosingDateIntent(purchaseOrder, {
    actualPoClosingDate: body.actualPoClosingDate,
    useAutomaticClosingDate: body.useAutomaticClosingDate,
  });
  await purchaseOrder.save();

  await logActivity({
    purchaseOrderId: purchaseOrder._id,
    action: 'po_created',
    description: `Purchase order ${purchaseOrder.poNumber} created`,
    user,
  });

  await notifyPoCreated(purchaseOrder);

  return {
    message: 'Purchase order created successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.list = async ({ query }) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;
  const filter = buildListFilter(query);

  const [data, total] = await Promise.all([
    PurchaseOrder.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    PurchaseOrder.countDocuments(filter),
  ]);

  return {
    message: 'Purchase orders fetched successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

purchaseOrderCtlr.search = async ({ query }) => {
  const searchValue = (query.q || query.poNumber || query.soNumber || '').trim();

  if (!searchValue) {
    throw returnError(400, 'Search value is required');
  }

  const purchaseOrder = await PurchaseOrder.findOne({
    $or: [{ poNumber: searchValue }, { soNumber: searchValue }],
  });

  if (!purchaseOrder) {
    throw returnError(404, 'Purchase order not found');
  }

  return {
    message: 'Purchase order found',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.getById = async ({ params }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);

  return {
    message: 'Purchase order fetched successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.update = async ({ params, body, user }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);

  await ensureUniqueNumbers({
    poNumber: body.poNumber,
    soNumber: body.soNumber,
    excludeId: purchaseOrder._id,
  });

  const updatableFields = [
    'poNumber',
    'soNumber',
    'poDate',
    'paymentTerms',
    'overallPoEta',
    'clientName',
    'salesPerson',
    'contactPerson',
    'contactPersonEmail',
    'subject',
    'internalNotes',
  ];

  updatableFields.forEach((field) => {
    if (body[field] !== undefined) {
      purchaseOrder[field] = typeof body[field] === 'string' ? body[field].trim() : body[field];
    }
  });

  if (body.useAutomaticClosingDate === true || body.useAutomaticClosingDate === 'true') {
    purchaseOrder.actualPoClosingDate = undefined;
  } else if (
    body.actualPoClosingDate !== undefined
    && body.actualPoClosingDate !== null
    && body.actualPoClosingDate !== ''
  ) {
    purchaseOrder.actualPoClosingDate = new Date(body.actualPoClosingDate);
  }

  purchaseOrder.updatedBy = user?.id;
  syncPurchaseOrderState(purchaseOrder);
  applyActualClosingDateIntent(purchaseOrder, {
    actualPoClosingDate: body.actualPoClosingDate,
    useAutomaticClosingDate: body.useAutomaticClosingDate,
  });
  await purchaseOrder.save();

  await logActivity({
    purchaseOrderId: purchaseOrder._id,
    action: 'po_updated',
    description: `Purchase order ${purchaseOrder.poNumber} updated`,
    user,
  });

  return {
    message: 'Purchase order updated successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.remove = async ({ params }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);

  await ActivityHistory.deleteMany({ purchaseOrder: purchaseOrder._id });
  await purchaseOrder.deleteOne();

  return {
    message: 'Purchase order deleted successfully',
  };
};

purchaseOrderCtlr.addLine = async ({ params, body, user }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);
  const line = normalizeLineItem(body);

  const duplicateLine = purchaseOrder.lines.find(
    (existingLine) => existingLine.lineNumber === line.lineNumber,
  );

  if (duplicateLine) {
    throw returnError(400, 'Line number already exists on this purchase order');
  }

  purchaseOrder.lines.push(line);
  purchaseOrder.updatedBy = user?.id;
  syncPurchaseOrderState(purchaseOrder);
  await purchaseOrder.save();

  await logActivity({
    purchaseOrderId: purchaseOrder._id,
    action: 'line_added',
    description: `Line ${line.lineNumber} added`,
    field: 'lines',
    newValue: line,
    user,
  });

  return {
    message: 'Line item added successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.updateLine = async ({ params, body, user }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);
  const lineNumber = Number(params.lineNumber);
  const line = purchaseOrder.lines.find((item) => item.lineNumber === lineNumber);

  if (!line) {
    throw returnError(404, 'Line item not found');
  }

  const previousStatus = line.status;
  const previousPoStatus = purchaseOrder.poStatus;

  if (body.description !== undefined) line.description = body.description.trim();
  if (body.quantity !== undefined) line.quantity = Number(body.quantity) || 0;
  if (body.unitPrice !== undefined) line.unitPrice = Number(body.unitPrice) || 0;
  if (body.currency !== undefined) line.currency = body.currency;
  if (body.status !== undefined) line.status = body.status;
  if (body.eta !== undefined) line.eta = body.eta ? new Date(body.eta) : undefined;
  if (body.internalRemarks !== undefined) line.internalRemarks = body.internalRemarks.trim();
  if (body.shipmentTrackingLink !== undefined) {
    line.shipmentTrackingLink = body.shipmentTrackingLink.trim();
  }

  line.totalPrice = line.quantity * line.unitPrice;
  line.lastUpdated = new Date();
  purchaseOrder.updatedBy = user?.id;

  syncPurchaseOrderState(purchaseOrder);
  await purchaseOrder.save();

  if (body.status !== undefined && previousStatus !== line.status) {
    await notifyLineStatusChange({
      purchaseOrder,
      line,
      previousStatus,
      newStatus: line.status,
    });
  }

  if (previousPoStatus !== 'Closed' && purchaseOrder.poStatus === 'Closed') {
    await notifyPoClosed(purchaseOrder);
  }

  await logActivity({
    purchaseOrderId: purchaseOrder._id,
    action: 'line_updated',
    description: `Line ${lineNumber} updated`,
    field: `lines.${lineNumber}`,
    oldValue: { status: previousStatus },
    newValue: body,
    user,
  });

  return {
    message: 'Line item updated successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.removeLine = async ({ params, user }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);
  const lineNumber = Number(params.lineNumber);
  const lineIndex = purchaseOrder.lines.findIndex(
    (item) => item.lineNumber === lineNumber,
  );

  if (lineIndex === -1) {
    throw returnError(404, 'Line item not found');
  }

  const [removedLine] = purchaseOrder.lines.splice(lineIndex, 1);
  purchaseOrder.updatedBy = user?.id;
  syncPurchaseOrderState(purchaseOrder);
  await purchaseOrder.save();

  await logActivity({
    purchaseOrderId: purchaseOrder._id,
    action: 'line_removed',
    description: `Line ${lineNumber} removed`,
    field: 'lines',
    oldValue: removedLine,
    user,
  });

  return {
    message: 'Line item removed successfully',
    data: purchaseOrder,
  };
};

purchaseOrderCtlr.getActivity = async ({ params, query }) => {
  const purchaseOrder = await findPurchaseOrderOrFail(params.id);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    ActivityHistory.find({ purchaseOrder: purchaseOrder._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityHistory.countDocuments({ purchaseOrder: purchaseOrder._id }),
  ]);

  return {
    message: 'Activity history fetched successfully',
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

module.exports = purchaseOrderCtlr;
