import { useState, useEffect, useMemo } from "react";
import {
  getInvestors, getContributions, getInvestorById,
  addInvestor, updateInvestor, removeInvestor,
  addContribution, updateContribution, removeContribution,
  subscribeInvestments, allCategories, categoryColors,
  type Investor, type Contribution, type ContributionCategory,
} from "@/data/investmentStore";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Landmark, Receipt, CheckCircle, AlertTriangle,
  Plus, Pencil, Trash2, Eye, Download, Search,
  ChevronLeft, ChevronRight, LayoutList, LayoutGrid,
  Image as ImageIcon, Upload, X, ZoomIn,
} from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import { formatPrice } from "@/lib/currency";
import { exportToExcel } from "@/lib/exportUtils";
import { toast } from "sonner";

const InvestmentsPage = () => {
  const [investors, setInvestors] = useState(getInvestors());
  const [contributions, setContributions] = useState(getContributions());
  useEffect(() => {
    const u = subscribeInvestments(() => {
      setInvestors([...getInvestors()]);
      setContributions([...getContributions()]);
    });
    return () => { u(); };
  }, []);

  // Filters
  const [monthFilter, setMonthFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [investorFilter, setInvestorFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Dialogs
  const [showCapitalDialog, setShowCapitalDialog] = useState(false);
  const [editInvestor, setEditInvestor] = useState<Investor | null>(null);
  const [deleteInvestor, setDeleteInvestor] = useState<Investor | null>(null);
  const [showContribDialog, setShowContribDialog] = useState(false);
  const [editContrib, setEditContrib] = useState<Contribution | null>(null);
  const [deleteContrib, setDeleteContrib] = useState<Contribution | null>(null);
  const [viewContrib, setViewContrib] = useState<Contribution | null>(null);
  const [editTotalCapital, setEditTotalCapital] = useState(false);
  const [totalCapitalInput, setTotalCapitalInput] = useState("");

  // Form states
  const [invForm, setInvForm] = useState({ name: "", sharePercent: 0, investmentName: "Capital Amount Investment", capitalAmount: 0, paid: 0, color: "hsl(217, 91%, 60%)" });
  const [contribForm, setContribForm] = useState<Omit<Contribution, "id">>({ date: new Date().toISOString().slice(0, 10), investmentName: "Capital Amount Investment", investorId: "", category: "Rental" as ContributionCategory, amount: 0, slipCount: 1, note: "", slipImages: [] });

  // Stats
  const totalCapital = investors.reduce((s, i) => s + i.capitalAmount, 0);
  const totalPaid = investors.reduce((s, i) => s + i.paid, 0);
  const totalContributions = contributions.reduce((s, c) => s + c.amount, 0);
  const remaining = totalCapital - totalPaid;

  // Filtered contributions
  const filtered = useMemo(() => {
    let data = contributions;
    if (monthFilter !== "all") {
      data = data.filter((c) => c.date.startsWith(monthFilter));
    }
    if (investorFilter !== "all") {
      data = data.filter((c) => c.investorId === investorFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => {
        const inv = getInvestorById(c.investorId);
        return (
          c.investmentName.toLowerCase().includes(q) ||
          (inv?.name || "").toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.note.toLowerCase().includes(q)
        );
      });
    }
    return data;
  }, [contributions, monthFilter, investorFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Months for filter
  const months = useMemo(() => {
    const set = new Set<string>();
    contributions.forEach((c) => set.add(c.date.slice(0, 7)));
    return Array.from(set).sort().reverse();
  }, [contributions]);

  // Handlers
  const openAddCapital = () => {
    setInvForm({ name: "", sharePercent: 0, investmentName: "Capital Amount Investment", capitalAmount: 0, paid: 0, color: `hsl(${Math.round(Math.random() * 360)}, 60%, 55%)` });
    setEditInvestor(null);
    setShowCapitalDialog(true);
  };
  const openEditCapital = (inv: Investor) => {
    setInvForm({ name: inv.name, sharePercent: inv.sharePercent, investmentName: inv.investmentName, capitalAmount: inv.capitalAmount, paid: inv.paid, color: inv.color });
    setEditInvestor(inv);
    setShowCapitalDialog(true);
  };
  const saveCapital = () => {
    if (!invForm.name) { toast.error("Name is required"); return; }
    if (editInvestor) {
      updateInvestor(editInvestor.id, invForm);
      toast.success("Investor updated");
    } else {
      addInvestor(invForm);
      toast.success("Investor added");
    }
    setShowCapitalDialog(false);
  };
  const handleDeleteInvestor = () => {
    if (deleteInvestor) { removeInvestor(deleteInvestor.id); toast.success("Investor removed"); setDeleteInvestor(null); }
  };

  const openAddContrib = () => {
    setContribForm({ date: new Date().toISOString().slice(0, 10), investmentName: "Capital Amount Investment", investorId: investors[0]?.id || "", category: "Rental", amount: 0, slipCount: 1, note: "", slipImages: [] });
    setEditContrib(null);
    setShowContribDialog(true);
  };
  const openEditContrib = (c: Contribution) => {
    setContribForm({ date: c.date, investmentName: c.investmentName, investorId: c.investorId, category: c.category, amount: c.amount, slipCount: c.slipCount, note: c.note, slipImages: c.slipImages || [] });
    setEditContrib(c);
    setShowContribDialog(true);
  };
  const saveContrib = () => {
    if (!contribForm.investorId) { toast.error("Select an investor"); return; }
    if (contribForm.amount <= 0) { toast.error("Amount must be > 0"); return; }
    if (editContrib) {
      updateContribution(editContrib.id, contribForm);
      toast.success("Contribution updated");
    } else {
      addContribution(contribForm);
      toast.success("Contribution added");
    }
    setShowContribDialog(false);
  };
  const handleDeleteContrib = () => {
    if (deleteContrib) { removeContribution(deleteContrib.id); toast.success("Contribution deleted"); setDeleteContrib(null); }
  };

  const handleExport = () => {
    const data = filtered.map((c) => ({
      Date: c.date, Investment: c.investmentName, Investor: getInvestorById(c.investorId)?.name || "", Category: c.category, Amount: c.amount, Slips: c.slipCount, Note: c.note,
    }));
    exportToExcel(data, [
      { key: "Date", header: "Date" }, { key: "Investment", header: "Investment" }, { key: "Investor", header: "Investor" },
      { key: "Category", header: "Category" }, { key: "Amount", header: "Amount" }, { key: "Slips", header: "Slips" }, { key: "Note", header: "Note" },
    ], "Investments");
    toast.success("Exported");
  };

  const handleUpdateTotalCapital = () => {
    const newTotal = parseFloat(totalCapitalInput);
    if (!newTotal || newTotal <= 0) { toast.error("Invalid amount"); return; }
    // Redistribute proportionally
    const oldTotal = totalCapital || 1;
    investors.forEach((inv) => {
      const newCap = (inv.capitalAmount / oldTotal) * newTotal;
      updateInvestor(inv.id, { capitalAmount: Math.round(newCap * 100) / 100 });
    });
    toast.success("Total capital updated");
    setEditTotalCapital(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Investments" description="Track capital, shares, and contribution history" />

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TOTAL CAPITAL", value: formatPrice(totalCapital), icon: Landmark, color: "hsl(217, 91%, 60%)", extra: null, editable: true },
          { label: "CONTRIBUTIONS", value: formatPrice(totalContributions), icon: Receipt, color: "hsl(270, 60%, 55%)", extra: `${contributions.length} records`, editable: false },
          { label: "TOTAL PAID", value: formatPrice(totalPaid), icon: CheckCircle, color: "hsl(142, 71%, 45%)", extra: null, editable: false },
          { label: "REMAINING", value: formatPrice(remaining), icon: AlertTriangle, color: remaining > 0 ? "hsl(15, 85%, 52%)" : "hsl(142, 71%, 45%)", extra: null, editable: false },
        ].map((stat) => (
          <div key={stat.label} className="relative bg-card border border-border rounded-xl p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{stat.value}</p>
              {stat.extra && <p className="text-xs text-muted-foreground mt-1">{stat.extra}</p>}
            </div>
            {stat.editable && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 absolute top-3 right-3" onClick={() => { setTotalCapitalInput(String(totalCapital)); setEditTotalCapital(true); }}>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Capital & Share */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-foreground uppercase tracking-wide">Capital & Share</h3>
            <p className="text-xs text-muted-foreground">Investor shares per investment — create, edit, or remove below</p>
          </div>
          <Button onClick={openAddCapital} className="gap-2"><Plus className="w-4 h-4" /> Add Capital</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {investors.map((inv) => {
            const progressPct = inv.capitalAmount > 0 ? Math.min(100, Math.round((inv.paid / inv.capitalAmount) * 100)) : 0;
            const dueAmount = Math.max(0, inv.capitalAmount - inv.paid);
            const payableAmount = dueAmount;
            const isDue = dueAmount > 0;
            return (
              <div key={inv.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: inv.color }}>
                      {inv.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{inv.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{inv.sharePercent}% share</span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">{inv.investmentName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isDue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Due</span>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditCapital(inv)}>
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteInvestor(inv)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Payment Progress</span>
                    <span className="font-bold">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-2" />
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Capital Amount</p>
                    <p className="text-sm font-bold text-foreground">{formatPrice(inv.capitalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Paid</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(inv.paid)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Due Investment</p>
                    <p className="text-sm font-bold text-destructive">{formatPrice(dueAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Payable Amount</p>
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(payableAmount)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributions */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-muted-foreground" />
              <div>
                <h3 className="text-base font-bold text-foreground">Contributions</h3>
                <p className="text-xs text-muted-foreground">Payment history for all investments</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Filter by Month</span>
                <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setPage(1); }}>
                  <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All months</SelectItem>
                    {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search by investor, invest..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-8 h-8 w-[180px] text-xs" />
              </div>
              <Select value={investorFilter} onValueChange={(v) => { setInvestorFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investors</SelectItem>
                  {investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`p-1.5 ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><LayoutList className="w-4 h-4" /></button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}><LayoutGrid className="w-4 h-4" /></button>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport} className="h-8 gap-1 text-xs"><Download className="w-3.5 h-3.5" /> Export</Button>
              <Button size="sm" onClick={openAddContrib} className="h-8 gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add</Button>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["Date", "Investment", "Investor", "Category", "Amount", "Slip", "Note", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const inv = getInvestorById(c.investorId);
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{c.date}</td>
                      <td className="px-4 py-3 font-medium">{c.investmentName}</td>
                      <td className="px-4 py-3">{inv?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${categoryColors[c.category] || "bg-muted text-muted-foreground"}`}>
                          {c.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-primary">{formatPrice(c.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ImageIcon className="w-3 h-3" /> {c.slipCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{c.note}</td>
                      <td className="px-4 py-3">
                        <TooltipProvider delayDuration={200}>
                          <div className="flex items-center gap-0.5">
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewContrib(c)}><Eye className="w-3.5 h-3.5 text-primary" /></Button></TooltipTrigger><TooltipContent>View</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditContrib(c)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent>Edit</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteContrib(c)}><Trash2 className="w-3.5 h-3.5 text-destructive/70" /></Button></TooltipTrigger><TooltipContent>Delete</TooltipContent></Tooltip>
                          </div>
                        </TooltipProvider>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No contributions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginated.map((c) => {
              const inv = getInvestorById(c.investorId);
              return (
                <div key={c.id} className="border border-border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{c.investmentName}</p>
                      <p className="text-xs text-muted-foreground">{inv?.name} · {c.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${categoryColors[c.category]}`}>{c.category}</span>
                  </div>
                  <p className="text-lg font-bold text-primary tabular-nums">{formatPrice(c.amount)}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.note}</p>
                  <div className="flex gap-1 pt-1 border-t border-border">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setViewContrib(c)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditContrib(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteContrib(c)}><Trash2 className="w-3.5 h-3.5 text-destructive/70" /></Button>
                  </div>
                </div>
              );
            })}
            {paginated.length === 0 && <p className="col-span-full text-center py-12 text-muted-foreground text-sm">No contributions found</p>}
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 gap-1 text-xs"><ChevronLeft className="w-3.5 h-3.5" /> Previous</Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-md text-xs font-medium ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{p}</button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 gap-1 text-xs">Next <ChevronRight className="w-3.5 h-3.5" /></Button>
            <span className="ml-2">Per page</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-[60px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Capital Dialog */}
      <Dialog open={showCapitalDialog} onOpenChange={setShowCapitalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editInvestor ? "Edit Investor" : "Add Capital"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label className="text-xs mb-1 block">Investor Name</Label><Input value={invForm.name} onChange={(e) => setInvForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Share %</Label><Input type="number" min={0} max={100} value={invForm.sharePercent || ""} onChange={(e) => setInvForm(p => ({ ...p, sharePercent: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs mb-1 block">Capital Amount</Label><Input type="number" min={0} value={invForm.capitalAmount || ""} onChange={(e) => setInvForm(p => ({ ...p, capitalAmount: parseFloat(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Investment Name</Label><Input value={invForm.investmentName} onChange={(e) => setInvForm(p => ({ ...p, investmentName: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Already Paid</Label><Input type="number" min={0} value={invForm.paid || ""} onChange={(e) => setInvForm(p => ({ ...p, paid: parseFloat(e.target.value) || 0 }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapitalDialog(false)}>Cancel</Button>
            <Button onClick={saveCapital}>{editInvestor ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribution Dialog */}
      <Dialog open={showContribDialog} onOpenChange={setShowContribDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editContrib ? "Edit Contribution" : "Add Contribution"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Date</Label><Input type="date" value={contribForm.date} onChange={(e) => setContribForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div>
                <Label className="text-xs mb-1 block">Investor</Label>
                <Select value={contribForm.investorId} onValueChange={(v) => setContribForm(p => ({ ...p, investorId: v }))}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{investors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Category</Label>
              <Select value={contribForm.category} onValueChange={(v) => setContribForm(p => ({ ...p, category: v as ContributionCategory }))}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>{allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Amount</Label><Input type="number" min={0} value={contribForm.amount || ""} onChange={(e) => setContribForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} /></div>
              <div><Label className="text-xs mb-1 block">Slip Count</Label><Input type="number" min={0} value={contribForm.slipCount || ""} onChange={(e) => setContribForm(p => ({ ...p, slipCount: parseInt(e.target.value) || 0 }))} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">Note</Label><Input value={contribForm.note} onChange={(e) => setContribForm(p => ({ ...p, note: e.target.value }))} placeholder="Description..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContribDialog(false)}>Cancel</Button>
            <Button onClick={saveContrib}>{editContrib ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contribution */}
      <Dialog open={!!viewContrib} onOpenChange={() => setViewContrib(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Contribution Details</DialogTitle></DialogHeader>
          {viewContrib && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{viewContrib.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Investment</span><span className="font-medium">{viewContrib.investmentName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Investor</span><span className="font-medium">{getInvestorById(viewContrib.investorId)?.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Category</span><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${categoryColors[viewContrib.category]}`}>{viewContrib.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{formatPrice(viewContrib.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slips</span><span>{viewContrib.slipCount}</span></div>
              <div><span className="text-muted-foreground block mb-1">Note</span><p className="text-foreground">{viewContrib.note || "—"}</p></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewContrib(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Total Capital */}
      <Dialog open={editTotalCapital} onOpenChange={setEditTotalCapital}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update Total Capital</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label className="text-xs mb-1 block">New Total Capital Amount</Label>
            <Input type="number" min={0} value={totalCapitalInput} onChange={(e) => setTotalCapitalInput(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-2">This will proportionally redistribute among all investors.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTotalCapital(false)}>Cancel</Button>
            <Button onClick={handleUpdateTotalCapital}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Investor */}
      <AlertDialog open={!!deleteInvestor} onOpenChange={() => setDeleteInvestor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Investor</AlertDialogTitle>
            <AlertDialogDescription>Remove <strong>{deleteInvestor?.name}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInvestor} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contribution */}
      <AlertDialog open={!!deleteContrib} onOpenChange={() => setDeleteContrib(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contribution</AlertDialogTitle>
            <AlertDialogDescription>Delete this contribution of <strong>{deleteContrib && formatPrice(deleteContrib.amount)}</strong>? The investor's paid amount will be adjusted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteContrib} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InvestmentsPage;
