import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Modal } from 'react-native';
import { useColorScheme } from 'nativewind';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/context/authContext';

interface SidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, onClose }) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, logout } = useAuth();

  const translateX = useSharedValue(-300);

  React.useEffect(() => {
    if (isVisible) {
      translateX.value = withTiming(0, { duration: 300 });
    } else {
      translateX.value = withTiming(-300, { duration: 300 });
    }
  }, [isVisible]);

  const animatedSidebarStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive', 
          onPress: () => {
            onClose();
            logout();
          }
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'user', label: 'Profile', onPress: () => { onClose(); console.log('Profile'); }},
    { icon: 'list', label: 'Lists', onPress: () => { onClose(); console.log('Lists'); }},
    { icon: 'bookmark', label: 'Bookmarks', onPress: () => { onClose(); console.log('Bookmarks'); }},
    { icon: 'zap', label: 'Moments', onPress: () => { onClose(); console.log('Moments'); }},
    { icon: 'dollar-sign', label: 'Monetization', onPress: () => { onClose(); console.log('Monetization'); }},
  ];

  const settingsItems = [
    { icon: 'settings', label: 'Settings and privacy', onPress: () => { onClose(); console.log('Settings'); }},
    { icon: 'help-circle', label: 'Help Center', onPress: () => { onClose(); console.log('Help'); }},
    { icon: 'log-out', label: 'Logout', onPress: handleLogout },
  ];

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Sidebar */}
        <Animated.View 
          style={[
            {
              width: 280,
              height: '100%',
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
              borderRightWidth: 1,
              borderRightColor: isDark ? '#2F3336' : '#E1E8ED',
              shadowColor: '#000',
              shadowOffset: { width: 2, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
            animatedSidebarStyle
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="px-4 pt-12 pb-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  Account info
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <AntDesign name="close" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                </TouchableOpacity>
              </View>

              {/* User Info */}
              <View className="mb-6">
                <View className="mb-4">
                  <View className="w-16 h-16 rounded-full bg-gray-300 mb-3 overflow-hidden">
                    {user?.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        className="w-16 h-16 rounded-full"
                        style={{ width: 64, height: 64 }}
                      />
                    ) : (
                      <View className={`w-16 h-16 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}>
                        <AntDesign name="user" size={32} color={isDark ? '#FFFFFF' : '#000000'} />
                      </View>
                    )}
                  </View>
                  
                  <View>
                    <View className="flex-row items-center mb-1">
                      <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {user?.name || 'User Name'}
                      </Text>
                      {user?.isVerified && (
                        <MaterialIcons name="verified" size={18} color="#1DA1F2" style={{ marginLeft: 4 }} />
                      )}
                    </View>
                    <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      @{user?.username || 'username'}
                    </Text>
                  </View>
                </View>

                {/* Followers */}
                <View className="flex-row">
                  <TouchableOpacity className="mr-4">
                    <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>
                      <Text className="font-bold">120</Text>
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}> Following</Text>
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                    <Text className={`text-base ${isDark ? 'text-white' : 'text-black'}`}>
                      <Text className="font-bold">1.2K</Text>
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}> Followers</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Menu Items */}
            <View className="px-4">
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center py-4"
                  onPress={item.onPress}
                >
                  <Feather name={item.icon as any} size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text className={`ml-4 text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Divider */}
              <View className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} my-4`} />

              {/* Settings Items */}
              {settingsItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center py-4"
                  onPress={item.onPress}
                >
                  <Feather name={item.icon as any} size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text className={`ml-4 text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Dark Mode Toggle */}
            <View className="px-4 py-4">
              <View className={`border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} pt-4`}>
                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Ionicons name="moon" size={24} color={isDark ? '#FFFFFF' : '#000000'} />
                    <Text className={`ml-4 text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                      Dark mode
                    </Text>
                  </View>
                  <View className={`w-12 h-6 rounded-full ${isDark ? 'bg-blue-500' : 'bg-gray-300'} p-1`}>
                    <View className={`w-4 h-4 rounded-full bg-white transition-all duration-200 ${isDark ? 'ml-auto' : ''}`} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View className="px-4 py-8">
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Twitter for React Native
              </Text>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Version 1.0.0
              </Text>
            </View>
          </ScrollView>
        </Animated.View>

        {/* Overlay */}
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>
    </Modal>
  );
};

export default Sidebar;