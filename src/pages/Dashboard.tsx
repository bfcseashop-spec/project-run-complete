import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Calendar, Syringe, ScanLine, Heart, FileText,
  Activity, Clock, Zap, ArrowRight,
  Banknote, CreditCard, Building2, Landmark,
  ClipboardList,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DashboardDateFilter, { DashboardFilterPreset, getPresetRange } from "@/components/DashboardDateFilter";
import PaymentMethodChart from "@/components/PaymentMethodChart";
import { getBillingRecords, subscribeBilling } from "@/data/billingStore";
import { parseISO, isWithinInterval } from "date-fns";

/* ── Static Data ── */
const weeklyData = [
  { day: "Mon", visits: 32 }, { day: "Tue", visits: 28 }, { day: "Wed", visits: 45 },
  { day: "Thu", visits: 38 }, { day: "Fri", visits: 42 }, { day: "Sat", visits: 22 }, { day: "Sun", visits: 12 },
];

const departmentData = [
  { name: "OPD", value: 40, fill: "hsl(160, 84%, 39%)" },
  { name: "Lab Tests", value: 25, fill: "hsl(200, 80%, 45%)" },
  { name: "X-Ray", value: 15, fill: "hsl(38, 92%, 50%)" },
  { name: "Ultrasound", value: 12, fill: "hsl(270, 60%, 55%)" },
  { name: "Other", value: 8, fill: "hsl(350, 65%, 55%)" },
];

const recentActivity = [
  { id: "BIL-001", type: "Billing", description: "Invoice — Sarah Johnson", time: "5 min ago", icon: DollarSign, color: "hsl(142, 71%, 45%)" },
  { id: "LT-501", type: "Lab Test", description: "CBC — Michael Chen", time: "12 min ago", icon: TestTube, color: "hsl(200, 80%, 45%)" },
  { id: "RX-201", type: "Rx", description: "Prescription — Dr. Smith", time: "20 min ago", icon: FileText, color: "hsl(270, 60%, 55%)" },
  { id: "SC-3001", type: "Sample", description: "Blood sample — Sarah J.", time: "30 min ago", icon: Syringe, color: "hsl(38, 92%, 50%)" },
  { id: "XR-2001", type: "X-Ray", description: "Chest PA — James Wilson", time: "45 min ago", icon: ScanLine, color: "hsl(350, 65%, 55%)" },
];

const upcomingAppointments = [
  { patient: "Robert Taylor", doctor: "Dr. Smith", time: "2:00 PM", type: "Consult", avatar: "RT", color: "hsl(160, 84%, 39%)" },
  { patient: "Lisa Anderson", doctor: "Dr. Patel", time: "2:30 PM", type: "Lab Review", avatar: "LA", color: "hsl(200, 80%, 45%)" },
  { patient: "David Martinez", doctor: "Dr. Williams", time: "3:00 PM", type: "X-Ray", avatar: "DM", color: "hsl(38, 92%, 50%)" },
  { patient: "Emma Thompson", doctor: "Dr. Lee", time: "3:30 PM", type: "Follow-up", avatar: "ET", color: "hsl(270, 60%, 55%)" },
];

const operationsData = [
  { icon: Users, label: "Register Patient", desc: "New OPD registration", path: "/opd", color: "hsl(160, 84%, 39%)", bg: "linear-gradient(135deg, hsl(160,84%,39%), hsl(160,84%,30%))" },
  { icon: TestTube, label: "Lab Tests", desc: "Order & manage tests", path: "/lab-tests", color: "hsl(200, 80%, 45%)", bg: "linear-gradient(135deg, hsl(200,80%,45%), hsl(200,80%,35%))" },
  { icon: FileText, label: "Prescription", desc: "Write prescriptions", path: "/prescription", color: "hsl(270, 60%, 55%)", bg: "linear-gradient(135deg, hsl(270,60%,55%), hsl(270,60%,42%))" },
  { icon: DollarSign, label: "New Invoice", desc: "Create billing invoice", path: "/billing/new", color: "hsl(142, 71%, 45%)", bg: "linear-gradient(135deg, hsl(142,71%,45%), hsl(142,71%,35%))" },
  { icon: ScanLine, label: "X-Ray", desc: "Request imaging", path: "/x-ray", color: "hsl(38, 92%, 50%)", bg: "linear-gradient(135deg, hsl(38,92%,50%), hsl(38,92%,40%))" },
  { icon: Syringe, label: "Injections", desc: "Administer injections", path: "/injections", color: "hsl(350, 65%, 55%)", bg: "linear-gradient(135deg, hsl(350,65%,55%), hsl(350,65%,42%))" },
  { icon: Pill, label: "Medicine", desc: "Medicine inventory", path: "/medicine", color: "hsl(215, 60%, 55%)", bg: "linear-gradient(135deg, hsl(215,60%,55%), hsl(215,60%,42%))" },
  { icon: Heart, label: "Health Services", desc: "Manage services", path: "/health-services", color: "hsl(340, 70%, 55%)", bg: "linear-gradient(135deg, hsl(340,70%,55%), hsl(340,70%,42%))" },
];

const paymentMeta: Record<string, { color: string; icon: React.ElementType }> = {
  Cash: { color: "hsl(142, 71%, 45%)", icon: Banknote },
  ABA: { color: "hsl(217, 91%, 60%)", icon: Building2 },
  ACleda: { color: "hsl(38, 92%, 50%)", icon: Landmark },
  Card: { color: "hsl(270, 60%, 55%)", icon: CreditCard },
};

/* ── Dashboard ── */
const Dashboard = () => {
  useSettings();
  const [filterPreset, setFilterPreset] = useState<DashboardFilterPreset>("today");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [billingRecords, setBillingRecords] = useState(getBillingRecords());
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => subscribeBilling(() => setBillingRecords([...getBillingRecords()])), []);

  const filteredBilling = useMemo(() => {
    const range = filterPreset === "custom" && customRange ? customRange : getPresetRange(filterPreset);
    return billingRecords.filter((r) => {
      try { return isWithinInterval(parseISO(r.date), { start: range.from, end: range.to }); }
      catch { return false; }
    });
  }, [billingRecords, filterPreset, customRange]);

  const paymentData = useMemo(() => {
    const methods = ["Cash", "ABA", "ACleda", "Card"];
    return methods.map((name) => {
      const matching = filteredBilling.filter((r) => r.method === name);
      const meta = paymentMeta[name];
      return { name, amount: matching.reduce((s, r) => s + r.paid, 0), count: matching.length, color: meta.color, icon: meta.icon };
    });
  }, [filteredBilling]);

  return (
    <div className="space-y-7 w-full">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 to-primary/70 p-7 text-primary-foreground">
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/5" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">{greeting}, Doctor!</h1>
            <p className="text-primary-foreground/60 text-base mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Activity className="w-5 h-5" />
              <span className="text-xl font-bold font-number">47</span>
              <span className="text-sm opacity-70">patients</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm">
              <Clock className="w-5 h-5" />
              <span className="text-xl font-bold font-number">8</span>
              <span className="text-sm opacity-70">in queue</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Today's Data (includes stats + payment methods) ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black font-heading text-foreground">📊 Today's Data</h2>
          <DashboardDateFilter
            preset={filterPreset}
            customRange={customRange}
            onPresetChange={setFilterPreset}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatCard icon={DollarSign} title="Revenue" value={formatDualPrice(67450)} change="58,200" accentColor="hsl(340, 55%, 50%)" />
          <StatCard icon={ClipboardList} title="Invoices" value="793" change="753" accentColor="hsl(200, 60%, 45%)" />
          <StatCard icon={Users} title="Patients" value="1,284" change="1,150" accentColor="hsl(160, 50%, 38%)" />
          <StatCard icon={Stethoscope} title="Pending" value="47" change="42" accentColor="hsl(260, 45%, 50%)" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={TestTube} title="Lab Tests" value="23" change="28" accentColor="hsl(38, 70%, 48%)" />
          <StatCard icon={Pill} title="Medicines" value="6" change="8" accentColor="hsl(215, 50%, 50%)" />
          <StatCard icon={ScanLine} title="X-Ray" value="8" change="5" accentColor="hsl(142, 50%, 42%)" />
          <StatCard icon={Heart} title="Services" value="7" change="6" accentColor="hsl(350, 50%, 50%)" />
        </div>

        {/* Payment Methods — inside Today's Data, shares the same date filter */}
        <PaymentMethodChart data={paymentData} />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black font-heading text-foreground">⚡ Quick Actions</h2>
          <a href="/system" className="text-sm font-bold text-primary hover:underline">View All →</a>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {operationsData.map((op, i) => (
            <a
              key={i}
              href={op.path}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-card border border-border/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: op.bg }}
              >
                <op.icon className="w-5.5 h-5.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">{op.label}</p>
                <p className="text-xs text-muted-foreground">{op.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* ── Middle Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Activity */}
        <div className="bg-card rounded-2xl border border-border/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-card-foreground font-heading flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-success/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-success" />
              </span>
              Live Activity
            </h3>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
          </div>
          <div className="space-y-2">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm" style={{ background: `${a.color}20` }}>
                  <a.icon className="w-4.5 h-4.5" style={{ color: a.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-card-foreground truncate">{a.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md" style={{ background: `${a.color}15`, color: a.color }}>{a.type}</span>
                    <span className="text-xs text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-card rounded-2xl border border-border/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-card-foreground font-heading flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </span>
              Schedule
            </h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">TODAY</span>
          </div>
          <div className="space-y-2.5">
            {upcomingAppointments.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors" style={{ background: `${a.color}08` }}>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm"
                  style={{ background: a.color }}
                >
                  {a.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-card-foreground truncate">{a.patient}</p>
                  <p className="text-xs text-muted-foreground">{a.doctor}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold font-number" style={{ color: a.color }}>{a.time}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{a.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly + Department */}
        <div className="flex flex-col gap-4">
          <div className="bg-card rounded-2xl border border-border/40 p-5">
            <h3 className="text-base font-bold text-card-foreground font-heading mb-3">📈 This Week</h3>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={weeklyData} barSize={24}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <Bar dataKey="visits" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px", fontWeight: 700 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-2xl border border-border/40 p-5 flex-1">
            <h3 className="text-base font-bold text-card-foreground font-heading mb-3">🏥 Departments</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" paddingAngle={3} strokeWidth={0}>
                    {departmentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5 flex-1">
                {departmentData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-md" style={{ backgroundColor: d.fill }} />
                    <span className="text-sm font-semibold text-card-foreground flex-1">{d.name}</span>
                    <span className="text-sm font-bold font-number" style={{ color: d.fill }}>{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
