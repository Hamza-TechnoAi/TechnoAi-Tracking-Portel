const PurchaseOrder = require('../models/purchaseOrder.model');
const PoSubscription = require('../models/poSubscription.model');
const returnError = require('./dto.service');
const { toPublicPurchaseOrder } = require('../utils/purchaseOrder.helpers');

const trackCtlr = {};

trackCtlr.getByPoNumber = async ({ params }) => {
  const poNumber = params.poNumber?.trim();

  if (!poNumber) {
    throw returnError(400, 'PO Number is required');
  }

  const purchaseOrder = await PurchaseOrder.findOne({ poNumber });

  if (!purchaseOrder) {
    throw returnError(
      404,
      'No shipment record was found for the entered PO Number. Please verify the number and try again.',
    );
  }

  return {
    message: 'Shipment record found',
    data: toPublicPurchaseOrder(purchaseOrder),
  };
};

trackCtlr.subscribe = async ({ params, body }) => {
  const poNumber = params.poNumber?.trim();
  const email = body.email?.trim().toLowerCase();

  if (!poNumber) {
    throw returnError(400, 'PO Number is required');
  }

  const purchaseOrder = await PurchaseOrder.findOne({ poNumber });

  if (!purchaseOrder) {
    throw returnError(
      404,
      'No shipment record was found for the entered PO Number. Please verify the number and try again.',
    );
  }

  await PoSubscription.findOneAndUpdate(
    { poNumber, email },
    { poNumber, email },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return {
    message: 'You are subscribed to shipment updates for this PO.',
    data: {
      poNumber,
      email,
    },
  };
};

module.exports = trackCtlr;
