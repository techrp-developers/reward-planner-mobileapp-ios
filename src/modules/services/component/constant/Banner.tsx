import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Image } from 'react-native';

const Banner1 = require('../../assete/home/banner1.png');
const Banner2 = require('../../assete/home/banner2.png');

const { width } = Dimensions.get('window');

const bannerSources = [
  Banner1,
  Banner2,
];

export default function Banner() {
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (index + 1) % bannerSources.length;
      scrollRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
      setIndex(nextIndex);
    }, 3000); // ⏱ slide every 3 sec

    return () => clearInterval(timer);
  }, [index]);

  return (
    <View>
      {/* BANNERS */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / width
          );
          setIndex(newIndex);
        }}
      >
        {bannerSources.map((bannerSource, i) => (
          <View key={i} style={styles.banner}>
            <Image
              source={bannerSource}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* DOT INDICATOR */}
      <View style={styles.dots}>
        {bannerSources.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              index === i && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  banner: {
    width,
    paddingHorizontal: 18,
    alignItems: 'center',
  },

  bannerImage: {
    borderRadius: 12,
    width: '100%',
    height: 100,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  activeDot: {
    width: 16,
    backgroundColor: '#111827',
  },
});
