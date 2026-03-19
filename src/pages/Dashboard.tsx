import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  ClipboardList, TrendingUp, Calendar
} from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const patientData = [
  { month: "Jan", patients: 120 }, { month: "Feb", patients: 145 },
  { month: "Mar", patients: 160 }, { month: "Apr", patients: 138 },
  { month: "May", patients: 175 }, { month: "Jun", patients: 190 },
];

const revenueData = [
  { month: "Jan", revenue: 45000 }, { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 }, { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 }, { month: "Jun", revenue: 67000 },
];

const departmentData = [
  { name: "OPD", value: 40 },
  { name: "Lab Tests", value: 25 },
  { name: "X-Ray", value: 15 },
  { name: "Ultrasound", value: 12 },
  { name: "Other", value: 8 },
];

const COLORS = [
  "hsl(168, 80%, 30%)", "hsl(200, 80%, 45%)", "hsl(38, 92%, 50%)",
  "hsl(152, 60%, 40%)", "hsl(215, 25%, 60%)",
];

const recentPatients = [
  { id: "P-1024", name: "Sarah Johnson", type: "OPD Visit", doctor: "Dr. Smith", time: "10 min ago" },
  { id: "P-1025", name: "Michael Chen", type: "Lab Test", doctor: "Dr. Patel", time: "25 min ago" },
  { id: "P-1026", name: "Emily Davis", type: "X-Ray", doctor: "Dr. Williams", time: "1 hr ago" },
  { id: "P-1027", name: "James Wilson", type: "Ultrasound", doctor: "Dr. Brown", time: "2 hrs ago" },
  { id: "P-1028", name: "Maria Garcia", type: "Follow-up", doctor: "Dr. Lee", time: "3 hrs ago" },
];

const upcomingAppointments = [
  { patient: "Robert Taylor", doctor: "Dr. Smith", time: "2:00 PM", type: "Consultation" },
  { patient: "Lisa Anderson", doctor: "Dr. Patel", time: "2:30 PM", type: "Lab Review" },
  { patient: "David Martinez", doctor: "Dr. Williams", time: "3:00 PM", type: "X-Ray" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your clinic's performance and activity" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Patients" value="1,284" change="+12% from last month" changeType="positive" />
        <StatCard icon={Stethoscope} title="Today's OPD" value="47" change="8 in queue" changeType="neutral" />
        <StatCard icon={TestTube} title="Pending Tests" value="23" change="-5 from yesterday" changeType="positive" />
        <StatCard icon={DollarSign} title="Revenue (MTD)" value="$67,450" change="+18% from last month" changeType="positive" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Patient Visits</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={patientData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
              <Tooltip />
              <Bar dataKey="patients" fill="hsl(168, 80%, 30%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 18%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 12%, 50%)" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="hsl(200, 80%, 45%)" strokeWidth={2} dot={{ fill: "hsl(200, 80%, 45%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent patients */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Department Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={departmentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {departmentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Recent Patients
          </h3>
          <div className="space-y-3">
            {recentPatients.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.type} • {p.doctor}</p>
                </div>
                <span className="text-xs text-muted-foreground">{p.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Upcoming Appointments
          </h3>
          <div className="space-y-3">
            {upcomingAppointments.map((a, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{a.patient}</p>
                  <p className="text-xs text-muted-foreground">{a.doctor} • {a.type}</p>
                </div>
                <span className="text-xs font-medium text-primary">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
