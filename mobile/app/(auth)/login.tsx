import { View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useColorScheme } from 'nativewind';
import cn from 'clsx';
import { Link } from 'expo-router';
import CustomInput from '@/components/CustomInput';

const Login = () => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [input, setInput] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const bottomViewAnimated = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            (event) => {
                setKeyboardHeight(event.endCoordinates.height);
                Animated.timing(bottomViewAnimated, {
                    toValue: event.endCoordinates.height,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
                Animated.timing(bottomViewAnimated, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: false,
                }).start();
            }
        );

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: input ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [input, animatedValue]);

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View className='flex-1'>

                <KeyboardAvoidingView
                    className='flex-1'
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View className='flex-1 px-6'>
                        {/* Header with close and X icons */}
                        <View className='flex flex-row items-center justify-between mt-4 mb-8'>
                            <Link href={'/auth'}>
                                <AntDesign name='close' size={24} color={isDark ? 'white' : 'black'} />
                            </Link>
                            <FontAwesome6 name='x-twitter' size={24} color={isDark ? 'white' : 'black'} />
                            <View style={{ width: 24 }} />
                        </View>

                        {/* Main content */}
                        <View className='flex-1'>
                            <Text
                                className='text-3xl font-bold text-foreground-secondary-light dark:text-foreground-secondary-dark mb-8 leading-10'
                            >
                                To get started, first enter your phone, email, or @username
                            </Text>

                            {/* Input field with animated label */}
                            <View className=' mb-8'>
                                <CustomInput labelText='Email or username' value={input} setValue={setInput} />
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>

                {/* Bottom section - positioned above keyboard */}
                <Animated.View
                    className='flex flex-row justify-between items-center px-6 py-4 mb-40 '
                    style={{
                        marginBottom: bottomViewAnimated,
                    }}
                >
                    <Link href='/ForgotPassword' asChild>
                        <TouchableOpacity
                            className='bg-transparent border border-gray-300 dark:border-gray-200/80 rounded-full px-6 py-3'
                            activeOpacity={0.7}
                        >
                            <Text
                                className='text-base font-bold text-gray-800 dark:text-gray-200'
                            >
                                Forgot password?
                            </Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity
                        className={cn('rounded-full px-6 py-3', input.length >= 1 ? 'bg-gray-900 dark:bg-gray-100 opacity-100' : 'dark:bg-gray-100 bg-gray-950 opacity-50')}
                        activeOpacity={0.8}
                        disabled={input.length < 1}
                    >
                        <Text
                            className={cn('text-base font-bold', input.length >= 1 ? 'dark:text-gray-900 text-gray-200' : 'text-gray-800')}
                        >
                            Next
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default Login
