import * as XLSX from "xlsx";

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  filename: string
) {
  const rows = data.map((item) => {
    const row: Record<string, unknown> = {};
    columns.forEach((col) => {
      row[col.header] = item[col.key] ?? "";
    });
    return row;
  });
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: string; header: string }[],
  title: string
) {
  const printWin = window.open("", "_blank", "width=900,height=700");
  if (!printWin) return;

  const headerRow = columns.map((c) => `<th style="padding:8px 12px;border-bottom:2px solid #333;text-align:left;font-size:11px;text-transform:uppercase;color:#555;background:#f5f5f5">${c.header}</th>`).join("");
  const bodyRows = data.map((item) =>
    `<tr>${columns.map((c) => `<td style="padding:6px 12px;border-bottom:1px solid #eee;font-size:12px">${item[c.key] ?? ""}</td>`).join("")}</tr>`
  ).join("");

  printWin.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body{font-family:'Segoe UI',system-ui,sans-serif;margin:20px;color:#333}
    h2{margin-bottom:4px} .meta{color:#888;font-size:12px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    @media print{body{margin:10mm}}
  </style></head><body>
    <h2>${title}</h2>
    <p class="meta">Exported on ${new Date().toLocaleDateString()} • ${data.length} records</p>
    <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
  </body></html>`);
  printWin.document.close();
  setTimeout(() => printWin.print(), 300);
}

export function generateSampleExcel(columns: { key: string; header: string }[], filename: string) {
  const sampleRow: Record<string, string> = {};
  columns.forEach((col) => {
    sampleRow[col.header] = `Sample ${col.header}`;
  });
  const ws = XLSX.utils.json_to_sheet([sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `${filename}_template.xlsx`);
}

export function importFromExcel(
  file: File,
  columns: { key: string; header: string }[]
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        // Map headers back to keys
        const headerToKey: Record<string, string> = {};
        columns.forEach((c) => {
          headerToKey[c.header] = c.key;
          headerToKey[c.key] = c.key; // also accept key directly
        });

        const mapped = jsonRows.map((row) => {
          const obj: Record<string, unknown> = {};
          Object.entries(row).forEach(([h, v]) => {
            const key = headerToKey[h] || h;
            obj[key] = v;
          });
          return obj;
        });
        resolve(mapped);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
