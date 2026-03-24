import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowDownCircle, ArrowUpCircle, Search, Package, Clock, FileText,
} from "lucide-react";
import { getStockMovements, getAllStockMovements, type StockMovement } from "@/data/medicineStore";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicineId?: string;
  medicineName?: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: typeof ArrowDownCircle }> = {
  deduct: { label: "Sold", color: "bg-destructive/10 text-destructive border-destructive/20", icon: ArrowDownCircle },
  restock: { label: "Restocked", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ArrowUpCircle },
  adjustment: { label: "Adjusted", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Package },
  initial: { label: "Initial", color: "bg-primary/10 text-primary border-primary/20", icon: Package },
};

export default function StockHistoryDialog({ open, onOpenChange, medicineId, medicineName }: Props) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const fn = medicineId ? () => getStockMovements(medicineId) : getAllStockMovements;
    fn().then((data) => {
      setMovements(data);
      setLoading(false);
    });
  }, [open, medicineId]);

  const filtered = movements.filter((m) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      m.medicineName.toLowerCase().includes(s) ||
      m.reason.toLowerCase().includes(s) ||
      m.referenceId.toLowerCase().includes(s) ||
      m.type.toLowerCase().includes(s)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Stock Movement History
            {medicineName && (
              <Badge variant="outline" className="ml-2 font-normal">{medicineName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, reason, reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="flex-1 min-h-0 max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading movements...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <Package className="h-10 w-10 opacity-40" />
              <p>No stock movements found</p>
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {filtered.map((m) => {
                const cfg = typeConfig[m.type] || typeConfig.adjustment;
                const Icon = cfg.icon;
                const isDeduct = m.type === "deduct";
                return (
                  <div
                    key={m.id}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`mt-0.5 rounded-full p-1.5 ${isDeduct ? "bg-destructive/10" : "bg-emerald-500/10"}`}>
                      <Icon className={`h-4 w-4 ${isDeduct ? "text-destructive" : "text-emerald-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{m.medicineName}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${cfg.color}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className={`font-semibold ${isDeduct ? "text-destructive" : "text-emerald-600"}`}>
                          {isDeduct ? "−" : "+"}{m.qty}
                        </span>
                        <span>{m.stockBefore} → {m.stockAfter}</span>
                        {m.reason && (
                          <>
                            <span>•</span>
                            <span className="truncate">{m.reason}</span>
                          </>
                        )}
                      </div>
                      {m.referenceId && (
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          {m.referenceId}
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString()}{" "}
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!loading && filtered.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-1">
            Showing {filtered.length} movement{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
