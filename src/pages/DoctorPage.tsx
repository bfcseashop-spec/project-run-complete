import { useState, useRef, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import { Checkbox } from "@/components/ui/checkbox";
import DataTable from "@/components/DataTable";
import DataGridView from "@/components/DataGridView";
import DataToolbar from "@/components/DataToolbar";
import StatusBadge from "@/components/StatusBadge";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Pencil, Trash2, Eye, Printer, Search, Users, UserCheck, UserX,
  Stethoscope, Upload, X, Phone, Mail, MapPin, GraduationCap, Barcode as BarcodeIcon,
  CalendarDays, Clock, CalendarOff,
} from "lucide-react";
import { useDataToolbar } from "@/hooks/use-data-toolbar";
import { printRecordReport, printBarcode } from "@/lib/printUtils";
import {
  getDoctors, subscribeDoctors, addDoctor as addDoctorStore,
  updateDoctor as updateDoctorStore, removeDoctor as removeDoctorStore,
  type Doctor, type DoctorSchedule,
} from "@/data/doctorStore";
import { toast } from "sonner";

const allDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const leaveTypes = ["Day Off", "Leave", "BL (Bereavement Leave)", "UL (Unpaid Leave)", "SL (Sick Leave)", "CL (Casual Leave)"];


const defaultSpecialties = [
  "General Medicine", "Pathology", "Orthopedics", "Dermatology", "Cardiology",
  "Neurology", "Pediatrics", "Gynecology", "ENT", "Ophthalmology",
  "Radiology", "Psychiatry", "Urology", "Oncology", "Dentistry",
];

const defaultSchedule: DoctorSchedule = {
  workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
  shiftStart: "09:00", shiftEnd: "17:00", leaveType: "", leaveNote: "",
};

const emptyForm: Omit<Doctor, "id"> = {
  name: "", specialty: "", qualification: "", phone: "", email: "", address: "",
  experience: 0, consultationFee: 0, bio: "", status: "active", patients: 0,
  photo: "", joinDate: new Date().toISOString().split("T")[0],
  schedule: { ...defaultSchedule },
};

const DoctorPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>(getDoctors());

  useEffect(() => {
    const unsub = subscribeDoctors(() => setDoctors([...getDoctors()]));
    return () => unsub();
  }, []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [viewDoctor, setViewDoctor] = useState<Doctor | null>(null);
  const [deleteDoctor, setDeleteDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState<Omit<Doctor, "id">>(emptyForm);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSpecialty, setFilterSpecialty] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openAdd = () => { setEditDoctor(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (d: Doctor) => {
    setEditDoctor(d);
    const { id, ...rest } = d;
    setForm(rest);
    setDialogOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, photo: url }));
    toast.success("Photo added");
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!form.name || !form.specialty || !form.phone) {
      toast.error("Please fill in Name, Specialty, and Phone");
      return;
    }
    try {
      if (editDoctor) {
        await updateDoctorStore(editDoctor.id, { ...editDoctor, ...form });
        toast.success("Doctor updated successfully");
      } else {
        const nextId = `D${String(doctors.length + 1).padStart(3, "0")}`;
        await addDoctorStore({ id: nextId, ...form });
        toast.success("Doctor added successfully");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error("Failed to save doctor");
    }
  };

  const handleDelete = async () => {
    if (deleteDoctor) {
      try {
        await removeDoctorStore(deleteDoctor.id);
        setDeleteDoctor(null);
        toast.success("Doctor removed");
      } catch (err) {
        toast.error("Failed to delete doctor");
      }
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedIds) {
        await removeDoctorStore(id);
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      toast.success("Selected doctors removed");
    } catch (err) {
      toast.error("Failed to delete doctors");
    }
  };

  const handlePrint = (d: Doctor) => {
    printRecordReport({
      id: d.id, sectionTitle: "Doctor Profile", photo: d.photo || undefined,
      fields: [
        { label: "Name", value: d.name }, { label: "Specialty", value: d.specialty },
        { label: "Qualification", value: d.qualification }, { label: "Phone", value: d.phone },
        { label: "Email", value: d.email }, { label: "Experience", value: `${d.experience} years` },
        { label: "Consultation Fee", value: `$${d.consultationFee}` }, { label: "Status", value: d.status },
        { label: "Join Date", value: d.joinDate }, { label: "Total Patients", value: String(d.patients) },
        { label: "Working Days", value: d.schedule.workingDays.map((d) => d.slice(0, 3)).join(", ") },
        { label: "Shift", value: `${d.schedule.shiftStart} – ${d.schedule.shiftEnd}` },
        { label: "Leave Status", value: d.schedule.leaveType || "Active (No Leave)" },
      ],
    });
  };

  const filtered = doctors.filter((d) => {
    const matchSearch = searchTerm === "" ||
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    const matchSpecialty = filterSpecialty === "all" || d.specialty === filterSpecialty;
    return matchSearch && matchStatus && matchSpecialty;
  });

  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter((d) => d.status === "active").length;
  const inactiveDoctors = doctors.filter((d) => d.status === "inactive").length;
  const totalPatients = doctors.reduce((sum, d) => sum + d.patients, 0);

  const specialties = [...new Set(doctors.map((d) => d.specialty))];

  const getInitials = (name: string) => name.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const columns = [
    { key: "id", header: "ID" },
    {
      key: "name", header: "Doctor",
      render: (d: Doctor) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-primary/20">
            {d.photo ? <AvatarImage src={d.photo} alt={d.name} /> : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(d.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-card-foreground text-sm">{d.name}</p>
            <p className="text-xs text-muted-foreground">{d.qualification}</p>
          </div>
        </div>
      ),
    },
    {
      key: "specialty", header: "Specialty",
      render: (d: Doctor) => (
        <Badge variant="outline" className="border-primary/30 text-primary font-medium">{d.specialty}</Badge>
      ),
    },
    { key: "phone", header: "Contact" },
    {
      key: "experience", header: "Experience",
      render: (d: Doctor) => <span className="font-medium">{d.experience} yrs</span>,
    },
    {
      key: "patients", header: "Patients",
      render: (d: Doctor) => <span className="font-semibold text-card-foreground">{d.patients}</span>,
    },
    {
      key: "status", header: "Status",
      render: (d: Doctor) => <StatusBadge status={d.status} />,
    },
    {
      key: "actions", header: "Actions",
      render: (d: Doctor) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-info/10" title="View" onClick={() => setViewDoctor(d)}>
            <Eye className="w-3.5 h-3.5 text-info" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-warning/10" title="Edit" onClick={() => openEdit(d)}>
            <Pencil className="w-3.5 h-3.5 text-warning" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" title="Print" onClick={() => handlePrint(d)}>
            <Printer className="w-3.5 h-3.5 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent/50" title="Barcode" onClick={() => printBarcode(d.id, d.name)}>
            <BarcodeIcon className="w-3.5 h-3.5 text-accent-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10" title="Delete" onClick={() => setDeleteDoctor(d)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  const toolbar = useDataToolbar({ data: doctors as unknown as Record<string, unknown>[], dateKey: "joinDate", columns: columns.map((c) => ({ key: c.key, header: c.header })), title: "Doctors" });

  const handleImport = async (file: File) => {
    const rows = await toolbar.handleImport(file);
    if (rows.length > 0) {
      const nextId = doctors.length + 1;
      const newDoctors: Doctor[] = rows.map((row, i) => ({
        id: `D${String(nextId + i).padStart(3, "0")}`,
        name: String(row.name || ""),
        specialty: String(row.specialty || "General Medicine"),
        qualification: String(row.qualification || ""),
        phone: String(row.phone || ""),
        email: String(row.email || ""),
        address: String(row.address || ""),
        experience: Number(row.experience) || 0,
        consultationFee: Number(row.consultationFee) || 0,
        bio: String(row.bio || ""),
        status: "active" as const,
        patients: Number(row.patients) || 0,
        photo: "",
        joinDate: String(row.joinDate || new Date().toISOString().split("T")[0]),
        schedule: { ...defaultSchedule },
      }));
      for (const doc of newDoctors) {
        await addDoctorStore(doc);
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Management" description="Manage doctor profiles, schedules, and assignments">
        {selectedIds.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete ({selectedIds.size})
          </Button>
        )}
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add Doctor</Button>
      </PageHeader>

      <DataToolbar dateFilter={toolbar.dateFilter} onDateFilterChange={toolbar.setDateFilter} viewMode={toolbar.viewMode} onViewModeChange={toolbar.setViewMode} onExportExcel={toolbar.handleExportExcel} onExportPDF={toolbar.handleExportPDF} onImport={handleImport} onDownloadSample={toolbar.handleDownloadSample} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Doctors" value={String(totalDoctors)} icon={Stethoscope} />
        <StatCard title="Active" value={String(activeDoctors)} icon={UserCheck} />
        <StatCard title="Inactive" value={String(inactiveDoctors)} icon={UserX} />
        <StatCard title="Total Patients" value={String(totalPatients)} icon={Users} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, specialty, or ID..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Specialty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specialties</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {toolbar.viewMode === "list" ? (
        <DataTable columns={columns} data={filtered} keyExtractor={(d) => d.id} selectable selectedKeys={selectedIds} onSelectionChange={setSelectedIds} />
      ) : (
        <DataGridView columns={columns} data={filtered} keyExtractor={(d) => d.id} />
      )}

      {/* Weekly Schedule Overview */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-muted/40 border-b border-border">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4.5 h-4.5 text-primary" />
            <span className="text-sm font-bold text-card-foreground">Weekly Schedule Overview</span>
            <Badge variant="secondary" className="text-[10px]">{doctors.length} doctors</Badge>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary/80" /> Working</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> Off</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> On Leave</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[200px] sticky left-0 bg-muted/20">Doctor</th>
                {allDays.map((day) => (
                  <th key={day} className="text-center px-2 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[90px]">{day.slice(0, 3)}</th>
                ))}
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">Shift</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[100px]">Status</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => {
                const onLeave = !!doc.schedule.leaveType;
                return (
                  <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 sticky left-0 bg-card">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 border border-primary/20">
                          {doc.photo ? <AvatarImage src={doc.photo} alt={doc.name} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">{getInitials(doc.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-xs text-card-foreground leading-tight">{doc.name}</p>
                          <p className="text-[10px] text-muted-foreground">{doc.specialty}</p>
                        </div>
                      </div>
                    </td>
                    {allDays.map((day) => {
                      const isWorking = doc.schedule.workingDays.includes(day);
                      return (
                        <td key={day} className="text-center px-2 py-2.5">
                          {onLeave ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/30" title={doc.schedule.leaveType}>
                              <CalendarOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            </span>
                          ) : isWorking ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10">
                              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted/50">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/25" />
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="text-center px-3 py-2.5">
                      <span className="text-xs font-medium text-muted-foreground">{doc.schedule.shiftStart} – {doc.schedule.shiftEnd}</span>
                    </td>
                    <td className="text-center px-3 py-2.5">
                      {onLeave ? (
                        <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20">{doc.schedule.leaveType}</Badge>
                      ) : doc.status === "active" ? (
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">Inactive</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!viewDoctor} onOpenChange={(open) => !open && setViewDoctor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Doctor Profile</DialogTitle>
            <DialogDescription>Viewing profile for {viewDoctor?.name}</DialogDescription>
          </DialogHeader>
          {viewDoctor && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <Avatar className="h-16 w-16 border-2 border-primary/30 shadow-md">
                  {viewDoctor.photo ? <AvatarImage src={viewDoctor.photo} alt={viewDoctor.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{getInitials(viewDoctor.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">{viewDoctor.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="border-primary/30 text-primary text-xs">{viewDoctor.specialty}</Badge>
                    <StatusBadge status={viewDoctor.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{viewDoctor.qualification}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Phone</p><p className="font-medium">{viewDoctor.phone}</p></div></div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{viewDoctor.email || "—"}</p></div></div>
                <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Address</p><p className="font-medium">{viewDoctor.address || "—"}</p></div></div>
                <div className="flex items-center gap-2"><GraduationCap className="w-3.5 h-3.5 text-muted-foreground" /><div><p className="text-muted-foreground text-xs">Experience</p><p className="font-medium">{viewDoctor.experience} years</p></div></div>
                <div><p className="text-muted-foreground text-xs">Consultation Fee</p><p className="font-medium">${viewDoctor.consultationFee}</p></div>
                <div><p className="text-muted-foreground text-xs">Join Date</p><p className="font-medium">{viewDoctor.joinDate}</p></div>
                <div><p className="text-muted-foreground text-xs">Total Patients</p><p className="font-semibold text-card-foreground">{viewDoctor.patients}</p></div>
                <div><p className="text-muted-foreground text-xs">Doctor ID</p><p className="font-mono text-xs">{viewDoctor.id}</p></div>
              </div>

              {/* Schedule Section in View */}
              <div className="pt-3 border-t border-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <CalendarDays className="w-3.5 h-3.5" /> Working Schedule
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allDays.map((day) => (
                    <span key={day} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${viewDoctor.schedule.workingDays.includes(day) ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted/50 text-muted-foreground line-through border border-transparent"}`}>
                      {day.slice(0, 3)}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-muted-foreground text-xs">Shift</p><p className="font-medium">{viewDoctor.schedule.shiftStart} – {viewDoctor.schedule.shiftEnd}</p></div>
                  <div>
                    <p className="text-muted-foreground text-xs">Leave Status</p>
                    <p className="font-medium">
                      {viewDoctor.schedule.leaveType ? (
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">{viewDoctor.schedule.leaveType}</Badge>
                      ) : (
                        <span className="text-emerald-600 text-xs font-semibold">Active (No Leave)</span>
                      )}
                    </p>
                  </div>
                </div>
                {viewDoctor.schedule.leaveNote && (
                  <p className="text-xs text-muted-foreground italic">Note: {viewDoctor.schedule.leaveNote}</p>
                )}
              </div>

              {viewDoctor.bio && (
                <div className="text-sm pt-2 border-t border-border">
                  <p className="text-muted-foreground text-xs mb-1">Bio</p>
                  <p className="text-card-foreground leading-relaxed">{viewDoctor.bio}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDoctor(null)}>Close</Button>
            <Button variant="ghost" className="text-warning" onClick={() => { const d = viewDoctor; setViewDoctor(null); if (d) openEdit(d); }}>
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Button>
            <Button variant="ghost" className="text-primary" onClick={() => { if (viewDoctor) handlePrint(viewDoctor); }}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Doctor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
            <DialogDescription>{editDoctor ? `Editing ${editDoctor.name}` : "Enter the doctor's details below"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Photo Upload */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-dashed border-primary/30 cursor-pointer hover:border-primary/60 transition-colors" onClick={() => fileInputRef.current?.click()}>
                  {form.photo ? <AvatarImage src={form.photo} alt="Doctor photo" /> : null}
                  <AvatarFallback className="bg-primary/5 text-primary">
                    <Upload className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                {form.photo && (
                  <button
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:bg-destructive/80"
                    onClick={() => setForm((prev) => ({ ...prev, photo: "" }))}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <Label className="text-sm font-semibold">Doctor Photo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Click the avatar or button to upload. Max 5MB, JPG/PNG.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Photo
                </Button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
            </div>

            {/* Name & Specialty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input placeholder="Dr. John Doe" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <Label>Specialty *</Label>
                <Select value={form.specialty} onValueChange={(v) => setForm((p) => ({ ...p, specialty: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent>
                    {defaultSpecialties.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Qualification & Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qualification</Label>
                <Input placeholder="MBBS, MD" value={form.qualification} onChange={(e) => setForm((p) => ({ ...p, qualification: e.target.value }))} />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input placeholder="+1-555-0100" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            {/* Email & Address */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input placeholder="doctor@clinic.com" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <Label>Address</Label>
                <Input placeholder="123 Medical Lane" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
              </div>
            </div>

            {/* Experience, Fee, Status */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Experience (Years)</Label>
                <Input type="number" min={0} value={form.experience} onChange={(e) => setForm((p) => ({ ...p, experience: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Consultation Fee ($)</Label>
                <Input type="number" min={0} value={form.consultationFee} onChange={(e) => setForm((p) => ({ ...p, consultationFee: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: "active" | "inactive") => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Join Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Join Date</Label>
                <Input type="date" value={form.joinDate} onChange={(e) => setForm((p) => ({ ...p, joinDate: e.target.value }))} />
              </div>
              <div>
                <Label>Total Patients</Label>
                <Input type="number" min={0} value={form.patients} onChange={(e) => setForm((p) => ({ ...p, patients: Number(e.target.value) }))} />
              </div>
            </div>

            {/* Working Schedule */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b border-border">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Working Schedule</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Working Days */}
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Working Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {allDays.map((day) => {
                      const checked = form.schedule.workingDays.includes(day);
                      return (
                        <label key={day} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${checked ? "bg-primary/10 border-primary/40 text-primary font-semibold" : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"}`}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const days = v
                                ? [...form.schedule.workingDays, day]
                                : form.schedule.workingDays.filter((d) => d !== day);
                              setForm((p) => ({ ...p, schedule: { ...p.schedule, workingDays: days } }));
                            }}
                            className="h-3.5 w-3.5"
                          />
                          {day.slice(0, 3)}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Shift Timing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Shift Start
                    </Label>
                    <Input type="time" value={form.schedule.shiftStart} onChange={(e) => setForm((p) => ({ ...p, schedule: { ...p.schedule, shiftStart: e.target.value } }))} />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Shift End
                    </Label>
                    <Input type="time" value={form.schedule.shiftEnd} onChange={(e) => setForm((p) => ({ ...p, schedule: { ...p.schedule, shiftEnd: e.target.value } }))} />
                  </div>
                </div>

                {/* Leave / Day Off */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block flex items-center gap-1.5">
                      <CalendarOff className="w-3 h-3" /> Leave Status
                    </Label>
                    <Select value={form.schedule.leaveType || "none"} onValueChange={(v) => setForm((p) => ({ ...p, schedule: { ...p.schedule, leaveType: v === "none" ? "" : v } }))}>
                      <SelectTrigger><SelectValue placeholder="No Leave" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Leave (Active)</SelectItem>
                        {leaveTypes.map((lt) => <SelectItem key={lt} value={lt}>{lt}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold mb-1.5 block">Leave Note</Label>
                    <Input placeholder="e.g. Returns on Monday" value={form.schedule.leaveNote} onChange={(e) => setForm((p) => ({ ...p, schedule: { ...p.schedule, leaveNote: e.target.value } }))} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label>Bio / Notes</Label>
              <Textarea placeholder="Brief bio or notes about the doctor..." rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editDoctor ? "Update Doctor" : "Add Doctor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteDoctor} onOpenChange={(open) => !open && setDeleteDoctor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Doctor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteDoctor?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Doctors</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the selected doctors.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorPage;
