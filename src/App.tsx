import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import AppLayout from "@/components/AppLayout";

// Lazy load all pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MedicinePage = lazy(() => import("@/pages/MedicinePage"));
const MedicineInventoryPage = lazy(() => import("@/pages/MedicineInventoryPage"));
const OPDPage = lazy(() => import("@/pages/OPDPage"));
const PrescriptionPage = lazy(() => import("@/pages/PrescriptionPage"));
const DoctorPage = lazy(() => import("@/pages/DoctorPage"));
const DuesPage = lazy(() => import("@/pages/DuesPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const NewInvoicePage = lazy(() => import("@/pages/NewInvoicePage"));
const LabTestsPage = lazy(() => import("@/pages/LabTestsPage"));
const AddTestPage = lazy(() => import("@/pages/AddTestPage"));
const TestNamePage = lazy(() => import("@/pages/TestNamePage"));
const UltrasoundPage = lazy(() => import("@/pages/UltrasoundPage"));
const ExpensesPage = lazy(() => import("@/pages/ExpensesPage"));
const SampleCollectionPage = lazy(() => import("@/pages/SampleCollectionPage"));
const LabReportsPage = lazy(() => import("@/pages/LabReportsPage"));
const XRayPage = lazy(() => import("@/pages/XRayPage"));
const HealthServicesPage = lazy(() => import("@/pages/HealthServicesPage"));
const HealthPackagesPage = lazy(() => import("@/pages/HealthPackagesPage"));
const InjectionsPage = lazy(() => import("@/pages/InjectionsPage"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const SystemManagePage = lazy(() => import("@/pages/SystemManagePage"));
const RefundPage = lazy(() => import("@/pages/RefundPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const LazyRoles = lazy(() =>
  import("@/pages/PlaceholderPages").then((m) => ({ default: m.RolesPage }))
);
const LazyBank = lazy(() =>
  import("@/pages/PlaceholderPages").then((m) => ({ default: m.BankPage }))
);
const LazyInvestments = lazy(() =>
  import("@/pages/PlaceholderPages").then((m) => ({ default: m.InvestmentsPage }))
);

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="space-y-6 p-6 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-muted rounded-md" />
        <div className="h-4 w-72 bg-muted/60 rounded-md" />
      </div>
      <div className="h-9 w-32 bg-muted rounded-md" />
    </div>
    {/* Stat cards skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted/60 rounded-lg" />
          </div>
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-3 w-24 bg-muted/40 rounded" />
        </div>
      ))}
    </div>
    {/* Toolbar skeleton */}
    <div className="flex items-center gap-3">
      <div className="h-9 w-36 bg-muted rounded-md" />
      <div className="h-9 w-24 bg-muted/60 rounded-md" />
      <div className="flex-1" />
      <div className="h-9 w-20 bg-muted/60 rounded-md" />
      <div className="h-9 w-20 bg-muted/60 rounded-md" />
    </div>
    {/* Table skeleton */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-muted/30">
        {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-muted rounded" />)}
      </div>
      {[...Array(5)].map((_, row) => (
        <div key={row} className="grid grid-cols-6 gap-4 px-4 py-3.5 border-t border-border">
          {[...Array(6)].map((_, col) => <div key={col} className="h-4 bg-muted/50 rounded" style={{ width: `${50 + Math.random() * 40}%` }} />)}
        </div>
      ))}
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/billing/new" element={<NewInvoicePage />} />
              <Route path="/billing/edit" element={<NewInvoicePage />} />
              <Route path="/medicine" element={<MedicinePage />} />
              <Route path="/medicine/inventory" element={<MedicineInventoryPage />} />
              <Route path="/opd" element={<OPDPage />} />
              <Route path="/prescriptions" element={<PrescriptionPage />} />
              <Route path="/doctors" element={<DoctorPage />} />
              <Route path="/dues" element={<DuesPage />} />
              <Route path="/lab-tests" element={<LabTestsPage />} />
              <Route path="/lab-tests/add" element={<AddTestPage />} />
              <Route path="/lab-tests/names" element={<TestNamePage />} />
              <Route path="/lab-reports" element={<LabReportsPage />} />
              <Route path="/xray" element={<XRayPage />} />
              <Route path="/ultrasound" element={<UltrasoundPage />} />
              <Route path="/sample-collection" element={<SampleCollectionPage />} />
              <Route path="/health-services" element={<HealthServicesPage />} />
              <Route path="/health-services/packages" element={<HealthPackagesPage />} />
              <Route path="/injections" element={<InjectionsPage />} />
              <Route path="/hrm" element={<LazyPlaceholders />} />
              <Route path="/roles" element={<LazyRoles />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/bank" element={<LazyBank />} />
              <Route path="/investments" element={<LazyInvestments />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/system-manage" element={<SystemManagePage />} />
              <Route path="/refund" element={<RefundPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
