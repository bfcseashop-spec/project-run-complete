import { getInvoiceTheme, type InvoiceTheme } from "./invoiceThemes";

export interface InvoiceData {
  clinicName: string;
  clinicTagline: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicWebsite: string;
  clinicEmail: string;
  clinicLogo: string;
  invoiceId: string;
  invoiceLabel: string; // "Invoice" or "Draft Invoice"
  dateTimeStr: string;
  patient: string;
  patientAge?: string | number;
  patientGender?: string;
  patientPhone?: string;
  doctor?: string;
  doctorDegree?: string;
  paymentMethod: string;
  barcodeStr: string;
  rows: InvoiceRow[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: string; // Already formatted with dual currency
  paidFormatted?: string;
  dueFormatted?: string;
  dueAmount?: number;
  formatPrice: (n: number) => string;
}

export interface InvoiceRow {
  name: string;
  description: string;
  qty: number;
  price: number;
  total: number;
  subItems: { name: string; price: number; qty: number; total: number }[];
}

export function generateInvoiceHtml(themeId: string, data: InvoiceData): string {
  const theme = getInvoiceTheme(themeId || "modern-teal");

  switch (theme.id) {
    case "classic":
      return classicLayout(theme, data);
    case "modern-teal":
      return modernTealLayout(theme, data);
    case "royal-blue":
      return royalBlueLayout(theme, data);
    case "minimal-gray":
      return minimalGrayLayout(theme, data);
    case "warm-coral":
      return warmCoralLayout(theme, data);
    default:
      return modernTealLayout(theme, data);
  }
}

// ─── helpers ──────────────────────────────────────────
function patientInfo(d: InvoiceData) {
  let s = `<strong>${d.patient}</strong>`;
  if (d.patientAge || d.patientGender) {
    const parts: string[] = [];
    if (d.patientAge) parts.push(`Age: ${d.patientAge}`);
    if (d.patientGender) parts.push(`Gender: ${d.patientGender}`);
    s += `<br/><span style="color:#64748b">${parts.join(" · ")}</span>`;
  }
  if (d.patientPhone) s += `<br/><span style="color:#64748b">📞 ${d.patientPhone}</span>`;
  return s;
}

function doctorInfo(d: InvoiceData) {
  let s = "";
  if (d.doctor) s += `<strong>${d.doctor}</strong>`;
  if (d.doctorDegree) s += `<br/><span style="color:#64748b;font-size:12px">${d.doctorDegree}</span>`;
  return s;
}

function totalsBlock(d: InvoiceData, accentColor: string, borderColor: string) {
  let h = `<div style="margin-left:auto;width:320px;font-size:13px;margin-top:16px">
    <div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Subtotal</span><span style="font-weight:500">${d.formatPrice(d.subtotal)}</span></div>`;
  if (d.discountAmount > 0) h += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Discount</span><span style="color:#ef4444;font-weight:500">-${d.formatPrice(d.discountAmount)}</span></div>`;
  if (d.taxRate > 0) h += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Tax (${d.taxRate}%)</span><span style="font-weight:500">${d.formatPrice(d.taxAmount)}</span></div>`;
  h += `<div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid ${borderColor};margin-top:8px;font-weight:800;font-size:18px"><span>Grand Total</span><span style="color:${accentColor}">${d.grandTotal}</span></div>`;
  if (d.paidFormatted) h += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Paid</span><span style="color:#16a34a;font-weight:600">${d.paidFormatted}</span></div>`;
  if (d.dueFormatted) h += `<div style="display:flex;justify-content:space-between;padding:5px 0"><span style="color:#64748b">Due</span><span style="font-weight:600;color:${(d.dueAmount || 0) > 0 ? '#ef4444' : '#16a34a'}">${d.dueFormatted}</span></div>`;
  h += `</div>`;
  return h;
}

function barcodeFooter(d: InvoiceData) {
  return `<div style="text-align:center;margin-top:28px;padding-top:16px;border-top:1px dashed #cbd5e1">
    <div style="display:inline-block">${d.barcodeStr}</div>
    <p style="font-family:monospace;font-size:12px;letter-spacing:3px;font-weight:600;margin-top:4px;color:#475569">${d.invoiceId}</p>
  </div>`;
}

function wrap(title: string, body: string) {
  return `<!DOCTYPE html><html><head><title>${title}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#1e293b;background:#fff}
.page{padding:32px 40px;position:relative;overflow:hidden}
.watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);opacity:0.04;width:320px;height:320px;pointer-events:none;z-index:0}
.content{position:relative;z-index:1}
@media print{@page{margin:15mm}body{padding:0}.page{padding:20px 30px}}</style></head><body>${body}</body></html>`;
}

// ═══════════════════════════════════════════════════════════
// THEME 1: CLASSIC — Traditional bordered, formal lines
// ═══════════════════════════════════════════════════════════
function classicLayout(t: InvoiceTheme, d: InvoiceData): string {
  const rows = d.rows.map((item, i) => {
    let r = `<tr>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};text-align:center;color:#64748b">${i + 1}</td>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};font-weight:600">${item.name}</td>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};font-size:12px;color:#64748b">${item.description}</td>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};text-align:center;font-weight:600">${item.qty}</td>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};text-align:right;font-variant-numeric:tabular-nums">${d.formatPrice(item.price)}</td>
      <td style="padding:8px 12px;border:1px solid ${t.tableBorder};text-align:right;font-weight:700;font-variant-numeric:tabular-nums">${d.formatPrice(item.total)}</td>
    </tr>`;
    item.subItems.forEach(sub => {
      r += `<tr><td style="border:1px solid ${t.tableBorder}"></td>
        <td colspan="3" style="padding:3px 12px 3px 28px;border:1px solid ${t.tableBorder};font-size:11px;color:#94a3b8">↳ ${sub.name}</td>
        <td style="padding:3px 12px;border:1px solid ${t.tableBorder};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.price)}</td>
        <td style="padding:3px 12px;border:1px solid ${t.tableBorder};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.total)}</td></tr>`;
    });
    return r;
  }).join("");

  const body = `<div class="page">
  <img src="${d.clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <!-- Header: Top line + centered clinic name -->
    <div style="border-top:4px double ${t.accent};border-bottom:2px solid ${t.accent};padding:16px 0;margin-bottom:20px;text-align:center">
      <h1 style="font-size:24px;font-weight:800;color:${t.accent};text-transform:uppercase;letter-spacing:3px">${d.clinicName}</h1>
      <p style="font-size:11px;color:${t.accentLight};margin-top:2px;letter-spacing:1px">${d.clinicTagline}</p>
      <p style="font-size:10px;color:#64748b;margin-top:4px">${d.clinicAddress} · ${d.clinicPhone}</p>
    </div>

    <!-- Invoice ID Row -->
    <div style="display:flex;justify-content:space-between;margin-bottom:16px;padding-bottom:8px;border-bottom:1px solid ${t.tableBorder}">
      <div><span style="font-size:10px;text-transform:uppercase;color:#94a3b8;letter-spacing:1px">${d.invoiceLabel}</span><br/><span style="font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px">${d.invoiceId}</span></div>
      <div style="text-align:right"><span style="font-size:10px;text-transform:uppercase;color:#94a3b8;letter-spacing:1px">Date</span><br/><span style="font-weight:600">${d.dateTimeStr}</span></div>
    </div>

    <!-- Patient / Doctor side by side with simple borders -->
    <div style="display:flex;gap:20px;margin-bottom:20px;font-size:13px">
      <div style="flex:1;border-left:3px solid ${t.accent};padding-left:12px">
        <p style="font-size:10px;text-transform:uppercase;color:${t.patientLabel};font-weight:700;margin-bottom:4px;letter-spacing:1px">Patient</p>
        ${patientInfo(d)}
      </div>
      <div style="flex:1;border-left:3px solid ${t.accentLight};padding-left:12px">
        <p style="font-size:10px;text-transform:uppercase;color:${t.doctorLabel};font-weight:700;margin-bottom:4px;letter-spacing:1px">Doctor & Payment</p>
        ${doctorInfo(d)}
        <p style="margin-top:4px;color:#64748b">Payment: <strong>${d.paymentMethod}</strong></p>
      </div>
    </div>

    <!-- Table with full borders -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
      <thead><tr style="background:${t.accent};color:${t.headerText}">
        <th style="padding:10px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">#</th>
        <th style="padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">Item</th>
        <th style="padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">Description</th>
        <th style="padding:10px 12px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;border:1px solid ${t.accent}">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${totalsBlock(d, t.accent, t.totalBorderColor)}
    ${barcodeFooter(d)}

    <div style="text-align:center;margin-top:20px;padding:10px 0;border-top:2px solid ${t.accent};border-bottom:1px solid ${t.tableBorder}">
      <p style="font-size:11px;color:${t.footerText};font-weight:500">Thank you for choosing ${d.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${d.clinicWebsite} · ${d.clinicEmail}</p>
    </div>
  </div>
</div>`;
  return wrap(`Invoice - ${d.patient}`, body);
}

// ═══════════════════════════════════════════════════════════
// THEME 2: MODERN TEAL — Card-based, rounded corners, gradient header
// ═══════════════════════════════════════════════════════════
function modernTealLayout(t: InvoiceTheme, d: InvoiceData): string {
  const rows = d.rows.map((item, i) => {
    let r = `<tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'}">
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};color:#64748b;font-size:13px">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-weight:700;font-size:13px">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-size:12px;color:#64748b">${item.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:center;font-size:13px;font-weight:600">${item.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-variant-numeric:tabular-nums;font-size:13px;font-weight:600">${d.formatPrice(item.price)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.total)}</td>
    </tr>`;
    item.subItems.forEach(sub => {
      r += `<tr><td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader}"></td>
        <td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader};font-size:11px;color:#94a3b8;padding-left:28px">↳ ${sub.name}</td>
        <td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader}"></td>
        <td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader}"></td>
        <td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.price)}</td>
        <td style="padding:4px 14px;border-bottom:1px solid ${t.tableHeader};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.total)}</td></tr>`;
    });
    return r;
  }).join("");

  const body = `<div class="page">
  <img src="${d.clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <div style="background:${t.headerGradient};border-radius:12px;padding:20px 28px;color:${t.headerText};margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
      <div>
        <h1 style="font-size:22px;font-weight:800;margin:0">${d.clinicName}</h1>
        <p style="font-size:12px;opacity:0.8;margin-top:2px">${d.clinicTagline}</p>
        <p style="font-size:10px;opacity:0.6;margin-top:4px">${d.clinicAddress} · ${d.clinicPhone}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:10px;opacity:0.6;text-transform:uppercase;letter-spacing:1px">${d.invoiceLabel}</p>
        <p style="font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px">${d.invoiceId}</p>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;font-size:13px">
      <div style="background:${t.patientBg};border:1px solid ${t.patientBorder};border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${t.patientLabel};font-weight:600;margin-bottom:6px">Patient Info</p>
        ${patientInfo(d)}
      </div>
      <div style="background:${t.doctorBg};border:1px solid ${t.doctorBorder};border-radius:8px;padding:12px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${t.doctorLabel};font-weight:600;margin-bottom:6px">Doctor & Invoice</p>
        ${doctorInfo(d)}
        <p style="margin-top:4px">Date: <strong>${d.dateTimeStr}</strong></p>
        <p style="margin-top:2px">Payment: <strong>${d.paymentMethod}</strong></p>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid ${t.tableBorder};border-radius:8px;overflow:hidden;margin-bottom:4px">
      <thead><tr style="background:${t.tableHeaderGradient}">
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">#</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Item</th>
        <th style="padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Description</th>
        <th style="padding:10px 14px;text-align:center;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Qty</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Price</th>
        <th style="padding:10px 14px;text-align:right;font-size:10px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;font-weight:600">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    ${totalsBlock(d, t.accent, t.totalBorderColor)}
    ${barcodeFooter(d)}
    <div style="text-align:center;margin-top:20px;padding:12px 0;background:${t.footerBg};border-radius:8px">
      <p style="font-size:11px;color:${t.footerText};font-weight:500">Thank you for choosing ${d.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${d.clinicWebsite} · ${d.clinicEmail}</p>
    </div>
  </div>
</div>`;
  return wrap(`Invoice - ${d.patient}`, body);
}

// ═══════════════════════════════════════════════════════════
// THEME 3: ROYAL BLUE — Elegant, serif accents, decorative dividers
// ═══════════════════════════════════════════════════════════
function royalBlueLayout(t: InvoiceTheme, d: InvoiceData): string {
  const rows = d.rows.map((item, i) => {
    let r = `<tr style="background:${i % 2 === 0 ? t.tableHeader : '#fff'}">
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};color:${t.accent};font-weight:600;font-size:13px">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-weight:700;font-size:13px;font-family:Georgia,serif">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-size:12px;color:#64748b;font-style:italic">${item.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:center;font-size:13px;font-weight:600">${item.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.price)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px;color:${t.accent}">${d.formatPrice(item.total)}</td>
    </tr>`;
    item.subItems.forEach(sub => {
      r += `<tr><td style="border-bottom:1px solid ${t.tableBorder}"></td>
        <td colspan="3" style="padding:3px 14px 3px 28px;border-bottom:1px solid ${t.tableBorder};font-size:11px;color:#94a3b8;font-style:italic">↳ ${sub.name}</td>
        <td style="padding:3px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.price)}</td>
        <td style="padding:3px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-size:11px;color:#94a3b8">${d.formatPrice(sub.total)}</td></tr>`;
    });
    return r;
  }).join("");

  const body = `<div class="page">
  <img src="${d.clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <!-- Elegant header with centered crest-style -->
    <div style="text-align:center;padding:24px 0 18px;border-bottom:3px double ${t.accent};margin-bottom:20px">
      <div style="display:inline-block;background:${t.headerGradient};color:${t.headerText};padding:10px 40px;border-radius:4px;margin-bottom:10px">
        <h1 style="font-size:22px;font-weight:800;font-family:Georgia,serif;letter-spacing:2px;margin:0">${d.clinicName}</h1>
      </div>
      <p style="font-size:12px;color:${t.accent};font-style:italic;margin-top:6px">${d.clinicTagline}</p>
      <p style="font-size:10px;color:#64748b;margin-top:4px">${d.clinicAddress} · ${d.clinicPhone}</p>
    </div>

    <!-- Invoice ID centered with decorative element -->
    <div style="text-align:center;margin-bottom:18px">
      <span style="font-size:10px;text-transform:uppercase;color:${t.accentLight};letter-spacing:2px">${d.invoiceLabel}</span>
      <p style="font-size:20px;font-weight:800;font-family:Georgia,serif;color:${t.accent};letter-spacing:2px;margin-top:2px">${d.invoiceId}</p>
      <p style="font-size:12px;color:#64748b;margin-top:4px">${d.dateTimeStr}</p>
      <div style="width:60px;height:2px;background:${t.accent};margin:10px auto 0;border-radius:2px"></div>
    </div>

    <!-- Two-column info with elegant styling -->
    <div style="display:flex;gap:24px;margin-bottom:22px;font-size:13px">
      <div style="flex:1;background:${t.patientBg};border:1px solid ${t.patientBorder};border-top:3px solid ${t.accent};padding:14px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${t.patientLabel};font-weight:700;margin-bottom:6px;font-family:Georgia,serif">Patient Details</p>
        ${patientInfo(d)}
      </div>
      <div style="flex:1;background:${t.doctorBg};border:1px solid ${t.doctorBorder};border-top:3px solid ${t.accentLight};padding:14px 16px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:${t.doctorLabel};font-weight:700;margin-bottom:6px;font-family:Georgia,serif">Attending Physician</p>
        ${doctorInfo(d)}
        <p style="margin-top:6px;color:#64748b">Payment: <strong>${d.paymentMethod}</strong></p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:4px;border:2px solid ${t.accent}">
      <thead><tr style="background:${t.headerGradient};color:${t.headerText}">
        <th style="padding:12px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">#</th>
        <th style="padding:12px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">Item</th>
        <th style="padding:12px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">Description</th>
        <th style="padding:12px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">Qty</th>
        <th style="padding:12px 14px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">Price</th>
        <th style="padding:12px 14px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;font-family:Georgia,serif">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${totalsBlock(d, t.accent, t.totalBorderColor)}
    ${barcodeFooter(d)}

    <div style="text-align:center;margin-top:22px;padding:14px 20px;background:${t.footerBg};border:1px solid ${t.doctorBorder}">
      <p style="font-size:12px;color:${t.footerText};font-weight:500;font-family:Georgia,serif;font-style:italic">Thank you for choosing ${d.clinicName}. Get well soon! 🙏</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:4px">${d.clinicWebsite} · ${d.clinicEmail}</p>
    </div>
  </div>
</div>`;
  return wrap(`Invoice - ${d.patient}`, body);
}

// ═══════════════════════════════════════════════════════════
// THEME 4: MINIMAL GRAY — Ultra-clean, borderless, whitespace
// ═══════════════════════════════════════════════════════════
function minimalGrayLayout(t: InvoiceTheme, d: InvoiceData): string {
  const rows = d.rows.map((item, i) => {
    let r = `<tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;color:#94a3b8;font-size:12px">${i + 1}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-weight:600;font-size:13px">${item.name}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8">${item.description}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:center;font-size:13px">${item.qty}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.price)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.total)}</td>
    </tr>`;
    item.subItems.forEach(sub => {
      r += `<tr><td></td>
        <td colspan="3" style="padding:2px 8px 2px 24px;font-size:11px;color:#cbd5e1">↳ ${sub.name}</td>
        <td style="padding:2px 8px;text-align:right;font-size:11px;color:#cbd5e1">${d.formatPrice(sub.price)}</td>
        <td style="padding:2px 8px;text-align:right;font-size:11px;color:#cbd5e1">${d.formatPrice(sub.total)}</td></tr>`;
    });
    return r;
  }).join("");

  const body = `<div class="page" style="padding:48px 56px">
  <img src="${d.clinicLogo}" class="watermark" alt="" />
  <div class="content">
    <!-- Minimal header — just text, no background -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
      <div>
        <h1 style="font-size:28px;font-weight:300;color:${t.accent};margin:0;letter-spacing:-0.5px">${d.clinicName}</h1>
        <p style="font-size:11px;color:#94a3b8;margin-top:4px">${d.clinicAddress}</p>
        <p style="font-size:11px;color:#94a3b8">${d.clinicPhone} · ${d.clinicEmail}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:32px;font-weight:200;color:#e2e8f0;margin:0;line-height:1">${d.invoiceLabel.toUpperCase()}</p>
        <p style="font-size:14px;font-weight:600;font-family:monospace;color:${t.accent};margin-top:4px">${d.invoiceId}</p>
        <p style="font-size:11px;color:#94a3b8;margin-top:2px">${d.dateTimeStr}</p>
      </div>
    </div>

    <!-- Simple two-column patient/doctor with thin separator -->
    <div style="display:flex;gap:40px;margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid #f1f5f9;font-size:13px">
      <div style="flex:1">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#cbd5e1;margin-bottom:6px;font-weight:600">Bill To</p>
        ${patientInfo(d)}
      </div>
      <div style="flex:1">
        <p style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#cbd5e1;margin-bottom:6px;font-weight:600">Doctor</p>
        ${doctorInfo(d)}
        <p style="margin-top:6px;color:#94a3b8;font-size:12px">${d.paymentMethod}</p>
      </div>
    </div>

    <!-- Borderless table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:4px">
      <thead><tr>
        <th style="padding:8px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">#</th>
        <th style="padding:8px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">Item</th>
        <th style="padding:8px 8px;text-align:left;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">Description</th>
        <th style="padding:8px 8px;text-align:center;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">Qty</th>
        <th style="padding:8px 8px;text-align:right;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">Price</th>
        <th style="padding:8px 8px;text-align:right;font-size:9px;text-transform:uppercase;color:#cbd5e1;letter-spacing:1.5px;font-weight:600;border-bottom:2px solid #f1f5f9">Total</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    ${totalsBlock(d, t.accent, "#e2e8f0")}
    ${barcodeFooter(d)}

    <div style="text-align:center;margin-top:32px">
      <p style="font-size:11px;color:#cbd5e1;font-weight:400">Thank you · ${d.clinicWebsite}</p>
    </div>
  </div>
</div>`;
  return wrap(`Invoice - ${d.patient}`, body);
}

// ═══════════════════════════════════════════════════════════
// THEME 5: WARM CORAL — Bold, colored sidebar accent, vibrant
// ═══════════════════════════════════════════════════════════
function warmCoralLayout(t: InvoiceTheme, d: InvoiceData): string {
  const rows = d.rows.map((item, i) => {
    let r = `<tr style="background:${i % 2 === 0 ? t.patientBg : '#ffffff'}">
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-size:13px;font-weight:700;color:${t.accent}">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-weight:700;font-size:13px">${item.name}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};font-size:12px;color:#78716c">${item.description}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:center;font-size:13px;font-weight:600">${item.qty}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.price)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid ${t.tableBorder};text-align:right;font-weight:700;font-variant-numeric:tabular-nums;font-size:13px">${d.formatPrice(item.total)}</td>
    </tr>`;
    item.subItems.forEach(sub => {
      r += `<tr><td style="border-bottom:1px solid ${t.tableHeader}"></td>
        <td colspan="3" style="padding:3px 14px 3px 28px;border-bottom:1px solid ${t.tableHeader};font-size:11px;color:#a8a29e">↳ ${sub.name}</td>
        <td style="padding:3px 14px;border-bottom:1px solid ${t.tableHeader};text-align:right;font-size:11px;color:#a8a29e">${d.formatPrice(sub.price)}</td>
        <td style="padding:3px 14px;border-bottom:1px solid ${t.tableHeader};text-align:right;font-size:11px;color:#a8a29e">${d.formatPrice(sub.total)}</td></tr>`;
    });
    return r;
  }).join("");

  const body = `<div class="page" style="padding:0">
  <img src="${d.clinicLogo}" class="watermark" alt="" />
  <div style="display:flex;min-height:100vh">
    <!-- Left accent sidebar -->
    <div style="width:8px;background:${t.headerGradient};flex-shrink:0"></div>
    <div class="content" style="flex:1;padding:32px 36px">
      <!-- Header with bold colored banner -->
      <div style="background:${t.headerGradient};border-radius:10px;padding:22px 28px;color:${t.headerText};margin-bottom:22px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <h1 style="font-size:24px;font-weight:900;margin:0">${d.clinicName}</h1>
          <p style="font-size:12px;opacity:0.85;margin-top:3px">${d.clinicTagline}</p>
          <p style="font-size:10px;opacity:0.65;margin-top:4px">${d.clinicAddress} · ${d.clinicPhone}</p>
        </div>
        <div style="text-align:right;background:rgba(255,255,255,0.15);padding:10px 18px;border-radius:8px">
          <p style="font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:1.5px">${d.invoiceLabel}</p>
          <p style="font-size:18px;font-weight:800;font-family:monospace;letter-spacing:1px;margin-top:2px">${d.invoiceId}</p>
        </div>
      </div>

      <!-- Info cards with colored left border -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px;font-size:13px">
        <div style="background:${t.patientBg};border-left:4px solid ${t.accent};border-radius:0 8px 8px 0;padding:14px 16px">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${t.patientLabel};font-weight:700;margin-bottom:6px">🧑 Patient</p>
          ${patientInfo(d)}
        </div>
        <div style="background:${t.doctorBg};border-left:4px solid ${t.accentLight};border-radius:0 8px 8px 0;padding:14px 16px">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:${t.doctorLabel};font-weight:700;margin-bottom:6px">👨‍⚕️ Doctor</p>
          ${doctorInfo(d)}
          <p style="margin-top:6px">📅 ${d.dateTimeStr}</p>
          <p style="margin-top:2px">💳 ${d.paymentMethod}</p>
        </div>
      </div>

      <!-- Table with colored header -->
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;margin-bottom:4px;border:1px solid ${t.tableBorder}">
        <thead><tr style="background:${t.headerGradient};color:${t.headerText}">
          <th style="padding:11px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">#</th>
          <th style="padding:11px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Item</th>
          <th style="padding:11px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Description</th>
          <th style="padding:11px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Qty</th>
          <th style="padding:11px 14px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Price</th>
          <th style="padding:11px 14px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Total</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      ${totalsBlock(d, t.accent, t.totalBorderColor)}
      ${barcodeFooter(d)}

      <div style="text-align:center;margin-top:22px;padding:14px 0;background:${t.footerBg};border-radius:10px">
        <p style="font-size:12px;color:${t.footerText};font-weight:600">Thank you for choosing ${d.clinicName}! Get well soon! 🙏</p>
        <p style="font-size:9px;color:#a8a29e;margin-top:4px">${d.clinicWebsite} · ${d.clinicEmail}</p>
      </div>
    </div>
  </div>
</div>`;
  return wrap(`Invoice - ${d.patient}`, body);
}
