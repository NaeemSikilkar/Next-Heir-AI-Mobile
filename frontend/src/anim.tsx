import React, { useEffect } from 'react';
import { ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
  withDelay,
} from 'react-native-reanimated';

const isWeb = Platform.OS === 'web';

export const Floating: React.FC<{ children: React.ReactNode; range?: number; duration?: number; style?: ViewStyle }> = ({
  children,
  range = 8,
  duration = 2800,
  style,
}) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withTiming(-range, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [range, duration]);
  const animated = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
};

export const FadeInUp: React.FC<{ children: React.ReactNode; delay?: number; style?: ViewStyle }> = ({
  children,
  delay = 0,
  style,
}) => {
  // Start visible to avoid invisible content on web if effect doesn't run
  const o = useSharedValue(isWeb ? 1 : 0);
  const y = useSharedValue(isWeb ? 0 : 20);
  useEffect(() => {
    if (isWeb) return;
    o.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));
    y.value = withDelay(delay, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));
  }, [delay]);
  const animated = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ translateY: y.value }] }));
  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
};

export const Pulse: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const s = useSharedValue(1);
  useEffect(() => {
    s.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
};
