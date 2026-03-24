import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  boxNo: string;
  category: string;
  purchasePrice: number;
  price: number;
  stock: number;
  unit: string;
  soldOut: number;
  image: string;
  expiry: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  batchNo: string;
  stockAlert: number;
}

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  type: "deduct" | "restock" | "adjustment" | "initial";
  qty: number;
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId: string;
  createdAt: string;
}

const computeStatus = (stock: number): Medicine["status"] =>
  stock <= 0 ? "out-of-stock" : stock <= 20 ? "low-stock" : "in-stock";

/* ── local cache ── */
let medicines: Medicine[] = [];
let loaded = false;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((fn) => fn());

/* map DB row → app model */
const toMedicine = (r: any): Medicine => ({
  id: r.id,
  name: r.name,
  manufacturer: r.manufacturer,
  boxNo: r.box_no,
  category: r.category,
  purchasePrice: Number(r.purchase_price),
  price: Number(r.price),
  stock: r.stock,
  unit: r.unit,
  soldOut: r.sold_out,
  image: r.image,
  expiry: r.expiry,
  status: r.status as Medicine["status"],
  batchNo: r.batch_no || "-",
  stockAlert: r.stock_alert ?? 10,
});

const toMovement = (r: any): StockMovement => ({
  id: r.id,
  medicineId: r.medicine_id,
  medicineName: r.medicine_name,
  type: r.type,
  qty: r.qty,
  stockBefore: r.stock_before,
  stockAfter: r.stock_after,
  reason: r.reason,
  referenceId: r.reference_id,
  createdAt: r.created_at,
});

/* ── stock movement logging ── */
const logMovement = async (
  medicineId: string,
  medicineName: string,
  type: StockMovement["type"],
  qty: number,
  stockBefore: number,
  stockAfter: number,
  reason: string,
  referenceId = ""
) => {
  await supabase.from("stock_movements").insert({
    medicine_id: medicineId,
    medicine_name: medicineName,
    type,
    qty,
    stock_before: stockBefore,
    stock_after: stockAfter,
    reason,
    reference_id: referenceId,
  });
};

/* ── fetch movements ── */
export const getStockMovements = async (medicineId?: string): Promise<StockMovement[]> => {
  let query = supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (medicineId) query = query.eq("medicine_id", medicineId);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(toMovement);
};

export const getAllStockMovements = async (): Promise<StockMovement[]> => {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !data) return [];
  return data.map(toMovement);
};

/* ── fetch from DB ── */
let loadPromise: Promise<void> | null = null;

const loadMedicines = async () => {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .order("created_at", { ascending: false });
  if (!error && data) {
    medicines = data.map(toMedicine);
    loaded = true;
    notify();
  }
};

const ensureLoaded = async () => {
  if (loaded) return;
  if (!loadPromise) loadPromise = loadMedicines();
  await loadPromise;
};

// initial load
loadPromise = loadMedicines();

export const getMedicines = () => medicines;
export const isMedicinesLoaded = () => loaded;

export const refreshMedicines = async () => {
  await loadMedicines();
};

export const addMedicine = async (med: Omit<Medicine, "id" | "status">) => {
  const status = computeStatus(med.stock);
  const { data, error } = await supabase
    .from("medicines")
    .insert({
      name: med.name,
      manufacturer: med.manufacturer,
      box_no: med.boxNo,
      category: med.category,
      purchase_price: med.purchasePrice,
      price: med.price,
      stock: med.stock,
      unit: med.unit,
      sold_out: med.soldOut,
      image: med.image,
      expiry: med.expiry,
      status,
      batch_no: med.batchNo || "-",
      stock_alert: med.stockAlert ?? 10,
    })
    .select()
    .single();
  if (error) throw error;
  const newMed = toMedicine(data);
  medicines = [newMed, ...medicines];

  if (med.stock > 0) {
    await logMovement(newMed.id, newMed.name, "initial", med.stock, 0, med.stock, "Initial stock on creation");
  }

  notify();
  return newMed;
};

export const updateMedicine = async (id: string, updates: Partial<Medicine>) => {
  const dbUpdates: Record<string, any> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.manufacturer !== undefined) dbUpdates.manufacturer = updates.manufacturer;
  if (updates.boxNo !== undefined) dbUpdates.box_no = updates.boxNo;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
  if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
  if (updates.soldOut !== undefined) dbUpdates.sold_out = updates.soldOut;
  if (updates.image !== undefined) dbUpdates.image = updates.image;
  if (updates.expiry !== undefined) dbUpdates.expiry = updates.expiry;
  if (updates.batchNo !== undefined) dbUpdates.batch_no = updates.batchNo;
  if (updates.stockAlert !== undefined) dbUpdates.stock_alert = updates.stockAlert;

  // Recompute status
  const existing = medicines.find((m) => m.id === id);
  const newStock = updates.stock ?? existing?.stock ?? 0;
  dbUpdates.status = computeStatus(newStock);

  const { error } = await supabase.from("medicines").update(dbUpdates).eq("id", id);
  if (error) throw error;

  medicines = medicines.map((m) => {
    if (m.id !== id) return m;
    const updated = { ...m, ...updates };
    updated.status = computeStatus(updated.stock);
    return updated;
  });
  notify();
};

export const restockMedicine = async (name: string, qty: number) => {
  await ensureLoaded();
  const med = medicines.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
  if (med) {
    const stockBefore = med.stock;
    await updateMedicine(med.id, { stock: med.stock + qty });
    await logMovement(med.id, med.name, "restock", qty, stockBefore, stockBefore + qty, "Refund restock");
  }
};

export const deductMedicine = async (name: string, qty: number): Promise<boolean> => {
  await ensureLoaded();
  const med = medicines.find((m) => m.name.toLowerCase().includes(name.toLowerCase()));
  if (med && med.stock >= qty) {
    const stockBefore = med.stock;
    await updateMedicine(med.id, { stock: med.stock - qty });
    await logMovement(med.id, med.name, "deduct", qty, stockBefore, stockBefore - qty, "Invoice sale");
    return true;
  }
  return false;
};

export const adjustMedicineStock = async (id: string, newStock: number, reason: string) => {
  await ensureLoaded();
  const med = medicines.find((m) => m.id === id);
  if (med) {
    const stockBefore = med.stock;
    await updateMedicine(id, { stock: newStock });
    const type: StockMovement["type"] = newStock > stockBefore ? "restock" : "deduct";
    const qty = Math.abs(newStock - stockBefore);
    await logMovement(med.id, med.name, type, qty, stockBefore, newStock, reason || "Manual adjustment");
  }
};

export const deleteMedicine = async (id: string) => {
  const { error } = await supabase.from("medicines").delete().eq("id", id);
  if (error) throw error;
  medicines = medicines.filter((m) => m.id !== id);
  notify();
};

export const subscribeMedicines = (fn: Listener): (() => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
