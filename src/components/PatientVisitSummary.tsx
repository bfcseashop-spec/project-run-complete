import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User, Phone, Calendar, Hash, DollarSign, Stethoscope,
  Pill, Syringe, FileText, Download, Printer, TrendingUp,
  Activity, CreditCard, ChevronDown, ChevronUp,
} from "lucide-react";
import { getBillingRecords, type BillingRecord } from "@/data/billingStore";
import type { OPDPatient } from "@/data/opdPatients";
import { formatPrice } from "@/lib/currency";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: OPDPatient | null;
}

interface VisitLine {
  type: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

const typeLabel: Record<string, string> = { SVC: "Service", MED: "Medicine", INJ: "Injection", PKG: "Package", CUSTOM: "Custom" };
const typeIcon: Record<string, React.ReactNode> = {
  SVC: <Stethoscope className="w-3.5 h-3.5" />,
  MED: <Pill className="w-3.5 h-3.5" />,
  INJ: <Syringe className="w-3.5 h-3.5" />,
  PKG: <FileText className="w-3.5 h-3.5" />,
};

export default function PatientVisitSummary({ open, onOpenChange, patient }: Props) {
  const [filterProvider, setFilterProvider] = useState("all");
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  const visits = useMemo(() => {
    if (!patient) return [];
    return getBillingRecords()
      .filter((r) => r.patient === patient.name)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [patient, open]);

  const providers = useMemo(() => {
    const set = new Set(visits.map((v) => v.formData?.doctor).filter(Boolean) as string[]);
    return Array.from(set);
  }, [visits]);

  const filtered = useMemo(() => {
    if (filterProvider === "all") return visits;
    return visits.filter((v) => v.formData?.doctor === filterProvider);
  }, [visits, filterProvider]);

  const overview = useMemo(() => {
    let totalServices = 0, totalMedicines = 0, totalInjections = 0;
    let totalBilled = 0, totalPaid = 0;
    const serviceFreq: Record<string, { count: number; amount: number }> = {};
    const medFreq: Record<string, { count: number; amount: number }> = {};

    visits.forEach((v) => {
      totalBilled += v.total;
      totalPaid += v.paid;
      v.formData?.lineItems?.forEach((li) => {
        const amt = li.price * li.qty;
        if (li.type === "SVC") {
          totalServices++;
          serviceFreq[li.name] = { count: (serviceFreq[li.name]?.count || 0) + li.qty, amount: (serviceFreq[li.name]?.amount || 0) + amt };
        }
        if (li.type === "MED") {
          totalMedicines++;
          medFreq[li.name] = { count: (medFreq[li.name]?.count || 0) + li.qty, amount: (medFreq[li.name]?.amount || 0) + amt };
        }
        if (li.type === "INJ") totalInjections++;
      });
    });

    const topServices = Object.entries(serviceFreq).sort((a, b) => b[1].amount - a[1].amount).slice(0, 5);
    const topMedicines = Object.entries(medFreq).sort((a, b) => b[1].count - a[1].count).slice(0, 5);

    return { totalServices, totalMedicines, totalInjections, totalBilled, totalPaid, outstanding: totalBilled - totalPaid, topServices, topMedicines };
  }, [visits]);

  const getVisitLines = (record: BillingRecord): VisitLine[] => {
    return (record.formData?.lineItems || []).map((li) => ({
      type: li.type,
      name: li.name,
      qty: li.qty,
      price: li.price,
      total: li.price * li.qty,
    }));
  };

  const handleExportPDF = () => {
    const cols = [
      { key: "date", header: "Date" },
      { key: "id", header: "Visit ID" },
      { key: "doctor", header: "Provider" },
      { key: "service", header: "Services" },
      { key: "total", header: "Total" },
      { key: "paid", header: "Paid" },
      { key: "due", header: "Due" },
      { key: "method", header: "Payment" },
    ];
    const rows = filtered.map((v) => ({
      date: v.date,
      id: v.id,
      doctor: v.formData?.doctor || "—",
      service: v.service,
      total: formatPrice(v.total),
      paid: formatPrice(v.paid),
      due: formatPrice(v.due),
      method: v.method,
    }));
    exportToPDF(rows as unknown as Record<string, unknown>[], cols, `Visit Summary - ${patient?.name}`);
  };

  const handleExportCSV = () => {
    const cols = [
      { key: "date", header: "Date" },
      { key: "id", header: "Visit ID" },
      { key: "doctor", header: "Provider" },
      { key: "service", header: "Services" },
      { key: "total", header: "Total" },
      { key: "paid", header: "Paid" },
      { key: "due", header: "Due" },
      { key: "method", header: "Payment" },
    ];
    const rows = filtered.map((v) => ({
      date: v.date,
      id: v.id,
      doctor: v.formData?.doctor || "—",
      service: v.service,
      total: v.total,
      paid: v.paid,
      due: v.due,
      method: v.method,
    }));
    exportToExcel(rows as unknown as Record<string, unknown>[], cols, `Visit_Summary_${patient?.name?.replace(/\s/g, "_")}`);
  };

  if (!patient) return null;

  const firstVisit = visits.length > 0 ? visits[visits.length - 1].date : "—";
  const lastVisit = visits.length > 0 ? visits[0].date : "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
          <DialogTitle className="text-xl font-bold">Patient Visit Summary</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Patient Header */}
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-xl border">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {patient.photo ? (
                  <img src={patient.photo} alt={patient.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold">{patient.name}</h3>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Hash className="w-3.5 h-3.5" />{patient.id}</span>
                  <span>{patient.age} / {patient.gender}</span>
                  {patient.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{patient.phone}</span>}
                  {patient.bloodType && <Badge variant="outline" className="text-xs">{patient.bloodType}</Badge>}
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />First: {firstVisit}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last: {lastVisit}</span>
                  <span className="font-medium">Total Visits: <span className="font-number text-foreground">{visits.length}</span></span>
                  {overview.outstanding > 0 && (
                    <span className="text-destructive font-medium">Outstanding: <span className="font-number">{formatPrice(overview.outstanding)}</span></span>
                  )}
                </div>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Visits", value: visits.length, icon: Activity, color: "text-primary" },
                { label: "Services", value: overview.totalServices, icon: Stethoscope, color: "text-blue-600" },
                { label: "Medicines", value: overview.totalMedicines, icon: Pill, color: "text-emerald-600" },
                { label: "Injections", value: overview.totalInjections, icon: Syringe, color: "text-amber-600" },
                { label: "Total Billed", value: formatPrice(overview.totalBilled), icon: DollarSign, color: "text-primary" },
                { label: "Outstanding", value: formatPrice(overview.outstanding), icon: CreditCard, color: overview.outstanding > 0 ? "text-destructive" : "text-emerald-600" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 bg-muted/40 rounded-lg border text-center">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className="font-number text-lg font-bold">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Filter by provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportCSV}>
                <Download className="w-3.5 h-3.5 mr-1" />Excel
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportPDF}>
                <Printer className="w-3.5 h-3.5 mr-1" />PDF
              </Button>
            </div>

            <Separator />

            {/* Visit List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" /> Visit History ({filtered.length})
              </h4>
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No billing records found for this patient.</p>
              ) : (
                filtered.map((visit) => {
                  const isExpanded = expandedVisit === visit.id;
                  const lines = getVisitLines(visit);
                  return (
                    <div key={visit.id} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-xs text-muted-foreground font-mono w-16 shrink-0">{visit.date}</div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{visit.id}</Badge>
                          <span className="text-sm truncate">{visit.formData?.doctor || "—"}</span>
                          <span className="text-xs text-muted-foreground truncate hidden md:inline">{visit.service}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="font-number text-sm font-semibold">{formatPrice(visit.total)}</div>
                            {visit.due > 0 && <div className="font-number text-[10px] text-destructive">Due: {formatPrice(visit.due)}</div>}
                          </div>
                          <Badge variant={visit.method === "Cash" ? "default" : "secondary"} className="text-[10px]">{visit.method}</Badge>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t bg-muted/20 p-3 space-y-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-xs text-muted-foreground border-b">
                                <th className="text-left py-1 font-medium">Type</th>
                                <th className="text-left py-1 font-medium">Item</th>
                                <th className="text-right py-1 font-medium">Qty</th>
                                <th className="text-right py-1 font-medium">Price</th>
                                <th className="text-right py-1 font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((line, i) => (
                                <tr key={i} className="border-b border-dashed last:border-0">
                                  <td className="py-1.5 flex items-center gap-1 text-xs">
                                    {typeIcon[line.type]}
                                    <span className="text-muted-foreground">{typeLabel[line.type] || line.type}</span>
                                  </td>
                                  <td className="py-1.5">{line.name}</td>
                                  <td className="py-1.5 text-right font-number">{line.qty}</td>
                                  <td className="py-1.5 text-right font-number">{formatPrice(line.price)}</td>
                                  <td className="py-1.5 text-right font-number font-medium">{formatPrice(line.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="flex justify-between text-xs pt-1 border-t">
                            <span className="text-muted-foreground">Discount: <span className="font-number">{formatPrice(visit.discount)}</span></span>
                            <span className="font-semibold">Paid: <span className="font-number">{formatPrice(visit.paid)}</span> / Total: <span className="font-number">{formatPrice(visit.total)}</span></span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Aggregates: Top Services & Medicines */}
            {(overview.topServices.length > 0 || overview.topMedicines.length > 0) && (
              <>
                <Separator />
                <div className="grid md:grid-cols-2 gap-4">
                  {overview.topServices.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h5 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-4 h-4 text-blue-600" /> Top Services
                      </h5>
                      <div className="space-y-2">
                        {overview.topServices.map(([name, data]) => (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span className="truncate">{name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="secondary" className="text-[10px]">{data.count}x</Badge>
                              <span className="font-number font-medium">{formatPrice(data.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {overview.topMedicines.length > 0 && (
                    <div className="p-4 border rounded-lg">
                      <h5 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Medicines
                      </h5>
                      <div className="space-y-2">
                        {overview.topMedicines.map(([name, data]) => (
                          <div key={name} className="flex items-center justify-between text-sm">
                            <span className="truncate">{name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant="secondary" className="text-[10px]">{data.count}x</Badge>
                              <span className="font-number font-medium">{formatPrice(data.amount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
