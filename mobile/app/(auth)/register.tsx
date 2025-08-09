import { View, Text, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native'
import React, { useState, useRef, useEffect } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { useColorScheme } from 'nativewind';
import CustomInput from '../../components/CustomInput';
import { Link } from 'expo-router';

const Register = () => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);
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

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const isFormValid = name.length >= 1 && email.length >= 1 && dateOfBirth.length >= 1;

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View className={`flex-1 ${isDark ? 'bg-x-bg-dark' : 'bg-x-bg-light'}`}>
                
                <KeyboardAvoidingView 
                    className='flex-1'
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header */}
                    <View className='flex flex-row items-center justify-between px-6 mt-4 mb-8'>
                        <Link href='/auth' asChild>
                            <TouchableOpacity>
                                <AntDesign 
                                    name='close' 
                                    size={24} 
                                    color={isDark ? '#FFFFFF' : '#0F1419'} 
                                />
                            </TouchableOpacity>
                        </Link>
                        <FontAwesome6 
                            name='x-twitter' 
                            size={24} 
                            color={isDark ? '#FFFFFF' : '#0F1419'} 
                        />
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView className='flex-1 px-6' showsVerticalScrollIndicator={false}>
                        {/* Title */}
                        <Text className={`text-3xl font-bold mb-2 ${
                            isDark ? 'text-white' : 'text-x-text-primary-light'
                        }`}>
                            Create your account
                        </Text>

                        {/* Form Fields */}
                        <View className='space-y-4 mt-8'>
                            {/* Name Field */}
                            <CustomInput 
                                labelText='Name' 
                                value={name} 
                                setValue={setName} 
                            />

                            {/* Email Field */}
                            <CustomInput 
                                labelText='Email' 
                                value={email} 
                                setValue={setEmail} 
                            />

                            {/* Date of Birth Field */}
                            <CustomInput 
                                labelText='Date of birth' 
                                value={dateOfBirth} 
                                setValue={setDateOfBirth} 
                            />
                        </View>

                        {/* Date of Birth Info */}
                        <View className='mt-4 mb-8'>
                            <Text className={`text-sm leading-5 ${
                                isDark ? 'text-white' : 'text-x-text-tertiary-light'
                            }`}>
                                This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
                            </Text>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Button - positioned above keyboard */}
                <Animated.View 
                    className={`px-6 py-4 ${
                        isDark ? 'bg-x-bg-dark' : 'bg-x-bg-light'
                    }`}
                    style={{
                        marginBottom: bottomViewAnimated,
                    }}
                >
                    <TouchableOpacity 
                        className={`rounded-full py-4 ${
                            isFormValid 
                                ? 'bg-x-blue' 
                                : !isDark 
                                    ? 'bg-x-gray-800 opacity-50' 
                                    : 'bg-x-gray-100 opacity-50'
                        }`}
                        activeOpacity={0.8}
                        disabled={!isFormValid}
                    >
                        <Text className={`text-center text-base font-bold ${
                            isFormValid 
                                ? 'text-white' 
                                : isDark 
                                    ? 'text-white' 
                                    : 'text-x-text-tertiary-light'
                        }`}>
                            Sign up
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    )
}

export default Register
