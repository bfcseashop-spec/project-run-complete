import { usePermissions } from "@/contexts/PermissionsContext";
import { Navigate } from "react-router-dom";

interface PermissionGateProps {
  module: string;
  children: React.ReactNode;
}

const PermissionGate = ({ module, children }: PermissionGateProps) => {
  const { can, isAdmin, loading } = usePermissions();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAdmin) return <>{children}</>;

  if (!can(module, "view")) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-center space-y-3 max-w-sm">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access <strong>{module}</strong>. Contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PermissionGate;
