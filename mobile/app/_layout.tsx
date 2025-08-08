import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context'
import './global.css';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();


  return (
    <SafeAreaView className='flex-1 bg-white dark:bg-black'>
      <View className="flex-1 bg-background-light dark:bg-background-dark">
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Slot />
      </View>
    </SafeAreaView>
  );
}