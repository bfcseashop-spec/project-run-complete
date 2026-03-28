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
      rows += `<tr class="section-row"><td colspan="4" class="section-cell"><strong><u>${section.title}</u></strong></td></tr>`;
    }
    rows += section.investigations.filter(inv => inv.name).map((inv) => {
      const isHigh = inv.flag === "High" || inv.result?.toLowerCase() === "positive";
      const isLow = inv.flag === "Low";
      const resultClass = isHigh ? "result-high" : isLow ? "result-low" : "";
      return `<tr>
        <td class="col-test">${inv.name}</td>
        <td class="col-result ${resultClass}">${inv.result || "—"}</td>
        <td class="col-unit">${inv.unit || ""}</td>
        <td class="col-ref">${inv.referenceValue || "—"}</td>
      </tr>`;
    }).join("");
    return rows;
  }).join("");

  return `<!DOCTYPE html><html><head><title>Lab Report - ${report.id}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',system-ui,sans-serif;color:#1a1a1a;background:#fff;font-size:13px}
.page{max-width:820px;margin:0 auto;border:1px solid #d1d5db}
.header{background:linear-gradient(135deg,#1e40af,#2563eb,#3b82f6);padding:14px 20px;display:flex;align-items:center;justify-content:space-between}
.header-left{display:flex;align-items:center;gap:12px}
.logo{width:50px;height:50px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.logo img{width:100%;height:100%;object-fit:contain}
.brand h1{font-size:22px;font-weight:900;color:#fff}
.brand .tag{font-size:10px;color:rgba(255,255,255,.85);font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
.header-right{text-align:right;color:#fff;font-size:12px;line-height:1.8}
.addr-bar{background:rgba(0,0,0,.15);text-align:center;color:rgba(255,255,255,.9);font-size:11px;padding:5px 20px;letter-spacing:.3px}
.info-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-bottom:2px solid #d1d5db;font-size:12px}
.info-grid .col{padding:12px 16px;line-height:1.9}
.info-grid .col:not(:last-child){border-right:1px solid #e5e7eb}
.info-grid .lbl{color:#6b7280;font-size:11px}
.info-grid .val{font-weight:700;color:#1a1a1a}
.test-banner{text-align:center;padding:14px;border-bottom:3px solid #1e40af}
.test-banner h2{font-size:18px;font-weight:900;text-transform:uppercase;letter-spacing:.5px}
.test-banner .sub{font-size:11px;color:#6b7280;margin-top:2px}
.instrument-bar{text-align:center;font-size:11px;color:#4b5563;padding:6px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-style:italic}
table.results{width:100%;border-collapse:collapse}
table.results thead th{text-align:left;font-size:12px;font-weight:800;padding:8px 14px;border-bottom:2px solid #1a1a1a;background:#f9fafb}
table.results tbody td{padding:5px 14px;border-bottom:1px solid #f3f4f6;font-size:12px}
table.results .section-row td{padding:10px 14px 3px;border-bottom:none}
table.results .section-cell{font-size:12px;font-weight:800;letter-spacing:.3px}
.col-test{width:38%;font-weight:500;padding-left:24px !important}
.col-result{width:20%;font-weight:700}
.col-unit{width:14%;color:#4b5563}
.col-ref{width:28%;color:#4b5563}
.result-high{color:#ea580c;font-weight:800}
.result-low{color:#2563eb;font-weight:800}
.bottom{padding:14px 20px}
.bottom .note{font-size:12px;color:#374151;margin-bottom:6px}
.bottom .note strong{color:#1a1a1a}
.sigs{margin-top:30px}
.sig{text-align:center}
.sig .line{border-top:2px solid #374151;margin-top:40px;padding-top:6px}
.sig .name{font-size:12px;font-weight:700}
.sig .role{font-size:10px;color:#6b7280}
.sig .end{font-size:11px;font-weight:700;color:#6b7280;margin-top:40px;letter-spacing:1px}
.footer{border-top:2px solid #e5e7eb;padding:8px 20px;display:flex;justify-content:space-between;align-items:center;margin-top:12px}
.footer span{font-size:10px;color:#9ca3af}
.footer .mid{font-weight:700;color:#6b7280;font-size:11px;letter-spacing:1px}
@media print{@page{size:A4;margin:8mm}body{background:#fff}.page{border:none}}
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <div class="logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '🏥'}</div>
      <div class="brand"><h1>${s.clinicName}</h1><div class="tag">${s.clinicTagline || "Accurate | Caring | Instant"}</div></div>
    </div>
    <div class="header-right">
      <div>📞 ${s.clinicPhone || "—"}</div>
      <div>✉️ ${s.clinicEmail || "—"}</div>
    </div>
  </div>
  <div class="addr-bar">${s.clinicAddress || "—"}</div>
  <div class="info-grid">
    <div class="col">
      <div><span class="lbl">Patient Name:</span> <span class="val">${report.patient}</span></div>
      <div><span class="lbl">Age:</span> <span class="val">${report.age} Years</span></div>
      <div><span class="lbl">Gender:</span> <span class="val">${report.gender}</span></div>
      <div><span class="lbl">PID:</span> <span class="val">${report.patientId}</span></div>
    </div>
    <div class="col">
      <div><span class="lbl">Report No:</span> <span class="val">${report.id}</span></div>
      <div><span class="lbl">Date:</span> <span class="val">${report.date}</span></div>
      <div><span class="lbl">Delivery Date:</span> <span class="val">${report.resultDate || "—"}</span></div>
      <div><span class="lbl">Referred By:</span> <span class="val">Dr. ${report.doctor}</span></div>
    </div>
    <div class="col">
      <div><span class="lbl">Sample:</span> <span class="val">${report.sampleType || "—"}</span></div>
      <div><span class="lbl">Collected:</span> <span class="val">${report.collectedAt || "—"}</span></div>
      <div><span class="lbl">Reported:</span> <span class="val">${report.reportedAt || report.resultDate || "—"}</span></div>
      <div style="margin-top:6px">${barcodeImg}</div>
    </div>
  </div>
  <div class="test-banner"><h2>${report.testName || report.category}</h2><div class="sub">Sample: ${report.sampleType || "—"}</div></div>
  ${report.instrument ? `<div class="instrument-bar">Test is carried out by ${report.instrument}</div>` : ""}
  <table class="results">
    <thead><tr><th>Test</th><th>Result</th><th>Unit</th><th>Reference Value</th></tr></thead>
    <tbody>${tableRowsHTML}</tbody>
  </table>
  <div class="bottom">
    ${report.remarks ? `<div class="note"><strong>Interpretation:</strong> ${report.remarks}</div>` : ""}
    ${(() => {
      const parts = (report.technician || "Lab Technologist").split(" | ");
      const name = parts[0] || "Lab Technologist";
      const degree = parts[2] || "";
      const role = parts[1] || "Lab Technologist";
      const company = parts[3] || "";
      return `<div class="sigs" style="display:flex;flex-direction:column;align-items:flex-end">
        <div class="sig" style="text-align:center;max-width:280px">
          <div class="line"></div>
          <div class="name" style="font-weight:bold;font-size:13px">${name}</div>
          ${degree ? `<div style="font-size:10px;color:#555;margin-top:1px">${degree}</div>` : ""}
          <div style="font-size:10px;color:#555;margin-top:1px">${role}</div>
          ${company ? `<div style="font-size:10px;color:#555;margin-top:1px">${company}</div>` : ""}
          <div class="role" style="margin-top:4px;font-size:10px;color:#888">Prepared by</div>
        </div>
      </div>`;
    })()}
    <div style="text-align:center;margin-top:20px"><span class="end">****End of Report****</span></div>
  </div>
</div></body></html>`;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[95vh] p-0 gap-0 overflow-hidden rounded-xl border-0 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(95vh-65px)]">
          <div className="bg-white text-[#1a1a1a] mx-3 mt-3 mb-2 rounded-lg overflow-hidden shadow-sm border border-gray-200" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

            {/* Clinic header */}
            <div className="bg-gradient-to-r from-[#1e40af] via-[#2563eb] to-[#3b82f6] px-5 py-3.5 flex items-center justify-between relative">
              <button onClick={() => onOpenChange(false)} className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center z-10">
                <X className="w-3.5 h-3.5 text-white/80" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-lg shrink-0">
                  {s.clinicLogo ? <img src={s.clinicLogo} alt="Logo" className="w-full h-full object-contain p-1" /> : <FlaskConical className="w-6 h-6 text-[#1e40af]" />}
                </div>
                <div>
                  <h2 className="text-white text-lg font-black tracking-tight">{s.clinicName || "Laboratory"}</h2>
                  <p className="text-white/80 text-[10px] font-bold tracking-[2px] uppercase">{s.clinicTagline || "Healthcare & Wellness"}</p>
                </div>
              </div>
              <div className="text-right text-white text-[12px] leading-7">
                <div>📞 {s.clinicPhone || "—"}</div>
                <div>✉️ {s.clinicEmail || "—"}</div>
              </div>
            </div>
            <div className="bg-[#1e40af]/80 text-center text-white/90 text-[11px] py-1 tracking-wide">
              {s.clinicAddress || "—"}
            </div>

            {/* Patient info grid — 3 columns like the reference */}
            <div className="grid grid-cols-3 border-b-2 border-gray-200 text-[12px]">
              {/* Column 1: Patient */}
              <div className="p-3 border-r border-gray-100 leading-7">
                <div><span className="text-gray-500 text-[11px]">Patient Name:</span> <strong>{report.patient}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Age:</span> <strong>{report.age} Years</strong></div>
                <div><span className="text-gray-500 text-[11px]">Gender:</span> <strong>{report.gender}</strong></div>
                <div><span className="text-gray-500 text-[11px]">PID:</span> <strong className="font-mono text-[11px]">{report.patientId}</strong></div>
              </div>
              {/* Column 2: Report details */}
              <div className="p-3 border-r border-gray-100 leading-7">
                <div><span className="text-gray-500 text-[11px]">Report No:</span> <strong>{report.id}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Invoice Date:</span> <strong>{report.date}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Delivery Date:</span> <strong>{report.resultDate || "—"}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Referred By:</span> <strong>Dr. {report.doctor}</strong></div>
              </div>
              {/* Column 3: Sample + barcode */}
              <div className="p-3 leading-7">
                <div><span className="text-gray-500 text-[11px]">Sample:</span> <strong>{report.sampleType || "—"}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Collected:</span> <strong>{report.collectedAt || "—"}</strong></div>
                <div><span className="text-gray-500 text-[11px]">Reported:</span> <strong>{report.reportedAt || report.resultDate || "—"}</strong></div>
                <div className="mt-1" dangerouslySetInnerHTML={{ __html: barcodeSVG(report.id, 160, 35) }} />
              </div>
            </div>

            {/* Status badge */}
            <div className="flex justify-center py-2">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                isComplete ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isPending ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? "bg-emerald-500" : isPending ? "bg-amber-500 animate-pulse" : "bg-blue-500 animate-pulse"}`} />
                {statusLabel}
              </div>
            </div>

            {/* Test title banner */}
            <div className="text-center py-3 border-b-[3px] border-[#1e40af]">
              <h3 className="text-[17px] font-black uppercase tracking-wide">{report.testName || report.category}</h3>
              {report.sampleType && <p className="text-[11px] text-gray-500 mt-0.5">Sample: {report.sampleType}</p>}
            </div>

            {/* Instrument line */}
            {report.instrument && (
              <div className="text-center text-[11px] text-gray-500 italic py-1.5 bg-gray-50 border-b border-gray-100">
                Test is carried out by {report.instrument}
              </div>
            )}

            {/* Results table */}
            {hasResults ? (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-[12px] font-extrabold py-2 px-4 border-b-2 border-[#1a1a1a] w-[38%]">Test</th>
                    <th className="text-left text-[12px] font-extrabold py-2 px-4 border-b-2 border-[#1a1a1a] w-[20%]">Result</th>
                    <th className="text-left text-[12px] font-extrabold py-2 px-4 border-b-2 border-[#1a1a1a] w-[14%]">Unit</th>
                    <th className="text-left text-[12px] font-extrabold py-2 px-4 border-b-2 border-[#1a1a1a] w-[28%]">Reference Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.sections.map((section, sIdx) => (
                    <>
                      {section.title && (
                        <tr key={`sec-${sIdx}`}>
                          <td colSpan={4} className="pt-3 pb-1 px-4 text-[12px] font-extrabold uppercase tracking-wide border-b border-gray-50">
                            <span className="underline">{section.title}</span>
                          </td>
                        </tr>
                      )}
                      {section.investigations.filter(inv => inv.name).map((inv, iIdx) => {
                        const isHigh = inv.flag === "High" || inv.result?.toLowerCase() === "positive";
                        const isLow = inv.flag === "Low";
                        return (
                          <tr key={`${sIdx}-${iIdx}`} className="border-b border-gray-50 hover:bg-gray-50/40">
                            <td className="py-1.5 pl-7 pr-4 text-[12px] font-medium">{inv.name}</td>
                            <td className={`py-1.5 px-4 text-[12px] font-bold ${isHigh ? "text-orange-600" : isLow ? "text-blue-600" : ""}`}>
                              {inv.result || "—"}
                              {(isHigh || isLow) && (
                                <span className={`ml-1 text-[9px] font-bold px-1 py-0.5 rounded ${isHigh ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}>
                                  {isHigh ? "↑" : "↓"}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-4 text-[12px] text-gray-500">{inv.unit || ""}</td>
                            <td className="py-1.5 px-4 text-[12px] text-gray-500">{inv.referenceValue || "—"}</td>
                          </tr>
                        );
                      })}
                    </>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center">
                <FlaskConical className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-sm font-semibold text-gray-400">No test results available yet</p>
                <p className="text-xs text-gray-300 mt-1">Results will appear here once entered</p>
              </div>
            )}

            {/* Remarks / Interpretation */}
            {report.remarks && (
              <div className="px-5 pt-3">
                <p className="text-[12px] text-gray-600"><strong className="text-[#1a1a1a]">Interpretation:</strong> {report.remarks}</p>
              </div>
            )}

            {/* Signatures - matching reference: Prepared by | End | Verified by */}
            <div className="px-5 mt-8 mb-3 flex flex-col items-end">
              <div className="max-w-[200px] text-center">
                <div className="border-t-2 border-gray-700 mt-10 pt-2" />
                <p className="text-[12px] font-bold">{report.technician || "Lab Technologist"}</p>
                <p className="text-[10px] text-gray-500">Prepared by</p>
              </div>
            </div>
            <div className="text-center mt-3 mb-3">
              <p className="text-[11px] font-bold text-gray-500 tracking-widest">****End of Report****</p>
            </div>
          </div>
        </ScrollArea>

        {/* Action Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between">
          <p className="text-[11px] text-muted-foreground">
            {isComplete ? "✓ Report finalised" : "⏳ Awaiting results"}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-9">Close</Button>
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
