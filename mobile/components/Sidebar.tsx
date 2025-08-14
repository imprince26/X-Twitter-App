import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAuth } from '@/context/authContext';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

const Sidebar = ({ children, closeDrawer, isDrawerOpen }) => {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const translateX = useSharedValue(-DRAWER_WIDTH);

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
  }, [isDrawerOpen]);

  const onGestureEvent = (event) => {
    if (event.nativeEvent.translationX < 0) {
      translateX.value = event.nativeEvent.translationX;
    }
  };

  const onGestureEnd = (event) => {
    if (event.nativeEvent.translationX < -width / 4) {
      closeDrawer();
    } else {
      translateX.value = withTiming(0);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={onGestureEvent} onEnded={onGestureEnd}>
        <Animated.View style={[styles.drawer, animatedStyle, { backgroundColor: isDark ? '#000' : '#fff' }]}>
          <View style={{ padding: 20 }}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 60, height: 60, borderRadius: 30 }} />
            ) : (
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: isDark ? '#333' : '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <FontAwesome name="user" size={30} color={isDark ? '#fff' : '#000'} />
              </View>
            )}
            <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>
              {user?.name}
            </Text>
            <Text style={{ color: 'gray', fontSize: 16 }}>@{user?.username}</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Text style={{ color: isDark ? '#fff' : '#000', marginRight: 10 }}>
                <Text style={{ fontWeight: 'bold' }}>{user?.followingCount || 0}</Text> Following
              </Text>
              <Text style={{ color: isDark ? '#fff' : '#000' }}>
                <Text style={{ fontWeight: 'bold' }}>{user?.followersCount || 0}</Text> Followers
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 40,
              right: 10,
            }}
            onPress={closeDrawer}
          >
            <Feather name="x" size={24} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="user" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={{ color: isDark ? '#fff' : '#000', marginLeft: 15, fontSize: 18 }}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="bookmark" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={{ color: isDark ? '#fff' : '#000', marginLeft: 15, fontSize: 18 }}>Bookmarks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="list-alt" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={{ color: isDark ? '#fff' : '#000', marginLeft: 15, fontSize: 18 }}>Lists</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ padding: 15, flexDirection: 'row', alignItems: 'center' }}>
              <FontAwesome name="user-plus" size={24} color={isDark ? '#fff' : '#000'} />
              <Text style={{ color: isDark ? '#fff' : '#000', marginLeft: 15, fontSize: 18 }}>Follower requests</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </PanGestureHandler>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    zIndex: 100,
  },
});

export default Sidebar;