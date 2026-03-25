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

  const s = getSettings();
  const isComplete = report.status === "completed";
  const isPending = report.status === "pending";
  const statusLabel = isComplete ? "Complete" : isPending ? "Pending" : "In Progress";
  const hasResults = report.sections.some(s => s.investigations.some(inv => inv.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[95vh] p-0 gap-0 overflow-hidden rounded-xl border-none shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Detailed view of lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        {/* ── Blue Header with Logo ── */}
        <div className="bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(217,91%,60%)] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/95 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {s.clinicLogo ? (
                  <img src={s.clinicLogo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <FlaskConical className="w-5 h-5 text-[hsl(221,83%,53%)]" />
                )}
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">{s.clinicName || "Lab Report"}</h2>
                <p className="text-[11px] text-white/80 font-medium">{s.clinicTagline || "Laboratory Report"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm ${
                isComplete
                  ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/30"
                  : isPending
                  ? "bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/30"
                  : "bg-white/20 text-white ring-1 ring-white/30"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isComplete ? "bg-emerald-300" : isPending ? "bg-amber-300" : "bg-white"
                }`} />
                {statusLabel}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-white/80 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[calc(95vh-160px)]">
          {/* ── Patient & Test Info Strip ── */}
          <div className="px-6 py-4 bg-muted/30 border-b border-border">
            <div className="grid grid-cols-3 gap-x-6 gap-y-3">
              <MetaItem label="Report ID" value={report.id} mono />
              <MetaItem label="Test Name" value={report.testName} bold />
              <MetaItem label="Patient" value={report.patient} bold />
              <MetaItem label="Age" value={report.age ? `${report.age} Years` : "—"} />
              <MetaItem label="Gender" value={report.gender || "—"} />
              <MetaItem label="Category" value={report.category} />
              <MetaItem label="Sample Type" value={report.sampleType || "—"} />
              <MetaItem label="Referring Doctor" value={report.doctor || "—"} />
              <MetaItem label="Date" value={report.date} />
              <MetaItem label="Turnaround Time" value={report.expectedTAT || "—"} />
              <MetaItem label="Patient ID" value={report.patientId} mono />
            </div>
          </div>

          {/* ── Results Table ── */}
          {hasResults && (
            <div className="px-6 pt-4 pb-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-foreground/80">
                    <th className="text-left text-[11px] font-extrabold text-foreground py-2 pr-3 w-[34%]">Test Name</th>
                    <th className="text-left text-[11px] font-extrabold text-foreground py-2 pr-3 w-[22%]">Result</th>
                    <th className="text-left text-[11px] font-extrabold text-foreground py-2 pr-3 w-[18%]">Unit</th>
                    <th className="text-left text-[11px] font-extrabold text-foreground py-2 w-[26%]">Normal Ranges</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sections.map((section, sIdx) => (
                    <>
                      {section.title && (
                        <tr key={`sec-${sIdx}`}>
                          <td colSpan={4} className="pt-4 pb-1.5 text-[11px] font-extrabold text-foreground uppercase tracking-wider border-b border-border/50">
                            {section.title}
                          </td>
                        </tr>
                      )}
                      {section.investigations.filter(inv => inv.name).map((inv, iIdx) => {
                        const isHigh = inv.flag === "High";
                        const isLow = inv.flag === "Low";
                        const isPositive = inv.result?.toLowerCase() === "positive";
                        const flagged = isHigh || isLow || isPositive;

                        return (
                          <tr key={`${sIdx}-${iIdx}`} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                            <td className="py-2 pr-3 text-[12px] text-foreground font-medium">{inv.name}</td>
                            <td className={`py-2 pr-3 text-[12px] font-bold ${
                              isHigh || isPositive ? "text-orange-600" : isLow ? "text-blue-600" : "text-foreground"
                            }`}>
                              <span className="flex items-center gap-1.5">
                                {inv.result || "—"}
                                {flagged && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                    isHigh || isPositive ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {isHigh ? "↑ High" : isLow ? "↓ Low" : "Positive"}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-[12px] text-muted-foreground">{inv.unit || "—"}</td>
                            <td className="py-2 text-[12px] text-muted-foreground">{inv.referenceValue || "—"}</td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!hasResults && (
            <div className="px-6 py-10 text-center">
              <FlaskConical className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No test results available yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Results will appear here once entered</p>
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

function MetaItem({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">{label}</p>
      <p className={`text-[13px] text-foreground truncate ${bold ? "font-bold" : "font-medium"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

export default LabReportView;
