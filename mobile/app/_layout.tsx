import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClientProvider } from '@tanstack/react-query';
import XLoader from '@/components/XLoader';
import { queryClient } from '@/utils/queryClient';
import './global.css';

// Import the hook inside the provider context
import { useUser } from '@/hooks/useAuth';

// Authentication wrapper component - now inside QueryClientProvider
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure navigation is ready
    const timeoutId = setTimeout(() => {
      if (isLoading) return; // Don't redirect while loading

      const inAuthGroup = segments[0] === '(auth)';
      const inHomeGroup = segments[0] === '(home)';

      if (!user && !inAuthGroup) {
        // User is not authenticated and not in auth group, redirect to login
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // User is authenticated but in auth group, redirect to home
        router.replace('/(home)');
      }
    }, 100); // Small delay to ensure router is ready

    return () => clearTimeout(timeoutId);
  }, [user, segments, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return <XLoader />;
  }

  return <>{children}</>;
}

// Main app content wrapper
function AppContent() {
  const { colorScheme } = useColorScheme();

  return (
    <View className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthWrapper>
        <Slot />
      </AuthWrapper>
    </View>
  );
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          <AppContent />
        </SafeAreaView>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}