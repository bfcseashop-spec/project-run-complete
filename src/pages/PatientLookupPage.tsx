import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, User, Phone, Hash, Calendar, Activity,
  Stethoscope, Pill, Syringe, FileText, DollarSign,
  CreditCard, ChevronDown, ChevronUp, Download, Printer,
  TrendingUp, ClipboardList,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getPatients, subscribe } from "@/data/patientStore";
import { getBillingRecords, subscribeBilling, type BillingRecord } from "@/data/billingStore";
import { getLabReports, subscribeLabReports } from "@/data/labReportStore";
import { getPrescriptions, subscribePrescriptions } from "@/data/prescriptionStore";
import type { OPDPatient } from "@/data/opdPatients";
import { formatPrice } from "@/lib/currency";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

const typeLabel: Record<string, string> = { SVC: "Service", MED: "Medicine", INJ: "Injection", PKG: "Package", CUSTOM: "Custom" };
const typeIcon: Record<string, React.ReactNode> = {
  SVC: <Stethoscope className="w-3.5 h-3.5" />,
  MED: <Pill className="w-3.5 h-3.5" />,
  INJ: <Syringe className="w-3.5 h-3.5" />,
  PKG: <FileText className="w-3.5 h-3.5" />,
};

const fmt = (d: string) => { try { return format(parseISO(d), "dd MMM yyyy"); } catch { return d; } };

const PatientLookupPage = () => {
  const [patients, setPatients] = useState(getPatients());
  const [billing, setBilling] = useState(getBillingRecords());
  const [labReports, setLabReports] = useState(getLabReports());
  const [prescriptions, setPrescriptions] = useState(getPrescriptions());
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<OPDPatient | null>(null);
  const [filterProvider, setFilterProvider] = useState("all");
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  useEffect(() => {
    const unsub1 = subscribe(() => setPatients([...getPatients()]));
    const unsub2 = subscribeBilling(() => setBilling([...getBillingRecords()]));
    const unsub3 = subscribeLabReports(() => setLabReports([...getLabReports()]));
    const unsub4 = subscribePrescriptions(() => setPrescriptions([...getPrescriptions()]));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return patients
      .filter((p) => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.phone || "").includes(q))
      .slice(0, 20);
  }, [patients, search]);

  // Visit history for selected patient
  const visits = useMemo(() => {
    if (!selectedPatient) return [];
    return billing
      .filter((r) => r.patient === selectedPatient.name)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedPatient, billing]);

  const patientLabReports = useMemo(() => {
    if (!selectedPatient) return [];
    return labReports.filter((r) => r.patientId === selectedPatient.id || r.patient === selectedPatient.name);
  }, [selectedPatient, labReports]);

  const patientPrescriptions = useMemo(() => {
    if (!selectedPatient) return [];
    return prescriptions.filter((r) => r.patientId === selectedPatient.id || r.patient === selectedPatient.name);
  }, [selectedPatient, prescriptions]);

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
    visits.forEach((v) => {
      totalBilled += v.total;
      totalPaid += v.paid;
      v.formData?.lineItems?.forEach((li) => {
        if (li.type === "SVC") totalServices++;
        if (li.type === "MED") totalMedicines++;
        if (li.type === "INJ") totalInjections++;
      });
    });
    return { totalServices, totalMedicines, totalInjections, totalBilled, totalPaid, outstanding: totalBilled - totalPaid };
  }, [visits]);

  const getVisitLines = (record: BillingRecord) => {
    return (record.formData?.lineItems || []).map((li) => ({
      type: li.type, name: li.name, qty: li.qty, price: li.price, total: li.price * li.qty,
    }));
  };

  const handleExportPDF = () => {
    if (!selectedPatient) return;
    const cols = [
      { key: "date", header: "Date" }, { key: "id", header: "Visit ID" },
      { key: "doctor", header: "Provider" }, { key: "service", header: "Services" },
      { key: "total", header: "Total" }, { key: "paid", header: "Paid" },
      { key: "due", header: "Due" },
    ];
    const rows = filtered.map((v) => ({
      date: v.date, id: v.id, doctor: v.formData?.doctor || "—",
      service: v.service, total: formatPrice(v.total), paid: formatPrice(v.paid), due: formatPrice(v.due),
    }));
    exportToPDF(rows as unknown as Record<string, unknown>[], cols, `Patient History - ${selectedPatient.name}`);
  };

  const handleExportExcel = () => {
    if (!selectedPatient) return;
    const cols = [
      { key: "date", header: "Date" }, { key: "id", header: "Visit ID" },
      { key: "doctor", header: "Provider" }, { key: "service", header: "Services" },
      { key: "total", header: "Total" }, { key: "paid", header: "Paid" },
      { key: "due", header: "Due" },
    ];
    const rows = filtered.map((v) => ({
      date: v.date, id: v.id, doctor: v.formData?.doctor || "—",
      service: v.service, total: v.total, paid: v.paid, due: v.due,
    }));
    exportToExcel(rows as unknown as Record<string, unknown>[], cols, `Patient_History_${selectedPatient.name.replace(/\s/g, "_")}`);
  };

  const firstVisit = visits.length > 0 ? fmt(visits[visits.length - 1].date) : "—";
  const lastVisit = visits.length > 0 ? fmt(visits[0].date) : "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Patient Lookup" description="Search patients by OPD ID, name, or phone and view full history">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground font-medium">{patients.length} Registered Patients</span>
        </div>
      </PageHeader>

      {/* Search Bar */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by OPD ID (e.g. OPD-058), patient name, or phone number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedPatient(null); }}
              className="pl-10 h-12 text-base"
              autoFocus
            />
          </div>

          {/* Search Results Dropdown */}
          {search.trim() && !selectedPatient && (
            <div className="mt-3 border rounded-lg divide-y max-h-[300px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No patients found matching "{search}"</p>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                    onClick={() => { setSelectedPatient(p); setSearch(p.id); setFilterProvider("all"); setExpandedVisit(null); }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.photo ? <img src={p.photo} alt={p.name} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-3">
                        <span className="font-mono">{p.id}</span>
                        <span>{p.age} / {p.gender}</span>
                        {p.phone && <span>{p.phone}</span>}
                      </div>
                    </div>
                    {p.patientType && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">{p.patientType}</Badge>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Patient Profile & History */}
      {selectedPatient && (
        <div className="space-y-5 animate-in fade-in-50 duration-300">
          {/* Patient Profile Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden border-2 border-primary/20">
                  {selectedPatient.photo ? (
                    <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-mono"><Hash className="w-3.5 h-3.5" />{selectedPatient.id}</span>
                    <span>{selectedPatient.age} Yrs / {selectedPatient.gender}</span>
                    {selectedPatient.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{selectedPatient.phone}</span>}
                    {selectedPatient.bloodType && <Badge variant="outline" className="text-xs">{selectedPatient.bloodType}</Badge>}
                    {selectedPatient.patientType && <Badge className="text-xs">{selectedPatient.patientType}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />First Visit: {firstVisit}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Last Visit: {lastVisit}</span>
                    {selectedPatient.complaint && <span>Chief Complaint: <span className="text-foreground font-medium">{selectedPatient.complaint}</span></span>}
                    {selectedPatient.doctor && <span>Doctor: <span className="text-foreground font-medium">{selectedPatient.doctor}</span></span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
            {[
              { label: "Visits", value: visits.length, icon: Activity, color: "text-primary" },
              { label: "Lab Reports", value: patientLabReports.length, icon: FileText, color: "text-blue-600" },
              { label: "Prescriptions", value: patientPrescriptions.length, icon: ClipboardList, color: "text-violet-600" },
              { label: "Services", value: overview.totalServices, icon: Stethoscope, color: "text-teal-600" },
              { label: "Medicines", value: overview.totalMedicines, icon: Pill, color: "text-emerald-600" },
              { label: "Total Billed", value: formatPrice(overview.totalBilled), icon: DollarSign, color: "text-primary" },
              { label: "Outstanding", value: formatPrice(overview.outstanding), icon: CreditCard, color: overview.outstanding > 0 ? "text-destructive" : "text-emerald-600" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="p-3">
                  <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                  <div className="font-number text-lg font-bold">{stat.value}</div>
                  <div className="text-[11px] text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Visit History */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Billing History ({filtered.length})
                </h3>
                <div className="flex-1" />
                <Select value={filterProvider} onValueChange={setFilterProvider}>
                  <SelectTrigger className="w-[180px] h-8 text-xs">
                    <SelectValue placeholder="Filter by provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportExcel}>
                  <Download className="w-3.5 h-3.5 mr-1" />Excel
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleExportPDF}>
                  <Printer className="w-3.5 h-3.5 mr-1" />PDF
                </Button>
              </div>

              <Separator />

              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No billing records found for this patient.</p>
              ) : (
                <div className="space-y-2">
                  {filtered.map((visit) => {
                    const isExpanded = expandedVisit === visit.id;
                    const lines = getVisitLines(visit);
                    return (
                      <div key={visit.id} className="border rounded-lg overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
                          onClick={() => setExpandedVisit(isExpanded ? null : visit.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="text-xs text-muted-foreground font-mono w-[5.5rem] shrink-0">{fmt(visit.date)}</div>
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
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lab Reports & Prescriptions Summary */}
          {(patientLabReports.length > 0 || patientPrescriptions.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {patientLabReports.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-600" /> Lab Reports ({patientLabReports.length})
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {patientLabReports.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm border-b border-dashed last:border-0 pb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline" className="text-[10px] shrink-0">{r.id}</Badge>
                            <span className="truncate">{r.testName || r.category}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{fmt(r.date)}</span>
                            <Badge variant={r.status === "completed" ? "default" : "secondary"} className="text-[10px]">{r.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {patientPrescriptions.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
                      <TrendingUp className="w-4 h-4 text-violet-600" /> Prescriptions ({patientPrescriptions.length})
                    </h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {patientPrescriptions.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm border-b border-dashed last:border-0 pb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant="outline" className="text-[10px] shrink-0">{r.id}</Badge>
                            <span className="truncate">{r.doctor}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground">{fmt(r.date)}</span>
                            <span className="text-xs">{r.chiefComplaint}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!search.trim() && !selectedPatient && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary/60" />
          </div>
          <h3 className="text-lg font-semibold text-muted-foreground">Search for a Patient</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Enter an OPD ID (e.g. OPD-058), patient name, or phone number to view their complete visit history, lab reports, and prescriptions.
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientLookupPage;
