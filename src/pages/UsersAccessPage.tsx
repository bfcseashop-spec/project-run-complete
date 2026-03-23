import { useState } from "react";
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
  KeyRound, Settings2, Save, Check,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ───
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin?: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  color: string;
  isDefault?: boolean;
}

type PermissionAction = "view" | "create" | "edit" | "delete";

interface ModulePermission {
  module: string;
  actions: Record<PermissionAction, boolean>;
}

interface RolePermissions {
  roleId: string;
  modules: ModulePermission[];
}

// ─── Data ───
const defaultRoles: Role[] = [
  { id: "admin", name: "Admin", description: "Full system access with all permissions", color: "hsl(var(--primary))", isDefault: true },
  { id: "doctor", name: "Doctor", description: "Medical records, prescriptions, patient care", color: "hsl(217, 91%, 60%)" },
  { id: "nurse", name: "Nurse", description: "Patient vitals, injections, basic care", color: "hsl(142, 71%, 45%)" },
  { id: "receptionist", name: "Receptionist", description: "Patient registration, billing, appointments", color: "hsl(270, 60%, 55%)" },
  { id: "lab-tech", name: "Lab Technician", description: "Lab tests, sample collection, reports", color: "hsl(45, 93%, 47%)" },
  { id: "pharmacist", name: "Pharmacist", description: "Medicine inventory, dispensing", color: "hsl(190, 80%, 45%)" },
];

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

const makeFullAccess = (): Record<PermissionAction, boolean> => ({ view: true, create: true, edit: true, delete: true });
const makeNoAccess = (): Record<PermissionAction, boolean> => ({ view: false, create: false, edit: false, delete: false });

const initialDefaultPermissions: RolePermissions[] = [
  { roleId: "admin", modules: allModules.map((m) => ({ module: m, actions: makeFullAccess() })) },
  { roleId: "doctor", modules: allModules.map((m) => ({ module: m, actions: ["OPD Section", "Prescriptions", "Health Services", "Health Packages", "Injections", "Lab Tests", "Lab Reports", "Dashboard"].includes(m) ? { view: true, create: true, edit: true, delete: false } : { ...makeNoAccess(), view: ["Dashboard", "Medicine", "Doctors"].includes(m) } })) },
  { roleId: "nurse", modules: allModules.map((m) => ({ module: m, actions: ["OPD Section", "Injections"].includes(m) ? { view: true, create: true, edit: true, delete: false } : { ...makeNoAccess(), view: ["Dashboard", "Prescriptions", "Health Services"].includes(m) } })) },
  { roleId: "receptionist", modules: allModules.map((m) => ({ module: m, actions: ["OPD Section", "Billing", "Due Management"].includes(m) ? { view: true, create: true, edit: true, delete: false } : { ...makeNoAccess(), view: ["Dashboard", "Prescriptions", "Refund"].includes(m) } })) },
  { roleId: "lab-tech", modules: allModules.map((m) => ({ module: m, actions: ["Lab Tests", "Lab Reports", "Sample Collection", "Test Names"].includes(m) ? { view: true, create: true, edit: true, delete: false } : { ...makeNoAccess(), view: ["Dashboard", "X-Ray", "Ultrasound"].includes(m) } })) },
  { roleId: "pharmacist", modules: allModules.map((m) => ({ module: m, actions: ["Medicine"].includes(m) ? { view: true, create: true, edit: true, delete: true } : { ...makeNoAccess(), view: ["Dashboard", "Prescriptions", "Billing"].includes(m) } })) },
];

const initialUsers: User[] = [
  { id: 1, name: "Admin User", email: "admin@clinic.com", role: "admin", active: true, lastLogin: "2026-03-23" },
  { id: 2, name: "Dr. Sarah Smith", email: "sarah@clinic.com", role: "doctor", active: true, lastLogin: "2026-03-22" },
  { id: 3, name: "Nurse Priya", email: "priya@clinic.com", role: "nurse", active: true, lastLogin: "2026-03-21" },
  { id: 4, name: "Reception Desk", email: "reception@clinic.com", role: "receptionist", active: false, lastLogin: "2026-03-10" },
];

const roleColorMap: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  doctor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  nurse: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  receptionist: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  "lab-tech": "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  pharmacist: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
};

// ─── User Management Tab ───
const UserManagementTab = ({ users, setUsers, roles }: { users: User[]; setUsers: React.Dispatch<React.SetStateAction<User[]>>; roles: Role[] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: roles[0]?.id || "", active: true });

  const filtered = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (statusFilter === "active" && !u.active) return false;
    if (statusFilter === "inactive" && u.active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const roleName = roles.find((r) => r.id === u.role)?.name || "";
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleName.toLowerCase().includes(q);
    }
    return true;
  });

  const openAdd = () => { setForm({ name: "", email: "", role: roles[1]?.id || roles[0]?.id || "", active: true }); setEditUser(null); setShowDialog(true); };
  const openEdit = (u: User) => { setForm({ name: u.name, email: u.email, role: u.role, active: u.active }); setEditUser(u); setShowDialog(true); };
  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error("Name and email are required"); return; }
    if (editUser) { setUsers((p) => p.map((u) => u.id === editUser.id ? { ...u, ...form } : u)); toast.success("User updated"); }
    else { setUsers((p) => [...p, { ...form, id: Date.now(), lastLogin: undefined }]); toast.success("User added"); }
    setShowDialog(false);
  };
  const handleDelete = () => { if (deleteUser) { setUsers((p) => p.filter((u) => u.id !== deleteUser.id)); toast.success("User removed"); setDeleteUser(null); } };
  const toggleActive = (id: number) => setUsers((p) => p.map((u) => u.id === id ? { ...u, active: !u.active } : u));

  const activeCount = users.filter((u) => u.active).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: Users, bg: "bg-primary/10", color: "text-primary" },
          { label: "Active", value: activeCount, icon: UserCheck, bg: "bg-emerald-500/10", color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Inactive", value: users.length - activeCount, icon: UserX, bg: "bg-orange-500/10", color: "text-orange-600 dark:text-orange-400" },
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
            <Button size="sm" onClick={openAdd} className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add User</Button>
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
                const role = roles.find((r) => r.id === u.role);
                return (
                  <tr key={u.id} className={`border-b border-border/40 hover:bg-muted/20 transition-colors ${idx % 2 ? "bg-muted/10" : ""}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: role?.color || "hsl(var(--primary))" }}>
                          {u.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold border ${roleColorMap[u.role] || "bg-muted text-muted-foreground border-border"}`}>
                        {role?.name || u.role}
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
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(u)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteUser(u)}><Trash2 className="w-3.5 h-3.5 text-destructive/60" /></Button>
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

      {/* User Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editUser ? "Edit User" : "Add New User"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label className="text-xs font-semibold mb-1.5 block">Full Name *</Label><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
            <div>
              <Label className="text-xs font-semibold mb-1.5 block">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
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

      <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove User</AlertDialogTitle><AlertDialogDescription>Remove <strong>{deleteUser?.name}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Roles Management Tab ───
const RolesManagementTab = ({ roles, setRoles }: { roles: Role[]; setRoles: React.Dispatch<React.SetStateAction<Role[]>> }) => {
  const [showDialog, setShowDialog] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "hsl(217, 91%, 60%)" });

  const colorOptions = [
    "hsl(217, 91%, 60%)", "hsl(270, 60%, 55%)", "hsl(142, 71%, 45%)",
    "hsl(15, 85%, 52%)", "hsl(45, 93%, 47%)", "hsl(190, 80%, 45%)",
    "hsl(330, 65%, 50%)", "hsl(0, 72%, 51%)", "hsl(95, 55%, 45%)",
  ];

  const openAdd = () => { setForm({ name: "", description: "", color: colorOptions[Math.floor(Math.random() * colorOptions.length)] }); setEditRole(null); setShowDialog(true); };
  const openEdit = (r: Role) => { setForm({ name: r.name, description: r.description, color: r.color }); setEditRole(r); setShowDialog(true); };
  const handleSave = () => {
    if (!form.name.trim()) { toast.error("Role name is required"); return; }
    if (editRole) { setRoles((p) => p.map((r) => r.id === editRole.id ? { ...r, ...form } : r)); toast.success("Role updated"); }
    else { setRoles((p) => [...p, { ...form, id: form.name.toLowerCase().replace(/\s+/g, "-") }]); toast.success("Role created"); }
    setShowDialog(false);
  };
  const handleDelete = () => { if (deleteRole) { setRoles((p) => p.filter((r) => r.id !== deleteRole.id)); toast.success("Role deleted"); setDeleteRole(null); } };

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
                  {r.isDefault && <Badge variant="secondary" className="text-[9px] mt-0.5">Default</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(r)}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                {!r.isDefault && <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteRole(r)}><Trash2 className="w-3 h-3 text-destructive/60" /></Button>}
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
const GroupPermissionsTab = ({ roles, permissions, setPermissions }: {
  roles: Role[];
  permissions: RolePermissions[];
  setPermissions: React.Dispatch<React.SetStateAction<RolePermissions[]>>;
}) => {
  const [selectedRole, setSelectedRole] = useState(roles[0]?.id || "");
  const currentPerms = permissions.find((p) => p.roleId === selectedRole);
  const currentRole = roles.find((r) => r.id === selectedRole);
  const isAdmin = selectedRole === "admin";

  const togglePermission = (module: string, action: PermissionAction) => {
    if (isAdmin) return; // Admin always has full access
    setPermissions((prev) =>
      prev.map((rp) => {
        if (rp.roleId !== selectedRole) return rp;
        return {
          ...rp,
          modules: rp.modules.map((mp) => {
            if (mp.module !== module) return mp;
            return { ...mp, actions: { ...mp.actions, [action]: !mp.actions[action] } };
          }),
        };
      })
    );
  };

  const toggleModuleAll = (module: string, checked: boolean) => {
    if (isAdmin) return;
    setPermissions((prev) =>
      prev.map((rp) => {
        if (rp.roleId !== selectedRole) return rp;
        return {
          ...rp,
          modules: rp.modules.map((mp) => {
            if (mp.module !== module) return mp;
            return { ...mp, actions: { view: checked, create: checked, edit: checked, delete: checked } };
          }),
        };
      })
    );
  };

  const toggleGroupAll = (groupModules: string[], checked: boolean) => {
    if (isAdmin) return;
    setPermissions((prev) =>
      prev.map((rp) => {
        if (rp.roleId !== selectedRole) return rp;
        return {
          ...rp,
          modules: rp.modules.map((mp) => {
            if (!groupModules.includes(mp.module)) return mp;
            return { ...mp, actions: { view: checked, create: checked, edit: checked, delete: checked } };
          }),
        };
      })
    );
  };

  // Ensure permissions exist for new roles
  const ensurePerms = () => {
    const missing = roles.filter((r) => !permissions.find((p) => p.roleId === r.id));
    if (missing.length > 0) {
      setPermissions((prev) => [
        ...prev,
        ...missing.map((r) => ({
          roleId: r.id,
          modules: allModules.map((m) => ({ module: m, actions: makeNoAccess() })),
        })),
      ]);
    }
  };
  // Run once
  if (roles.some((r) => !permissions.find((p) => p.roleId === r.id))) ensurePerms();

  const getModulePerms = (module: string) => currentPerms?.modules.find((m) => m.module === module)?.actions || makeNoAccess();
  const isModuleAllChecked = (module: string) => { const a = getModulePerms(module); return a.view && a.create && a.edit && a.delete; };
  const isGroupAllChecked = (modules: string[]) => modules.every((m) => isModuleAllChecked(m));

  return (
    <div className="space-y-4">
      {/* Role Selector */}
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
        <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => toast.success("Permissions saved successfully")}>
          <Save className="w-3.5 h-3.5" /> Save Permissions
        </Button>
      </div>

      {/* Permission Matrix */}
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
                  {/* Group Header */}
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
                    {permissionActions.map((a) => (
                      <td key={a} className="px-3 py-2.5" />
                    ))}
                  </tr>
                  {/* Module Rows */}
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
                              checked={isAdmin || perms[action]}
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
      {currentPerms && !isAdmin && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-bold text-foreground mb-2">Permission Summary for {currentRole?.name}</h4>
          <div className="flex flex-wrap gap-1.5">
            {currentPerms.modules
              .filter((m) => m.actions.view || m.actions.create || m.actions.edit || m.actions.delete)
              .map((m) => {
                const activeActions = permissionActions.filter((a) => m.actions[a]);
                return (
                  <Badge key={m.module} variant="secondary" className="text-[10px] gap-1">
                    {m.module}
                    <span className="text-muted-foreground">({activeActions.join(", ")})</span>
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
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [permissions, setPermissions] = useState<RolePermissions[]>(initialDefaultPermissions);

  return (
    <div className="space-y-5">
      <PageHeader title="Users & Access" description="Manage user accounts, roles and permissions" />

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
            <UserManagementTab users={users} setUsers={setUsers} roles={roles} />
          </TabsContent>
          <TabsContent value="roles" className="mt-0">
            <RolesManagementTab roles={roles} setRoles={setRoles} />
          </TabsContent>
          <TabsContent value="permissions" className="mt-0">
            <GroupPermissionsTab roles={roles} permissions={permissions} setPermissions={setPermissions} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default UsersAccessPage;
