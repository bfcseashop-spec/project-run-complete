import { useState, useCallback } from "react";
import { DatePreset, filterByDate } from "@/lib/dateFilters";
import { exportToExcel, exportToPDF, generateSampleExcel, importFromExcel } from "@/lib/exportUtils";
import { toast } from "sonner";

interface UseDataToolbarOptions<T> {
  data: T[];
  dateKey: string;
  columns: { key: string; header: string }[];
  title: string;
}

export function useDataToolbar<T extends Record<string, unknown>>({ data, dateKey, columns, title, searchKeys }: UseDataToolbarOptions<T> & { searchKeys?: string[] }) {
  const [dateFilter, setDateFilter] = useState<DatePreset>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredByDate = filterByDate(data, dateKey, dateFilter);

  const filteredBySearch = searchQuery.trim()
    ? filteredByDate.filter((row) => {
        const q = searchQuery.toLowerCase();
        const keys = searchKeys || columns.filter(c => c.key !== "actions").map(c => c.key);
        return keys.some((k) => {
          const val = row[k];
          return val != null && String(val).toLowerCase().includes(q);
        });
      })
    : filteredByDate;

  const exportCols = columns.filter((c) => c.key !== "actions");

  const handleExportExcel = useCallback(() => {
    exportToExcel(filteredByDate as Record<string, unknown>[], exportCols, title.replace(/\s/g, "_"));
    toast.success(`Exported ${filteredByDate.length} records to Excel`);
  }, [filteredByDate, exportCols, title]);

  const handleExportPDF = useCallback(() => {
    exportToPDF(filteredByDate as Record<string, unknown>[], exportCols, title);
  }, [filteredByDate, exportCols, title]);

  const handleDownloadSample = useCallback(() => {
    generateSampleExcel(exportCols, title.replace(/\s/g, "_"));
    toast.success("Sample template downloaded");
  }, [exportCols, title]);

  const handleImport = useCallback(async (file: File): Promise<Record<string, unknown>[]> => {
    try {
      const rows = await importFromExcel(file, exportCols);
      toast.success(`Imported ${rows.length} records from ${file.name}`);
      return rows;
    } catch {
      toast.error("Failed to import file. Please check the format.");
      return [];
    }
  }, [exportCols]);

  return {
    dateFilter, setDateFilter,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    filteredByDate: filteredBySearch,
    handleExportExcel, handleExportPDF,
    handleDownloadSample, handleImport,
  };
}
