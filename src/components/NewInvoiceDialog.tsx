import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Hash, Calendar, User, Stethoscope, Briefcase, Syringe, Package,
  Tag, DollarSign, Percent, CreditCard, Printer, Receipt, Save, Pill,
  Plus, Barcode,
} from "lucide-react";
import { initPatients, getPatients, subscribe } from "@/data/patientStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { opdPatients } from "@/data/opdPatients";
import { toast } from "sonner";
import { formatDualPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { getSettings } from "@/data/settingsStore";

initPatients(opdPatients);

const serviceOptions = [
  "Consultation", "Lab Test", "X-Ray", "Ultrasound", "Health Checkup",
  "Minor Surgery", "Dressing", "ECG", "Vaccination", "Physiotherapy",
];

const packageOptions = [
  "Basic Health Checkup", "Full Body Checkup", "Diabetes Panel",
  "Cardiac Panel", "Prenatal Package",
];

const medicineOptions = [
  "Amoxicillin 500mg", "Paracetamol 650mg", "Metformin 500mg",
  "Omeprazole 20mg", "Cetirizine 10mg", "Azithromycin 250mg",
  "Ibuprofen 400mg", "Prednisolone 5mg", "Diclofenac 50mg",
  "Pantoprazole 40mg", "Atorvastatin 10mg",
];

const paymentMethods = [
  { value: "Cash", label: "Cash Pay", icon: DollarSign },
  { value: "Card", label: "Card Pay", icon: CreditCard },
  { value: "Mobile Pay", label: "Mobile Pay", icon: CreditCard },
  { value: "Bank Transfer", label: "Bank Transfer", icon: CreditCard },
  { value: "Insurance", label: "Insurance", icon: CreditCard },
];

const doctors = [
  "Dr. Sarah Smith", "Dr. Raj Patel", "Dr. Emily Williams",
  "Dr. Mark Brown", "Dr. Lisa Lee",
];

interface CustomItem {
  name: string;
  price: number;
  qty: number;
}

interface MedicineItem {
  name: string;
  qty: number;
}

export interface InvoiceFormData {
  patient: string;
  doctor: string;
  date: string;
  service: string;
  injection: string;
  packageItem: string;
  customItems: CustomItem[];
  medicines: MedicineItem[];
  discount: number;
  discountType: "flat" | "percent";
  paidAmount: number;
  paymentMethod: string;
}

interface NewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InvoiceFormData, action: "draft" | "print" | "payment") => void;
}

const NewInvoiceDialog = ({ open, onOpenChange, onSubmit }: NewInvoiceDialogProps) => {
  const { settings } = useSettings();
  const lang = settings.language;
  const appSettings = getSettings();

  const [patients, setPatients] = useState(getPatients());
  const [injections, setInjections] = useState(getInjections());

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState<InvoiceFormData>({
    patient: "", doctor: "", date: today,
    service: "", injection: "", packageItem: "",
    customItems: [],
    medicines: [],
    discount: 0, discountType: "flat",
    paidAmount: 0, paymentMethod: "Cash",
  });

  const [customDraft, setCustomDraft] = useState<CustomItem>({ name: "", price: 0, qty: 1 });
  const [medicineDraft, setMedicineDraft] = useState<MedicineItem>({ name: "", qty: 1 });

  useEffect(() => subscribe(() => setPatients([...getPatients()])), []);
  useEffect(() => { const unsub = subscribeInjections(() => setInjections([...getInjections()])); return () => { unsub(); }; }, []);

  useEffect(() => {
    if (open) {
      setForm({
        patient: "", doctor: "", date: today,
        service: "", injection: "", packageItem: "",
        customItems: [], medicines: [],
        discount: 0, discountType: "flat",
        paidAmount: 0, paymentMethod: "Cash",
      });
      setCustomDraft({ name: "", price: 0, qty: 1 });
      setMedicineDraft({ name: "", qty: 1 });
    }
  }, [open]);

  // Price lookups
  const servicePrice = form.service ? 100 : 0; // placeholder prices
  const injectionPrice = form.injection
    ? (injections.find((inj) => inj.name === form.injection)?.price || 0)
    : 0;
  const packagePrice = form.packageItem ? 500 : 0;
  const customTotal = form.customItems.reduce((s, c) => s + c.price * c.qty, 0);
  const medicineTotal = form.medicines.length * 50; // placeholder per-piece price

  const subtotal = servicePrice + injectionPrice + packagePrice + customTotal + medicineTotal;
  const discountAmount = form.discountType === "percent"
    ? (subtotal * form.discount) / 100
    : form.discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
  const taxAmount = (afterDiscount * taxRate) / 100;
  const grandTotal = afterDiscount + taxAmount;

  const addCustomItem = () => {
    if (!customDraft.name) return;
    setForm((f) => ({ ...f, customItems: [...f.customItems, { ...customDraft }] }));
    setCustomDraft({ name: "", price: 0, qty: 1 });
  };

  const addMedicine = () => {
    if (!medicineDraft.name) return;
    setForm((f) => ({ ...f, medicines: [...f.medicines, { ...medicineDraft }] }));
    setMedicineDraft({ name: "", qty: 1 });
  };

  const handleAction = (action: "draft" | "print" | "payment") => {
    if (!form.patient) { toast.error("Please select a patient"); return; }
    onSubmit(form, action);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-heading text-xl">Create Bill</DialogTitle>
          <p className="text-sm text-muted-foreground">Create and manage patient bills</p>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Invoice # + Date row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Invoice</span>
              <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded">Auto</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date" value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-[160px] h-9"
              />
            </div>
          </div>

          {/* Patient + Doctor row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                {t("patient", lang)} *
              </Label>
              <Select value={form.patient} onValueChange={(v) => setForm((f) => ({ ...f, patient: v }))}>
                <SelectTrigger><SelectValue placeholder={t("selectPatient", lang)} /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} ({p.id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-muted-foreground" />
                Doctor / Refer Name
              </Label>
              <Select value={form.doctor} onValueChange={(v) => setForm((f) => ({ ...f, doctor: v }))}>
                <SelectTrigger><SelectValue placeholder="Select or type doctor / refer name..." /></SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main 2-column: Left (Services/Injection/Packages/Custom) | Right (Medicines) */}
          <div className="grid grid-cols-2 gap-4">
            {/* LEFT COLUMN */}
            <div className="rounded-lg border border-border p-4 space-y-4">
              {/* Services */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  Services
                </Label>
                <Select value={form.service} onValueChange={(v) => setForm((f) => ({ ...f, service: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Service" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Injection */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Syringe className="w-3.5 h-3.5 text-primary" />
                  Injection
                </Label>
                <Select value={form.injection} onValueChange={(v) => setForm((f) => ({ ...f, injection: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Injection" /></SelectTrigger>
                  <SelectContent>
                    {injections.filter((inj) => inj.status !== "out-of-stock").map((inj) => (
                      <SelectItem key={inj.id} value={inj.name}>
                        {inj.name} {inj.strength} — {formatDualPrice(inj.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Packages */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Package className="w-3.5 h-3.5 text-primary" />
                  Packages
                </Label>
                <Select value={form.packageItem} onValueChange={(v) => setForm((f) => ({ ...f, packageItem: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
                  <SelectContent>
                    {packageOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Item */}
              <div>
                <Label className="flex items-center gap-1.5 mb-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" />
                  Custom Item
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Item name" value={customDraft.name}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    type="number" placeholder="Price" value={customDraft.price || ""}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, price: parseFloat(e.target.value) || 0 }))}
                    className="w-20"
                  />
                  <Input
                    type="number" min={1} value={customDraft.qty}
                    onChange={(e) => setCustomDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-16"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCustomItem} className="px-3">
                    Add
                  </Button>
                </div>
                {form.customItems.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {form.customItems.map((c, i) => (
                      <div key={i} className="flex justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                        <span>{c.name} × {c.qty}</span>
                        <span>{formatDualPrice(c.price * c.qty)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN — Medicines */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <Label className="flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-primary" />
                Medicines <span className="text-muted-foreground text-xs">(pieces)</span>
              </Label>

              {/* Barcode placeholder */}
              <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground bg-muted/30">
                <Barcode className="w-4 h-4" />
                <span>Scan barcode to add medicine</span>
              </div>

              {/* Medicine select + qty */}
              <div className="flex gap-2">
                <Select value={medicineDraft.name} onValueChange={(v) => setMedicineDraft((d) => ({ ...d, name: v }))}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select Medicine" /></SelectTrigger>
                  <SelectContent>
                    {medicineOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Qty</span>
                  <Input
                    type="number" min={1} value={medicineDraft.qty}
                    onChange={(e) => setMedicineDraft((d) => ({ ...d, qty: Math.max(1, parseInt(e.target.value) || 1) }))}
                    className="w-16"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addMedicine} className="px-3">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">Selling price per piece. Quantity is always in pieces.</p>

              {/* Added medicines list */}
              {form.medicines.length > 0 && (
                <div className="space-y-1 mt-2">
                  {form.medicines.map((m, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      <span>{m.name} × {m.qty}</span>
                      <span>{formatDualPrice(50 * m.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Discount + Payment Method row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Discount
              </Label>
              <div className="flex gap-1">
                <Input
                  type="number" min={0} value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0" className="flex-1"
                />
                <Button
                  type="button" size="sm"
                  variant={form.discountType === "flat" ? "default" : "outline"}
                  onClick={() => setForm((f) => ({ ...f, discountType: "flat" }))}
                  className="px-3"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button" size="sm"
                  variant={form.discountType === "percent" ? "default" : "outline"}
                  onClick={() => setForm((f) => ({ ...f, discountType: "percent" }))}
                  className="px-3"
                >
                  <Percent className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-primary" />
                Payment Method
              </Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className="flex items-center gap-2">
                        <m.icon className="w-3.5 h-3.5" /> {m.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-3">
                <Label className="text-sm mb-1.5 block">Amount Paid</Label>
                <Input
                  type="number" min={0} value={form.paidAmount}
                  onChange={(e) => setForm((f) => ({ ...f, paidAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>

              <Button type="button" variant="outline" className="w-full mt-2 text-sm">
                Split Bill
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatDualPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive tabular-nums">-{formatDualPrice(discountAmount)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                <span className="tabular-nums">{formatDualPrice(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
              <span>Grand Total</span>
              <span className="text-primary tabular-nums">{formatDualPrice(grandTotal)}</span>
            </div>
            {settings.dualCurrencyEnabled && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatDualPrice(grandTotal)}</span>
              </div>
            )}
          </div>

          {/* Footer buttons — 3 actions like reference */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button variant="outline" onClick={() => handleAction("draft")} className="gap-2">
              <Save className="w-4 h-4" /> Save as Draft
            </Button>
            <Button
              onClick={() => handleAction("print")}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </Button>
            <Button
              onClick={() => handleAction("payment")}
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Receipt className="w-4 h-4" /> Make Payment (POS)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewInvoiceDialog;
