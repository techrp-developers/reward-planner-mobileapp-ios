import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import CartHead from './navbar/CartHead';
import SkeletonBox from './SkeletonBox';

/**
 * Skeleton placeholder shown while CartScreen data loads.
 * Mimics the real screen layout to avoid layout shifts on data arrival.
 */
export default function ServiceDetailSkeleton() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          useNativeDriver: false,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return (
    <View style={styles.root}>
      <CartHead />

      <View style={styles.scroll}>
        {/* Hero image */}
        <SkeletonBox pulse={pulse} width="100%" height={220} borderRadius={0} />

        {/* Variant selector pills */}
        <View style={styles.pillRow}>
          {[1, 2, 3].map(i => (
            <SkeletonBox key={i} pulse={pulse} width={80} height={36} borderRadius={20} style={styles.pill} />
          ))}
        </View>

        {/* Title + subtitle */}
        <View style={styles.section}>
          <SkeletonBox pulse={pulse} width="70%" height={22} style={styles.mb8} />
          <SkeletonBox pulse={pulse} width="90%" height={14} style={styles.mb6} />
          <SkeletonBox pulse={pulse} width="80%" height={14} />
        </View>

        {/* Feature list */}
        <View style={styles.section}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={styles.featureRow}>
              <SkeletonBox pulse={pulse} width={18} height={18} borderRadius={9} />
              <SkeletonBox pulse={pulse} width="80%" height={14} style={styles.ml12} />
            </View>
          ))}
        </View>

        {/* Form card */}
        <View style={styles.formCard}>
          <SkeletonBox pulse={pulse} width="50%" height={18} style={styles.mb12} />
          {[1, 2, 3].map(i => (
            <SkeletonBox key={i} pulse={pulse} width="100%" height={44} borderRadius={10} style={styles.mb10} />
          ))}
          <SkeletonBox pulse={pulse} width="100%" height={48} borderRadius={10} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    overflow: 'hidden',
  },
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 14,
  },
  pill: {
    marginRight: 10,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  formCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 16,
  },
  mb6:  { marginBottom: 6 },
  mb8:  { marginBottom: 8 },
  mb10: { marginBottom: 10 },
  mb12: { marginBottom: 12 },
  ml12: { marginLeft: 12 },
});
