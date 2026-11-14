export type UserGender = "male" | "female" | "default";

// Accepts the spellings used across the backend: fitness_profiles stores
// "male" / "female" / "other", bus booking uses "M" / "F" / "O".
// NOTE: /v1/auth/user-info does not return `gender` yet; until the backend
// adds it every user resolves to "default".
export const normalizeGender = (value: unknown): UserGender => {
  const g = String(value ?? "").trim().toLowerCase();
  if (g === "male" || g === "m") return "male";
  if (g === "female" || g === "f") return "female";
  return "default";
};

/** Reads gender from the shape returned by fetchUserInfo(). */
export const genderFromUserInfo = (data: any): UserGender =>
  normalizeGender(data?.user?.gender);

// Gender just saved in StepForm, kept in memory until the profile-plan query
// refetches with the persisted value. Cleared when the signed-in account
// changes (see useFitnessAccountScope) so it never leaks to another user.
let selectedGender: string | null = null;

export const rememberSelectedGender = (value: string) => {
  selectedGender = value;
};

export const getSelectedGender = () => selectedGender;

export const clearSelectedGender = () => {
  selectedGender = null;
};
