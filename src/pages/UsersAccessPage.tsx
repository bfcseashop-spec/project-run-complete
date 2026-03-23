import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, Plus, Pencil, Trash2, Shield, Search, UserCheck, UserX,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin?: string;
}

const roles = ["Admin", "Doctor", "Nurse", "Receptionist", "Lab Technician", "Pharmacist"];

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary border-primary/20",
  Doctor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Nurse: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Receptionist: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Lab Technician": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Pharmacist: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
};

const initialUsers: User[] = [
  { id: 1, name: "Admin User", email: "admin@clinic.com", role: "Admin", active: true, lastLogin: "2026-03-23" },
  { id: 2, name: "Dr. Sarah Smith", email: "sarah@clinic.com", role: "Doctor", active: true, lastLogin: "2026-03-22" },
  { id: 3, name: "Nurse Priya", email: "priya@clinic.com", role: "Nurse", active: true, lastLogin: "2026-03-21" },
  { id: 4, name: "Reception Desk", email: "reception@clinic.com", role: "Receptionist", active: false, lastLogin: "2026-03-10" },
];

const UsersAccessPage = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "Doctor", active: true });

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.active) return false;
    if (statusFilter === "inactive" && u.active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  const openAdd = () => {
    setForm({ name: "", email: "", role: "Doctor", active: true });
    setEditUser(null);
    setShowDialog(true);
  };

  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, role: u.role, active: u.active });
    setEditUser(u);
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    if (editUser) {
      setUsers((prev) => prev.map((u) => u.id === editUser.id ? { ...u, ...form } : u));
      toast.success("User updated");
    } else {
      setUsers((prev) => [...prev, { ...form, id: Date.now(), lastLogin: undefined }]);
      toast.success("User added");
    }
    setShowDialog(false);
  };

  const handleDelete = () => {
    if (deleteUser) {
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      toast.success("User removed");
      setDeleteUser(null);
    }
  };

  const toggleActive = (id: number) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !u.active } : u));
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Users & Access" description="Manage user accounts, roles and permissions" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground tabular-nums">{users.length}</p>
            <p className="text-[11px] text-muted-foreground">Total Users</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground tabular-nums">{activeCount}</p>
            <p className="text-[11px] text-muted-foreground">Active</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <UserX className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground tabular-nums">{inactiveCount}</p>
            <p className="text-[11px] text-muted-foreground">Inactive</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground tabular-nums">{roles.length}</p>
            <p className="text-[11px] text-muted-foreground">Roles</p>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-foreground">User Accounts</h3>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 w-[160px] text-xs" />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button size="sm" onClick={openAdd} className="h-8 gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" /> Add User
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Role", "Status", "Last Login", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr key={u.id} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${idx % 2 ? "bg-muted/10" : ""}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleColors[u.role] || "bg-muted text-muted-foreground border-border"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={u.active} onCheckedChange={() => toggleActive(u.id)} className="scale-75" />
                      <span className={`text-xs font-medium ${u.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {u.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">{u.lastLogin || "Never"}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}>
                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteUser(u)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-16 text-muted-foreground text-sm">No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roles Overview */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-3">Available Roles</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {roles.map((r) => {
            const count = users.filter((u) => u.role === r).length;
            return (
              <div key={r} className={`rounded-lg border p-3 text-center ${roleColors[r] || "bg-muted border-border"}`}>
                <p className="text-sm font-bold">{r}</p>
                <p className="text-[11px] opacity-70 mt-0.5">{count} user{count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Full Name *</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter full name" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="user@clinic.com" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium text-foreground">Active</span>
              <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editUser ? "Update" : "Add User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>{deleteUser?.name}</strong>? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersAccessPage;
