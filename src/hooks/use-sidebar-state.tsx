import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const MOBILE_BP = 768;
const TABLET_BP = 1024;

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  isMobile: boolean;
  isTablet: boolean;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false, setCollapsed: () => {}, toggle: () => {},
  mobileOpen: false, setMobileOpen: () => {},
  isMobile: false, isTablet: false,
});

export const useSidebarState = () => useContext(SidebarContext);

export const SidebarStateProvider = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      setIsMobile(w < MOBILE_BP);
      setIsTablet(w >= MOBILE_BP && w < TABLET_BP);
      if (w < MOBILE_BP) {
        setCollapsed(false);
        setMobileOpen(false);
      } else if (w < TABLET_BP) {
        setCollapsed(true);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <SidebarContext.Provider value={{
      collapsed, setCollapsed,
      toggle: () => {
        if (isMobile) setMobileOpen(o => !o);
        else setCollapsed(c => !c);
      },
      mobileOpen, setMobileOpen,
      isMobile, isTablet,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
