import type { KeyboardTypeOptions } from "react-native";

import { parseIdentifier } from "./validators";

// Employee lookup expects ten national digits, without +91. Never truncate
// foreign or invalid numbers into an Indian number.
export const normalizeIndianMobile = (value: string): string | null => {
  const compact = value.trim().replace(/[\s()-]/g, "");
  const national = compact.startsWith("+91")
    ? compact.slice(3)
    : compact.startsWith("0091")
      ? compact.slice(4)
      : /^91\d{10}$/.test(compact)
        ? compact.slice(2)
        : compact;
  return /^[6-9]\d{9}$/.test(national) ? national : null;
};

export type LoginIdentifier =
  | { kind: "empty"; normalized: "" }
  | { kind: "invalid"; normalized: string }
  | { kind: "phone"; normalized: string }
  | { kind: "email"; normalized: string };

export const parseLoginIdentifier = (value: string): LoginIdentifier => {
  const trimmed = value.trim();

  if (!trimmed) {
    return { kind: "empty", normalized: "" };
  }

  const phone = normalizeIndianMobile(trimmed);
  if (phone) return { kind: "phone", normalized: phone };
  const parsed = parseIdentifier(trimmed);

  if (parsed.kind === "unknown") {
    return { kind: "invalid", normalized: parsed.normalized };
  }

  return parsed;
};

export const getLoginIdentifierKeyboardType = (
  value: string,
): KeyboardTypeOptions => {
  const trimmed = value.trim();

  if (!trimmed) {
    return "default";
  }

  return /^[\d\s()+-]+$/.test(trimmed) ? "phone-pad" : "email-address";
};
