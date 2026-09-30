import { NativeModules, Platform } from "react-native";

type PhoneNumberHintBridge = {
  getPhoneNumberHint: () => Promise<string | null>;
};

// Invoke only after the user chooses mobile login. No SIM/SMS permissions.
export async function getPhoneNumberHint(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  const bridge = NativeModules.PhoneNumberHint as PhoneNumberHintBridge | undefined;
  try {
    return (await bridge?.getPhoneNumberHint()) || null;
  } catch {
    return null;
  }
}

export function usePhoneHint() {
  return {
    requestHint: getPhoneNumberHint,
    unavailable: Platform.OS !== "android" || !NativeModules.PhoneNumberHint,
  };
}
