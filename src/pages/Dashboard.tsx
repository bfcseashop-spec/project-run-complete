import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  ClipboardList, TrendingUp, Calendar, Syringe, ScanLine, Heart, FileText,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { formatDualPrice, convertToSecondary } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import { useSettings } from "@/hooks/use-settings";

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

const recentActivity = [
  { id: "BIL-001", type: "Billing", description: "Invoice created for Sarah Johnson", time: "5 min ago", icon: DollarSign },
  { id: "LT-501", type: "Lab Test", description: "CBC test ordered for Michael Chen", time: "12 min ago", icon: TestTube },
  { id: "RX-201", type: "Prescription", description: "Prescription issued by Dr. Smith", time: "20 min ago", icon: FileText },
  { id: "SC-3001", type: "Sample", description: "Blood sample collected from Sarah Johnson", time: "30 min ago", icon: ClipboardList },
  { id: "XR-2001", type: "X-Ray", description: "Chest PA ordered for James Wilson", time: "45 min ago", icon: ScanLine },
  { id: "INJ-001", type: "Injection", description: "Ceftriaxone administered to Emily Davis", time: "1 hr ago", icon: Syringe },
];

const upcomingAppointments = [
  { patient: "Robert Taylor", doctor: "Dr. Smith", time: "2:00 PM", type: "Consultation" },
  { patient: "Lisa Anderson", doctor: "Dr. Patel", time: "2:30 PM", type: "Lab Review" },
  { patient: "David Martinez", doctor: "Dr. Williams", time: "3:00 PM", type: "X-Ray" },
];

const Dashboard = () => {
  const settings = useSettings();
  
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your clinic's performance and activity" />

      {/* Stats row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Total Patients" value="1,284" change="+12% from last month" changeType="positive" />
        <StatCard icon={Stethoscope} title="Today's OPD" value="47" change="8 in queue" changeType="neutral" />
        <StatCard icon={TestTube} title="Pending Tests" value="23" change="-5 from yesterday" changeType="positive" />
        <StatCard icon={DollarSign} title="Revenue (MTD)" value={formatDualPrice(67450)} change="+18% from last month" changeType="positive" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Pill} title="Medicines" value="6" change="2 low stock" changeType="negative" />
        <StatCard icon={Syringe} title="Injections" value="10" change="1 out of stock" changeType="negative" />
        <StatCard icon={ScanLine} title="X-Ray Orders" value="8" change="3 pending" changeType="neutral" />
        <StatCard icon={Heart} title="Health Services" value="7" change="5 active" changeType="positive" />
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
        {/* Pie Chart */}
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

        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <a.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-card-foreground truncate">{a.description}</p>
                  <p className="text-xs text-muted-foreground">{a.type} • {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming */}
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
