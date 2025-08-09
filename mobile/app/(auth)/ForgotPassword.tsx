import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,Animated } from 'react-native'
import React,{ useState,useRef,useEffect } from 'react'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Link, useNavigation } from 'expo-router';
import { useColorScheme } from 'nativewind';
import CustomInput from '@/components/CustomInput';
import cn from 'clsx';

const ForgotPassword = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [input, setInput] = useState('');
  const navigation = useNavigation();
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
  
      // useEffect(() => {
      //     Animated.timing(animatedValue, {
      //         toValue: 1,
      //         duration: 200,
      //         useNativeDriver: false,
      //     }).start();
      // }, [animatedValue]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className='flex-1 px-6 ' keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} >

        <View className='flex flex-row items-center justify-between mt-4 mb-8'>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <AntDesign name='close' size={24} color={isDark ? 'white' : 'black'} />
          </TouchableOpacity>
          <FontAwesome6 name='x-twitter' size={24} color={isDark ? 'white' : 'black'} />
          <View style={{ width: 24 }} />
        </View>

        <View className='flex-1 justify-between'>

          <View>
            <Text className='text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200'>
              Find your X account
            </Text>

            <Text className='text-base text-gray-600 dark:text-gray-400 mb-6'>
              Enter your email or username associated with your account to change your password.
            </Text>

            <CustomInput className='mb-12' labelText='Email or username' value={input} setValue={setInput} />
          </View>

          <Animated.View className={'relative'}  style={{ marginBottom: keyboardHeight }}>
            <View className='h-[1px] bg-gray-200 dark:bg-[#2F3336] mb-20 opacity-60'></View>

            <TouchableOpacity className={cn('absolute right-0 bottom-0 flex flex-row justify-center  rounded-full py-3 px-6 mb-3 bg-gray-900 dark:bg-gray-100',input.length >= 1 ? '  opacity-100' : ' opacity-50')} activeOpacity={0.7}>

                <Text className={cn(input.length >= 1 ? 'text-white dark:text-gray-900' : 'text-gray-800 dark:text-gray-800','font-semibold text-base')}>
                  Next
                </Text>
            </TouchableOpacity>

          </Animated.View>
        </View>

      </KeyboardAvoidingView>

    </TouchableWithoutFeedback>
  )
}

export default ForgotPassword
