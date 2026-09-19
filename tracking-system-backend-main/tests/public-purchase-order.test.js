const { test } = require('node:test');
const assert = require('node:assert/strict');
const { toPublicPurchaseOrder } = require('../app/utils/purchaseOrder.helpers');

test('public purchase order never exposes financial or internal line data', () => {
  const publicOrder = toPublicPurchaseOrder({
    poNumber: 'PO-SECURE-1',
    poDate: new Date('2026-09-01'),
    numberOfLines: 1,
    overallPoEta: new Date('2026-09-20'),
    poStatus: 'Open',
    internalNotes: 'confidential PO note',
    lines: [{
      lineNumber: 10,
      description: 'Tracked item',
      quantity: 2,
      unitPrice: 1250,
      totalPrice: 2500,
      currency: 'AED',
      status: 'Processing',
      eta: new Date('2026-09-20'),
      internalRemarks: 'confidential line note',
    }],
  });

  assert.equal(publicOrder.poNumber, 'PO-SECURE-1');
  assert.equal(publicOrder.items[0].quantity, 2);
  assert.equal('unitPrice' in publicOrder.items[0], false);
  assert.equal('totalPrice' in publicOrder.items[0], false);
  assert.equal('currency' in publicOrder.items[0], false);
  assert.equal('internalRemarks' in publicOrder.items[0], false);
  assert.equal('internalNotes' in publicOrder, false);
  assert.doesNotMatch(JSON.stringify(publicOrder), /1250|2500|confidential/);
});
