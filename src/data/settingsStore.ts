import { supabase } from "@/integrations/supabase/client";

type Listener = () => void;

export interface AppSettings {
  currency: string;
  secondaryCurrency: string;
  exchangeRate: number;
  dualCurrencyEnabled: boolean;
  language: string;
  showCurrencySymbol: boolean;
  theme: string;
  dateFormat: string;
  notifications: boolean;
  autoLogout: string;
  clinicName: string;
  clinicTagline: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicAddress: string;
  clinicWebsite: string;
  clinicRegNumber: string;
  invoicePrefix: string;
  nextInvoiceNumber: string;
  taxEnabled: boolean;
  taxRate: string;
}

const defaultSettings: AppSettings = {
  currency: "USD",
  secondaryCurrency: "KHR",
  exchangeRate: 4100,
  dualCurrencyEnabled: false,
  language: "English",
  showCurrencySymbol: true,
  theme: "light",
  dateFormat: "DD/MM/YYYY",
  notifications: true,
  autoLogout: "30",
  clinicName: "Prime Poly Clinic",
  clinicTagline: "Healthcare & Wellness",
  clinicPhone: "000 12345 6149",
  clinicEmail: "info@primeclinic.com",
  clinicAddress: "123 Medical Lane, Health City",
  clinicWebsite: "www.clinic.com",
  clinicRegNumber: "CLN-2024-0987",
  invoicePrefix: "INV",
  nextInvoiceNumber: "1001",
  taxEnabled: true,
  taxRate: "5",
};

let settings: AppSettings = { ...defaultSettings };
let loaded = false;
const listeners: Set<Listener> = new Set();

const notify = () => listeners.forEach((fn) => fn());

export const getSettings = (): AppSettings => settings;
export const isSettingsLoaded = (): boolean => loaded;

export const loadSettings = async () => {
  try {
    const { data, error } = await (supabase
      .from("app_settings") as any)
      .select("value")
      .eq("key", "global")
      .maybeSingle();

    if (!error && data && data.value) {
      settings = { ...defaultSettings, ...(data.value as Partial<AppSettings>) };
      loaded = true;
      notify();
    } else {
      loaded = true;
    }
  } catch {
    loaded = true;
  }
};

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const persistToDb = async () => {
  try {
    await (supabase
      .from("app_settings") as any)
      .update({ value: JSON.parse(JSON.stringify(settings)), updated_at: new Date().toISOString() })
      .eq("key", "global");
  } catch {
    // silent fail
  }
};

export const updateSettings = (partial: Partial<AppSettings>) => {
  settings = { ...settings, ...partial };
  notify();
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(persistToDb, 500);
};

export const subscribeSettings = (fn: Listener) => {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
};

loadSettings();
