import { View, Text, TextInput, TextInputProps } from 'react-native'
import React, { useState } from 'react'
import { useColorScheme } from 'nativewind'

interface CustomInputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  labelText: string
  value: string
  setValue: (value: string) => void
  error?: string
  onBlur?: () => void
}

const CustomInput: React.FC<CustomInputProps> = ({
  labelText,
  value,
  setValue,
  error,
  onBlur,
  ...textInputProps
}) => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    onBlur?.()
  }

  const hasValue = Boolean(value?.length)
  const hasError = !!error

  return (
    <View className='mb-4'>
      <View className={`relative border-2 rounded-md ${hasError
          ? 'border-red-500'
          : isFocused
            ? (isDark ? 'border-blue-400' : 'border-blue-500')
            : (isDark ? 'border-gray-600' : 'border-gray-300')
        }`}>
        <Text className={`absolute left-3 px-1 text-sm z-10 ${isFocused || hasValue
            ? `top-[-10px] ${hasError
              ? 'text-red-500'
              : isFocused
                ? (isDark ? 'text-blue-400' : 'text-blue-500')
                : (isDark ? 'text-gray-400' : 'text-gray-600')
            } ${isDark ? 'bg-black' : 'bg-white'}`
            : `top-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`
          }`}>
          {labelText}
        </Text>

        <TextInput
          className={`px-3 py-4 text-base ${isDark ? 'text-white bg-black' : 'text-black bg-white'
            }`}
          value={value ?? ''} 
          onChangeText={setValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={isDark ? '#71767B' : '#536471'}
          {...textInputProps}
        />
      </View>

      {hasError && (
        <Text className='text-red-500 text-sm mt-1 ml-3'>
          {error}
        </Text>
      )}
    </View>
  )
}

export default CustomInput
