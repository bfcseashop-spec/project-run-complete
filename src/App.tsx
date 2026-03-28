import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import AppLayout from "@/components/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import PermissionGate from "@/components/PermissionGate";

// Lazy load all pages
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const MedicinePage = lazy(() => import("@/pages/MedicinePage"));
const OPDPage = lazy(() => import("@/pages/OPDPage"));
const PrescriptionPage = lazy(() => import("@/pages/PrescriptionPage"));
const DoctorPage = lazy(() => import("@/pages/DoctorPage"));
const DuesPage = lazy(() => import("@/pages/DuesPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const NewInvoicePage = lazy(() => import("@/pages/NewInvoicePage"));
const DraftsPage = lazy(() => import("@/pages/DraftsPage"));
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
const UsersAccessPage = lazy(() => import("@/pages/UsersAccessPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const LazyRoles = lazy(() => import("@/pages/PlaceholderPages").then((m) => ({ default: m.RolesPage })));
const LazyBank = lazy(() => import("@/pages/BankStatementPage"));
const LazyInvestments = lazy(() => import("@/pages/InvestmentsPage"));
const LabTechnologistsPage = lazy(() => import("@/pages/LabTechnologistsPage"));
const PatientLookupPage = lazy(() => import("@/pages/PatientLookupPage"));
const RegisterPatientPage = lazy(() => import("@/pages/RegisterPatientPage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="space-y-6 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-muted rounded-md" />
        <div className="h-4 w-72 bg-muted/60 rounded-md" />
      </div>
      <div className="h-9 w-32 bg-muted rounded-md" />
    </div>
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
    <div className="flex items-center gap-3">
      <div className="h-9 w-36 bg-muted rounded-md" />
      <div className="h-9 w-24 bg-muted/60 rounded-md" />
      <div className="flex-1" />
      <div className="h-9 w-20 bg-muted/60 rounded-md" />
      <div className="h-9 w-20 bg-muted/60 rounded-md" />
    </div>
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
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <PermissionsProvider>
                      <AppLayout />
                    </PermissionsProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<PermissionGate module="Dashboard"><Dashboard /></PermissionGate>} />
                <Route path="/billing" element={<PermissionGate module="Billing"><BillingPage /></PermissionGate>} />
                <Route path="/billing/new" element={<PermissionGate module="Billing"><NewInvoicePage /></PermissionGate>} />
                <Route path="/billing/edit" element={<PermissionGate module="Billing"><NewInvoicePage /></PermissionGate>} />
                <Route path="/billing/drafts" element={<PermissionGate module="Billing"><DraftsPage /></PermissionGate>} />
                <Route path="/medicine" element={<PermissionGate module="Medicine"><MedicinePage /></PermissionGate>} />
                <Route path="/opd" element={<PermissionGate module="OPD Section"><OPDPage /></PermissionGate>} />
                <Route path="/patient-lookup" element={<PermissionGate module="OPD Section"><PatientLookupPage /></PermissionGate>} />
                <Route path="/prescriptions" element={<PermissionGate module="Prescriptions"><PrescriptionPage /></PermissionGate>} />
                <Route path="/doctors" element={<PermissionGate module="Doctors"><DoctorPage /></PermissionGate>} />
                <Route path="/dues" element={<PermissionGate module="Due Management"><DuesPage /></PermissionGate>} />
                <Route path="/lab-tests" element={<PermissionGate module="Lab Tests"><LabTestsPage /></PermissionGate>} />
                <Route path="/lab-tests/add" element={<PermissionGate module="Lab Tests"><AddTestPage /></PermissionGate>} />
                <Route path="/lab-tests/names" element={<PermissionGate module="Test Names"><TestNamePage /></PermissionGate>} />
                <Route path="/lab-reports" element={<PermissionGate module="Lab Reports"><LabReportsPage /></PermissionGate>} />
                <Route path="/lab-technologists" element={<PermissionGate module="Lab Technologists"><LabTechnologistsPage /></PermissionGate>} />
                <Route path="/xray" element={<PermissionGate module="X-Ray"><XRayPage /></PermissionGate>} />
                <Route path="/ultrasound" element={<PermissionGate module="Ultrasound"><UltrasoundPage /></PermissionGate>} />
                <Route path="/sample-collection" element={<PermissionGate module="Sample Collection"><SampleCollectionPage /></PermissionGate>} />
                <Route path="/health-services" element={<PermissionGate module="Health Services"><HealthServicesPage /></PermissionGate>} />
                <Route path="/health-services/packages" element={<PermissionGate module="Health Packages"><HealthPackagesPage /></PermissionGate>} />
                <Route path="/injections" element={<PermissionGate module="Injections"><InjectionsPage /></PermissionGate>} />
                <Route path="/roles" element={<PermissionGate module="Roles"><LazyRoles /></PermissionGate>} />
                <Route path="/expenses" element={<PermissionGate module="Expenses"><ExpensesPage /></PermissionGate>} />
                <Route path="/bank" element={<PermissionGate module="Bank Transactions"><LazyBank /></PermissionGate>} />
                <Route path="/investments" element={<PermissionGate module="Investments"><LazyInvestments /></PermissionGate>} />
                <Route path="/settings" element={<PermissionGate module="Settings"><SettingsPage /></PermissionGate>} />
                <Route path="/system-manage" element={<PermissionGate module="System Manage"><SystemManagePage /></PermissionGate>} />
                <Route path="/refund" element={<PermissionGate module="Refund"><RefundPage /></PermissionGate>} />
                <Route path="/users-access" element={<PermissionGate module="Users & Access"><UsersAccessPage /></PermissionGate>} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
