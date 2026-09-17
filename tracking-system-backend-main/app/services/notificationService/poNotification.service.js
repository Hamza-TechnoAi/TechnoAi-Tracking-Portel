const User = require('../../models/user.model');
const PurchaseOrder = require('../../models/purchaseOrder.model');
const PoSubscription = require('../../models/poSubscription.model');
const Notification = require('../../models/notification.model');
const Delivery = require('../../models/notificationDelivery.model');
const { STAFF_ROLES } = require('../../constants');
const { sendMailFunc } = require('../nodemailerService/nodemailer.service');

const isEmailNotificationsEnabled = () => (
  (process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true' || process.env.LINE_STATUS_NOTIFICATIONS_ENABLED === 'true')
  && Boolean(process.env.EMAIL && process.env.APP_PASSWORD)
);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const date = value => value ? new Date(value).toISOString().slice(0, 10) : 'Not set';
const getTrackingUrl = poNumber => {
  try {
    const url = new URL(process.env.PUBLIC_TRACKING_URL);
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    url.searchParams.set('po', poNumber);
    return url.href;
  } catch { return ''; }
};
// Explicit public fields only. Never interpolate an order object or internal remarks.
const publicEmail = (message, purchaseOrder) => {
  const url = getTrackingUrl(purchaseOrder.poNumber);
  return `<div style="font-family:Arial,sans-serif;color:#0f2233"><h2>TechnoAi Shipment Tracking</h2>
    <p>${escapeHtml(message)}</p><p>PO: ${escapeHtml(purchaseOrder.poNumber)}</p>
    <p>Status: ${escapeHtml(purchaseOrder.poStatus)}</p>
    ${url ? `<p><a href="${escapeHtml(url)}">View shipment</a></p>` : ''}</div>`;
};
const internalRecipients = type => (type === 'closed'
  ? (process.env.INTERNAL_EMAIL_PO_CLOSED || 'tracking@technoai.ae,info@technoai.ae,logistics@technoai.ae,tii@technoai.ae,accounts@technoai.ae')
  : (process.env.INTERNAL_EMAIL_TRACKING || process.env.NOTIFICATION_EMAIL_TO || 'tracking@technoai.ae')
).split(',');

let initialized;
const initializeNotifications = () => {
  if (!initialized) initialized = Promise.all([Notification.init(), Delivery.init()])
    .catch(error => { initialized = undefined; throw error; });
  return initialized;
};

const deliver = async ({ purchaseOrder, type, message, eventKey, customers = false }) => {
  await initializeNotifications();
  const staff = await User.find({ role: { $in: STAFF_ROLES }, isApproved: true, isBlocked: false }).select('_id');
  if (staff.length) {
    try {
      await Notification.bulkWrite(staff.map(user => ({ updateOne: {
        filter: { eventKey, recipient: user._id },
        update: { $setOnInsert: { eventKey, recipient: user._id, purchaseOrder: purchaseOrder._id, type, message, readAt: null } },
        upsert: true,
      } })), { ordered: false });
    } catch (error) {
      if (error.code !== 11000 || error.writeErrors?.some(entry => entry.code !== 11000)) throw error;
    }
  }
  if (!isEmailNotificationsEnabled()) return;
  const subscribers = customers ? await PoSubscription.find({ poNumber: purchaseOrder.poNumber }).select('email') : [];
  // One private email per unique recipient, even when internal and subscriber lists overlap.
  const recipients = new Set([...internalRecipients(type), ...subscribers.map(entry => entry.email)]
    .map(email => email?.trim().toLowerCase()).filter(Boolean));
  for (const email of recipients) {
    let claim;
    try { claim = await Delivery.create({ eventKey, email }); }
    catch (error) { if (error.code === 11000) continue; throw error; }
    try {
      await sendMailFunc({ to: email, subject: message, html: publicEmail(message, purchaseOrder) });
      await Delivery.updateOne({ _id: claim._id }, { $set: { status: 'sent' } });
    } catch {
      await Delivery.updateOne({ _id: claim._id }, { $set: { status: 'failed' } });
      console.warn('[po-notification] Email failed; not retried automatically:', type);
    }
  }
};
// Notification/database/SMTP failures must not turn a successfully saved order into an API failure.
const safely = fn => async (...args) => {
  try { await fn(...args); }
  catch (error) { console.error('[po-notification]', error.name); }
};
const revision = po => new Date(po.updatedAt).toISOString();
const notifyPoCreated = safely(po => deliver({
  purchaseOrder: po, type: 'created', message: `PO ${po.poNumber} created`, eventKey: `${po._id}:created`,
}));
const notifyLineStatusChange = safely(({ purchaseOrder: po, line, previousStatus, previousEta }) => {
  const statusChanged = previousStatus !== line.status;
  const etaChanged = date(previousEta) !== date(line.eta);
  if (!statusChanged && !etaChanged) return;
  const changes = [statusChanged ? `status: ${previousStatus} ? ${line.status}` : '',
    etaChanged ? `ETA: ${date(previousEta)} ? ${date(line.eta)}` : ''].filter(Boolean).join('; ');
  return deliver({ purchaseOrder: po, type: 'line_updated', customers: true,
    message: `PO ${po.poNumber}, item ${line.lineNumber}: ${changes}`,
    eventKey: `${po._id}:line:${line._id || line.lineNumber}:${revision(po)}` });
});
const notifyPoClosed = safely(po => {
  if (po.poStatus !== 'Closed') return;
  return deliver({ purchaseOrder: po, type: 'closed', customers: true,
    message: `PO ${po.poNumber} closed`, eventKey: `${po._id}:closed:${revision(po)}` });
});
const notifyPoEtaChange = safely((po, previousEta) => {
  if (date(previousEta) === date(po.overallPoEta)) return;
  return deliver({ purchaseOrder: po, type: 'eta_updated', customers: true,
    message: `PO ${po.poNumber} ETA: ${date(previousEta)} ? ${date(po.overallPoEta)}`,
    eventKey: `${po._id}:eta:${revision(po)}` });
});

const checkOverdue = async (now = new Date()) => {
  // ETAs are calendar dates: due today is not overdue until the next UTC day.
  const cutoff = new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`);
  await initializeNotifications();
  const cursor = PurchaseOrder.find({ poStatus: 'Open', $or: [
    { overallPoEta: { $lt: cutoff } },
    { lines: { $elemMatch: { status: { $ne: 'Delivered' }, eta: { $lt: cutoff } } } },
  ] }).cursor();
  for await (const po of cursor) {
    const overdue = po.lines.filter(line => line.status !== 'Delivered' && line.eta && line.eta < cutoff);
    for (const line of overdue) {
      await deliver({ purchaseOrder: po, type: 'overdue',
        message: `PO ${po.poNumber}, item ${line.lineNumber} overdue (ETA ${date(line.eta)})`,
        eventKey: `${po._id}:overdue:${line._id}:${date(line.eta)}` });
    }
    if (!overdue.length && po.overallPoEta < cutoff) {
      await deliver({ purchaseOrder: po, type: 'overdue',
        message: `PO ${po.poNumber} overdue (ETA ${date(po.overallPoEta)})`,
        eventKey: `${po._id}:overdue:overall:${date(po.overallPoEta)}` });
    }
  }
};
let overdueTimer;
const startOverdueChecks = () => {
  if (overdueTimer || process.env.OVERDUE_CHECK_ENABLED === 'false') return;
  const run = async () => {
    try { await checkOverdue(); } catch (error) { console.error('[overdue-check]', error.name); }
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(24, 0, 0, 0);
    overdueTimer = setTimeout(run, next - now);
    overdueTimer.unref();
  };
  overdueTimer = setTimeout(run, 0); // catch up after downtime; database keys suppress repeats
  overdueTimer.unref();
};
module.exports = { initializeNotifications, isEmailNotificationsEnabled, notifyPoCreated,
  notifyLineStatusChange, notifyPoClosed, notifyPoEtaChange, checkOverdue, startOverdueChecks,
  publicEmail };
