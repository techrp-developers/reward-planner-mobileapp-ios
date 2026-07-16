import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import WithoutAddress from '../components/ItemCardAddress/WithoutAddress';
import WithAddress from '../components/ItemCardAddress/WithAddress';
import { fetchAllAddress } from '../api/AddressApi';
import { useAuth } from '../../common/auth/context/AuthContext';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import {
  addressesQueryKey,
} from '../navigation/navigationPerformance';

const TEN_MINUTES = 10 * 60 * 1000;
const THIRTY_MINUTES = 30 * 60 * 1000;

function CartScreen() {
  const { isAuthenticated } = useAuth();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const { data: addressData, isFetching: isAddressFetching } = useQuery({
    queryKey: addressesQueryKey,
    queryFn: fetchAllAddress,
    enabled: isAuthenticated,
    staleTime: TEN_MINUTES,
    gcTime: THIRTY_MINUTES,
  });

  const hasAddress = useMemo(() => {
    const list = Array.isArray(addressData?.data) ? addressData.data : [];
    return list.length > 0;
  }, [addressData?.data]);

  const loading =
    isAuthenticated &&
    !addressData &&
    isAddressFetching;

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.cartSkeletonCard}>
          <SkeletonBox pulse={pulse} width="72%" height={22} borderRadius={10} />
          <SkeletonBox pulse={pulse} width="100%" height={94} borderRadius={14} style={styles.cartSkeletonGap} />
          <SkeletonBox pulse={pulse} width="100%" height={94} borderRadius={14} style={styles.cartSkeletonGap} />
          <SkeletonBox pulse={pulse} width="88%" height={48} borderRadius={12} style={styles.cartSkeletonGapLg} />
        </View>
      </View>
    );
  }

  return hasAddress ? <WithAddress /> : <WithoutAddress />;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
  },
  cartSkeletonCard: {
    width: '100%',
  },
  cartSkeletonGap: {
    marginTop: 14,
  },
  cartSkeletonGapLg: {
    marginTop: 22,
  },
});

export default CartScreen;

