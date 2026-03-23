import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type PermissionAction = "view" | "create" | "edit" | "delete";

interface ModulePermission {
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

interface PermissionsContextType {
  permissions: ModulePermission[];
  loading: boolean;
  can: (module: string, action: PermissionAction) => boolean;
  isAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  permissions: [],
  loading: true,
  can: () => false,
  isAdmin: false,
});

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = profile?.role_name === "Admin";

  useEffect(() => {
    if (!profile?.role_id) {
      // No role assigned - give no permissions (unless no role means first user = admin)
      setPermissions([]);
      setLoading(false);
      return;
    }

    const fetchPermissions = async () => {
      const { data } = await supabase
        .from("role_permissions")
        .select("module, can_view, can_create, can_edit, can_delete")
        .eq("role_id", profile.role_id!);
      setPermissions(data || []);
      setLoading(false);
    };

    fetchPermissions();
  }, [profile?.role_id]);

  const can = (module: string, action: PermissionAction): boolean => {
    if (isAdmin) return true;
    const perm = permissions.find((p) => p.module === module);
    if (!perm) return false;
    switch (action) {
      case "view": return perm.can_view;
      case "create": return perm.can_create;
      case "edit": return perm.can_edit;
      case "delete": return perm.can_delete;
    }
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, can, isAdmin }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
