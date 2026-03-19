interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataGridViewProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
}

function DataGridView<T>({ columns, data, keyExtractor }: DataGridViewProps<T>) {
  // Show first 4-5 meaningful columns as card fields, skip actions
  const displayCols = columns.filter((c) => c.key !== "actions").slice(0, 6);
  const titleCol = displayCols[0];
  const subtitleCol = displayCols[1];
  const restCols = displayCols.slice(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {data.map((item) => (
        <div
          key={keyExtractor(item)}
          className="bg-card rounded-xl border border-border shadow-card p-4 hover:shadow-elevated transition-shadow space-y-3"
        >
          <div>
            <div className="font-semibold text-card-foreground text-sm">
              {titleCol?.render ? titleCol.render(item) : (item as Record<string, unknown>)[titleCol?.key] as React.ReactNode}
            </div>
            {subtitleCol && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {subtitleCol.render ? subtitleCol.render(item) : (item as Record<string, unknown>)[subtitleCol.key] as React.ReactNode}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            {restCols.map((col) => (
              <div key={col.key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{col.header}</span>
                <span className="text-card-foreground font-medium">
                  {col.render ? col.render(item) : (item as Record<string, unknown>)[col.key] as React.ReactNode}
                </span>
              </div>
            ))}
          </div>
          {/* Actions row */}
          {columns.find((c) => c.key === "actions") && (
            <div className="pt-2 border-t border-border">
              {columns.find((c) => c.key === "actions")!.render!(item)}
            </div>
          )}
        </div>
      ))}
      {data.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
          No records found
        </div>
      )}
    </div>
  );
}

export default DataGridView;
