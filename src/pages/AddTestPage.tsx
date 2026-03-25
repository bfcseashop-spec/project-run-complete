import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useMemo, useSyncExternalStore } from "react";
import { addSampleRecords } from "@/data/sampleStore";
import { getActiveDoctorNames, subscribeDoctors } from "@/data/doctorStore";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2, Check, Search } from "lucide-react";
import { sampleTypes, priorityLevels, type LabTest } from "@/data/labTests";
import { getTechnicians, subscribeTechnicians } from "@/data/technicianStore";
import ManageTechniciansDialog from "@/components/ManageTechniciansDialog";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface TestEntry {
  id: number;
  mode: "auto" | "manual";
  test: string;
  sampleType: LabTest["sampleType"];
  normalRange: string;
  unit: string;
  price: number;
}

let entryCounter = 1;

const AddTestPage = () => {
  useSettings();
  const navigate = useNavigate();
  const { activeTests, findByName } = useTestNameStore();
  const patients = useSyncExternalStore(subscribePatients, getPatients);

  const technicians = useSyncExternalStore(subscribeTechnicians, getTechnicians);

  const [form, setForm] = useState({
    patient: "", patientId: "", age: "", gender: "Male" as LabTest["gender"],
    doctor: "", date: new Date().toISOString().split("T")[0],
    priority: "routine" as LabTest["priority"],
    technicianAssigned: "",
    notes: "",
  });

  const handlePatientSelect = (patientId: string) => {
    const p = patients.find((pt) => pt.id === patientId);
    if (p) {
      setForm({
        ...form,
        patient: p.name,
        patientId: p.id,
        age: String(p.age),
        gender: (p.gender === "F" ? "Female" : p.gender === "M" ? "Male" : p.gender) as LabTest["gender"],
        doctor: p.doctor,
      });
    }
  };

  const [tests, setTests] = useState<TestEntry[]>([]);
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [multiSearch, setMultiSearch] = useState("");

  const selectedTestNames = useMemo(() => new Set(tests.filter(t => t.mode === "auto").map(t => t.test)), [tests]);

  const filteredTests = useMemo(() => {
    if (!multiSearch) return activeTests;
    const q = multiSearch.toLowerCase();
    return activeTests.filter(t => t.name.toLowerCase().includes(q));
  }, [activeTests, multiSearch]);

  const toggleTestSelection = (testName: string) => {
    if (selectedTestNames.has(testName)) {
      setTests(prev => prev.filter(t => !(t.mode === "auto" && t.test === testName)));
    } else {
      const entry = findByName(testName);
      if (entry) {
        setTests(prev => [...prev, {
          id: entryCounter++,
          mode: "auto",
          test: testName,
          sampleType: (entry.sampleType as LabTest["sampleType"]) || "blood",
          normalRange: entry.normalRange,
          unit: entry.unit,
          price: entry.price,
        }]);
      }
    }
  };

  const addManualTest = () => {
    setTests([...tests, { id: entryCounter++, mode: "manual", test: "", sampleType: "blood", normalRange: "", unit: "", price: 0 }]);
  };

  const removeTest = (id: number) => {
    setTests(tests.filter((t) => t.id !== id));
  };

  const updateTest = (id: number, patch: Partial<TestEntry>) => {
    setTests(tests.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const totalPrice = tests.reduce((sum, t) => sum + (t.price || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.doctor) {
      toast.error("Please fill in patient name and referring doctor");
      return;
    }
    const validTests = tests.filter((t) => t.test.trim());
    if (validTests.length === 0) {
      toast.error("Please add at least one test");
      return;
    }

    const sampleEntries = validTests.map((t) => ({
      patient: form.patient,
      patientId: form.patientId,
      age: parseInt(form.age) || 0,
      gender: form.gender,
      testName: t.test,
      doctor: form.doctor,
      collectionDate: form.date,
      collectionTime: "",
      sampleType: t.sampleType,
      status: "pending" as const,
      priority: form.priority,
      collectedBy: form.technicianAssigned || "",
      storageTemp: "room" as const,
      barcode: "",
      rejectionReason: "",
      notes: form.notes,
    }));
    addSampleRecords(sampleEntries);

    toast.success(`${validTests.length} test(s) ordered — check Sample Collection for pickup`);
    navigate("/sample-collection");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Order New Test" description="Create a new lab test request with patient and sample details">
        <Button variant="outline" onClick={() => navigate("/lab-tests")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Test List
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patient + Tests */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-base font-semibold text-card-foreground font-heading">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Name <span className="text-destructive">*</span></Label>
                  <Select value={form.patientId} onValueChange={handlePatientSelect}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Patient ID</Label>
                  <Input value={form.patientId} readOnly className="bg-muted" placeholder="Auto-filled" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="Years" />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as LabTest["gender"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referring Doctor <span className="text-destructive">*</span></Label>
                  <Select value={form.doctor} onValueChange={(v) => setForm({ ...form, doctor: v })}>
                    <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tests Section */}
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-card-foreground font-heading">
                    Tests ({tests.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={addManualTest}>
                      <Plus className="w-4 h-4 mr-1" /> Manual Entry
                    </Button>
                  </div>
                </div>

                {/* Multi-select Test Name Picker */}
                <div className="mb-4 space-y-1.5">
                  <Label className="text-xs font-medium">Test Name <span className="text-destructive">*</span> — Select multiple tests</Label>
                  <Popover open={multiSelectOpen} onOpenChange={setMultiSelectOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left h-auto min-h-[40px] font-normal"
                      >
                        {selectedTestNames.size === 0 ? (
                          <span className="text-muted-foreground">Click to select tests...</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {Array.from(selectedTestNames).map(name => (
                              <Badge key={name} variant="secondary" className="text-xs gap-1">
                                {name}
                                <button
                                  type="button"
                                  className="ml-0.5 hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); toggleTestSelection(name); }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[460px] p-0" align="start">
                      <div className="p-2 border-b border-border">
                        <div className="flex items-center gap-2 px-2">
                          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Search tests..."
                            value={multiSearch}
                            onChange={(e) => setMultiSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-[240px] overflow-y-auto p-1">
                        {filteredTests.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No tests found</p>
                        ) : (
                          filteredTests.map(t => {
                            const isSelected = selectedTestNames.has(t.name);
                            return (
                              <button
                                key={t.id}
                                type="button"
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                                  isSelected ? "bg-primary/10 text-primary" : "hover:bg-accent"
                                }`}
                                onClick={() => toggleTestSelection(t.name)}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-primary border-primary" : "border-input"
                                }`}>
                                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                                </div>
                                <span className="flex-1 truncate">{t.name}</span>
                                <span className="text-xs text-muted-foreground">{formatPrice(t.price)}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                      {selectedTestNames.size > 0 && (
                        <div className="border-t border-border p-2 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{selectedTestNames.size} test(s) selected</span>
                          <Button type="button" size="sm" variant="ghost" className="text-xs h-7" onClick={() => setMultiSelectOpen(false)}>
                            Done
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Test Entry Cards */}
                <div className="space-y-4">
                  {tests.map((t, idx) => (
                    <div key={t.id} className="border border-border rounded-lg px-4 py-3 bg-muted/30 flex items-center gap-4">
                      <span className="text-xs font-medium text-muted-foreground shrink-0 w-14">#{idx + 1}</span>
                      <span className="text-sm font-medium text-foreground flex-1 truncate">{t.test || "—"}</span>
                      <span className="text-xs text-muted-foreground capitalize shrink-0">{t.sampleType}</span>
                      <span className="text-sm font-semibold text-foreground shrink-0 w-20 text-right">{formatPrice(t.price)}</span>
                      <Badge variant={t.mode === "auto" ? "default" : "outline"} className="text-[10px] h-5 shrink-0">
                        {t.mode === "auto" ? "Auto" : "Manual"}
                      </Badge>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removeTest(t.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>

                {tests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                    <p className="text-sm">No tests added yet. Select tests above or add a manual entry.</p>
                  </div>
                )}

                {/* Total */}
                {tests.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="text-sm font-semibold text-foreground bg-muted px-4 py-2 rounded-md">
                      Total: {formatPrice(totalPrice)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-base font-semibold text-card-foreground font-heading">Priority & Assignment</h3>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as LabTest["priority"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Technician</Label>
                  <Select value={form.technicianAssigned} onValueChange={(v) => setForm({ ...form, technicianAssigned: v })}>
                    <SelectTrigger><SelectValue placeholder="Select technician" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-base font-semibold text-card-foreground font-heading">Additional Notes</h3>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={4}
                  placeholder="Special instructions, clinical notes..."
                />
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                <Save className="w-4 h-4 mr-2" /> Order Test{tests.length > 1 ? "s" : ""}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/lab-tests")}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTestPage;
