import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY  = "@rewardsplanners_access_token";
const REFRESH_TOKEN_KEY = "@rewardsplanners_refresh_token";
const USER_NAME_KEY     = "@rewardsplanners_user_name";

export const AUTH_USER_NAME_KEY = USER_NAME_KEY;

export const saveSession = async (
  accessToken: string,
  refreshToken: string,
  userName?: string | null,
): Promise<void> => {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ];
  if (userName) {
    entries.push([USER_NAME_KEY, userName]);
  }
  await AsyncStorage.multiSet(entries);
};

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getCachedUserName = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_NAME_KEY);
};

export const updateAccessToken = async (accessToken: string): Promise<void> => {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

export const clearAccessToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const clearSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_NAME_KEY]);
};
