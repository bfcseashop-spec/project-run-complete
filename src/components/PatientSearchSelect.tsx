import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientOption {
  id: string;
  name: string;
}

interface Props {
  patients: PatientOption[];
  value: string;
  onSelect: (patient: PatientOption) => void;
  placeholder?: string;
  className?: string;
}

export function PatientSearchSelect({ patients, value, onSelect, placeholder = "Search patient...", className }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open}
          className={cn("w-full justify-between text-sm font-normal", !value && "text-muted-foreground", className)}>
          <span className="truncate">{value || placeholder}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search patient name..." />
          <CommandList>
            <CommandEmpty>No patients found.</CommandEmpty>
            {patients.map((p) => (
              <CommandItem
                key={p.id}
                value={p.name}
                onSelect={() => { onSelect(p); setOpen(false); }}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm">{p.name}</span>
                <span className="text-[10px] text-muted-foreground">{p.id}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
