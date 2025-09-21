import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { store, persistor } from '../store';
import { queryClient } from '../lib/react-query';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { initializeAuth } from '../store/slices/authSlice';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import SettingsPage from '../pages/SettingsPage';
import ProtectedRoute from '../components/ProtectedRoute';
import ToastContainer from '../components/toast/ToastContainer';

function AppContent() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector(state => state.toast.toasts);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <div className="App">
      <ToastContainer toasts={toasts} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AppContent />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
