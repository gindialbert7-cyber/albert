import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  marginVertical?: number;
  opacity?: number;
}

export default function GoldDivider({ marginVertical = 16, opacity = 0.5 }: Props) {
  return (
    <View style={[styles.container, { marginVertical }]}>
      <LinearGradient
        colors={['transparent', '#C9A84C', '#E8C547', '#C9A84C', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.line, { opacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center' },
  line:      { width: '80%', height: 1 },
});
