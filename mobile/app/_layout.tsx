import { Slot,Redirect,Stack } from 'expo-router';
import { Suspense, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context'
import XLoader from '@/components/XLoader';
import './global.css';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

    const [authenticated, setAuthenticated] = useState(true);
  
    if (!authenticated) {
      return (
        <Redirect href="/auth" />
      )
    }

  return (
    <SafeAreaView className={`flex-1 ${
      colorScheme === 'dark' ? 'bg-black' : 'bg-white'
    }`}>
      <Suspense fallback={<XLoader />}>
        <View className={`flex-1 ${
          colorScheme === 'dark' ? 'bg-black' : 'bg-x-bg-light'
        }`}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Slot/>
        </View>
      </Suspense>
    </SafeAreaView>
  );
}