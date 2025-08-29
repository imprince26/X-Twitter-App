import { View, Text, TouchableOpacity, Image,TextInput } from 'react-native'
import React, { useState } from 'react'
import { useColorScheme } from 'nativewind'
import { AntDesign } from '@expo/vector-icons'
import Feather from '@expo/vector-icons/Feather';
import { useUser } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar';

const Messages = () => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { data: user } = useUser()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={() => setIsDrawerOpen(false)}>
      <View className='flex-1 bg-white dark:bg-black'>
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
          <View className='w-1/3'>

          {/* <TextInput 
          className='text-black rounded-full text-center dark:text-gray-400 w-full py-2 border border-gray-600'
          placeholder='Search Direct Messages'
          placeholderTextColor={isDark ? '#fff': '#111'}
          /> */}
             
          </View>
         
          <TouchableOpacity>
            <Feather name="settings" size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
        </View>

        {/* Main Content */}
        <View className={`flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-white'}`}>
          <View className="items-center space-y-4">
            <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Messages
            </Text>
          </View>
        </View>
      </View>
    </Sidebar>
  )
}

export default Messages
