import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { useState } from "react";
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
import { ArrowLeft, Save } from "lucide-react";
import { sampleTypes, priorityLevels, technicians, type LabTest } from "@/data/labTests";
import { useTestNameStore } from "@/hooks/use-test-name-store";
import { toast } from "sonner";

const AddTestPage = () => {
  useSettings();
  const navigate = useNavigate();
  const { activeTests, findByName } = useTestNameStore();
  const [form, setForm] = useState({
    patient: "", patientId: "", age: "", gender: "Male" as LabTest["gender"],
    test: "", doctor: "", date: new Date().toISOString().split("T")[0],
    priority: "routine" as LabTest["priority"],
    sampleType: "blood" as LabTest["sampleType"],
    technicianAssigned: "",
    normalRange: "", unit: "", notes: "",
  });

  const handleTestChange = (testName: string) => {
    const entry = findByName(testName);
    if (entry) {
      setForm({
        ...form,
        test: testName,
        sampleType: (entry.sampleType as LabTest["sampleType"]) || form.sampleType,
        normalRange: entry.normalRange,
        unit: entry.unit,
      });
    } else {
      setForm({ ...form, test: testName });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient || !form.test || !form.doctor) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Test ordered successfully for ${form.patient}`);
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
          <Card className="lg:col-span-2">
            <CardContent className="pt-6 space-y-6">
              <h3 className="text-base font-semibold text-card-foreground font-heading">Patient Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Patient Name <span className="text-destructive">*</span></Label>
                  <Input value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })} placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Patient ID</Label>
                  <Input value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} placeholder="P-XXX" />
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
                  <Input value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} placeholder="Dr." />
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="text-base font-semibold text-card-foreground font-heading mb-4">Test Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Name <span className="text-destructive">*</span></Label>
                    <Select value={form.test} onValueChange={handleTestChange}>
                      <SelectTrigger><SelectValue placeholder="Select test" /></SelectTrigger>
                      <SelectContent>
                        {activeTests.map((t) => (
                          <SelectItem key={t.id} value={t.name}>
                            {t.name} <span className="text-muted-foreground ml-1">— {formatDualPrice(t.price)}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Normal Range</Label>
                    <Input value={form.normalRange} onChange={(e) => setForm({ ...form, normalRange: e.target.value })} placeholder="e.g. 70-100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. mg/dL" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="text-base font-semibold text-card-foreground font-heading">Sample & Priority</h3>
                <div className="space-y-2">
                  <Label>Sample Type</Label>
                  <Select value={form.sampleType} onValueChange={(v) => setForm({ ...form, sampleType: v as LabTest["sampleType"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {sampleTypes.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
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
              <Button type="submit" className="flex-1" onClick={handleSubmit}>
                <Save className="w-4 h-4 mr-2" /> Order Test
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
