import { useState, useEffect, useMemo } from "react";
import {
  getInvestors, getContributions, getInvestorById,
  addInvestor, updateInvestor, removeInvestor,
  addContribution, updateContribution, removeContribution,
  subscribeInvestments, allCategories, categoryColors,
  getTotalCapital, setTotalCapital,
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
import ImageLightbox, { type LightboxImage } from "@/components/ImageLightbox";
import { formatPrice } from "@/lib/currency";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip,
} from "recharts";
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
  const [lightboxImages, setLightboxImages] = useState<LightboxImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [editTotalCapital, setEditTotalCapital] = useState(false);
  const [totalCapitalInput, setTotalCapitalInput] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  const allCategoriesCombined = [...allCategories, ...customCategories as ContributionCategory[]];

  // Form states
  const [invForm, setInvForm] = useState({ name: "", sharePercent: 0, investmentName: "Capital Amount Investment", capitalAmount: 0, paid: 0, color: "hsl(217, 91%, 60%)" });
  const [contribForm, setContribForm] = useState<Omit<Contribution, "id">>({ date: new Date().toISOString().slice(0, 10), investmentName: "Capital Amount Investment", investorId: "", category: "Rental" as ContributionCategory, amount: 0, slipCount: 1, note: "", slipImages: [] });

  // Stats
  const totalCapital = getTotalCapital();
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
    if (invForm.sharePercent <= 0 || invForm.sharePercent > 100) { toast.error("Share % must be between 0 and 100"); return; }
    const othersTotal = investors.filter(i => i.id !== editInvestor?.id).reduce((s, i) => s + i.sharePercent, 0);
    if (othersTotal + invForm.sharePercent > 100) {
      toast.error(`Total share exceeds 100%. Available: ${(100 - othersTotal).toFixed(2)}%`);
      return;
    }
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
    const dataToSave = { ...contribForm, slipCount: contribForm.slipImages.length || contribForm.slipCount };
    if (editContrib) {
      updateContribution(editContrib.id, dataToSave);
      toast.success("Contribution updated");
    } else {
      addContribution(dataToSave);
      toast.success("Contribution added");
    }
    setShowContribDialog(false);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error(`Unsupported file: ${file.name}`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setContribForm((p) => ({ ...p, slipImages: [...p.slipImages, dataUrl], slipCount: p.slipImages.length + 1 }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeSlipImage = (index: number) => {
    setContribForm((p) => {
      const updated = p.slipImages.filter((_, i) => i !== index);
      return { ...p, slipImages: updated, slipCount: updated.length };
    });
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
    setTotalCapital(newTotal);
    toast.success("Total capital updated — all amounts recalculated from share %");
    setEditTotalCapital(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Investments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track capital, shares & contribution history</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={openAddCapital} className="gap-1.5 h-9 text-xs font-medium border-border">
            <Landmark className="w-3.5 h-3.5" /> Manage Investors
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowCategoryDialog(true)} className="gap-1.5 h-9 text-xs font-medium border-border">
            <Plus className="w-3.5 h-3.5" /> Category
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Capital", value: formatPrice(totalCapital), icon: Landmark, gradient: "from-blue-500/10 to-blue-600/5", iconBg: "bg-blue-500/15", iconColor: "text-blue-600 dark:text-blue-400", editable: true },
          { label: "Contributions", value: formatPrice(totalContributions), icon: Receipt, gradient: "from-violet-500/10 to-violet-600/5", iconBg: "bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400", extra: `${contributions.length} records`, editable: false },
          { label: "Total Paid", value: formatPrice(totalPaid), icon: CheckCircle, gradient: "from-emerald-500/10 to-emerald-600/5", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400", editable: false },
          { label: "Remaining", value: formatPrice(remaining), icon: AlertTriangle, gradient: remaining > 0 ? "from-orange-500/10 to-orange-600/5" : "from-emerald-500/10 to-emerald-600/5", iconBg: remaining > 0 ? "bg-orange-500/15" : "bg-emerald-500/15", iconColor: remaining > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400", editable: false },
        ].map((stat) => (
          <div key={stat.label} className={`relative bg-gradient-to-br ${stat.gradient} border border-border/60 rounded-xl p-4 backdrop-blur-sm`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconBg}`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              {stat.editable && (
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-background/60" onClick={() => { setTotalCapitalInput(String(totalCapital)); setEditTotalCapital(true); }}>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </Button>
              )}
            </div>
            <p className="text-xl font-extrabold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{stat.label}</p>
            {stat.extra && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.extra}</p>}
          </div>
        ))}
      </div>

      {/* Charts + Investor Cards - Side by side layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Charts Section */}
        <div className="xl:col-span-3">
          {(() => {
            const categoryData = (() => {
              const map = new Map<string, number>();
              contributions.forEach((c) => map.set(c.category, (map.get(c.category) || 0) + c.amount));
              return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            })();
            const pieColors = ["hsl(217,91%,60%)","hsl(270,60%,55%)","hsl(142,71%,45%)","hsl(15,85%,52%)","hsl(45,93%,47%)","hsl(330,65%,50%)","hsl(190,80%,45%)","hsl(95,55%,45%)","hsl(0,72%,51%)","hsl(210,40%,55%)","hsl(280,50%,60%)","hsl(160,60%,45%)","hsl(30,80%,55%)","hsl(350,70%,55%)"];
            return (
              <>
                {/* Pie Chart */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <h3 className="text-sm font-bold text-foreground mb-1">Category Breakdown</h3>
                  <p className="text-xs text-muted-foreground mb-3">Distribution of expenses by type</p>
                  <div className="flex items-start gap-6">
                    <ResponsiveContainer width={180} height={180}>
                      <PieChart>
                        <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={75} paddingAngle={2}>
                          {categoryData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                        </Pie>
                        <RechartsTooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => formatPrice(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5 max-h-[180px] overflow-y-auto pt-1">
                      {categoryData.map((cat, i) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pieColors[i % pieColors.length] }} />
                            <span className="text-muted-foreground truncate">{cat.name}</span>
                          </div>
                          <span className="font-semibold tabular-nums text-foreground flex-shrink-0">{formatPrice(cat.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Investor Cards */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Capital & Share</h3>
              <p className="text-xs text-muted-foreground">Investor allocation & payment status</p>
            </div>
            <Button size="sm" variant="outline" onClick={openAddCapital} className="h-8 gap-1 text-xs">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
          </div>

          {investors.map((inv) => {
            const progressPct = inv.capitalAmount > 0 ? Math.min(100, Math.round((inv.paid / inv.capitalAmount) * 100)) : 0;
            const dueAmount = Math.max(0, inv.capitalAmount - inv.paid);
            const isDue = dueAmount > 0;
            return (
              <div key={inv.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: inv.color }}>
                      {inv.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{inv.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">{inv.sharePercent}%</span>
                        {isDue && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-destructive/10 text-destructive">Due</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditCapital(inv)}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDeleteInvestor(inv)}><Trash2 className="w-3 h-3 text-destructive/60" /></Button>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span className="font-bold text-foreground">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60">
                  <div>
                    <p className="text-[9px] font-semibold uppercase text-muted-foreground">Capital</p>
                    <p className="text-xs font-bold text-foreground tabular-nums">{formatPrice(inv.capitalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase text-muted-foreground">Paid</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{formatPrice(inv.paid)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase text-muted-foreground">Due</p>
                    <p className="text-xs font-bold text-destructive tabular-nums">{formatPrice(dueAmount)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Contributions Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Contribution History</h3>
              <p className="text-xs text-muted-foreground">{filtered.length} records · Payment tracking for all investments</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={monthFilter} onValueChange={(v) => { setMonthFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={investorFilter} onValueChange={(v) => { setInvestorFilter(v); setPage(1); }}>
                <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Investor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Investors</SelectItem>
                  {investors.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-8 h-8 w-[150px] text-xs" />
              </div>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><LayoutList className="w-3.5 h-3.5" /></button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
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
                <tr className="border-b border-border bg-muted/40">
                  {["Date", "Investor", "Category", "Amount", "Slips", "Note", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => {
                  const inv = getInvestorById(c.investorId);
                  return (
                    <tr key={c.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{c.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {inv && <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: inv.color }}>{inv.name.charAt(0)}</div>}
                          <span className="text-xs font-medium">{inv?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${categoryColors[c.category] || "bg-muted text-muted-foreground"}`}>{c.category}</span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-foreground text-xs">{formatPrice(c.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><ImageIcon className="w-3 h-3" />{c.slipCount}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px] max-w-[180px] truncate">{c.note || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setViewContrib(c)}><Eye className="w-3 h-3 text-primary" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditContrib(c)}><Pencil className="w-3 h-3 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDeleteContrib(c)}><Trash2 className="w-3 h-3 text-destructive/60" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-muted-foreground text-sm">No contributions found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginated.map((c) => {
              const inv = getInvestorById(c.investorId);
              return (
                <div key={c.id} className="border border-border rounded-xl p-4 space-y-2.5 hover:shadow-md transition-all hover:border-border/80">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {inv && <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: inv.color }}>{inv.name.charAt(0)}</div>}
                      <div>
                        <p className="font-semibold text-xs">{inv?.name}</p>
                        <p className="text-[10px] text-muted-foreground">{c.date}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${categoryColors[c.category]}`}>{c.category}</span>
                  </div>
                  <p className="text-base font-extrabold text-foreground tabular-nums">{formatPrice(c.amount)}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{c.note || "—"}</p>
                  <div className="flex gap-0.5 pt-2 border-t border-border/60">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setViewContrib(c)}><Eye className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditContrib(c)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setDeleteContrib(c)}><Trash2 className="w-3 h-3 text-destructive/60" /></Button>
                  </div>
                </div>
              );
            })}
            {paginated.length === 0 && <p className="col-span-full text-center py-16 text-muted-foreground text-sm">No contributions found</p>}
          </div>
        )}

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {filtered.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filtered.length)} of {filtered.length}</span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-7 gap-1 text-xs"><ChevronLeft className="w-3.5 h-3.5" /></Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let p: number;
              if (totalPages <= 5) p = i + 1;
              else if (page <= 3) p = i + 1;
              else if (page >= totalPages - 2) p = totalPages - 4 + i;
              else p = page - 2 + i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`h-7 w-7 rounded-md text-xs font-medium transition-colors ${p === page ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{p}</button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="h-7 gap-1 text-xs"><ChevronRight className="w-3.5 h-3.5" /></Button>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="h-7 w-[55px] text-xs ml-2"><SelectValue /></SelectTrigger>
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
              <div>
                <Label className="text-xs mb-1 block">Share % <span className="text-muted-foreground font-normal">(Available: {(100 - investors.filter(i => i.id !== editInvestor?.id).reduce((s, i) => s + i.sharePercent, 0)).toFixed(1)}%)</span></Label>
                <Input type="number" min={0} max={100} value={invForm.sharePercent || ""} onChange={(e) => {
                  const pct = parseFloat(e.target.value) || 0;
                  const cap = Math.round((pct / 100) * totalCapital * 100) / 100;
                  setInvForm(p => ({ ...p, sharePercent: pct, capitalAmount: cap }));
                }} />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Capital Amount</Label>
                <Input type="number" min={0} value={invForm.capitalAmount || ""} readOnly className="bg-muted/50 cursor-not-allowed" />
                <p className="text-[10px] text-muted-foreground mt-1">Auto-calculated from share %</p>
              </div>
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
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <DialogTitle className="text-lg font-bold text-foreground">Record Contribution</DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Record a payment made by an investor toward an investment</p>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Investment */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Investment *</Label>
              <Select value={contribForm.investmentName} onValueChange={(v) => setContribForm(p => ({ ...p, investmentName: v }))}>
                <SelectTrigger className="h-11 text-sm border-border"><SelectValue placeholder="Select investment" /></SelectTrigger>
                <SelectContent>
                  {Array.from(new Set(investors.map(i => i.investmentName))).map(name => {
                    const total = investors.filter(i => i.investmentName === name).reduce((s, i) => s + i.capitalAmount, 0);
                    return <SelectItem key={name} value={name}>{name} ({formatPrice(total)})</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Investor */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Investor *</Label>
              <Select value={contribForm.investorId} onValueChange={(v) => setContribForm(p => ({ ...p, investorId: v }))}>
                <SelectTrigger className="h-11 text-sm border-border"><SelectValue placeholder="Select investor" /></SelectTrigger>
                <SelectContent>{investors.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Category</Label>
              <Select value={contribForm.category} onValueChange={(v) => setContribForm(p => ({ ...p, category: v as ContributionCategory }))}>
                <SelectTrigger className="h-11 text-sm border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{allCategoriesCombined.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* Amount & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Amount ($) *</Label>
                <Input type="number" min={0} className="h-11 text-sm" value={contribForm.amount || ""} onChange={(e) => setContribForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Date *</Label>
                <Input type="date" className="h-11 text-sm" value={contribForm.date} onChange={(e) => setContribForm(p => ({ ...p, date: e.target.value }))} />
              </div>
            </div>

            {/* Images */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Images</Label>
              <div className="border border-border rounded-lg overflow-hidden">
                <input type="file" multiple accept="image/*,.pdf" onChange={handleSlipUpload} className="hidden" id="slip-upload" />
                <label htmlFor="slip-upload" className="cursor-pointer flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Add Image</span>
                </label>
              </div>
              {contribForm.slipImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {contribForm.slipImages.map((img, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                      <img src={img} alt={`Slip ${idx + 1}`} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSlipImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Note */}
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Note</Label>
              <textarea
                value={contribForm.note}
                onChange={(e) => setContribForm(p => ({ ...p, note: e.target.value }))}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="px-6 pb-6">
            <Button onClick={saveContrib} className="w-full h-11 text-sm font-semibold">
              {editContrib ? "Update Contribution" : "Record Contribution"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Contribution */}
      <Dialog open={!!viewContrib} onOpenChange={() => setViewContrib(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Contribution Details</DialogTitle></DialogHeader>
          {viewContrib && (
            <div className="space-y-3 py-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{viewContrib.date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Investment</span><span className="font-medium">{viewContrib.investmentName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Investor</span><span className="font-medium">{getInvestorById(viewContrib.investorId)?.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Category</span><span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${categoryColors[viewContrib.category]}`}>{viewContrib.category}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-primary">{formatPrice(viewContrib.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Slips</span><span>{viewContrib.slipImages?.length || viewContrib.slipCount}</span></div>
              <div><span className="text-muted-foreground block mb-1">Note</span><p className="text-foreground">{viewContrib.note || "—"}</p></div>
              
              {/* Slip Images Gallery */}
              {viewContrib.slipImages && viewContrib.slipImages.length > 0 && (
                <div>
                  <span className="text-muted-foreground block mb-2">Attached Slips/Receipts</span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewContrib.slipImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          const lbImages: LightboxImage[] = viewContrib.slipImages.map((img, i) => ({
                            id: `slip-${i}`, name: `Slip ${i + 1}`, url: img, type: (img.includes("application/pdf") ? "pdf" : "image") as "image" | "pdf",
                          }));
                          setLightboxImages(lbImages);
                          setLightboxIndex(idx);
                          setLightboxOpen(true);
                        }}
                        className="relative rounded-lg overflow-hidden border border-border aspect-square group hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img src={img} alt={`Slip ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewContrib(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={(open) => { setLightboxOpen(open); if (!open) setLightboxImages([]); }}
      />

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

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Manage Categories</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input placeholder="New category name..." value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="h-10 text-sm" />
              <Button onClick={() => {
                const name = newCategory.trim();
                if (!name) { toast.error("Enter a category name"); return; }
                if ([...allCategories, ...customCategories].includes(name as ContributionCategory)) { toast.error("Category already exists"); return; }
                setCustomCategories(p => [...p, name]);
                setNewCategory("");
                toast.success(`Category "${name}" added`);
              }} className="h-10 px-4 shrink-0"><Plus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Default Categories</p>
              {allCategories.map(c => (
                <div key={c} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                  <span>{c}</span>
                  <span className="text-[10px] text-muted-foreground">Default</span>
                </div>
              ))}
              {customCategories.length > 0 && (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 mt-3">Custom Categories</p>
                  {customCategories.map(c => (
                    <div key={c} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                      <span>{c}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setCustomCategories(p => p.filter(x => x !== c)); toast.success(`Category "${c}" removed`); }}>
                        <Trash2 className="w-3 h-3 text-destructive/70" />
                      </Button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvestmentsPage;
