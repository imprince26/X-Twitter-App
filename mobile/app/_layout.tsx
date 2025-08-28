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
import { useUser } from '@/hooks/useAuth';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) return;

      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        router.replace('/(home)');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, segments, isLoading, router]);

  if (isLoading) {
    return <XLoader />;
  }

  return <>{children}</>;
}

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