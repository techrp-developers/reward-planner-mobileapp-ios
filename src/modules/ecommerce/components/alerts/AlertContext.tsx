import React, { createContext, useState, useCallback, ReactNode } from "react";
import { AlertConfig, AlertContextType } from "./AlertTypes";

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<AlertConfig[]>([]);

  const dismiss = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const show = useCallback(
    (config: Omit<AlertConfig, "id">): string => {
      const id = `alert-${Date.now()}-${Math.random()}`;
      const alert: AlertConfig = { ...config, id };

      setAlerts((prev) => [...prev, alert]);

      // Auto-dismiss if duration is set
      if (config.duration && config.duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, config.duration);
      }

      return id;
    },
    [dismiss]
  );

  const dismissAll = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, show, dismiss, dismissAll }}>
      {children}
    </AlertContext.Provider>
  );
}
