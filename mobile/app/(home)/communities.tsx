import React, { useState, useMemo } from "react";
import { View, Text, Pressable, Dimensions, TouchableOpacity, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS
} from "react-native-reanimated";
import { AntDesign } from '@expo/vector-icons'
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useColorScheme } from "nativewind";
import { useUser } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar';

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

export default function Communities() {
  const [visible, setVisible] = useState(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { data: user } = useUser()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const translateY = useSharedValue(SHEET_HEIGHT);

  const openSheet = React.useCallback(() => {
    setVisible(true);
    translateY.value = withSpring(0, {
      damping: 50,
      stiffness: 400,
    });
  }, [translateY]);

  const closeSheet = React.useCallback(() => {
    translateY.value = withSpring(SHEET_HEIGHT, {
      damping: 50,
      stiffness: 400,
    });
  }, [translateY]);

  const panGesture = useMemo(() => Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateY = Math.max(0, event.translationY);
      translateY.value = newTranslateY;

    })
    .onEnd((event) => {
      const shouldClose = event.translationY > SHEET_HEIGHT * 0.3 || event.velocityY > 1000;

      if (shouldClose) {
        runOnJS(closeSheet)();
      }
    }), [translateY, closeSheet]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleBackdropPress = () => {
    closeSheet();
  };

  return (
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800'>
          <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
            {user?.profilePicture ? (
              <Image
                source={{ uri: user.profilePicture }}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}>
                <AntDesign name="user" size={20} color={isDark ? 'white' : 'black'} />
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Main Content */}
        <View className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
          <View className="items-center space-y-4">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Communities
            </Text>
          </View>
        </View>
      </Sidebar>
    </View>
  );
}
