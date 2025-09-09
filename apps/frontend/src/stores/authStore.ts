import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { authService, setTokens, clearTokens } from '../lib/api';
import { googleOAuthService } from '../lib/googleOAuth';
import { AuthErrorCode, User } from '@ht-cal-01/shared-types';

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  firebaseUser: FirebaseUser | null;
  error: string | null;
  errorCode: string | null;

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
      errorCode: null,

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
          // Extract error code and message from API response
          const errorData = (
            error as {
              response?: { data?: { error?: string; errorCode?: string } };
            }
          )?.response?.data;
          const errorMessage =
            errorData?.error ||
            (error instanceof Error ? error.message : 'Login failed');
          const errorCode =
            errorData?.errorCode || AuthErrorCode.FIREBASE_AUTH_FAILED;

          set({
            isAuthenticated: false,
            user: null,
            firebaseUser: null,
            isLoading: false,
            error: errorMessage,
            errorCode: errorCode,
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
            errorCode: null,
          });
        } catch (error) {
          // Extract error code and message from API response
          const errorData = (
            error as {
              response?: { data?: { error?: string; errorCode?: string } };
            }
          )?.response?.data;
          const errorMessage =
            errorData?.error ||
            (error instanceof Error ? error.message : 'Logout failed');
          const errorCode =
            errorData?.errorCode || AuthErrorCode.INTERNAL_SERVER_ERROR;

          set({
            isLoading: false,
            error: errorMessage,
            errorCode: errorCode,
          });
        }
      },

      clearError: () => {
        set({ error: null, errorCode: null });
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
                    errorCode: null,
                  });
                } catch (error) {
                  // Extract error code and message from API response
                  const errorData = (
                    error as {
                      response?: {
                        data?: { error?: string; errorCode?: string };
                      };
                    }
                  )?.response?.data;
                  const errorMessage =
                    errorData?.error || 'Authentication failed';
                  const errorCode =
                    errorData?.errorCode ||
                    AuthErrorCode.AUTHENTICATION_REQUIRED;

                  await signOut(auth);
                  clearTokens();

                  set({
                    isAuthenticated: false,
                    user: null,
                    firebaseUser: null,
                    isLoading: false,
                    error: errorMessage,
                    errorCode: errorCode,
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
                  errorCode: null,
                });
              }

              unsubscribe();
              resolve();
            });
          });
        } catch (error) {
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
          const code = await googleOAuthService.requestCalendarAccess();
          return code;
        } catch (error) {
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
