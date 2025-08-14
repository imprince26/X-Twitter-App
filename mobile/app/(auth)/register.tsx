import { View, Text, TouchableOpacity, Keyboard, TouchableWithoutFeedback, Animated, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Linking } from 'react-native'
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from 'nativewind';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { router, useLocalSearchParams } from 'expo-router';
import CustomInput from '../../components/CustomInput';
import { api } from '@/utils/api';
import { useAuth } from '@/context/authContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface BasicInfoForm {
  name: string;
  username: string;
  email: string;
  dateOfBirth: string;
}

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

// Validation schemas
const basicInfoSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(15, 'Username cannot exceed 15 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .lowercase(),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email')
    .lowercase(),
  dateOfBirth: yup
    .string()
    .required('Date of birth is required')
    .test('age', 'You must be at least 13 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      return age >= 13;
    }),
});

const passwordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

const Register = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const params = useLocalSearchParams();
  const { checkAuthStatus } = useAuth();

  // States
  const [currentStep, setCurrentStep] = useState<'basic' | 'password' | 'verification'>('basic');
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [verifying, setVerifying] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');

  const bottomViewAnimated = useRef(new Animated.Value(0)).current;

  // Forms
  const basicInfoForm = useForm<BasicInfoForm>({
    resolver: yupResolver(basicInfoSchema),
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: { name: '', username: '', email: '', dateOfBirth: '' },
  });
  const passwordForm = useForm<PasswordForm>({
    resolver: yupResolver(passwordSchema),
    mode: 'onChange',
    shouldUnregister: true,
    defaultValues: { password: '', confirmPassword: '' },
  });

  // Stable form subscriptions
  const { control: basicControl, formState: { isValid: isBasicValid }, watch: watchBasic, setValue: setBasicValue } = basicInfoForm;
  const { control: passwordControl, formState: { isValid: isPasswordValid } } = passwordForm;

  // Watch username for availability check
  const username = watchBasic('username');

  // Check for verification token in URL params
  useEffect(() => {
    if (params.token) {
      handleTokenVerification(params.token as string);
    }
  }, [params.token]);

  // Handle deep link verification
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get('token');
      if (token) {
        handleTokenVerification(token);
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => subscription?.remove();
  }, []);

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

  // Username availability check
  const checkUsernameAvailability = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    // Validate format first
    if (!/^[a-zA-Z0-9_]+$/.test(usernameToCheck)) {
      setUsernameAvailable(false);
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setUsernameChecking(true);
      setUsernameError('');
      const response = await api.get(`/auth/check-username/${usernameToCheck.toLowerCase()}`);
      
      if (response.data.success) {
        setUsernameAvailable(response.data.available);
        if (!response.data.available) {
          setUsernameError('Username already taken');
        }
      }
    } catch (error: any) {
      console.error('Username check error:', error);
      setUsernameAvailable(false);
      setUsernameError('Error checking username availability');
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (username && username.length >= 3) {
        checkUsernameAvailability(username);
      } else {
        setUsernameAvailable(null);
        setUsernameError('');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [username, checkUsernameAvailability]);

  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), []);

  // Date picker handlers
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setBasicValue('dateOfBirth', formattedDate);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  // API calls
  const registerUser = useCallback(async (data: BasicInfoForm & PasswordForm) => {
    try {
      setLoading(true);
      
      // Final username availability check
      const usernameCheck = await api.get(`/auth/check-username/${data.username.toLowerCase()}`);

      if (!usernameCheck.data.available) {
        Alert.alert('Registration Failed', 'Username is no longer available. Please choose another.');
        return;
      }

      // Register user
      const response = await api.post('/auth/register', {
        username: data.username.toLowerCase(),
        email: data.email,
        name: data.name,
        password: data.password,
        dateOfBirth: data.dateOfBirth,
      });

      if (response.data.success) {
        setUserData(response.data.data);
        setCurrentStep('verification');
        Alert.alert(
          'Registration Successful', 
          'Please check your email and click the verification link to complete your registration.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle token verification from email link
  const handleTokenVerification = useCallback(async (token: string) => {
    try {
      setVerifying(true);
      const response = await api.post('/auth/verify-email', { token });
      
      if (response.data.success) {
        // Store token and user data if login is automatic after verification
        if (response.data.token && response.data.user) {
          await Promise.all([
            AsyncStorage.setItem('TwitterToken', response.data.token),
            AsyncStorage.setItem('TwitterUser', JSON.stringify(response.data.user)),
          ]);
          await checkAuthStatus(); // This will update the auth context
        }
        
        Alert.alert(
          'Email Verified', 
          'Your account has been successfully verified! Welcome to Twitter.',
          [{ text: 'Continue', onPress: () => router.replace('/(home)') }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        'Verification Failed', 
        error?.response?.data?.message || 'Invalid or expired verification link.'
      );
    } finally {
      setVerifying(false);
    }
  }, [checkAuthStatus]);

  // Handle URL verification from input
  const handleUrlVerification = useCallback(async () => {
    if (!verificationUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid verification URL');
      return;
    }

    try {
      // Extract token from URL
      const urlObj = new URL(verificationUrl);
      const token = urlObj.searchParams.get('token');
      
      if (!token) {
        Alert.alert('Error', 'Invalid verification URL. Token not found.');
        return;
      }

      await handleTokenVerification(token);
    } catch (error) {
      Alert.alert('Error', 'Invalid URL format. Please check the URL and try again.');
    }
  }, [verificationUrl, handleTokenVerification]);

  const resendVerificationEmail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.post('/auth/resend-verification', {
        email: userData?.email
      });
      
      if (response.data.success) {
        Alert.alert('Email Sent', 'A new verification email has been sent to your email address.');
      }
    } catch (error: any) {
      Alert.alert('Failed to Resend', error?.response?.data?.message || 'Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userData?.email]);

  // Handlers
  const handleBasicInfoSubmit = useCallback((data: BasicInfoForm) => {
    // Check username availability before proceeding
    if (usernameAvailable === false) {
      Alert.alert('Invalid Username', 'Please choose an available username.');
      return;
    }
    
    setUserData((prev: any) => ({ ...prev, ...data }));
    setCurrentStep('password');
  }, [usernameAvailable]);

  const handlePasswordSubmit = useCallback((data: PasswordForm) => {
    const completeData = { ...userData, ...data };
    registerUser(completeData as any);
  }, [userData, registerUser]);

  const goBack = useCallback(() => {
    if (currentStep === 'password') return setCurrentStep('basic');
    if (currentStep === 'verification') return setCurrentStep('password');
    router.back();
  }, [currentStep]);

  // Toggles
  const toggleShowPassword = useCallback(() => setShowPassword(p => !p), []);
  const toggleShowConfirmPassword = useCallback(() => setShowConfirmPassword(p => !p), []);

  // Validity by step - include username availability check for basic step
  const isFormValid = currentStep === 'basic' 
    ? isBasicValid && usernameAvailable === true 
    : currentStep === 'password' 
    ? isPasswordValid 
    : true; // Verification step doesn't need form validation

  const buttonText = useMemo(() => {
    if (currentStep === 'basic') return 'Next';
    if (currentStep === 'password') return 'Sign up';
    if (currentStep === 'verification') return 'Verify URL';
    return 'Next';
  }, [currentStep]);

  // Get username status indicator
  const getUsernameStatus = () => {
    if (!username || username.length < 3) return null;
    if (usernameChecking) return 'checking';
    if (usernameError) return 'error';
    if (usernameAvailable === true) return 'available';
    if (usernameAvailable === false) return 'taken';
    return null;
  };

  const usernameStatus = getUsernameStatus();

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'basic':
        return (
          <>
            <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              Create your account
            </Text>

            <View className="space-y-4 mt-8">
              <Controller
                control={basicControl}
                name="name"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <CustomInput
                    labelText="Name"
                    value={value ?? ''}
                    setValue={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                  />
                )}
              />

              <Controller
                control={basicControl}
                name="username"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <CustomInput
                      labelText="Username"
                      value={value ?? ''}
                      setValue={(text) => {
                        // Reset username status when user types
                        setUsernameAvailable(null);
                        setUsernameError('');
                        onChange(text.toLowerCase());
                      }}
                      onBlur={onBlur}
                      error={error?.message || usernameError}
                      autoCapitalize="none"
                      placeholder="username"
                    />
                    
                    {/* Username status indicator */}
                    {username && username.length >= 3 && (
                      <View className="flex-row items-center mt-1 ml-3">
                        {usernameStatus === 'checking' && (
                          <>
                            <ActivityIndicator size="small" color={isDark ? '#71767B' : '#536471'} />
                            <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              Checking availability...
                            </Text>
                          </>
                        )}
                        {usernameStatus === 'available' && (
                          <>
                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            <Text className="ml-2 text-sm text-green-500">
                              Username available
                            </Text>
                          </>
                        )}
                        {usernameStatus === 'taken' && (
                          <>
                            <Ionicons name="close-circle" size={16} color="#EF4444" />
                            <Text className="ml-2 text-sm text-red-500">
                              Username already taken
                            </Text>
                          </>
                        )}
                        {usernameStatus === 'error' && usernameError && (
                          <>
                            <Ionicons name="close-circle" size={16} color="#EF4444" />
                            <Text className="ml-2 text-sm text-red-500">
                              {usernameError}
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
              />

              <Controller
                control={basicControl}
                name="email"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <CustomInput
                    labelText="Email"
                    value={value ?? ''}
                    setValue={onChange}
                    onBlur={onBlur}
                    error={error?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />

              <Controller
                control={basicControl}
                name="dateOfBirth"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <TouchableOpacity onPress={showDatePickerModal}>
                      <CustomInput
                        labelText="Date of birth"
                        value={value ?? ''}
                        setValue={onChange}
                        onBlur={onBlur}
                        error={error?.message}
                        placeholder="Select your date of birth"
                        editable={false}
                        pointerEvents="none"
                      />
                      <View className="absolute right-4 top-4">
                        <Ionicons name="calendar" size={20} color={isDark ? '#FFFFFF' : '#536471'} />
                      </View>
                    </TouchableOpacity>
                    
                    {showDatePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onDateChange}
                        maximumDate={new Date()}
                        minimumDate={new Date(1900, 0, 1)}
                      />
                    )}
                  </View>
                )}
              />
            </View>

            <View className="mt-4 mb-8">
              <Text className={`text-sm leading-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
              </Text>
            </View>
          </>
        );

      case 'password':
        return (
          <>
            <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              You'll need a password
            </Text>
            <Text className={`text-sm mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Make sure it's 8 characters or more.
            </Text>
            <View className="space-y-4">
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
                    <TouchableOpacity className="absolute right-4 top-4" onPress={toggleShowPassword}>
                      <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={isDark ? '#FFFFFF' : '#536471'} />
                    </TouchableOpacity>
                  </View>
                )}
              />
              <Controller
                control={passwordControl}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <View>
                    <CustomInput
                      labelText="Confirm password"
                      value={value ?? ''}
                      setValue={onChange}
                      onBlur={onBlur}
                      error={error?.message}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity className="absolute right-4 top-4" onPress={toggleShowConfirmPassword}>
                      <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={20} color={isDark ? '#FFFFFF' : '#536471'} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            </View>
          </>
        );

      case 'verification':
        return (
          <>
            <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
              Check your email
            </Text>
            <Text className={`text-sm mb-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              We sent a verification link to {userData?.email}. Click the link in your email to verify your account.
            </Text>
            
            <View className="space-y-4">
              <Text className={`text-sm mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Or paste the verification URL here:
              </Text>
              <CustomInput
                labelText="Verification URL"
                value={verificationUrl}
                setValue={setVerificationUrl}
                placeholder="Paste verification URL here"
                autoCapitalize="none"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View className="mt-6 space-y-3">
              <TouchableOpacity 
                className="mt-4" 
                onPress={resendVerificationEmail} 
                disabled={loading}
              >
                <Text className={`text-sm ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
                  Didn't receive email? Resend verification email
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Already verified? Go to login
                </Text>
              </TouchableOpacity>
            </View>

            {verifying && (
              <View className="mt-4 flex-row items-center justify-center">
                <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                <Text className={`ml-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Verifying your account...
                </Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  const handleButtonPress = useCallback(() => {
    if (currentStep === 'basic') return basicInfoForm.handleSubmit(handleBasicInfoSubmit)();
    if (currentStep === 'password') return passwordForm.handleSubmit(handlePasswordSubmit)();
    if (currentStep === 'verification') return handleUrlVerification();
  }, [currentStep, basicInfoForm, passwordForm, handleBasicInfoSubmit, handlePasswordSubmit, handleUrlVerification]);

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View className="flex flex-row items-center justify-between px-6 mt-4 mb-8">
            <TouchableOpacity onPress={goBack}>
              <AntDesign name={currentStep === 'basic' ? 'close' : 'arrowleft'} size={24} color={isDark ? '#FFFFFF' : '#0F1419'} />
            </TouchableOpacity>
            <FontAwesome6 name="x-twitter" size={24} color={isDark ? '#FFFFFF' : '#0F1419'} />
            <View style={{ width: 24 }} />
          </View>

          {/* Progress indicator */}
          <View className="flex-row px-6 mb-8">
            {['basic', 'password', 'verification'].map((step) => (
              <View
                key={step}
                className={`flex-1 h-1 mx-1 rounded-full ${
                  currentStep === step ||
                  (['password', 'verification'].includes(currentStep) && step === 'basic') ||
                  (currentStep === 'verification' && step === 'password')
                    ? isDark ? 'bg-white' : 'bg-black'
                    : isDark ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>

          {/* Content */}
          <View className="flex-1 px-6">{renderStepContent()}</View>
        </KeyboardAvoidingView>

        {/* Bottom Button */}
        {currentStep !== 'verification' && (
          <Animated.View className={`px-6 py-4 ${isDark ? 'bg-black' : 'bg-white'}`} style={{ marginBottom: bottomViewAnimated }}>
            <TouchableOpacity
              className={`rounded-full py-4 ${
                isFormValid && !loading ? (isDark ? 'bg-white' : 'bg-black') : isDark ? 'bg-gray-800' : 'bg-gray-300'
              }`}
              activeOpacity={0.8}
              disabled={!isFormValid || loading}
              onPress={handleButtonPress}
            >
              {loading ? (
                <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
              ) : (
                <Text className={`text-center text-base font-bold ${isFormValid ? (isDark ? 'text-black' : 'text-white') : isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {buttonText}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Verification step button */}
        {currentStep === 'verification' && verificationUrl.trim() && (
          <Animated.View className={`px-6 py-4 ${isDark ? 'bg-black' : 'bg-white'}`} style={{ marginBottom: bottomViewAnimated }}>
            <TouchableOpacity
              className={`rounded-full py-4 ${isDark ? 'bg-white' : 'bg-black'}`}
              activeOpacity={0.8}
              disabled={loading || verifying}
              onPress={handleUrlVerification}
            >
              {loading || verifying ? (
                <ActivityIndicator color={isDark ? '#000000' : '#FFFFFF'} size="small" />
              ) : (
                <Text className={`text-center text-base font-bold ${isDark ? 'text-black' : 'text-white'}`}>
                  Verify URL
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Register;
