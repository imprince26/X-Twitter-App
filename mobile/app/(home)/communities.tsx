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

            <Text className={`text-center px-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Discover and join communities that match your interests
            </Text>

            <Pressable
              onPress={openSheet}
              className="px-8 py-4 bg-blue-500 rounded-full shadow-lg active:bg-blue-600"
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Text className="text-white font-bold text-lg">Explore Communities</Text>
            </Pressable>
          </View>
        </View>

        {/* Bottom Sheet */}
        {visible && (
          <>
            {/* Backdrop */}
            <Animated.View
              style={
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'black',
                  zIndex: 1,
                }
              }
            >
              <Pressable
                style={{ flex: 1 }}
                onPress={handleBackdropPress}
              />
            </Animated.View>

            {/* Sheet */}
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  sheetAnimatedStyle,
                  {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: SHEET_HEIGHT,
                    zIndex: 2,
                  }
                ]}
                className={`${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} rounded-t-3xl border-t shadow-2xl`}
              >
                {/* Handle */}
                <View className="items-center pt-3 pb-4">
                  <View className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
                </View>

                {/* Content */}
                <View className="flex-1 px-6">
                  <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    Discover Communities
                  </Text>

                  <Text className={`text-base mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Find your tribe and connect with like-minded people
                  </Text>

                  {/* Sample Community Items */}
                  <View className="space-y-4">
                    {[
                      { name: "Tech Enthusiasts", members: "125K", emoji: "💻" },
                      { name: "Photography", members: "89K", emoji: "📸" },
                      { name: "Cooking & Recipes", members: "234K", emoji: "🍳" },
                      { name: "Travel Stories", members: "167K", emoji: "✈️" },
                      { name: "Music Lovers", members: "445K", emoji: "🎵" },
                    ].map((community, index) => (
                      <Pressable
                        key={index}
                        className={`flex-row items-center p-4 rounded-2xl ${isDark ? 'bg-gray-900 active:bg-gray-800' : 'bg-gray-50 active:bg-gray-100'
                          }`}
                      >
                        <Text className="text-2xl mr-4">{community.emoji}</Text>
                        <View className="flex-1">
                          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                            {community.name}
                          </Text>
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {community.members} members
                          </Text>
                        </View>
                        <View className="px-4 py-2 bg-blue-500 rounded-full">
                          <Text className="text-white text-sm font-medium">Join</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>

                  {/* Bottom Actions */}
                  <View className="pt-6 pb-4 space-y-3">
                    <Pressable
                      className="w-full py-4 bg-blue-500 rounded-2xl active:bg-blue-600"
                    >
                      <Text className="text-white font-bold text-center text-lg">
                        Create New Community
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={closeSheet}
                      className={`w-full py-4 rounded-2xl ${isDark ? 'bg-gray-800 active:bg-gray-700' : 'bg-gray-100 active:bg-gray-200'
                        }`}
                    >
                      <Text className={`font-semibold text-center text-lg ${isDark ? 'text-white' : 'text-black'
                        }`}>
                        Close
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>
          </>
        )}
      </Sidebar>
    </View>
  );
}
