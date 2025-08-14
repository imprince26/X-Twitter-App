import { Slot, useRouter, useSegments } from 'expo-router';
import { Suspense, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import XLoader from '@/components/XLoader';
import { AuthProvider, useAuth } from '@/context/authContext';
import './global.css';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/auth');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(home)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <XLoader />;
  }

  return <Slot />;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <AuthProvider>
      <SafeAreaView className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <Suspense fallback={<XLoader />}>
          <View className={`flex-1 ${colorScheme === 'dark' ? 'bg-black' : 'bg-x-bg-light'}`}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <RootLayoutNav />
          </View>
        </Suspense>
      </SafeAreaView>
    </AuthProvider>
  );
}