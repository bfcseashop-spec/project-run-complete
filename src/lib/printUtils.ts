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
export function printBarcode(id: string, label?: string, testName?: string) {
  const s = getSettings();
  const svg = barcodeSVG(id, 200, 50);
  const win = window.open("", "_blank", "width=350,height=300");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head><title>Barcode - ${id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff}
.label{text-align:center;width:1.5in;height:1.25in;display:flex;flex-direction:column;justify-content:center;align-items:center;border:1px solid #e5e7eb;border-radius:4px;padding:4px 6px;overflow:hidden}
.patient-name{font-size:9px;font-weight:700;color:#1e293b;margin-bottom:1px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.test-name{font-size:8px;color:#475569;margin-bottom:3px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.barcode-svg{margin:2px 0;width:100%}
.barcode-svg svg{width:100%;height:auto;max-height:40px}
.id-text{font-size:8px;font-weight:700;letter-spacing:1.5px;margin-top:1px;color:#1e293b}
@media print{@page{size:1.5in 1.25in;margin:0}body{min-height:auto}.label{border:none;border-radius:0}}
</style></head><body>
<div class="label">
  ${label ? `<div class="patient-name">${label}</div>` : ""}
  ${testName ? `<div class="test-name">${testName}</div>` : ""}
  <div class="barcode-svg">${svg}</div>
  <div class="id-text">${id}</div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/** Print a professional Health Package report */
export function printHealthPackageReport(opts: {
  id: string;
  name: string;
  status: string;
  price: number;
  discountPercent: number;
  validity: string;
  services: string[];
  tests: { name: string; category: string; price: number }[];
  description: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const discountedPrice = opts.price * (1 - opts.discountPercent / 100);
  const barcodeHtml = barcodeSVG(opts.id, 220, 55);

  const statusColor = opts.status === "active" ? "#059669" : opts.status === "inactive" ? "#dc2626" : "#d97706";
  const statusBg = opts.status === "active" ? "#ecfdf5" : opts.status === "inactive" ? "#fef2f2" : "#fffbeb";

  const servicesList = opts.services.length > 0
    ? opts.services.map((s, i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;${i < opts.services.length - 1 ? "border-bottom:1px solid #f3f4f6;" : ""}">
        <div style="width:22px;height:22px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <span style="font-size:13px;color:#1a1a1a;font-weight:500">${s}</span>
      </div>`).join("")
    : '<div style="font-size:12px;color:#999;padding:6px 0">No services included</div>';

  const testRows = opts.tests.length > 0
    ? opts.tests.map((t, i) => `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#888">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">
          <span style="font-size:13px;font-weight:500;color:#1a1a1a">${t.name}</span>
          <span style="display:block;font-size:10px;color:#888;margin-top:1px">${t.category}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;color:#1a1a1a">$${t.price.toFixed(2)}</td>
      </tr>`).join("")
    : "";

  const testsSection = opts.tests.length > 0 ? `
    <div style="margin-bottom:20px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#0f766e;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
        Included Tests
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#888;font-weight:700;border-bottom:2px solid #e5e7eb;width:30px">#</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;text-transform:uppercase;color:#888;font-weight:700;border-bottom:2px solid #e5e7eb">Test Name</th>
            <th style="padding:8px 12px;text-align:right;font-size:10px;text-transform:uppercase;color:#888;font-weight:700;border-bottom:2px solid #e5e7eb;width:90px">Price</th>
          </tr>
        </thead>
        <tbody>${testRows}</tbody>
        <tfoot>
          <tr style="background:#f0fdfa">
            <td colspan="2" style="padding:10px 12px;font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:0.5px">Test Total</td>
            <td style="padding:10px 12px;text-align:right;font-size:14px;font-weight:800;color:#0f766e;font-variant-numeric:tabular-nums">$${opts.tests.reduce((s, t) => s + t.price, 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>` : "";

  win.document.write(`<!DOCTYPE html><html><head><title>Health Package - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff}
.page{max-width:760px;margin:0 auto;padding:32px 40px}
@media print{body{padding:0}.page{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="page">
  <!-- Clinic Header -->
  <div style="text-align:center;padding-bottom:18px;margin-bottom:24px;position:relative">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#0f766e,#14b8a6,#0f766e);border-radius:2px"></div>
    <h1 style="font-size:26px;font-weight:800;color:#0f766e;letter-spacing:-0.5px">${s.clinicName}</h1>
    <div style="font-size:12px;color:#666;margin-top:3px;font-weight:500">${s.clinicTagline}</div>
    <div style="font-size:11px;color:#999;margin-top:6px">${s.clinicAddress} &bull; ${s.clinicPhone} &bull; ${s.clinicEmail}</div>
    ${s.clinicRegNumber ? `<div style="font-size:11px;color:#999;margin-top:2px">Reg: ${s.clinicRegNumber}</div>` : ""}
  </div>

  <!-- Report Title -->
  <div style="text-align:center;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:1.5px solid #99f6e4;border-radius:10px;padding:14px 20px;margin-bottom:24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:2px">Health Package Report</h2>
    <div style="font-size:11px;color:#888;margin-top:4px;font-weight:500">ID: ${opts.id}</div>
  </div>

  <!-- Package Details Grid -->
  <div style="border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
    <div style="display:grid;grid-template-columns:1fr 1fr">
      <div style="padding:14px 18px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Package Name</div>
        <div style="font-size:15px;font-weight:700;margin-top:4px;color:#1a1a1a">${opts.name}</div>
      </div>
      <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Status</div>
        <div style="margin-top:4px"><span style="display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;background:${statusBg};color:${statusColor};text-transform:capitalize">${opts.status}</span></div>
      </div>
      <div style="padding:14px 18px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Original Price</div>
        <div style="font-size:18px;font-weight:800;margin-top:4px;color:#1a1a1a;font-variant-numeric:tabular-nums">$${opts.price.toFixed(2)}</div>
      </div>
      <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Discount</div>
        <div style="font-size:18px;font-weight:800;margin-top:4px;color:#d97706;font-variant-numeric:tabular-nums">${opts.discountPercent}%</div>
      </div>
      <div style="padding:14px 18px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Discounted Price</div>
        <div style="font-size:18px;font-weight:800;margin-top:4px;color:#059669;font-variant-numeric:tabular-nums">$${discountedPrice.toFixed(2)}</div>
      </div>
      <div style="padding:14px 18px;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Validity</div>
        <div style="font-size:15px;font-weight:700;margin-top:4px;color:#1a1a1a">${opts.validity}</div>
      </div>
    </div>
  </div>

  <!-- Services -->
  <div style="margin-bottom:20px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#0f766e;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
      Included Services
    </div>
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:8px 14px">
      ${servicesList}
    </div>
  </div>

  <!-- Tests -->
  ${testsSection}

  <!-- Description -->
  ${opts.description ? `
  <div style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;margin-bottom:24px">
    <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700;margin-bottom:6px">Description</div>
    <div style="font-size:13px;color:#333;line-height:1.6">${opts.description}</div>
  </div>` : ""}

  <!-- Savings Highlight -->
  ${opts.discountPercent > 0 ? `
  <div style="background:linear-gradient(135deg,#ecfdf5,#d1fae5);border:1.5px solid #6ee7b7;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:center">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#065f46;font-weight:700;margin-bottom:4px">You Save</div>
    <div style="font-size:24px;font-weight:900;color:#059669;font-variant-numeric:tabular-nums">$${(opts.price - discountedPrice).toFixed(2)}</div>
    <div style="font-size:11px;color:#065f46;margin-top:2px">${opts.discountPercent}% off the original price</div>
  </div>` : ""}

  <!-- Barcode & Footer -->
  <div style="text-align:center;margin-top:28px;padding-top:18px;border-top:2px dashed #d1d5db">
    <div style="margin-bottom:10px">${barcodeHtml}</div>
    <div style="font-size:10px;color:#888;margin-top:14px">Printed on ${new Date().toLocaleDateString()} from ${s.clinicName}</div>
    <div style="font-size:9px;color:#aaa;margin-top:4px">This is a computer-generated report. No signature required.</div>
  </div>
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

/** Print a professional Health Service report */
export function printHealthServiceReport(opts: {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  description: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) return;

  const barcodeHtml = barcodeSVG(opts.id, 220, 55);
  const statusColor = opts.status === "active" ? "#059669" : opts.status === "pending" ? "#d97706" : "#6366f1";
  const statusBg = opts.status === "active" ? "#ecfdf5" : opts.status === "pending" ? "#fffbeb" : "#eef2ff";
  const statusLabel = opts.status.charAt(0).toUpperCase() + opts.status.slice(1);

  win.document.write(`<!DOCTYPE html><html><head><title>Health Service - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff}
.page{max-width:760px;margin:0 auto;padding:32px 40px}
@media print{body{padding:0}.page{padding:20px 30px}@page{margin:15mm}}
</style></head><body>
<div class="page">
  <!-- Clinic Header -->
  <div style="text-align:center;padding-bottom:18px;margin-bottom:24px;position:relative">
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#0f766e,#14b8a6,#0f766e);border-radius:2px"></div>
    <h1 style="font-size:26px;font-weight:800;color:#0f766e;letter-spacing:-0.5px">${s.clinicName}</h1>
    <div style="font-size:12px;color:#666;margin-top:3px;font-weight:500">${s.clinicTagline}</div>
    <div style="font-size:11px;color:#999;margin-top:6px">${s.clinicAddress} &bull; ${s.clinicPhone} &bull; ${s.clinicEmail}</div>
    ${s.clinicRegNumber ? `<div style="font-size:11px;color:#999;margin-top:2px">Reg: ${s.clinicRegNumber}</div>` : ""}
  </div>

  <!-- Report Title -->
  <div style="text-align:center;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:1.5px solid #99f6e4;border-radius:10px;padding:14px 20px;margin-bottom:24px">
    <h2 style="font-size:17px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:2px">Health Service Report</h2>
    <div style="font-size:11px;color:#888;margin-top:4px;font-weight:500">ID: ${opts.id}</div>
  </div>

  <!-- Service Details -->
  <div style="border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
    <div style="display:grid;grid-template-columns:1fr 1fr">
      <div style="padding:16px 20px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Service Name</div>
        <div style="font-size:16px;font-weight:700;margin-top:6px;color:#1a1a1a">${opts.name}</div>
      </div>
      <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Status</div>
        <div style="margin-top:6px"><span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;background:${statusBg};color:${statusColor};text-transform:capitalize">${statusLabel}</span></div>
      </div>
      <div style="padding:16px 20px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Category</div>
        <div style="margin-top:6px"><span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4">${opts.category}</span></div>
      </div>
      <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb">
        <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Service Fee</div>
        <div style="font-size:22px;font-weight:900;margin-top:6px;color:#0f766e;font-variant-numeric:tabular-nums">$${opts.price.toFixed(2)}</div>
      </div>
    </div>
  </div>

  <!-- Description -->
  ${opts.description ? `
  <div style="margin-bottom:24px">
    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#0f766e;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
      Description
    </div>
    <div style="background:#f8fafc;border:1.5px solid #e5e7eb;border-radius:10px;padding:16px 20px">
      <p style="font-size:14px;color:#333;line-height:1.7">${opts.description}</p>
    </div>
  </div>` : ""}

  <!-- Service Info Box -->
  <div style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:1.5px solid #6ee7b7;border-radius:10px;padding:18px 24px;margin-bottom:24px;display:flex;align-items:center;gap:16px">
    <div style="width:48px;height:48px;border-radius:14px;background:#d1fae5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
    </div>
    <div>
      <div style="font-size:13px;font-weight:700;color:#065f46">Service Information</div>
      <div style="font-size:12px;color:#047857;margin-top:2px">This service is currently <strong>${statusLabel.toLowerCase()}</strong> and available under the <strong>${opts.category}</strong> department at <strong>${s.clinicName}</strong>.</div>
    </div>
  </div>

  <!-- Barcode & Footer -->
  <div style="text-align:center;margin-top:28px;padding-top:18px;border-top:2px dashed #d1d5db">
    <div style="margin-bottom:10px">${barcodeHtml}</div>
    <div style="font-size:10px;color:#888;margin-top:14px">Printed on ${new Date().toLocaleDateString()} from ${s.clinicName}</div>
    <div style="font-size:9px;color:#aaa;margin-top:4px">This is a computer-generated report. No signature required.</div>
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/** Print a professional X-Ray report */
export function printXRayReport(opts: {
  id: string;
  patient: string;
  examination: string;
  bodyPart: string;
  doctor: string;
  date: string;
  reportDate: string;
  status: string;
  findings: string;
  impression: string;
  remarks: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;

  const barcodeHtml = barcodeSVG(opts.id, 220, 55);
  const statusColor = opts.status === "completed" ? "#059669" : opts.status === "in-progress" ? "#2563eb" : "#d97706";
  const statusBg = opts.status === "completed" ? "#ecfdf5" : opts.status === "in-progress" ? "#eff6ff" : "#fffbeb";
  const statusLabel = opts.status === "in-progress" ? "In Progress" : opts.status.charAt(0).toUpperCase() + opts.status.slice(1);

  win.document.write(`<!DOCTYPE html><html><head><title>X-Ray Report - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:800px;margin:0 auto;padding:0}
.report-header{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:20px 30px;display:flex;align-items:center;justify-content:space-between}
.lab-brand{display:flex;align-items:center;gap:14px}
.lab-logo{width:52px;height:52px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#0f766e;font-weight:700;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-name{font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.3px}
.lab-tagline{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;font-weight:500}
.header-badge{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;color:#fff;backdrop-filter:blur(4px)}
.header-badge .badge-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;font-weight:600}
.header-badge .badge-value{font-size:16px;font-weight:800;margin-top:2px}
.patient-bar{display:grid;grid-template-columns:1fr 1fr auto;gap:16px;padding:14px 30px;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-bottom:3px solid #14b8a6}
.patient-col{display:flex;flex-direction:column;gap:5px}
.patient-row{display:flex;gap:6px;font-size:12px}
.patient-row .plabel{font-weight:700;color:#0f766e;min-width:95px;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.patient-row .pvalue{color:#1a1a1a;font-weight:500}
.barcode-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.report-body{padding:24px 30px}
.report-title{font-size:18px;font-weight:800;text-transform:uppercase;color:#0f766e;letter-spacing:1px;border-bottom:3px solid #0f766e;padding-bottom:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
.status-pill{display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px}
.section{margin-bottom:18px}
.section-title{font-size:12px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding:6px 12px;background:linear-gradient(90deg,#f0fdfa,transparent);border-left:3px solid #14b8a6}
.section-body{font-size:13px;line-height:1.8;color:#333;padding:12px 16px;background:#fafffe;border:1px solid #e5e7eb;border-radius:6px;min-height:50px;white-space:pre-wrap}
.section-body.empty{color:#aaa;font-style:italic;min-height:40px}
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #0f766e;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.end-text{font-size:10px;color:#9ca3af;margin-top:52px}
.report-footer{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:14px 30px;display:flex;align-items:center;justify-content:space-between;margin-top:28px}
.footer-item{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px}
.footer-icon{width:26px;height:26px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center}
.footer-icon svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2}
@media print{@page{size:A4;margin:10mm}body{background:#fff}.page{max-width:100%}}
</style></head><body>
<div class="page">
  <div class="report-header">
    <div class="lab-brand">
      <div class="lab-logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '🏥'}</div>
      <div>
        <div class="lab-name">${s.clinicName}</div>
        <div class="lab-tagline">${s.clinicTagline}</div>
      </div>
    </div>
    <div class="header-badge">
      <div class="badge-label">X-Ray ID</div>
      <div class="badge-value">${opts.id.replace("XR-", "")}</div>
    </div>
  </div>

  <div class="patient-bar">
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Patient:</span><span class="pvalue">${opts.patient}</span></div>
      <div class="patient-row"><span class="plabel">Examination:</span><span class="pvalue">${opts.examination}</span></div>
      <div class="patient-row"><span class="plabel">Body Part:</span><span class="pvalue" style="text-transform:capitalize">${opts.bodyPart}</span></div>
    </div>
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Scan Date:</span><span class="pvalue">${opts.date}</span></div>
      <div class="patient-row"><span class="plabel">Report Date:</span><span class="pvalue">${opts.reportDate || "Pending"}</span></div>
      <div class="patient-row"><span class="plabel">Radiologist:</span><span class="pvalue">${opts.doctor}</span></div>
    </div>
    <div class="barcode-col">
      <div style="font-size:11px;font-weight:700;color:#0f766e">${opts.id}</div>
      <div>${barcodeHtml}</div>
    </div>
  </div>

  <div class="report-body">
    <div class="report-title">
      <span>X-Ray Report</span>
      <span class="status-pill" style="background:${statusBg};color:${statusColor}">${statusLabel}</span>
    </div>

    <div class="section">
      <div class="section-title">Findings</div>
      <div class="section-body ${opts.findings ? "" : "empty"}">${opts.findings || "No findings recorded yet."}</div>
    </div>

    <div class="section">
      <div class="section-title">Impression</div>
      <div class="section-body ${opts.impression ? "" : "empty"}">${opts.impression || "Pending radiologist review."}</div>
    </div>

    ${opts.remarks ? `<div class="section">
      <div class="section-title">Remarks</div>
      <div class="section-body">${opts.remarks}</div>
    </div>` : ""}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Radiographer</div>
        <div class="sig-role">(Medical Radiographer)</div>
      </div>
      <div class="sig-block">
        <div class="end-text">****End of Report****</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${opts.doctor}</div>
        <div class="sig-role">(Radiologist)</div>
      </div>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
      <div><strong>Phone</strong><br/>${s.clinicPhone}</div>
    </div>
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
      <div><strong>Email</strong><br/>${s.clinicEmail}</div>
    </div>
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
      <div><strong>Address</strong><br/>${s.clinicAddress}</div>
    </div>
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/** Print a professional Ultrasound/Sonography report */
export function printUltrasoundReport(opts: {
  id: string;
  patient: string;
  examination: string;
  region: string;
  doctor: string;
  date: string;
  reportDate: string;
  status: string;
  findings: string;
  impression: string;
  remarks: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;

  const barcodeHtml = barcodeSVG(opts.id, 220, 55);
  const statusColor = opts.status === "completed" ? "#059669" : opts.status === "in-progress" ? "#2563eb" : "#d97706";
  const statusBg = opts.status === "completed" ? "#ecfdf5" : opts.status === "in-progress" ? "#eff6ff" : "#fffbeb";
  const statusLabel = opts.status === "in-progress" ? "In Progress" : opts.status.charAt(0).toUpperCase() + opts.status.slice(1);

  win.document.write(`<!DOCTYPE html><html><head><title>Ultrasound Report - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:800px;margin:0 auto;padding:0}
.report-header{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:20px 30px;display:flex;align-items:center;justify-content:space-between}
.lab-brand{display:flex;align-items:center;gap:14px}
.lab-logo{width:52px;height:52px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#0f766e;font-weight:700;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-name{font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.3px}
.lab-tagline{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;font-weight:500}
.header-badge{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;color:#fff;backdrop-filter:blur(4px)}
.header-badge .badge-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;font-weight:600}
.header-badge .badge-value{font-size:16px;font-weight:800;margin-top:2px}
.patient-bar{display:grid;grid-template-columns:1fr 1fr auto;gap:16px;padding:14px 30px;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-bottom:3px solid #14b8a6}
.patient-col{display:flex;flex-direction:column;gap:5px}
.patient-row{display:flex;gap:6px;font-size:12px}
.patient-row .plabel{font-weight:700;color:#0f766e;min-width:95px;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.patient-row .pvalue{color:#1a1a1a;font-weight:500}
.barcode-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.report-body{padding:24px 30px}
.report-title{font-size:18px;font-weight:800;text-transform:uppercase;color:#0f766e;letter-spacing:1px;border-bottom:3px solid #0f766e;padding-bottom:8px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center}
.status-pill{display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:0.5px}
.section{margin-bottom:18px}
.section-title{font-size:12px;font-weight:800;color:#0f766e;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px;padding:6px 12px;background:linear-gradient(90deg,#f0fdfa,transparent);border-left:3px solid #14b8a6}
.section-body{font-size:13px;line-height:1.8;color:#333;padding:12px 16px;background:#fafffe;border:1px solid #e5e7eb;border-radius:6px;min-height:50px;white-space:pre-wrap}
.section-body.empty{color:#aaa;font-style:italic;min-height:40px}
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:40px}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #0f766e;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.end-text{font-size:10px;color:#9ca3af;margin-top:52px}
.report-footer{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:14px 30px;display:flex;align-items:center;justify-content:space-between;margin-top:28px}
.footer-item{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px}
.footer-icon{width:26px;height:26px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center}
.footer-icon svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2}
@media print{@page{size:A4;margin:10mm}body{background:#fff}.page{max-width:100%}}
</style></head><body>
<div class="page">
  <div class="report-header">
    <div class="lab-brand">
      <div class="lab-logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '🏥'}</div>
      <div>
        <div class="lab-name">${s.clinicName}</div>
        <div class="lab-tagline">${s.clinicTagline}</div>
      </div>
    </div>
    <div class="header-badge">
      <div class="badge-label">USG ID</div>
      <div class="badge-value">${opts.id.replace("US-", "")}</div>
    </div>
  </div>

  <div class="patient-bar">
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Patient:</span><span class="pvalue">${opts.patient}</span></div>
      <div class="patient-row"><span class="plabel">Examination:</span><span class="pvalue">${opts.examination}</span></div>
      <div class="patient-row"><span class="plabel">Region:</span><span class="pvalue" style="text-transform:capitalize">${opts.region}</span></div>
    </div>
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Scan Date:</span><span class="pvalue">${opts.date}</span></div>
      <div class="patient-row"><span class="plabel">Report Date:</span><span class="pvalue">${opts.reportDate || "Pending"}</span></div>
      <div class="patient-row"><span class="plabel">Sonologist:</span><span class="pvalue">${opts.doctor}</span></div>
    </div>
    <div class="barcode-col">
      <div style="font-size:11px;font-weight:700;color:#0f766e">${opts.id}</div>
      <div>${barcodeHtml}</div>
    </div>
  </div>

  <div class="report-body">
    <div class="report-title">
      <span>Ultrasonography Report</span>
      <span class="status-pill" style="background:${statusBg};color:${statusColor}">${statusLabel}</span>
    </div>

    <div class="section">
      <div class="section-title">Findings</div>
      <div class="section-body ${opts.findings ? "" : "empty"}">${opts.findings || "No findings recorded yet."}</div>
    </div>

    <div class="section">
      <div class="section-title">Impression</div>
      <div class="section-body ${opts.impression ? "" : "empty"}">${opts.impression || "Pending sonologist review."}</div>
    </div>

    ${opts.remarks ? `<div class="section">
      <div class="section-title">Remarks</div>
      <div class="section-body">${opts.remarks}</div>
    </div>` : ""}

    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">Sonographer</div>
        <div class="sig-role">(Medical Sonographer)</div>
      </div>
      <div class="sig-block">
        <div class="end-text">****End of Report****</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${opts.doctor}</div>
        <div class="sig-role">(Sonologist / Radiologist)</div>
      </div>
    </div>
  </div>

  <div class="report-footer">
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
      <div><strong>Phone</strong><br/>${s.clinicPhone}</div>
    </div>
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div>
      <div><strong>Email</strong><br/>${s.clinicEmail}</div>
    </div>
    <div class="footer-item">
      <div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
      <div><strong>Address</strong><br/>${s.clinicAddress}</div>
    </div>
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/** Print a professional Injection report */
export function printInjectionReport(opts: {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: string;
  status: string;
}) {
  const s = getSettings();
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;

  const barcodeHtml = barcodeSVG(opts.id, 220, 55);
  const statusColor = opts.status === "in-stock" ? "#059669" : opts.status === "low-stock" ? "#d97706" : "#dc2626";
  const statusBg = opts.status === "in-stock" ? "#ecfdf5" : opts.status === "low-stock" ? "#fffbeb" : "#fef2f2";
  const statusLabel = opts.status === "in-stock" ? "In Stock" : opts.status === "low-stock" ? "Low Stock" : "Out of Stock";

  win.document.write(`<!DOCTYPE html><html><head><title>Injection Report - ${opts.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:800px;margin:0 auto;padding:0}
.report-header{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:20px 30px;display:flex;align-items:center;justify-content:space-between}
.lab-brand{display:flex;align-items:center;gap:14px}
.lab-logo{width:52px;height:52px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#0f766e;font-weight:700;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-name{font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.3px}
.lab-tagline{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;font-weight:500}
.header-badge{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;color:#fff;backdrop-filter:blur(4px)}
.header-badge .badge-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;font-weight:600}
.header-badge .badge-value{font-size:16px;font-weight:800;margin-top:2px}
@media print{@page{size:A4;margin:10mm}body{background:#fff}.page{max-width:100%}}
</style></head><body>
<div class="page">
  <div class="report-header">
    <div class="lab-brand">
      <div class="lab-logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '🏥'}</div>
      <div>
        <div class="lab-name">${s.clinicName}</div>
        <div class="lab-tagline">${s.clinicTagline}</div>
      </div>
    </div>
    <div class="header-badge">
      <div class="badge-label">Item ID</div>
      <div class="badge-value">${opts.id.replace("INJ-", "")}</div>
    </div>
  </div>

  <!-- Patient Bar styled info -->
  <div style="padding:14px 30px;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-bottom:3px solid #14b8a6">
    <div style="display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:10px;text-transform:uppercase;color:#0f766e;font-weight:700;letter-spacing:1px">Injection Item Report</div>
        <div style="font-size:11px;color:#888;margin-top:2px">ID: ${opts.id}</div>
      </div>
      <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;background:${statusBg};color:${statusColor}">${statusLabel}</span>
    </div>
  </div>

  <!-- Details -->
  <div style="padding:24px 30px">
    <div style="border:1.5px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:24px">
      <div style="display:grid;grid-template-columns:1fr 1fr">
        <div style="padding:16px 20px;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
          <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Injection Name</div>
          <div style="font-size:16px;font-weight:700;margin-top:6px;color:#1a1a1a">${opts.name}</div>
        </div>
        <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb">
          <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Category</div>
          <div style="margin-top:6px"><span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:600;background:#f0fdfa;color:#0f766e;border:1px solid #99f6e4">${opts.category}</span></div>
        </div>
        <div style="padding:16px 20px;border-right:1px solid #e5e7eb">
          <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Unit</div>
          <div style="font-size:15px;font-weight:700;margin-top:6px;color:#1a1a1a">${opts.unit}</div>
        </div>
        <div style="padding:16px 20px">
          <div style="font-size:10px;text-transform:uppercase;color:#888;letter-spacing:0.8px;font-weight:700">Price</div>
          <div style="font-size:22px;font-weight:900;margin-top:6px;color:#0f766e;font-variant-numeric:tabular-nums">${opts.price}</div>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div style="background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border:1.5px solid #6ee7b7;border-radius:10px;padding:18px 24px;margin-bottom:24px;display:flex;align-items:center;gap:16px">
      <div style="width:48px;height:48px;border-radius:14px;background:#d1fae5;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 6.5 1 1"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z"/><path d="m14.5 6.5-9.06 9.06a2 2 0 0 0-.58 1.13L4 21l4.31-.86a2 2 0 0 0 1.13-.58Z"/></svg>
      </div>
      <div>
        <div style="font-size:13px;font-weight:700;color:#065f46">Inventory Information</div>
        <div style="font-size:12px;color:#047857;margin-top:2px">This injection is currently <strong>${statusLabel.toLowerCase()}</strong> in the <strong>${opts.category}</strong> category at <strong>${s.clinicName}</strong>.</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:14px 30px;display:flex;align-items:center;justify-content:space-between;margin-top:28px">
    <div style="display:flex;align-items:center;gap:20px">
      <div style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px">
        <span>📞</span><div><strong>Phone</strong><br/>${s.clinicPhone}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px">
        <span>✉️</span><div><strong>Email</strong><br/>${s.clinicEmail}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px">
        <span>📍</span><div><strong>Address</strong><br/>${s.clinicAddress}</div>
      </div>
    </div>
    <div style="background:#fff;border-radius:6px;padding:6px;box-shadow:0 2px 6px rgba(0,0,0,0.1)">${barcodeHtml}</div>
  </div>

  <div style="text-align:center;padding:12px;font-size:10px;color:#888">
    Printed on ${new Date().toLocaleDateString()} from ${s.clinicName} &bull; Computer-generated report
  </div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

/** Print a compact lab report — single page summary without full sections */
export function printCompactLabReport(report: {
  id: string; patient: string; patientId: string; age: number; gender: string;
  testName: string; doctor: string; date: string; resultDate: string;
  status: string; category: string; result: string; normalRange: string;
  remarks: string; sampleType: string; collectedAt: string; reportedAt: string;
  technician: string; pathologist: string; instrument: string;
  sections?: { title: string; investigations: { name: string; result: string; referenceValue: string; unit: string; flag?: string }[] }[];
}) {
  const s = getSettings();
  const barcodeHtml = barcodeSVG(report.id, 180, 45);
  const win = window.open("", "_blank", "width=600,height=700");
  if (!win) return;

  // Build compact results table from sections
  let resultsHTML = "";
  if (report.sections && report.sections.length > 0) {
    const rows = report.sections.flatMap(sec =>
      sec.investigations.filter(inv => inv.name).map(inv => {
        const flagColor = inv.flag === "High" ? "color:#dc2626;font-weight:700" : inv.flag === "Low" ? "color:#2563eb;font-weight:700" : "";
        return `<tr>
          <td style="padding:3px 8px;border-bottom:1px solid #eee;font-size:11px">${inv.name}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #eee;font-size:11px;font-weight:600;${flagColor}">${inv.result}${inv.flag ? ` <span style="font-size:9px">${inv.flag === "High" ? "▲" : "▼"}</span>` : ""}</td>
          <td style="padding:3px 8px;border-bottom:1px solid #eee;font-size:10px;color:#888">${inv.referenceValue} ${inv.unit}</td>
        </tr>`;
      })
    );
    if (rows.length > 0) {
      resultsHTML = `<table style="width:100%;border-collapse:collapse;border:1px solid #ddd;margin-bottom:12px">
        <thead><tr style="background:#f0fdfa"><th style="padding:4px 8px;text-align:left;font-size:10px;color:#0f766e;text-transform:uppercase">Test</th><th style="padding:4px 8px;text-align:left;font-size:10px;color:#0f766e;text-transform:uppercase">Result</th><th style="padding:4px 8px;text-align:left;font-size:10px;color:#0f766e;text-transform:uppercase">Reference</th></tr></thead>
        <tbody>${rows.join("")}</tbody>
      </table>`;
    }
  }

  win.document.write(`<!DOCTYPE html><html><head><title>Lab Report (Compact) - ${report.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff;font-size:11px}
.page{max-width:500px;margin:0 auto;padding:16px 20px}
@media print{body{padding:0}.page{padding:10px 15px}@page{margin:8mm;size:A5}}
</style></head><body>
<div class="page">
  <div style="text-align:center;border-bottom:2px solid #0f766e;padding-bottom:8px;margin-bottom:10px">
    <div style="font-size:16px;font-weight:700;color:#0f766e">${s.clinicName}</div>
    <div style="font-size:9px;color:#888">${s.clinicAddress} · ${s.clinicPhone}</div>
  </div>
  <div style="text-align:center;background:#f0fdfa;padding:5px;border-radius:4px;margin-bottom:10px">
    <span style="font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:1px">Lab Report</span>
    <span style="font-size:10px;color:#888;margin-left:8px">${report.id}</span>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #ddd;border-radius:4px;margin-bottom:10px;font-size:10px">
    <div style="padding:5px 8px;border-right:1px solid #ddd;border-bottom:1px solid #ddd"><span style="color:#888">Patient:</span> <strong>${report.patient}</strong></div>
    <div style="padding:5px 8px;border-bottom:1px solid #ddd"><span style="color:#888">ID:</span> ${report.patientId}</div>
    <div style="padding:5px 8px;border-right:1px solid #ddd;border-bottom:1px solid #ddd"><span style="color:#888">Age/Gender:</span> ${report.age}y / ${report.gender}</div>
    <div style="padding:5px 8px;border-bottom:1px solid #ddd"><span style="color:#888">Doctor:</span> ${report.doctor}</div>
    <div style="padding:5px 8px;border-right:1px solid #ddd"><span style="color:#888">Test:</span> <strong>${report.testName}</strong></div>
    <div style="padding:5px 8px"><span style="color:#888">Date:</span> ${report.date}${report.resultDate ? ` → ${report.resultDate}` : ""}</div>
  </div>
  ${resultsHTML}
  ${report.remarks ? `<div style="font-size:10px;color:#666;margin-bottom:10px"><strong>Remarks:</strong> ${report.remarks}</div>` : ""}
  <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px dashed #ccc;padding-top:8px;margin-top:8px">
    <div style="font-size:9px;color:#888">
      ${report.technician ? `Tech: ${report.technician}` : ""}${report.pathologist ? ` · Path: ${report.pathologist}` : ""}
    </div>
    <div>${barcodeHtml}</div>
  </div>
  <div style="text-align:center;font-size:8px;color:#aaa;margin-top:6px">Printed ${new Date().toLocaleDateString()} · ${s.clinicName}</div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/** Print sample barcodes for a lab report */
export function printSampleBarcodes(report: { id: string; patient: string; patientId: string; testName: string; sampleType: string; date: string }) {
  const s = getSettings();
  const idBarcode = barcodeSVG(report.id, 200, 55);
  const patientBarcode = barcodeSVG(report.patientId, 200, 55);
  const win = window.open("", "_blank", "width=500,height=500");
  if (!win) return;

  win.document.write(`<!DOCTYPE html><html><head><title>Sample Barcodes - ${report.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#fff}
.label{text-align:center;padding:16px 20px;border:1px dashed #ccc;margin:12px;border-radius:6px;page-break-inside:avoid}
.clinic{font-size:10px;color:#888;margin-bottom:6px}
.info{font-size:10px;color:#444;margin-top:4px}
.id-text{font-size:12px;font-weight:700;letter-spacing:1.5px;margin-top:3px}
@media print{@page{size:80mm auto;margin:2mm}.label{margin:4px;border:none;padding:8px}}
</style></head><body>
<div class="label">
  <div class="clinic">${s.clinicName}</div>
  <div class="info"><strong>Report:</strong> ${report.testName}</div>
  <div style="margin:6px 0">${idBarcode}</div>
  <div class="id-text">${report.id}</div>
  <div class="info">${report.patient} · ${report.sampleType} · ${report.date}</div>
</div>
<div class="label">
  <div class="clinic">${s.clinicName}</div>
  <div class="info"><strong>Patient Sample:</strong> ${report.patient}</div>
  <div style="margin:6px 0">${patientBarcode}</div>
  <div class="id-text">${report.patientId}</div>
  <div class="info">${report.testName} · ${report.sampleType} · ${report.date}</div>
</div>
</body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}
