const PurchaseOrder = require('../models/purchaseOrder.model');
const { LINE_STATUSES } = require('../constants');

const dashboardCtlr = {};

dashboardCtlr.summary = async () => {
  const purchaseOrders = await PurchaseOrder.find().select('poStatus lines overallPoEta');

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  let openPos = 0;
  let closedPos = 0;
  let approachingClosingDate = 0;
  let delayedPos = 0;
  let totalLines = 0;
  let deliveredLines = 0;
  let inTransitLines = 0;
  let readyForDeliveryLines = 0;

  purchaseOrders.forEach((po) => {
    if (po.poStatus === 'Closed') {
      closedPos += 1;
    } else {
      openPos += 1;
    }

    if (
      po.overallPoEta &&
      po.poStatus === 'Open' &&
      po.overallPoEta >= now &&
      po.overallPoEta <= sevenDaysFromNow
    ) {
      approachingClosingDate += 1;
    }

    if (
      po.overallPoEta &&
      po.poStatus === 'Open' &&
      po.overallPoEta < now
    ) {
      delayedPos += 1;
    }

    (po.lines || []).forEach((line) => {
      totalLines += 1;
      if (line.status === 'Delivered') deliveredLines += 1;
      if (line.status === 'In Transit') inTransitLines += 1;
      if (line.status === 'Ready for Delivery') readyForDeliveryLines += 1;
    });
  });

  const lineStatusCounts = LINE_STATUSES.reduce((acc, status) => {
    acc[status] = 0;
    return acc;
  }, {});

  purchaseOrders.forEach((po) => {
    (po.lines || []).forEach((line) => {
      if (lineStatusCounts[line.status] !== undefined) {
        lineStatusCounts[line.status] += 1;
      }
    });
  });

  return {
    message: 'Dashboard summary fetched successfully',
    data: {
      totalPurchaseOrders: purchaseOrders.length,
      openPurchaseOrders: openPos,
      closedPurchaseOrders: closedPos,
      purchaseOrdersApproachingClosingDate: approachingClosingDate,
      delayedPurchaseOrders: delayedPos,
      totalLines,
      deliveredLines,
      inTransitLines,
      readyForDeliveryLines,
      lineStatusCounts,
    },
  };
};

module.exports = dashboardCtlr;
