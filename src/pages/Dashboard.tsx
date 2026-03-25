import { useState, useEffect, useMemo } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Syringe, ScanLine, Heart, FileText,
  Activity, ArrowRight, Receipt, Wallet,
  Banknote, CreditCard, Building2, Landmark,
  ClipboardList, TrendingUp, TrendingDown,
  Smartphone, Coins, Send, Shield,
  BarChart3, Star, Percent,
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
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

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

const quickActions = [
  { icon: Users, label: "Register Patient", desc: "New OPD registration", path: "/opd", color: "hsl(160, 84%, 39%)" },
  { icon: TestTube, label: "Lab Tests", desc: "Order & manage tests", path: "/lab-tests", color: "hsl(200, 80%, 45%)" },
  { icon: FileText, label: "Prescription", desc: "Write prescriptions", path: "/prescription", color: "hsl(270, 60%, 55%)" },
  { icon: DollarSign, label: "New Invoice", desc: "Create billing invoice", path: "/billing/new", color: "hsl(142, 71%, 45%)" },
  { icon: ScanLine, label: "X-Ray", desc: "Request imaging", path: "/x-ray", color: "hsl(38, 92%, 50%)" },
  { icon: Syringe, label: "Injections", desc: "Administer injections", path: "/injections", color: "hsl(350, 65%, 55%)" },
  { icon: Pill, label: "Medicine", desc: "Medicine inventory", path: "/medicine", color: "hsl(215, 60%, 55%)" },
  { icon: Heart, label: "Health Services", desc: "Manage services", path: "/health-services", color: "hsl(340, 70%, 55%)" },
];

/* ─── Stat Card (clean, left-bordered) ─── */
interface MetricCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  borderColor: string;
  iconColor: string;
}
const MetricCard = ({ label, value, sub, icon: Icon, borderColor, iconColor }: MetricCardProps) => (
  <div
    className="bg-card rounded-xl border border-border/40 p-4 sm:p-5 hover:shadow-md transition-shadow"
    style={{ borderLeft: `4px solid ${borderColor}` }}
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${iconColor}14` }}>
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
      </div>
    </div>
    <p className="text-2xl font-black text-card-foreground font-number tracking-tight leading-none">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>
  </div>
);

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

    // Calculate cash and bank totals
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

  const salesByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredBilling.forEach(r => {
      if (r.formData?.lineItems) {
        r.formData.lineItems.forEach((li: any) => {
          const typeMap: Record<string, string> = { SVC: "Service", MED: "Medicine", INJ: "Injection", PKG: "Package", CUSTOM: "Custom" };
          const cat = typeMap[li.type] || "Other";
          catMap[cat] = (catMap[cat] || 0) + li.price * li.qty;
        });
      } else {
        catMap["Other"] = (catMap["Other"] || 0) + r.amount;
      }
    });
    return Object.entries(catMap).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [filteredBilling]);

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

  return (
    <div className="space-y-6 w-full">
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

      {/* ── Row 1: 5 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Total Bills"
          value={formatPrice(stats.totalBills)}
          sub="All invoiced amount"
          icon={Receipt}
          borderColor="hsl(260, 60%, 55%)"
          iconColor="hsl(260, 60%, 55%)"
        />
        <MetricCard
          label="Total Bank"
          value={formatPrice(stats.totalBank)}
          sub="ABA, ACleda, Card, etc."
          icon={Building2}
          borderColor="hsl(200, 80%, 50%)"
          iconColor="hsl(200, 80%, 50%)"
        />
        <MetricCard
          label="Total Due"
          value={formatPrice(stats.totalDue)}
          sub={`${stats.pendingInvoices} pending invoices`}
          icon={TrendingDown}
          borderColor="hsl(350, 65%, 55%)"
          iconColor="hsl(350, 65%, 55%)"
        />
        <MetricCard
          label="Total Cash"
          value={formatPrice(stats.totalCash)}
          sub="Cash payments"
          icon={Banknote}
          borderColor="hsl(142, 71%, 45%)"
          iconColor="hsl(142, 71%, 45%)"
        />
        <MetricCard
          label="Total Discount"
          value={formatPrice(stats.totalDiscount)}
          sub={`${stats.invoiceCount} invoices`}
          icon={Percent}
          borderColor="hsl(38, 92%, 50%)"
          iconColor="hsl(38, 92%, 50%)"
        />
      </div>

      {/* ── Row 2: 4 cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Expenses"
          value={formatPrice(stats.totalExpense)}
          sub="For selected period"
          icon={Wallet}
          borderColor="hsl(15, 85%, 52%)"
          iconColor="hsl(15, 85%, 52%)"
        />
        <MetricCard
          label="Total Invoices"
          value={stats.invoiceCount}
          sub={`${stats.completedInvoices} completed`}
          icon={ClipboardList}
          borderColor="hsl(200, 80%, 50%)"
          iconColor="hsl(200, 80%, 50%)"
        />
        <MetricCard
          label="Profit / Loss"
          value={formatPrice(stats.profit > 0 ? stats.profit : stats.loss)}
          sub={stats.profit > 0 ? "Revenue − Expenses" : "Expenses exceed revenue"}
          icon={stats.profit > 0 ? TrendingUp : TrendingDown}
          borderColor={stats.profit > 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 65%, 50%)"}
          iconColor={stats.profit > 0 ? "hsl(160, 84%, 39%)" : "hsl(0, 65%, 50%)"}
        />
        <MetricCard
          label="Total Patients"
          value={stats.totalPatients}
          sub={`${stats.activePatients} active patients`}
          icon={Users}
          borderColor="hsl(280, 55%, 55%)"
          iconColor="hsl(280, 55%, 55%)"
        />
      </div>

      {/* ── Row 3: Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sales by Payment */}
        <div className="bg-card rounded-xl border border-border/40 p-5">
          <h3 className="text-base font-bold text-card-foreground font-heading mb-4">Sales by Payment</h3>
          {salesByPayment.length > 0 ? (
            <div className="space-y-0">
              {salesByPayment.map((item, i) => (
                <div key={item.name} className={`flex items-center justify-between py-3.5 px-1 ${i < salesByPayment.length - 1 ? "border-b border-border/40" : ""}`}>
                  <span className="text-sm font-semibold text-card-foreground">{item.name}</span>
                  <span className="text-sm font-bold text-card-foreground font-number">{formatPrice(item.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No sales in this period</div>
          )}
        </div>

        {/* Popular Medicine */}
        <div className="bg-card rounded-xl border border-border/40 p-5">
          <h3 className="text-base font-bold text-card-foreground font-heading mb-4">Popular Medicine</h3>
          {popularMedicine.length > 0 ? (
            <div className="space-y-0">
              {popularMedicine.map((item, i) => (
                <div key={item.id} className={`flex items-center justify-between py-3 px-1 ${i < popularMedicine.length - 1 ? "border-b border-border/40" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{item.name}</p>
                    <p className="text-[11px] text-primary font-medium">{item.sold} sold</p>
                  </div>
                  <span className="text-sm font-bold text-card-foreground font-number">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No medicine data</div>
          )}
        </div>
      </div>

      {/* ── Row 4: Clinical Overview ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Lab Reports" value={stats.totalLabs} sub={`${stats.pendingLabs} pending`} icon={TestTube} borderColor="hsl(200, 80%, 45%)" iconColor="hsl(200, 80%, 45%)" />
        <MetricCard label="X-Ray" value={xrayRecs.length} sub={`${stats.pendingXrays} pending`} icon={ScanLine} borderColor="hsl(38, 70%, 48%)" iconColor="hsl(38, 70%, 48%)" />
        <MetricCard label="Ultrasound" value={ultrasoundRecs.length} sub={`${stats.pendingUltrasounds} pending`} icon={Heart} borderColor="hsl(280, 65%, 55%)" iconColor="hsl(280, 65%, 55%)" />
        <MetricCard label="In Queue" value={stats.pendingPatients} sub={`${stats.activePatients} active today`} icon={Activity} borderColor="hsl(160, 84%, 39%)" iconColor="hsl(160, 84%, 39%)" />
      </div>

      {/* ── Row 5: Recent Invoices ── */}
      <div className="bg-card rounded-xl border border-border/40 p-5">
        <h3 className="text-base font-bold text-card-foreground font-heading mb-4">Recent Invoices</h3>
        <div className="space-y-0">
          {recentInvoices.map((inv, i) => {
            const statusColor = inv.status === "completed" ? "hsl(160, 84%, 39%)" : inv.status === "pending" ? "hsl(38, 92%, 50%)" : "hsl(0, 65%, 50%)";
            const statusLabel = inv.status === "completed" ? "Completed" : inv.status === "pending" ? "Pending" : "Critical";
            return (
              <div key={inv.id} className={`flex items-center justify-between py-3.5 px-2 ${i < recentInvoices.length - 1 ? "border-b border-border/40" : ""}`}>
                <div>
                  <p className="text-sm font-bold text-card-foreground">{inv.id}</p>
                  <p className="text-xs text-muted-foreground">{inv.date} · {inv.patient}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-card-foreground font-number">{formatPrice(inv.total)}</p>
                  <p className="text-[11px] font-semibold" style={{ color: statusColor }}>{statusLabel}</p>
                </div>
              </div>
            );
          })}
          {recentInvoices.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No recent invoices</div>
          )}
        </div>
      </div>

      {/* ── Row 6: Quick Actions ── */}
      <div>
        <h3 className="text-base font-bold text-foreground font-heading mb-3 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-primary" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((op, i) => (
            <a
              key={i}
              href={op.path}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${op.color}14` }}
              >
                <op.icon className="w-5 h-5" style={{ color: op.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">{op.label}</p>
                <p className="text-xs text-muted-foreground hidden lg:block">{op.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
