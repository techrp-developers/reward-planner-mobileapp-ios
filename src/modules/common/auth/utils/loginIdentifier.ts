export type LoginIdentifierKind = "email" | "phone" | "invalid" | "empty";

export type ParsedLoginIdentifier = {
  kind: LoginIdentifierKind;
  normalized: string;
};

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

const stripPhoneFormatting = (value: string) => value.replace(/[^\d]/g, "");

export const parseLoginIdentifier = (value: string): ParsedLoginIdentifier => {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return { kind: "empty", normalized: "" };
  }

  if (trimmed.includes("@")) {
    const normalizedEmail = trimmed.toLowerCase();
    return {
      kind: EMAIL_REGEX.test(normalizedEmail) ? "email" : "invalid",
      normalized: normalizedEmail,
    };
  }

  const digits = stripPhoneFormatting(trimmed);
  const normalizedPhone =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  return {
    kind: PHONE_REGEX.test(normalizedPhone) ? "phone" : "invalid",
    normalized: normalizedPhone,
  };
};

export const getLoginIdentifierKeyboardType = (value: string) => {
  const trimmed = String(value || "").trim();

  if (!trimmed) return "default" as const;
  if (/^[+\d\s()-]+$/.test(trimmed)) return "phone-pad" as const;
  return "email-address" as const;
};
