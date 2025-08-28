import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ScrollView,
} from 'react-native'
import React, { useEffect, useState } from 'react'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import AntDesign from '@expo/vector-icons/AntDesign'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useNavigation, useRouter } from 'expo-router'
import { useColorScheme } from 'nativewind'
import { useMutation } from '@tanstack/react-query'
import CustomInput from '@/components/CustomInput'
import cn from 'clsx'
import { api } from '@/utils/api'

interface ForgotPasswordPayload {
  email?: string;
  username?: string;
}

interface ResetPasswordPayload {
  token: string;
  password: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const ForgotPassword = () => {
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const navigation = useNavigation()
  const router = useRouter()

  // steps: 1 = request reset email, 2 = enter token + new password
  const [step, setStep] = useState<1 | 2>(1)

  // form state
  const [identifier, setIdentifier] = useState('') // email or username
  const [token, setToken] = useState('') // token pasted from email link
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // keyboard offset
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    )
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  // Validation functions
  const isEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
  const isUsername = (val: string) =>
    /^[a-zA-Z0-9_]{3,15}$/.test(val.trim())

  const buildForgotPayload = (): ForgotPasswordPayload => {
    const value = identifier.trim()
    if (isEmail(value)) return { email: value }
    if (isUsername(value)) return { username: value }
    // fallback to email key if not certain
    return { email: value }
  }

  const validIdentifier = () =>
    isEmail(identifier) || isUsername(identifier)

  const validPassword = (pwd: string) => pwd.length >= 8
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const validToken = token.trim().length > 0 // token may be a long JWT, don't enforce 6 digits

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setStep(2);
        Alert.alert('Email sent', data.message || 'Check your email for a reset link or code.');
      } else {
        Alert.alert('Error', data.error || 'Failed to send reset email.');
      }
    },
    onError: (error: any) => {
      console.error('Forgot password error:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Network error. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (payload: ResetPasswordPayload): Promise<ResetPasswordResponse> => {
      const response = await api.post('/auth/reset-password', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert('Success', data.message || 'Password reset successful.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to reset password.');
      }
    },
    onError: (error: any) => {
      console.error('Reset password error:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Network error. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  // Resend forgot password mutation
  const resendForgotPasswordMutation = useMutation({
    mutationFn: async (payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> => {
      const response = await api.post('/auth/forgot-password', payload);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        Alert.alert('Sent', data.message || 'We resent the reset email.');
      } else {
        Alert.alert('Error', data.error || 'Failed to resend email.');
      }
    },
    onError: (error: any) => {
      console.error('Resend error:', error);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || 'Network error. Please try again.';
      Alert.alert('Error', errorMessage);
    },
  });

  const handleSendResetEmail = () => {
    if (!validIdentifier()) {
      Alert.alert('Error', 'Enter a valid email or username.');
      return;
    }
    forgotPasswordMutation.mutate(buildForgotPayload());
  };

  const handleResetPassword = () => {
    if (!validToken) {
      Alert.alert('Error', 'Paste the reset token from your email.');
      return;
    }
    if (!validPassword(newPassword)) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    
    resetPasswordMutation.mutate({
      token: token.trim(),
      password: newPassword.trim(),
    });
  };

  const handleResend = () => {
    if (!validIdentifier()) {
      Alert.alert('Error', 'Identifier missing. Go back and enter your email/username.');
      return;
    }
    resendForgotPasswordMutation.mutate(buildForgotPayload());
  };

  const onPrimaryPress = () => {
    if (step === 1) return handleSendResetEmail();
    return handleResetPassword();
  };

  // Loading states from mutations
  const isLoading = forgotPasswordMutation.isPending || resetPasswordMutation.isPending;
  const isResending = resendForgotPasswordMutation.isPending;

  const primaryDisabled =
    (step === 1 && (!validIdentifier() || isLoading)) ||
    (step === 2 && (!validToken || !validPassword(newPassword) || !passwordsMatch || isLoading));

  const headerTitle = step === 1 ? 'Find your X account' : 'Reset your password';
  const headerDesc =
    step === 1
      ? 'Enter your email or username to receive a reset link.'
      : 'Paste the reset token from your email and set a new password.';

  const handleBack = () => {
    if (step === 2) setStep(1);
    else navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={`flex-1 px-6 ${isDark ? 'bg-black' : 'bg-white'}`}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-8">
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7} className="p-2 -ml-2">
            <AntDesign
              name={step === 1 ? 'close' : 'arrowleft'}
              size={24}
              color={isDark ? 'white' : 'black'}
            />
          </TouchableOpacity>
          <FontAwesome6 name="x-twitter" size={24} color={isDark ? 'white' : 'black'} />
          <View style={{ width: 24 }} />
        </View>

        {/* Progress */}
        <View className="flex-row justify-center mb-6">
          {[1, 2].map((s, i) => (
            <View key={s} className="flex-row items-center">
              <View
                className={cn(
                  'w-3 h-3 rounded-full',
                  step >= s ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                )}
              />
              {i < 1 && (
                <View
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    step > s ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                  )}
                />
              )}
            </View>
          ))}
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-1 justify-between min-h-[500px]">
            {/* Content */}
            <View>
              <Text className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                {headerTitle}
              </Text>
              <Text className="text-base text-gray-600 dark:text-gray-400 mb-8 leading-6">
                {headerDesc}
              </Text>

              {step === 1 ? (
                <View>
                  <CustomInput
                    className="mb-4"
                    labelText="Email or username"
                    value={identifier}
                    setValue={setIdentifier}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                  {identifier.length > 0 && !validIdentifier() && (
                    <Text className="text-red-500 text-sm mt-2 px-4">
                      Enter a valid email or username.
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <CustomInput
                    className="mb-4"
                    labelText="Reset token"
                    value={token}
                    setValue={setToken}
                    autoCapitalize="none"
                    placeholder="Paste token from email link"
                    editable={!isLoading}
                  />

                  <View className="relative mb-4">
                    <CustomInput
                      labelText="New password"
                      value={newPassword}
                      setValue={setNewPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-8"
                      onPress={() => setShowPassword((p) => !p)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View className="relative mb-2">
                    <CustomInput
                      labelText="Confirm password"
                      value={confirmPassword}
                      setValue={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      className="absolute right-4 top-8"
                      onPress={() => setShowConfirmPassword((p) => !p)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={isDark ? '#9CA3AF' : '#6B7280'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View className="mt-4 space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons
                        name={validPassword(newPassword) ? 'checkmark-circle' : 'ellipse-outline'}
                        size={16}
                        color={validPassword(newPassword) ? '#10B981' : isDark ? '#6B7280' : '#9CA3AF'}
                      />
                      <Text
                        className={cn(
                          'ml-2 text-sm',
                          validPassword(newPassword) ? 'text-green-500' : 'text-gray-500'
                        )}
                      >
                        At least 8 characters
                      </Text>
                    </View>

                    {confirmPassword.length > 0 && (
                      <View className="flex-row items-center">
                        <Ionicons
                          name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                          size={16}
                          color={passwordsMatch ? '#10B981' : '#EF4444'}
                        />
                        <Text
                          className={cn(
                            'ml-2 text-sm',
                            passwordsMatch ? 'text-green-500' : 'text-red-500'
                          )}
                        >
                          Passwords match
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Resend */}
                  <TouchableOpacity
                    onPress={handleResend}
                    activeOpacity={0.7}
                    disabled={isResending}
                    className="mt-6"
                  >
                    <Text className="text-blue-500 text-base">
                      {isResending ? 'Sending…' : "Didn't receive the email? Resend"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom action */}
            <View className="relative mt-8" style={{ marginBottom: keyboardHeight }}>
              <View className="h-[1px] bg-gray-200 dark:bg-[#2F3336] mb-20 opacity-60" />
              <TouchableOpacity
                className={cn(
                  'absolute right-0 bottom-0 flex-row justify-center items-center rounded-full py-3 px-8 mb-3',
                  !primaryDisabled ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-300 dark:bg-gray-700'
                )}
                activeOpacity={0.8}
                onPress={onPrimaryPress}
                disabled={primaryDisabled}
              >
                <Text
                  className={cn(
                    'font-semibold text-base',
                    !primaryDisabled ? 'text-white dark:text-gray-900' : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step === 1 ? (isLoading ? 'Sending…' : 'Next') : isLoading ? 'Saving…' : 'Change password'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

export default ForgotPassword