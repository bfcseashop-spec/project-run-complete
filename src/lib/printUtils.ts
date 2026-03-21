import { barcodeSVG } from "@/lib/barcode";
import { getSettings } from "@/data/settingsStore";

/** Open a generic record detail view in a new print window */
export function printRecordReport(opts: {
  id: string;
  title?: string;
  fields: { label: string; value: string }[];
  sectionTitle?: string;
  photo?: string;
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

  const photoHtml = opts.photo
    ? `<div class="photo-section"><img src="${opts.photo}" class="patient-photo" alt="Patient Photo" /></div>`
    : "";

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
.photo-section{text-align:center;margin-bottom:16px}
.patient-photo{width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #0f766e}
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
  ${photoHtml}
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

/** Print a professional refund receipt with original/refund/balance breakdown */
export function printRefundReceipt(opts: {
  refundId: string;
  invoiceId: string;
  patient: string;
  date: string;
  items: { name: string; type: string; qty: number; unitPrice: number; total: number }[];
  originalTotal: number;
  refundAmount: number;
  newBalance: number;
  method: string;
  reason: string;
  processedBy: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const itemRows = opts.items.map((item, i) =>
    `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#666">${i + 1}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">
        <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:10px;font-weight:600;background:${
          item.type === "MED" ? "#d1fae5;color:#065f46" : item.type === "INJ" ? "#fef3c7;color:#92400e" : item.type === "SVC" ? "#dbeafe;color:#1e40af" : "#f3e8ff;color:#6b21a8"
        }">${item.type}</span>
        <span style="margin-left:6px;font-size:13px;font-weight:500">${item.name}</span>
      </td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px">${item.qty}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;font-variant-numeric:tabular-nums">$${item.unitPrice.toFixed(2)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">$${item.total.toFixed(2)}</td>
    </tr>`
  ).join("");

  const barcodeHtml = barcodeSVG(opts.refundId, 200, 50);

  win.document.write(`<!DOCTYPE html><html><head><title>Refund Receipt - ${opts.refundId}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff}
.page{max-width:760px;margin:0 auto;padding:32px 40px}
@media print{body{padding:0}.page{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="page">
  <!-- Header -->
  <div style="text-align:center;border-bottom:3px solid #dc2626;padding-bottom:16px;margin-bottom:20px">
    <h1 style="font-size:22px;font-weight:700;color:#0f766e">${s.clinicName}</h1>
    <div style="font-size:12px;color:#666;margin-top:2px">${s.clinicTagline}</div>
    <div style="font-size:11px;color:#888;margin-top:6px">${s.clinicAddress} &bull; ${s.clinicPhone} &bull; ${s.clinicEmail}</div>
    ${s.clinicRegNumber ? `<div style="font-size:11px;color:#888;margin-top:2px">Reg: ${s.clinicRegNumber}</div>` : ""}
  </div>

  <!-- Title -->
  <div style="text-align:center;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:1.5px">Refund Receipt</h2>
    <div style="font-size:12px;color:#888;margin-top:4px">${opts.refundId} &bull; Original Invoice: ${opts.invoiceId}</div>
  </div>

  <!-- Patient & Date -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:20px">
    <div style="padding:10px 14px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
      <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600">Patient</div>
      <div style="font-size:14px;font-weight:600;margin-top:2px">${opts.patient}</div>
    </div>
    <div style="padding:10px 14px;border-bottom:1px solid #e5e7eb">
      <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600">Date</div>
      <div style="font-size:14px;font-weight:600;margin-top:2px">${opts.date}</div>
    </div>
    <div style="padding:10px 14px;border-right:1px solid #e5e7eb">
      <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600">Refund Method</div>
      <div style="font-size:14px;font-weight:600;margin-top:2px">${opts.method}</div>
    </div>
    <div style="padding:10px 14px">
      <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600">Processed By</div>
      <div style="font-size:14px;font-weight:600;margin-top:2px">${opts.processedBy}</div>
    </div>
  </div>

  <!-- Returned Items Table -->
  <div style="margin-bottom:20px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:600;margin-bottom:8px">Returned Items</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
      <thead>
        <tr style="background:#f9fafb">
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;width:30px">#</th>
          <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb">Item</th>
          <th style="padding:8px 10px;text-align:center;font-size:10px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;width:50px">Qty</th>
          <th style="padding:8px 10px;text-align:right;font-size:10px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;width:80px">Price</th>
          <th style="padding:8px 10px;text-align:right;font-size:10px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #e5e7eb;width:80px">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
  </div>

  <!-- Financial Summary -->
  <div style="border:2px solid #dc2626;border-radius:8px;overflow:hidden;margin-bottom:20px">
    <div style="background:#dc2626;color:white;padding:10px 16px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Financial Summary</div>
    <div style="padding:4px 0">
      <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #fee2e2">
        <span style="font-size:13px;color:#666">Original Invoice Total</span>
        <span style="font-size:14px;font-weight:600;font-variant-numeric:tabular-nums">$${opts.originalTotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #fee2e2;background:#fef2f2">
        <span style="font-size:13px;color:#dc2626;font-weight:600">Refund Amount</span>
        <span style="font-size:16px;font-weight:700;color:#dc2626;font-variant-numeric:tabular-nums">- $${opts.refundAmount.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:12px 16px;background:#f0fdf4">
        <span style="font-size:14px;font-weight:700;color:#065f46">New Balance</span>
        <span style="font-size:18px;font-weight:800;color:#065f46;font-variant-numeric:tabular-nums">$${opts.newBalance.toFixed(2)}</span>
      </div>
    </div>
  </div>

  <!-- Reason -->
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:12px 16px;margin-bottom:20px">
    <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.5px;font-weight:600;margin-bottom:4px">Reason for Return</div>
    <div style="font-size:13px;color:#333">${opts.reason}</div>
  </div>

  <!-- Barcode & Footer -->
  <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px dashed #d1d5db">
    <div style="margin-bottom:8px">${barcodeHtml}</div>
    <div style="font-size:10px;color:#888;margin-top:12px">Printed on ${new Date().toLocaleString()} from ${s.clinicName}</div>
    <div style="font-size:9px;color:#aaa;margin-top:4px">This is a computer-generated receipt. No signature required.</div>
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}
