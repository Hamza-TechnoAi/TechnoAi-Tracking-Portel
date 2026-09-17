// Keep extraction conservative: only labeled fields and recognizable table columns.
const labels = {
  poNumber: '(?:P\\.?O\\.?\\s*(?:number|no\\.?|#)|purchase order\\s*(?:number|no\\.?|#))',
  soNumber: '(?:S\\.?O\\.?\\s*(?:number|no\\.?|#)|sales order\\s*(?:number|no\\.?|#)|quotation\\s*(?:ref(?:erence)?\\s*(?:number|no\\.?|#)?|number|no\\.?|#)|(?:doc\\.?|document)\\s*(?:number|no\\.?|#))',
  poDate: '(?:PO(?:\\s+issue)? date|purchase order date|order(?:\\s+issue)? date|date)',
  clientName: '(?:client name|customer name|buyer)',
  salesPerson: '(?:sales person|salesperson|sales representative|prepared by(?: name)?)',
  paymentTerms: '(?:payment terms)',
  contactPersonEmail: '(?:contact person email|contact email|email)',
  contactPerson: '(?:contact person|contact name|attention)',
  overallPoEta: '(?:overall PO ETA|delivery date|required date|expected delivery)',
  subject: '(?:subject)',
  internalNotes: '(?:internal notes)',
};
const labelPattern = Object.values(labels).join('|');

export function parsePdfDate(value, preferDayFirst = false) {
  value = value.trim().replace(/\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?$/i, '');
  value = value.replace(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/, '$2 $1 $3');
  let match = value.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year, month, day;
  if (match) [, year, month, day] = match;
  else {
    match = value.trim().match(/^(\d{1,2})[- /]([A-Za-z]{3,9})[- ,/]+(\d{4})$/);
    if (match) {
      day = match[1]; year = match[3];
      month = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'].indexOf(match[2].slice(0,3).toLowerCase()) + 1;
    } else {
      match = value.trim().match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{4})$/);
      if (!match) return '';
      if (Number(match[2]) > 12) [, month, day, year] = match;
      else {
      if (!preferDayFirst && Number(match[1]) <= 12 && match[1] !== match[2]) return '';
      [, day, month, year] = match;
      }
    }
  }
  const date = new Date(Date.UTC(Number(year), Number(month)-1, Number(day)));
  if (date.getUTCFullYear() !== Number(year) || date.getUTCMonth()+1 !== Number(month) || date.getUTCDate() !== Number(day)) return '';
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const columnType = (text) => {
  const value = text.toLowerCase().replace(/[.#:]/g, '').trim();
  if (/^(no|line|item|sl|s\/n)( number| no)?$/.test(value)) return 'lineNumber';
  if (/^(description|item description|material description|part description)$/.test(value)) return 'description';
  if (/^(qty|quantity|delivered qty|delivered quantity)$/.test(value)) return 'quantity';
  if (/^(unit price|price|rate)$/.test(value)) return 'unitPrice';
  if (/^(status|delivery status)$/.test(value)) return 'deliveryStatus';
  if (/^(currency|curr)$/.test(value)) return 'currency';
  if (/^(eta|delivery date)$/.test(value)) return 'eta';
  return null;
};

// Customer-issued POs have separate customer, supplier and delivery-contact blocks.
// Read exact label cells within their row so neighboring metadata cannot become a value.
function customerOrderFields(pages) {
  const rows = pages[0] || [];
  const read = label => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const index = row.findIndex(cell => label.test(cell.text.trim()));
      if (index < 0) continue;
      const values = [];
      for (const cell of row.slice(index + 1)) {
        if (/^[A-Za-z][^:]{0,60}:$/.test(cell.text.trim())) break;
        values.push(cell.text);
      }
      if (values.length) return values.join(' ').trim();

      // Some PO generators wrap a long value onto the rows beneath its label.
      // Collect only the value column and stop at the next left-hand label.
      const labelX = row[index].x;
      const nextLabel = row.slice(index + 1).find(cell => /^[A-Za-z][^:]{0,60}:$/.test(cell.text.trim()));
      const rightBoundary = nextLabel?.x ?? Infinity;
      const continued = [];
      for (const nextRow of rows.slice(rowIndex + 1)) {
        if (nextRow.some(cell => cell.x <= labelX + 8 && /^[A-Za-z][^:]{0,60}:$/.test(cell.text.trim()))) break;
        const rowValue = nextRow
          .filter(cell => cell.x > labelX + 30 && cell.x < rightBoundary - 5)
          .map(cell => cell.text)
          .join(' ')
          .trim();
        if (rowValue) continued.push(rowValue);
      }
      return continued.join(' ').trim();
    }
    return '';
  };
  const readCustomer = () => {
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex];
      const index = row.findIndex(cell => /^Customer:$/i.test(cell.text.trim()));
      if (index < 0) continue;
      const directCells = [];
      for (const cell of row.slice(index + 1)) {
        if (/^[A-Za-z][^:]{0,60}:$/.test(cell.text.trim())) break;
        directCells.push(cell.text);
      }
      const directValue = directCells.join(' ').trim();
      if (directValue) return directValue;

      const labelX = row[index].x;
      const nextLabel = row.slice(index + 1).find(cell => /^[A-Za-z][^:]{0,60}:$/.test(cell.text.trim()));
      const rightBoundary = nextLabel?.x ?? Infinity;
      const valueFromRow = candidate => candidate?.filter(cell => cell.x > labelX + 30 && cell.x < rightBoundary - 5)
        .map(cell => cell.text)
        .join(' ')
        .trim();
      // In some generated POs the first line is visually above "Customer:"
      // and the remainder is below it. The neighboring rows contain only its name.
      return [valueFromRow(rows[rowIndex - 1]), valueFromRow(rows[rowIndex + 1])]
        .filter(Boolean)
        .join(' ');
    }
    return '';
  };
  const customer = readCustomer();
  if (!customer || !read(/^Supplier Name:$/i)) return null;
  const fields = { clientName: customer };
  const values = {
    poNumber: read(/^PO No\.:$/i), poDate: parsePdfDate(read(/^PO Issue Date:$/i), true),
    soNumber: read(/^Quotation Ref No\.:$/i),
    paymentTerms: read(/^Payment Terms:$/i), subject: read(/^Subject:$/i),
    contactPerson: read(/^Delivery Contact:$/i),
  };
  for (const [key, value] of Object.entries(values)) if (value) fields[key] = value;
  // Prefer the explicitly named delivery contact's email, never the supplier's email.
  const deliveryRow = rows.findIndex(row => row.some(cell => /^Delivery Contact:$/i.test(cell.text.trim())));
  let email = '';
  if (deliveryRow >= 0) {
    const contactX = rows[deliveryRow].find(cell => /^Delivery Contact:$/i.test(cell.text.trim())).x;
    for (const row of rows.slice(deliveryRow + 1, deliveryRow + 4)) {
      const cells = row.filter(cell => cell.x >= contactX - 5);
      const index = cells.findIndex(cell => /^E-?mail:$/i.test(cell.text.trim()));
      if (index >= 0) email = cells.slice(index + 1).map(cell => cell.text).join(' ').match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || '';
      if (email) break;
    }
  }
  if (!email && !fields.contactPerson) email = read(/^Buyer E-?mail:$/i);
  if (email) fields.contactPersonEmail = email;
  const currency = read(/^PO Currency:$/i);
  return { fields, currency: /^(AED|USD|CNY)$/.test(currency) ? currency : '' };
}

export function parsePoPdfRows(pages, documentType = 'po') {
  const fields = {}, lines = [], warnings = [];
  const text = pages.flat().map(row => row.map(cell => cell.text).join('  ')).join('\n');
  const customerOrder = documentType === 'po' ? customerOrderFields(pages) : null;
  if (customerOrder) Object.assign(fields, customerOrder.fields);
  // A delivery PDF can share the same PO header layout but still contain
  // "Prepared by". Keep the precise customer-PO mapping while also reading it.
  const fieldsToParse = customerOrder ? { salesPerson: labels.salesPerson } : labels;
  for (const [key, label] of Object.entries(fieldsToParse)) {
    const regex = new RegExp(`(?:^|\\n| {2,})${label}\\s*[:：]?\\s*(.*?)(?= {2,}(?:${labelPattern})\\s*[:：]?|\\n|$)`, 'i');
    const match = text.match(regex);
    if (!match?.[1]?.trim()) continue;
    const value = match[1].trim();
    if (key === 'poDate' || key === 'overallPoEta') {
      const date = parsePdfDate(value);
      if (date) fields[key] = date;
      else warnings.push(`Check ${key}: "${value}" could not be read as an unambiguous date.`);
    } else if (key === 'contactPersonEmail') {
      const email = value.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
      if (email) fields[key] = email[0];
    } else fields[key] ||= value;
  }
  // Delivery notes often place "Prepared by" in a compact footer where the
  // generic label parser cannot see a row boundary. Stop at the next footer label.
  const preparedBy = text.match(/\bPrepared\s+by\s*:\s*(.+?)(?=\s{2,}(?:Received\s+by|Order\s+No|Reference|Doc\s+No|Date)\s*:|\n|$)/i);
  if (preparedBy?.[1]?.trim()) fields.salesPerson = preparedBy[1].trim();
  // Standard sales-order layouts put the document fields in a right-hand block.
  // Read them directly so they cannot be confused with the customer-address block.
  let documentCurrency = '';
  if (documentType === 'so') {
    const docNumber = text.match(/\bDoc\s*No\.?\s*:\s*([^\n]+)/i)?.[1]?.trim();
    if (docNumber) fields.soNumber = docNumber.split(/\s{2,}/)[0].trim();
    const documentDate = text.match(/\bDate\s*:\s*([^\n]+)/i)?.[1]?.trim();
    const parsedDocumentDate = documentDate && parsePdfDate(documentDate, false);
    if (parsedDocumentDate) fields.poDate = parsedDocumentDate;
    const terms = text.match(/\bPayment\s*Terms\s*:\s*([^\n]+)/i)?.[1]?.trim();
    if (terms) fields.paymentTerms = terms.split(/\s{2,}/)[0].trim();
    documentCurrency = text.match(/\bCurrency\s*:\s*(AED|USD|CNY)\b/i)?.[1]?.toUpperCase() || '';
  }
  for (const rows of pages) {
    if (documentType !== 'so') continue;
    const start = rows.findIndex(row => row.some(c => /^customer details:?$/i.test(c.text.trim())));
    if (start < 0) continue;
    const header = rows[start].find(c => /^customer details:?$/i.test(c.text.trim()));
    const metadata = rows.flat().find(c => /^(?:doc(?:ument)?\.?\s*(?:no\.?|number)|payment terms)\s*:/i.test(c.text));
    const right = metadata && metadata.x > header.x ? metadata.x - 10 : Infinity;
    const block = [];
    for (const row of rows.slice(start+1)) {
      if (row.some(c => columnType(c.text) === 'description')) break;
      const value = row.filter(c => c.x >= header.x-5 && c.x < right).map(c=>c.text).join(' ').trim();
      if (value) block.push(value);
    }
    const emailLine = block.find(t => /@/.test(t));
    const contact = emailLine?.match(/(?:E(?:mail)?\s*:\s*)?['"]?([^<>]+?)['"]?\s*<([^>]+@[^>]+)>/i);
    if (contact) {
      fields.contactPerson ||= contact[1].trim().replace(/^['"]|['"]$/g,'');
      fields.contactPersonEmail ||= contact[2].trim();
    } else if (emailLine) {
      fields.contactPersonEmail ||= emailLine.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0];
    }
    if (block[0]) {
      let name = block[0];
      // Customer details may print the legal suffix and contact on one line,
      // e.g. "L.L.C, Erimaine Cruz". Keep the suffix with the company and
      // put the text after the comma into the contact-person field.
      const legalSuffixWithContact = block[1]?.match(/^((?:L\.?\s*L\.?\s*C\.?|Ltd\.?|Limited|Inc\.?)\b)\s*,\s*(.+)$/i);
      if (legalSuffixWithContact) {
        name += ` ${legalSuffixWithContact[1]}`;
        fields.contactPerson ||= legalSuffixWithContact[2].trim();
      } else if (block[1] && /^(L\.?L\.?C\.?|Ltd\.?|Limited|Inc\.?)\b/i.test(block[1])) {
        name += ' ' + block[1];
      }
      if (fields.contactPerson) {
        const index = name.toLowerCase().indexOf(fields.contactPerson.toLowerCase());
        if (index >= 0) name = name.slice(0,index).replace(/[,\s]+$/,'');
      }
      fields.clientName = name;
    }
  }
  for (const rows of pages) {
    let columns = null;
    for (const row of rows) {
      const headers = row.map(cell => ({ ...cell, key: columnType(cell.text) }));
      if (headers.some(c => c.key === 'description') && headers.some(c => c.key === 'quantity')) {
        // Include ignored columns so totals/SKUs don't spill into adjacent fields.
        columns = headers;
        continue;
      }
      if (!columns) continue;
      const values = {};
      for (const [index, cell] of row.entries()) {
        const column = row.length === columns.length ? columns[index] : columns.reduce((best, c) => Math.abs(c.x-cell.x) < Math.abs(best.x-cell.x) ? c : best);
        if (column.key) values[column.key] = [values[column.key], cell.text].filter(Boolean).join(' ');
      }
      if (/^(sub\s*total|total|vat|tax|grand total)\b/i.test(row.map(c=>c.text).join(' '))) { columns = null; continue; }
      if (!values.description || !/^\d+(?:\.\d+)?$/.test((values.quantity || '').replace(/,/g,''))) continue;
      const line = { description: values.description, quantity: values.quantity.replace(/,/g,''), currency: '', unitPrice: '', lineNumber: '', eta: '', deliveryStatus: values.deliveryStatus || '' };
      if (/^\d+$/.test(values.lineNumber || '')) line.lineNumber = values.lineNumber;
      const price = (values.unitPrice || '').replace(/\b(AED|USD|CNY)\b/gi,'').replace(/,/g,'').trim();
      if (/^\d+(?:\.\d+)?$/.test(price)) line.unitPrice = price;
      const currency = `${values.currency || customerOrder?.currency || documentCurrency || ''} ${values.unitPrice || ''}`.match(/\b(AED|USD|CNY)\b/i);
      if (currency) line.currency = currency[1].toUpperCase();
      if (values.eta) line.eta = parsePdfDate(values.eta);
      lines.push(line);
    }
  }
  if (customerOrder && lines.length && lines.every(line => line.eta) && !fields.overallPoEta) {
    fields.overallPoEta = lines.map(line => line.eta).sort().at(-1);
  }
  if (!lines.length) warnings.push('No recognizable line-item table found. Add line items manually.');
  warnings.push('Review extracted values and complete missing fields before creating the PO.');
  return { fields, lines, warnings, text };
}

export function matchSalesPerson(name, options) {
  const normalize = value => value.trim().replace(/[^a-z0-9]+/gi, ' ').replace(/\s+/g, ' ').toLowerCase();
  const matches = options.filter(option => normalize(option) === normalize(name));
  if (matches.length === 1) return matches[0];
  // Permit a unique shortened version such as "M. Awais" only when it cannot
  // refer to more than one person in the configured sales-person list.
  const words = normalize(name).split(' ').filter(Boolean);
  const partialMatches = options.filter(option => {
    const optionWords = normalize(option).split(' ').filter(Boolean);
    return words.length > 1 && words.every((word, index) =>
      word.length === 1 ? optionWords[index]?.startsWith(word) : optionWords.includes(word));
  });
  return partialMatches.length === 1 ? partialMatches[0] : '';
}

// Explicit Remarks line references identify PO lines; table rows use descriptions.
export function parseDeliveryRemarks(text) {
  const remarks = text.match(/\bRemarks\s*:?\s*([\s\S]*)/i);
  if (!remarks) return null;
  const match = remarks[1].match(/(?:^|\n)\s*Lines?\s*(?:Nos?\.?|Numbers?)?\s*[:#-]\s*([^\n]*(?:\n[ \t]*\d[^\n]*)*)/i)
    || remarks[1].match(/^\s*((?:\d+\s*(?:[-–]\s*\d+)?\s*[,;&]?\s*)+)(?:\n|$)/);
  if (!match) return null;
  const input = match[1].trim().replace(/[??]/g, '-').replace(/\band\b/gi, '&');
  const parts = input.split(/[,;&]/).map(part => part.trim());
  const numbers = new Set();
  for (const part of parts) {
    const range = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!range) throw new Error('The Remarks line list could not be read. Check its numbers and ranges.');
    const start = Number(range[1]), end = Number(range[2] || range[1]);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end-start > 10000) {
      throw new Error('The Remarks line list contains an invalid range.');
    }
    for (let number=start; number<=end; number++) numbers.add(number);
    if (numbers.size > 10000) throw new Error('The Remarks line list is too large.');
  }
  return [...numbers];
}
export function matchDeliveryLines(result, existingLines) {
  const normalize = value => String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const isDeliveryNote = /\bdelivery (?:note|order|receipt)\b|\bproof of delivery\b/i.test(result.text);
  const dateMatch = result.text.match(/(?:^|\n| {2,})(?:delivery date|delivered on|date)\s*:\s*([^\n]+)/i);
  const documentDate = dateMatch ? parsePdfDate(dateMatch[1].split(/ {2,}(?=[A-Za-z])/)[0].trim(), true) : '';
  const updates = [], additions = [], warnings = [];
  const referencedLines = parseDeliveryRemarks(result.text);
  if (referencedLines) {
    if (!documentDate) return { updates, additions, warnings: ['A clear delivery date was not found. No lines were changed.'] };
    for (const number of referencedLines) {
      const matches = existingLines.map((item,index)=>({item,index})).filter(({item})=>String(item.lineNumber).trim() !== '' && Number(item.lineNumber) === number);
      if (matches.length !== 1) {
        const deliveryMatches = result.lines.filter(line => Number(line.lineNumber) === number);
        // Delivery notes commonly use 1, 2, 3... as their own serials while
        // the PO uses 10, 20, 60... . Map the delivery serial to the same
        // ordered PO row before considering it a missing line.
        const orderedPoMatch = !matches.length && Number.isInteger(number)
          ? existingLines[number - 1]
          : null;
        if (orderedPoMatch) {
          const existingIndex = existingLines.indexOf(orderedPoMatch);
          if (!updates.some(update => update.index === existingIndex)) {
            updates.push({ index: existingIndex, eta: deliveryMatches[0]?.eta || documentDate, status: 'Delivered' });
          }
          continue;
        }
        if (!matches.length && deliveryMatches.length === 1) {
          const line = deliveryMatches[0];
          if (line.description && Number(line.quantity) > 0 && Number(line.unitPrice) >= 0) {
            additions.push({ ...line, eta: line.eta || documentDate, status: 'Delivered' });
            continue;
          }
          warnings.push(`Line ${number}: found in the delivery PDF, but its description, quantity, or price is missing so it could not be added.`);
        }
        if (!matches.length) {
          additions.push({
            lineNumber: String(number),
            eta: documentDate,
            status: 'Delivered',
            internalRemarks: 'Added from delivery PDF remarks. Complete the item details.',
          });
          warnings.push(`Line ${number}: added from delivery PDF remarks. Complete its item details before creating the PO.`);
          continue;
        }
        warnings.push(`Line ${number}: duplicate PO line number.`);
        continue;
      }
      updates.push({index: matches[0].index, eta: documentDate, status:'Delivered'});
    }
    return { updates, additions, warnings };
  }
  const counts = new Map();
  for (const line of result.lines) counts.set(normalize(line.description), (counts.get(normalize(line.description)) || 0)+1);
  const usesSequentialDeliverySerials = result.lines.length > 0
    && result.lines.every((line, index) => Number(line.lineNumber) === index + 1);
  for (const [deliveryIndex, line] of result.lines.entries()) {
    const label = line.description || `Line ${line.lineNumber}`;
    const status = normalize(line.deliveryStatus);
    if (status ? status !== 'delivered' : !isDeliveryNote) {
      warnings.push(`${label}: delivery is not confirmed by this document.`); continue;
    }
    const orderedMatch = usesSequentialDeliverySerials && existingLines[deliveryIndex]
      ? [{ item: existingLines[deliveryIndex], index: deliveryIndex }]
      : [];
    const matches = orderedMatch.length
      ? orderedMatch
      : existingLines.map((item,index)=>({item,index})).filter(({item})=>normalize(item.description) === normalize(line.description));
    if (matches.length !== 1 || counts.get(normalize(line.description)) !== 1) {
      warnings.push(`${label}: no unique matching PO line.`); continue;
    }
    const {item,index} = matches[0];
    if (!(Number(line.quantity)>0) || Number(line.quantity) !== Number(item.quantity)) {
      warnings.push(`${label}: quantity differs or is partial; update manually.`); continue;
    }
    const eta = line.eta || documentDate;
    if (!eta) { warnings.push(`${label}: a clear delivery date was not found.`); continue; }
    updates.push({index, eta, status:'Delivered'});
  }
  if (!result.lines.length) warnings.push('No delivery line items recognized in this PDF.');
  return {updates, additions, warnings};
}
