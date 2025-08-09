import { View, Text, Image } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'nativewind'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

const HomeLayout = () => {
    const { colorScheme } = useColorScheme()
    const isDark = colorScheme === 'dark'

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: isDark ? '#000000' : '#FFFFFF',
                    borderTopWidth: 0,
                    height: 60,
                    paddingTop: 8,
                    paddingBottom: 20,
                    paddingHorizontal: 8,
                    shadowColor: isDark ? '#000000' : '#FFFFFF',
                },
                tabBarActiveTintColor: isDark ? '#FFFFFF' : '#0F1419',
                tabBarInactiveTintColor: isDark ? '#E7E9EA' : '#536471',
                tabBarShowLabel: false,
                tabBarItemStyle: {
                    paddingVertical: 8,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <FontAwesome6
                                name="house"
                                size={focused ? 26 : 24}
                                color={color}
                                style={{ fontWeight: focused ? 'bold' : 'normal' }}
                            />
                            {focused && (
                                <View
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="search"
                options={{
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <FontAwesome
                                name="search"
                                size={focused ? 26 : 24}
                                color={color}
                            />
                            {focused && (
                                <View
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="grok"
                options={{
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <Image
                                source={require('../../assets/images/grok.png')}
                                style={{ width: 24, height: 24 }}
                            />
                            {focused && (
                                <View
                                    className="w-4 h-4 bg-white rounded-full mt-1"
                                />
                            )}
                        </View>
                    )
                }}
            />

            <Tabs.Screen
                name="communities"
                options={{
                    //   href: null, // This creates the tab but doesn't link to a file yet
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <MaterialIcons
                                name="groups"
                                size={focused ? 26 : 24}
                                color={color}
                            />
                            {focused && (
                                <View
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="notifications"
                options={{
                    //   href: null, // This creates the tab but doesn't link to a file yet
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <Ionicons
                                name={focused ? "notifications" : "notifications-outline"}
                                size={focused ? 26 : 24}
                                color={color}
                            />
                            {focused && (
                                <View
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </View>
                    ),
                }}
            />

            <Tabs.Screen
                name="messages"
                options={{
                    //   href: null, // This creates the tab but doesn't link to a file yet
                    tabBarIcon: ({ color, focused, size }) => (
                        <View className="items-center justify-center">
                            <Feather
                                name="mail"
                                size={focused ? 26 : 24}
                                color={color}
                            />
                            {focused && (
                                <View
                                    className="w-1 h-1 rounded-full mt-1"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </View>
                    ),
                }}
            />

        </Tabs>
    )
}

export default HomeLayout
