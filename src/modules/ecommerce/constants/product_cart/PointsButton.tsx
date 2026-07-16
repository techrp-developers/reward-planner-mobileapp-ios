import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RewardIcon from '../../../../assets/product/rewards.svg';

type Props = {
  rewardCoins: number;
  redeemCoins?: number;
  onPress?: () => void;
};

const PointsButton: React.FC<Props> = ({
  rewardCoins,
  redeemCoins = 0,
  onPress,
}) => {
  const { width } = useWindowDimensions();

  const isSmall = width < 360;
  const isTablet = width > 768;

  const labelSize = isTablet ? 12 : isSmall ? 9 : 8;
  const valueSize = isTablet ? 16 : isSmall ? 11 : 12;
  const iconSize = isTablet ? 14 : isSmall ? 10 : 8;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {/* Shadow wrapper for iOS — separate from overflow:hidden */}
      <View style={styles.gradientWrapper}>
        <LinearGradient
          colors={['#8665FF', '#5B47A3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          {/* LEFT - EARN */}
          <View style={styles.section}>
            <Text
              style={[styles.label, { fontSize: labelSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Earn
            </Text>
            <View style={styles.valueRow}>
              <Text
                style={[styles.value, { fontSize: valueSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {rewardCoins}
              </Text>
              <RewardIcon width={iconSize} height={iconSize} />
            </View>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* RIGHT - REDEEM */}
          <View style={styles.section}>
            <Text
              style={[styles.label, { fontSize: labelSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Redeem
            </Text>
            <View style={styles.valueRow}>
              <Text
                style={[styles.value, { fontSize: valueSize }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {redeemCoins}
              </Text>
              <RewardIcon width={iconSize} height={iconSize} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // ─── Pressable: shadow only, NO overflow hidden ───────────────────
  pressable: {
    width: '100%',
    borderRadius: 7,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // ─── Inner wrapper: clips gradient to borderRadius ────────────────
  gradientWrapper: {
    borderRadius: 7,
    overflow: 'hidden', // safe here — no shadow on this layer
  },

  // ─── Gradient container: fixed height so both platforms match ─────
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: 36,          // fixed px — never use paddingVertical for height control
    paddingHorizontal: 4,
  },

  // ─── Each side (Earn / Redeem) ────────────────────────────────────
  section: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Label text (Earn / Redeem) ───────────────────────────────────
  label: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
    includeFontPadding: false,   // removes Android's extra font spacing
    textAlignVertical: 'center',
  },

  // ─── Coins + icon row ─────────────────────────────────────────────
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Coins value text ─────────────────────────────────────────────
  value: {
    color: '#fff',
    fontWeight: '700',
    marginRight: 4,
    textAlign: 'center',
    includeFontPadding: false,   // critical for Android/iOS text height match
    textAlignVertical: 'center',
  },

  // ─── Center divider line ──────────────────────────────────────────
  divider: {
    width: 1,
    height: 22,                  // fixed px — percentage height is broken on iOS
    alignSelf: 'center',         // vertically centers it reliably
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});

export default PointsButton;