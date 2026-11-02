import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../modules/common/auth/context/AuthContext";
import { getChatUserId } from "../modules/chat/identity";
import { updateNotificationPreferences } from "../modules/dashboard/notification/notificationPreferencesAPI";
import { applyLanguage } from "./index";
import { DEFAULT_LANGUAGE, type AppLanguage } from "./languages";
import { loadUserLanguage, saveUserLanguage } from "./languageStorage";

/**
 * - "signed-out": no user; the UI is English.
 * - "loading": reading the signed-in user's saved preference.
 * - "needs-selection": the user has never chosen a language (first login).
 * - "ready": the user's language is applied.
 */
export type LanguageStatus = "signed-out" | "loading" | "needs-selection" | "ready";

type LanguageContextValue = {
  language: AppLanguage;
  status: LanguageStatus;
  /** Applies a language across the app and saves it for the signed-in user. */
  setLanguage: (language: AppLanguage) => Promise<void>;
  /** First-login picker: saves the choice and continues into the app. */
  completeSelection: (language: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { i18n } = useTranslation();
  const userId = isAuthenticated ? getChatUserId(user) : undefined;
  const [status, setStatus] = useState<LanguageStatus>("signed-out");
  const owner = useRef<number | undefined>(undefined);
  const revision = useRef(0);
  // Serialize writes so a slower earlier save cannot overwrite the latest choice.
  const pendingSave = useRef<Promise<void>>(Promise.resolve());

  // Load each user's own preference; never carry one employee's choice to another.
  useEffect(() => {
    owner.current = userId;
    const loadRevision = ++revision.current;
    if (userId === undefined) {
      setStatus("signed-out");
      void applyLanguage(DEFAULT_LANGUAGE);
      return;
    }
    setStatus("loading");
    let active = true;
    void pendingSave.current.then(() => loadUserLanguage(userId)).then(async (saved) => {
      if (!active || owner.current !== userId || revision.current !== loadRevision) return;
      await applyLanguage(saved ?? DEFAULT_LANGUAGE);
      if (active && owner.current === userId && revision.current === loadRevision) setStatus(saved ? "ready" : "needs-selection");
    });
    return () => {
      active = false;
    };
  }, [userId]);

  const setLanguage = useCallback(
    async (language: AppLanguage) => {
      const id = owner.current;
      if (id === undefined) return;
      const requestRevision = ++revision.current;
      // Bundled resources apply immediately; persistence follows in selection order.
      const applied = applyLanguage(language);
      const saved = pendingSave.current.then(() => saveUserLanguage(id, language));
      pendingSave.current = saved.catch(() => undefined);
      try {
        await Promise.all([applied, saved]);
        // Push text follows the app language. Sends the language only, so it
        // can never change marketing or engagement consent.
        updateNotificationPreferences({ language }).catch(() => {});
      } catch (error) {
        if (owner.current === id && revision.current === requestRevision) {
          // An earlier queued save may have succeeded. Restore what is durable.
          const stored = await loadUserLanguage(id);
          if (owner.current === id && revision.current === requestRevision) {
            await applyLanguage(stored ?? DEFAULT_LANGUAGE);
          }
        }
        throw error;
      }
    },
    []
  );

  const completeSelection = useCallback(
    async (language: AppLanguage) => {
      const id = owner.current;
      const operation = setLanguage(language);
      const requestRevision = revision.current;
      await operation;
      if (id !== undefined && owner.current === id && revision.current === requestRevision) setStatus("ready");
    },
    [setLanguage]
  );

  const language = (i18n.resolvedLanguage ?? i18n.language) as AppLanguage;
  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      // Auth can change before the preference-loading effect runs. Hide the
      // previous account's app screens during that render too.
      status: owner.current === userId ? status : userId === undefined ? "signed-out" : "loading",
      setLanguage,
      completeSelection,
    }),
    [language, status, userId, setLanguage, completeSelection]
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useAppLanguage must be used inside LanguageProvider");
  return context;
}
