import { useState, useEffect, useMemo } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Syringe, ScanLine, Heart, FileText,
  Activity, ArrowRight, Receipt, Wallet,
  Banknote, CreditCard, Building2, Landmark,
  ClipboardList, TrendingUp, TrendingDown,
  Smartphone, Coins, Send, Shield,
  BarChart3, Star, Percent, CircleDollarSign,
  Package, Layers,
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
import { parseISO, isWithinInterval } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const paymentMeta: Record<string, { color: string; icon: React.ElementType }> = {
  Cash: { color: "hsl(142, 71%, 45%)", icon: Banknote },
  ABA: { color: "hsl(217, 91%, 60%)", icon: Building2 },
  ACleda: { color: "hsl(38, 92%, 50%)", icon: Landmark },
  Card: { color: "hsl(270, 60%, 55%)", icon: CreditCard },
  Wing: { color: "hsl(195, 80%, 45%)", icon: Smartphone },
  "Binance(USDT)": { color: "hsl(45, 90%, 48%)", icon: Coins },
  "True Money": { color: "hsl(15, 85%, 52%)", icon: Smartphone },
  "Bank Transfer": { color: "hsl(200, 50%, 40%)", icon: Send },
  Insurance: { color: "hsl(340, 60%, 50%)", icon: Shield },
};

const DONUT_COLORS = [
  "hsl(168, 80%, 35%)", "hsl(200, 80%, 50%)", "hsl(38, 92%, 50%)",
  "hsl(270, 60%, 55%)", "hsl(350, 65%, 55%)", "hsl(142, 71%, 45%)",
  "hsl(15, 85%, 52%)", "hsl(195, 80%, 45%)", "hsl(45, 90%, 48%)",
];

const quickActions = [
  { icon: Users, label: "Register Patient", path: "/opd", color: "hsl(160, 84%, 39%)" },
  { icon: TestTube, label: "Lab Tests", path: "/lab-tests", color: "hsl(200, 80%, 45%)" },
  { icon: FileText, label: "Prescription", path: "/prescription", color: "hsl(270, 60%, 55%)" },
  { icon: DollarSign, label: "New Invoice", path: "/billing/new", color: "hsl(142, 71%, 45%)" },
  { icon: ScanLine, label: "X-Ray", path: "/x-ray", color: "hsl(38, 92%, 50%)" },
  { icon: Syringe, label: "Injections", path: "/injections", color: "hsl(350, 65%, 55%)" },
  { icon: Pill, label: "Medicine", path: "/medicine", color: "hsl(215, 60%, 55%)" },
  { icon: Heart, label: "Health Services", path: "/health-services", color: "hsl(340, 70%, 55%)" },
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
        if (r.method.toLowerCase() === "cash") {
          totalCash += r.paid;
        } else if (bankMethods.includes(r.method.toLowerCase())) {
          totalBank += r.paid;
        }
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
      if (r.due > 0) {
        methodMap["Due"] = (methodMap["Due"] || 0) + r.due;
      }
    });
    return Object.entries(methodMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredBilling]);

  const popularMedicine = useMemo(() => {
    return [...medicines].filter(m => m.soldOut > 0).sort((a, b) => b.soldOut - a.soldOut).slice(0, 5)
      .map(m => ({ id: m.id, name: m.name, sold: m.soldOut, price: m.price }));
  }, [medicines]);

  const recentInvoices = useMemo(() => {
    return billingRecords.slice(0, 6).map(r => ({
      id: r.id, patient: r.patient, service: r.service,
      total: r.total, status: r.status, date: r.date, method: r.method,
    }));
  }, [billingRecords]);

  const paymentDonutData = useMemo(() => {
    return salesByPayment.filter(s => s.amount > 0);
  }, [salesByPayment]);

  const paymentTotal = useMemo(() => paymentDonutData.reduce((s, d) => s + d.amount, 0), [paymentDonutData]);

  return (
    <div className="space-y-5 w-full">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your clinic's performance</p>
        </div>
        <DashboardDateFilter
          preset={filterPreset}
          customRange={customRange}
          onPresetChange={setFilterPreset}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      {/* ── Hero Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HeroStat
          label="Total Revenue"
          value={formatPrice(stats.totalBills)}
          change={`${stats.invoiceCount} invoices`}
          icon={CircleDollarSign}
          gradient="from-[hsl(168,80%,30%)] to-[hsl(168,70%,42%)]"
        />
        <HeroStat
          label="Cash Received"
          value={formatPrice(stats.totalCash)}
          change="Cash payments"
          icon={Banknote}
          gradient="from-[hsl(142,71%,40%)] to-[hsl(142,60%,50%)]"
        />
        <HeroStat
          label="Bank Received"
          value={formatPrice(stats.totalBank)}
          change="ABA, ACleda, Card, etc."
          icon={Building2}
          gradient="from-[hsl(200,80%,45%)] to-[hsl(200,70%,55%)]"
        />
        <HeroStat
          label="Outstanding Due"
          value={formatPrice(stats.totalDue)}
          change={`${stats.pendingInvoices} pending`}
          icon={TrendingDown}
          gradient="from-[hsl(350,65%,50%)] to-[hsl(350,55%,60%)]"
        />
      </div>

      {/* ── Secondary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MiniStat label="Expenses" value={formatPrice(stats.totalExpense)} icon={Wallet} color="hsl(15, 85%, 52%)" />
        <MiniStat label="Discount" value={formatPrice(stats.totalDiscount)} icon={Percent} color="hsl(38, 92%, 50%)" />
        <MiniStat label="Profit / Loss" value={formatPrice(stats.profit > 0 ? stats.profit : stats.loss)} icon={stats.profit > 0 ? TrendingUp : TrendingDown} color={stats.profit > 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 65%, 50%)"} />
        <MiniStat label="Patients" value={String(stats.totalPatients)} icon={Users} color="hsl(270, 55%, 55%)" />
        <MiniStat label="Invoices" value={String(stats.invoiceCount)} icon={ClipboardList} color="hsl(200, 80%, 50%)" />
        <MiniStat label="Completed" value={String(stats.completedInvoices)} icon={Receipt} color="hsl(168, 80%, 35%)" />
      </div>

      {/* ── Middle: Payment Donut + Popular Medicine + Clinical ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Payment Breakdown Donut */}
        <div className="lg:col-span-4 bg-card rounded-2xl border border-border/40 p-5">
          <h3 className="text-sm font-bold text-card-foreground font-heading mb-4 uppercase tracking-wider">Payment Breakdown</h3>
          {paymentDonutData.length > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={paymentDonutData}
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={3}
                      dataKey="amount"
                      stroke="none"
                    >
                      {paymentDonutData.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "10px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: "12px", fontWeight: 700 }}
                      formatter={(value: number) => [formatPrice(value), "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-lg font-black text-card-foreground font-number">{formatPrice(paymentTotal)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Total</span>
                </div>
              </div>
              <div className="w-full space-y-1.5">
                {paymentDonutData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span className="text-card-foreground font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-card-foreground font-number">{formatPrice(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No payment data</div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="lg:col-span-5 bg-card rounded-2xl border border-border/40 p-5">
          <h3 className="text-sm font-bold text-card-foreground font-heading mb-3 uppercase tracking-wider">Recent Invoices</h3>
          <div className="space-y-0">
            {recentInvoices.map((inv, i) => {
              const statusColor = inv.status === "completed" ? "hsl(160, 84%, 39%)" : inv.status === "pending" ? "hsl(38, 92%, 50%)" : "hsl(0, 65%, 50%)";
              return (
                <div key={inv.id} className={`flex items-center justify-between py-2.5 ${i < recentInvoices.length - 1 ? "border-b border-border/30" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
                    <div>
                      <p className="text-sm font-bold text-card-foreground">{inv.id}</p>
                      <p className="text-[11px] text-muted-foreground">{inv.patient}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground font-number">{formatPrice(inv.total)}</p>
                    <p className="text-[10px] font-semibold capitalize" style={{ color: statusColor }}>{inv.status}</p>
                  </div>
                </div>
              );
            })}
            {recentInvoices.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent invoices</div>
            )}
          </div>
        </div>

        {/* Popular Medicine */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border/40 p-5">
          <h3 className="text-sm font-bold text-card-foreground font-heading mb-3 uppercase tracking-wider">Top Medicine</h3>
          {popularMedicine.length > 0 ? (
            <div className="space-y-0">
              {popularMedicine.map((item, i) => (
                <div key={item.id} className={`flex items-center justify-between py-2.5 ${i < popularMedicine.length - 1 ? "border-b border-border/30" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-card-foreground leading-tight">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.sold} sold</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-card-foreground font-number">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No data</div>
          )}
        </div>
      </div>

      {/* ── Clinical Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <ClinicalCard label="Lab Reports" count={stats.totalLabs} pending={stats.pendingLabs} icon={TestTube} color="hsl(200, 80%, 45%)" />
        <ClinicalCard label="X-Ray" count={xrayRecs.length} pending={stats.pendingXrays} icon={ScanLine} color="hsl(38, 70%, 48%)" />
        <ClinicalCard label="Ultrasound" count={ultrasoundRecs.length} pending={stats.pendingUltrasounds} icon={Heart} color="hsl(280, 65%, 55%)" />
        <ClinicalCard label="In Queue" count={stats.pendingPatients} pending={stats.activePatients} icon={Activity} color="hsl(160, 84%, 39%)" pendingLabel="active" />
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h3 className="text-sm font-bold text-foreground font-heading mb-3 uppercase tracking-wider flex items-center gap-2">
          <ArrowRight className="w-3.5 h-3.5 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {quickActions.map((op, i) => (
            <a
              key={i}
              href={op.path}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group text-center"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${op.color}14` }}
              >
                <op.icon className="w-5 h-5" style={{ color: op.color }} />
              </div>
              <span className="text-xs font-bold text-card-foreground group-hover:text-primary transition-colors leading-tight">{op.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Hero Stat Card ─── */
interface HeroStatProps {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  gradient: string;
}
const HeroStat = ({ label, value, change, icon: Icon, gradient }: HeroStatProps) => (
  <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 sm:p-5 text-white`}>
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-white/10 -translate-y-6 translate-x-6" />
    <div className="absolute bottom-0 left-0 w-14 h-14 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 opacity-80" />
        <span className="text-xs font-semibold uppercase tracking-wider opacity-90">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-black font-number tracking-tight">{value}</p>
      <p className="text-[11px] opacity-75 mt-0.5">{change}</p>
    </div>
  </div>
);

/* ─── Mini Stat ─── */
interface MiniStatProps {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}
const MiniStat = ({ label, value, icon: Icon, color }: MiniStatProps) => (
  <div className="bg-card rounded-xl border border-border/40 p-3.5 flex items-center gap-3 hover:shadow-sm transition-shadow">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-lg font-black text-card-foreground font-number leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  </div>
);

/* ─── Clinical Card ─── */
interface ClinicalCardProps {
  label: string;
  count: number;
  pending: number;
  icon: React.ElementType;
  color: string;
  pendingLabel?: string;
}
const ClinicalCard = ({ label, count, pending, icon: Icon, color, pendingLabel = "pending" }: ClinicalCardProps) => (
  <div className="bg-card rounded-xl border border-border/40 p-4 flex items-center justify-between hover:shadow-sm transition-shadow">
    <div>
      <p className="text-2xl font-black text-card-foreground font-number">{count}</p>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{pending} {pendingLabel}</p>
    </div>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}14` }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
  </div>
);

export default Dashboard;
