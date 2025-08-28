import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { use, useState } from 'react';
import { useColorScheme } from 'nativewind';
// import { useAuth } from '@/context/authContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/hooks/useAuth';

const dummyPosts = [
  {
    id: 1,
    user: {
      name: 'Elon Musk',
      username: 'elonmusk',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1590968738358079488/IY9Gx6Ok_400x400.jpg',
    },
    content: 'Just launched another rocket to Mars! 🚀 The future is looking bright for humanity.',
    timestamp: '2h',
    likes: 45000,
    retweets: 12000,
    replies: 3400,
    views: 2100000,
  },
  {
    id: 2,
    user: {
      name: 'OpenAI',
      username: 'OpenAI',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1634058036934500352/b4F1eVpJ_400x400.jpg',
    },
    content: 'Introducing GPT-5: The most advanced AI model yet. Coming soon with revolutionary capabilities in reasoning and creativity.',
    timestamp: '4h',
    likes: 89000,
    retweets: 23000,
    replies: 8900,
    views: 5600000,
  },
  {
    id: 3,
    user: {
      name: 'Tim Cook',
      username: 'tim_cook',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1535420431766671360/Pwq-1eJc_400x400.jpg',
    },
    content: 'Excited to announce the new iPhone 16 Pro with revolutionary AI features. The future of mobile technology is here! 📱✨',
    timestamp: '6h',
    likes: 67000,
    retweets: 18000,
    replies: 5600,
    views: 3200000,
  },
  {
    id: 4,
    user: {
      name: 'NASA',
      username: 'nasa',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1321163587679784960/0ZxKlEKB_400x400.jpg',
    },
    content: 'Breaking: James Webb telescope discovers potentially habitable exoplanet just 22 light-years away! 🌌🔭 #SpaceExploration',
    timestamp: '8h',
    likes: 134000,
    retweets: 45000,
    replies: 12000,
    views: 8900000,
  },
  {
    id: 5,
    user: {
      name: 'React',
      username: 'reactjs',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1785867863191932928/EpOqfO6d_400x400.png',
    },
    content: 'React 19 is now available! 🎉 New features include Server Components, improved Suspense, and better performance optimizations.',
    timestamp: '12h',
    likes: 56000,
    retweets: 15000,
    replies: 4200,
    views: 2800000,
  },
  {
    id: 6,
    user: {
      name: 'Vercel',
      username: 'vercel',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1421994566152105984/Uw5fq8W0_400x400.jpg',
    },
    content: 'Deploy your Next.js 15 app in seconds with zero configuration. The fastest way to ship your ideas to production! ⚡',
    timestamp: '1d',
    likes: 23000,
    retweets: 6700,
    replies: 1800,
    views: 890000,
  },
  {
    id: 7,
    user: {
      name: 'GitHub',
      username: 'github',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1633247750010830848/ctuDmYu-_400x400.png',
    },
    content: 'GitHub Copilot now supports 50+ programming languages and integrates with VS Code, Visual Studio, and JetBrains IDEs! 🤖👨‍💻',
    timestamp: '1d',
    likes: 78000,
    retweets: 21000,
    replies: 6900,
    views: 4200000,
  },
  {
    id: 8,
    user: {
      name: 'TechCrunch',
      username: 'TechCrunch',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1705873774921007104/CkW2Xqwt_400x400.jpg',
    },
    content: 'BREAKING: AI startup raises $500M Series B to develop autonomous robots for everyday tasks. The robotics revolution is here! 🤖',
    timestamp: '2d',
    likes: 45000,
    retweets: 12000,
    replies: 3400,
    views: 1900000,
  },
  {
    id: 9,
    user: {
      name: 'Product Hunt',
      username: 'ProductHunt',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1706924890390761472/lqF6_1b0_400x400.jpg',
    },
    content: '🏆 Today\'s #1 Product: AI-powered code review tool that catches bugs before deployment. Game-changer for developers! 💻✨',
    timestamp: '2d',
    likes: 34000,
    retweets: 8900,
    replies: 2100,
    views: 1200000,
  },
  {
    id: 10,
    user: {
      name: 'Expo',
      username: 'expo',
      verified: true,
      avatar: 'https://pbs.twimg.com/profile_images/1687004409985089536/lfNBqaTR_400x400.png',
    },
    content: 'Expo SDK 52 is here! 🎉 Build universal apps with the latest React Native 0.76, improved performance, and new APIs.',
    timestamp: '3d',
    likes: 28000,
    retweets: 7200,
    replies: 1600,
    views: 950000,
  },
];

const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const Home = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const {data:user} = useUser();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = () => {
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const PostItem = ({ item }) => (
    <View className={`border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} px-4 py-4`}>
      <View className="flex-row">
        <View className="mt-1 mr-3">
          <View className="w-12 h-12 rounded-full overflow-hidden">
            <Image
              source={{ uri: item.user.avatar }}
              className="w-10 h-10 rounded-full ml-2"
              style={{ width: 28, height: 28 }}
            />
          </View>
        </View>

        {/* Post Content */}
        <View className="flex-1 ml-2">
          {/* User Info */}
          <View className="flex-row items-center mb-2">
            <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.user.name}
            </Text>
            {item.user.verified && (
              <MaterialIcons name="verified" size={18} color="#1DA1F2" style={{ marginLeft: 4 }} />
            )}
            <Text className={`ml-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              @{item.user.username}
            </Text>
            <Text className={`ml-2 text-base ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              · {item.timestamp}
            </Text>
          </View>

          {/* Post Text */}
          <Text className={`text-base leading-6 mb-4 text-gray-900 dark:text-white`}>
            {item.content}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row justify-between items-center mt-2">
            {/* Reply */}
            <TouchableOpacity className="flex-row items-center flex-1">
              <Feather name="message-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatNumber(item.replies)}
              </Text>
            </TouchableOpacity>

            {/* Retweet */}
            <TouchableOpacity className="flex-row items-center flex-1">
              <AntDesign name="retweet" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatNumber(item.retweets)}
              </Text>
            </TouchableOpacity>

            {/* Like */}
            <TouchableOpacity className="flex-row items-center flex-1">
              <AntDesign name="hearto" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatNumber(item.likes)}
              </Text>
            </TouchableOpacity>

            {/* Views */}
            <TouchableOpacity className="flex-row items-center flex-1">
              <Feather name="bar-chart-2" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {formatNumber(item.views)}
              </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity className="flex-1 items-end">
              <Feather name="share" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const HeaderComponent = () => (
    <View className={`flex flex-row justify-between items-center px-4 py-4 ${isDark ? 'bg-black' : 'bg-white'}`}>
      <TouchableOpacity onPress={openDrawer}>
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <View className={`w-8 h-8 rounded-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-300'}`}>
            <AntDesign name="user" size={20} color={isDark ? 'white' : 'black'} />
          </View>
        )}
      </TouchableOpacity>
      <FontAwesome6 name="x-twitter" size={28} color={isDark ? 'white' : 'black'} />
      <TouchableOpacity>
        <Feather name="settings" size={24} color={isDark ? 'white' : 'black'} />
      </TouchableOpacity>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Sidebar isDrawerOpen={isDrawerOpen} closeDrawer={closeDrawer}>
        <View className={`flex-1 ${isDark ? 'bg-black' : 'bg-white'}`}>
          <FlatList
            data={dummyPosts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={PostItem}
            ListHeaderComponent={HeaderComponent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 100, // Space for tab bar
            }}
            style={{
              flex: 1,
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
            }}
          />
        </View>
      </Sidebar>
    </GestureHandlerRootView>
  );
};

export default Home;
