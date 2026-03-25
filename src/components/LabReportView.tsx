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
  const barcodeImg = barcodeSVG(report.id, 220, 50);
  const qrPlaceholder = barcodeSVG(report.patientId, 80, 80);
  const reportingDate = report.resultDate || report.date;
  const now = new Date();
  const registeredOn = report.date;
  const collectedOn = report.collectedAt || report.date;
  const reportedOn = reportingDate;

  // Build rows: section titles as inline bold rows, then investigations
  const tableRowsHTML = report.sections.map((section) => {
    let rows = "";
    if (section.title) {
      rows += `<tr class="section-row"><td colspan="5" class="section-cell"><strong>${section.title.toUpperCase()}</strong></td></tr>`;
    }
    rows += section.investigations.filter(inv => inv.name).map((inv) => {
      const flagLabel = inv.flag === "High" ? '<span class="flag flag-high">High</span>' 
                       : inv.flag === "Low" ? '<span class="flag flag-low">Low</span>' 
                       : inv.result?.toLowerCase() === "positive" ? '<span class="flag flag-high">Positive</span>'
                       : "";
      const resultClass = inv.flag === "High" || inv.result?.toLowerCase() === "positive" ? "result-high" 
                        : inv.flag === "Low" ? "result-low" : "";
      return `<tr>
        <td class="col-inv">${inv.name}</td>
        <td class="col-result ${resultClass}">${inv.result || "—"}</td>
        <td class="col-flag">${flagLabel}</td>
        <td class="col-ref">${inv.referenceValue || "—"}</td>
        <td class="col-unit">${inv.unit || "—"}</td>
      </tr>`;
    }).join("");
    return rows;
  }).join("");

  return `<!DOCTYPE html><html><head><title>Lab Report - ${report.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:820px;margin:0 auto;padding:0;border:1px solid #e5e7eb}

/* === HEADER === */
.report-header{background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:16px 24px;display:flex;align-items:flex-start;justify-content:space-between}
.header-left{display:flex;align-items:center;gap:14px}
.lab-logo{width:56px;height:56px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.2);flex-shrink:0}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-logo-fallback{font-size:24px}
.header-brand h1{font-size:24px;font-weight:900;color:#fff;letter-spacing:0.5px;margin-bottom:2px}
.header-brand h1 span{color:#fbbf24}
.header-brand .tagline{font-size:11px;color:rgba(255,255,255,0.9);font-weight:600;letter-spacing:1px}
.header-right{text-align:right;color:#fff;font-size:12px;line-height:1.8}
.header-right .icon{margin-right:6px}
.header-address{background:rgba(0,0,0,0.15);padding:6px 24px;font-size:11px;color:rgba(255,255,255,0.95);text-align:center;letter-spacing:0.3px}
.header-web{background:#1e40af;padding:4px 24px;text-align:right;font-size:11px;color:rgba(255,255,255,0.8)}

/* === PATIENT BAR === */
.patient-bar{display:grid;grid-template-columns:1fr 1.2fr auto;gap:12px;padding:16px 24px;border-bottom:2px solid #e5e7eb;background:#fff}
.patient-info{line-height:1.9}
.patient-info .pname{font-size:16px;font-weight:800;color:#1a1a1a}
.patient-info .pdetail{font-size:12px;color:#374151}
.sample-info{font-size:12px;color:#374151;line-height:1.9}
.sample-info strong{color:#1a1a1a}
.barcode-info{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.barcode-info .timestamps{font-size:10px;color:#6b7280;line-height:1.7;text-align:right}
.barcode-info .timestamps strong{color:#374151}

/* === TEST TITLE === */
.test-title{text-align:center;padding:16px 24px 12px;border-bottom:2px solid #1d4ed8}
.test-title h2{font-size:18px;font-weight:800;color:#1a1a1a}
.test-title .sample-type{font-size:12px;color:#6b7280;margin-top:2px}

/* === RESULTS TABLE === */
.results-table{width:100%;border-collapse:collapse}
.results-table thead th{text-align:left;font-size:12px;font-weight:800;color:#1a1a1a;padding:10px 16px;border-bottom:2px solid #1a1a1a;background:#fff}
.results-table tbody td{padding:6px 16px;border-bottom:1px solid #f3f4f6;font-size:12.5px;vertical-align:middle}
.results-table tbody tr:hover{background:#f9fafb}
.section-row td{padding:12px 16px 4px !important;border-bottom:none !important}
.section-cell{font-size:12px;font-weight:800;color:#1a1a1a;letter-spacing:0.3px}
.col-inv{width:35%;color:#1a1a1a;font-weight:500}
.col-result{width:15%;font-weight:700;color:#1a1a1a}
.col-flag{width:12%;font-size:11px}
.col-ref{width:24%;color:#4b5563;font-size:12px}
.col-unit{width:14%;color:#4b5563;font-size:12px}
.result-high{color:#ea580c;font-weight:800}
.result-low{color:#2563eb;font-weight:800}
.flag{font-size:11px;font-weight:700;padding:1px 6px;border-radius:3px}
.flag-high{color:#ea580c}
.flag-low{color:#2563eb}

/* === BOTTOM SECTIONS === */
.report-bottom{padding:16px 24px}
.instrument-line{font-size:12px;color:#374151;margin-bottom:8px}
.instrument-line strong{color:#1a1a1a}
.remarks-line{font-size:12px;color:#374151;margin-bottom:8px}
.remarks-line strong{color:#1a1a1a}

/* === SIGNATURES === */
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:30px;padding-top:0}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #374151;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}

/* === FOOTER === */
.report-footer{border-top:2px solid #e5e7eb;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;margin-top:16px}
.footer-left{font-size:11px;color:#6b7280;font-style:italic}
.footer-center{font-size:11px;font-weight:700;color:#374151;letter-spacing:1px}
.footer-right{font-size:10px;color:#9ca3af}
.end-text{text-align:center;font-size:11px;font-weight:700;color:#6b7280;margin-top:44px;letter-spacing:1px}

@media print{@page{size:A4;margin:8mm}body{background:#fff}.page{max-width:100%;border:none}.results-table tbody tr:hover{background:transparent}}
</style></head><body>
<div class="page">
  <!-- HEADER -->
  <div class="report-header">
    <div class="header-left">
      <div class="lab-logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '<span class="lab-logo-fallback">🏥</span>'}</div>
      <div class="header-brand">
        <h1>${s.clinicName}</h1>
        <div class="tagline">${s.clinicTagline || "Accurate | Caring | Instant"}</div>
      </div>
    </div>
    <div class="header-right">
      <div>📞 ${s.clinicPhone || "—"}</div>
      <div>✉️ ${s.clinicEmail || "—"}</div>
    </div>
  </div>
  <div class="header-address">${s.clinicAddress || "—"}</div>

  <!-- PATIENT BAR -->
  <div class="patient-bar">
    <div class="patient-info">
      <div class="pname">${report.patient}</div>
      <div class="pdetail">Age : ${report.age} Years</div>
      <div class="pdetail">Sex : ${report.gender}</div>
      <div class="pdetail">PID : ${report.patientId}</div>
    </div>
    <div class="sample-info">
      <div><strong>Sample Collected At:</strong></div>
      <div>${s.clinicAddress || "—"}</div>
      <div style="margin-top:6px">Ref. By: <strong>Dr. ${report.doctor}</strong></div>
    </div>
    <div class="barcode-info">
      <div>${barcodeImg}</div>
      <div class="timestamps">
        <div><strong>Registered on:</strong> ${registeredOn}</div>
        <div><strong>Collected on:</strong> ${collectedOn}</div>
        <div><strong>Reported on:</strong> ${reportedOn}</div>
      </div>
    </div>
  </div>

  <!-- TEST TITLE -->
  <div class="test-title">
    <h2>${report.testName || report.category}</h2>
  </div>

  <!-- RESULTS TABLE -->
  <table class="results-table">
    <thead>
      <tr>
        <th class="col-inv">Investigation</th>
        <th class="col-result">Result</th>
        <th class="col-flag"></th>
        <th class="col-ref">Reference Value</th>
        <th class="col-unit">Unit</th>
      </tr>
    </thead>
    <tbody>
      ${report.sampleType ? `<tr><td class="col-inv">Primary Sample Type :</td><td class="col-result">${report.sampleType}</td><td></td><td></td><td></td></tr>` : ""}
      ${tableRowsHTML}
    </tbody>
  </table>

  <!-- BOTTOM INFO -->
  <div class="report-bottom">
    ${report.instrument ? `<div class="instrument-line"><strong>Instruments:</strong> ${report.instrument}</div>` : ""}
    ${report.remarks ? `<div class="remarks-line"><strong>Interpretation:</strong> ${report.remarks}</div>` : ""}

    <div class="signatures">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.technician || "Lab Technician"}</div><div class="sig-role">(Medical Lab Technician)</div></div>
      <div class="sig-block"><div class="end-text">****End of Report****</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.pathologist || "Pathologist"}</div><div class="sig-role">(MD, Pathologist)</div></div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="report-footer">
    <div class="footer-left">Thanks for Reference</div>
    <div class="footer-center">****End of Report****</div>
    <div class="footer-right">${report.id}</div>
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
