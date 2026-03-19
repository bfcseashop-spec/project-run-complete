import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { t } from "@/lib/i18n";
import { formatDualPrice } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import NewInvoiceDialog, { InvoiceFormData } from "@/components/NewInvoiceDialog";
import { toast } from "sonner";

interface BillingRecord {
  id: string;
  patient: string;
  service: string;
  amount: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  date: string;
  status: "completed" | "pending" | "critical";
  method: string;
}

const initialData: BillingRecord[] = [
  { id: "BIL-001", patient: "Sarah Johnson", service: "Lab Test + Consultation", amount: 350, discount: 20, tax: 16.5, total: 346.5, paid: 346.5, due: 0, date: "2026-03-19", status: "completed", method: "Cash" },
  { id: "BIL-002", patient: "Michael Chen", service: "X-Ray", amount: 200, discount: 0, tax: 10, total: 210, paid: 100, due: 110, date: "2026-03-18", status: "pending", method: "Card" },
  { id: "BIL-003", patient: "Emily Davis", service: "Ultrasound + Injection", amount: 480, discount: 30, tax: 22.5, total: 472.5, paid: 0, due: 472.5, date: "2026-03-17", status: "critical", method: "—" },
  { id: "BIL-004", patient: "James Wilson", service: "Health Checkup", amount: 150, discount: 0, tax: 7.5, total: 157.5, paid: 157.5, due: 0, date: "2026-03-16", status: "completed", method: "Cash" },
  { id: "BIL-005", patient: "Rina Akter", service: "Prescription + Medicine", amount: 90, discount: 10, tax: 4, total: 84, paid: 50, due: 34, date: "2026-03-15", status: "pending", method: "Mobile Pay" },
];

const BillingPage = () => {
  const { settings } = useSettings();
  const lang = settings.language;
  const [billingData, setBillingData] = useState<BillingRecord[]>(initialData);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleNewInvoice = (data: InvoiceFormData, action: "draft" | "print" | "payment") => {
    // Build service names from selections
    const parts: string[] = [];
    if (data.service) parts.push(data.service);
    if (data.injection) parts.push(data.injection);
    if (data.packageItem) parts.push(data.packageItem);
    data.customItems.forEach((c) => parts.push(c.name));
    data.medicines.forEach((m) => parts.push(m.name));
    const serviceNames = parts.join(" + ") || "—";

    // Calculate totals (mirrors dialog logic)
    const servicePrice = data.service ? 100 : 0;
    const injectionPrice = data.injection ? 100 : 0;
    const packagePrice = data.packageItem ? 500 : 0;
    const customTotal = data.customItems.reduce((s, c) => s + c.price * c.qty, 0);
    const medicineTotal = data.medicines.reduce((s, m) => s + 50 * m.qty, 0);
    const subtotal = servicePrice + injectionPrice + packagePrice + customTotal + medicineTotal;

    const discountAmt = data.discountType === "percent" ? (subtotal * data.discount) / 100 : data.discount;
    const afterDiscount = Math.max(0, subtotal - discountAmt);
    const appSettings = getSettings();
    const taxRate = appSettings.taxEnabled ? parseFloat(appSettings.taxRate) || 0 : 0;
    const taxAmt = (afterDiscount * taxRate) / 100;
    const total = afterDiscount + taxAmt;
    const due = Math.max(0, total - data.paidAmount);

    const prefix = appSettings.invoicePrefix || "BIL";
    const nextNum = parseInt(appSettings.nextInvoiceNumber) || billingData.length + 1;
    const id = `${prefix}-${String(nextNum).padStart(3, "0")}`;

    const status: BillingRecord["status"] = due === 0 ? "completed" : data.paidAmount === 0 ? "critical" : "pending";

    const record: BillingRecord = {
      id, patient: data.patient, service: serviceNames,
      amount: subtotal, discount: discountAmt, tax: taxAmt,
      total, paid: data.paidAmount, due,
      date: data.date, status, method: data.paymentMethod,
    };

    setBillingData((prev) => [record, ...prev]);
    setDialogOpen(false);

    if (action === "draft") toast.success(`Invoice ${id} saved as draft`);
    else if (action === "print") toast.success(`Invoice ${id} created — printing...`);
    else toast.success(`Payment received for ${id}`);
  };

  const columns = [
    { key: "id" as const, header: "Invoice" },
    { key: "patient" as const, header: t("patient", lang) },
    { key: "service" as const, header: "Service" },
    { key: "amount" as const, header: t("price", lang), render: (d: BillingRecord) => formatDualPrice(d.amount) },
    { key: "discount" as const, header: "Discount", render: (d: BillingRecord) => formatDualPrice(d.discount) },
    { key: "tax" as const, header: "Tax", render: (d: BillingRecord) => formatDualPrice(d.tax) },
    { key: "total" as const, header: t("total", lang), render: (d: BillingRecord) => <span className="font-semibold">{formatDualPrice(d.total)}</span> },
    { key: "paid" as const, header: "Paid", render: (d: BillingRecord) => formatDualPrice(d.paid) },
    { key: "due" as const, header: "Due", render: (d: BillingRecord) => <span className={d.due > 0 ? "text-destructive font-medium" : ""}>{formatDualPrice(d.due)}</span> },
    { key: "method" as const, header: "Method" },
    { key: "date" as const, header: t("date", lang) },
    { key: "status" as const, header: t("status", lang), render: (d: BillingRecord) => <StatusBadge status={d.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("billing", lang)} description="Create invoices, track payments and manage billing records">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Invoice
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={billingData} keyExtractor={(d) => d.id} />
      <NewInvoiceDialog open={dialogOpen} onOpenChange={setDialogOpen} onSubmit={handleNewInvoice} />
    </div>
  );
};

export default BillingPage;
