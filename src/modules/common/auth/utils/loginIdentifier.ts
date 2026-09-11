import type { KeyboardTypeOptions } from "react-native";

import { parseIdentifier } from "./validators";

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
