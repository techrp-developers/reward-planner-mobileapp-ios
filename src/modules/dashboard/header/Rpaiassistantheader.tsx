import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

// ---------- Sub-components ----------

const SignalIcon = () => (
  <Svg width={17} height={12} viewBox="0 0 17 12" fill="none">
    <Rect x={0} y={4} width={3} height={8} rx={1} fill="#1a1a2e" />
    <Rect x={4.5} y={2.5} width={3} height={9.5} rx={1} fill="#1a1a2e" />
    <Rect x={9} y={0.5} width={3} height={11.5} rx={1} fill="#1a1a2e" />
    <Rect x={13.5} y={0} width={3} height={12} rx={1} fill="#1a1a2e" opacity={0.3} />
  </Svg>
);

const WifiIcon = () => (
  <Svg width={16} height={12} viewBox="0 0 16 12" fill="none">
    <Path
      d="M8 2.4C10.2 2.4 12.2 3.3 13.6 4.8L15 3.4C13.2 1.3 10.7 0 8 0C5.3 0 2.8 1.3 1 3.4L2.4 4.8C3.8 3.3 5.8 2.4 8 2.4Z"
      fill="#1a1a2e"
    />
    <Path
      d="M8 5.6C9.5 5.6 10.8 6.2 11.8 7.2L13.2 5.8C11.8 4.4 9.9 3.6 8 3.6C6.1 3.6 4.2 4.4 2.8 5.8L4.2 7.2C5.2 6.2 6.5 5.6 8 5.6Z"
      fill="#1a1a2e"
    />
    <Circle cx={8} cy={10} r={2} fill="#1a1a2e" />
  </Svg>
);

const BatteryIcon = () => (
  <Svg width={25} height={12} viewBox="0 0 25 12" fill="none">
    <Rect x={0.5} y={0.5} width={21} height={11} rx={3.5} stroke="#1a1a2e" strokeOpacity={0.35} />
    <Rect x={2} y={2} width={16} height={8} rx={2} fill="#1a1a2e" />
    <Path
      d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z"
      fill="#1a1a2e"
      fillOpacity={0.4}
    />
  </Svg>
);

const HamburgerIcon = () => (
  <Svg width={22} height={16} viewBox="0 0 22 16" fill="none">
    <Rect y={0} width={22} height={2.5} rx={1.25} fill="#1a1a2e" />
    <Rect y={6.5} width={16} height={2.5} rx={1.25} fill="#1a1a2e" />
    <Rect y={13} width={22} height={2.5} rx={1.25} fill="#1a1a2e" />
  </Svg>
);

const ProfileIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path
      d="M9 9C11.2 9 13 7.2 13 5C13 2.8 11.2 1 9 1C6.8 1 5 2.8 5 5C5 7.2 6.8 9 9 9Z"
      stroke="#6c63d4"
      strokeWidth={1.5}
    />
    <Path
      d="M1 17C1 13.7 4.6 11 9 11C13.4 11 17 13.7 17 17"
      stroke="#6c63d4"
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  </Svg>
);

const SparkleIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <Defs>
      <LinearGradient id="starGrad" x1={4.5} y1={4} x2={17.5} y2={16.3} gradientUnits="userSpaceOnUse">
        <Stop offset="0%" stopColor="#a78ef5" />
        <Stop offset="100%" stopColor="#7c55e8" />
      </LinearGradient>
    </Defs>
    <Path
      d="M11 4L12.8 8.2L17.5 8.6L14 11.7L15.1 16.3L11 13.8L6.9 16.3L8 11.7L4.5 8.6L9.2 8.2L11 4Z"
      fill="url(#starGrad)"
    />
    <Path
      d="M16 2L16.8 3.8L18.7 4L17.3 5.3L17.7 7.2L16 6.2L14.3 7.2L14.7 5.3L13.3 4L15.2 3.8L16 2Z"
      fill="#9b8ef0"
    />
  </Svg>
);

// ---------- Toggle Switch ----------

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ value, onToggle }) => {
  const translateX = React.useRef(new Animated.Value(value ? 28 : 0)).current;

  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 28 : 0,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onToggle}
      style={[styles.toggleTrack, { backgroundColor: value ? '#7c55e8' : '#c8c4e8' }]}
    >
      {value && (
        <Text style={styles.toggleLabel}>ON</Text>
      )}
      <Animated.View
        style={[styles.toggleThumb, { transform: [{ translateX }] }]}
      />
      {!value && (
        <Text style={[styles.toggleLabel, styles.toggleLabelOff]}>OFF</Text>
      )}
    </TouchableOpacity>
  );
};

// ---------- Main Component ----------

const RPAIAssistantHeader: React.FC = () => {
  const navigation = useNavigation<any>();
  const [isEnabled, setIsEnabled] = useState<boolean>(true);

  const handleToggle = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    if (!next) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0EFFA" />

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.timeText}>9:41</Text>
        <View style={styles.notchPill} />
        <View style={styles.statusIcons}>
          <SignalIcon />
          <View style={styles.iconGap} />
          <WifiIcon />
          <View style={styles.iconGap} />
          <BatteryIcon />
        </View>
      </View>

      {/* Nav Row */}
      <View style={styles.navRow}>
        <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
          <HamburgerIcon />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.profileButton}>
          <ProfileIcon />
        </TouchableOpacity>
      </View>

      {/* AI Assistant Card */}
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <SparkleIcon />
          <Text style={styles.cardLabel}>RP AI Assistant</Text>
        </View>
        <ToggleSwitch value={isEnabled} onToggle={handleToggle} />
      </View>
    </View>
  );
};

// ---------- Styles ----------

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: '#F0EFFA',
    borderRadius: 32,
    overflow: 'hidden',
    paddingBottom: 20,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a2e',
    letterSpacing: 0.1,
  },
  notchPill: {
    width: 120,
    height: 32,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconGap: {
    width: 5,
  },

  // Nav row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  iconButton: {
    padding: 4,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#c8c4e8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0EFFA',
  },

  // AI Card
  card: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#6450c8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardLabel: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#1a1a2e',
    letterSpacing: -0.1,
    marginLeft: 10,
  },

  // Toggle
  toggleTrack: {
    width: 58,
    height: 30,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    position: 'relative',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
    position: 'absolute',
    left: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.3,
    position: 'absolute',
    left: 8,
  },
  toggleLabelOff: {
    left: undefined,
    right: 6,
  },
});

export default RPAIAssistantHeader;