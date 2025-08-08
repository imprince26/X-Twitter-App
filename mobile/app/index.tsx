import { View, Text } from 'react-native'
import { useState } from 'react';
import { Redirect } from 'expo-router';

const Home = () => {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return (
      <Redirect href="/login" />
    )
  }

  return (
    <View>
      <Text className='text-3xl mx-auto text-black dark:text-white'>Home</Text>
      <Text className='text-xl mx-auto text-gray-600 dark:text-gray-300'>Welcome to the Home Screen!</Text>
    </View>

  )
}

export default Home