import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface Props extends PressableProps {
  scale?:    number;
  children:  React.ReactNode;
  style?:    StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({ scale = 0.96, children, style, onPress, ...rest }: Props) {
  const scaleVal = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <AnimatedPressable
      style={[animStyle, style]}
      onPressIn={() => { scaleVal.value = withSpring(scale, { mass: 0.3, damping: 12 }); }}
      onPressOut={() => { scaleVal.value = withSpring(1, { mass: 0.3, damping: 12 }); }}
      onPress={onPress}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
