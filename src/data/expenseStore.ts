import { supabase } from "@/integrations/supabase/client";
import { type ExpenseRecord } from "./expenseRecords";

type Listener = () => void;
let records: ExpenseRecord[] = [];
let loaded = false;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

const toRecord = (r: any): ExpenseRecord => ({
  id: r.id, title: r.title, category: r.category, amount: Number(r.amount),
  paidTo: r.paid_to, paymentMethod: r.payment_method, date: r.date,
  receipt: r.receipt, notes: r.notes, status: r.status,
});

const load = async () => {
  const { data, error } = await supabase.from("expenses").select("*").order("created_at", { ascending: false });
  if (!error && data) { records = data.map(toRecord); loaded = true; notify(); }
};
load();

export function getExpenseRecords(): ExpenseRecord[] { return records; }
export function isExpensesLoaded() { return loaded; }

export function setExpenseRecords(data: ExpenseRecord[]) { records = data; notify(); }

export async function addExpenseRecord(record: ExpenseRecord) {
  const { error } = await supabase.from("expenses").insert({
    id: record.id, title: record.title, category: record.category, amount: record.amount,
    paid_to: record.paidTo, payment_method: record.paymentMethod, date: record.date,
    receipt: record.receipt, notes: record.notes, status: record.status,
  });
  if (error) throw error;
  records = [record, ...records]; notify();
}

export async function removeExpenseRecord(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw error;
  records = records.filter((r) => r.id !== id); notify();
}

export async function updateExpenseRecord(id: string, updates: Partial<ExpenseRecord>) {
  const dbUp: Record<string, any> = {};
  if (updates.title !== undefined) dbUp.title = updates.title;
  if (updates.category !== undefined) dbUp.category = updates.category;
  if (updates.amount !== undefined) dbUp.amount = updates.amount;
  if (updates.paidTo !== undefined) dbUp.paid_to = updates.paidTo;
  if (updates.paymentMethod !== undefined) dbUp.payment_method = updates.paymentMethod;
  if (updates.date !== undefined) dbUp.date = updates.date;
  if (updates.receipt !== undefined) dbUp.receipt = updates.receipt;
  if (updates.notes !== undefined) dbUp.notes = updates.notes;
  if (updates.status !== undefined) dbUp.status = updates.status;
  const { error } = await supabase.from("expenses").update(dbUp).eq("id", id);
  if (error) throw error;
  records = records.map((r) => (r.id === id ? { ...r, ...updates } : r)); notify();
}

export function subscribeExpenses(fn: Listener): () => void {
  listeners.add(fn); return () => listeners.delete(fn);
}
