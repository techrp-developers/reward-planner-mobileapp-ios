export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidPhone = (value: string) => PHONE_REGEX.test(value.trim());
export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim());

export const maskPhone = (phone: string) => {
  const digits = phone.trim();
  if (digits.length < 4) return digits;
  return `+91 ${digits.slice(0, 2)}••••${digits.slice(-2)}`;
};

export const maskEmail = (email: string) => {
  const [name, domain] = email.trim().split("@");
  if (!domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

export type ParsedIdentifier =
  | { kind: "phone"; normalized: string }
  | { kind: "email"; normalized: string }
  | { kind: "unknown"; normalized: string };

// Client-side pre-check for the single combined "mobile or email" input —
// lets the Welcome screen reject obviously-malformed input before making an
// API call. The backend's /v1/auth/check also auto-detects phone vs email
// (and is the source of truth via its `type` field in the response), so
// this is a fast-fail UX nicety, not the real detection logic.
export const parseIdentifier = (value: string): ParsedIdentifier => {
  const trimmed = value.trim();

  if (isValidEmail(trimmed)) {
    return { kind: "email", normalized: trimmed.toLowerCase() };
  }

  const digitsOnly = trimmed.replace(/[\s-]/g, "");
  if (isValidPhone(digitsOnly)) {
    return { kind: "phone", normalized: digitsOnly };
  }

  return { kind: "unknown", normalized: trimmed };
};
