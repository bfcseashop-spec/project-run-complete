import { useState } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  ClipboardList, TrendingUp, Calendar, Syringe, ScanLine, Heart, FileText,
  Activity, ArrowUpRight, Clock, Zap, ChevronRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from "recharts";
import { formatDualPrice, formatPrice, convertToSecondary } from "@/lib/currency";
import { getSettings } from "@/data/settingsStore";
import { useSettings } from "@/hooks/use-settings";

const patientData = [
  { month: "Jan", patients: 120, returning: 45 }, { month: "Feb", patients: 145, returning: 58 },
  { month: "Mar", patients: 160, returning: 62 }, { month: "Apr", patients: 138, returning: 50 },
  { month: "May", patients: 175, returning: 70 }, { month: "Jun", patients: 190, returning: 78 },
];

const revenueData = [
  { month: "Jan", revenue: 45000 }, { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 }, { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 }, { month: "Jun", revenue: 67000 },
];

const weeklyData = [
  { day: "Mon", visits: 32 }, { day: "Tue", visits: 28 }, { day: "Wed", visits: 45 },
  { day: "Thu", visits: 38 }, { day: "Fri", visits: 42 }, { day: "Sat", visits: 22 }, { day: "Sun", visits: 12 },
];

const departmentData = [
  { name: "OPD", value: 40, fill: "hsl(var(--primary))" },
  { name: "Lab Tests", value: 25, fill: "hsl(200, 80%, 45%)" },
  { name: "X-Ray", value: 15, fill: "hsl(38, 92%, 50%)" },
  { name: "Ultrasound", value: 12, fill: "hsl(270, 60%, 55%)" },
  { name: "Other", value: 8, fill: "hsl(215, 25%, 60%)" },
];

const radialData = [
  { name: "Completed", value: 82, fill: "hsl(var(--primary))" },
];

const recentActivity = [
  { id: "BIL-001", type: "Billing", description: "Invoice created for Sarah Johnson", time: "5 min ago", icon: DollarSign, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { id: "LT-501", type: "Lab Test", description: "CBC test ordered for Michael Chen", time: "12 min ago", icon: TestTube, color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { id: "RX-201", type: "Prescription", description: "Prescription issued by Dr. Smith", time: "20 min ago", icon: FileText, color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { id: "SC-3001", type: "Sample", description: "Blood sample collected from Sarah Johnson", time: "30 min ago", icon: ClipboardList, color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { id: "XR-2001", type: "X-Ray", description: "Chest PA ordered for James Wilson", time: "45 min ago", icon: ScanLine, color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { id: "INJ-001", type: "Injection", description: "Ceftriaxone administered to Emily Davis", time: "1 hr ago", icon: Syringe, color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
];

const upcomingAppointments = [
  { patient: "Robert Taylor", doctor: "Dr. Smith", time: "2:00 PM", type: "Consultation", avatar: "RT" },
  { patient: "Lisa Anderson", doctor: "Dr. Patel", time: "2:30 PM", type: "Lab Review", avatar: "LA" },
  { patient: "David Martinez", doctor: "Dr. Williams", time: "3:00 PM", type: "X-Ray", avatar: "DM" },
  { patient: "Emma Thompson", doctor: "Dr. Lee", time: "3:30 PM", type: "Follow-up", avatar: "ET" },
];

const quickActions = [
  { icon: Users, label: "New Patient", path: "/opd", color: "bg-primary/10 text-primary" },
  { icon: TestTube, label: "Order Test", path: "/lab-tests", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  { icon: FileText, label: "Prescription", path: "/prescription", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  { icon: DollarSign, label: "New Invoice", path: "/billing/new", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
];

const Dashboard = () => {
  const settings = useSettings();
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-6 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold font-heading tracking-tight">{greeting}, Doctor! 👋</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-sm bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-medium">47 patients today</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">8 in queue</span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            {quickActions.map((a, i) => (
              <a key={i} href={a.path} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors min-w-[72px]">
                <a.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{a.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Stats - Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} title="Total Patients" value="1,284" change="+12% from last month" changeType="positive" />
        <StatCard icon={Stethoscope} title="Today's OPD" value="47" change="8 in queue" changeType="neutral" />
        <StatCard icon={TestTube} title="Pending Tests" value="23" change="-5 from yesterday" changeType="positive" />
        <StatCard icon={DollarSign} title="Revenue (MTD)" value={formatDualPrice(67450)} change="+18% from last month" changeType="positive" />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Pill} title="Medicines" value="6" change="2 low stock" changeType="negative" />
        <StatCard icon={Syringe} title="Injections" value="10" change="1 out of stock" changeType="negative" />
        <StatCard icon={ScanLine} title="X-Ray Orders" value="8" change="3 pending" changeType="neutral" />
        <StatCard icon={Heart} title="Health Services" value="7" change="5 active" changeType="positive" />
      </div>

      {/* Bento Grid - Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Revenue Area Chart - Wide */}
        <div className="lg:col-span-8 bg-card rounded-2xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-card-foreground font-heading">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Monthly revenue trend</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">+18%</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatPrice(v)} />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", boxShadow: "0 8px 32px -4px rgba(0,0,0,0.1)" }}
                formatter={(value: number) => [formatDualPrice(value), "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Completion Radial + Dept Pie */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Task Completion */}
          <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-bold text-card-foreground font-heading">Task Completion</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Today's progress</p>
            <div className="flex items-center justify-center mt-2">
              <ResponsiveContainer width={140} height={140}>
                <RadialBarChart innerRadius={50} outerRadius={70} data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="-ml-4">
                <p className="text-3xl font-extrabold text-card-foreground font-heading">82%</p>
                <p className="text-xs text-muted-foreground">completed</p>
              </div>
            </div>
          </div>

          {/* Weekly Visits Mini Chart */}
          <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-card p-5">
            <h3 className="text-sm font-bold text-card-foreground font-heading">This Week</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Daily patient visits</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={weeklyData}>
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} opacity={0.8} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bento Grid - Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Patient Visits Bar Chart */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-card-foreground font-heading">Patient Visits</h3>
              <p className="text-xs text-muted-foreground mt-0.5">New vs Returning patients</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={patientData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="patients" name="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="returning" name="Returning" fill="hsl(200, 80%, 45%)" radius={[4, 4, 0, 0]} opacity={0.65} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-card-foreground font-heading flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Live Activity
            </h3>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="space-y-2.5">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors group cursor-default">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${a.color.split(" ")[0]}`}>
                  <a.icon className={`w-3.5 h-3.5 ${a.color.split(" ").slice(1).join(" ")}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-card-foreground truncate">{a.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{a.type}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Appointments */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border/50 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-card-foreground font-heading flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Schedule
            </h3>
            <span className="text-xs font-bold text-primary">Today</span>
          </div>
          <div className="space-y-2.5">
            {upcomingAppointments.map((a, i) => (
              <div key={i} className="relative p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {a.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-card-foreground truncate">{a.patient}</p>
                    <p className="text-[10px] text-muted-foreground">{a.doctor}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{a.type}</span>
                  <span className="text-xs font-bold text-primary">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Distribution - Full Width */}
      <div className="bg-card rounded-2xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-card-foreground font-heading">Department Distribution</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Patient visits by department</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width={220} height={180}>
            <PieChart>
              <Pie data={departmentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} strokeWidth={0}>
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            {departmentData.map((d, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                <div>
                  <p className="text-sm font-semibold text-card-foreground">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
