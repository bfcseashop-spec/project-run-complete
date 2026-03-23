import { useState } from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type DashboardFilterPreset = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

const presetLabels: Record<DashboardFilterPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  last_week: "Last Week",
  this_month: "This Month",
  last_month: "Last Month",
  custom: "Custom Date",
};

export function getPresetRange(preset: DashboardFilterPreset): DateRange {
  const now = new Date();
  switch (preset) {
    case "today": return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday": { const y = subDays(now, 1); return { from: startOfDay(y), to: endOfDay(y) }; }
    case "this_week": return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) };
    case "last_week": { const lw = subWeeks(now, 1); return { from: startOfWeek(lw, { weekStartsOn: 1 }), to: endOfWeek(lw, { weekStartsOn: 1 }) }; }
    case "this_month": return { from: startOfMonth(now), to: endOfDay(now) };
    case "last_month": { const lm = subMonths(now, 1); return { from: startOfMonth(lm), to: endOfMonth(lm) }; }
    default: return { from: startOfDay(now), to: endOfDay(now) };
  }
}

interface DashboardDateFilterProps {
  preset: DashboardFilterPreset;
  customRange: DateRange | null;
  onPresetChange: (p: DashboardFilterPreset) => void;
  onCustomRangeChange: (r: DateRange) => void;
}

const DashboardDateFilter = ({ preset, customRange, onPresetChange, onCustomRangeChange }: DashboardDateFilterProps) => {
  const [calOpen, setCalOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | undefined>(customRange?.from);
  const [tempTo, setTempTo] = useState<Date | undefined>(customRange?.to);

  const label = preset === "custom" && customRange
    ? `${format(customRange.from, "MMM d")} – ${format(customRange.to, "MMM d")}`
    : presetLabels[preset];

  const handlePreset = (p: DashboardFilterPreset) => {
    if (p === "custom") {
      setCalOpen(true);
    } else {
      onPresetChange(p);
    }
  };

  const applyCustom = () => {
    if (tempFrom && tempTo) {
      onCustomRangeChange({ from: startOfDay(tempFrom), to: endOfDay(tempTo) });
      onPresetChange("custom");
      setCalOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2 relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {label}
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {(Object.keys(presetLabels) as DashboardFilterPreset[]).filter(k => k !== "custom").map((k) => (
            <DropdownMenuItem key={k} onClick={() => handlePreset(k)} className={cn(preset === k && "bg-accent font-semibold")}>
              {presetLabels[k]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handlePreset("custom")}>
            <CalendarIcon className="w-3.5 h-3.5 mr-2" /> Custom Date
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {calOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setCalOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-modal p-4 w-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Select date range</p>
            <div className="flex gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">From</p>
                <Calendar mode="single" selected={tempFrom} onSelect={setTempFrom} className="p-2 pointer-events-auto" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">To</p>
                <Calendar mode="single" selected={tempTo} onSelect={setTempTo} className="p-2 pointer-events-auto" />
              </div>
            </div>
            <div className="flex justify-end mt-3 gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={applyCustom} disabled={!tempFrom || !tempTo}>Apply</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardDateFilter;
