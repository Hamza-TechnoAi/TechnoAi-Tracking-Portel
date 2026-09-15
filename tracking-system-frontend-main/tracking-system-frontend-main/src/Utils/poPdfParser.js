// Keep extraction conservative: only labeled fields and recognizable table columns.
const labels = {
  poNumber: '(?:P\\.?O\\.?\\s*(?:number|no\\.?|#)|purchase order\\s*(?:number|no\\.?|#))',
  soNumber: '(?:S\\.?O\\.?\\s*(?:number|no\\.?|#)|sales order\\s*(?:number|no\\.?|#)|(?:doc\\.?|document)\\s*(?:number|no\\.?|#))',
  poDate: '(?:PO date|purchase order date|order date|date)',
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

export function parsePdfDate(value) {
  value = value.trim().replace(/\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?$/i, '');
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
        if (Number(match[1]) <= 12 && match[1] !== match[2]) return '';
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
  if (/^(line|item|sl|s\/n)( number| no)?$/.test(value)) return 'lineNumber';
  if (/^(description|item description|material description|part description)$/.test(value)) return 'description';
  if (/^(qty|quantity|delivered qty|delivered quantity)$/.test(value)) return 'quantity';
  if (/^(unit price|price|rate)$/.test(value)) return 'unitPrice';
  if (/^(status|delivery status)$/.test(value)) return 'deliveryStatus';
  if (/^(currency|curr)$/.test(value)) return 'currency';
  if (/^(eta|delivery date)$/.test(value)) return 'eta';
  return null;
};

export function parsePoPdfRows(pages) {
  const fields = {}, lines = [], warnings = [];
  const text = pages.flat().map(row => row.map(cell => cell.text).join('  ')).join('\n');
  for (const [key, label] of Object.entries(labels)) {
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
    } else fields[key] = value;
  }
  for (const rows of pages) {
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
    if (!fields.clientName && block[0]) {
      let name = block[0];
      if (block[1] && /^(L\.?L\.?C\.?|Ltd\.?|Limited|Inc\.?)\b/i.test(block[1])) name += ' ' + block[1];
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
      for (const cell of row) {
        const column = columns.reduce((best, c) => Math.abs(c.x-cell.x) < Math.abs(best.x-cell.x) ? c : best);
        if (column.key) values[column.key] = [values[column.key], cell.text].filter(Boolean).join(' ');
      }
      if (/^(sub\s*total|total|vat|tax|grand total)\b/i.test(row.map(c=>c.text).join(' '))) { columns = null; continue; }
      if (!values.description || !/^\d+(?:\.\d+)?$/.test((values.quantity || '').replace(/,/g,''))) continue;
      const line = { description: values.description, quantity: values.quantity.replace(/,/g,''), currency: '', unitPrice: '', lineNumber: '', eta: '', deliveryStatus: values.deliveryStatus || '' };
      if (/^\d+$/.test(values.lineNumber || '')) line.lineNumber = values.lineNumber;
      const price = (values.unitPrice || '').replace(/\b(AED|USD|CNY)\b/gi,'').replace(/,/g,'').trim();
      if (/^\d+(?:\.\d+)?$/.test(price)) line.unitPrice = price;
      const currency = `${values.currency || ''} ${values.unitPrice || ''}`.match(/\b(AED|USD|CNY)\b/i);
      if (currency) line.currency = currency[1].toUpperCase();
      if (values.eta) line.eta = parsePdfDate(values.eta);
      lines.push(line);
    }
  }
  if (!lines.length) warnings.push('No recognizable line-item table found. Add line items manually.');
  warnings.push('Review extracted values and complete missing fields before creating the PO.');
  return { fields, lines, warnings, text };
}

export function matchSalesPerson(name, options) {
  const normalize = value => value.trim().replace(/\s+/g, ' ').toLowerCase();
  const matches = options.filter(option => normalize(option) === normalize(name));
  return matches.length === 1 ? matches[0] : '';
}

// Explicit Remarks line references identify PO lines; table rows use descriptions.
export function parseDeliveryRemarks(text) {
  const remarks = text.match(/\bRemarks\s*:\s*([\s\S]*)/i);
  if (!remarks) return null;
  const match = remarks[1].match(/(?:^|\n)\s*Lines?\s*(?:Nos?\.?|Numbers?)?\s*:\s*([^\n]*(?:\n[ \t]*\d[^\n]*)*)/i);
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
  const documentDate = dateMatch ? parsePdfDate(dateMatch[1].split(/ {2,}(?=[A-Za-z])/)[0].trim()) : '';
  const updates = [], warnings = [];
  const referencedLines = parseDeliveryRemarks(result.text);
  if (referencedLines) {
    if (!documentDate) return { updates, warnings: ['A clear delivery date was not found. No lines were changed.'] };
    for (const number of referencedLines) {
      const matches = existingLines.map((item,index)=>({item,index})).filter(({item})=>String(item.lineNumber).trim() !== '' && Number(item.lineNumber) === number);
      if (matches.length !== 1) {
        warnings.push(`Line ${number}: ${matches.length ? 'duplicate PO line number' : 'not found in this PO'}.`);
        continue;
      }
      updates.push({index: matches[0].index, eta: documentDate, status:'Delivered'});
    }
    return { updates, warnings };
  }
  const counts = new Map();
  for (const line of result.lines) counts.set(normalize(line.description), (counts.get(normalize(line.description)) || 0)+1);
  for (const line of result.lines) {
    const label = line.description || `Line ${line.lineNumber}`;
    const status = normalize(line.deliveryStatus);
    if (status ? status !== 'delivered' : !isDeliveryNote) {
      warnings.push(`${label}: delivery is not confirmed by this document.`); continue;
    }
    const matches = existingLines.map((item,index)=>({item,index})).filter(({item})=>normalize(item.description) === normalize(line.description));
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
  return {updates, warnings};
}
