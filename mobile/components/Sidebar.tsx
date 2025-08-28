import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FontAwesome, Feather } from '@expo/vector-icons';
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
  const { data: user } = useUser();
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateX = useSharedValue(-DRAWER_WIDTH);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  console.log("Sidebar",user)
  console.log()

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

  const handleSwitchTheme = () => {
    toggleColorScheme();
  };

  const handleProfilePress = (): void => {
    // Navigate to profile
    console.log('Navigate to profile');
  };

  const handleBookmarksPress = (): void => {
    // Navigate to bookmarks
    console.log('Navigate to bookmarks');
  };

  const handleListsPress = (): void => {
    // Navigate to lists
    console.log('Navigate to lists');
  };

  const handleFollowerRequestsPress = (): void => {
    // Navigate to follower requests
    console.log('Navigate to follower requests');
  };

  return (
    <View className="flex-1">
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
            {user?.avatar ? (
              <Image 
                source={{ uri: user.avatar }} 
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
        </Animated.View>
      </GestureDetector>
      {children}
    </View>
  );
};

export default Sidebar;
