import { supabase } from "@/integrations/supabase/client";

export interface DoctorSchedule {
  workingDays: string[];
  shiftStart: string;
  shiftEnd: string;
  leaveType: string;
  leaveNote: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  phone: string;
  email: string;
  address: string;
  experience: number;
  consultationFee: number;
  bio: string;
  status: "active" | "inactive";
  patients: number;
  photo: string;
  joinDate: string;
  schedule: DoctorSchedule;
}

type Listener = () => void;
let _doctors: Doctor[] = [];
let loaded = false;
const _listeners: Set<Listener> = new Set();
const notify = () => _listeners.forEach((fn) => fn());

const defaultSchedule: DoctorSchedule = {
  workingDays: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"],
  shiftStart: "09:00", shiftEnd: "17:00", leaveType: "", leaveNote: "",
};

const toDoctor = (r: any): Doctor => ({
  id: r.id,
  name: r.name,
  specialty: r.specialty,
  qualification: r.qualification,
  phone: r.phone,
  email: r.email,
  address: r.address,
  experience: r.experience,
  consultationFee: r.consultation_fee,
  bio: r.bio,
  status: r.status as "active" | "inactive",
  patients: r.patients,
  photo: r.photo,
  joinDate: r.join_date,
  schedule: r.schedule ? (typeof r.schedule === "string" ? JSON.parse(r.schedule) : r.schedule) : { ...defaultSchedule },
});

const toRow = (d: Doctor) => ({
  id: d.id,
  name: d.name,
  specialty: d.specialty,
  qualification: d.qualification,
  phone: d.phone,
  email: d.email,
  address: d.address,
  experience: d.experience,
  consultation_fee: d.consultationFee,
  bio: d.bio,
  status: d.status,
  patients: d.patients,
  photo: d.photo,
  join_date: d.joinDate,
  schedule: d.schedule as any,
});

const load = async () => {
  const { data, error } = await supabase.from("doctors").select("*").order("created_at", { ascending: false });
  if (!error && data) { _doctors = data.map(toDoctor); loaded = true; notify(); }
};
load();

export function getDoctors(): Doctor[] { return _doctors; }
export function isDoctorsLoaded() { return loaded; }

export async function addDoctor(doctor: Doctor) {
  const { error } = await supabase.from("doctors").insert(toRow(doctor));
  if (error) throw error;
  _doctors = [doctor, ..._doctors]; notify();
}

export async function updateDoctor(id: string, updated: Doctor) {
  const { error } = await supabase.from("doctors").update(toRow(updated)).eq("id", id);
  if (error) throw error;
  _doctors = _doctors.map((d) => (d.id === id ? updated : d)); notify();
}

export async function removeDoctor(id: string) {
  const { error } = await supabase.from("doctors").delete().eq("id", id);
  if (error) throw error;
  _doctors = _doctors.filter((d) => d.id !== id); notify();
}

export function subscribeDoctors(fn: Listener) {
  _listeners.add(fn); return () => { _listeners.delete(fn); };
}

/** Get active doctor names for dropdown use */
export function getActiveDoctorNames(): string[] {
  return _doctors.filter((d) => d.status === "active").map((d) => d.name);
}

/** Get active doctors with details for dropdowns needing specialty/qualification */
export function getActiveDoctorsWithDetails(): { name: string; specialty: string; qualification: string }[] {
  return _doctors
    .filter((d) => d.status === "active")
    .map((d) => ({ name: d.name, specialty: d.specialty, qualification: d.qualification }));
}
