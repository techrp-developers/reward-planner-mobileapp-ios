import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';

type Props = {
  height?: number;
  backgroundColor?: string;
};

export default function HomeSectionSkeleton({ height = 200, backgroundColor = '#F9FAFB' }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const bg = pulse.interpolate({ inputRange: [0, 1], outputRange: ['#ECECEC', '#D5D5D5'] });

  return (
    <View style={[styles.wrapper, { height, backgroundColor }]}>
      <Animated.View style={[styles.bar, { width: '40%', backgroundColor: bg }]} />
      <Animated.View style={[styles.bar, { width: '100%', marginTop: 12, backgroundColor: bg }]} />
      <Animated.View style={[styles.bar, { width: '100%', marginTop: 10, backgroundColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 16,
    borderRadius: 14,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  bar: {
    height: 16,
    borderRadius: 8,
  },
});
