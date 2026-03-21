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
.report-header{background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:16px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.lab-brand{display:flex;align-items:center;gap:12px}
.lab-logo{width:50px;height:50px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#dc2626;font-weight:700;text-align:center;line-height:1.1;overflow:hidden}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-name{font-size:24px;font-weight:800;color:#fff;letter-spacing:0.5px}
.lab-tagline{font-size:11px;color:rgba(255,255,255,0.85);margin-top:2px}
.header-right{display:flex;align-items:center;gap:16px}
.header-badge{background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;text-align:center;color:#fff}
.header-badge .badge-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:0.8}
.header-badge .badge-value{font-size:14px;font-weight:700;margin-top:2px}

/* ===== PATIENT INFO ===== */
.patient-bar{display:grid;grid-template-columns:1fr 1fr auto;gap:16px;padding:12px 24px;background:#fef2f2;border-bottom:2px solid #fca5a5}
.patient-col{display:flex;flex-direction:column;gap:4px}
.patient-row{display:flex;gap:4px;font-size:12px}
.patient-row .plabel{font-weight:700;color:#374151;min-width:80px}
.patient-row .pvalue{color:#1a1a1a}
.barcode-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.barcode-col .case-label{font-size:11px;font-weight:700;color:#dc2626}
.barcode-col .pat-no{font-size:10px;color:#666;margin-top:4px}

/* ===== REPORT BODY ===== */
.report-body{padding:16px 24px}
.report-category{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1a1a1a;padding-bottom:6px;margin-bottom:12px}
.report-category h2{font-size:18px;font-weight:700;text-transform:uppercase;color:#1a1a1a}
.reporting-date{font-size:11px;color:#666;text-align:right}

.section-title{font-size:14px;font-weight:700;color:#1a1a1a;margin:16px 0 6px 0;padding-bottom:4px;border-bottom:1px solid #e5e7eb}

.results-table{width:100%;border-collapse:collapse;margin-bottom:8px}
.results-table thead th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;color:#374151;border-bottom:2px solid #9ca3af;padding:6px 8px;letter-spacing:0.5px}
.results-table tbody td{padding:5px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;vertical-align:middle}
.results-table tbody tr:hover{background:#fafafa}
.col-test{width:40%}
.col-ref{width:22%}
.col-unit{width:18%}
.col-result{width:20%;text-align:right}
.results-table thead th.col-result{text-align:right}
.inv-name{color:#1a1a1a;font-weight:500}
.ref-val{color:#6b7280}
.unit-val{color:#6b7280}
.result-val{font-weight:700;text-align:right;color:#1a1a1a}
.result-high{color:#dc2626;font-weight:800}
.result-low{color:#2563eb;font-weight:800}

/* ===== REMARKS ===== */
.remarks-box{margin:16px 0;padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151;line-height:1.6}

/* ===== INSTRUMENTS ===== */
.instrument-line{font-size:11px;color:#6b7280;margin-top:8px;font-style:italic}

/* ===== SIGNATURES ===== */
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:32px;padding-top:0}
.sig-block{text-align:center}
.sig-line{border-top:1px solid #9ca3af;margin-top:40px;padding-top:6px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.end-text{font-size:10px;color:#9ca3af;margin-top:48px}

/* ===== FOOTER ===== */
.report-footer{background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:10px 24px;display:flex;align-items:center;justify-content:space-between;margin-top:24px}
.footer-item{display:flex;align-items:center;gap:6px;color:rgba(255,255,255,0.9);font-size:11px}
.footer-icon{width:24px;height:24px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center}
.footer-icon svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2}
.footer-qr{width:60px;height:60px;background:#fff;border-radius:4px;display:flex;align-items:center;justify-content:center;overflow:hidden}

@media print{
  @page{size:A4;margin:10mm}
  body{background:#fff}
  .page{max-width:100%;padding:0}
  .results-table tbody tr:hover{background:transparent}
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
          {/* Header - Red Gradient */}
          <div className="bg-destructive px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-lg overflow-hidden">
                  {s.clinicLogo ? <img src={s.clinicLogo} alt="Logo" className="w-full h-full object-contain" /> : '🏥'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-destructive-foreground tracking-tight">
                    {s.clinicName}
                  </h2>
                  <p className="text-xs text-destructive-foreground/80">{s.clinicTagline}</p>
                </div>
              </div>
              <div className="bg-destructive-foreground/10 rounded-lg px-4 py-2 text-center">
                <div className="text-[9px] uppercase tracking-widest text-destructive-foreground/70">Case</div>
                <div className="text-lg font-bold text-destructive-foreground">{report.id.replace("LR-", "")}</div>
              </div>
            </div>
          </div>

          {/* Patient Info Bar */}
          <div className="px-6 py-3 bg-destructive/5 border-b border-destructive/20">
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <PatientRow label="Name:" value={report.patient} bold />
                <PatientRow label="Age / Sex:" value={`${report.age} Years / ${report.gender}`} />
                <PatientRow label="PID:" value={report.patientId} />
              </div>
              <div className="space-y-1.5">
                <PatientRow label="Requested:" value={report.date} />
                <PatientRow label="Reported:" value={report.resultDate || "Pending"} />
                <PatientRow label="Consultant:" value={report.doctor} />
              </div>
              <div className="text-right space-y-1">
                <span className="text-xs font-bold text-destructive">Pat No: {report.patientId}</span>
                <div className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">{report.id}</div>
              </div>
            </div>
          </div>

          {/* Category + Reporting Date */}
          <div className="px-6 py-3 flex items-baseline justify-between border-b-2 border-foreground/20">
            <h2 className="text-lg font-bold text-card-foreground uppercase tracking-wide">
              {report.category}
            </h2>
            <span className="text-xs text-muted-foreground">
              Reporting Date: {reportingDate}
            </span>
          </div>

          {/* Sections */}
          <div className="px-6 py-2">
            {report.sections.map((section, sIdx) => (
              <div key={sIdx} className="mb-4">
                <div className="text-sm font-bold text-card-foreground uppercase tracking-wider py-2 border-b border-border">
                  {section.title}
                </div>
                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 py-2 border-b border-muted-foreground/30">
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
            <div className="mx-6 mb-3 p-3 bg-muted/40 rounded-md border border-border text-sm text-muted-foreground leading-relaxed">
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
          <div className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="h-10" />
                <div className="border-t border-muted-foreground/40 pt-2">
                  <p className="text-xs font-bold text-card-foreground">{report.technician || "Lab Technician"}</p>
                  <p className="text-[10px] text-muted-foreground">(Medical Lab Technician)</p>
                </div>
              </div>
              <div className="flex items-end justify-center">
                <p className="text-[10px] text-muted-foreground">****End of Report****</p>
              </div>
              <div>
                <div className="h-10" />
                <div className="border-t border-muted-foreground/40 pt-2">
                  <p className="text-xs font-bold text-card-foreground">{report.pathologist || "Pathologist"}</p>
                  <p className="text-[10px] text-muted-foreground">(MD, Pathologist)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-destructive px-6 py-3 rounded-b-lg flex items-center justify-between">
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
