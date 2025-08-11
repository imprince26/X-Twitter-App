import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { api } from '@/utils/api';

interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  avatar?: string;
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'TwitterToken';
const USER_KEY = 'TwitterUser';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  const clearAuthData = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_KEY),
      ]);
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Call backend logout endpoint if needed
      if (token) {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
      }

      await clearAuthData();
      router.replace('/(auth)/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token, clearAuthData]);

  const verifyStoredToken = useCallback(async (storedToken: string): Promise<boolean> => {
    try {
      // Try to verify token with backend
      const response = await api.get('/auth/verify-token', {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      return response.data.success;
    } catch (error: any) {
      console.log('Token verification failed:', error.response?.status);
      
      // If endpoint doesn't exist (404) or token is invalid (401), consider token invalid
      if (error.response?.status === 404 || error.response?.status === 401) {
        return false;
      }
      
      // For other errors (network issues, etc.), assume token is still valid
      // This prevents logout on temporary network issues
      console.warn('Network error during token verification, assuming token is valid');
      return true;
    }
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          // Verify token with backend
          const isTokenValid = await verifyStoredToken(storedToken);
          
          if (isTokenValid) {
            setToken(storedToken);
            setUser(userData);
          } else {
            await clearAuthData();
          }
        } catch (parseError) {
          console.error('Error parsing stored user data:', parseError);
          await clearAuthData();
        }
      } else {
        // No stored auth data
        console.log('No stored auth data found');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await clearAuthData();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthData, verifyStoredToken]);

  const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/login', {
        identifier, // email or username
        password,
      });

      if (response.data.success) {
        // Check for different possible token field names
        const newToken = response.data.data?.token || response.data.token;
        const userData = response.data.data?.user || response.data.user;
        
        if (!newToken) {
          console.error('No token received from server:', response.data);
          return { 
            success: false, 
            message: 'Authentication token not received from server' 
          };
        }

        if (!userData) {
          console.error('No user data received from server:', response.data);
          return { 
            success: false, 
            message: 'User data not received from server' 
          };
        }

        // Store token and user data
        await Promise.all([
          AsyncStorage.setItem(TOKEN_KEY, newToken),
          AsyncStorage.setItem(USER_KEY, JSON.stringify(userData)),
        ]);
        
        setToken(newToken);
        setUser(userData);

        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.data.message || 'Login failed' 
        };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          message: error.response.data?.message || `Server error: ${error.response.status}`,
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          message: 'Network error. Please check your connection.',
        };
      } else {
        // Other error
        return {
          success: false,
          message: 'An unexpected error occurred',
        };
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Set up API interceptor for token
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && token) {
          // Token expired or invalid
          console.log('Token expired, logging out...');
          await logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, logout]);

  const contextValue = React.useMemo(() => ({
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated,
    checkAuthStatus,
  }), [user, token, login, logout, isLoading, isAuthenticated, checkAuthStatus]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};