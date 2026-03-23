/* Draft invoice store */
import type { InvoiceFormData } from "@/components/NewInvoiceDialog";

export interface DraftInvoice {
  id: string;
  patient: string;
  doctor: string;
  date: string;
  total: number;
  itemCount: number;
  savedAt: string;
  formData: InvoiceFormData;
}

type Listener = () => void;
let drafts: DraftInvoice[] = [];
const listeners = new Set<Listener>();

function notify() { listeners.forEach((fn) => fn()); }

// Persist to localStorage
function save() { localStorage.setItem("clinic-drafts", JSON.stringify(drafts)); }
function load() {
  try {
    const raw = localStorage.getItem("clinic-drafts");
    if (raw) drafts = JSON.parse(raw);
  } catch { /* ignore */ }
}
load();

export function getDrafts(): DraftInvoice[] { return drafts; }

export function addDraft(draft: DraftInvoice) {
  drafts = [draft, ...drafts];
  save(); notify();
}

export function removeDraft(id: string) {
  drafts = drafts.filter((d) => d.id !== id);
  save(); notify();
}

export function updateDraft(id: string, updates: Partial<DraftInvoice>) {
  drafts = drafts.map((d) => d.id === id ? { ...d, ...updates } : d);
  save(); notify();
}

export function subscribeDrafts(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let draftCounter = drafts.length;
export function nextDraftId(): string {
  draftCounter++;
  return `DRF-${String(draftCounter).padStart(3, "0")}`;
}
