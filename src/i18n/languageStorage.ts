import AsyncStorage from "@react-native-async-storage/async-storage";
import { isAppLanguage, type AppLanguage } from "./languages";

/**
 * Language preferences are stored per authenticated user, so several
 * employees sharing one phone never inherit each other's choice. The backend
 * has no profile-language field yet; when it does, sync it here.
 */
const KEY_PREFIX = "rp.language.v1.user.";

const keyFor = (userId: number | string) => `${KEY_PREFIX}${userId}`;

/** Returns the user's saved language, or null when none (or a corrupt value) is stored. */
export async function loadUserLanguage(
  userId: number | string
): Promise<AppLanguage | null> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { language?: unknown };
    return isAppLanguage(parsed?.language) ? parsed.language : null;
  } catch {
    return null;
  }
}

export async function saveUserLanguage(
  userId: number | string,
  language: AppLanguage
): Promise<void> {
  await AsyncStorage.setItem(
    keyFor(userId),
    JSON.stringify({ language, updatedAt: new Date().toISOString() })
  );
}
