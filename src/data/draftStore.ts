/* Draft invoice store — persisted via Supabase */
import { supabase } from "@/integrations/supabase/client";
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
let loaded = false;
const listeners = new Set<Listener>();
function notify() { listeners.forEach((fn) => fn()); }

const toDraft = (r: any): DraftInvoice => ({
  id: r.id, patient: r.patient, doctor: r.doctor, date: r.date,
  total: Number(r.total), itemCount: r.item_count, savedAt: r.saved_at,
  formData: r.form_data as InvoiceFormData,
});

const load = async () => {
  const { data, error } = await supabase.from("drafts").select("*").order("created_at", { ascending: false });
  if (!error && data) { drafts = data.map(toDraft); loaded = true; notify(); }
};
load();

export function getDrafts(): DraftInvoice[] { return drafts; }
export function isDraftsLoaded() { return loaded; }

export async function addDraft(draft: DraftInvoice) {
  const { error } = await supabase.from("drafts").insert({
    id: draft.id, patient: draft.patient, doctor: draft.doctor, date: draft.date,
    total: draft.total, item_count: draft.itemCount, saved_at: draft.savedAt,
    form_data: JSON.parse(JSON.stringify(draft.formData)),
  });
  if (error) throw error;
  drafts = [draft, ...drafts]; notify();
}

export async function removeDraft(id: string) {
  const { error } = await supabase.from("drafts").delete().eq("id", id);
  if (error) throw error;
  drafts = drafts.filter((d) => d.id !== id); notify();
}

export async function updateDraft(id: string, updates: Partial<DraftInvoice>) {
  const dbUp: Record<string, any> = {};
  if (updates.patient !== undefined) dbUp.patient = updates.patient;
  if (updates.doctor !== undefined) dbUp.doctor = updates.doctor;
  if (updates.date !== undefined) dbUp.date = updates.date;
  if (updates.total !== undefined) dbUp.total = updates.total;
  if (updates.itemCount !== undefined) dbUp.item_count = updates.itemCount;
  if (updates.savedAt !== undefined) dbUp.saved_at = updates.savedAt;
  if (updates.formData !== undefined) dbUp.form_data = JSON.parse(JSON.stringify(updates.formData));
  const { error } = await supabase.from("drafts").update(dbUp).eq("id", id);
  if (error) throw error;
  drafts = drafts.map((d) => d.id === id ? { ...d, ...updates } : d); notify();
}

export function subscribeDrafts(fn: Listener): () => void {
  listeners.add(fn); return () => listeners.delete(fn);
}

let draftCounter = 0;
export function nextDraftId(): string {
  draftCounter++;
  const maxExisting = drafts.reduce((max, d) => {
    const num = parseInt(d.id.replace("DRF-", ""));
    return isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `DRF-${String(Math.max(draftCounter, maxExisting + 1)).padStart(3, "0")}`;
}
