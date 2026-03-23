import { expenseRecords, type ExpenseRecord } from "./expenseRecords";

type Listener = () => void;
let records: ExpenseRecord[] = [...expenseRecords];
const listeners = new Set<Listener>();

function notify() { listeners.forEach((fn) => fn()); }

export function getExpenseRecords(): ExpenseRecord[] { return records; }

export function setExpenseRecords(data: ExpenseRecord[]) { records = data; notify(); }

export function addExpenseRecord(record: ExpenseRecord) { records = [record, ...records]; notify(); }

export function removeExpenseRecord(id: string) { records = records.filter((r) => r.id !== id); notify(); }

export function updateExpenseRecord(id: string, updates: Partial<ExpenseRecord>) {
  records = records.map((r) => (r.id === id ? { ...r, ...updates } : r));
  notify();
}

export function subscribeExpenses(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
