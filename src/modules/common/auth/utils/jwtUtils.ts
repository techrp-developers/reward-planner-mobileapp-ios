const decodeBase64Url = (segment: string) => {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "===".slice((normalized.length + 3) % 4);
  return atob(padded);
};

const decodeJwtPayload = (token: string): Record<string, any> | null => {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const json = decodeBase64Url(parts[1]);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getTokenExpiryMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return null;

  return payload.exp * 1000;
};

export const isTokenExpiringSoon = (token: string, bufferMs = 60000): boolean => {
  const expiryMs = getTokenExpiryMs(token);
  if (expiryMs === null) return true;

  return expiryMs - Date.now() <= bufferMs;
};
