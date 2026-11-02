import { api } from "../../common/auth/api/axios";

export type NotificationLanguage = "en" | "hi" | "mr";

export type NotificationPreferences = {
  language: NotificationLanguage;
  marketing_enabled: boolean;
  engagement_enabled: boolean;
  quiet_hours_start: string | null; // "HH:MM"
  quiet_hours_end: string | null;
  stored: boolean; // false: defaults only, never consent
};

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get("/v1/notification/preferences");
  return response.data.data;
};

// Sends only the changed fields; quiet hours must be sent as a pair.
export const updateNotificationPreferences = async (
  update: Partial<Omit<NotificationPreferences, "stored">>,
): Promise<NotificationPreferences> => {
  const response = await api.put("/v1/notification/preferences", update);
  return response.data.data;
};
