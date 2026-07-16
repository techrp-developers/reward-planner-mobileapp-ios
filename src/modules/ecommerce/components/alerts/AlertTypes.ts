export type AlertType = "success" | "error" | "warning" | "info";

export interface AlertConfig {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  duration?: number; // ms, 0 = manual dismiss only
  actionText?: string;
  onAction?: () => void;
}

export interface AlertContextType {
  alerts: AlertConfig[];
  show: (config: Omit<AlertConfig, "id">) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}
