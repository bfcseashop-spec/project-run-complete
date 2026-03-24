import { useState, useRef, useEffect } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  detail: string; // e.g. "$10.00/pc · 118 In stock"
  badge?: string; // e.g. "Low"
  badgeColor?: string;
}

interface Props {
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  onSelect: (value: string) => void;
  icon?: React.ReactNode;
}

export function SearchableItemSelect({ options, placeholder = "Select...", searchPlaceholder = "Search...", onSelect, icon }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className="w-full h-10 justify-between text-sm font-normal text-muted-foreground hover:text-foreground">
          <span className="flex items-center gap-2 truncate">
            {icon}
            {placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>No items found.</CommandEmpty>
            {options.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                onSelect={() => { onSelect(opt.value); setOpen(false); }}
                className="flex items-center justify-between py-2.5 px-3 cursor-pointer"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate">{opt.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{opt.detail}</span>
                  {opt.badge && (
                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", opt.badgeColor || "bg-muted text-muted-foreground")}>
                      {opt.badge}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
