import { View, Animated, Easing } from 'react-native'
import React, { useEffect, useRef } from 'react'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import { useColorScheme } from 'nativewind'

const XLoader = () => {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Animation values
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(0.3)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulsing effect
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.2,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Opacity animation
        const opacityAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0.3,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Subtle rotation
        const rotateAnimation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Start animations
        pulseAnimation.start();
        opacityAnimation.start();
        rotateAnimation.start();

        // Cleanup
        return () => {
            pulseAnimation.stop();
            opacityAnimation.stop();
            rotateAnimation.stop();
        };
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View className={`flex-1 items-center justify-center ${isDark ? 'bg-x-bg-dark' : 'bg-x-bg-light'
            }`}>
            {/* Background circles for effect */}
            <View className="absolute">
                <Animated.View
                    className={`w-32 h-32 rounded-full border-2 ${isDark ? 'border-x-gray-800' : 'border-x-gray-100'
                        }`}
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: 0.3,
                    }}
                />
            </View>

            <View className="absolute">
                <Animated.View
                    className={`w-24 h-24 rounded-full border-2 ${isDark ? 'border-x-gray-700' : 'border-x-gray-200'
                        }`}
                    style={{
                        transform: [{ scale: scaleAnim }],
                        opacity: 0.5,
                    }}
                />
            </View>

            {/* Main X logo */}
            <Animated.View
                style={{
                    transform: [
                        { scale: scaleAnim },
                        { rotate: rotate }
                    ],
                    opacity: opacityAnim,
                }}
            >
                <FontAwesome6
                    name='x-twitter'
                    size={48}
                    color={isDark ? '#FFFFFF' : '#0F1419'}
                />
            </Animated.View>

            {/* Loading dots */}
            <View className="flex-row mt-8 space-x-2">
                {[0, 1, 2].map((index) => (
                    <LoadingDot key={index} delay={index * 200} isDark={isDark} />
                ))}
            </View>
        </View>
    )
}

// Individual loading dot component
const LoadingDot = ({ delay, isDark }: { delay: number; isDark: boolean }) => {
    const dotOpacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(dotOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(dotOpacity, {
                    toValue: 0.3,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ])
        );

        animation.start();

        return () => animation.stop();
    }, [delay]);

    return (
        <Animated.View
            className={`w-2 h-2 rounded-full ${isDark ? 'bg-black' : 'bg-x-text-secondary-light'
                }`}
            style={{ opacity: dotOpacity }}
        />
    );
};

export default XLoader
