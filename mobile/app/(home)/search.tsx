import { View, Text, TouchableOpacity, Alert, Image } from 'react-native'
import React,{useState} from 'react'
import { useColorScheme } from 'nativewind'
import { useRouter } from 'expo-router'
import { AntDesign } from '@expo/vector-icons'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useUser } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar';


const Search = () => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { data: user } = useUser()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };





  return (
    <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}>
    <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>

      {/* Header */}
      <View className='flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-gray-800'>
           <TouchableOpacity onPress={openDrawer}>
                {user?.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}>
                    <AntDesign name="user" size={20} color={isDark ? 'white' : 'black'} />
                  </View>
                )}
              </TouchableOpacity>
     
      </View>

      {user && (
        <View className='px-4 py-3 border-b border-gray-200 dark:border-gray-800'>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Logged in as: {user.username || user.email}
          </Text>
        </View>
      )}

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
    </Sidebar>
  )
}

export default Search