import { View, Text, TouchableOpacity, Alert } from 'react-native'
import React from 'react'
import { useColorScheme } from 'nativewind'
import { useAuth } from '@/context/authContext'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

const Search = () => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { logout } = useAuth()
  const router = useRouter()

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
          onPress: async () => {
            try {
              await logout()
              router.replace('/(auth)/auth')
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to logout. Please try again.')
            }
          },
        },
      ]
    )
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Header */}
      <View className='flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800'>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
          Search
        </Text>
        
        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.7}
          className='flex-row items-center px-3 py-2 rounded-full bg-red-500'
        >
          <Ionicons name="log-out-outline" size={18} color="white" />
          <Text className='text-white font-medium ml-2'>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className='flex-1 items-center justify-center'>
        <Ionicons 
          name="search-outline" 
          size={80} 
          color={isDark ? '#6B7280' : '#9CA3AF'} 
        />
        <Text className={`text-2xl font-bold mt-4 ${isDark ? 'text-white' : 'text-black'}`}>
          Search X
        </Text>
        <Text className={`text-base mt-2 text-center px-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Search for posts, people, and topics that interest you
        </Text>
        
        {/* Temporary message */}
        <View className='mt-8 px-6'>
          <Text className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Search functionality coming soon...
          </Text>
        </View>
      </View>
    </View>
  )
}

export default Search