import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useColorScheme } from 'nativewind'
import { Link } from 'expo-router'
import AntDesign from '@expo/vector-icons/AntDesign';

const AuthHome = () => {
    const { colorScheme } = useColorScheme();
    const isDarkMode = colorScheme === 'dark';

    return (
        <View className='flex px-10 py-4 justify-between items-center h-full'>
            <View className='mx-auto'>
                <FontAwesome6 name="x-twitter" size={24} color={isDarkMode ? 'white' : 'black'} />
            </View>
            <View>
                <Text className='text-4xl text-black dark:text-gray-300 font-bold'>
                    See what&apos;s happening in the world right now.
                </Text>
            </View>
            <View className='flex flex-col gap-4 my-8'>
                <TouchableOpacity className='flex flex-row  justify-center bg-gray-600 dark:bg-white rounded-full py-3'>
                    <AntDesign name="google" size={24} color="black" />
                    <Text className='text-lg ml-2 text-gray-300 dark:text-gray-600 font-semibold'>
                        Continue with Google
                    </Text>
                </TouchableOpacity>
                <View className='relative h-[1px] bg-gray-200 dark:bg-gray-700'>
                    <Text className='absolute left-1/2 -translate-x-1/2 top-[-0.75rem] bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400'>
                        or
                    </Text>
                </View>
                <TouchableOpacity className='bg-gray-600 dark:bg-white rounded-full py-3'>
                    <Text className='text-lg mx-auto text-gray-300 dark:text-gray-600 font-semibold'>
                        Create account
                    </Text>
                </TouchableOpacity>
                <Text className='text-gray-500 dark:text-gray-500 mb-4 mt-2'>
                    By signing up, you agree to our <Text className='text-sky-500'>Terms</Text>, <Text className='text-sky-500'>Privacy Policy</Text> and <Text className='text-sky-500'>Cookie Use</Text>.
                </Text>
                <Text className='text-[1.1rem] text-gray-500 dark:text-gray-500 '>
                    Have an account already? <Link href={'/login'} className='text-sky-500'>Log in</Link>
                </Text>
            </View>

        </View>
    )
}

export default AuthHome
