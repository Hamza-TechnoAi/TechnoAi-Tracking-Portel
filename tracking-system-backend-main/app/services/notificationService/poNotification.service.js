const PoSubscription = require('../../models/poSubscription.model');
const { sendMailFunc } = require('../nodemailerService/nodemailer.service');
const {
  poCreatedTemplate,
  lineStatusUpdatedTemplate,
  poClosedTemplate,
} = require('../nodemailerService/poNotification.templates');

const DEFAULT_TRACKING_RECIPIENT = 'tracking@technoai.ae';

const DEFAULT_PO_CLOSED_RECIPIENTS = [
  'tracking@technoai.ae',
  'info@technoai.ae',
  'logistics@technoai.ae',
  'tii@technoai.ae',
  'accounts@technoai.ae',
];

const parseRecipientList = (value, fallback = []) => {
  if (!value?.trim()) return fallback;
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
};

const isEmailNotificationsEnabled = () => {
  const enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true'
    || process.env.LINE_STATUS_NOTIFICATIONS_ENABLED === 'true';

  return enabled && Boolean(process.env.EMAIL && process.env.APP_PASSWORD);
};

const getTrackingRecipient = () => (
  process.env.INTERNAL_EMAIL_TRACKING?.trim()
  || process.env.NOTIFICATION_EMAIL_TO?.trim()
  || DEFAULT_TRACKING_RECIPIENT
);

const getPoClosedRecipients = () => parseRecipientList(
  process.env.INTERNAL_EMAIL_PO_CLOSED,
  DEFAULT_PO_CLOSED_RECIPIENTS,
);

const getTrackingUrl = (poNumber) => {
  const baseUrl = (process.env.PUBLIC_TRACKING_URL || '').replace(/\/$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/?po=${encodeURIComponent(poNumber)}`;
};

const sendNotification = async ({ to, subject, html }) => {
  if (!isEmailNotificationsEnabled()) {
    console.warn('[po-notification:skipped]', subject, '- EMAIL_NOTIFICATIONS_ENABLED/EMAIL/APP_PASSWORD not ready');
    return { sent: false, reason: 'disabled' };
  }

  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) {
    console.warn('[po-notification:skipped]', subject, '- no recipients');
    return { sent: false, reason: 'no-recipients' };
  }

  try {
    await sendMailFunc({ to: recipients, subject, html });
    console.log('[po-notification:sent]', subject, '->', recipients.join(', '));
    return { sent: true };
  } catch (error) {
    console.error('[po-notification:error]', subject, error?.error || error);
    return { sent: false, reason: 'send-failed', error };
  }
};

const getSubscriberEmails = async (poNumber) => {
  const subscriptions = await PoSubscription.find({ poNumber }).select('email');
  return subscriptions.map((entry) => entry.email).filter(Boolean);
};

const notifyPoCreated = async (purchaseOrder) => {
  if (!purchaseOrder) return;

  await sendNotification({
    to: getTrackingRecipient(),
    subject: `PO ${purchaseOrder.poNumber} created`,
    html: poCreatedTemplate({
      purchaseOrder,
      trackingUrl: getTrackingUrl(purchaseOrder.poNumber),
    }),
  });
};

const notifyLineStatusChange = async ({
  purchaseOrder,
  line,
  previousStatus,
  newStatus,
}) => {
  if (!purchaseOrder || !line || previousStatus === newStatus) return;

  const trackingUrl = getTrackingUrl(purchaseOrder.poNumber);
  const html = lineStatusUpdatedTemplate({
    purchaseOrder,
    line,
    previousStatus,
    newStatus,
    trackingUrl,
  });

  await sendNotification({
    to: getTrackingRecipient(),
    subject: `PO ${purchaseOrder.poNumber} line ${line.lineNumber} status updated`,
    html,
  });

  const subscribers = await getSubscriberEmails(purchaseOrder.poNumber);
  if (subscribers.length) {
    await sendNotification({
      to: subscribers,
      subject: `Shipment update for PO ${purchaseOrder.poNumber}`,
      html,
    });
  }
};

const notifyPoClosed = async (purchaseOrder) => {
  if (!purchaseOrder || purchaseOrder.poStatus !== 'Closed') return;

  const trackingUrl = getTrackingUrl(purchaseOrder.poNumber);
  const html = poClosedTemplate({ purchaseOrder, trackingUrl });

  await sendNotification({
    to: getPoClosedRecipients(),
    subject: `PO ${purchaseOrder.poNumber} closed`,
    html,
  });

  const subscribers = await getSubscriberEmails(purchaseOrder.poNumber);
  if (subscribers.length) {
    await sendNotification({
      to: subscribers,
      subject: `PO ${purchaseOrder.poNumber} is now closed`,
      html,
    });
  }
};

module.exports = {
  isEmailNotificationsEnabled,
  notifyPoCreated,
  notifyLineStatusChange,
  notifyPoClosed,
};
