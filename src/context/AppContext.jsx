import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { UIProvider, useUI } from './UIContext';

// Thin backward-compat provider — wraps both focused providers.
// All existing pages that call useApp() keep working without any changes.
export const AppProvider = ({ children }) => (
  <AuthProvider>
    <UIProvider>{children}</UIProvider>
  </AuthProvider>
);

// Backward-compat hook — merges both contexts.
// Returns all properties that useApp() previously returned.
export const useApp = () => ({ ...useAuth(), ...useUI() });
