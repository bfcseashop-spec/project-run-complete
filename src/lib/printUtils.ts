import { barcodeSVG } from "@/lib/barcode";
import { getSettings } from "@/data/settingsStore";

/** Open a generic record detail view in a new print window */
export function printRecordReport(opts: {
  id: string;
  title?: string;
  fields: { label: string; value: string }[];
  sectionTitle?: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const rows = opts.fields
    .map(
      (f) =>
        `<div class="info-cell"><div class="lbl">${f.label}</div><div class="val">${f.value || "—"}</div></div>`
    )
    .join("");

  win.document.write(`<!DOCTYPE html><html><head><title>${opts.sectionTitle || "Report"} - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff}
.page{max-width:760px;margin:0 auto;padding:32px 40px}
.header{text-align:center;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:20px}
.header h1{font-size:22px;font-weight:700;color:#0f766e}
.header .tagline{font-size:12px;color:#666;margin-top:2px}
.header .contact{font-size:11px;color:#888;margin-top:6px}
.report-title{text-align:center;background:#f0fdfa;border:1px solid #ccfbf1;border-radius:6px;padding:10px;margin-bottom:20px}
.report-title h2{font-size:16px;font-weight:600;color:#0f766e;text-transform:uppercase;letter-spacing:1px}
.report-title .id{font-size:11px;color:#888;margin-top:2px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px}
.info-cell{padding:10px 14px;border-bottom:1px solid #e5e7eb}
.info-cell:nth-child(odd){border-right:1px solid #e5e7eb}
.info-cell .lbl{font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600}
.info-cell .val{font-size:13px;color:#1a1a1a;font-weight:500;margin-top:2px}
.stamp{font-size:10px;color:#888;text-align:center;margin-top:30px;border-top:1px solid #e5e7eb;padding-top:10px}
@media print{body{padding:0}.page{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="page">
  <div class="header">
    <h1>${s.clinicName}</h1>
    <div class="tagline">${s.clinicTagline}</div>
    <div class="contact">${s.clinicAddress} &bull; ${s.clinicPhone} &bull; ${s.clinicEmail}</div>
    ${s.clinicRegNumber ? `<div class="contact">Reg: ${s.clinicRegNumber}</div>` : ""}
  </div>
  <div class="report-title">
    <h2>${opts.sectionTitle || "Report"}</h2>
    <div class="id">ID: ${opts.id}</div>
  </div>
  <div class="info-grid">${rows}</div>
  <div class="stamp">Printed on ${new Date().toLocaleDateString()} from ${s.clinicName}</div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/** Open a barcode label print window */
export function printBarcode(id: string, label?: string) {
  const s = getSettings();
  const svg = barcodeSVG(id, 300, 80);
  const win = window.open("", "_blank", "width=450,height=350");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head><title>Barcode - ${id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}
.label{text-align:center;padding:24px}
.clinic{font-size:11px;color:#888;margin-bottom:8px}
.barcode-svg{margin:8px 0}
.id-text{font-size:14px;font-weight:700;letter-spacing:2px;margin-top:4px}
.sub-text{font-size:11px;color:#666;margin-top:2px}
@media print{@page{size:80mm 40mm;margin:2mm}body{min-height:auto}}
</style></head><body>
<div class="label">
  <div class="clinic">${s.clinicName}</div>
  <div class="barcode-svg">${svg}</div>
  <div class="id-text">${id}</div>
  ${label ? `<div class="sub-text">${label}</div>` : ""}
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}
