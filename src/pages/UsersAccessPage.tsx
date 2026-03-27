import { useState, useEffect, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Users, Plus, Pencil, Trash2, Shield, Search, UserCheck, UserX,
  KeyRound, Settings2, Save, Check, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ───
interface AppRole {
  id: string;
  name: string;
  description: string;
  color: string;
  is_default: boolean;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role_id: string | null;
  active: boolean;
  last_login: string | null;
  app_roles?: { name: string } | null;
}

type PermissionAction = "view" | "create" | "edit" | "delete";

interface RolePermissionRow {
  id: string;
  role_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const systemModules = [
  { group: "Overview", modules: ["Dashboard", "Billing"] },
  { group: "Patient Care", modules: ["OPD Section", "Prescriptions", "Health Services", "Health Packages", "Injections"] },
  { group: "Diagnostics", modules: ["Lab Tests", "Lab Reports", "Sample Collection", "Test Names", "X-Ray", "Ultrasound"] },
  { group: "Management", modules: ["Doctors", "Medicine", "Roles"] },
  { group: "Finance", modules: ["Refund", "Due Management", "Expenses", "Bank Transactions", "Investments"] },
  { group: "System", modules: ["System Manage", "Settings", "Users & Access"] },
];

const allModules = systemModules.flatMap((g) => g.modules);
const permissionActions: PermissionAction[] = ["view", "create", "edit", "delete"];

const roleColorMap: Record<string, string> = {
  Admin: "bg-primary/10 text-primary border-primary/20",
  Doctor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Nurse: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Receptionist: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "Lab Technician": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Pharmacist: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
};

// ─── User Management Tab ───
const UserManagementTab = ({ profiles, roles, onRefresh }: { profiles: Profile[]; roles: AppRole[]; onRefresh: () => void }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [deleteProfile, setDeleteProfile] = useState<Profile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", role_id: "", active: true, new_password: "" });
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ full_name: "", email: "", password: "", role_id: "" });
  const [creating, setCreating] = useState(false);

  const filtered = profiles.filter((u) => {
    if (roleFilter !== "all" && u.role_id !== roleFilter) return false;
    if (statusFilter === "active" && !u.active) return false;
    if (statusFilter === "inactive" && u.active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roleName = (u as any).app_roles?.name || "";
      return u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleName.toLowerCase().includes(q);
    }
    return true;
  });

  const openEdit = (p: Profile) => {
    setEditForm({ full_name: p.full_name, role_id: p.role_id || "", active: p.active, new_password: "" });
    setEditProfile(p);
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editProfile) return;
    // Update profile (name, role, active)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editForm.full_name.trim() || editProfile.full_name, role_id: editForm.role_id || null, active: editForm.active })
      .eq("id", editProfile.id);
    if (error) { toast.error(error.message); return; }

    // Reset password if provided
    if (editForm.new_password.trim()) {
      if (editForm.new_password.length < 6) {
        toast.error("Password must be at least 6 characters");
        return;
      }
      setResettingPassword(true);
      try {
        const res = await supabase.functions.invoke("reset-user-password", {
          body: { user_id: editProfile.id, new_password: editForm.new_password },
        });
        if (res.error || res.data?.error) {
          toast.error(res.data?.error || res.error?.message || "Failed to reset password");
          setResettingPassword(false);
          return;
        }
        toast.success("Password reset successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to reset password");
        setResettingPassword(false);
        return;
      }
      setResettingPassword(false);
    }

    toast.success("User updated");
    onRefresh();
    setShowEditDialog(false);
  };

  const toggleActive = async (p: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ active: !p.active })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else onRefresh();
  };

  const handleCreateUser = async () => {
    if (!createForm.full_name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: createForm.email.trim(),
          password: createForm.password,
          full_name: createForm.full_name.trim(),
          role_id: createForm.role_id || null,
        },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || "Failed to create user");
      } else {
        toast.success(`User "${createForm.full_name}" created successfully`);
        setShowCreateDialog(false);
        setCreateForm({ full_name: "", email: "", password: "", role_id: "" });
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProfile) return;
    // Delete profile record (cascades from auth if needed)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", deleteProfile.id);
    if (error) toast.error(error.message);
    else { toast.success("User deleted permanently"); onRefresh(); }
    setDeleteProfile(null);
  };

  const activeCount = profiles.filter((u) => u.active).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: profiles.length, icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Active", value: activeCount, icon: UserCheck, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Inactive", value: profiles.length - activeCount, icon: UserX, bg: "bg-orange-500/10", color: "text-orange-600 dark:text-orange-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`w-4.5 h-4.5 ${s.color}`} /></div>
            <div>
              <p className="text-lg font-extrabold text-foreground tabular-nums">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-foreground">User Accounts</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-3.5 h-3.5" /> Create User
            </Button>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 w-[140px] text-xs" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-8 w-[110px] text-xs"><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[90px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
              {filtered.map((u, idx) => {
                const roleName = (u as any).app_roles?.name || "Unassigned";
                const roleObj = roles.find((r) => r.id === u.role_id);
                return (
                  <tr key={u.id} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${idx % 2 ? "bg-muted/10" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: roleObj?.color || "hsl(var(--primary))" }}>
                          {u.full_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.full_name || "Unnamed"}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleColorMap[roleName] || "bg-muted text-muted-foreground border-border"}`}>
                        {roleName}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Switch checked={u.active} onCheckedChange={() => toggleActive(u)} className="scale-75" />
                        <span className={`text-xs font-medium ${u.active ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {u.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground tabular-nums">{u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)} title="Edit"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleActive(u)} title={u.active ? "Deactivate" : "Activate"}>
                          {u.active ? <UserX className="w-3.5 h-3.5 text-orange-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteProfile(u)} title="Delete"><Trash2 className="w-3.5 h-3.5 text-destructive/60" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-muted-foreground text-sm">No users found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit User: {editProfile?.full_name}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Full Name</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="User name" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
              <Select value={editForm.role_id} onValueChange={(v) => setEditForm((p) => ({ ...p, role_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Reset Password</Label>
              <Input type="password" value={editForm.new_password} onChange={(e) => setEditForm((p) => ({ ...p, new_password: e.target.value }))} placeholder="Leave empty to keep current" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm font-medium text-foreground">Active</span>
              <Switch checked={editForm.active} onCheckedChange={(v) => setEditForm((p) => ({ ...p, active: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={resettingPassword}>{resettingPassword ? "Saving..." : "Update"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteProfile} onOpenChange={() => setDeleteProfile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deactivate User</AlertDialogTitle><AlertDialogDescription>Deactivate <strong>{deleteProfile?.full_name}</strong>? They will no longer be able to access the system.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deactivate</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Create New User</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Full Name *</Label>
              <Input value={createForm.full_name} onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="e.g. Dr. Rahman" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Email *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} placeholder="e.g. user@clinicpos.com" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Password *</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
              <Select value={createForm.role_id} onValueChange={(v) => setCreateForm((p) => ({ ...p, role_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateUser} disabled={creating}>{creating ? "Creating..." : "Create User"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Roles Management Tab ───
const RolesManagementTab = ({ roles, onRefresh }: { roles: AppRole[]; onRefresh: () => void }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editRole, setEditRole] = useState<AppRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<AppRole | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "hsl(217, 91%, 60%)" });

  const colorOptions = [
    "hsl(217, 91%, 60%)", "hsl(270, 60%, 55%)", "hsl(142, 71%, 45%)",
    "hsl(15, 85%, 52%)", "hsl(45, 93%, 47%)", "hsl(190, 80%, 45%)",
    "hsl(330, 65%, 50%)", "hsl(0, 72%, 51%)", "hsl(95, 55%, 45%)",
  ];

  const openAdd = () => { setForm({ name: "", description: "", color: colorOptions[Math.floor(Math.random() * colorOptions.length)] }); setEditRole(null); setShowDialog(true); };
  const openEdit = (r: AppRole) => { setForm({ name: r.name, description: r.description, color: r.color }); setEditRole(r); setShowDialog(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Role name is required"); return; }
    if (editRole) {
      const { error } = await supabase.from("app_roles").update({ name: form.name, description: form.description, color: form.color }).eq("id", editRole.id);
      if (error) toast.error(error.message);
      else { toast.success("Role updated"); onRefresh(); }
    } else {
      // Create role and seed empty permissions
      const { data, error } = await supabase.from("app_roles").insert({ name: form.name, description: form.description, color: form.color }).select().single();
      if (error) { toast.error(error.message); return; }
      // Add permission rows for all modules with no access
      const permRows = allModules.map((m) => ({
        role_id: data.id,
        module: m,
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      }));
      await supabase.from("role_permissions").insert(permRows);
      toast.success("Role created");
      onRefresh();
    }
    setShowDialog(false);
  };

  const handleDelete = async () => {
    if (!deleteRole) return;
    const { error } = await supabase.from("app_roles").delete().eq("id", deleteRole.id);
    if (error) toast.error(error.message);
    else { toast.success("Role deleted"); onRefresh(); }
    setDeleteRole(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{roles.length} roles configured</p>
        <Button size="sm" onClick={openAdd} className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Role</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((r) => (
          <div key={r.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: r.color }}>
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{r.name}</p>
                  {r.is_default && <Badge variant="secondary" className="text-[9px] mt-0.5">Default</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(r)}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                {!r.is_default && <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteRole(r)}><Trash2 className="w-3 h-3 text-destructive/60" /></Button>}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{r.description}</p>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRole ? "Edit Role" : "Create New Role"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs font-semibold mb-1.5 block">Role Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Lab Manager" /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Description</Label><Input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Brief role description" /></div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((c) => (
                  <button key={c} onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${form.color === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ background: c }}>
                    {form.color === c && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editRole ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Role</AlertDialogTitle><AlertDialogDescription>Delete the <strong>{deleteRole?.name}</strong> role? Users with this role will need reassignment.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Group Permissions Tab ───
const GroupPermissionsTab = ({ roles, permissionRows, onRefresh }: {
  roles: AppRole[];
  permissionRows: RolePermissionRow[];
  onRefresh: () => void;
}) => {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || "");
  const currentRole = roles.find((r) => r.id === selectedRole);
  const isAdmin = currentRole?.name === "Admin";
  const currentPerms = permissionRows.filter((p) => p.role_id === selectedRole);

  const getModulePerms = (module: string) => {
    const p = currentPerms.find((r) => r.module === module);
    return p || { can_view: false, can_create: false, can_edit: false, can_delete: false };
  };

  const togglePermission = async (module: string, action: PermissionAction) => {
    if (isAdmin) return;
    const perm = currentPerms.find((r) => r.module === module);
    if (!perm) return;
    const key = `can_${action}` as const;
    const { error } = await supabase
      .from("role_permissions")
      .update({ [key]: !perm[key] })
      .eq("id", perm.id);
    if (error) toast.error(error.message);
    else onRefresh();
  };

  const toggleModuleAll = async (module: string, checked: boolean) => {
    if (isAdmin) return;
    const perm = currentPerms.find((r) => r.module === module);
    if (!perm) return;
    const { error } = await supabase
      .from("role_permissions")
      .update({ can_view: checked, can_create: checked, can_edit: checked, can_delete: checked })
      .eq("id", perm.id);
    if (error) toast.error(error.message);
    else onRefresh();
  };

  const toggleGroupAll = async (modules: string[], checked: boolean) => {
    if (isAdmin) return;
    const ids = currentPerms.filter((p) => modules.includes(p.module)).map((p) => p.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from("role_permissions")
      .update({ can_view: checked, can_create: checked, can_edit: checked, can_delete: checked })
      .in("id", ids);
    if (error) toast.error(error.message);
    else onRefresh();
  };

  const isModuleAllChecked = (module: string) => {
    const p = getModulePerms(module);
    return p.can_view && p.can_create && p.can_edit && p.can_delete;
  };
  const isGroupAllChecked = (modules: string[]) => modules.every((m) => isModuleAllChecked(m));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-semibold whitespace-nowrap">Select Role:</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="h-9 w-[200px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
          </Select>
          {currentRole && (
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: currentRole.color }} />
          )}
        </div>
        {isAdmin && (
          <Badge variant="default" className="text-xs gap-1"><Shield className="w-3 h-3" /> Full Access (Admin)</Badge>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[250px]">Module</th>
                <th className="px-3 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[60px]">All</th>
                {permissionActions.map((a) => (
                  <th key={a} className="px-3 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[80px]">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systemModules.map((group) => (
                <>
                  <tr key={`group-${group.group}`} className="bg-muted/20 border-b border-border/60">
                    <td className="px-5 py-2.5">
                      <span className="text-xs font-bold text-foreground">{group.group}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Checkbox
                        checked={isAdmin || isGroupAllChecked(group.modules)}
                        disabled={isAdmin}
                        onCheckedChange={(v) => toggleGroupAll(group.modules, !!v)}
                        className="mx-auto"
                      />
                    </td>
                    {permissionActions.map((a) => <td key={a} className="px-3 py-2.5" />)}
                  </tr>
                  {group.modules.map((mod, idx) => {
                    const perms = getModulePerms(mod);
                    return (
                      <tr key={mod} className={`border-b border-border/30 hover:bg-muted/10 transition-colors ${idx % 2 ? "" : "bg-background/50"}`}>
                        <td className="px-5 py-2.5 pl-9">
                          <span className="text-xs font-medium text-foreground">{mod}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <Checkbox
                            checked={isAdmin || isModuleAllChecked(mod)}
                            disabled={isAdmin}
                            onCheckedChange={(v) => toggleModuleAll(mod, !!v)}
                            className="mx-auto"
                          />
                        </td>
                        {permissionActions.map((action) => (
                          <td key={action} className="px-3 py-2.5 text-center">
                            <Checkbox
                              checked={isAdmin || perms[`can_${action}` as keyof typeof perms] as boolean}
                              disabled={isAdmin}
                              onCheckedChange={() => togglePermission(mod, action)}
                              className="mx-auto"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permission Summary */}
      {currentPerms.length > 0 && !isAdmin && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">Permission Summary for {currentRole?.name}</h4>
          <div className="flex flex-wrap gap-1.5">
            {currentPerms
              .filter((m) => m.can_view || m.can_create || m.can_edit || m.can_delete)
              .map((m) => {
                const active = permissionActions.filter((a) => m[`can_${a}` as keyof typeof m]);
                return (
                  <Badge key={m.module} variant="secondary" className="text-[10px] gap-1">
                    {m.module}
                    <span className="text-muted-foreground">({active.join(", ")})</span>
                  </Badge>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───
const UsersAccessPage = () => {
  const { signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [permissionRows, setPermissionRows] = useState<RolePermissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [profilesRes, rolesRes, permsRes] = await Promise.all([
      supabase.from("profiles").select("*, app_roles(name)"),
      supabase.from("app_roles").select("*").order("created_at"),
      supabase.from("role_permissions").select("*"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as any);
    if (rolesRes.data) setRoles(rolesRes.data as any);
    if (permsRes.data) setPermissionRows(permsRes.data as any);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Users & Access" description="Manage user accounts, roles and permissions" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <PageHeader title="Users & Access" description="Manage user accounts, roles and permissions" />
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={signOut}>
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </Button>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="w-full justify-start h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" /> User Management
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1.5 text-xs">
            <KeyRound className="w-3.5 h-3.5" /> Roles Management
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-1.5 text-xs">
            <Settings2 className="w-3.5 h-3.5" /> Group Permissions
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="users" className="mt-0">
            <UserManagementTab profiles={profiles} roles={roles} onRefresh={fetchAll} />
          </TabsContent>
          <TabsContent value="roles" className="mt-0">
            <RolesManagementTab roles={roles} onRefresh={fetchAll} />
          </TabsContent>
          <TabsContent value="permissions" className="mt-0">
            <GroupPermissionsTab roles={roles} permissionRows={permissionRows} onRefresh={fetchAll} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default UsersAccessPage;
