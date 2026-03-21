import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import MedicinePage from "@/pages/MedicinePage";
import OPDPage from "@/pages/OPDPage";
import PrescriptionPage from "@/pages/PrescriptionPage";
import DoctorPage from "@/pages/DoctorPage";
import DuesPage from "@/pages/DuesPage";
import BillingPage from "@/pages/BillingPage";
import NewInvoicePage from "@/pages/NewInvoicePage";
import LabTestsPage from "@/pages/LabTestsPage";
import AddTestPage from "@/pages/AddTestPage";
import TestNamePage from "@/pages/TestNamePage";
import UltrasoundPage from "@/pages/UltrasoundPage";
import {
  HRMPage, RolesPage, BankPage, InvestmentsPage
} from "@/pages/PlaceholderPages";
import ExpensesPage from "@/pages/ExpensesPage";
import SampleCollectionPage from "@/pages/SampleCollectionPage";
import LabReportsPage from "@/pages/LabReportsPage";
import XRayPage from "@/pages/XRayPage";
import HealthServicesPage from "@/pages/HealthServicesPage";
import HealthPackagesPage from "@/pages/HealthPackagesPage";
import InjectionsPage from "@/pages/InjectionsPage";
import SettingsPage from "@/pages/SettingsPage";
import SystemManagePage from "@/pages/SystemManagePage";
import RefundPage from "@/pages/RefundPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/billing/new" element={<NewInvoicePage />} />
            <Route path="/billing/edit" element={<NewInvoicePage />} />
            <Route path="/medicine" element={<MedicinePage />} />
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
            <Route path="/hrm" element={<HRMPage />} />
            <Route path="/roles" element={<RolesPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/bank" element={<BankPage />} />
            <Route path="/investments" element={<InvestmentsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/system-manage" element={<SystemManagePage />} />
            <Route path="/refund" element={<RefundPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;