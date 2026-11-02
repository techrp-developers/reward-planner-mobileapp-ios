import i18n from "../../i18n";

/**
 * Claim statuses and member relations arrive as English strings from the
 * insurer API. Known values are shown in the app language; anything else is
 * shown exactly as received so no information is lost or invented.
 */
const STATUS_KEYS: Record<string, string> = {
  submitted: "insurance:status.submitted",
  "under review": "insurance:status.underReview",
  approved: "insurance:status.approved",
  rejected: "insurance:status.rejected",
  settled: "insurance:status.settled",
  pending: "insurance:status.pending",
  completed: "insurance:status.completed",
};

const RELATION_KEYS: Record<string, string> = {
  self: "insurance:relation.self",
  spouse: "insurance:relation.spouse",
  wife: "insurance:relation.wife",
  husband: "insurance:relation.husband",
  son: "insurance:relation.son",
  daughter: "insurance:relation.daughter",
  child: "insurance:relation.child",
  father: "insurance:relation.father",
  mother: "insurance:relation.mother",
  dependent: "insurance:relation.dependent",
};

export function claimStatusLabel(status?: string | null): string {
  if (!status) return i18n.t("insurance:status.underReview");
  const key = STATUS_KEYS[status.trim().toLowerCase()];
  return key ? i18n.t(key) : status;
}

export function relationLabel(relation?: string | null): string {
  if (!relation) return i18n.t("insurance:relation.dependent");
  const key = RELATION_KEYS[relation.trim().toLowerCase()];
  return key ? i18n.t(key) : relation;
}
