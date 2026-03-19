import { startOfDay, subDays, startOfWeek, startOfMonth, startOfYear, isAfter, isEqual, parseISO } from "date-fns";

export type DatePreset = "all" | "today" | "yesterday" | "week" | "month" | "year";

export const datePresets: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export function getDateRange(preset: DatePreset): Date | null {
  const now = new Date();
  switch (preset) {
    case "today": return startOfDay(now);
    case "yesterday": return startOfDay(subDays(now, 1));
    case "week": return startOfWeek(now, { weekStartsOn: 1 });
    case "month": return startOfMonth(now);
    case "year": return startOfYear(now);
    default: return null;
  }
}

export function filterByDate<T>(data: T[], dateKey: string, preset: DatePreset): T[] {
  if (preset === "all") return data;
  const from = getDateRange(preset);
  if (!from) return data;
  return data.filter((item) => {
    const val = (item as Record<string, unknown>)[dateKey];
    if (!val || typeof val !== "string") return true;
    try {
      const d = parseISO(val);
      return isAfter(d, from) || isEqual(d, from);
    } catch {
      return true;
    }
  });
}
