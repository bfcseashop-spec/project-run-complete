import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface Investor {
  id: string;
  name: string;
  sharePercent: number;
  investmentName: string;
  capitalAmount: number;
  paid: number;
  color: string;
}

export type ContributionCategory =
  | "Rental" | "Salary" | "Electricity" | "Water Bill" | "Internet Service"
  | "Medicine" | "Medical Instrument" | "Ultrasound Payment" | "Lab Equipment"
  | "Maintenance" | "Furniture" | "Marketing" | "Tax" | "Other";

export const categoryColors: Record<ContributionCategory, string> = {
  Rental: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Salary: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Electricity: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Water Bill": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Internet Service": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Medicine: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Medical Instrument": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Ultrasound Payment": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Lab Equipment": "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  Maintenance: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Furniture: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Marketing: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  Tax: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export const allCategories: ContributionCategory[] = Object.keys(categoryColors) as ContributionCategory[];

export interface Contribution {
  id: string;
  date: string;
  investmentName: string;
  investorId: string;
  category: ContributionCategory;
  amount: number;
  slipCount: number;
  note: string;
  slipImages: string[];
}

let totalCapitalAmount = 250000;
let investors: Investor[] = [];
let contributions: Contribution[] = [];
let loaded = false;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

const toInvestor = (r: any): Investor => ({
  id: r.id, name: r.name, sharePercent: Number(r.share_percent),
  investmentName: r.investment_name, capitalAmount: Number(r.capital_amount),
  paid: Number(r.paid), color: r.color,
});

const toContribution = (r: any): Contribution => ({
  id: r.id, date: r.date, investmentName: r.investment_name,
  investorId: r.investor_id, category: r.category as ContributionCategory,
  amount: Number(r.amount), slipCount: r.slip_count, note: r.note,
  slipImages: (r.slip_images as string[]) || [],
});

const load = async () => {
  const [invRes, conRes, setRes] = await Promise.all([
    supabase.from("investors").select("*").order("created_at", { ascending: true }),
    supabase.from("contributions").select("*").order("created_at", { ascending: false }),
    supabase.from("investment_settings").select("*").eq("key", "total_capital").maybeSingle(),
  ]);
  if (!invRes.error && invRes.data) investors = invRes.data.map(toInvestor);
  if (!conRes.error && conRes.data) contributions = conRes.data.map(toContribution);
  if (!setRes.error && setRes.data) totalCapitalAmount = Number(setRes.data.value);
  loaded = true;
  notify();
};
load();

export const getTotalCapital = () => totalCapitalAmount;
export const setTotalCapital = async (amount: number) => {
  totalCapitalAmount = amount;
  investors = investors.map(inv => ({
    ...inv, capitalAmount: Math.round((inv.sharePercent / 100) * totalCapitalAmount * 100) / 100,
  }));
  await supabase.from("investment_settings").update({ value: amount }).eq("key", "total_capital");
  for (const inv of investors) {
    await supabase.from("investors").update({ capital_amount: inv.capitalAmount }).eq("id", inv.id);
  }
  notify();
};

export const getInvestors = () => investors;
export const getContributions = () => contributions;
export const getInvestorById = (id: string) => investors.find((i) => i.id === id);

export const addInvestor = async (data: Omit<Investor, "id">) => {
  const id = `inv-${Date.now()}`;
  const capitalAmount = Math.round((data.sharePercent / 100) * totalCapitalAmount * 100) / 100;
  const inv: Investor = { ...data, capitalAmount, id };
  const { error } = await supabase.from("investors").insert({
    id, name: data.name, share_percent: data.sharePercent, investment_name: data.investmentName,
    capital_amount: capitalAmount, paid: data.paid, color: data.color,
  });
  if (error) throw error;
  investors = [...investors, inv]; notify();
  return inv;
};

export const updateInvestor = async (id: string, updates: Partial<Investor>) => {
  const dbUp: Record<string, any> = {};
  if (updates.name !== undefined) dbUp.name = updates.name;
  if (updates.sharePercent !== undefined) dbUp.share_percent = updates.sharePercent;
  if (updates.investmentName !== undefined) dbUp.investment_name = updates.investmentName;
  if (updates.paid !== undefined) dbUp.paid = updates.paid;
  if (updates.color !== undefined) dbUp.color = updates.color;

  investors = investors.map((i) => {
    if (i.id !== id) return i;
    const merged = { ...i, ...updates };
    if (updates.sharePercent !== undefined) {
      merged.capitalAmount = Math.round((merged.sharePercent / 100) * totalCapitalAmount * 100) / 100;
    }
    return merged;
  });

  const inv = investors.find(i => i.id === id);
  if (inv) dbUp.capital_amount = inv.capitalAmount;
  await supabase.from("investors").update(dbUp).eq("id", id);
  notify();
};

export const removeInvestor = async (id: string) => {
  await supabase.from("investors").delete().eq("id", id);
  investors = investors.filter((i) => i.id !== id); notify();
};

export const addContribution = async (data: Omit<Contribution, "id">) => {
  const id = `c-${String(Date.now()).slice(-6)}`;
  const c: Contribution = { ...data, id };
  const { error } = await supabase.from("contributions").insert({
    id, date: data.date, investment_name: data.investmentName, investor_id: data.investorId,
    category: data.category, amount: data.amount, slip_count: data.slipCount,
    note: data.note, slip_images: JSON.parse(JSON.stringify(data.slipImages)),
  });
  if (error) throw error;
  contributions = [c, ...contributions];
  const inv = investors.find((i) => i.id === data.investorId);
  if (inv) await updateInvestor(inv.id, { paid: inv.paid + data.amount });
  notify();
  return c;
};

export const updateContribution = async (id: string, updates: Partial<Contribution>) => {
  const old = contributions.find((c) => c.id === id);
  const dbUp: Record<string, any> = {};
  if (updates.date !== undefined) dbUp.date = updates.date;
  if (updates.investmentName !== undefined) dbUp.investment_name = updates.investmentName;
  if (updates.investorId !== undefined) dbUp.investor_id = updates.investorId;
  if (updates.category !== undefined) dbUp.category = updates.category;
  if (updates.amount !== undefined) dbUp.amount = updates.amount;
  if (updates.slipCount !== undefined) dbUp.slip_count = updates.slipCount;
  if (updates.note !== undefined) dbUp.note = updates.note;
  if (updates.slipImages !== undefined) dbUp.slip_images = JSON.parse(JSON.stringify(updates.slipImages));
  await supabase.from("contributions").update(dbUp).eq("id", id);
  contributions = contributions.map((c) => (c.id === id ? { ...c, ...updates } : c));
  if (old && updates.amount !== undefined && updates.amount !== old.amount) {
    const diff = updates.amount - old.amount;
    const inv = investors.find((i) => i.id === (updates.investorId || old.investorId));
    if (inv) await updateInvestor(inv.id, { paid: inv.paid + diff });
  }
  notify();
};

export const removeContribution = async (id: string) => {
  const c = contributions.find((x) => x.id === id);
  if (c) {
    const inv = investors.find((i) => i.id === c.investorId);
    if (inv) await updateInvestor(inv.id, { paid: Math.max(0, inv.paid - c.amount) });
  }
  await supabase.from("contributions").delete().eq("id", id);
  contributions = contributions.filter((x) => x.id !== id); notify();
};

export const subscribeInvestments = (fn: Listener) => {
  listeners.add(fn); return () => listeners.delete(fn);
};
