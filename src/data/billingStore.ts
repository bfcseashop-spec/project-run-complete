/* Billing data store — persisted via Supabase */
import { supabase } from "@/integrations/supabase/client";
import type { InvoiceFormData, SplitPayment } from "@/components/NewInvoiceDialog";

export interface BillingRecord {
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
  formData?: InvoiceFormData;
}

type Listener = () => void;
let records: BillingRecord[] = [];
let loaded = false;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

const toRecord = (r: any): BillingRecord => ({
  id: r.id, patient: r.patient, service: r.service,
  amount: Number(r.amount), discount: Number(r.discount), tax: Number(r.tax),
  total: Number(r.total), paid: Number(r.paid), due: Number(r.due),
  date: r.date, status: r.status as BillingRecord["status"], method: r.method,
  formData: r.form_data as InvoiceFormData | undefined,
});

const loadRecords = async () => {
  const { data, error } = await supabase.from("billing_records").select("*").order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; notify(); }
};
loadRecords();

export function getBillingRecords(): BillingRecord[] { return records; }
export function isBillingLoaded() { return loaded; }

export async function setBillingRecords(data: BillingRecord[]) { records = data; notify(); }

export async function addBillingRecord(record: BillingRecord) {
  const { error } = await supabase.from("billing_records").insert({
    id: record.id, patient: record.patient, service: record.service,
    amount: record.amount, discount: record.discount, tax: record.tax,
    total: record.total, paid: record.paid, due: record.due,
    date: record.date, status: record.status, method: record.method,
    form_data: record.formData ? JSON.parse(JSON.stringify(record.formData)) : null,
  });
  if (error) throw error;
  records = [record, ...records]; notify();
}

export async function removeBillingRecord(id: string) {
  const { error } = await supabase.from("billing_records").delete().eq("id", id);
  if (error) throw error;
  records = records.filter((r) => r.id !== id); notify();
}

export async function updateBillingRecord(id: string, updates: Partial<BillingRecord>) {
  const dbUpdates: Record<string, any> = {};
  if (updates.patient !== undefined) dbUpdates.patient = updates.patient;
  if (updates.service !== undefined) dbUpdates.service = updates.service;
  if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
  if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
  if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
  if (updates.total !== undefined) dbUpdates.total = updates.total;
  if (updates.paid !== undefined) dbUpdates.paid = updates.paid;
  if (updates.due !== undefined) dbUpdates.due = updates.due;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.method !== undefined) dbUpdates.method = updates.method;
  if (updates.formData !== undefined) dbUpdates.form_data = JSON.parse(JSON.stringify(updates.formData));

  const { error } = await supabase.from("billing_records").update(dbUpdates).eq("id", id);
  if (error) throw error;

  records = records.map((r) => {
    if (r.id !== id) return r;
    const updated = { ...r, ...updates };
    if (updates.paid !== undefined || updates.total !== undefined || updates.due !== undefined) {
      const due = updated.due;
      const paid = updated.paid;
      if (due <= 0) updated.status = "completed";
      else if (paid > 0) updated.status = "pending";
      else updated.status = "critical";
    }
    return updated;
  });
  notify();
}

export function subscribeBilling(fn: Listener): () => void {
  listeners.add(fn); return () => listeners.delete(fn);
}
