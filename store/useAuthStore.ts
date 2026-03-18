/**
 * Authentication store
 *
 * Manages user identity, tokens, and auth state.
 * Persisted to AsyncStorage so users stay signed in across app restarts.
 *
 * Currently operates in "offline mode" when the API is unreachable —
 * the app works fully without authentication (free content + local sync).
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, setAuthToken, ApiUser } from '@/services/api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

interface AuthState {
  // Identity
  user:         ApiUser | null;
  token:        string | null;
  refreshToken: string | null;
  tokenExpires: number | null; // Unix timestamp ms

  // UI state (not persisted)
  status:       AuthStatus;
  errorMessage: string | null;

  // Actions
  signIn:          (email: string, password: string) => Promise<boolean>;
  signUp:          (email: string, password: string, name: string) => Promise<boolean>;
  signOut:         () => Promise<void>;
  refreshSession:  () => Promise<boolean>;
  clearError:      () => void;
  updateProfile:   (updates: Partial<Pick<ApiUser, 'displayName' | 'avatarUrl'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      tokenExpires: null,
      status:       'idle',
      errorMessage: null,

      signIn: async (email, password) => {
        set({ status: 'loading', errorMessage: null });
        try {
          const res = await authApi.signIn(email, password);
          setAuthToken(res.token);
          set({
            user:         res.user,
            token:        res.token,
            refreshToken: res.refreshToken,
            tokenExpires: Date.now() + res.expiresIn * 1000,
            status:       'authenticated',
            errorMessage: null,
          });
          return true;
        } catch (err: any) {
          const msg = err?.status === 401
            ? 'Incorrect email or password'
            : 'Sign in failed. Please try again.';
          set({ status: 'error', errorMessage: msg });
          return false;
        }
      },

      signUp: async (email, password, name) => {
        set({ status: 'loading', errorMessage: null });
        try {
          const res = await authApi.signUp(email, password, name);
          setAuthToken(res.token);
          set({
            user:         res.user,
            token:        res.token,
            refreshToken: res.refreshToken,
            tokenExpires: Date.now() + res.expiresIn * 1000,
            status:       'authenticated',
            errorMessage: null,
          });
          return true;
        } catch (err: any) {
          const msg = err?.status === 409
            ? 'An account with this email already exists'
            : err?.status === 400
            ? 'Please check your details and try again'
            : 'Sign up failed. Please try again.';
          set({ status: 'error', errorMessage: msg });
          return false;
        }
      },

      signOut: async () => {
        try { await authApi.signOut(); } catch {}
        setAuthToken(null);
        set({
          user:         null,
          token:        null,
          refreshToken: null,
          tokenExpires: null,
          status:       'idle',
          errorMessage: null,
        });
      },

      refreshSession: async () => {
        const { refreshToken, tokenExpires } = get();
        if (!refreshToken) return false;

        // Only refresh if within 5 minutes of expiry
        if (tokenExpires && Date.now() < tokenExpires - 5 * 60 * 1000) {
          return true;
        }

        try {
          const res = await authApi.refreshToken(refreshToken);
          setAuthToken(res.token);
          set({
            token:        res.token,
            refreshToken: res.refreshToken,
            tokenExpires: Date.now() + res.expiresIn * 1000,
            user:         res.user,
            status:       'authenticated',
          });
          return true;
        } catch {
          setAuthToken(null);
          set({ token: null, refreshToken: null, tokenExpires: null, user: null, status: 'idle' });
          return false;
        }
      },

      clearError:    () => set({ errorMessage: null }),
      updateProfile: (updates) =>
        set(s => ({ user: s.user ? { ...s.user, ...updates } : null })),
    }),
    {
      name:    'albert-auth-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist UI state
      partialize: (state) => ({
        user:         state.user,
        token:        state.token,
        refreshToken: state.refreshToken,
        tokenExpires: state.tokenExpires,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-inject token into API client after rehydration
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    },
  ),
);
