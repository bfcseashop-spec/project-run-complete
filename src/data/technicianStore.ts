import { supabase } from "@/integrations/supabase/client";

export interface LabTechnician {
  id: string;
  name: string;
  created_at: string;
}

let technicians: LabTechnician[] = [];
let listeners: (() => void)[] = [];

function notify() { listeners.forEach(l => l()); }

export function getTechnicians() { return technicians; }
export function subscribeTechnicians(cb: () => void) {
  listeners.push(cb);
  return () => { listeners = listeners.filter(l => l !== cb); };
}

export async function loadTechnicians() {
  const { data } = await supabase
    .from("lab_technicians")
    .select("*")
    .order("created_at", { ascending: true });
  if (data) { technicians = data as LabTechnician[]; notify(); }
}

export async function addTechnician(name: string) {
  const { error } = await supabase.from("lab_technicians").insert({ name });
  if (error) throw error;
  await loadTechnicians();
}

export async function updateTechnician(id: string, name: string) {
  const { error } = await supabase.from("lab_technicians").update({ name }).eq("id", id);
  if (error) throw error;
  await loadTechnicians();
}

export async function deleteTechnician(id: string) {
  const { error } = await supabase.from("lab_technicians").delete().eq("id", id);
  if (error) throw error;
  await loadTechnicians();
}

// initial load
loadTechnicians();
