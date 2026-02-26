import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS_TOKEN_KEY = 'schediora.accessToken';
const REFRESH_TOKEN_KEY = 'schediora.refreshToken';
const ONBOARDING_DONE_KEY = 'schediora.onboardingDone';

export async function saveAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}

export async function getAuthTokens(): Promise<{ accessToken: string | null; refreshToken: string | null }> {
  const entries = await AsyncStorage.multiGet([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
  const accessToken = entries[0]?.[1] ?? null;
  const refreshToken = entries[1]?.[1] ?? null;

  return { accessToken, refreshToken };
}

export async function clearAuthTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function saveOnboardingDone(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_DONE_KEY, value ? '1' : '0');
}

export async function getOnboardingDone(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return value === '1';
}
