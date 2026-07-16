/**
 * Debugging helpers for the BBPS recharge/bill-pay order flow.
 * Not wired into production logic — call manually from a screen or REPL
 * when an operator-specific failure needs to be diffed against a known-good
 * payload, or when you need exact request details for a backend ticket.
 */

export type RechargeOrderPayload = {
  operator_id: string;
  utility_acc_no?: string;
  circle_id?: string;
  plan_id?: string;
  bill_fetch_id?: number | string;
  sender_name?: string;
  [key: string]: any;
};

export type PayloadDiff = {
  field: string;
  a: any;
  b: any;
  same: boolean;
};

/**
 * Field-by-field diff of two create-order payloads (e.g. a working Airtel
 * request vs. a failing Jio request) so type/shape mismatches — string vs
 * number, missing field, unexpected casing — jump out immediately.
 */
export const compareRechargePayloads = (
  payloadA: Record<string, any>,
  payloadB: Record<string, any>,
  labelA = "A",
  labelB = "B"
): PayloadDiff[] => {
  const fields = Array.from(new Set([...Object.keys(payloadA), ...Object.keys(payloadB)]));

  const diffs: PayloadDiff[] = fields.map((field) => {
    const a = payloadA[field];
    const b = payloadB[field];
    return {
      field,
      a,
      b,
      same: a === b,
    };
  });

  if (__DEV__) {
    __DEV__ && console.log(`[compareRechargePayloads] ${labelA} vs ${labelB}`);
    diffs.forEach((diff) => {
      const marker = diff.same ? "=" : "≠";
      __DEV__ && console.log(
        `  ${marker} ${diff.field}: ${labelA}=${JSON.stringify(diff.a)} (${typeof diff.a}) | ${labelB}=${JSON.stringify(diff.b)} (${typeof diff.b})`
      );
    });

    const mismatches = diffs.filter((d) => !d.same);
    if (mismatches.length > 0) {
      console.warn(
        `[compareRechargePayloads] ${mismatches.length} field(s) differ:`,
        mismatches.map((d) => d.field)
      );
    } else {
      __DEV__ && console.log("[compareRechargePayloads] Payloads are structurally identical.");
    }
  }

  return diffs;
};

/**
 * Produces a copy-pasteable block for handing to a backend engineer or
 * pasting straight into Postman — exact method, URL, headers, and body for
 * the failing request.
 */
export const buildPostmanChecklist = (
  url: string,
  payload: Record<string, any>,
  headers: Record<string, any> = {}
): string => {
  const headerLines = Object.entries({
    "Content-Type": "application/json",
    ...headers,
  })
    .map(([key, value]) => `  ${key}: ${value}`)
    .join("\n");

  return [
    "### Postman / curl verification checklist",
    "",
    "Method: POST",
    `URL: ${url}`,
    "",
    "Headers:",
    headerLines,
    "",
    "Body (raw JSON):",
    JSON.stringify(payload, null, 2),
    "",
    "curl:",
    `curl -X POST "${url}" \\`,
    ...Object.entries({ "Content-Type": "application/json", ...headers }).map(
      ([key, value]) => `  -H "${key}: ${value}" \\`
    ),
    `  -d '${JSON.stringify(payload)}'`,
  ].join("\n");
};
