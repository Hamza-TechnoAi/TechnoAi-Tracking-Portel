const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const id = () => new mongoose.Types.ObjectId().toString();
const staffId = id();
let notices, claims, emails, orders, subscribers, failMail, activeUser, selectedOrder;
const inject = (relative, exports) => {
  const filename = require.resolve(path.join(__dirname, '..', relative));
  require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
const matches = (row, filter) => Object.entries(filter).every(([key, value]) => String(row[key]) === String(value));
const Notification = {
  init: async () => {},
  bulkWrite: async writes => { for (const { updateOne: entry } of writes) {
    if (!notices.some(row => matches(row, entry.filter))) notices.push({ _id: id(), ...entry.update.$setOnInsert });
  } },
  find: filter => ({ sort: () => ({ limit: () => ({ select: async () => notices.filter(row => matches(row, filter)) }) }) }),
  countDocuments: async filter => notices.filter(row => matches(row, filter)).length,
  findOne: async filter => notices.find(row => matches(row, filter)),
  updateOne: async (filter, update) => Object.assign(notices.find(row => matches(row, filter)) || {}, update.$set),
};
const Delivery = {
  init: async () => {},
  create: async data => {
    if (claims.some(row => row.eventKey === data.eventKey && row.email === data.email)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    const row = { _id: id(), ...data }; claims.push(row); return row;
  },
  updateOne: async (filter, update) => Object.assign(claims.find(row => row._id === filter._id), update.$set),
};
inject('app/models/user.model', {
  find: () => ({ select: async () => [{ _id: staffId }] }),
  findById: () => ({ select: async () => activeUser }),
});
inject('app/models/notification.model', Notification);
inject('app/models/notificationDelivery.model', Delivery);
inject('app/models/poSubscription.model', { find: () => ({ select: async () => subscribers }) });
inject('app/models/purchaseOrder.model', { find: () => ({ cursor: async function* () { yield* orders; } }),
  findById: async () => selectedOrder, findOne: async () => null });
inject('app/utils/activityLogger', async () => {});
inject('app/controllers/salesPerson.controller', { seedFromPurchaseOrdersIfEmpty: async () => {} });
inject('app/services/nodemailerService/nodemailer.service', { sendMailFunc: async message => {
  if (failMail) throw new Error('SMTP failed'); emails.push(message);
} });
const service = require('../app/services/notificationService/poNotification.service');
const po = () => ({ _id: id(), poNumber: 'PO-123', poStatus: 'Open', updatedAt: new Date('2026-09-15T12:00:00Z'),
  overallPoEta: new Date('2026-09-20'), internalNotes: 'SECRET_NOTE', unitPrice: 'SECRET_PRICE',
  lines: [{ _id: id(), lineNumber: 1, status: 'In Transit', eta: new Date('2026-09-18') }] });
beforeEach(() => {
  notices = []; claims = []; emails = []; orders = []; subscribers = [{ email: 'customer@example.com' }]; failMail = false;
  activeUser = { role: 'dataEntry', isApproved: true, isBlocked: false };
  Object.assign(process.env, { EMAIL_NOTIFICATIONS_ENABLED: 'true', EMAIL: 'sender@example.com', APP_PASSWORD: 'stub',
    INTERNAL_EMAIL_TRACKING: 'staff@example.com', INTERNAL_EMAIL_PO_CLOSED: 'staff@example.com',
    PUBLIC_TRACKING_URL: 'https://example.com', JWT_SECRET: 'isolated-test-secret' });
});
test('concurrent repeated creation emits one bell and one email; no customer creation email', async () => {
  const order = po();
  await Promise.all([service.notifyPoCreated(order), service.notifyPoCreated(order)]);
  assert.equal(notices.length, 1); assert.equal(emails.length, 1);
  assert.equal(emails[0].to, 'staff@example.com');
});
test('ETA-only and combined updates notify subscribers privately, deduplicate normalized addresses', async () => {
  subscribers.push({ email: ' STAFF@example.com ' });
  const order = po();
  await service.notifyLineStatusChange({ purchaseOrder: order, line: order.lines[0], previousStatus: 'In Transit', previousEta: '2026-09-17' });
  assert.equal(notices.length, 1); assert.equal(emails.length, 2);
  for (const email of emails) {
    assert.match(email.html, /ETA/); assert.doesNotMatch(email.html, /SECRET_NOTE|SECRET_PRICE|internalNotes|unitPrice/);
    assert.equal(typeof email.to, 'string');
  }
  order.updatedAt = new Date('2026-09-15T13:00:00Z');
  await service.notifyLineStatusChange({ purchaseOrder: order, line: order.lines[0], previousStatus: 'Processing', previousEta: '2026-09-17' });
  assert.equal(notices.length, 2); assert.equal(emails.length, 4);
});
test('unchanged values emit nothing; email-disabled events still persist in bell', async () => {
  const order = po();
  await service.notifyLineStatusChange({ purchaseOrder: order, line: order.lines[0], previousStatus: 'In Transit', previousEta: '2026-09-18' });
  assert.equal(notices.length, 0);
  process.env.EMAIL_NOTIFICATIONS_ENABLED = 'false';
  await service.notifyPoCreated(order);
  assert.equal(notices.length, 1); assert.equal(emails.length, 0);
});
test('SMTP failure is contained, recorded and never retried for same event', async () => {
  failMail = true; const order = po();
  await assert.doesNotReject(service.notifyPoCreated(order));
  assert.equal(claims[0].status, 'failed');
  failMail = false; await service.notifyPoCreated(order);
  assert.equal(emails.length, 0); assert.equal(notices.length, 1);
});
test('closure and overall ETA events reach subscribers; HTML is escaped', async () => {
  const order = po(); order.poStatus = 'Closed'; order.poNumber = '<img src=x>';
  await service.notifyPoClosed(order); await service.notifyPoClosed(order);
  assert.equal(emails.length, 2); assert.equal(notices.length, 1);
  assert.doesNotMatch(emails[0].html, /<img/); assert.match(emails[0].html, /&lt;img/);
  await service.notifyPoEtaChange(order, '2026-09-19');
  assert.equal(notices.length, 2);
});
test('daily overdue scans deduplicate across reruns; ignore delivered and due-today items', async () => {
  const order = po(); order.lines[0].eta = new Date('2026-09-14');
  order.lines.push({ _id: id(), lineNumber: 2, status: 'Delivered', eta: new Date('2026-09-01') });
  order.lines.push({ _id: id(), lineNumber: 3, status: 'Processing', eta: new Date('2026-09-15') });
  orders = [order];
  await service.checkOverdue(new Date('2026-09-15T12:00:00Z'));
  await service.checkOverdue(new Date('2026-09-15T23:00:00Z'));
  assert.equal(notices.length, 1); assert.equal(emails.length, 1);
  order.lines[0].eta = new Date('2026-09-13');
  await service.checkOverdue(new Date('2026-09-15T23:00:00Z'));
  assert.equal(notices.length, 2);
});
test('notification endpoints enforce login, current access and recipient ownership', async () => {
  const app = express(); app.use('/api/notifications', require('../app/routes/notification.routes'));
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
  try {
    const url = `http://127.0.0.1:${server.address().port}/api/notifications`;
    const headers = { Authorization: `Bearer ${jwt.sign({ id: staffId, role: 'dataEntry' }, process.env.JWT_SECRET)}` };
    assert.equal((await fetch(url)).status, 401);
    const own = { _id: id(), recipient: staffId, readAt: null };
    const other = { _id: id(), recipient: id(), readAt: null };
    notices = [own, other];
    const response = await (await fetch(url, { headers })).json();
    assert.equal(response.data.length, 1); assert.equal(response.unreadCount, 1);
    assert.equal((await fetch(`${url}/${other._id}/read`, { method: 'PATCH', headers })).status, 404);
    assert.equal((await fetch(`${url}/invalid/read`, { method: 'PATCH', headers })).status, 400);
    assert.equal((await fetch(`${url}/${own._id}/read`, { method: 'PATCH', headers })).status, 200);
    assert.ok(own.readAt);
    assert.equal((await (await fetch(url, { headers })).json()).unreadCount, 0);
    for (const denied of [{ ...activeUser, isBlocked: true }, { ...activeUser, isApproved: false }, { ...activeUser, role: 'customer' }, null]) {
      activeUser = denied; assert.equal((await fetch(url, { headers })).status, 403);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('controller ETA edit saves successfully despite SMTP failure; deleting last pending line closes PO', async () => {
  const controller = require('../app/controllers/purchaseOrder.controller');
  selectedOrder = po();
  let saves = 0;
  selectedOrder.save = async () => { saves += 1; selectedOrder.updatedAt = new Date(); };
  failMail = true;
  const response = await controller.updateLine({ params: { id: selectedOrder._id, lineNumber: 1 },
    body: { eta: '2026-09-19' }, user: { id: staffId } });
  assert.equal(response.data.lines[0].eta.toISOString().slice(0, 10), '2026-09-19');
  assert.equal(saves, 1); assert.equal(notices[0].type, 'line_updated');
  failMail = false;
  selectedOrder.lines.push({ _id: id(), lineNumber: 2, status: 'Delivered', eta: new Date('2026-09-10') });
  await controller.removeLine({ params: { id: selectedOrder._id, lineNumber: 1 }, user: { id: staffId } });
  assert.equal(selectedOrder.poStatus, 'Closed');
  assert.equal(notices.filter(entry => entry.type === 'closed').length, 1);
});
