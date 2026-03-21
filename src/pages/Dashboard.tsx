import { useState, useEffect, useMemo } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Calendar, Syringe, ScanLine, Heart, FileText,
  Activity, Clock, Zap, ArrowRight,
  Banknote, CreditCard, Building2, Landmark,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DashboardDateFilter, { DashboardFilterPreset, getPresetRange } from "@/components/DashboardDateFilter";
import PaymentMethodChart from "@/components/PaymentMethodChart";
import { getBillingRecords, subscribeBilling } from "@/data/billingStore";
import { parseISO, isWithinInterval } from "date-fns";

/* ── Static Data ── */
const weeklyData = [
  { day: "M", visits: 32 }, { day: "T", visits: 28 }, { day: "W", visits: 45 },
  { day: "T", visits: 38 }, { day: "F", visits: 42 }, { day: "S", visits: 22 }, { day: "S", visits: 12 },
];

const departmentData = [
  { name: "OPD", value: 40, fill: "hsl(var(--primary))" },
  { name: "Lab Tests", value: 25, fill: "hsl(200, 80%, 45%)" },
  { name: "X-Ray", value: 15, fill: "hsl(38, 92%, 50%)" },
  { name: "Ultrasound", value: 12, fill: "hsl(270, 60%, 55%)" },
  { name: "Other", value: 8, fill: "hsl(215, 25%, 60%)" },
];

const recentActivity = [
  { id: "BIL-001", type: "Billing", description: "Invoice — Sarah Johnson", time: "5m", icon: DollarSign, color: "hsl(142, 71%, 45%)" },
  { id: "LT-501", type: "Lab Test", description: "CBC — Michael Chen", time: "12m", icon: TestTube, color: "hsl(200, 80%, 45%)" },
  { id: "RX-201", type: "Rx", description: "Prescription — Dr. Smith", time: "20m", icon: FileText, color: "hsl(270, 60%, 55%)" },
  { id: "SC-3001", type: "Sample", description: "Blood sample — Sarah J.", time: "30m", icon: Syringe, color: "hsl(38, 92%, 50%)" },
  { id: "XR-2001", type: "X-Ray", description: "Chest PA — James Wilson", time: "45m", icon: ScanLine, color: "hsl(350, 65%, 55%)" },
];

const upcomingAppointments = [
  { patient: "Robert Taylor", doctor: "Dr. Smith", time: "2:00 PM", type: "Consult", avatar: "RT", color: "hsl(var(--primary))" },
  { patient: "Lisa Anderson", doctor: "Dr. Patel", time: "2:30 PM", type: "Lab Review", avatar: "LA", color: "hsl(200, 80%, 45%)" },
  { patient: "David Martinez", doctor: "Dr. Williams", time: "3:00 PM", type: "X-Ray", avatar: "DM", color: "hsl(38, 92%, 50%)" },
  { patient: "Emma Thompson", doctor: "Dr. Lee", time: "3:30 PM", type: "Follow-up", avatar: "ET", color: "hsl(270, 60%, 55%)" },
];

const quickActions = [
  { icon: Users, label: "New Patient", path: "/opd" },
  { icon: TestTube, label: "Order Test", path: "/lab-tests" },
  { icon: FileText, label: "Prescription", path: "/prescription" },
  { icon: DollarSign, label: "New Invoice", path: "/billing/new" },
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
    <div className="space-y-5">
      {/* ── Header Row ── */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold font-heading text-foreground tracking-tight">{greeting}, Doctor! 👋</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <DashboardDateFilter
          preset={filterPreset}
          customRange={customRange}
          onPresetChange={setFilterPreset}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* ── Quick Actions Strip ── */}
      <div className="flex items-center gap-2">
        {quickActions.map((a, i) => (
          <a key={i} href={a.path} className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border/50 bg-card hover:bg-accent/50 transition-colors text-xs font-semibold text-card-foreground group">
            <a.icon className="w-3.5 h-3.5 text-primary" />
            {a.label}
            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </a>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-primary/10">
            <Activity className="w-3 h-3 text-primary" />
            <span className="font-semibold text-primary font-number">47</span>
            <span>patients</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/60">
            <Clock className="w-3 h-3" />
            <span className="font-semibold font-number">8</span>
            <span>in queue</span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid (single row, compact) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <StatCard icon={Users} title="Total Patients" value="1,284" change="+12%" changeType="positive" accentColor="hsl(var(--primary))" />
        <StatCard icon={Stethoscope} title="Today's OPD" value="47" change="8 queue" changeType="neutral" accentColor="hsl(200, 80%, 45%)" />
        <StatCard icon={TestTube} title="Pending Tests" value="23" change="-5" changeType="positive" accentColor="hsl(38, 92%, 50%)" />
        <StatCard icon={DollarSign} title="Revenue (MTD)" value={formatDualPrice(67450)} change="+18%" changeType="positive" accentColor="hsl(142, 71%, 45%)" />
      </div>

      <div className="grid grid-cols-4 lg:grid-cols-4 gap-2.5">
        <StatCard icon={Pill} title="Medicines" value="6" change="2 low" changeType="negative" accentColor="hsl(350, 65%, 55%)" />
        <StatCard icon={Syringe} title="Injections" value="10" change="1 out" changeType="negative" accentColor="hsl(270, 60%, 55%)" />
        <StatCard icon={ScanLine} title="X-Ray" value="8" change="3 pending" changeType="neutral" accentColor="hsl(215, 60%, 55%)" />
        <StatCard icon={Heart} title="Services" value="7" change="5 active" changeType="positive" accentColor="hsl(340, 70%, 55%)" />
      </div>

      {/* ── Main Grid: 3 columns ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Column 1: Weekly + Department */}
        <div className="flex flex-col gap-4">
          {/* Weekly Visits */}
          <div className="bg-card rounded-xl border border-border/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-card-foreground font-heading uppercase tracking-wider">This Week</h3>
              <span className="text-[10px] text-muted-foreground">Patient visits</span>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={weeklyData} barSize={18}>
                <Bar dataKey="visits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.75} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "11px" }}
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div className="bg-card rounded-xl border border-border/40 p-4 flex-1">
            <h3 className="text-xs font-bold text-card-foreground font-heading uppercase tracking-wider mb-3">Departments</h3>
            <div className="flex items-center gap-3">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={departmentData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {departmentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 flex-1">
                {departmentData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                      <span className="text-[11px] text-card-foreground font-medium">{d.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-number">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Live Activity (tall) */}
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-card-foreground font-heading uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Live Activity
            </h3>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <div className="space-y-1">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15` }}>
                  <a.icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-card-foreground truncate">{a.description}</p>
                  <span className="text-[10px] text-muted-foreground">{a.type}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Schedule */}
        <div className="bg-card rounded-xl border border-border/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-card-foreground font-heading uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" /> Schedule
            </h3>
            <span className="text-[10px] font-bold text-primary">Today</span>
          </div>
          <div className="space-y-2">
            {upcomingAppointments.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: a.color }}
                >
                  {a.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-card-foreground truncate">{a.patient}</p>
                  <p className="text-[10px] text-muted-foreground">{a.doctor}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] font-bold text-card-foreground font-number">{a.time}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{a.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment Methods ── */}
      <PaymentMethodChart data={paymentData} />
    </div>
  );
};

export default Dashboard;
