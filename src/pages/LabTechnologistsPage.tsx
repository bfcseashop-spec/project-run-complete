import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, Users, Microscope } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import {
  getTechnicians, subscribeTechnicians,
  addTechnician, updateTechnician, deleteTechnician,
} from "@/data/technicianStore";

type StaffRole = "Lab Technologist" | "Nurse" | "Phlebotomist" | "Lab Assistant";

const roleColors: Record<StaffRole, string> = {
  "Lab Technologist": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Nurse": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Phlebotomist": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Lab Assistant": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

const staffRoles: StaffRole[] = ["Lab Technologist", "Nurse", "Phlebotomist", "Lab Assistant"];

const LabTechnologistsPage = () => {
  const technicians = useSyncExternalStore(subscribeTechnicians, getTechnicians);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState<StaffRole>("Lab Technologist");
  const [loading, setLoading] = useState(false);

  // Parse role from name (stored as "Name | Role")
  const parseName = (raw: string) => {
    const parts = raw.split(" | ");
    return { name: parts[0], role: (parts[1] as StaffRole) || "Lab Technologist" };
  };

  const filtered = technicians.filter((t) => {
    const { name, role } = parseName(t.name);
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || role.toLowerCase().includes(q);
  });

  const openAdd = () => {
    setEditId(null);
    setFormName("");
    setFormRole("Lab Technologist");
    setDialogOpen(true);
  };

  const openEdit = (t: typeof technicians[0]) => {
    const { name, role } = parseName(t.name);
    setEditId(t.id);
    setFormName(name);
    setFormRole(role);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setLoading(true);
    const storedValue = `${formName.trim()} | ${formRole}`;
    try {
      if (editId) {
        await updateTechnician(editId, storedValue);
        toast.success("Staff member updated");
      } else {
        await addTechnician(storedValue);
        toast.success("Staff member added");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await deleteTechnician(deleteId);
      toast.success("Staff member deleted");
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteId(null);
    setLoading(false);
  };

  const stats = {
    total: technicians.length,
    technologists: technicians.filter(t => parseName(t.name).role === "Lab Technologist").length,
    nurses: technicians.filter(t => parseName(t.name).role === "Nurse").length,
    others: technicians.filter(t => !["Lab Technologist", "Nurse"].includes(parseName(t.name).role)).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lab Technologists & Staff"
        subtitle="Manage lab technologists, nurses, and other diagnostic staff"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Staff", value: stats.total, icon: Users, color: "hsl(210, 100%, 68%)" },
          { label: "Lab Technologists", value: stats.technologists, icon: Microscope, color: "hsl(220, 85%, 62%)" },
          { label: "Nurses", value: stats.nurses, icon: Users, color: "hsl(155, 70%, 48%)" },
          { label: "Others", value: stats.others, icon: Users, color: "hsl(28, 95%, 58%)" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex-1" />
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No staff members found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((t, i) => {
                const { name, role } = parseName(t.name);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[role] || "bg-muted text-muted-foreground"}`}>
                        {role}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(t)}>
                          <Pencil className="w-3.5 h-3.5 text-amber-500" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDeleteId(t.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
              <Input
                placeholder="Enter full name..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as StaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !formName.trim()}>
              {editId ? "Update" : "Add"} Staff
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this staff member? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LabTechnologistsPage;
