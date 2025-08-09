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
                <Text className='text-4xl text-foreground-secondary-light dark:text-foreground-secondary-dark font-bold'>
                    See what&apos;s happening in the world right now.
                </Text>
            </View>
            <View className='flex flex-col gap-4 my-8'>
                <TouchableOpacity className='flex flex-row justify-center bg-transparent border border-gray-200 dark:border-none dark:bg-background-light rounded-full py-3'>
                    <AntDesign name="google" size={24} color='black' />
                    <Text className='text-lg ml-2 text-foreground-primary-light font-semibold'>
                        Continue with Google
                    </Text>
                </TouchableOpacity>
                <View className='relative h-[1px] bg-gray-200 dark:bg-gray-700'>
                    <Text className='absolute left-1/2 -translate-x-1/2 top-[-0.75rem] bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400'>
                        or
                    </Text>
                </View>
                <TouchableOpacity className='bg-background-dark dark:bg-background-light rounded-full py-3'>
                    <Text className='text-lg mx-auto text-foreground-primary-dark dark:text-foreground-primary-light font-semibold'>
                        Create account
                    </Text>
                </TouchableOpacity>
                <Text className='text-foreground-tertiary-light dark:text-foreground-tertiary-dark mb-4 mt-2'>
                    By signing up, you agree to our <Text className='text-x-blue'>Terms</Text>, <Text className='text-x-blue'>Privacy Policy</Text> and <Text className='text-x-blue'>Cookie Use</Text>.
                </Text>
                <Text className='text-[1.1rem] text-foreground-tertiary-light dark:text-foreground-tertiary-dark'>
                    Have an account already? <Link href={'/login'} className='text-x-blue'>Log in</Link>
                </Text>
            </View>

        </View>
    )
}

export default AuthHome
