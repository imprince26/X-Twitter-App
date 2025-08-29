import { View, Text, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { useColorScheme } from 'nativewind'
import { AntDesign } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather';
import { useUser } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar';

const Notifications = () => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { data: user } = useUser()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}>
      <View className='flex-1 bg-white dark:bg-black'>
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
          <TouchableOpacity>
            <Feather name="settings" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>
        <Text className='text-2xl text-white dark:text-white'>Notifications</Text>
      </View>
    </Sidebar>
  )
}

export default Notifications
