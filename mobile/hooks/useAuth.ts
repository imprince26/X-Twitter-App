import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { Alert } from 'react-native';

interface User {
   _id: string;
   id: string;

  // Basic Information
  username: string;
  email: string;
  name: string;
  bio: string;
  location: string;
  website: string;
  dateOfBirth: Date;

  // Profile
  profilePicture: string;
  coverImage: string;
  isVerified: boolean;
  verificationBadge: "blue" | "gold" | "gray" | null;

  // Social
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  likesCount: number;

  // Privacy & Security
  isPrivate: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  loginAttempts: number;
  lockUntil?: Date;

  // Account Status
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  suspensionExpires?: Date;

  // Admin & Moderation
  isAdmin: boolean;
  isModerator: boolean;
  affiliatedAccounts: string[];

  // Preferences
  theme: "light" | "dark" | "auto";
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    mentions: boolean;
    follows: boolean;
    likes: boolean;
    retweets: boolean;
    directMessages: boolean;
  };

  // Privacy Settings
  privacy: {
    allowDirectMessages: "everyone" | "following" | "verified" | "none";
    allowTagging: "everyone" | "following" | "none";
    discoverByEmail: boolean;
    discoverByPhone: boolean;
    showActivity: boolean;
  };

  // Timestamps
  lastLogin: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface LoginCredentials {
  identifier: string;
  password: string;
}

interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
  name: string;
  dateOfBirth: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    user: User;
    token: string;
    tokenType: string;
    expiresIn: string;
  };
}

// Get current user
export const useUser = () => {
  return useQuery({
    queryKey: ['user'],
    queryFn: async (): Promise<User | null> => {
      try {
        const token = await AsyncStorage.getItem('TwitterToken');
        if (!token) return null;
        
        const response = await api.get('/auth/me');
        
        if (response.data.success ) {
          return response.data.user;
        }
        
        return null;
      } catch (error: any) {
        // If token is invalid, remove it
        if (error?.response?.status === 401) {
          await AsyncStorage.removeItem('TwitterToken');
        }
        return null;
      }
    },
  });
};

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.data?.token && data.data?.user) {
        await AsyncStorage.setItem('TwitterToken', data.data.token);
        queryClient.setQueryData(['user'], data.data.user);
        router.replace('/(home)');
      }
    },
    onError: (error) => {
      Alert.alert('Login Failed', error?.message || 'An error occurred during login.');
    },
  });
};

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await api.post('/auth/register', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.data?.token && data.data?.user) {
        await AsyncStorage.setItem('TwitterToken', data.data.token);
        queryClient.setQueryData(['user'], data.data.user);
        // Note: Don't auto-navigate after registration if email verification is required
      }
    },
    onError: (error) => {
      console.error('Register error:', error);
    },
  });
};

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        // Call logout endpoint if available
        await api.post('/auth/logout');
      } catch (error) {
        // Continue with logout even if API call fails
        console.warn('Logout API call failed:', error);
      }
      
      // Remove token from storage
      await AsyncStorage.removeItem('TwitterToken');
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Navigate to login
      router.replace('/(auth)/login');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Still clear cache and navigate even if there's an error
      queryClient.clear();
      router.replace('/(auth)/login');
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (payload: { email?: string; username?: string }) => {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    },
  });
};

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async ({ token, password }: { token: string; password: string }) => {
      const response = await api.post('/auth/reset-password', { token, password });
      return response.data;
    },
  });
};

// Username availability check
export const useUsernameAvailable = (username: string) => {
  return useQuery({
    queryKey: ['usernameAvailable', username],
    queryFn: async (): Promise<{ available: boolean; success: boolean }> => {
      const response = await api.get(`/auth/check-username/${username.toLowerCase()}`);
      return response.data;
    },
    enabled: !!username && username.length >= 3,
    retry: false,
    staleTime: 30000, // 30 seconds
  });
};

// Email verification mutation
export const useVerifyEmail = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post('/auth/verify-email', { token });
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.success && data.data?.token && data.data?.user) {
        await AsyncStorage.setItem('TwitterToken', data.data.token);
        queryClient.setQueryData(['user'], data.data.user);
        router.replace('/(home)');
      }
    },
  });
};

// Resend verification email mutation
export const useResendVerification = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/auth/resend-verification', { email });
      return response.data;
    },
  });
};