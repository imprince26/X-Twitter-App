import { View, Text, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useColorScheme } from 'nativewind';
import cn from 'clsx';
import { Link } from 'expo-router';

const Login = () => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const bottomViewAnimated = useRef(new Animated.Value(0)).current;

    // Theme colors
    const colors = {
        background: isDark ? '#000000' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#0F1419',
        textSecondary: isDark ? '#E7E9EA' : '#536471',
        border: isDark ? '#33363f' : '#CFD9DE',
        borderFocused: '#1DA1F2',
        placeholder: isDark ? '#71767B' : '#536471',
        buttonDisabled: isDark ? '#0F2222' : '#E7E9EA',
        buttonDisabledText: isDark ? '#71767B' : '#536471',
        iconColor: isDark ? '#FFFFFF' : '#0F1419',
    };

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
            toValue: isFocused || input ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, input]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const labelStyle = {
        position: 'absolute' as const,
        left: 16,
        top: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, -8],
        }),
        fontSize: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 14],
        }),
        color: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [colors.placeholder, isFocused ? colors.borderFocused : colors.placeholder],
        }),
        backgroundColor: colors.background,
        paddingHorizontal: 4,
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
                                className='text-3xl font-bold text-gray-700 dark:text-gray-300 mb-8 leading-10'
                            >
                                To get started, first enter your phone, email, or @username
                            </Text>

                            {/* Input field with animated label */}
                            <View className='relative mb-8'>
                                <View 
                                    className='border rounded-lg px-4 py-2'
                                    style={{
                                        borderColor: isFocused 
                                            ? colors.borderFocused
                                            : colors.border,
                                        borderWidth: isFocused ? 2 : 1,
                                    }}
                                >
                                    <TextInput
                                        value={input}
                                        onChangeText={setInput}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        className='w-full text-lg'
                                        style={{ 
                                            // fontSize: 18, 
                                            // paddingTop: isFocused || input ? 8 : 0,
                                            // outlineStyle: 'none',
                                            color: colors.text
                                        }}
                                        selectionColor={colors.borderFocused}
                                        placeholderTextColor={colors.placeholder}
                                    />
                                </View>
                                <Animated.Text style={labelStyle}>
                                    Phone, email, or username
                                </Animated.Text>
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

                    <TouchableOpacity 
                        className={cn('rounded-full px-6 py-3',input.length >= 1 ? 'bg-gray-900 dark:bg-gray-100 opacity-100' : 'dark:bg-gray-100 bg-gray-950/70 opacity-50')}
                        activeOpacity={0.8}
                        disabled={input.length < 1}
                    >
                        <Text 
                            className={cn('text-base font-bold',input.length >= 1 ? 'dark:text-gray-900 text-gray-200' : 'text-gray-800')}
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
