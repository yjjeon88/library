// Minimal CSV parser — handles quoted fields, escaped quotes, newlines inside quotes.
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = false; }
      } else {
        current += c;
      }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(current); current = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(current); current = '';
        if (row.some(v => v !== '')) rows.push(row);
        row = [];
      } else {
        current += c;
      }
    }
  }
  if (current !== '' || row.length) { row.push(current); if (row.some(v => v !== '')) rows.push(row); }

  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim().replace(/^﻿/, ''));
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
}

export function extractYes24ProductId(url) {
  if (!url) return null;
  const m = url.match(/Goods\/(\d+)/i);
  return m ? m[1] : null;
}
