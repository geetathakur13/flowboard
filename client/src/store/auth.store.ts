import { create } from 'zustand';
import type { IUser } from '@flowboard/shared';
import { api, setAccessToken, bootstrapAuth, getErrorMessage } from '@/lib/api';

interface AuthState {
  user: IUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<{ needsVerification: boolean }>;
  verifyEmail: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    set({ status: 'loading' });
    try {
      const ok = await bootstrapAuth();
      if (!ok) {
        set({ status: 'unauthenticated', user: null });
        return;
      }
      const { data } = await api.get<{ user: IUser }>('/auth/me');
      set({ user: data.user, status: 'authenticated' });
    } catch {
      set({ status: 'unauthenticated', user: null });
    }
  },

  login: async (email, password) => {
    set({ error: null, status: 'loading' });
    try {
      const { data } = await api.post<{ user: IUser; accessToken: string }>('/auth/login', {
        email,
        password,
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: 'authenticated' });
    } catch (err) {
      set({ error: getErrorMessage(err), status: 'unauthenticated' });
      throw err;
    }
  },

  signup: async (name, email, password) => {
    set({ error: null, status: 'loading' });
    try {
      await api.post('/auth/signup', { name, email, password });
      set({ status: 'unauthenticated' });
      return { needsVerification: true };
    } catch (err) {
      set({ error: getErrorMessage(err), status: 'unauthenticated' });
      throw err;
    }
  },

  verifyEmail: async (email, otp) => {
    set({ error: null });
    try {
      const { data } = await api.post<{ user: IUser; accessToken: string }>('/auth/verify-email', {
        email,
        otp,
      });
      setAccessToken(data.accessToken);
      set({ user: data.user, status: 'authenticated' });
    } catch (err) {
      set({ error: getErrorMessage(err) });
      throw err;
    }
  },

  resendOtp: async (email) => {
    await api.post('/auth/resend-otp', { email });
  },

  forgotPassword: async (email) => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, password) => {
    await api.post('/auth/reset-password', { token, password });
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setAccessToken(null);
    set({ user: null, status: 'unauthenticated' });
  },
}));
