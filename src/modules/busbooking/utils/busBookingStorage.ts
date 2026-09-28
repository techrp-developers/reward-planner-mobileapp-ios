import AsyncStorage from "@react-native-async-storage/async-storage";

export type StoredPassengerProfile = {
  id: string;
  title: string;
  fullName: string;
  age: string;
  gender: "M" | "F" | "O";
  email: string;
  phone: string;
  idNumber: string;
  idType: string;
  address: string;
  updatedAt: string;
};

export type StoredRecentSearch = {
  id: string;
  fromCityCode: string;
  fromCityName: string;
  fromStateName: string;
  toCityCode: string;
  toCityName: string;
  toStateName: string;
  journeyDate: string;
  journeyTime: string;
  updatedAt: string;
};

const PASSENGER_PROFILES_KEY = "@busbooking/passenger-profiles";
const RECENT_SEARCHES_KEY = "@busbooking/recent-searches";
const MAX_PASSENGER_PROFILES = 8;
const MAX_RECENT_SEARCHES = 6;

const safeParseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizePassengerProfile = (
  profile: StoredPassengerProfile
): StoredPassengerProfile => {
  const phone = String(profile.phone || "").replace(/\D/g, "").slice(0, 10);
  const email = String(profile.email || "").trim();
  const fullName = String(profile.fullName || "").trim();
  const normalizedName = fullName.toLowerCase();

  return {
    id:
      profile.id ||
      phone ||
      `${normalizedName}-${email || "profile"}`,
    title: String(profile.title || "Mr"),
    fullName,
    age: String(profile.age || ""),
    gender: profile.gender || "M",
    email,
    phone,
    idNumber: String(profile.idNumber || "").trim(),
    idType: String(profile.idType || "").trim(),
    address: String(profile.address || "").trim(),
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };
};

const normalizeRecentSearch = (
  search: StoredRecentSearch
): StoredRecentSearch => ({
  id:
    search.id ||
    [
      String(search.fromCityCode || "").trim(),
      String(search.toCityCode || "").trim(),
      String(search.journeyDate || "").trim(),
    ].join("-"),
  fromCityCode: String(search.fromCityCode || "").trim(),
  fromCityName: String(search.fromCityName || "").trim(),
  fromStateName: String(search.fromStateName || "").trim(),
  toCityCode: String(search.toCityCode || "").trim(),
  toCityName: String(search.toCityName || "").trim(),
  toStateName: String(search.toStateName || "").trim(),
  journeyDate: String(search.journeyDate || "").trim(),
  journeyTime: String(search.journeyTime || "").trim(),
  updatedAt: search.updatedAt || new Date().toISOString(),
});

export const loadPassengerProfiles = async (): Promise<StoredPassengerProfile[]> => {
  const raw = await AsyncStorage.getItem(PASSENGER_PROFILES_KEY);
  const parsed = safeParseJson<StoredPassengerProfile[]>(raw, []);

  return parsed
    .map(normalizePassengerProfile)
    .filter((profile) => profile.fullName && profile.phone);
};

export const savePassengerProfiles = async (
  profiles: StoredPassengerProfile[]
): Promise<void> => {
  const merged = profiles
    .map(normalizePassengerProfile)
    .filter((profile) => profile.fullName && profile.phone);
  const deduped = new Map<string, StoredPassengerProfile>();

  merged.forEach((profile) => {
    const key = profile.phone || `${profile.fullName.toLowerCase()}-${profile.email.toLowerCase()}`;
    deduped.set(key, profile);
  });

  const ordered = Array.from(deduped.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_PASSENGER_PROFILES);

  await AsyncStorage.setItem(PASSENGER_PROFILES_KEY, JSON.stringify(ordered));
};

export const upsertPassengerProfiles = async (
  profiles: StoredPassengerProfile[]
): Promise<void> => {
  const existing = await loadPassengerProfiles();
  await savePassengerProfiles([...profiles, ...existing]);
};

export const deletePassengerProfile = async (profileId: string): Promise<void> => {
  const existing = await loadPassengerProfiles();
  const filtered = existing.filter((profile) => profile.id !== profileId);
  await savePassengerProfiles(filtered);
};

export const loadRecentSearches = async (): Promise<StoredRecentSearch[]> => {
  const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
  const parsed = safeParseJson<StoredRecentSearch[]>(raw, []);

  return parsed
    .map(normalizeRecentSearch)
    .filter((search) => search.fromCityCode && search.toCityCode && search.journeyDate);
};

export const saveRecentSearch = async (
  search: StoredRecentSearch
): Promise<void> => {
  const normalizedSearch = normalizeRecentSearch(search);
  const existing = await loadRecentSearches();
  const deduped = new Map<string, StoredRecentSearch>();

  [normalizedSearch, ...existing].forEach((item) => {
    const key = `${item.fromCityCode}-${item.toCityCode}`;
    deduped.set(key, item);
  });

  const ordered = Array.from(deduped.values())
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, MAX_RECENT_SEARCHES);

  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(ordered));
};
