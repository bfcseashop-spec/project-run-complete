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
import { Trash2, Plus, Search, TestTube, X, Syringe } from "lucide-react";
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
      setForm({ ...editData, injections: editData.injections || [] });
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

  // Injection handlers
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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {isEditing ? "Edit Prescription" : "New Prescription"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Patient Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Patient Information</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <Label>Patient Name *</Label>
                <Select value={form.patient} onValueChange={handlePatientSelect}>
                  <SelectTrigger>
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
                <Label>Age</Label>
                <Input placeholder="e.g. 34" value={form.age} readOnly className="bg-muted/50" />
              </div>
              <div>
                <Label>Gender</Label>
                <Input placeholder="Gender" value={form.gender} readOnly className="bg-muted/50" />
              </div>
            </div>
          </div>

          {/* Doctor */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Clinical Details</h3>
            <div>
              <Label>Doctor *</Label>
              <Select value={form.doctor} onValueChange={(v) => updateField("doctor", v)}>
                <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ========== PRESCRIBED TESTS ========== */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TestTube className="w-4 h-4 text-primary" />
                Prescribed Tests
                {form.tests.length > 0 && (
                  <Badge variant="default" className="ml-1">{form.tests.length}</Badge>
                )}
              </h3>
              {form.tests.length > 0 && (
                <Button type="button" variant="ghost" size="sm" className="text-destructive text-xs" onClick={clearAllTests}>
                  Clear All
                </Button>
              )}
            </div>

            {form.tests.length > 0 && (
              <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-foreground">
                    {form.tests.length} test{form.tests.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-sm font-bold text-primary">Total: {formatDualPrice(totalTestPrice)}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {form.tests.map((t) => (
                    <Badge key={t.id} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1 text-xs">
                      {t.name}
                      <span className="text-muted-foreground ml-0.5">{formatDualPrice(t.price)}</span>
                      <button type="button" onClick={() => removeTest(t.id)} className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border">
              <div className="flex items-center gap-2 p-2 border-b border-border bg-muted/30">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder="Search tests..." value={testSearch} onChange={(e) => setTestSearch(e.target.value)} className="pl-8 h-8 text-sm" />
                </div>
                <Select value={testCategoryFilter} onValueChange={setTestCategoryFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {testCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={selectAllFiltered}>
                  Select All
                </Button>
              </div>
              <ScrollArea className="h-[180px]">
                <div className="divide-y divide-border">
                  {filteredTests.map((test) => {
                    const isSelected = selectedTestIds.has(test.id);
                    return (
                      <label key={test.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "bg-primary/5" : ""}`}>
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleTest(test)} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isSelected ? "font-medium text-foreground" : "text-foreground"}`}>{test.name}</p>
                          <p className="text-xs text-muted-foreground">{test.category} · {test.sampleType}</p>
                        </div>
                        <span className={`text-xs font-medium tabular-nums ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{formatDualPrice(test.price)}</span>
                      </label>
                    );
                  })}
                  {filteredTests.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">No tests found</div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Medicines</h3>
              <Button type="button" variant="outline" size="sm" onClick={addMedicine}>
                <Plus className="w-3 h-3 mr-1" /> Add Medicine
              </Button>
            </div>
            <div className="space-y-3">
              {form.medicines.map((med, i) => (
                <div key={i} className="grid grid-cols-[1fr_0.6fr_0.6fr_0.6fr_auto] gap-2 items-end">
                  <div>
                    {i === 0 && <Label className="text-xs">Medicine</Label>}
                    <Select value={med.name} onValueChange={(v) => updateMedicine(i, "name", v)}>
                      <SelectTrigger><SelectValue placeholder="Select medicine" /></SelectTrigger>
                      <SelectContent>
                        {medicineOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">Dosage</Label>}
                    <Input placeholder="e.g. 1 tab" value={med.dosage} onChange={(e) => updateMedicine(i, "dosage", e.target.value)} />
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">Frequency</Label>}
                    <Select value={med.frequency} onValueChange={(v) => updateMedicine(i, "frequency", v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Once daily">Once daily</SelectItem>
                        <SelectItem value="Twice daily">Twice daily</SelectItem>
                        <SelectItem value="Thrice daily">Thrice daily</SelectItem>
                        <SelectItem value="As needed">As needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {i === 0 && <Label className="text-xs">Duration</Label>}
                    <Input placeholder="e.g. 5 days" value={med.duration} onChange={(e) => updateMedicine(i, "duration", e.target.value)} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeMedicine(i)} disabled={form.medicines.length === 1}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Injections */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Syringe className="w-4 h-4 text-primary" />
                Injections
                {form.injections.filter((inj) => inj.name).length > 0 && (
                  <Badge variant="default" className="ml-1">{form.injections.filter((inj) => inj.name).length}</Badge>
                )}
              </h3>
              <Button type="button" variant="outline" size="sm" onClick={addInjection}>
                <Plus className="w-3 h-3 mr-1" /> Add Injection
              </Button>
            </div>
            {form.injections.length > 0 && (
              <div className="space-y-3">
                {form.injections.map((inj, i) => (
                  <div key={i} className="grid grid-cols-[1fr_0.6fr_0.6fr_0.6fr_auto] gap-2 items-end">
                    <div>
                      {i === 0 && <Label className="text-xs">Injection</Label>}
                      <Select value={inj.name} onValueChange={(v) => {
                        const inv = injectionInventory.find((item) => `${item.name} ${item.strength}` === v);
                        updateInjection(i, "name", v);
                        if (inv) updateInjection(i, "route", inv.route);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select injection" /></SelectTrigger>
                        <SelectContent>
                          {injectionInventory.filter((item) => item.stock > 0).map((item) => (
                            <SelectItem key={item.id} value={`${item.name} ${item.strength}`}>
                              {item.name} {item.strength} ({item.stock} {item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs">Dosage</Label>}
                      <Input placeholder="e.g. 1 vial" value={inj.dosage} onChange={(e) => updateInjection(i, "dosage", e.target.value)} />
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs">Route</Label>}
                      <Select value={inj.route} onValueChange={(v) => updateInjection(i, "route", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IV">IV (Intravenous)</SelectItem>
                          <SelectItem value="IM">IM (Intramuscular)</SelectItem>
                          <SelectItem value="SC">SC (Subcutaneous)</SelectItem>
                          <SelectItem value="ID">ID (Intradermal)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      {i === 0 && <Label className="text-xs">Frequency</Label>}
                      <Select value={inj.frequency} onValueChange={(v) => updateInjection(i, "frequency", v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Once daily">Once daily</SelectItem>
                          <SelectItem value="Twice daily">Twice daily</SelectItem>
                          <SelectItem value="Stat (once)">Stat (once)</SelectItem>
                          <SelectItem value="As needed">As needed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeInjection(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {form.injections.length === 0 && (
              <p className="text-xs text-muted-foreground italic">No injections added. Click "Add Injection" to prescribe one.</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label>Additional Notes</Label>
            <Textarea placeholder="Instructions, follow-up advice..." rows={3} value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEditing ? "Update Prescription" : "Create Prescription"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewPrescriptionDialog;
