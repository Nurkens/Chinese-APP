import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI, userAPI } from '../services/api';

// Google Client ID - should be in environment variable
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface User {
  id: string;
  username: string;
  email?: string;
  tag: string;
  avatar?: string;
  isGuest: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleError: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  initializeGoogleLogin: (buttonElement: HTMLElement | null) => void;
  setTokenAndLoadUser: (token: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  clearGoogleError: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  // Handle Google credential response
  const handleGoogleCredentialResponse = useCallback(async (response: google.accounts.id.CredentialResponse) => {
    try {
      setLoading(true);
      setGoogleError(null);

      const result = await authAPI.googleLoginWithToken(response.credential);
      localStorage.setItem('token', result.access_token);
      setUser(result.user);
    } catch (error: any) {
      console.error('Google login failed:', error);

      // Set user-friendly error message
      if (error.response?.status === 401) {
        setGoogleError('Google authentication failed. Please try again.');
      } else if (error.response?.status === 409) {
        setGoogleError('An account with this email already exists. Try logging in with your password.');
      } else if (error.code === 'ERR_NETWORK') {
        setGoogleError('Unable to connect to server. Please check your internet connection.');
      } else {
        setGoogleError(error.response?.data?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize Google Identity Services
  const initializeGoogleLogin = useCallback((buttonElement: HTMLElement | null) => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn('Google Client ID not configured');
      return;
    }

    // Wait for Google script to load
    const initGoogle = () => {
      if (!window.google?.accounts?.id) {
        // Retry after a short delay if not loaded yet
        setTimeout(initGoogle, 100);
        return;
      }

      if (!googleInitialized) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });
        setGoogleInitialized(true);
      }

      // Render button if element is provided
      if (buttonElement) {
        window.google.accounts.id.renderButton(buttonElement, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: '100%',
        });
      }
    };

    initGoogle();
  }, [googleInitialized, handleGoogleCredentialResponse]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await userAPI.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await authAPI.register(username, email, password);
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const guestLogin = async () => {
    try {
      const response = await authAPI.guestLogin();
      localStorage.setItem('token', response.access_token);
      setUser(response.user);
    } catch (error) {
      console.error('Guest login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setGoogleError(null);

    // Revoke Google session if available
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  const setTokenAndLoadUser = async (token: string) => {
    try {
      localStorage.setItem('token', token);
      const userData = await userAPI.getProfile();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
      throw error;
    }
  };

  const clearGoogleError = () => {
    setGoogleError(null);
  };

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    googleError,
    login,
    register,
    guestLogin,
    initializeGoogleLogin,
    setTokenAndLoadUser,
    logout,
    isAuthenticated: !!user,
    clearGoogleError,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
