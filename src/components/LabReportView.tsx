import { type LabReport } from "@/data/labReports";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { getSettings } from "@/data/settingsStore";
import { barcodeSVG } from "@/lib/barcode";

interface LabReportViewProps {
  report: LabReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildReportHTML(report: LabReport): string {
  const s = getSettings();
  const barcodeImg = barcodeSVG(report.id, 200, 50);
  const qrPlaceholder = barcodeSVG(report.patientId, 100, 100);
  const reportingDate = report.resultDate || report.date;

  const sectionsHTML = report.sections.map((section) => {
    const rowsHTML = section.investigations.map((inv) => {
      const flagClass = inv.flag === "High" ? "result-high" : inv.flag === "Low" ? "result-low" : "";
      return `<tr>
        <td class="inv-name">${inv.name}</td>
        <td class="ref-val">${inv.referenceValue}</td>
        <td class="unit-val">${inv.unit}</td>
        <td class="result-val ${flagClass}">${inv.result}</td>
      </tr>`;
    }).join("");

    return `
      <div class="section-title">${section.title}</div>
      <table class="results-table">
        <thead>
          <tr>
            <th class="col-test">Test</th>
            <th class="col-ref">Ref. Value</th>
            <th class="col-unit">Unit</th>
            <th class="col-result">Result</th>
          </tr>
        </thead>
        <tbody>${rowsHTML}</tbody>
      </table>
    `;
  }).join("");

  return `<!DOCTYPE html><html><head><title>Lab Report - ${report.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:800px;margin:0 auto;padding:0}

/* ===== HEADER ===== */
.report-header{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:18px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.lab-brand{display:flex;align-items:center;gap:14px}
.lab-logo{width:52px;height:52px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#0f766e;font-weight:700;text-align:center;line-height:1.1;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-name{font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.3px}
.lab-tagline{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px;font-weight:500}
.header-right{display:flex;align-items:center;gap:12px}
.header-badge{background:rgba(255,255,255,0.15);border-radius:10px;padding:10px 16px;text-align:center;color:#fff;backdrop-filter:blur(4px)}
.header-badge .badge-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:0.8;font-weight:600}
.header-badge .badge-value{font-size:16px;font-weight:800;margin-top:2px}

/* ===== PATIENT INFO ===== */
.patient-bar{display:grid;grid-template-columns:1fr 1fr auto;gap:16px;padding:14px 28px;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-bottom:3px solid #14b8a6}
.patient-col{display:flex;flex-direction:column;gap:5px}
.patient-row{display:flex;gap:6px;font-size:12px}
.patient-row .plabel{font-weight:700;color:#0f766e;min-width:85px;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.patient-row .pvalue{color:#1a1a1a;font-weight:500}
.barcode-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.barcode-col .case-label{font-size:11px;font-weight:700;color:#0f766e}
.barcode-col .pat-no{font-size:10px;color:#666;margin-top:4px}

/* ===== REPORT BODY ===== */
.report-body{padding:20px 28px}
.report-category{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #0f766e;padding-bottom:8px;margin-bottom:16px}
.report-category h2{font-size:18px;font-weight:800;text-transform:uppercase;color:#0f766e;letter-spacing:1px}
.reporting-date{font-size:11px;color:#666;text-align:right;background:#f0fdfa;padding:4px 10px;border-radius:4px}

.section-title{font-size:13px;font-weight:800;color:#0f766e;margin:18px 0 8px 0;padding:6px 12px;background:linear-gradient(90deg,#f0fdfa,transparent);border-left:3px solid #14b8a6;text-transform:uppercase;letter-spacing:0.8px}

.results-table{width:100%;border-collapse:collapse;margin-bottom:10px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden}
.results-table thead th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;color:#fff;background:#0f766e;padding:8px 10px;letter-spacing:0.8px}
.results-table thead th.col-result{text-align:right}
.results-table tbody td{padding:7px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;vertical-align:middle}
.results-table tbody tr:nth-child(even){background:#fafffe}
.results-table tbody tr:hover{background:#f0fdfa}
.col-test{width:40%}
.col-ref{width:22%}
.col-unit{width:18%}
.col-result{width:20%;text-align:right}
.inv-name{color:#1a1a1a;font-weight:600}
.ref-val{color:#6b7280;font-size:11px}
.unit-val{color:#6b7280;font-size:11px}
.result-val{font-weight:700;text-align:right;color:#1a1a1a;font-size:13px}
.result-high{color:#dc2626;font-weight:800;background:#fef2f2;padding:2px 6px;border-radius:3px}
.result-low{color:#2563eb;font-weight:800;background:#eff6ff;padding:2px 6px;border-radius:3px}

/* ===== REMARKS ===== */
.remarks-box{margin:16px 0;padding:14px 18px;background:#f0fdfa;border:1.5px solid #99f6e4;border-radius:8px;font-size:12px;color:#374151;line-height:1.7}
.remarks-box::before{content:'📋 Remarks';display:block;font-size:10px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}

/* ===== INSTRUMENTS ===== */
.instrument-line{font-size:11px;color:#6b7280;margin-top:10px;font-style:italic;padding:6px 10px;background:#f9fafb;border-radius:4px;border-left:2px solid #d1d5db}

/* ===== SIGNATURES ===== */
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:36px;padding-top:0}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #0f766e;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.end-text{font-size:10px;color:#9ca3af;margin-top:52px}

/* ===== FOOTER ===== */
.report-footer{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:12px 28px;display:flex;align-items:center;justify-content:space-between;margin-top:28px}
.footer-item{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px}
.footer-icon{width:26px;height:26px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center}
.footer-icon svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2}
.footer-qr{width:60px;height:60px;background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1)}

@media print{
  @page{size:A4;margin:10mm}
  body{background:#fff}
  .page{max-width:100%;padding:0}
  .results-table tbody tr:hover{background:transparent}
  .results-table tbody tr:nth-child(even){background:#fafffe}
}
</style></head><body>
<div class="page">
  <!-- Header -->
  <div class="report-header">
    <div class="lab-brand">
      <div class="lab-logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '🏥'}</div>
      <div>
        <div class="lab-name">${s.clinicName}</div>
        <div class="lab-tagline">${s.clinicTagline}</div>
      </div>
    </div>
    <div class="header-right">
      <div class="header-badge">
        <div class="badge-label">Case</div>
        <div class="badge-value">${report.id.replace("LR-", "")}</div>
      </div>
    </div>
  </div>

  <!-- Patient Info -->
  <div class="patient-bar">
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Name:</span><span class="pvalue">${report.patient}</span></div>
      <div class="patient-row"><span class="plabel">Age / Sex:</span><span class="pvalue">${report.age} Years / ${report.gender}</span></div>
      <div class="patient-row"><span class="plabel">PID:</span><span class="pvalue">${report.patientId}</span></div>
    </div>
    <div class="patient-col">
      <div class="patient-row"><span class="plabel">Requested:</span><span class="pvalue">${report.date}</span></div>
      <div class="patient-row"><span class="plabel">Reported:</span><span class="pvalue">${report.resultDate || "Pending"}</span></div>
      <div class="patient-row"><span class="plabel">Consultant:</span><span class="pvalue">${report.doctor}</span></div>
    </div>
    <div class="barcode-col">
      <div class="case-label">Pat No: ${report.patientId}</div>
      <div>${barcodeImg}</div>
    </div>
  </div>

  <!-- Report Body -->
  <div class="report-body">
    <div class="report-category">
      <h2>${report.category.toUpperCase()}</h2>
      <div class="reporting-date">Reporting Date: ${reportingDate}</div>
    </div>

    ${sectionsHTML}

    ${report.remarks ? `<div class="remarks-box">${report.remarks}</div>` : ""}
    ${report.instrument ? `<div class="instrument-line">Instruments: ${report.instrument}</div>` : ""}

    <!-- Signatures -->
    <div class="signatures">
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${report.technician || "Lab Technician"}</div>
        <div class="sig-role">(Medical Lab Technician)</div>
      </div>
      <div class="sig-block">
        <div class="end-text">****End of Report****</div>
      </div>
      <div class="sig-block">
        <div class="sig-line"></div>
        <div class="sig-name">${report.pathologist || "Pathologist"}</div>
        <div class="sig-role">(MD, Pathologist)</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
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
    <div class="footer-qr">${qrPlaceholder}</div>
  </div>
</div>
</body></html>`;
}

/** Open lab report in a print-ready window */
export function printLabReport(report: LabReport) {
  const html = buildReportHTML(report);
  const win = window.open("", "_blank", "width=850,height=1000");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 500);
}

const LabReportView = ({ report, open, onOpenChange }: LabReportViewProps) => {
  if (!report) return null;

  const s = getSettings();
  const reportingDate = report.resultDate || report.date;

  const handlePrint = () => {
    printLabReport(report);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Detailed lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        <div id="lab-report-print">
          {/* Header - Teal Gradient */}
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-lg overflow-hidden shadow-md">
                  {s.clinicLogo ? <img src={s.clinicLogo} alt="Logo" className="w-full h-full object-contain" /> : '🏥'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {s.clinicName}
                  </h2>
                  <p className="text-xs text-white/80 font-medium">{s.clinicTagline}</p>
                </div>
              </div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-2.5 text-center">
                <div className="text-[9px] uppercase tracking-[0.15em] text-white/70 font-semibold">Case</div>
                <div className="text-lg font-extrabold text-white">{report.id.replace("LR-", "")}</div>
              </div>
            </div>
          </div>

          {/* Patient Info Bar */}
          <div className="px-6 py-3.5 bg-primary/5 border-b-[3px] border-primary/30">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-2">
                <PatientRow label="Name:" value={report.patient} bold />
                <PatientRow label="Age / Sex:" value={`${report.age} Years / ${report.gender}`} />
                <PatientRow label="PID:" value={report.patientId} />
              </div>
              <div className="space-y-2">
                <PatientRow label="Requested:" value={report.date} />
                <PatientRow label="Reported:" value={report.resultDate || "Pending"} />
                <PatientRow label="Consultant:" value={report.doctor} />
              </div>
              <div className="text-right space-y-1.5">
                <span className="text-xs font-bold text-primary">Pat No: {report.patientId}</span>
                <div className="font-mono text-xs bg-muted px-3 py-1.5 rounded-md inline-block font-semibold">{report.id}</div>
              </div>
            </div>
          </div>

          {/* Category + Reporting Date */}
          <div className="px-6 py-3 flex items-center justify-between border-b-[3px] border-primary/30">
            <h2 className="text-lg font-extrabold text-primary uppercase tracking-wider">
              {report.category}
            </h2>
            <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              Reporting Date: {reportingDate}
            </span>
          </div>

          {/* Sections */}
          <div className="px-6 py-2">
            {report.sections.map((section, sIdx) => (
              <div key={sIdx} className="mb-4">
              <div className="text-sm font-extrabold text-primary uppercase tracking-wider py-2 px-3 border-l-[3px] border-primary bg-primary/5 rounded-r-md">
                  {section.title}
                </div>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 py-2.5 border-b-2 border-primary/20 bg-primary/5 px-4 mt-2 rounded-md">
                  <div className="col-span-5 text-[11px] font-bold text-card-foreground uppercase tracking-wide">Test</div>
                  <div className="col-span-3 text-[11px] font-bold text-card-foreground uppercase tracking-wide">Ref. Value</div>
                  <div className="col-span-2 text-[11px] font-bold text-card-foreground uppercase tracking-wide">Unit</div>
                  <div className="col-span-2 text-[11px] font-bold text-card-foreground uppercase tracking-wide text-right">Result</div>
                </div>
                {section.investigations.map((inv, iIdx) => (
                  <div
                    key={iIdx}
                    className="grid grid-cols-12 gap-2 py-1.5 border-b border-border/40 last:border-0"
                  >
                    <div className="col-span-5 text-sm font-medium text-card-foreground">{inv.name}</div>
                    <div className="col-span-3 text-sm text-muted-foreground">{inv.referenceValue}</div>
                    <div className="col-span-2 text-sm text-muted-foreground">{inv.unit}</div>
                    <div className="col-span-2 text-sm font-bold text-right">
                      <span className={inv.flag === "High" ? "text-destructive" : inv.flag === "Low" ? "text-primary" : "text-card-foreground"}>
                        {inv.result}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Remarks */}
          {report.remarks && (
            <div className="mx-6 mb-3 p-4 bg-primary/5 rounded-lg border-[1.5px] border-primary/20 text-sm text-muted-foreground leading-relaxed">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">📋 Remarks</p>
              {report.remarks}
            </div>
          )}

          {/* Instrument */}
          {report.instrument && (
            <div className="px-6 pb-2">
              <p className="text-xs text-muted-foreground italic">
                Instruments: {report.instrument}
              </p>
            </div>
          )}

          {/* Signatures */}
          <div className="px-6 py-3">
            <div className="grid grid-cols-3 gap-4 text-center mt-8">
              <div>
                <div className="h-10" />
                <div className="border-t-2 border-primary pt-2">
                  <p className="text-xs font-bold text-card-foreground">{report.technician || "Lab Technician"}</p>
                  <p className="text-[10px] text-muted-foreground">(Medical Lab Technician)</p>
                </div>
              </div>
              <div className="flex items-end justify-center">
                <p className="text-[10px] text-muted-foreground">****End of Report****</p>
              </div>
              <div>
                <div className="h-10" />
                <div className="border-t-2 border-primary pt-2">
                  <p className="text-xs font-bold text-card-foreground">{report.pathologist || "Pathologist"}</p>
                  <p className="text-[10px] text-muted-foreground">(MD, Pathologist)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-3 rounded-b-lg flex items-center justify-between">
            <div className="flex items-center gap-6">
              <FooterItem icon="📞" label="Phone" value={s.clinicPhone} />
              <FooterItem icon="✉️" label="Email" value={s.clinicEmail} />
              <FooterItem icon="📍" label="Address" value={s.clinicAddress} />
            </div>
            <div className="print:hidden">
              <Button variant="secondary" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function PatientRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex gap-1 text-xs">
      <span className="font-bold text-card-foreground min-w-[80px]">{label}</span>
      <span className={bold ? "font-bold text-card-foreground" : "text-muted-foreground"}>{value}</span>
    </div>
  );
}

function FooterItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-destructive-foreground/90">
      <span className="text-sm">{icon}</span>
      <div className="text-[10px] leading-tight">
        <div className="font-bold">{label}</div>
        <div className="opacity-80">{value}</div>
      </div>
    </div>
  );
}

export default LabReportView;
