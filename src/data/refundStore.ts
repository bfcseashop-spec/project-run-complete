import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface RefundItem {
  name: string;
  type: "MED" | "INJ" | "SVC" | "PKG" | "CUSTOM";
  qty: number;
  unitPrice: number;
  total: number;
}

export interface RefundRecord {
  id: string;
  invoiceId: string;
  patient: string;
  items: RefundItem[];
  totalRefund: number;
  reason: string;
  method: string;
  status: "completed" | "pending" | "rejected";
  date: string;
  createdAt: string;
  processedBy: string;
}

export interface AuditEntry {
  id: string;
  refundId: string;
  action: string;
  detail: string;
  timestamp: string;
}

let refunds: RefundRecord[] = [];
let auditLog: AuditEntry[] = [];
let refundCounter = 0;
let auditCounter = 0;
let loaded = false;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach((fn) => fn());

const toRefund = (r: any): RefundRecord => ({
  id: r.id, invoiceId: r.invoice_id, patient: r.patient,
  items: r.items as RefundItem[], totalRefund: Number(r.total_refund),
  reason: r.reason, method: r.method, status: r.status,
  date: r.date, createdAt: r.created_at, processedBy: r.processed_by,
});

const toAudit = (r: any): AuditEntry => ({
  id: r.id, refundId: r.refund_id, action: r.action,
  detail: r.detail, timestamp: r.timestamp,
});

const load = async () => {
  const [refRes, audRes] = await Promise.all([
    supabase.from("refunds").select("*").order("created_at", { ascending: false }),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }),
  ]);
  if (!refRes.error && refRes.data) refunds = refRes.data.map(toRefund);
  if (!audRes.error && audRes.data) auditLog = audRes.data.map(toAudit);
  refundCounter = refunds.length;
  auditCounter = auditLog.length;
  loaded = true;
  notify();
};
load();

export const getRefunds = () => refunds;
export const getAuditLog = () => auditLog;

const addAuditEntry = async (refundId: string, action: string, detail: string) => {
  auditCounter++;
  const entry: AuditEntry = {
    id: `AUD-${String(auditCounter).padStart(5, "0")}`,
    refundId, action, detail, timestamp: new Date().toISOString(),
  };
  await supabase.from("audit_log").insert({
    id: entry.id, refund_id: entry.refundId, action: entry.action,
    detail: entry.detail, timestamp: entry.timestamp,
  });
  auditLog = [entry, ...auditLog];
};

export const addRefund = async (record: Omit<RefundRecord, "id" | "createdAt">) => {
  refundCounter++;
  const id = `RFD-${String(refundCounter).padStart(4, "0")}`;
  const newRecord: RefundRecord = { ...record, id, createdAt: new Date().toISOString() };

  const { error } = await supabase.from("refunds").insert({
    id, invoice_id: record.invoiceId, patient: record.patient,
    items: JSON.parse(JSON.stringify(record.items)), total_refund: record.totalRefund,
    reason: record.reason, method: record.method, status: record.status,
    date: record.date, processed_by: record.processedBy,
  });
  if (error) throw error;

  refunds = [newRecord, ...refunds];
  await addAuditEntry(id, "REFUND_CREATED", `Refund ${id} created for ${record.patient} — ${record.items.length} item(s), total: $${record.totalRefund.toFixed(2)}`);
  notify();
  return newRecord;
};

export const updateRefundStatus = async (id: string, status: RefundRecord["status"]) => {
  await supabase.from("refunds").update({ status }).eq("id", id);
  refunds = refunds.map((r) => (r.id === id ? { ...r, status } : r));
  await addAuditEntry(id, "STATUS_CHANGED", `Refund ${id} status changed to ${status}`);
  notify();
};

export const deleteRefund = async (id: string) => {
  await supabase.from("refunds").delete().eq("id", id);
  refunds = refunds.filter((r) => r.id !== id);
  await addAuditEntry(id, "REFUND_DELETED", `Refund ${id} was deleted`);
  notify();
};

export const subscribeRefunds = (fn: Listener) => {
  listeners.add(fn); return () => listeners.delete(fn);
};
