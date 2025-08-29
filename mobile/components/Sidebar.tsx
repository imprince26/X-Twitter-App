import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'nativewind';
import { useUser } from '@/hooks/useAuth';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.75;

interface SidebarProps {
  children: React.ReactNode;
  closeDrawer: () => void;
  isDrawerOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ children, closeDrawer, isDrawerOpen }) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const { data: user } = useUser()
  const isDark = colorScheme === 'dark';
  const translateX = useSharedValue(-DRAWER_WIDTH);
  const router = useRouter()
  const queryClient = useQueryClient()


  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  React.useEffect(() => {
    if (isDrawerOpen) {
      translateX.value = withTiming(0);
    } else {
      translateX.value = withTiming(-DRAWER_WIDTH);
    }
  }, [isDrawerOpen, translateX]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -DRAWER_WIDTH);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -width / 4) {
        translateX.value = withTiming(-DRAWER_WIDTH);
        runOnJS(closeDrawer)();
      } else {
        translateX.value = withTiming(0);
      }
    });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem('TwitterToken')
    },
    onSuccess: () => {
      queryClient.clear()

      router.replace('/(auth)/auth')
    },
    onError: (error) => {
      console.error('Logout error:', error)
      Alert.alert('Error', 'Failed to logout. Please try again.')
    },
  })

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logoutMutation.mutate()
          },
        },
      ]
    )
  }

  return (
    <View className="flex-1 relative">
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            animatedStyle,
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              width: DRAWER_WIDTH,
              zIndex: 100,
            }
          ]}
          className={`${isDark ? 'bg-black' : 'bg-white'}`}
        >
          {/* User Section */}
          <View className="p-5">
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <View className={`w-14 h-14 items-center justify-center rounded-full`}>
                <FontAwesome name="user" size={30} color={isDark ? '#fff' : '#000'} />
              </View>
            )}

            <Text className={`${isDark ? 'text-white' : 'text-black'} text-xl font-bold mt-2.5`}>
              {user?.name || 'User Name'}
            </Text>

            <Text className="text-gray-500 text-base">
              @{user?.username || 'username'}
            </Text>

            <View className="flex-row mt-2.5">
              <Text className={`${isDark ? 'text-white' : 'text-black'} mr-2.5`}>
                <Text className="font-bold">{user?.followingCount || 0}</Text>
                <Text className='ml-0.5 text-gray-500 dark:text-gray-500 '> Following</Text>
              </Text>
              <Text className={`${isDark ? 'text-white' : 'text-black'}`}>
                <Text className="font-bold">{user?.followersCount || 0}</Text>
                <Text className='ml-0.5 text-gray-500 dark:text-gray-500 '> Followers</Text>
              </Text>
            </View>
          </View>

          {/* logout button */}
          <View className='absolute bottom-10 left-0 w-full px-5'>

            <TouchableOpacity
              onPress={handleLogout}
              activeOpacity={0.7}
              disabled={logoutMutation.isPending}
              className={`flex-row items-center px-3 py-2 rounded-full ${logoutMutation.isPending ? 'bg-red-400' : 'bg-red-500'
                }`}
            >
              <Ionicons
                name="log-out-outline"
                size={18}
                color="white"
              />
              <Text className='text-white font-medium ml-2'>
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </GestureDetector>
      {children}
    </View>
  );
};

export default Sidebar;
