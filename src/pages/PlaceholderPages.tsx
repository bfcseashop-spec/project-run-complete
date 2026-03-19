import PageHeader from "@/components/PageHeader";
import { FileText, TestTube, Scan, MonitorSpeaker, Heart, Users, UserCog, DollarSign, CreditCard, TrendingUp, Pipette } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

const PlaceholderPage = ({ title, description, icon: Icon }: PlaceholderPageProps) => (
  <div className="space-y-6">
    <PageHeader title={title} description={description} />
    <div className="bg-card rounded-xl border border-border shadow-card p-12 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground font-heading mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md">
        This module is ready to be configured. Add records and manage your {title.toLowerCase()} data here.
      </p>
    </div>
  </div>
);



export const UltrasoundPage = () => <PlaceholderPage title="Ultrasound" description="Manage ultrasound procedures and results" icon={MonitorSpeaker} />;


export const HRMPage = () => <PlaceholderPage title="HRM" description="Human resource management and payroll" icon={Users} />;
export const RolesPage = () => <PlaceholderPage title="Roles & Permissions" description="Manage user roles and access control" icon={UserCog} />;
export const ExpensesPage = () => <PlaceholderPage title="Expenses" description="Track and categorize clinic expenditures" icon={DollarSign} />;
export const BankPage = () => <PlaceholderPage title="Bank Transactions" description="Manage banking activities and reconciliation" icon={CreditCard} />;
export const InvestmentsPage = () => <PlaceholderPage title="Investments" description="Track investment portfolio and returns" icon={TrendingUp} />;
