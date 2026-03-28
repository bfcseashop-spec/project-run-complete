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
body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1e293b;background:#fff;font-size:11px;line-height:1.35}
.page{max-width:800px;margin:0 auto;position:relative;min-height:100vh;display:flex;flex-direction:column}

/* ── Watermark ── */
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);opacity:.035;pointer-events:none;z-index:0}
.watermark img{width:280px;height:280px;object-fit:contain}

/* ── Header ── */
.header-top{display:flex;align-items:center;justify-content:space-between;padding:10px 20px 8px;border-bottom:2px solid #0f766e}
.header-left{display:flex;align-items:center;gap:10px}
.logo{width:44px;height:44px;border-radius:10px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:1.5px solid #e2e8f0}
.logo img{width:100%;height:100%;object-fit:contain}
.brand-info h1{font-size:18px;font-weight:800;color:#0f172a;letter-spacing:-.3px;line-height:1.2}
.brand-info .tagline{font-size:8px;color:#0f766e;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:1px}
.contact-info{text-align:right;font-size:9.5px;color:#64748b;line-height:1.6}
.contact-info .icon{color:#0f766e;margin-right:3px;font-style:normal}
.address-bar{text-align:center;font-size:9px;color:#64748b;padding:3px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;letter-spacing:.2px}

/* ── Report Title Bar ── */
.report-title-bar{background:linear-gradient(135deg,#0f766e,#14b8a6);padding:4px 20px;text-align:center}
.report-title-bar h2{font-size:12px;font-weight:800;color:#fff;letter-spacing:2px;text-transform:uppercase}

/* ── Patient Info Grid ── */
.info-section{padding:8px 20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0}
.info-col{padding:0 10px;line-height:1.6}
.info-col:first-child{padding-left:0}
.info-col:last-child{padding-right:0}
.info-col:not(:last-child){border-right:1px solid #e2e8f0}
.info-row{display:flex;gap:4px;font-size:10px}
.info-label{color:#94a3b8;font-weight:500;white-space:nowrap;min-width:75px}
.info-value{font-weight:700;color:#1e293b}
.barcode-wrap{margin-top:3px;text-align:center}

/* ── Separator ── */
.section-divider{height:1.5px;background:linear-gradient(90deg,#0f766e,#14b8a6,#0f766e);margin:0 20px}

/* ── Results Table ── */
.results-wrap{padding:0 20px;flex:1}
table.results{width:100%;border-collapse:collapse;margin-top:2px}
table.results thead th{
  text-align:left;font-size:9.5px;font-weight:700;padding:4px 8px;
  color:#0f766e;text-transform:uppercase;letter-spacing:.6px;
  border-bottom:1.5px solid #0f766e;background:#f0fdfa
}
table.results thead th:nth-child(2),
table.results thead th:nth-child(3){text-align:center}
table.results tbody td{padding:3px 8px;border-bottom:1px solid #f1f5f9;font-size:10.5px;vertical-align:middle}
table.results tbody td:nth-child(2),
table.results tbody td:nth-child(3){text-align:center}
table.results tbody tr:hover{background:#f8fafc}
table.results .section-row td{padding:6px 8px 2px;border-bottom:none}
table.results .section-cell{font-size:10.5px;font-weight:800;color:#0f766e;letter-spacing:.3px}
.col-test{width:36%;font-weight:500;padding-left:14px !important}
.col-result{width:18%;font-weight:700}
.col-unit{width:14%;color:#64748b;font-size:10px}
.col-ref{width:32%;color:#64748b;font-size:9.5px}
.result-high{color:#dc2626 !important;font-weight:800;background:#fef2f2;border-radius:3px;padding:2px 6px !important}
.result-low{color:#2563eb !important;font-weight:800;background:#eff6ff;border-radius:3px;padding:2px 6px !important}

/* ── Interpretation ── */
.interpretation{margin:16px 24px;padding:10px 14px;background:#f0fdfa;border-left:3px solid #0f766e;border-radius:0 6px 6px 0;font-size:11.5px;color:#334155}
.interpretation strong{color:#0f766e}

/* ── Instrument ── */
.instrument-bar{text-align:center;font-size:10.5px;color:#64748b;padding:6px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-style:italic}

/* ── Signature Section ── */
.signature-section{padding:20px 24px 10px;display:flex;justify-content:flex-end}
.sig-block{text-align:center;min-width:240px;max-width:300px}
.sig-space{height:50px;border-bottom:2px solid #334155;margin-bottom:6px}
.sig-hint{font-size:9px;color:#94a3b8;margin-bottom:6px;font-style:italic}
.sig-name{font-size:13px;font-weight:800;color:#1e293b}
.sig-detail{font-size:10px;color:#475569;margin-top:1px;line-height:1.5}
.sig-label{font-size:9.5px;color:#94a3b8;margin-top:6px;font-weight:600;letter-spacing:1px;text-transform:uppercase}

/* ── Footer ── */
.report-footer{margin-top:auto;border-top:2px solid #e2e8f0;padding:10px 24px;display:flex;justify-content:space-between;align-items:center}
.report-footer .end-mark{font-size:10px;font-weight:700;color:#94a3b8;letter-spacing:2px}
.report-footer .print-info{font-size:9px;color:#cbd5e1}

@media print{
  @page{size:A4;margin:8mm}
  body{background:#fff}
  .page{border:none;min-height:auto}
  .watermark{position:fixed}
}
</style></head><body>
<div class="page">
  ${s.clinicLogo ? `<div class="watermark"><img src="${s.clinicLogo}" alt=""/></div>` : ""}

  <!-- Header -->
  <div class="header-top">
    <div class="header-left">
      <div class="logo">${s.clinicLogo ? `<img src="${s.clinicLogo}" alt="Logo"/>` : '<span style="font-size:28px">🏥</span>'}</div>
      <div class="brand-info">
        <h1>${s.clinicName}</h1>
        <div class="tagline">${s.clinicTagline || "Accurate · Caring · Instant"}</div>
      </div>
    </div>
    <div class="contact-info">
      <div><em class="icon">📞</em> ${s.clinicPhone || "—"}</div>
      <div><em class="icon">✉️</em> ${s.clinicEmail || "—"}</div>
    </div>
  </div>
  <div class="address-bar">${s.clinicAddress || "—"}</div>

  <!-- Report Title -->
  <div class="report-title-bar"><h2>Laboratory Report</h2></div>

  <!-- Patient Info -->
  <div class="info-section">
    <div class="info-col">
      <div class="info-row"><span class="info-label">Patient Name:</span> <span class="info-value">${report.patient}</span></div>
      <div class="info-row"><span class="info-label">Age / Gender:</span> <span class="info-value">${report.age} Yrs / ${report.gender}</span></div>
      <div class="info-row"><span class="info-label">Patient ID:</span> <span class="info-value">${report.patientId}</span></div>
      <div class="info-row"><span class="info-label">Referred By:</span> <span class="info-value">Dr. ${report.doctor}</span></div>
    </div>
    <div class="info-col">
      <div class="info-row"><span class="info-label">Report No:</span> <span class="info-value">${report.id}</span></div>
      <div class="info-row"><span class="info-label">Report Date:</span> <span class="info-value">${report.date}</span></div>
      <div class="info-row"><span class="info-label">Delivery Date:</span> <span class="info-value">${reportingDate}</span></div>
      <div class="info-row"><span class="info-label">Sample Type:</span> <span class="info-value">${report.sampleType || "—"}</span></div>
    </div>
    <div class="info-col">
      <div class="info-row"><span class="info-label">Collected:</span> <span class="info-value">${collectedOn}</span></div>
      <div class="info-row"><span class="info-label">Reported:</span> <span class="info-value">${report.reportedAt || reportingDate}</span></div>
      <div class="barcode-wrap">${barcodeImg}</div>
    </div>
  </div>

  <div class="section-divider"></div>

  ${report.instrument ? `<div class="instrument-bar">Tested using: <strong>${report.instrument}</strong></div>` : ""}

  <!-- Results Table -->
  <div class="results-wrap">
    <table class="results">
      <thead><tr><th>Test Parameter</th><th>Result</th><th>Unit</th><th>Reference Range</th></tr></thead>
      <tbody>${tableRowsHTML}</tbody>
    </table>
  </div>

  ${report.remarks ? `<div class="interpretation"><strong>Interpretation: </strong>${report.remarks}</div>` : ""}

  <!-- Signature -->
  ${(() => {
    const parts = (report.technician || "Lab Technologist").split(" | ");
    const name = parts[0] || "Lab Technologist";
    const role = parts[1] || "Lab Technologist";
    const degree = parts[2] || "";
    const company = parts[3] || "";
    const expertise = parts[4] || "";
    return `<div class="signature-section">
      <div class="sig-block">
        <div class="sig-space"></div>
        <div class="sig-hint">(Signature & Stamp)</div>
        <div class="sig-name">${name}</div>
        ${degree ? `<div class="sig-detail">${degree}</div>` : ""}
        ${expertise ? `<div class="sig-detail">${expertise}</div>` : ""}
        <div class="sig-detail">${role}</div>
        ${company ? `<div class="sig-detail">${company}</div>` : ""}
        <div class="sig-label">Prepared by</div>
      </div>
    </div>`;
  })()}

  <!-- Footer -->
  <div class="report-footer">
    <span class="print-info">Printed: ${new Date().toLocaleString()}</span>
    <span class="end-mark">— End of Report —</span>
    <span class="print-info">${s.clinicName}</span>
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

            {/* Signature - view shows name only */}
            <div className="px-5 mt-8 mb-3 flex flex-col items-end">
              <div className="max-w-[280px] text-center">
                <div className="border-t-2 border-gray-700 mt-10 pt-2" />
                <p className="text-[13px] font-bold">{(report.technician || "Lab Technologist").split(" | ")[0]}</p>
                <p className="text-[9px] text-gray-400 mt-1">Prepared by</p>
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
