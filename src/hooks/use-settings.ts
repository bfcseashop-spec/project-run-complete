import { useState, useEffect, useCallback } from "react";
import { getSettings, updateSettings, subscribeSettings, AppSettings } from "@/data/settingsStore";

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  useEffect(() => {
    const unsub = subscribeSettings(() => setSettings({ ...getSettings() }));
    return unsub;
  }, []);

  const update = useCallback((partial: Partial<AppSettings>) => {
    updateSettings(partial);
  }, []);

  return { settings, update };
};
