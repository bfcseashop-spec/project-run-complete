import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Printer, Trash2, FileText, Plus } from "lucide-react";
import { getDrafts, subscribeDrafts, removeDraft, type DraftInvoice } from "@/data/draftStore";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import StatusBadge from "@/components/StatusBadge";

const columns = [
  { key: "id", header: "Draft ID", sortable: true },
  { key: "date", header: "Date", sortable: true },
  { key: "patient", header: "Patient", sortable: true },
  { key: "doctor", header: "Doctor", sortable: true },
  { key: "itemCount", header: "Items", sortable: true },
  { key: "total", header: "Total", sortable: true },
  { key: "savedAt", header: "Saved At", sortable: true },
  { key: "actions", header: "Actions" },
];

const DraftsPage = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState(getDrafts());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewDraft, setViewDraft] = useState<DraftInvoice | null>(null);

  useEffect(() => {
    const unsub = subscribeDrafts(() => setDrafts([...getDrafts()]));
    return unsub;
  }, []);

  const handleEdit = (draft: DraftInvoice) => {
    navigate("/billing/new", { state: { editData: draft.formData, draftId: draft.id } });
  };

  const handleDelete = () => {
    if (deleteId) {
      removeDraft(deleteId);
      toast.success("Draft deleted");
      setDeleteId(null);
    }
  };

  const columns: { key: string; header: string; sortable?: boolean; render?: (item: DraftInvoice) => React.ReactNode }[] = [
    { key: "id", header: "Draft ID", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "patient", header: "Patient", sortable: true },
    { key: "doctor", header: "Doctor", sortable: true },
    { key: "itemCount", header: "Items", sortable: true, render: (d) => <span>{d.itemCount}</span> },
    { key: "total", header: "Total", sortable: true, render: (d) => <span className="font-semibold tabular-nums">{formatPrice(d.total)}</span> },
    { key: "savedAt", header: "Saved At", sortable: true, render: (d) => <span className="text-xs text-muted-foreground">{new Date(d.savedAt).toLocaleString()}</span> },
    {
      key: "actions", header: "Actions", render: (draft) => (
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewDraft(draft)}>
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-primary" onClick={() => handleEdit(draft)}>
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Edit & Complete</TooltipContent></Tooltip>
            <Tooltip><TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteId(draft.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
          </div>
        </TooltipProvider>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Draft Invoices" description={`${drafts.length} draft(s) saved`}>
        <Button onClick={() => navigate("/billing/new")} className="gap-2">
          <Plus className="w-4 h-4" /> New Invoice
        </Button>
      </PageHeader>

      {drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No Drafts</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Saved drafts will appear here. Click "Save Draft" in the invoice form.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={drafts as unknown as Record<string, unknown>[]}
          renderCell={renderCell}
        />
      )}

      {/* View Dialog */}
      <Dialog open={!!viewDraft} onOpenChange={() => setViewDraft(null)}>
        <DialogContent className="max-w-lg">
          {viewDraft && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{viewDraft.id}</h3>
                <StatusBadge status="pending" />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <strong>{viewDraft.patient}</strong></div>
                <div><span className="text-muted-foreground">Doctor:</span> <strong>{viewDraft.doctor || "—"}</strong></div>
                <div><span className="text-muted-foreground">Date:</span> <strong>{viewDraft.date}</strong></div>
                <div><span className="text-muted-foreground">Total:</span> <strong>{formatPrice(viewDraft.total)}</strong></div>
              </div>
              {viewDraft.formData.lineItems && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[1fr_60px_80px] px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                    <span>Item</span><span className="text-center">Qty</span><span className="text-right">Amount</span>
                  </div>
                  {viewDraft.formData.lineItems.map((li: any, i: number) => (
                    <div key={i} className="grid grid-cols-[1fr_60px_80px] px-3 py-2 border-t border-border text-sm">
                      <span>{li.name}</span>
                      <span className="text-center">{li.qty}</span>
                      <span className="text-right tabular-nums">{formatPrice(li.price * li.qty)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1 gap-1.5" onClick={() => { setViewDraft(null); handleEdit(viewDraft); }}>
                  <Pencil className="w-3.5 h-3.5" /> Edit & Complete
                </Button>
                <Button variant="destructive" className="gap-1.5" onClick={() => { setDeleteId(viewDraft.id); setViewDraft(null); }}>
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft?</AlertDialogTitle>
            <AlertDialogDescription>This draft will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DraftsPage;
