import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState, useMemo, useSyncExternalStore } from "react";
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
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { sampleTypes, priorityLevels, technicians, type LabTest } from "@/data/labTests";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { getPatients, subscribe as subscribePatients } from "@/data/patientStore";
import { toast } from "sonner";

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

  const doctors = useMemo(() => {
    const set = new Set(patients.map((p) => p.doctor).filter(Boolean));
    return Array.from(set).sort();
  }, [patients]);

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

  const [tests, setTests] = useState<TestEntry[]>([
    { id: entryCounter++, mode: "auto", test: "", sampleType: "blood", normalRange: "", unit: "", price: 0 },
  ]);

  const addTest = () => {
    setTests([...tests, { id: entryCounter++, mode: "auto", test: "", sampleType: "blood", normalRange: "", unit: "", price: 0 }]);
  };

  const removeTest = (id: number) => {
    if (tests.length <= 1) return;
    setTests(tests.filter((t) => t.id !== id));
  };

  const updateTest = (id: number, patch: Partial<TestEntry>) => {
    setTests(tests.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleAutoSelect = (id: number, testName: string) => {
    const entry = findByName(testName);
    if (entry) {
      updateTest(id, {
        test: testName,
        sampleType: (entry.sampleType as LabTest["sampleType"]) || "blood",
        normalRange: entry.normalRange,
        unit: entry.unit,
        price: entry.price,
      });
    } else {
      updateTest(id, { test: testName });
    }
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
    toast.success(`${validTests.length} test(s) ordered successfully for ${form.patient}`);
    navigate("/lab-tests");
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
                  <Button type="button" variant="outline" size="sm" onClick={addTest}>
                    <Plus className="w-4 h-4 mr-1" /> Add Test
                  </Button>
                </div>

                <div className="space-y-4">
                  {tests.map((t, idx) => (
                    <div key={t.id} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Test #{idx + 1}</span>
                        <div className="flex items-center gap-2">
                          {/* Mode toggle */}
                          <div className="flex rounded-md border border-input overflow-hidden text-xs">
                            <button
                              type="button"
                              className={`px-3 py-1 transition-colors ${t.mode === "auto" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent"}`}
                              onClick={() => updateTest(t.id, { mode: "auto", test: "", normalRange: "", unit: "", price: 0 })}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1 transition-colors ${t.mode === "manual" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-accent"}`}
                              onClick={() => updateTest(t.id, { mode: "manual", test: "", normalRange: "", unit: "", price: 0 })}
                            >
                              Manual
                            </button>
                          </div>
                          {tests.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeTest(t.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Test Name <span className="text-destructive">*</span></Label>
                          {t.mode === "auto" ? (
                            <Select value={t.test} onValueChange={(v) => handleAutoSelect(t.id, v)}>
                              <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                              <SelectContent>
                                {activeTests.map((at) => (
                                  <SelectItem key={at.id} value={at.name}>
                                    {at.name} — {formatDualPrice(at.price)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={t.test}
                              onChange={(e) => updateTest(t.id, { test: e.target.value })}
                              placeholder="Enter test name"
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Sample Type</Label>
                          <Select value={t.sampleType} onValueChange={(v) => updateTest(t.id, { sampleType: v as LabTest["sampleType"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Normal Range</Label>
                          <Input value={t.normalRange} onChange={(e) => updateTest(t.id, { normalRange: e.target.value })} placeholder="e.g. 70-100" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Unit</Label>
                          <Input value={t.unit} onChange={(e) => updateTest(t.id, { unit: e.target.value })} placeholder="e.g. mg/dL" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input type="number" value={t.price || ""} onChange={(e) => updateTest(t.id, { price: Number(e.target.value) || 0 })} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                {tests.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <div className="text-sm font-semibold text-foreground bg-muted px-4 py-2 rounded-md">
                      Total: {formatDualPrice(totalPrice)}
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
