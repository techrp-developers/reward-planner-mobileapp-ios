import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import RewardIcon from '../../../../assets/product/rewards.svg';

type Props = {
  rewardCoins: number;
  redeemCoins?: number;
  onPress?: () => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const IS_SMALL = SCREEN_WIDTH < 360;
const IS_TABLET = SCREEN_WIDTH > 768;
const LABEL_SIZE = IS_TABLET ? 12 : IS_SMALL ? 9 : 8;
const VALUE_SIZE = IS_TABLET ? 16 : IS_SMALL ? 11 : 12;
const ICON_SIZE = IS_TABLET ? 14 : IS_SMALL ? 10 : 8;

const PointsButton: React.FC<Props> = ({
  rewardCoins,
  redeemCoins = 0,
  onPress,
}) => {
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
        <View style={styles.container}>
          {/* LEFT - EARN */}
          <View style={styles.section}>
            <Text
              style={[styles.label, { fontSize: LABEL_SIZE }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Earn
            </Text>
            <View style={styles.valueRow}>
              <Text
                style={[styles.value, { fontSize: VALUE_SIZE }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {rewardCoins}
              </Text>
              <RewardIcon width={ICON_SIZE} height={ICON_SIZE} />
            </View>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* RIGHT - REDEEM */}
          <View style={styles.section}>
            <Text
              style={[styles.label, { fontSize: LABEL_SIZE }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              Redeem
            </Text>
            <View style={styles.valueRow}>
              <Text
                style={[styles.value, { fontSize: VALUE_SIZE }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {redeemCoins}
              </Text>
              <RewardIcon width={ICON_SIZE} height={ICON_SIZE} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  // ─── Pressable: shadow only, NO overflow hidden ───────────────────
  pressable: {
    width: '100%',
    borderRadius: 7,
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
    backgroundColor: '#6952C6',
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

export default React.memo(PointsButton);
