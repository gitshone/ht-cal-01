import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { authService, setTokens, clearTokens } from '../../lib/api';
import { googleOAuthService } from '../../lib/googleOAuth';
import { AuthErrorCode, User } from '@ht-cal-01/shared-types';
import { queryClient } from '../../lib/react-query';

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  firebaseUser: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  } | null;
  error: string | null;
  errorCode: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  firebaseUser: null,
  error: null,
  errorCode: null,
};

// Async thunks
export const loginWithGoogle = createAsyncThunk(
  'auth/loginWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      // Sign in with Firebase
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Authenticate with backend
      const authResponse = await authService.loginWithFirebase(idToken);

      // Store access token (refresh token is now in httpOnly cookie)
      setTokens(authResponse.accessToken);

      const currentUser = await authService.getCurrentUser();
      return {
        user: currentUser,
        firebaseUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        },
      };
    } catch (error) {
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

      return rejectWithValue({ errorMessage, errorCode });
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Logout from backend
      try {
        await authService.logout();
      } catch (error) {
        console.error('Backend logout failed:', error);
      }

      clearTokens();

      queryClient.clear();

      return true;
    } catch (error) {
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

      return rejectWithValue({ errorMessage, errorCode });
    }
  }
);

export const initializeAuth = createAsyncThunk(
  'auth/initializeAuth',
  async (_, { rejectWithValue }) => {
    try {
      return new Promise<{
        user: User;
        firebaseUser: {
          uid: string;
          email: string | null;
          displayName: string | null;
          photoURL: string | null;
        };
      } | null>((resolve, reject) => {
        const unsubscribe = auth.onAuthStateChanged(async firebaseUser => {
          if (firebaseUser) {
            try {
              const userData = await authService.getCurrentUser();

              resolve({
                user: userData,
                firebaseUser: {
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  displayName: firebaseUser.displayName,
                  photoURL: firebaseUser.photoURL,
                },
              });
            } catch (error) {
              const errorData = (
                error as {
                  response?: {
                    data?: { error?: string; errorCode?: string };
                  };
                }
              )?.response?.data;
              const errorMessage = errorData?.error || 'Authentication failed';
              const errorCode =
                errorData?.errorCode || AuthErrorCode.AUTHENTICATION_REQUIRED;

              await signOut(auth);
              clearTokens();

              reject({ errorMessage, errorCode });
            }
          } else {
            clearTokens();
            resolve(null);
          }

          unsubscribe();
        });
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Auth initialization failed';
      return rejectWithValue({ errorMessage });
    }
  }
);

export const refreshUserData = createAsyncThunk(
  'auth/refreshUserData',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      if (!state.auth.isAuthenticated) {
        return null;
      }

      const userData = await authService.getCurrentUser();
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return rejectWithValue('Failed to refresh user data');
    }
  }
);

export const getGoogleOAuthCode = createAsyncThunk(
  'auth/getGoogleOAuthCode',
  async (_, { rejectWithValue }) => {
    try {
      const code = await googleOAuthService.requestCalendarAccess();
      return code;
    } catch (error) {
      console.error('Failed to get OAuth code:', error);
      return rejectWithValue('Failed to get OAuth code');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
      state.errorCode = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: builder => {
    // Login with Google
    builder
      .addCase(loginWithGoogle.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.firebaseUser = action.payload.firebaseUser;
        state.isLoading = false;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.firebaseUser = null;
        state.isLoading = false;
        state.error = (action.payload as any)?.errorMessage || 'Login failed';
        state.errorCode =
          (action.payload as any)?.errorCode ||
          AuthErrorCode.FIREBASE_AUTH_FAILED;
      });

    // Logout
    builder
      .addCase(logout.pending, state => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, state => {
        state.isAuthenticated = false;
        state.user = null;
        state.firebaseUser = null;
        state.isLoading = false;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as any)?.errorMessage || 'Logout failed';
        state.errorCode =
          (action.payload as any)?.errorCode ||
          AuthErrorCode.INTERNAL_SERVER_ERROR;
      });

    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, state => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.firebaseUser = action.payload.firebaseUser;
        } else {
          state.isAuthenticated = false;
          state.user = null;
          state.firebaseUser = null;
        }
        state.isLoading = false;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.firebaseUser = null;
        state.isLoading = false;
        state.error =
          (action.payload as any)?.errorMessage || 'Auth initialization failed';
        state.errorCode =
          (action.payload as any)?.errorCode ||
          AuthErrorCode.AUTHENTICATION_REQUIRED;
      });

    builder.addCase(refreshUserData.fulfilled, (state, action) => {
      if (action.payload) {
        state.user = action.payload;
      }
    });
  },
});

export const { clearError, setLoading } = authSlice.actions;
export default authSlice.reducer;
