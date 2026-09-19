import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { SITE } from '../Constants/site';
import { formatPoDate } from './formatters';

const REPORT_HEADERS = [
  'PO Number',
  'SO Number',
  'Client',
  'Sales person',
  'Contact person',
  'Payment terms',
  'PO Date',
  'Overall ETA',
  'Status',
  'Lines',
  'LD',
  'LP',
  'PO Total Amount',
];

const REPORT_TITLE = 'Purchase Order Report';
const COMPANY_NAME = SITE.name || 'TechnoAi';

export const getPoLineMetrics = (po = {}) => {
  const lines = Array.isArray(po.lines) ? po.lines : [];
  const total = Number(po.numberOfLines ?? lines.length) || 0;
  const delivered = lines.filter((line) => line.status === 'Delivered').length;

  return {
    total,
    delivered,
    pending: Math.max(total - delivered, 0),
  };
};

export const formatPoTotalAmount = (po = {}) => {
  const totalsByCurrency = (po.lines || []).reduce((totals, line) => {
    const currency = line.currency || 'AED';
    const amount = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
    totals[currency] = (totals[currency] || 0) + amount;
    return totals;
  }, {});

  const totals = Object.entries(totalsByCurrency);
  if (totals.length === 0) return '—';

  return totals
    .map(([currency, amount]) => `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`)
    .join(' · ');
};

const mapPurchaseOrderToRow = (po) => {
  const lineMetrics = getPoLineMetrics(po);

  return [
    po.poNumber || '',
    po.soNumber || '',
    po.clientName || '',
    po.salesPerson || '',
    po.contactPerson || '',
    po.paymentTerms || '',
    formatPoDate(po.poDate),
    formatPoDate(po.overallPoEta),
    po.poStatus || '',
    String(lineMetrics.total),
    String(lineMetrics.delivered),
    String(lineMetrics.pending),
    formatPoTotalAmount(po),
  ];
};

const buildFileName = (extension) => {
  const stamp = new Date().toISOString().slice(0, 10);
  return `technoai-po-report-${stamp}.${extension}`;
};

const triggerDownload = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const formatDisplayDate = (value) => {
  if (!value) return '—';
  return formatPoDate(value) || value;
};

const buildFilterSummary = (filters = {}) => {
  const lines = [];

  if (filters.allPos) {
    lines.push('Period: All purchase orders');
  } else {
    const from = formatDisplayDate(filters.dateFrom);
    const to = formatDisplayDate(filters.dateTo);
    lines.push(`Period: ${from}  to  ${to}`);
  }

  if (filters.salesPerson) lines.push(`Sales person: ${filters.salesPerson}`);
  if (filters.clientName) lines.push(`Client: ${filters.clientName}`);
  if (filters.status) lines.push(`Status: ${filters.status}`);
  if (filters.poNumber) lines.push(`PO number: ${filters.poNumber}`);
  if (filters.soNumber) lines.push(`SO number: ${filters.soNumber}`);
  if (filters.contactPerson) lines.push(`Contact: ${filters.contactPerson}`);
  if (filters.supplier) lines.push(`Supplier: ${filters.supplier}`);
  if (filters.country) lines.push(`Country: ${filters.country}`);
  if (filters.currency) lines.push(`Currency: ${filters.currency}`);
  if (filters.upcomingClosingBy) {
    lines.push(`Upcoming closing by: ${formatDisplayDate(filters.upcomingClosingBy)}`);
  }

  return lines;
};

const drawCenteredText = (doc, text, y, options = {}) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(text, pageWidth / 2, y, { align: 'center', ...options });
};

const drawReportHeader = (doc, { filters, recordCount, generatedAt }) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftX = 40;
  const rightX = pageWidth - 40;
  const filterLines = buildFilterSummary(filters);

  // Top brand header band
  doc.setFillColor(15, 34, 51);
  doc.rect(0, 0, pageWidth, 58, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  drawCenteredText(doc, COMPANY_NAME, 24);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  drawCenteredText(doc, REPORT_TITLE, 42);

  // Meta row under brand band
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');

  let leftY = 74;
  filterLines.slice(0, 4).forEach((line) => {
    doc.text(line, leftX, leftY);
    leftY += 11;
  });

  const rightLines = [
    `Generated on: ${generatedAt}`,
    `Total records: ${recordCount}`,
    `Report type: Operational PO Report`,
  ];

  let rightY = 74;
  rightLines.forEach((line) => {
    doc.text(line, rightX, rightY, { align: 'right' });
    rightY += 11;
  });

  const dividerY = Math.max(leftY, rightY) + 4;
  doc.setDrawColor(15, 34, 51);
  doc.setLineWidth(0.8);
  doc.line(leftX, dividerY, rightX, dividerY);

  return dividerY + 10;
};

const drawReportFooter = (doc) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageCount = doc.getNumberOfPages();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    doc.setPage(pageNumber);
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.5);
    doc.line(40, pageHeight - 28, pageWidth - 40, pageHeight - 28);

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${COMPANY_NAME}  |  Confidential`,
      40,
      pageHeight - 14,
    );
    doc.text(
      `Page ${pageNumber} of ${pageCount}`,
      pageWidth - 40,
      pageHeight - 14,
      { align: 'right' },
    );
  }
};

export const exportPurchaseOrdersToExcel = (purchaseOrders = []) => {
  const rows = purchaseOrders.map(mapPurchaseOrderToRow);
  const worksheet = XLSX.utils.aoa_to_sheet([REPORT_HEADERS, ...rows]);
  worksheet['!cols'] = REPORT_HEADERS.map((header) => ({
    wch: Math.max(header.length + 2, 14),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PO Report');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob(
    [excelBuffer],
    { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  );
  triggerDownload(blob, buildFileName('xlsx'));
};

export const exportPurchaseOrdersToPdf = (purchaseOrders = [], options = {}) => {
  const {
    filters = {},
  } = options;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const generatedAt = new Date().toLocaleString();
  const startY = drawReportHeader(doc, {
    filters,
    recordCount: purchaseOrders.length,
    generatedAt,
  });

  autoTable(doc, {
    startY,
    head: [REPORT_HEADERS],
    body: purchaseOrders.map(mapPurchaseOrderToRow),
    styles: {
      fontSize: 8,
      cellPadding: 4,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 34, 51],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 250, 252],
    },
    margin: { left: 40, right: 40, top: 70, bottom: 40 },
    didDrawPage: (data) => {
      // Keep brand header on continuation pages
      if (data.pageNumber > 1) {
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFillColor(15, 34, 51);
        doc.rect(0, 0, pageWidth, 42, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        drawCenteredText(doc, `${COMPANY_NAME} — ${REPORT_TITLE}`, 26);
        doc.setTextColor(0, 0, 0);
      }
    },
  });

  drawReportFooter(doc);
  doc.save(buildFileName('pdf'));
};
