import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Keychain from "react-native-keychain";

const options = (key: string) => ({
  service: `com.rewardsplanners.session.${key}`,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
});

export async function secureSetItem(key: string, value: string): Promise<void> {
  const stored = await Keychain.setGenericPassword(key, value, options(key));
  if (!stored) throw new Error("Unable to securely save your session. Please try again.");
  // Remove a previous plaintext value only after secure persistence succeeds.
  await AsyncStorage.removeItem(key);
}

export async function secureGetItem(key: string): Promise<string | null> {
  const stored = await Keychain.getGenericPassword(options(key));
  if (stored) return stored.password;
  // Preserve existing sessions and device IDs when upgrading the app.
  const legacyValue = await AsyncStorage.getItem(key);
  if (!legacyValue) return null;
  await secureSetItem(key, legacyValue);
  return legacyValue;
}

export async function secureDeleteItem(key: string): Promise<void> {
  await Promise.all([
    Keychain.resetGenericPassword(options(key)),
    AsyncStorage.removeItem(key),
  ]);
}
