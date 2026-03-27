import { type LabReport } from "@/data/labReports";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, FlaskConical, X } from "lucide-react";
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
  const reportingDate = report.resultDate || report.date;
  const collectedOn = report.collectedAt || report.date;

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
.report-header{background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 60%,#3b82f6 100%);padding:16px 24px;display:flex;align-items:flex-start;justify-content:space-between}
.header-left{display:flex;align-items:center;gap:14px}
.lab-logo{width:56px;height:56px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.2);flex-shrink:0}
.lab-logo img{width:100%;height:100%;object-fit:contain}
.lab-logo-fallback{font-size:24px}
.header-brand h1{font-size:24px;font-weight:900;color:#fff;letter-spacing:0.5px;margin-bottom:2px}
.header-brand .tagline{font-size:11px;color:rgba(255,255,255,0.9);font-weight:600;letter-spacing:1px}
.header-right{text-align:right;color:#fff;font-size:12px;line-height:1.8}
.header-address{background:rgba(0,0,0,0.15);padding:6px 24px;font-size:11px;color:rgba(255,255,255,0.95);text-align:center;letter-spacing:0.3px}
.patient-bar{display:grid;grid-template-columns:1fr 1.2fr auto;gap:12px;padding:16px 24px;border-bottom:2px solid #e5e7eb;background:#fff}
.patient-info{line-height:1.9}
.patient-info .pname{font-size:16px;font-weight:800;color:#1a1a1a}
.patient-info .pdetail{font-size:12px;color:#374151}
.sample-info{font-size:12px;color:#374151;line-height:1.9}
.sample-info strong{color:#1a1a1a}
.barcode-info{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
.barcode-info .timestamps{font-size:10px;color:#6b7280;line-height:1.7;text-align:right}
.barcode-info .timestamps strong{color:#374151}
.test-title{text-align:center;padding:16px 24px 12px;border-bottom:2px solid #1d4ed8}
.test-title h2{font-size:18px;font-weight:800;color:#1a1a1a}
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
.report-bottom{padding:16px 24px}
.instrument-line{font-size:12px;color:#374151;margin-bottom:8px}
.instrument-line strong{color:#1a1a1a}
.remarks-line{font-size:12px;color:#374151;margin-bottom:8px}
.remarks-line strong{color:#1a1a1a}
.signatures{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:30px;padding-top:0}
.sig-block{text-align:center}
.sig-line{border-top:2px solid #374151;margin-top:44px;padding-top:8px}
.sig-name{font-size:12px;font-weight:700;color:#1a1a1a}
.sig-role{font-size:10px;color:#6b7280}
.report-footer{border-top:2px solid #e5e7eb;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;margin-top:16px}
.footer-left{font-size:11px;color:#6b7280;font-style:italic}
.footer-center{font-size:11px;font-weight:700;color:#374151;letter-spacing:1px}
.footer-right{font-size:10px;color:#9ca3af}
.end-text{text-align:center;font-size:11px;font-weight:700;color:#6b7280;margin-top:44px;letter-spacing:1px}
@media print{@page{size:A4;margin:8mm}body{background:#fff}.page{max-width:100%;border:none}.results-table tbody tr:hover{background:transparent}}
</style></head><body>
<div class="page">
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
        <div><strong>Registered on:</strong> ${report.date}</div>
        <div><strong>Collected on:</strong> ${collectedOn}</div>
        <div><strong>Reported on:</strong> ${reportingDate}</div>
      </div>
    </div>
  </div>
  <div class="test-title"><h2>${report.testName || report.category}</h2></div>
  <table class="results-table">
    <thead><tr>
      <th class="col-inv">Investigation</th>
      <th class="col-result">Result</th>
      <th class="col-flag"></th>
      <th class="col-ref">Reference Value</th>
      <th class="col-unit">Unit</th>
    </tr></thead>
    <tbody>
      ${report.sampleType ? `<tr><td class="col-inv">Primary Sample Type :</td><td class="col-result">${report.sampleType}</td><td></td><td></td><td></td></tr>` : ""}
      ${tableRowsHTML}
    </tbody>
  </table>
  <div class="report-bottom">
    ${report.instrument ? `<div class="instrument-line"><strong>Instruments:</strong> ${report.instrument}</div>` : ""}
    ${report.remarks ? `<div class="remarks-line"><strong>Interpretation:</strong> ${report.remarks}</div>` : ""}
    <div class="signatures">
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.technician || "Lab Technician"}</div><div class="sig-role">(Medical Lab Technician)</div></div>
      <div class="sig-block"><div class="end-text">****End of Report****</div></div>
      <div class="sig-block"><div class="sig-line"></div><div class="sig-name">${report.pathologist || "Pathologist"}</div><div class="sig-role">(MD, Pathologist)</div></div>
    </div>
  </div>
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
  const hasResults = report.sections.some(sec => sec.investigations.some(inv => inv.name));
  const reportingDate = report.resultDate || report.date;
  const collectedOn = report.collectedAt || report.date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-[95vh] p-0 gap-0 overflow-hidden rounded-xl border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Detailed view of lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-70px)]">
          {/* ===== REPORT DOCUMENT ===== */}
          <div className="bg-white text-[#1a1a1a] border border-border/50 mx-4 mt-4 mb-2 rounded-lg overflow-hidden shadow-sm" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* Header with clinic branding */}
            <div className="bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#3b82f6] px-6 py-4 flex items-start justify-between relative">
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                  {s.clinicLogo ? (
                    <img src={s.clinicLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <FlaskConical className="w-7 h-7 text-[#1d4ed8]" />
                  )}
                </div>
                <div>
                  <h2 className="text-white text-xl font-black tracking-tight">{s.clinicName || "Laboratory"}</h2>
                  <p className="text-white/80 text-[11px] font-semibold tracking-widest uppercase">{s.clinicTagline || "Accurate | Caring | Instant"}</p>
                </div>
              </div>
              <div className="text-right text-white text-[12px] leading-7 mt-1">
                <div>📞 {s.clinicPhone || "—"}</div>
                <div>✉️ {s.clinicEmail || "—"}</div>
              </div>
            </div>
            {/* Address bar */}
            <div className="bg-[#1e40af]/90 text-center text-white/90 text-[11px] py-1.5 tracking-wide">
              {s.clinicAddress || "—"}
            </div>

            {/* Status badge */}
            <div className="flex justify-end px-5 pt-3">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md border ${
                isComplete
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isPending
                  ? "bg-gray-50 text-gray-600 border-gray-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isComplete ? "bg-emerald-500" : isPending ? "bg-gray-400 animate-pulse" : "bg-blue-500 animate-pulse"
                }`} />
                {statusLabel}
              </div>
            </div>

            {/* Patient info bar */}
            <div className="grid grid-cols-[1fr_1.2fr_auto] gap-4 px-5 py-4 border-b-2 border-gray-200">
              <div className="leading-8">
                <div className="text-[15px] font-extrabold">{report.patient}</div>
                <div className="text-[12px] text-gray-600">Age : <strong className="text-[#1a1a1a]">{report.age} Years</strong></div>
                <div className="text-[12px] text-gray-600">Sex : <strong className="text-[#1a1a1a]">{report.gender}</strong></div>
                <div className="text-[12px] text-gray-600">PID : <strong className="text-[#1a1a1a] font-mono text-[11px]">{report.patientId}</strong></div>
              </div>
              <div className="text-[12px] text-gray-600 leading-8">
                <div><strong className="text-[#1a1a1a]">Sample Collected At:</strong></div>
                <div>{s.clinicAddress || "—"}</div>
                <div className="mt-1">Ref. By: <strong className="text-[#1a1a1a]">Dr. {report.doctor}</strong></div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div dangerouslySetInnerHTML={{ __html: barcodeSVG(report.id, 180, 40) }} />
                <div className="text-[10px] text-gray-500 leading-6 text-right">
                  <div><strong className="text-gray-700">Registered on:</strong> {report.date}</div>
                  <div><strong className="text-gray-700">Collected on:</strong> {collectedOn}</div>
                  <div><strong className="text-gray-700">Reported on:</strong> {reportingDate}</div>
                </div>
              </div>
            </div>

            {/* Test title */}
            <div className="text-center py-4 border-b-2 border-[#1d4ed8]">
              <h3 className="text-[17px] font-extrabold uppercase tracking-wide">{report.testName || report.category}</h3>
              {report.sampleType && (
                <p className="text-[11px] text-gray-500 mt-1">Sample Type: {report.sampleType}</p>
              )}
            </div>

            {/* Results table */}
            {hasResults ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-[12px] font-extrabold py-2.5 px-4 border-b-2 border-[#1a1a1a] w-[35%]">Test</th>
                    <th className="text-left text-[12px] font-extrabold py-2.5 px-4 border-b-2 border-[#1a1a1a] w-[20%]">Result</th>
                    <th className="text-left text-[12px] font-extrabold py-2.5 px-4 border-b-2 border-[#1a1a1a] w-[12%]">Unit</th>
                    <th className="text-left text-[12px] font-extrabold py-2.5 px-4 border-b-2 border-[#1a1a1a] w-[33%]">Reference Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sections.map((section, sIdx) => (
                    <>
                      {section.title && (
                        <tr key={`sec-${sIdx}`}>
                          <td colSpan={4} className="pt-4 pb-1.5 px-4 text-[12px] font-extrabold uppercase tracking-wide border-b border-gray-100" style={{ textDecoration: "underline" }}>
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
                          <tr key={`${sIdx}-${iIdx}`} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-1.5 px-4 text-[12px] font-medium pl-8">{inv.name}</td>
                            <td className={`py-1.5 px-4 text-[12px] font-bold ${
                              isHigh || isPositive ? "text-orange-600" : isLow ? "text-blue-600" : ""
                            }`}>
                              {inv.result || "—"}
                              {flagged && (
                                <span className={`ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded ${
                                  isHigh || isPositive ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                }`}>
                                  {isHigh ? "↑" : isLow ? "↓" : "⊕"}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-4 text-[12px] text-gray-500">{inv.unit || "—"}</td>
                            <td className="py-1.5 px-4 text-[12px] text-gray-500">{inv.referenceValue || "—"}</td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-14 text-center">
                <FlaskConical className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-400">No test results available yet</p>
                <p className="text-xs text-gray-300 mt-1">Results will appear here once entered</p>
              </div>
            )}

            {/* Bottom info */}
            <div className="px-5 pt-4">
              {report.instrument && (
                <p className="text-[12px] text-gray-600 mb-2"><strong className="text-[#1a1a1a]">Instruments:</strong> {report.instrument}</p>
              )}
              {report.remarks && (
                <p className="text-[12px] text-gray-600 mb-2"><strong className="text-[#1a1a1a]">Interpretation:</strong> {report.remarks}</p>
              )}
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-3 gap-6 px-5 mt-8 mb-2">
              <div className="text-center">
                <div className="border-t-2 border-gray-700 mt-10 pt-2" />
                <p className="text-[12px] font-bold">{report.technician || "Lab Technician"}</p>
                <p className="text-[10px] text-gray-500">(Medical Lab Technician)</p>
              </div>
              <div className="text-center">
                <p className="text-[11px] font-bold text-gray-500 mt-10 tracking-widest">****End of Report****</p>
              </div>
              <div className="text-center">
                <div className="border-t-2 border-gray-700 mt-10 pt-2" />
                <p className="text-[12px] font-bold">{report.pathologist || "Pathologist"}</p>
                <p className="text-[10px] text-gray-500">(MD, Pathologist)</p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 px-5 py-3 flex justify-between items-center mt-4">
              <span className="text-[11px] text-gray-400 italic">Thanks for Reference</span>
              <span className="text-[11px] font-bold text-gray-500 tracking-widest">****End of Report****</span>
              <span className="text-[10px] text-gray-400 font-mono">{report.id}</span>
            </div>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {isComplete ? "✓ Report finalised" : "⏳ Awaiting results"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">
              Close
            </Button>
            <Button size="sm" className="h-9 px-5 bg-gradient-to-r from-primary to-primary/80 shadow-md font-semibold" onClick={() => printLabReport(report)}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabReportView;
