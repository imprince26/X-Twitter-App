import { View, Text, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useColorScheme } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRouter } from 'expo-router';
import CustomInput from '@/components/CustomInput';
import { useAuth } from '@/context/authContext';

// Validation schema
const loginSchema = yup.object().shape({
  identifier: yup
    .string()
    .required('Email or username is required')
    .min(3, 'Please enter a valid email or username'),
  password: yup
    .string()
    .required('Password is required')
    .min(1, 'Password is required'),
});

interface LoginForm {
  identifier: string;
  password: string;
}

const Login = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { login, isLoading } = useAuth();
  const router = useRouter();
  
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState<'identifier' | 'password'>('identifier');
  const [userIdentifier, setUserIdentifier] = useState('');
  
  const bottomViewAnimated = useRef(new Animated.Value(0)).current;

  // Form for identifier step
  const identifierForm = useForm<{ identifier: string }>({
    resolver: yupResolver(yup.object().shape({
      identifier: yup.string().required('Email or username is required').min(3, 'Please enter a valid email or username'),
    })),
    mode: 'onChange',
    defaultValues: { identifier: '' },
  });

  // Form for password step
  const passwordForm = useForm<{ password: string }>({
    resolver: yupResolver(yup.object().shape({
      password: yup.string().required('Password is required').min(1, 'Password is required'),
    })),
    mode: 'onChange',
    defaultValues: { password: '' },
  });

  const { control: identifierControl, formState: { isValid: isIdentifierValid }, watch: watchIdentifier } = identifierForm;
  const { control: passwordControl, formState: { isValid: isPasswordValid } } = passwordForm;

  const identifier = watchIdentifier('identifier');

  // Keyboard handling
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      Animated.timing(bottomViewAnimated, {
        toValue: event.endCoordinates.height,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      Animated.timing(bottomViewAnimated, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show?.remove();
      hide?.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  const toggleShowPassword = useCallback(() => setShowPassword(p => !p), []);

  const handleIdentifierSubmit = useCallback((data: { identifier: string }) => {
    setUserIdentifier(data.identifier);
    setCurrentStep('password');
  }, []);

  const handlePasswordSubmit = useCallback(async (data: { password: string }) => {
    try {
      const result = await login(userIdentifier, data.password);
      
      if (result.success) {
        router.replace('/(home)');
      } else {
        Alert.alert('Login Failed', result.message || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Login Failed', 'An unexpected error occurred');
    }
  }, [userIdentifier, login]);

  const goBack = useCallback(() => {
    if (currentStep === 'password') {
      setCurrentStep('identifier');
      passwordForm.reset();
    } else {
      router.back();
    }
  }, [currentStep, passwordForm]);

  const handleButtonPress = useCallback(() => {
    if (currentStep === 'identifier') {
      return identifierForm.handleSubmit(handleIdentifierSubmit)();
    } else {
      return passwordForm.handleSubmit(handlePasswordSubmit)();
    }
  }, [currentStep, identifierForm, passwordForm, handleIdentifierSubmit, handlePasswordSubmit]);

  const isFormValid = currentStep === 'identifier' ? isIdentifierValid : isPasswordValid;
  const buttonText = currentStep === 'identifier' ? 'Next' : 'Log in';

  const renderStepContent = () => {
    if (currentStep === 'identifier') {
      return (
        <>
          <Text className={`text-3xl font-bold mb-8 leading-10 ${isDark ? 'text-white' : 'text-black'}`}>
            To get started, first enter your phone, email, or @username
          </Text>

          <View className="mb-8">
            <Controller
              control={identifierControl}
              name="identifier"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomInput
                  labelText="Email or username"
                  value={value ?? ''}
                  setValue={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              )}
            />
          </View>
        </>
      );
    }

    return (
      <>
        <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
          Enter your password
        </Text>
        <Text className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          {userIdentifier}
        </Text>

        <View className="mb-8">
          <Controller
            control={passwordControl}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View>
                <CustomInput
                  labelText="Password"
                  value={value ?? ''}
                  setValue={onChange}
                  onBlur={onBlur}
                  error={error?.message}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  className="absolute right-4 top-4" 
                  onPress={toggleShowPassword}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={isDark ? '#FFFFFF' : '#536471'} 
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>

        <TouchableOpacity onPress={() => router.push('/forgot-password')} className="mb-4">
          <Text className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1 px-6">
            {/* Header */}
            <View className="flex flex-row items-center justify-between mt-4 mb-8">
              <TouchableOpacity onPress={goBack}>
                <AntDesign 
                  name={currentStep === 'identifier' ? 'close' : 'arrowleft'} 
                  size={24} 
                  color={isDark ? '#FFFFFF' : '#0F1419'} 
                />
              </TouchableOpacity>
              <FontAwesome6 name="x-twitter" size={24} color={isDark ? '#FFFFFF' : '#0F1419'} />
              <View style={{ width: 24 }} />
            </View>

            {/* Progress indicator */}
            <View className="flex-row mb-8">
              {['identifier', 'password'].map((step, index) => (
                <View
                  key={step}
                  className={`flex-1 h-1 mx-1 rounded-full ${
                    currentStep === step || 
                    (currentStep === 'password' && step === 'identifier')
                      ? isDark ? 'bg-white' : 'bg-black'
                      : isDark ? 'bg-gray-700' : 'bg-gray-300'
                  }`}
                />
              ))}
            </View>

            {/* Content */}
            <View className="flex-1">
              {renderStepContent()}
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* Bottom Button */}
        <Animated.View 
          className={`px-6 py-4 ${isDark ? 'bg-black' : 'bg-white'}`} 
          style={{ marginBottom: bottomViewAnimated }}
        >
          {currentStep === 'identifier' && (
            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
              <Text className={`text-sm mb-4 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            className={`rounded-full py-4 ${
              isFormValid && !isLoading 
                ? (isDark ? 'bg-white' : 'bg-black') 
                : isDark ? 'bg-gray-800' : 'bg-gray-300'
            }`}
            activeOpacity={0.8}
            disabled={!isFormValid || isLoading}
            onPress={handleButtonPress}
          >
            {isLoading ? (
              <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
            ) : (
              <Text 
                className={`text-center text-base font-bold ${
                  isFormValid 
                    ? (isDark ? 'text-black' : 'text-white') 
                    : isDark ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {buttonText}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Login;