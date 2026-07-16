import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

interface ImageSkeletonProps {
  width: number;
  height: number;
  borderRadius?: number;
}

/**
 * Professional skeleton loader with gradient shimmer animation
 * Prevents blurred image rendering by showing placeholder until fully loaded
 */
const ImageSkeleton: React.FC<ImageSkeletonProps> = ({ width, height, borderRadius = 8 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      {/* Base skeleton color */}
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F0F0F0',
        }}
      />

      {/* Shimmer gradient overlay */}
      <Animated.View
        style={[
          styles.shimmer,
          {
            width: width * 0.3,
            height: '100%',
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default ImageSkeleton;
