import { type LabReport } from "@/data/labReports";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Printer, Download, Activity, Phone, Mail } from "lucide-react";

interface LabReportViewProps {
  report: LabReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LabReportView = ({ report, open, onOpenChange }: LabReportViewProps) => {
  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Lab Report - {report.id}</DialogTitle>
          <DialogDescription>Detailed lab report for {report.patient}</DialogDescription>
        </DialogHeader>

        <div className="print:shadow-none" id="lab-report-print">
          {/* Header */}
          <div className="bg-primary px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary-foreground tracking-tight">
                    CLINICPOS <span className="font-normal opacity-90">PATHOLOGY LAB</span>
                  </h2>
                  <p className="text-xs text-primary-foreground/70">Accurate | Caring | Instant</p>
                </div>
              </div>
              <div className="text-right text-xs text-primary-foreground/80 space-y-0.5">
                <div className="flex items-center gap-1.5 justify-end">
                  <Phone className="w-3 h-3" /> 0123456789
                </div>
                <div className="flex items-center gap-1.5 justify-end">
                  <Mail className="w-3 h-3" /> lab@clinicpos.com
                </div>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="px-6 py-4 bg-muted/30 border-b border-border">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <div className="flex gap-2">
                  <span className="text-sm font-bold text-card-foreground">{report.patient}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>Age: {report.age} Years &nbsp;|&nbsp; Sex: {report.gender}</p>
                  <p>PID: {report.patientId}</p>
                  <p>Ref. By: <span className="font-medium text-card-foreground">{report.doctor}</span></p>
                </div>
              </div>
              <div className="text-right text-xs text-muted-foreground space-y-0.5">
                <p>Primary Sample Type: <span className="font-medium text-card-foreground">{report.sampleType}</span></p>
                <p>Registered on: <span className="font-medium">{report.date}</span></p>
                {report.collectedAt && <p>Collected on: <span className="font-medium">{report.collectedAt}, {report.date}</span></p>}
                {report.reportedAt && <p>Reported on: <span className="font-medium">{report.reportedAt}, {report.resultDate}</span></p>}
              </div>
            </div>
          </div>

          {/* Test Title */}
          <div className="px-6 py-3 border-b border-border">
            <h3 className="text-center text-base font-bold text-card-foreground">
              {report.testName}
            </h3>
          </div>

          {/* Results Table */}
          <div className="px-6 py-2">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 py-2 border-b-2 border-foreground/20">
              <div className="col-span-5 text-xs font-bold text-card-foreground uppercase tracking-wide">Investigation</div>
              <div className="col-span-2 text-xs font-bold text-card-foreground uppercase tracking-wide">Result</div>
              <div className="col-span-3 text-xs font-bold text-card-foreground uppercase tracking-wide">Reference Value</div>
              <div className="col-span-2 text-xs font-bold text-card-foreground uppercase tracking-wide">Unit</div>
            </div>

            {/* Sections */}
            {report.sections.map((section, sIdx) => (
              <div key={sIdx}>
                {/* Section Header */}
                <div className="py-2 mt-2">
                  <span className="text-xs font-bold text-card-foreground uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>

                {/* Section Rows */}
                {section.investigations.map((inv, iIdx) => (
                  <div
                    key={iIdx}
                    className="grid grid-cols-12 gap-2 py-1.5 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <div className="col-span-5 text-sm text-card-foreground">{inv.name}</div>
                    <div className="col-span-2 text-sm font-semibold flex items-center gap-1.5">
                      <span className={inv.flag ? "text-destructive" : "text-card-foreground"}>
                        {inv.result}
                      </span>
                      {inv.flag && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          inv.flag === "High"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}>
                          {inv.flag}
                        </span>
                      )}
                    </div>
                    <div className="col-span-3 text-sm text-muted-foreground">{inv.referenceValue}</div>
                    <div className="col-span-2 text-sm text-muted-foreground">{inv.unit}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Instrument */}
          {report.instrument && (
            <div className="px-6 py-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Instruments:</span> {report.instrument}
              </p>
            </div>
          )}

          {/* Remarks */}
          {report.remarks && (
            <div className="px-6 py-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">Remarks:</span> {report.remarks}
              </p>
            </div>
          )}

          <Separator />

          {/* Footer - Signatures */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="h-8" />
                <Separator className="mb-2" />
                <p className="text-xs font-semibold text-card-foreground">
                  {report.technician || "Lab Technician"}
                </p>
                <p className="text-[10px] text-muted-foreground">(Medical Lab Technician)</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mt-6">****End of Report****</p>
              </div>
              <div>
                <div className="h-8" />
                <Separator className="mb-2" />
                <p className="text-xs font-semibold text-card-foreground">
                  {report.pathologist || "Pathologist"}
                </p>
                <p className="text-[10px] text-muted-foreground">(MD, Pathologist)</p>
              </div>
            </div>
          </div>

          {/* Generated Info */}
          <div className="px-6 py-2 bg-muted/30 rounded-b-lg border-t border-border flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Generated on: {report.resultDate || report.date} &nbsp;|&nbsp; Report ID: {report.id}
            </p>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabReportView;
