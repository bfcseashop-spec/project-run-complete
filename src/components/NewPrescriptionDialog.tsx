import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus, Search, TestTube, X, Syringe, Stethoscope, ClipboardList, Activity } from "lucide-react";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { opdPatients } from "@/data/opdPatients";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { toast } from "sonner";
import { formatPrice, formatDualPrice } from "@/lib/currency";

initPatients(opdPatients);

const doctors = [
  "Dr. Sarah Smith", "Dr. Raj Patel", "Dr. Emily Williams",
  "Dr. Mark Brown", "Dr. Lisa Lee",
];

const medicineOptions = [
  "Amoxicillin 500mg", "Paracetamol 650mg", "Metformin 500mg",
  "Omeprazole 20mg", "Cetirizine 10mg", "Azithromycin 250mg",
  "Ibuprofen 400mg", "Prednisolone 5mg", "Glimepiride 2mg",
  "Diclofenac 50mg", "Pantoprazole 40mg", "Atorvastatin 10mg",
];

interface MedicineEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface InjectionEntry {
  name: string;
  dosage: string;
  route: string;
  frequency: string;
}

export interface SelectedTest {
  id: string;
  name: string;
  category: string;
  sampleType: string;
  price: number;
}

export interface PrescriptionFormData {
  patient: string;
  age: string;
  gender: string;
  doctor: string;
  notes: string;
  medicines: MedicineEntry[];
  injections: InjectionEntry[];
  tests: SelectedTest[];
  chiefComplaint: string;
  onExamination: string;
  advices: string;
  followUp: string;
}

interface NewPrescriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PrescriptionFormData) => void;
  editData?: PrescriptionFormData | null;
}

const emptyMedicine: MedicineEntry = { name: "", dosage: "", frequency: "", duration: "" };
const emptyInjection: InjectionEntry = { name: "", dosage: "", route: "", frequency: "" };

const defaultForm: PrescriptionFormData = {
  patient: "", age: "", gender: "", doctor: "", notes: "",
  medicines: [{ ...emptyMedicine }],
  injections: [],
  tests: [],
  chiefComplaint: "",
  onExamination: "",
  advices: "",
  followUp: "",
};

const NewPrescriptionDialog = ({ open, onOpenChange, onSubmit, editData }: NewPrescriptionDialogProps) => {
  const { activeTests } = useTestNameStore();
  const [form, setForm] = useState<PrescriptionFormData>({ ...defaultForm });
  const [patients, setPatients] = useState(getPatients());
  const [injectionInventory, setInjectionInventory] = useState(getInjections());
  const [testSearch, setTestSearch] = useState("");
  const [testCategoryFilter, setTestCategoryFilter] = useState("all");

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);
  useEffect(() => { const unsub = subscribeInjections(() => setInjectionInventory([...getInjections()])); return () => { unsub(); }; }, []);

  useEffect(() => {
    if (open && editData) {
      setForm({ ...defaultForm, ...editData, injections: editData.injections || [] });
    } else if (open && !editData) {
      setForm({ ...defaultForm, medicines: [{ ...emptyMedicine }], injections: [] });
    }
    setTestSearch("");
    setTestCategoryFilter("all");
  }, [open, editData]);

  const filteredTests = useMemo(() => {
    return activeTests.filter((t) => {
      const matchSearch = testSearch === "" || t.name.toLowerCase().includes(testSearch.toLowerCase());
      const matchCat = testCategoryFilter === "all" || t.category === testCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [activeTests, testSearch, testCategoryFilter]);

  const testCategories = useMemo(() => {
    return [...new Set(activeTests.map((t) => t.category))].sort();
  }, [activeTests]);

  const selectedTestIds = new Set(form.tests.map((t) => t.id));
  const totalTestPrice = form.tests.reduce((sum, t) => sum + t.price, 0);

  const toggleTest = (test: typeof activeTests[0]) => {
    if (selectedTestIds.has(test.id)) {
      setForm((f) => ({ ...f, tests: f.tests.filter((t) => t.id !== test.id) }));
    } else {
      setForm((f) => ({
        ...f,
        tests: [...f.tests, {
          id: test.id, name: test.name, category: test.category,
          sampleType: test.sampleType, price: test.price,
        }],
      }));
    }
  };

  const removeTest = (id: string) => {
    setForm((f) => ({ ...f, tests: f.tests.filter((t) => t.id !== id) }));
  };

  const selectAllFiltered = () => {
    const newTests = filteredTests
      .filter((t) => !selectedTestIds.has(t.id))
      .map((t) => ({ id: t.id, name: t.name, category: t.category, sampleType: t.sampleType, price: t.price }));
    setForm((f) => ({ ...f, tests: [...f.tests, ...newTests] }));
  };

  const clearAllTests = () => setForm((f) => ({ ...f, tests: [] }));

  const updateField = (field: keyof PrescriptionFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handlePatientSelect = (patientName: string) => {
    const patient = patients.find((p) => p.name === patientName);
    if (patient) {
      setForm((f) => ({
        ...f,
        patient: patient.name,
        age: String(patient.age),
        gender: patient.gender === "F" ? "Female" : patient.gender === "M" ? "Male" : "Other",
      }));
    }
  };

  const updateMedicine = (index: number, field: keyof MedicineEntry, value: string) =>
    setForm((f) => ({
      ...f,
      medicines: f.medicines.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    }));

  const addMedicine = () =>
    setForm((f) => ({ ...f, medicines: [...f.medicines, { ...emptyMedicine }] }));

  const removeMedicine = (index: number) =>
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== index) }));

  const updateInjection = (index: number, field: keyof InjectionEntry, value: string) =>
    setForm((f) => ({
      ...f,
      injections: f.injections.map((inj, i) => (i === index ? { ...inj, [field]: value } : inj)),
    }));

  const addInjection = () =>
    setForm((f) => ({ ...f, injections: [...f.injections, { ...emptyInjection }] }));

  const removeInjection = (index: number) =>
    setForm((f) => ({ ...f, injections: f.injections.filter((_, i) => i !== index) }));

  const handleSubmit = () => {
    if (!form.patient) { toast.error("Please select a patient"); return; }
    if (!form.doctor) { toast.error("Please select a doctor"); return; }
    const hasInjections = form.injections.some((inj) => inj.name);
    if (form.medicines.every((m) => !m.name) && form.tests.length === 0 && !hasInjections) {
      toast.error("Please add at least one medicine, injection, or test");
      return;
    }
    onSubmit(form);
  };

  const isEditing = !!editData;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header Bar - like a prescription pad header */}
        <div className="bg-primary/10 border-b border-primary/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              {isEditing ? "Edit Prescription" : "New Prescription"}
            </DialogTitle>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString()}
            </Badge>
          </div>

          {/* Patient & Doctor Bar */}
          <div className="grid grid-cols-5 gap-3 mt-4">
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Patient Name *</Label>
              <Select value={form.patient} onValueChange={handlePatientSelect}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} ({p.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Age</Label>
              <Input placeholder="Age" value={form.age} readOnly className="h-9 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <Input placeholder="Gender" value={form.gender} readOnly className="h-9 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Doctor *</Label>
              <Select value={form.doctor} onValueChange={(v) => updateField("doctor", v)}>
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue placeholder="Select doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Two-Column Prescription Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[1fr_2px_1.4fr] min-h-full">
            {/* ======== LEFT COLUMN — Clinical Findings ======== */}
            <div className="p-5 space-y-4">
              {/* Chief Complaint */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5 mb-1.5">
                  <ClipboardList className="w-3.5 h-3.5" /> Chief Complaint
                </Label>
                <Textarea
                  placeholder="e.g. LBP (Low Back Pain), Shoulder pain, Morning stiffness..."
                  rows={3}
                  value={form.chiefComplaint}
                  onChange={(e) => updateField("chiefComplaint", e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* On Examination */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5 mb-1.5">
                  <Activity className="w-3.5 h-3.5" /> On Examination
                </Label>
                <Textarea
                  placeholder="e.g. BP: 120/80 mmHg, Weight: 52 kg, SLR, Sensory..."
                  rows={3}
                  value={form.onExamination}
                  onChange={(e) => updateField("onExamination", e.target.value)}
                  className="text-sm"
                />
              </div>


              {/* Prescribed Tests */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-primary flex items-center gap-1.5">
                    <TestTube className="w-3.5 h-3.5" /> Prescribed Tests
                    {form.tests.length > 0 && (
                      <Badge variant="default" className="ml-1 text-[10px] h-4 px-1.5">{form.tests.length}</Badge>
                    )}
                  </Label>
                  {form.tests.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive text-[10px] h-6 px-2" onClick={clearAllTests}>
                      Clear
                    </Button>
                  )}
                </div>

                {form.tests.length > 0 && (
                  <div className="mb-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold">{form.tests.length} test(s)</span>
                      <span className="text-xs font-bold text-primary">{formatDualPrice(totalTestPrice)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {form.tests.map((t) => (
                        <Badge key={t.id} variant="secondary" className="pl-1.5 pr-0.5 py-0.5 flex items-center gap-0.5 text-[10px]">
                          {t.name}
                          <button type="button" onClick={() => removeTest(t.id)} className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-md border border-border overflow-hidden">
                  <div className="flex items-center gap-1.5 p-1.5 border-b border-border bg-muted/30">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1.5 h-3 w-3 text-muted-foreground" />
                      <Input placeholder="Search tests..." value={testSearch} onChange={(e) => setTestSearch(e.target.value)} className="pl-6 h-6 text-xs" />
                    </div>
                    <Select value={testCategoryFilter} onValueChange={setTestCategoryFilter}>
                      <SelectTrigger className="w-[100px] h-6 text-[10px]"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {testCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={selectAllFiltered}>
                      All
                    </Button>
                  </div>
                  <ScrollArea className="h-[120px]">
                    <div className="divide-y divide-border">
                      {filteredTests.map((test) => {
                        const isSelected = selectedTestIds.has(test.id);
                        return (
                          <label key={test.id} className={`flex items-center gap-2 px-2 py-1 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleTest(test)} className="h-3.5 w-3.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{test.name}</p>
                              <p className="text-[10px] text-muted-foreground">{test.category}</p>
                            </div>
                            <span className="text-[10px] tabular-nums text-muted-foreground">{formatDualPrice(test.price)}</span>
                          </label>
                        );
                      })}
                      {filteredTests.length === 0 && (
                        <div className="py-4 text-center text-xs text-muted-foreground">No tests found</div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="bg-border" />

            {/* ======== RIGHT COLUMN — Rx (Medicines, Injections, Advices, Follow-up) ======== */}
            <div className="p-5 space-y-5">
              {/* Rx Header */}
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl font-serif font-bold text-primary italic">℞</span>
                <Separator className="flex-1" />
              </div>

              {/* Medicines */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-foreground">Medicines</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addMedicine}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.medicines.map((med, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-xs font-bold text-primary mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
                      <div className="flex-1 grid grid-cols-[1.2fr_0.6fr_0.7fr_0.6fr] gap-1.5">
                        {i === 0 && (
                          <>
                            <Label className="text-[10px] text-muted-foreground">Medicine</Label>
                            <Label className="text-[10px] text-muted-foreground">Dosage</Label>
                            <Label className="text-[10px] text-muted-foreground">Frequency</Label>
                            <Label className="text-[10px] text-muted-foreground">Duration</Label>
                          </>
                        )}
                        <Select value={med.name} onValueChange={(v) => updateMedicine(i, "name", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                          <SelectContent>
                            {medicineOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input placeholder="e.g. 1 tab" value={med.dosage} onChange={(e) => updateMedicine(i, "dosage", e.target.value)} className="h-8 text-xs" />
                        <Select value={med.frequency} onValueChange={(v) => updateMedicine(i, "frequency", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Freq." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Once daily">Once daily</SelectItem>
                            <SelectItem value="Twice daily">Twice daily</SelectItem>
                            <SelectItem value="Thrice daily">Thrice daily</SelectItem>
                            <SelectItem value="As needed">As needed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="e.g. 5 days" value={med.duration} onChange={(e) => updateMedicine(i, "duration", e.target.value)} className="h-8 text-xs" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeMedicine(i)} disabled={form.medicines.length === 1}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Injections */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs font-bold uppercase tracking-wide text-foreground flex items-center gap-1.5">
                    <Syringe className="w-3.5 h-3.5 text-primary" /> Injections
                    {form.injections.filter((inj) => inj.name).length > 0 && (
                      <Badge variant="default" className="ml-1 text-[10px] h-4 px-1.5">{form.injections.filter((inj) => inj.name).length}</Badge>
                    )}
                  </Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addInjection}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>
                {form.injections.length > 0 ? (
                  <div className="space-y-2">
                    {form.injections.map((inj, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs font-bold text-primary mt-2.5 w-5 flex-shrink-0">{i + 1}.</span>
                        <div className="flex-1 grid grid-cols-[1.2fr_0.6fr_0.6fr_0.7fr] gap-1.5">
                          {i === 0 && (
                            <>
                              <Label className="text-[10px] text-muted-foreground">Injection</Label>
                              <Label className="text-[10px] text-muted-foreground">Dosage</Label>
                              <Label className="text-[10px] text-muted-foreground">Route</Label>
                              <Label className="text-[10px] text-muted-foreground">Frequency</Label>
                            </>
                          )}
                          <Select value={inj.name} onValueChange={(v) => {
                            const inv = injectionInventory.find((item) => `${item.name} ${item.strength}` === v);
                            updateInjection(i, "name", v);
                            if (inv) updateInjection(i, "route", inv.route);
                          }}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select injection" /></SelectTrigger>
                            <SelectContent>
                              {injectionInventory.filter((item) => item.stock > 0).map((item) => (
                                <SelectItem key={item.id} value={`${item.name} ${item.strength}`}>
                                  {item.name} {item.strength} ({item.stock} {item.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input placeholder="e.g. 1 vial" value={inj.dosage} onChange={(e) => updateInjection(i, "dosage", e.target.value)} className="h-8 text-xs" />
                          <Select value={inj.route} onValueChange={(v) => updateInjection(i, "route", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Route" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="IV">IV</SelectItem>
                              <SelectItem value="IM">IM</SelectItem>
                              <SelectItem value="SC">SC</SelectItem>
                              <SelectItem value="ID">ID</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={inj.frequency} onValueChange={(v) => updateInjection(i, "frequency", v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Freq." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Once daily">Once daily</SelectItem>
                              <SelectItem value="Twice daily">Twice daily</SelectItem>
                              <SelectItem value="Stat (once)">Stat (once)</SelectItem>
                              <SelectItem value="As needed">As needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0" onClick={() => removeInjection(i)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">Click "Add" to prescribe injections.</p>
                )}
              </div>

              <Separator />

              {/* Advices */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Advices</Label>
                <Textarea
                  placeholder="e.g. Exercise regularly, Apply hot water bag, Avoid heavy lifting..."
                  rows={3}
                  value={form.advices}
                  onChange={(e) => updateField("advices", e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Follow-up */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-foreground mb-1.5 block">Follow-up</Label>
                <Textarea
                  placeholder="e.g. After 1 month — bring test reports, come if pain increases..."
                  rows={2}
                  value={form.followUp}
                  onChange={(e) => updateField("followUp", e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Additional Notes */}
              <div>
                <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1.5 block">Additional Notes</Label>
                <Textarea
                  placeholder="Any other instructions..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-3 flex items-center justify-end gap-3 bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? "Update Prescription" : "Create Prescription"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewPrescriptionDialog;
