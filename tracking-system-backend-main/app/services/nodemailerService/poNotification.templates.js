const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
};

const layout = ({ title, bodyHtml, trackingUrl }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#eef4f8;font-family:Arial,sans-serif;color:#0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dbe7ef;">
            <tr>
              <td style="padding:20px 24px;background:#0f2233;color:#ffffff;font-size:20px;font-weight:700;">
                TechnoAi Shipment Tracking
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 16px;font-size:18px;">${title}</h2>
                ${bodyHtml}
                ${
                  trackingUrl
                    ? `<p style="margin:24px 0 0;"><a href="${trackingUrl}" style="display:inline-block;padding:10px 16px;background:#2ebdb4;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">View shipment</a></p>`
                    : ''
                }
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f8fbfd;font-size:12px;color:#64748b;">
                This is an automated notification from TechnoAi PO Shipment Tracking.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const poCreatedTemplate = ({ purchaseOrder, trackingUrl }) => layout({
  title: `Purchase order ${purchaseOrder.poNumber} created`,
  trackingUrl,
  bodyHtml: `
    <p style="margin:0 0 12px;">A new purchase order has been created in the tracking system.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;">PO Number</td><td style="padding:6px 0;"><strong>${purchaseOrder.poNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">SO Number</td><td style="padding:6px 0;"><strong>${purchaseOrder.soNumber || '—'}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Client</td><td style="padding:6px 0;"><strong>${purchaseOrder.clientName || '—'}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">PO Date</td><td style="padding:6px 0;"><strong>${formatDate(purchaseOrder.poDate)}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Overall ETA</td><td style="padding:6px 0;"><strong>${formatDate(purchaseOrder.overallPoEta)}</strong></td></tr>
    </table>
  `,
});

const lineStatusUpdatedTemplate = ({
  purchaseOrder,
  line,
  previousStatus,
  newStatus,
  trackingUrl,
}) => layout({
  title: `PO ${purchaseOrder.poNumber} status updated`,
  trackingUrl,
  bodyHtml: `
    <p style="margin:0 0 12px;">A line item status has changed on purchase order <strong>${purchaseOrder.poNumber}</strong>.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;">Line #</td><td style="padding:6px 0;"><strong>${line.lineNumber}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Description</td><td style="padding:6px 0;"><strong>${line.description || '—'}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Previous status</td><td style="padding:6px 0;"><strong>${previousStatus}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">New status</td><td style="padding:6px 0;"><strong>${newStatus}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">PO status</td><td style="padding:6px 0;"><strong>${purchaseOrder.poStatus}</strong></td></tr>
    </table>
  `,
});

const poClosedTemplate = ({ purchaseOrder, trackingUrl }) => layout({
  title: `PO ${purchaseOrder.poNumber} closed`,
  trackingUrl,
  bodyHtml: `
    <p style="margin:0 0 12px;">Purchase order <strong>${purchaseOrder.poNumber}</strong> has been closed because all line items are delivered.</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;">
      <tr><td style="padding:6px 0;color:#64748b;">Client</td><td style="padding:6px 0;"><strong>${purchaseOrder.clientName || '—'}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Lines delivered</td><td style="padding:6px 0;"><strong>${purchaseOrder.numberOfLines || purchaseOrder.lines?.length || 0}</strong></td></tr>
      <tr><td style="padding:6px 0;color:#64748b;">Closing date</td><td style="padding:6px 0;"><strong>${formatDate(purchaseOrder.actualPoClosingDate || new Date())}</strong></td></tr>
    </table>
  `,
});

module.exports = {
  poCreatedTemplate,
  lineStatusUpdatedTemplate,
  poClosedTemplate,
};
