import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../../../../theme/ThemeContext';

type Props = {
  height?: number;
  backgroundColor?: string;
};

function HomeSectionSkeleton({ height = 350, backgroundColor = '#FFFFFF' }: Props) {
  const { isDark } = useAppTheme();
  const opacity = useRef(new Animated.Value(0.55)).current;
  const skeletonColor = isDark ? '#27272A' : '#E8EAED';
  const skeletonHeaderColor = isDark ? '#3F3F46' : '#E3E5E8';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={[styles.header, { backgroundColor: skeletonHeaderColor }]} />
        <View style={styles.cards}>
          <View style={[styles.card, { backgroundColor: skeletonColor }]} />
          <View style={[styles.card, { backgroundColor: skeletonColor }]} />
          <View style={[styles.card, { backgroundColor: skeletonColor }]} />
        </View>
      </Animated.View>
    </View>
  );
}

export default React.memo(HomeSectionSkeleton);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  header: {
    width: '42%',
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E3E5E8',
    marginBottom: 16,
  },
  cards: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#E8EAED',
  },
});
