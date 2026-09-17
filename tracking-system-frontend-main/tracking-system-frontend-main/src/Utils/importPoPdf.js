import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parsePoPdfRows } from './poPdfParser';

GlobalWorkerOptions.workerSrc = workerUrl;

export async function importPoPdf(file, documentType = 'po') {
  if (!/\.pdf$/i.test(file.name)) throw new Error('Please select a PDF file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose a PDF smaller than 10 MB.');
  const data = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(data.slice(0,1024)).includes('%PDF-')) throw new Error('This file is not a valid PDF.');
  const task = getDocument({ data, isEvalSupported: false });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 50) throw new Error('Choose a PDF with 50 pages or fewer.');
    const pages = [];
    for (let n=1; n<=pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const rows = [];
      for (const item of content.items) {
        if (!item.str?.trim()) continue;
        const y = item.transform[5], x = item.transform[4];
        let row = rows.find(r => Math.abs(r.y-y)<3);
        if (!row) { row = { y, cells: [] }; rows.push(row); }
        row.cells.push({ x, text: item.str.trim() });
      }
      pages.push(rows.sort((a,b)=>b.y-a.y).map(r=>r.cells.sort((a,b)=>a.x-b.x)));
      page.cleanup();
    }
    const result = parsePoPdfRows(pages, documentType);
    if (!result.text.trim()) throw new Error('This PDF has no selectable text. Scanned PDFs need OCR; upload a text PDF or enter the details manually.');
    if (!Object.keys(result.fields).length && !result.lines.length) result.warnings.unshift('No PO fields recognized in this layout. Use the extracted text below to fill the form.');
    return result;
  } catch (error) {
    if (error.name === 'PasswordException') throw new Error('This PDF is password protected. Upload an unlocked copy.', { cause: error });
    if (error.name === 'InvalidPDFException') throw new Error('The PDF is damaged or invalid. Please choose another file.', { cause: error });
    throw error;
  } finally { await task.destroy(); }
}
