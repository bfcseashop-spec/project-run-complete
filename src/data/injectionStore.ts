import { supabase } from "@/integrations/supabase/client";

export interface InjectionItem {
  id: string;
  name: string;
  category: string;
  strength: string;
  route: string;
  stock: number;
  unit: string;
  price: number;
  purchase_price: number;
  image: string;
  quantity: number;
  sold_out: number;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

type Listener = () => void;
let injections: InjectionItem[] = [];
let loaded = false;
const listeners: Set<Listener> = new Set();
const notify = () => listeners.forEach((fn) => fn());

const toItem = (r: any): InjectionItem => ({
  id: r.id, name: r.name, category: r.category, strength: r.strength,
  route: r.route, stock: r.stock, unit: r.unit, price: Number(r.price),
  purchase_price: Number(r.purchase_price) || 0, image: r.image || "",
  quantity: Number(r.quantity) || 0, sold_out: Number(r.sold_out) || 0,
  status: r.status as InjectionItem["status"],
});

let loadPromise: Promise<void> | null = null;

const load = async () => {
  const { data, error } = await supabase.from("injections").select("*").order("created_at", { ascending: false });
  if (!error && data) { injections = data.map(toItem); loaded = true; notify(); }
};

const ensureLoaded = async () => {
  if (loaded) return;
  if (!loadPromise) loadPromise = load();
  await loadPromise;
};

loadPromise = load();

export const getInjections = () => injections;
export const isInjectionsLoaded = () => loaded;
export const ensureInjectionsLoaded = ensureLoaded;

export const addInjection = async (inj: InjectionItem) => {
  const { error } = await supabase.from("injections").insert({
    id: inj.id, name: inj.name, category: inj.category, strength: inj.strength,
    route: inj.route, stock: inj.stock, unit: inj.unit, price: inj.price,
    purchase_price: inj.purchase_price, image: inj.image, status: inj.status,
  });
  if (error) throw error;
  injections = [inj, ...injections]; notify();
};

export const updateInjection = async (id: string, data: Partial<InjectionItem>) => {
  const dbUp: Record<string, any> = {};
  if (data.name !== undefined) dbUp.name = data.name;
  if (data.category !== undefined) dbUp.category = data.category;
  if (data.strength !== undefined) dbUp.strength = data.strength;
  if (data.route !== undefined) dbUp.route = data.route;
  if (data.stock !== undefined) dbUp.stock = data.stock;
  if (data.unit !== undefined) dbUp.unit = data.unit;
  if (data.price !== undefined) dbUp.price = data.price;
  if (data.purchase_price !== undefined) dbUp.purchase_price = data.purchase_price;
  if (data.image !== undefined) dbUp.image = data.image;
  if (data.status !== undefined) dbUp.status = data.status;
  const { error } = await supabase.from("injections").update(dbUp).eq("id", id);
  if (error) throw error;
  injections = injections.map((i) => (i.id === id ? { ...i, ...data } : i)); notify();
};

export const deleteInjection = async (id: string) => {
  const { error } = await supabase.from("injections").delete().eq("id", id);
  if (error) throw error;
  injections = injections.filter((i) => i.id !== id); notify();
};

export const subscribeInjections = (fn: Listener) => {
  listeners.add(fn); return () => listeners.delete(fn);
};

export const computeInjectionStatus = (stock: number): InjectionItem["status"] => {
  if (stock === 0) return "out-of-stock";
  if (stock <= 20) return "low-stock";
  return "in-stock";
};
