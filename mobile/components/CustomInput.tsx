import { View, Text, Animated, TextInput } from 'react-native'
import React, { useRef, useState, useEffect } from 'react'
import { useColorScheme } from 'nativewind';

interface CustomInputProps {
    placeholder?: string;
    secureTextEntry?: boolean;
    labelText?: string;
    value: string;
    setValue: (value: string) => void;
    multiline?: boolean;
    numberOfLines?: number;
}

const CustomInput = ({
    placeholder,
    secureTextEntry = false,
    labelText,
    value,
    setValue,
    multiline = false,
    numberOfLines = 1
}: CustomInputProps) => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;

    // X (Twitter) exact colors
    const colors = {
        background: isDark ? '#000000' : '#FFFFFF',
        text: isDark ? '#FFFFFF' : '#0F1419',
        textSecondary: isDark ? '#E7E9EA' : '#536471',
        border: isDark ? '#2F3336' : '#CFD9DE',
        borderFocused: '#1DA1F2',
        placeholder: isDark ? '#71767B' : '#536471',
        error: '#F4212E',
    };

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: isFocused || value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [isFocused, value]);

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
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
        zIndex: 1,
    };

    return (
        <View className='relative'>
            <View
                className='border rounded-lg px-4'
                style={{
                    borderColor: isFocused
                        ? colors.borderFocused
                        : colors.border,
                    borderWidth: isFocused ? 2 : 1,
                    paddingVertical: multiline ? 16 : 12,
                    minHeight: multiline ? (numberOfLines * 24 + 32) : 56,
                }}
            >
                <TextInput
                    value={value}
                    onChangeText={setValue}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={secureTextEntry}
                    multiline={multiline}
                    numberOfLines={numberOfLines}
                    className='w-full text-lg'
                    style={{
                        fontSize: 18,
                        paddingTop: isFocused || value ? 8 : 0,
                        color: colors.text,
                        textAlignVertical: multiline ? 'top' : 'center',
                    }}
                    selectionColor={colors.borderFocused}
                    placeholderTextColor={colors.placeholder}
                    placeholder={!isFocused && !value ? placeholder : ''}
                />
            </View>

            {/* Animated Label */}
            {labelText && (
                <Animated.Text style={labelStyle}>
                    {labelText}
                </Animated.Text>
            )}
        </View>
    )
}

export default CustomInput
