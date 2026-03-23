import { useState, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import {
  Users, Stethoscope, TestTube, Pill, DollarSign,
  Calendar, Syringe, ScanLine, Heart, FileText,
  Activity, Clock, ArrowRight, Percent, Receipt, Wallet,
  Banknote, CreditCard, Building2, Landmark,
  ClipboardList, TrendingUp, TrendingDown, AlertTriangle,
  Beaker, Package, Smartphone, Coins, Send, Shield,
  MinusCircle, BarChart3, Star,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { formatDualPrice, formatPrice } from "@/lib/currency";
import { useSettings } from "@/hooks/use-settings";
import DashboardDateFilter, { DashboardFilterPreset, getPresetRange } from "@/components/DashboardDateFilter";
import { getBillingRecords, subscribeBilling } from "@/data/billingStore";
import { getPatients, subscribe as subscribePatients, initPatients } from "@/data/patientStore";
import { opdPatients } from "@/data/opdPatients";
import { getLabReports, subscribeLabReports } from "@/data/labReportStore";
import { getMedicines, subscribeMedicines } from "@/data/medicineStore";
import { getInjections, subscribeInjections } from "@/data/injectionStore";
import { xrayRecords } from "@/data/xrayRecords";
import { ultrasoundRecords } from "@/data/ultrasoundRecords";
import { getExpenseRecords, subscribeExpenses } from "@/data/expenseStore";
import { parseISO, isWithinInterval, format, startOfDay, endOfDay } from "date-fns";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const LazyPaymentMethodChart = lazy(() => import("@/components/PaymentMethodChart"));
const LazyWeeklyChart = lazy(() => import("@/components/DashboardCharts").then(m => ({ default: m.WeeklyChart })));
const LazyDepartmentChart = lazy(() => import("@/components/DashboardCharts").then(m => ({ default: m.DepartmentChart })));

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

  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  // Init patients if empty
  useEffect(() => { initPatients(opdPatients); setPatients([...getPatients()]); }, []);

  // Subscribe to all stores
  useEffect(() => {
    const unsubs = [
      subscribeBilling(() => setBillingRecords([...getBillingRecords()])),
      subscribePatients(() => setPatients([...getPatients()])),
      subscribeLabReports(() => setLabReports([...getLabReports()])),
      subscribeMedicines(() => setMedicines([...getMedicines()])),
      subscribeInjections(() => setInjections([...getInjections()])),
      subscribeExpenses(() => setExpenses([...getExpenseRecords()])),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // Filtered billing by date range
  const filteredBilling = useMemo(() => {
    const range = filterPreset === "custom" && customRange ? customRange : getPresetRange(filterPreset);
    return billingRecords.filter((r) => {
      try { return isWithinInterval(parseISO(r.date), { start: range.from, end: range.to }); }
      catch { return false; }
    });
  }, [billingRecords, filterPreset, customRange]);

  // Real computed stats
  const stats = useMemo(() => {
    const revenue = filteredBilling.reduce((s, r) => s + r.paid, 0);
    const totalBills = filteredBilling.reduce((s, r) => s + r.total, 0);
    const totalDiscount = filteredBilling.reduce((s, r) => s + r.discount, 0);
    const totalDue = filteredBilling.reduce((s, r) => s + r.due, 0);
    const invoiceCount = filteredBilling.length;
    const completedInvoices = filteredBilling.filter(r => r.status === "completed").length;
    const pendingInvoices = filteredBilling.filter(r => r.status === "pending" || r.status === "critical").length;

    // Expenses filtered by date range
    const range = filterPreset === "custom" && customRange ? customRange : getPresetRange(filterPreset);
    const filteredExpenses = expenses.filter(e => {
      try { return isWithinInterval(parseISO(e.date), { start: range.from, end: range.to }); }
      catch { return false; }
    });
    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    const profit = revenue > totalExpense ? revenue - totalExpense : 0;
    const loss = totalExpense > revenue ? totalExpense - revenue : 0;

    const activePatients = patients.filter(p => p.status === "active").length;
    const pendingPatients = patients.filter(p => p.status === "pending").length;
    const totalPatients = patients.length;

    const pendingLabs = labReports.filter(r => r.status === "pending" || r.status === "in-progress").length;
    const completedLabs = labReports.filter(r => r.status === "completed").length;
    const totalLabs = labReports.length;

    const pendingXrays = xrayRecords.filter(r => r.status === "pending" || r.status === "in-progress").length;
    const pendingUltrasounds = ultrasoundRecords.filter(r => r.status === "pending" || r.status === "in-progress").length;

    const lowStockMeds = medicines.filter(m => m.status === "low-stock").length;
    const outOfStockMeds = medicines.filter(m => m.status === "out-of-stock").length;
    const lowStockInj = injections.filter(i => i.status === "low-stock").length;
    const outOfStockInj = injections.filter(i => i.status === "out-of-stock").length;

    return {
      revenue, totalBills, totalDiscount, totalDue, totalExpense, profit, loss,
      invoiceCount, completedInvoices, pendingInvoices,
      activePatients, pendingPatients, totalPatients,
      pendingLabs, completedLabs, totalLabs,
      pendingXrays, pendingUltrasounds,
      lowStockMeds, outOfStockMeds, lowStockInj, outOfStockInj,
    };
  }, [filteredBilling, patients, labReports, medicines, injections, expenses, filterPreset, customRange]);

  // Payment chart data
  const paymentData = useMemo(() => {
    const methods = ["Cash", "ABA", "ACleda", "Card", "Wing", "Binance(USDT)", "True Money", "Bank Transfer", "Insurance"];
    return methods.map((name) => {
      const matching = filteredBilling.filter((r) => r.method === name);
      const meta = paymentMeta[name];
      return { name, amount: matching.reduce((s, r) => s + r.paid, 0), count: matching.length, color: meta.color, icon: meta.icon };
    });
  }, [filteredBilling]);

  // Department distribution from real data
  const departmentData = useMemo(() => {
    const opdCount = patients.length;
    const labCount = labReports.length;
    const xrayCount = xrayRecords.length;
    const usCount = ultrasoundRecords.length;
    const otherCount = injections.length;
    const total = opdCount + labCount + xrayCount + usCount + otherCount || 1;
    return [
      { name: "OPD", value: Math.round((opdCount / total) * 100), fill: "hsl(160, 84%, 39%)" },
      { name: "Lab Tests", value: Math.round((labCount / total) * 100), fill: "hsl(200, 80%, 45%)" },
      { name: "X-Ray", value: Math.round((xrayCount / total) * 100), fill: "hsl(38, 92%, 50%)" },
      { name: "Ultrasound", value: Math.round((usCount / total) * 100), fill: "hsl(270, 60%, 55%)" },
      { name: "Injections", value: Math.round((otherCount / total) * 100), fill: "hsl(350, 65%, 55%)" },
    ];
  }, [patients, labReports, injections]);

  // Sales by Category from line items
  const salesByCategory = useMemo(() => {
    const catMap: Record<string, number> = {};
    filteredBilling.forEach(r => {
      if (r.formData?.lineItems) {
        r.formData.lineItems.forEach(li => {
          const typeMap: Record<string, string> = { SVC: "Service", MED: "Medicine", INJ: "Injection", PKG: "Package", CUSTOM: "Custom" };
          const cat = typeMap[li.type] || "Other";
          catMap[cat] = (catMap[cat] || 0) + li.price * li.qty;
        });
      } else {
        catMap["Other"] = (catMap["Other"] || 0) + r.amount;
      }
    });
    return Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredBilling]);

  // Today's Sales by Payment
  const todaySalesByPayment = useMemo(() => {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const todayBills = billingRecords.filter(r => {
      try { return isWithinInterval(parseISO(r.date), { start: todayStart, end: todayEnd }); }
      catch { return false; }
    });
    const methodMap: Record<string, number> = {};
    todayBills.forEach(r => {
      if (r.method && r.method !== "—") {
        methodMap[r.method] = (methodMap[r.method] || 0) + r.paid;
      }
      if (r.due > 0) {
        methodMap["Due"] = (methodMap["Due"] || 0) + r.due;
      }
    });
    return Object.entries(methodMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [billingRecords]);

  // Popular Medicine
  const popularMedicine = useMemo(() => {
    return [...medicines]
      .filter(m => m.soldOut > 0)
      .sort((a, b) => b.soldOut - a.soldOut)
      .slice(0, 5)
      .map(m => ({ id: m.id, name: m.name, sold: m.soldOut, price: m.price }));
  }, [medicines]);

  // Recent activity from real billing records
  const recentActivity = useMemo(() => {
    const iconMap: Record<string, { icon: React.ElementType; color: string; type: string }> = {
      "Lab Test": { icon: TestTube, color: "hsl(200, 80%, 45%)", type: "Lab" },
      "X-Ray": { icon: ScanLine, color: "hsl(38, 92%, 50%)", type: "X-Ray" },
      "Ultrasound": { icon: Heart, color: "hsl(270, 60%, 55%)", type: "USG" },
      "Consultation": { icon: Stethoscope, color: "hsl(160, 84%, 39%)", type: "OPD" },
    };
    const fallback = { icon: DollarSign, color: "hsl(142, 71%, 45%)", type: "Billing" };

    return billingRecords.slice(0, 6).map(r => {
      const match = Object.entries(iconMap).find(([k]) => r.service.toLowerCase().includes(k.toLowerCase()));
      const meta = match ? match[1] : fallback;
      return {
        id: r.id,
        description: `${r.service} — ${r.patient}`,
        time: r.date,
        ...meta,
      };
    });
  }, [billingRecords]);

  // Weekly chart from billing
  const weeklyData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);
    billingRecords.forEach(r => {
      try {
        const d = parseISO(r.date);
        counts[d.getDay()]++;
      } catch {}
    });
    return days.map((day, i) => ({ day, visits: counts[i] }));
  }, [billingRecords]);

  return (
    <div className="space-y-6 w-full">
      {/* ── Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 lg:p-7 text-white"
        style={{ background: "linear-gradient(135deg, hsl(168,80%,30%) 0%, hsl(200,80%,40%) 50%, hsl(240,60%,50%) 100%)" }}>
        <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute right-20 bottom-2 w-24 h-24 rounded-full bg-yellow-300/10" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-heading tracking-tight">{greeting}, Doctor!</h1>
            <p className="text-white/60 text-sm mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <Activity className="w-4 h-4" />
              <span className="text-lg font-bold font-number">{stats.totalPatients}</span>
              <span className="text-xs opacity-70">patients</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-bold font-number">{stats.pendingPatients}</span>
              <span className="text-xs opacity-70">in queue</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <ClipboardList className="w-4 h-4" />
              <span className="text-lg font-bold font-number">{stats.invoiceCount}</span>
              <span className="text-xs opacity-70">invoices</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Overview ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(142,71%,45%), hsl(160,84%,39%))" }}>
              <DollarSign className="w-4 h-4 text-white" />
            </span>
            Financial Overview
          </h2>
          <DashboardDateFilter
            preset={filterPreset}
            customRange={customRange}
            onPresetChange={setFilterPreset}
            onCustomRangeChange={setCustomRange}
          />
        </div>
        {/* Row 1: Hero cards - Total Bills, Profit, Loss */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(217,91%,55%), hsl(240,60%,50%))" }}>
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/5" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Total Bills</p>
                <p className="text-2xl font-black font-number tracking-tight leading-none">{formatDualPrice(stats.totalBills)}</p>
                <p className="text-xs text-white/60"><span className="font-bold font-number text-white/80">{stats.invoiceCount} invoices</span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(152,60%,38%), hsl(168,80%,30%))" }}>
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/5" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Profit</p>
                <p className="text-2xl font-black font-number tracking-tight leading-none">{formatDualPrice(stats.profit)}</p>
                <p className="text-xs text-white/60"><span className="font-bold font-number text-white/80">
                  <TrendingUp className="w-3 h-3 inline mr-1" />earned
                </span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(0,65%,50%), hsl(350,70%,42%))" }}>
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
            <div className="absolute -left-4 -bottom-4 w-16 h-16 rounded-full bg-white/5" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Loss</p>
                <p className="text-2xl font-black font-number tracking-tight leading-none">{formatDualPrice(stats.loss)}</p>
                <p className="text-xs text-white/60"><span className="font-bold font-number text-white/80">
                  <TrendingDown className="w-3 h-3 inline mr-1" />deficit
                </span></p>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/15 backdrop-blur-sm">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Secondary cards - Discount, Total Due, Expense, Total Invoice */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ borderLeft: "3px solid hsl(38, 92%, 50%)" }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(38, 92%, 50%)" }} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(38, 92%, 50%)" }}>Discount</p>
                <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none">{formatDualPrice(stats.totalDiscount)}</p>
                <p className="text-[10px] text-muted-foreground"><span className="font-bold font-number">{stats.invoiceCount} invoices</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(38, 92%, 50%, 0.12)" }}>
                <Percent className="w-5 h-5" style={{ color: "hsl(38, 92%, 50%)" }} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ borderLeft: "3px solid hsl(350, 65%, 55%)" }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(350, 65%, 55%)" }} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(350, 65%, 55%)" }}>Total Due</p>
                <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none">{formatDualPrice(stats.totalDue)}</p>
                <p className="text-[10px] text-muted-foreground"><span className="font-bold font-number">{stats.pendingInvoices} pending</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(350, 65%, 55%, 0.12)" }}>
                <TrendingDown className="w-5 h-5" style={{ color: "hsl(350, 65%, 55%)" }} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ borderLeft: "3px solid hsl(15, 85%, 52%)" }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(15, 85%, 52%)" }} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(15, 85%, 52%)" }}>Expense</p>
                <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none">{formatDualPrice(stats.totalExpense)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(15, 85%, 52%, 0.12)" }}>
                <Wallet className="w-5 h-5" style={{ color: "hsl(15, 85%, 52%)" }} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl p-4 bg-card border border-border/50 hover:shadow-md hover:-translate-y-0.5 transition-all group"
            style={{ borderLeft: "3px solid hsl(270, 60%, 55%)" }}>
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-[0.06] group-hover:opacity-[0.1] transition-opacity" style={{ background: "hsl(270, 60%, 55%)" }} />
            <div className="relative flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(270, 60%, 55%)" }}>Total Invoice</p>
                <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none">{String(stats.invoiceCount)}</p>
                <p className="text-[10px] text-muted-foreground"><span className="font-bold font-number">{stats.completedInvoices} completed</span></p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(270, 60%, 55%, 0.12)" }}>
                <ClipboardList className="w-5 h-5" style={{ color: "hsl(270, 60%, 55%)" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Suspense fallback={<div className="h-40 bg-muted/30 rounded-xl animate-pulse" />}>
            <LazyPaymentMethodChart data={paymentData} />
          </Suspense>
        </div>
      </section>

      {/* ── Clinical Overview ── */}
      <section>
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(200,80%,45%), hsl(220,70%,50%))" }}>
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground font-heading">Clinical Overview</h3>
              <p className="text-[10px] text-muted-foreground">Patient & diagnostic summary</p>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Users, title: "Patients", value: stats.totalPatients, sub: `${stats.activePatients} active`, color: "hsl(160, 50%, 38%)" },
                { icon: TestTube, title: "Lab Reports", value: stats.totalLabs, sub: `${stats.pendingLabs} pending`, color: "hsl(200, 80%, 45%)" },
                { icon: ScanLine, title: "X-Ray", value: xrayRecords.length, sub: `${stats.pendingXrays} pending`, color: "hsl(38, 70%, 48%)" },
                { icon: Heart, title: "Ultrasound", value: ultrasoundRecords.length, sub: `${stats.pendingUltrasounds} pending`, color: "hsl(280, 65%, 55%)" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:shadow-sm transition-all group" style={{ background: `${item.color}06` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `${item.color}14` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.title}</p>
                    <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none mt-0.5">{item.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Inventory Alerts ── */}
      {(stats.lowStockMeds + stats.outOfStockMeds + stats.lowStockInj + stats.outOfStockInj > 0) && (
        <section>
          <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(38,92%,50%), hsl(25,90%,50%))" }}>
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-card-foreground font-heading">Inventory Alerts</h3>
                <p className="text-[10px] text-muted-foreground">Stock level warnings</p>
              </div>
            </div>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Pill, title: "Low Stock Meds", value: stats.lowStockMeds, color: "hsl(38, 92%, 50%)" },
                  { icon: Package, title: "Out of Stock", value: stats.outOfStockMeds, color: "hsl(0, 70%, 50%)" },
                  { icon: Syringe, title: "Low Stock Inj.", value: stats.lowStockInj, color: "hsl(38, 70%, 48%)" },
                  { icon: Beaker, title: "Out of Stock Inj.", value: stats.outOfStockInj, color: "hsl(0, 60%, 45%)" },
                ].map((item) => (
                  <div key={item.title} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 hover:shadow-sm transition-all group" style={{ background: `${item.color}06` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: `${item.color}14` }}>
                      <item.icon className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.title}</p>
                      <p className="text-xl font-black text-card-foreground font-number tracking-tight leading-none mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(270,60%,55%), hsl(300,60%,50%))" }}>
              <ArrowRight className="w-4 h-4 text-white" />
            </span>
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {operationsData.map((op, i) => (
            <a
              key={i}
              href={op.path}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                style={{ background: op.bg }}
              >
                <op.icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-card-foreground group-hover:text-primary transition-colors">{op.label}</p>
                <p className="text-xs text-muted-foreground hidden lg:block">{op.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ── Analytics Grid ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity - from real billing */}
        <div className="bg-card rounded-xl border border-border/40 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: "linear-gradient(90deg, hsl(160,84%,39%), hsl(200,80%,45%), hsl(270,60%,55%))" }} />
          <h3 className="text-sm font-bold text-card-foreground font-heading flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(160,84%,39%), hsl(200,80%,45%))" }}>
              <Activity className="w-3.5 h-3.5 text-white" />
            </span>
            Recent Activity
          </h3>
          <div className="space-y-1.5">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${a.color}15` }}>
                  <a.icon className="w-4 h-4" style={{ color: a.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-card-foreground truncate">{a.description}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${a.color}12`, color: a.color }}>{a.type}</span>
                    <span className="text-[10px] text-muted-foreground">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="bg-card rounded-xl border border-border/40 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: "linear-gradient(90deg, hsl(200,80%,45%), hsl(38,92%,50%), hsl(350,65%,55%))" }} />
          <h3 className="text-sm font-bold text-card-foreground font-heading flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(200,80%,45%), hsl(38,92%,50%))" }}>
              <Calendar className="w-3.5 h-3.5 text-white" />
            </span>
            Weekly Billing Trend
          </h3>
          <Suspense fallback={<div className="h-[130px] bg-muted/30 rounded-lg animate-pulse" />}>
            <LazyWeeklyChart data={weeklyData} />
          </Suspense>
        </div>

        {/* Department Distribution */}
        <div className="bg-card rounded-xl border border-border/40 p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: "linear-gradient(90deg, hsl(270,60%,55%), hsl(340,70%,55%), hsl(142,71%,45%))" }} />
          <h3 className="text-sm font-bold text-card-foreground font-heading flex items-center gap-2 mb-4">
            <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg, hsl(270,60%,55%), hsl(340,70%,55%))" }}>
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </span>
            Department Distribution
          </h3>
          <Suspense fallback={<div className="h-[130px] bg-muted/30 rounded-lg animate-pulse" />}>
            <LazyDepartmentChart data={departmentData} />
          </Suspense>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
