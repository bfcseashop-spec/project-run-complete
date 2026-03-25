import { type LabReport } from "@/data/labReports";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FlaskConical, X, User, Stethoscope, Clock, FileText, Activity, TestTube } from "lucide-react";
import { getSettings } from "@/data/settingsStore";
import { barcodeSVG } from "@/lib/barcode";
import { ScrollArea } from "@/components/ui/scroll-area";

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
.patient-bar{display:grid;grid-template-columns:1fr 1fr auto;gap:16px;padding:14px 28px;background:linear-gradient(135deg,#f0fdfa,#ecfdf5);border-bottom:3px solid #14b8a6}
.patient-col{display:flex;flex-direction:column;gap:5px}
.patient-row{display:flex;gap:6px;font-size:12px}
.patient-row .plabel{font-weight:700;color:#0f766e;min-width:85px;font-size:11px;text-transform:uppercase;letter-spacing:0.3px}
.patient-row .pvalue{color:#1a1a1a;font-weight:500}
.barcode-col{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.barcode-col .case-label{font-size:11px;font-weight:700;color:#0f766e}
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
.col-test{width:40%}.col-ref{width:22%}.col-unit{width:18%}.col-result{width:20%;text-align:right}
.inv-name{color:#1a1a1a;font-weight:600}
.ref-val{color:#6b7280;font-size:11px}
.unit-val{color:#6b7280;font-size:11px}
.result-val{font-weight:700;text-align:right;color:#1a1a1a;font-size:13px}
.result-high{color:#dc2626;font-weight:800;background:#fef2f2;padding:2px 6px;border-radius:3px}
.result-low{color:#2563eb;font-weight:800;background:#eff6ff;padding:2px 6px;border-radius:3px}
.remarks-box{margin:16px 0;padding:14px 18px;background:#f0fdfa;border:1.5px solid #99f6e4;border-radius:8px;font-size:12px;color:#374151;line-height:1.7}
.remarks-box::before{content:'📋 Remarks';display:block;font-size:10px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
.instrument-line{font-size:11px;color:#6b7280;margin-top:10px;font-style:italic;padding:6px 10px;background:#f9fafb;border-radius:4px;border-left:2px solid #d1d5db}
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:36px;padding-top:0}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #0f766e;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.end-text{font-size:10px;color:#9ca3af;margin-top:52px}
.report-footer{background:linear-gradient(135deg,#0f766e 0%,#115e59 100%);padding:12px 28px;display:flex;align-items:center;justify-content:space-between;margin-top:28px}
.footer-item{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,0.9);font-size:11px}
.footer-icon{width:26px;height:26px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center}
.footer-icon svg{width:12px;height:12px;fill:none;stroke:#fff;stroke-width:2}
.footer-qr{width:60px;height:60px;background:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.1)}
@media print{@page{size:A4;margin:10mm}body{background:#fff}.page{max-width:100%;padding:0}.results-table tbody tr:hover{background:transparent}.results-table tbody tr:nth-child(even){background:#fafffe}}
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
    <div class="header-right">
      <div class="header-badge">
        <div class="badge-label">Case</div>
        <div class="badge-value">${report.id.replace("LR-", "")}</div>
      </div>
    </div>
  </div>
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
  <div class="report-body">
    <div class="report-category">
      <h2>${report.category.toUpperCase()}</h2>
      <div class="reporting-date">Reporting Date: ${reportingDate}</div>
    </div>
    ${sectionsHTML}
    ${report.remarks ? `<div class="remarks-box">${report.remarks}</div>` : ""}
    ${report.instrument ? `<div class="instrument-line">Instruments: ${report.instrument}</div>` : ""}
    <div class="signatures">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.technician || "Lab Technician"}</div><div class="sig-role">(Medical Lab Technician)</div></div>
      <div class="sig-block"><div class="end-text">****End of Report****</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.pathologist || "Pathologist"}</div><div class="sig-role">(MD, Pathologist)</div></div>
    </div>
  </div>
  <div class="report-footer">
    <div class="footer-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><div><strong>Phone</strong><br/>${s.clinicPhone}</div></div>
    <div class="footer-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div><strong>Email</strong><br/>${s.clinicEmail}</div></div>
    <div class="footer-item"><div class="footer-icon"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div><div><strong>Address</strong><br/>${s.clinicAddress}</div></div>
    <div class="footer-qr">${qrPlaceholder}</div>
  </div>
</div>
</body></html>`;
}

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

  const isComplete = report.status === "completed";
  const isPending = report.status === "pending";
  const statusLabel = isComplete ? "Complete" : isPending ? "Pending" : "In Progress";

  const hasResults = report.sections.some(s => s.investigations.some(inv => inv.name));
  const attachments = report.attachments || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[95vh] p-0 gap-0 overflow-hidden rounded-xl border-border/60 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Detailed view of lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-[18px] h-[18px] text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">Lab Test Report</h2>
              <p className="text-[11px] text-muted-foreground">{report.id} · {report.date}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="max-h-[calc(95vh-140px)]">
          {/* ── Patient & Test Info Cards ── */}
          <div className="px-6 pt-5 pb-4 space-y-4">

            {/* ID + Status Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Test ID</span>
                <span className="text-sm font-extrabold text-foreground font-mono">{report.id}</span>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
                isComplete
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : isPending
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isComplete ? "bg-emerald-500" : isPending ? "bg-amber-500" : "bg-blue-500"
                }`} />
                {statusLabel}
              </span>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={TestTube} label="Test Name" value={report.testName} accent />
              <InfoCard icon={User} label="Patient" value={report.patient} />
              <InfoCard icon={Activity} label="Category" value={report.category} tag />
              <InfoCard icon={FileText} label="Sample Type" value={report.sampleType || "—"} tag />
              <InfoCard icon={Stethoscope} label="Referring Doctor" value={report.doctor || "—"} />
              <InfoCard icon={Clock} label="Turnaround Time" value={report.expectedTAT || "—"} />
            </div>

            {/* Report Attachments */}
            {attachments.length > 0 && (
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">Attachments</p>
                <div className="space-y-1">
                  {attachments.map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noreferrer" className="text-xs text-primary font-medium hover:underline block">
                      📎 {att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Results Table ── */}
          {hasResults && (
            <div className="border-t border-border">
              <div className="px-6 pt-4 pb-2">
                <h3 className="text-xs font-extrabold text-primary uppercase tracking-[0.15em]">Test Results</h3>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-12 gap-0 px-6 py-2.5 bg-primary/5 border-y border-border/60">
                <div className="col-span-4 text-[10px] font-extrabold text-foreground uppercase tracking-[0.12em]">Parameter</div>
                <div className="col-span-2 text-[10px] font-extrabold text-foreground uppercase tracking-[0.12em]">Result</div>
                <div className="col-span-2 text-[10px] font-extrabold text-foreground uppercase tracking-[0.12em]">Unit</div>
                <div className="col-span-4 text-[10px] font-extrabold text-foreground uppercase tracking-[0.12em]">Reference Range</div>
              </div>

              {/* Sections */}
              {report.sections.map((section, sIdx) => (
                <div key={sIdx}>
                  {/* Section Header */}
                  {section.title && (
                    <div className="px-6 py-2 border-b border-border/40 bg-primary/[0.03]">
                      <span className="text-[11px] font-extrabold text-primary uppercase tracking-[0.1em]">{section.title}</span>
                    </div>
                  )}
                  {/* Data Rows */}
                  {section.investigations.filter(inv => inv.name).map((inv, iIdx) => {
                    const isHigh = inv.flag === "High";
                    const isLow = inv.flag === "Low";
                    const isPositive = inv.result?.toLowerCase() === "positive";
                    const flagged = isHigh || isLow || isPositive;

                    return (
                      <div key={iIdx} className={`grid grid-cols-12 gap-0 px-6 py-2.5 border-b border-border/20 transition-colors hover:bg-muted/30 ${flagged ? "bg-destructive/[0.03]" : ""}`}>
                        <div className="col-span-4 text-[13px] font-medium text-foreground">{inv.name}</div>
                        <div className={`col-span-2 text-[13px] font-bold ${
                          isHigh ? "text-destructive" : isLow ? "text-blue-600" : isPositive ? "text-destructive" : "text-foreground"
                        }`}>
                          {inv.result || "—"}
                          {(isHigh || isLow) && (
                            <span className="ml-1 text-[9px] font-extrabold">{isHigh ? "↑" : "↓"}</span>
                          )}
                        </div>
                        <div className="col-span-2 text-[13px] text-muted-foreground">{inv.unit || "—"}</div>
                        <div className="col-span-4 text-[12px] text-muted-foreground leading-relaxed whitespace-pre-line">{inv.referenceValue || "—"}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* ── Remarks ── */}
          {report.remarks && (
            <div className="px-6 py-4 border-t border-border">
              <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-[0.15em] mb-1.5">Remarks</p>
              <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/40">{report.remarks}</p>
            </div>
          )}
        </ScrollArea>

        {/* ── Sticky Footer ── */}
        <div className="px-6 py-3 border-t border-border bg-card flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {isComplete ? "Report finalised" : "Awaiting results"}
          </p>
          <Button size="sm" className="rounded-lg px-5 gap-2 font-semibold shadow-sm" onClick={() => printLabReport(report)}>
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function InfoCard({ icon: Icon, label, value, accent, tag }: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: boolean;
  tag?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 flex items-start gap-2.5 transition-colors ${accent ? "border-primary/20 bg-primary/[0.04]" : "border-border bg-card"}`}>
      <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${accent ? "bg-primary/10" : "bg-muted"}`}>
        <Icon className={`w-3.5 h-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
        {tag ? (
          <span className="inline-block mt-0.5 text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">{value}</span>
        ) : (
          <p className={`text-sm font-semibold text-foreground truncate mt-0.5 ${accent ? "text-primary" : ""}`}>{value}</p>
        )}
      </div>
    </div>
  );
}

export default LabReportView;
