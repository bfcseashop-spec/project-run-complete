import { useState, useSyncExternalStore } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  getTechnicians, subscribeTechnicians,
  addTechnician, updateTechnician, deleteTechnician,
} from "@/data/technicianStore";

const ManageTechniciansDialog = () => {
  const technicians = useSyncExternalStore(subscribeTechnicians, getTechnicians);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      await addTechnician(newName.trim());
      setNewName("");
      toast.success("Technologist added");
    } catch { toast.error("Failed to add"); }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) return;
    setLoading(true);
    try {
      await updateTechnician(editId, editName.trim());
      setEditId(null);
      toast.success("Technologist updated");
    } catch { toast.error("Failed to update"); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await deleteTechnician(id);
      toast.success("Technologist deleted");
    } catch { toast.error("Failed to delete"); }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="text-xs gap-1">
          <Plus className="w-3.5 h-3.5" /> Lab Technologist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Lab Technicians</DialogTitle>
        </DialogHeader>

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            placeholder="Technician name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={loading || !newName.trim()} size="sm">
            <Save className="w-4 h-4 mr-1" /> Save
          </Button>
        </div>

        {/* List */}
        <div className="space-y-1 max-h-[300px] overflow-y-auto mt-2">
          {technicians.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No technicians added yet</p>
          )}
          {technicians.map((t) => (
            <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/30">
              {editId === t.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleUpdate} disabled={loading}>
                    <Save className="w-3.5 h-3.5 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditId(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm flex-1">{t.name}</span>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => { setEditId(t.id); setEditName(t.name); }}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-500" />
                  </Button>
                  <Button
                    size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => handleDelete(t.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageTechniciansDialog;
