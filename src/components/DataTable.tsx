import { Checkbox } from "@/components/ui/checkbox";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
}

function DataTable<T>({ columns, data, keyExtractor, selectable, selectedKeys, onSelectionChange }: DataTableProps<T>) {
  const allSelected = selectable && data.length > 0 && data.every(item => selectedKeys?.has(keyExtractor(item)));
  const someSelected = selectable && data.some(item => selectedKeys?.has(keyExtractor(item)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map(keyExtractor)));
    }
  };

  const toggleOne = (key: string) => {
    if (!onSelectionChange || !selectedKeys) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    onSelectionChange(next);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" className={someSelected && !allSelected ? "opacity-60" : ""} />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => {
              const key = keyExtractor(item);
              const isSelected = selectedKeys?.has(key);
              return (
                <tr key={key} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                  {selectable && (
                    <td className="w-10 px-3 py-3">
                      <Checkbox checked={!!isSelected} onCheckedChange={() => toggleOne(key)} aria-label={`Select ${key}`} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-card-foreground">
                      {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
