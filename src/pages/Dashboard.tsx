import { useState, useEffect, useMemo } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Syringe, ScanLine, Heart, FileText,
  Activity, ArrowRight, Receipt, Wallet,
  Banknote, CreditCard, Building2, Landmark,
  ClipboardList, TrendingUp, TrendingDown,
  Smartphone, Coins, Send, Shield,
  BarChart3, Star, Percent, CircleDollarSign,
  Package, Layers, ChevronRight, Zap,
  Eye, AlertCircle, CheckCircle2, Clock,
} from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DashboardDateFilter, { DashboardFilterPreset, getPresetRange } from "@/components/DashboardDateFilter";
import { getBillingRecords, subscribeBilling } from "@/data/billingStore";
import { getPatients, subscribe as subscribePatients, initPatients } from "@/data/patientStore";
import { opdPatients } from "@/data/opdPatients";
import { getLabReports, subscribeLabReports } from "@/data/labReportStore";
import { getMedicines, subscribeMedicines } from "@/data/medicineStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { getXrayRecords, subscribeXray } from "@/data/xrayRecords";
import { getUltrasoundRecords, subscribeUltrasound } from "@/data/ultrasoundRecords";
import { getExpenseRecords, subscribeExpenses } from "@/data/expenseStore";
import { parseISO, isWithinInterval, format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";

const paymentMeta: Record<string, { color: string; icon: React.ElementType }> = {
  Cash: { color: "hsl(168, 65%, 38%)", icon: Banknote },
  ABA: { color: "hsl(210, 70%, 50%)", icon: Building2 },
  ACleda: { color: "hsl(195, 65%, 45%)", icon: Landmark },
  Card: { color: "hsl(220, 55%, 55%)", icon: CreditCard },
  Wing: { color: "hsl(185, 60%, 42%)", icon: Smartphone },
  "Binance(USDT)": { color: "hsl(175, 55%, 40%)", icon: Coins },
  "True Money": { color: "hsl(200, 60%, 48%)", icon: Smartphone },
  "Bank Transfer": { color: "hsl(215, 50%, 45%)", icon: Send },
  Insurance: { color: "hsl(190, 55%, 40%)", icon: Shield },
};

const DONUT_COLORS = [
  "hsl(168, 65%, 38%)", "hsl(210, 70%, 50%)", "hsl(195, 65%, 45%)",
  "hsl(220, 55%, 55%)", "hsl(185, 60%, 42%)", "hsl(175, 55%, 40%)",
  "hsl(200, 60%, 48%)", "hsl(215, 50%, 45%)", "hsl(190, 55%, 40%)",
];

const quickActions = [
  { icon: Users, label: "Register Patient", path: "/opd", color: "hsl(168, 65%, 38%)" },
  { icon: TestTube, label: "Lab Tests", path: "/lab-tests", color: "hsl(210, 70%, 50%)" },
  { icon: FileText, label: "Prescription", path: "/prescription", color: "hsl(220, 55%, 55%)" },
  { icon: DollarSign, label: "New Invoice", path: "/billing/new", color: "hsl(168, 65%, 38%)" },
  { icon: ScanLine, label: "X-Ray", path: "/x-ray", color: "hsl(195, 65%, 45%)" },
  { icon: Syringe, label: "Injections", path: "/injections", color: "hsl(200, 60%, 48%)" },
  { icon: Pill, label: "Medicine", path: "/medicine", color: "hsl(210, 70%, 50%)" },
  { icon: Heart, label: "Health Services", path: "/health-services", color: "hsl(185, 60%, 42%)" },
];

const Dashboard = () => {
  useSettings();
  const [filterPreset, setFilterPreset] = useState<DashboardFilterPreset>("this_month");
  const [customRange, setCustomRange] = useState<{ from: Date; to: Date } | null>(null);
  const [billingRecords, setBillingRecords] = useState(getBillingRecords());
  const [patients, setPatients] = useState(getPatients());
  const [labReports, setLabReports] = useState(getLabReports());
  const [medicines, setMedicines] = useState(getMedicines());
  const [injections, setInjections] = useState(getInjections());
  const [expenses, setExpenses] = useState(getExpenseRecords());
  const [xrayRecs, setXrayRecs] = useState(getXrayRecords());
  const [ultrasoundRecs, setUltrasoundRecs] = useState(getUltrasoundRecords());

  useEffect(() => { initPatients(opdPatients); setPatients([...getPatients()]); }, []);

  useEffect(() => {
    const unsubs = [
      subscribeBilling(() => setBillingRecords([...getBillingRecords()])),
      subscribePatients(() => setPatients([...getPatients()])),
      subscribeLabReports(() => setLabReports([...getLabReports()])),
      subscribeMedicines(() => setMedicines([...getMedicines()])),
      subscribeInjections(() => setInjections([...getInjections()])),
      subscribeExpenses(() => setExpenses([...getExpenseRecords()])),
      subscribeXray(() => setXrayRecs([...getXrayRecords()])),
      subscribeUltrasound(() => setUltrasoundRecs([...getUltrasoundRecords()])),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  const filteredBilling = useMemo(() => {
    const range = filterPreset === "custom" && customRange ? customRange : getPresetRange(filterPreset);
    return billingRecords.filter((r) => {
      try { return isWithinInterval(parseISO(r.date), { start: range.from, end: range.to }); }
      catch { return false; }
    });
  }, [billingRecords, filterPreset, customRange]);

  const stats = useMemo(() => {
    const revenue = filteredBilling.reduce((s, r) => s + r.paid, 0);
    const totalBills = filteredBilling.reduce((s, r) => s + r.total, 0);
    const totalDiscount = filteredBilling.reduce((s, r) => s + r.discount, 0);
    const totalDue = filteredBilling.reduce((s, r) => s + r.due, 0);
    const invoiceCount = filteredBilling.length;
    const completedInvoices = filteredBilling.filter(r => r.status === "completed").length;
    const pendingInvoices = filteredBilling.filter(r => r.status === "pending" || r.status === "critical").length;

    const range = filterPreset === "custom" && customRange ? customRange : getPresetRange(filterPreset);
    const filteredExpenses = expenses.filter(e => {
      try { return isWithinInterval(parseISO(e.date), { start: range.from, end: range.to }); }
      catch { return false; }
    });
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    const netResult = totalBills - (totalExpense + totalDiscount);
    const profit = netResult > 0 ? netResult : 0;
    const loss = netResult < 0 ? Math.abs(netResult) : 0;

    const bankMethods = ["aba", "acleda", "card", "wing", "binance(usdt)", "true money", "bank transfer", "insurance"];
    let totalCash = 0;
    let totalBank = 0;
    filteredBilling.forEach(r => {
      if (r.method && r.method !== "—") {
        if (r.method.toLowerCase() === "cash") totalCash += r.paid;
        else if (bankMethods.includes(r.method.toLowerCase())) totalBank += r.paid;
      }
    });

    return {
      revenue, totalBills, totalDiscount, totalDue, totalExpense, profit, loss,
      totalCash, totalBank,
      invoiceCount, completedInvoices, pendingInvoices,
      totalPatients: patients.length,
      activePatients: patients.filter(p => p.status === "active").length,
      pendingPatients: patients.filter(p => p.status === "pending").length,
      totalLabs: labReports.length,
      pendingLabs: labReports.filter(r => r.status === "pending" || r.status === "in-progress").length,
      pendingXrays: xrayRecs.filter(r => r.status === "pending" || r.status === "in-progress").length,
      pendingUltrasounds: ultrasoundRecs.filter(r => r.status === "pending" || r.status === "in-progress").length,
    };
  }, [filteredBilling, patients, labReports, expenses, xrayRecs, ultrasoundRecs, filterPreset, customRange]);

  const salesByPayment = useMemo(() => {
    const methodMap: Record<string, number> = {};
    filteredBilling.forEach(r => {
      if (r.method && r.method !== "—") {
        const displayName = Object.keys(paymentMeta).find(k => k.toLowerCase() === r.method.toLowerCase()) ||
          r.method.charAt(0).toUpperCase() + r.method.slice(1).toLowerCase();
        methodMap[displayName] = (methodMap[displayName] || 0) + r.paid;
      }
      if (r.due > 0) methodMap["Due"] = (methodMap["Due"] || 0) + r.due;
    });
    return Object.entries(methodMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredBilling]);

  const popularMedicine = useMemo(() => {
    return [...medicines].filter(m => m.soldOut > 0).sort((a, b) => b.soldOut - a.soldOut).slice(0, 5)
      .map(m => ({ id: m.id, name: m.name, sold: m.soldOut, price: m.price }));
  }, [medicines]);

  const recentInvoices = useMemo(() => {
    return billingRecords.slice(0, 5).map(r => ({
      id: r.id, patient: r.patient, service: r.service,
      total: r.total, status: r.status, date: r.date, method: r.method,
    }));
  }, [billingRecords]);

  const paymentDonutData = useMemo(() => salesByPayment.filter(s => s.amount > 0), [salesByPayment]);
  const paymentTotal = useMemo(() => paymentDonutData.reduce((s, d) => s + d.amount, 0), [paymentDonutData]);

  // Revenue trend (last 7 days from billing)
  const revenueTrend = useMemo(() => {
    const days: Record<string, number> = {};
    filteredBilling.forEach(r => {
      try {
        const day = format(parseISO(r.date), "EEE");
        days[day] = (days[day] || 0) + r.paid;
      } catch {}
    });
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return weekDays.map(d => ({ day: d, amount: days[d] || 0 }));
  }, [filteredBilling]);

  return (
    <div className="space-y-6 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Live Overview</span>
          </div>
          <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Dashboard</h1>
        </div>
        <DashboardDateFilter
          preset={filterPreset}
          customRange={customRange}
          onPresetChange={setFilterPreset}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* ── Bento Grid: Main Financial ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-4">
        {/* Total Revenue - Dark Slate */}
        <div className="col-span-2 md:col-span-2 lg:col-span-3 rounded-2xl p-5 sm:p-6 relative overflow-hidden group"
          style={{ background: "linear-gradient(145deg, hsl(215, 28%, 17%), hsl(220, 25%, 22%))" }}>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20 group-hover:scale-125 transition-transform duration-700"
            style={{ background: "radial-gradient(circle, hsl(168, 65%, 45%) 0%, transparent 70%)" }} />
          <div className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(168, 65%, 38% / 0.2)" }}>
            <CircleDollarSign className="w-5 h-5" style={{ color: "hsl(168, 65%, 55%)" }} />
          </div>
          <p className="text-xs font-medium uppercase tracking-widest mb-1.5" style={{ color: "hsl(210, 20%, 65%)" }}>Total Revenue</p>
          <p className="text-2xl sm:text-3xl font-black font-body tracking-tight relative z-10 text-white">{formatPrice(stats.totalBills)}</p>
          <p className="text-xs mt-1.5" style={{ color: "hsl(210, 15%, 55%)" }}>{stats.invoiceCount} invoices</p>
        </div>

        {/* Cash */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-all duration-200 hover:border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(168, 65%, 38% / 0.1)" }}>
              <Banknote className="w-4.5 h-4.5" style={{ color: "hsl(168, 65%, 38%)" }} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-body text-card-foreground">{formatPrice(stats.totalCash)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Cash Received</p>
        </div>

        {/* Bank */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-all duration-200 hover:border-info/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(210, 70%, 50% / 0.1)" }}>
              <Building2 className="w-4.5 h-4.5" style={{ color: "hsl(210, 70%, 50%)" }} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-body text-card-foreground">{formatPrice(stats.totalBank)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Bank Received</p>
        </div>

        {/* Expenses */}
        <div className="col-span-1 lg:col-span-2 bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-all duration-200 hover:border-warning/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(195, 65%, 45% / 0.1)" }}>
              <Wallet className="w-4.5 h-4.5" style={{ color: "hsl(195, 65%, 45%)" }} />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-body text-card-foreground">{formatPrice(stats.totalExpense)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Expenses</p>
        </div>

        {/* Due */}
        <div className="col-span-1 lg:col-span-3 bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-md transition-all duration-200" style={{ borderColor: "hsl(210, 70%, 50% / 0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(210, 70%, 50% / 0.1)" }}>
              <AlertCircle className="w-4.5 h-4.5" style={{ color: "hsl(210, 70%, 50%)" }} />
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: "hsl(210, 70%, 45%)", background: "hsl(210, 70%, 50% / 0.1)" }}>{stats.pendingInvoices} pending</span>
          </div>
          <p className="text-xl sm:text-2xl font-black font-body text-card-foreground">{formatPrice(stats.totalDue)}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1">Outstanding</p>
        </div>
      </div>

      {/* ── Secondary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <CompactStat icon={Percent} label="Discount" value={formatPrice(stats.totalDiscount)} variant="muted" />
        <CompactStat
          icon={stats.profit > 0 ? TrendingUp : TrendingDown}
          label={stats.profit > 0 ? "Net Profit" : "Net Loss"}
          value={formatPrice(stats.profit > 0 ? stats.profit : stats.loss)}
          variant={stats.profit > 0 ? "success" : "danger"}
        />
        <CompactStat icon={Users} label="Patients" value={String(stats.totalPatients)} variant="accent" />
        <CompactStat icon={CheckCircle2} label="Completed" value={`${stats.completedInvoices}/${stats.invoiceCount}`} variant="primary" />
      </div>

      {/* ── Middle Section: Chart + Invoices + Medicine ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Revenue Trend + Payment Donut */}
        <div className="lg:col-span-5 space-y-4">
          {/* Revenue Trend */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-card-foreground uppercase tracking-widest">Revenue Trend</h3>
              <Zap className="w-3.5 h-3.5 text-warning" />
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(168, 80%, 30%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(168, 80%, 30%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="amount" stroke="hsl(168, 80%, 30%)" strokeWidth={2.5} fill="url(#revGrad)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(215, 12%, 50%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "1px solid hsl(210, 18%, 90%)", background: "hsl(0, 0%, 100%)", fontSize: "11px", fontWeight: 700 }}
                  formatter={(value: number) => [formatPrice(value), "Revenue"]}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Donut */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-xs font-bold text-card-foreground uppercase tracking-widest mb-4">Payment Split</h3>
            {paymentDonutData.length > 0 ? (
              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={paymentDonutData} innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="amount" stroke="none">
                        {paymentDonutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-sm font-black text-card-foreground font-body">{formatPrice(paymentTotal)}</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  {paymentDonutData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="text-xs text-card-foreground font-medium">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-card-foreground font-body">{formatPrice(item.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">No payment data</div>
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-card-foreground uppercase tracking-widest">Recent Invoices</h3>
            <a href="/billing" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
              View All <ChevronRight className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-0">
            {recentInvoices.map((inv, i) => {
              const statusIcon = inv.status === "completed"
                ? <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                : inv.status === "pending"
                  ? <Clock className="w-3.5 h-3.5 text-warning" />
                  : <AlertCircle className="w-3.5 h-3.5 text-destructive" />;
              return (
                <div key={inv.id} className={`flex items-center justify-between py-3 ${i < recentInvoices.length - 1 ? "border-b border-border/50" : ""}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {statusIcon}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-card-foreground truncate">{inv.patient}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{inv.id}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-black text-card-foreground font-body">{formatPrice(inv.total)}</p>
                    <p className="text-[10px] text-muted-foreground">{inv.method}</p>
                  </div>
                </div>
              );
            })}
            {recentInvoices.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">No recent invoices</div>
            )}
          </div>
        </div>

        {/* Top Medicine */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-card-foreground uppercase tracking-widest">Top Medicines</h3>
            <Pill className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          {popularMedicine.length > 0 ? (
            <div className="space-y-0">
              {popularMedicine.map((item, i) => {
                const barWidth = popularMedicine[0]?.sold ? Math.round((item.sold / popularMedicine[0].sold) * 100) : 0;
                return (
                  <div key={item.id} className={`py-3 ${i < popularMedicine.length - 1 ? "border-b border-border/50" : ""}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-card-foreground leading-tight truncate mr-2">{item.name}</span>
                      <span className="text-xs font-bold text-card-foreground font-body shrink-0">{formatPrice(item.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-bold w-8 text-right">{item.sold}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* ── Clinical Pipeline ── */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary" />
          Clinical Pipeline
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <PipelineCard icon={TestTube} label="Lab Reports" total={stats.totalLabs} pending={stats.pendingLabs} color="hsl(200, 80%, 45%)" />
          <PipelineCard icon={ScanLine} label="X-Ray" total={xrayRecs.length} pending={stats.pendingXrays} color="hsl(38, 70%, 48%)" />
          <PipelineCard icon={Heart} label="Ultrasound" total={ultrasoundRecs.length} pending={stats.pendingUltrasounds} color="hsl(270, 60%, 55%)" />
          <PipelineCard icon={Users} label="Queue" total={stats.totalPatients} pending={stats.activePatients} color="hsl(168, 80%, 30%)" pendingLabel="active" />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-warning" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {quickActions.map((op, i) => (
            <a
              key={i}
              href={op.path}
              className="group flex flex-col items-center gap-2.5 p-3.5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-300" style={{ background: `color-mix(in srgb, ${op.color} 12%, transparent)` }}>
                <op.icon className="w-5 h-5 transition-transform group-hover:scale-110 duration-300" style={{ color: op.color }} />
              </div>
              <span className="text-[11px] font-bold text-card-foreground text-center leading-tight">{op.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Compact Stat ─── */
interface CompactStatProps {
  icon: React.ElementType;
  label: string;
  value: string;
  variant: "muted" | "success" | "danger" | "accent" | "primary";
}
const variantStyles: Record<string, { bg: string; iconColor: string }> = {
  muted: { bg: "bg-muted", iconColor: "text-muted-foreground" },
  success: { bg: "bg-success/10", iconColor: "text-success" },
  danger: { bg: "bg-destructive/10", iconColor: "text-destructive" },
  accent: { bg: "bg-accent/10", iconColor: "text-accent" },
  primary: { bg: "bg-primary/10", iconColor: "text-primary" },
};

const CompactStat = ({ icon: Icon, label, value, variant }: CompactStatProps) => {
  const style = variantStyles[variant];
  return (
    <div className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${style.bg}`}>
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-black text-card-foreground font-body leading-none truncate">{value}</p>
        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
};

/* ─── Pipeline Card ─── */
interface PipelineCardProps {
  icon: React.ElementType;
  label: string;
  total: number;
  pending: number;
  color: string;
  pendingLabel?: string;
}
const PipelineCard = ({ icon: Icon, label, total, pending, color, pendingLabel = "pending" }: PipelineCardProps) => {
  const progress = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;
  return (
    <div className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
        <span className="text-2xl font-black text-card-foreground font-body">{total}</span>
      </div>
      <p className="text-xs font-semibold text-card-foreground">{label}</p>
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: color }} />
        </div>
        <span className="text-[10px] text-muted-foreground font-bold">{pending} {pendingLabel}</span>
      </div>
    </div>
  );
};

export default Dashboard;
