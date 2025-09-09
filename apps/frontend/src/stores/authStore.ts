import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { authService, setTokens, clearTokens } from '../lib/api';
import { googleOAuthService } from '../lib/googleOAuth';
import { User } from '@ht-cal-01/shared-types';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  error: string | null;

  // Actions
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  getGoogleOAuthCode: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      firebaseUser: null,
      error: null,

      loginWithGoogle: async () => {
        try {
          set({ isLoading: true, error: null });

          // Sign in with Firebase
          const result = await signInWithPopup(auth, googleProvider);
          const firebaseUser = result.user;

          // Get Firebase ID token
          const idToken = await firebaseUser.getIdToken();

          // Authenticate with backend
          const authResponse = await authService.loginWithFirebase(idToken);

          // Store tokens
          setTokens(authResponse.accessToken, authResponse.refreshToken);

          // Update state
          set({
            isAuthenticated: true,
            user: authResponse.user,
            firebaseUser,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Login failed:', error);
          set({
            isAuthenticated: false,
            user: null,
            firebaseUser: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Sign out from Firebase
          await signOut(auth);

          // Logout from backend
          try {
            await authService.logout();
          } catch (error) {
            console.error('Backend logout failed:', error);
          }

          clearTokens();

          // Update state
          set({
            isAuthenticated: false,
            user: null,
            firebaseUser: null,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          console.error('Logout failed:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Logout failed',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });

          // Check if user is already authenticated with Firebase
          return new Promise<void>(resolve => {
            const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
              if (firebaseUser) {
                try {
                  // Get current user from backend
                  const userData = await authService.getCurrentUser();

                  set({
                    isAuthenticated: true,
                    user: userData,
                    firebaseUser,
                    isLoading: false,
                    error: null,
                  });
                } catch (error) {
                  // Backend auth failed, clear everything
                  console.error('Backend auth check failed:', error);
                  await signOut(auth);
                  clearTokens();

                  set({
                    isAuthenticated: false,
                    user: null,
                    firebaseUser: null,
                    isLoading: false,
                    error: null,
                  });
                }
              } else {
                // No Firebase user
                clearTokens();
                set({
                  isAuthenticated: false,
                  user: null,
                  firebaseUser: null,
                  isLoading: false,
                  error: null,
                });
              }

              unsubscribe();
              resolve();
            });
          });
        } catch (error) {
          console.error('Auth initialization failed:', error);
          set({
            isAuthenticated: false,
            user: null,
            firebaseUser: null,
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Auth initialization failed',
          });
        }
      },

      getGoogleOAuthCode: async (): Promise<string | null> => {
        try {
          // Request calendar access from Google
          const code = await googleOAuthService.requestCalendarAccess();
          return code;
        } catch (error) {
          console.error('Failed to get Google OAuth code:', error);
          return null;
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: state => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
