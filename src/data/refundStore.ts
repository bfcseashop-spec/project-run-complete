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
const listeners: Set<Listener> = new Set();

const notify = () => listeners.forEach((fn) => fn());

export const getRefunds = () => refunds;
export const getAuditLog = () => auditLog;

export const addRefund = (record: Omit<RefundRecord, "id" | "createdAt">) => {
  refundCounter++;
  const id = `RFD-${String(refundCounter).padStart(4, "0")}`;
  const newRecord: RefundRecord = {
    ...record,
    id,
    createdAt: new Date().toISOString(),
  };
  refunds = [newRecord, ...refunds];

  // Audit entry
  addAuditEntry(id, "REFUND_CREATED", `Refund ${id} created for ${record.patient} — ${record.items.length} item(s), total: $${record.totalRefund.toFixed(2)}`);

  notify();
  return newRecord;
};

export const updateRefundStatus = (id: string, status: RefundRecord["status"]) => {
  refunds = refunds.map((r) => (r.id === id ? { ...r, status } : r));
  addAuditEntry(id, "STATUS_CHANGED", `Refund ${id} status changed to ${status}`);
  notify();
};

export const deleteRefund = (id: string) => {
  refunds = refunds.filter((r) => r.id !== id);
  addAuditEntry(id, "REFUND_DELETED", `Refund ${id} was deleted`);
  notify();
};

const addAuditEntry = (refundId: string, action: string, detail: string) => {
  auditCounter++;
  auditLog = [
    {
      id: `AUD-${String(auditCounter).padStart(5, "0")}`,
      refundId,
      action,
      detail,
      timestamp: new Date().toISOString(),
    },
    ...auditLog,
  ];
};

export const subscribeRefunds = (fn: Listener) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
