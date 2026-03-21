import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Download, Upload, FileSpreadsheet, FileText, List, LayoutGrid, Calendar, Search,
} from "lucide-react";
import { DatePreset, datePresets } from "@/lib/dateFilters";
import { toast } from "sonner";

interface DataToolbarProps {
  dateFilter: DatePreset;
  onDateFilterChange: (v: DatePreset) => void;
  viewMode: "list" | "grid";
  onViewModeChange: (v: "list" | "grid") => void;
  searchQuery?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onImport: (file: File) => void;
  onDownloadSample: () => void;
}

const DataToolbar = ({
  dateFilter, onDateFilterChange,
  viewMode, onViewModeChange,
  searchQuery, onSearchChange, searchPlaceholder,
  onExportExcel, onExportPDF,
  onImport, onDownloadSample,
}: DataToolbarProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls") && !file.name.endsWith(".csv")) {
        toast.error("Please upload an Excel (.xlsx/.xls) or CSV file");
        return;
      }
      onImport(file);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date Filter */}
      <Select value={dateFilter} onValueChange={(v) => onDateFilterChange(v as DatePreset)}>
        <SelectTrigger className="w-[140px] h-9 text-xs">
          <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {datePresets.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* View Toggle */}
      <ToggleGroup
        type="single"
        value={viewMode}
        onValueChange={(v) => { if (v) onViewModeChange(v as "list" | "grid"); }}
        className="border border-border rounded-md"
      >
        <ToggleGroupItem value="list" aria-label="List view" className="h-9 w-9 p-0">
          <List className="w-4 h-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid view" className="h-9 w-9 p-0">
          <LayoutGrid className="w-4 h-4" />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Import */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" /> Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Import Excel File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownloadSample}>
            <Download className="w-4 h-4 mr-2" /> Download Sample File
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

      {/* Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" /> Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="w-4 h-4 mr-2" /> Export as PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default DataToolbar;
