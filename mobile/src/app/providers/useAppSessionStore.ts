import { create } from 'zustand';

import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from '../../features/auth/api/authApi';
import {
  clearAuthTokens,
  getAuthTokens,
  getOnboardingDone,
  saveAuthTokens,
  saveOnboardingDone,
} from '../../shared/services/storage/authStorage';

type OnboardingDraft = {
  goal: string;
  dailyHours: number;
  focusTopics: string[];
};

type AppSessionState = {
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  userName: string;
  onboardingDraft: OnboardingDraft;
  isBootstrapping: boolean;
  isAuthLoading: boolean;
  authError: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  completeOnboarding: (draft: OnboardingDraft) => void;
  bootstrapAuth: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  isNotificationsEnabled?: boolean;
};

const defaultDraft: OnboardingDraft = {
  goal: 'Semester Exam',
  dailyHours: 2,
  focusTopics: ['Math', 'Biology'],
};

function emailToName(email: string) {
  const first = email.split('@')[0] ?? 'Learner';
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export const useAppSessionStore = create<AppSessionState>((set, get) => ({
  hasCompletedOnboarding: false,
  isAuthenticated: false,
  userName: 'Learner',
  onboardingDraft: defaultDraft,
  isBootstrapping: true,
  isAuthLoading: false,
  authError: null,
  accessToken: null,
  refreshToken: null,
  completeOnboarding: draft => {
    saveOnboardingDone(true).catch(() => undefined);
    set({
      hasCompletedOnboarding: true,
      onboardingDraft: draft,
    });
  },
  bootstrapAuth: async () => {
    set({ isBootstrapping: true });

    try {
      const hasCompletedOnboarding = await getOnboardingDone();
      const { accessToken, refreshToken } = await getAuthTokens();
      set({ hasCompletedOnboarding });
      if (!accessToken || !refreshToken) {
        set({ isBootstrapping: false });
        return;
      }

      try {
        const me = await meRequest(accessToken);
        set({
          isAuthenticated: true,
          userName: emailToName(me.email),
          accessToken,
          refreshToken,
        });
      } catch {
        const refreshed = await refreshRequest(refreshToken);
        await saveAuthTokens(refreshed.access_token, refreshed.refresh_token);
        const me = await meRequest(refreshed.access_token);
        set({
          isAuthenticated: true,
          userName: emailToName(me.email),
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token,
        });
      }
    } catch {
      await clearAuthTokens();
      set({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
      });
    } finally {
      set({ isBootstrapping: false });
    }
  },
  loginWithPassword: async (email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const token = await loginRequest({ email, password });
      await saveAuthTokens(token.access_token, token.refresh_token);
      const me = await meRequest(token.access_token);
      set({
        isAuthenticated: true,
        userName: emailToName(me.email),
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
      });
    } catch (error) {
      set({ authError: error instanceof Error ? error.message : 'Login failed' });
    } finally {
      set({ isAuthLoading: false });
    }
  },
  registerWithPassword: async (email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const token = await registerRequest({ email, password });
      await saveAuthTokens(token.access_token, token.refresh_token);
      const me = await meRequest(token.access_token);
      set({
        isAuthenticated: true,
        userName: emailToName(me.email),
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
      });
    } catch (error) {
      set({ authError: error instanceof Error ? error.message : 'Register failed' });
    } finally {
      set({ isAuthLoading: false });
    }
  },
  signOut: async () => {
    const { refreshToken } = get();
    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Ignore network errors on logout and clear local session anyway.
    }

    await clearAuthTokens();
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      authError: null,
      userName: 'Learner',
    });
  },
  clearAuthError: () => set({ authError: null }),
  isNotificationsEnabled: true
}));
