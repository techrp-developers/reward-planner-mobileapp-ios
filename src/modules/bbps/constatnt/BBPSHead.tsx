import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBbpsTheme } from '../utils/useBbpsTheme';

interface UserInfo {
  name: string;
  number: string;
  operatorLogo?: any; // Optional asset for provider logo
  operatorInitial?: string;
  type: string; // e.g., "Prepaid"
}

interface Props {
  title?: string;
  user?: UserInfo; // New optional prop for the profile header
  onBackPress: () => void;
  onHelpPress?: () => void;
  onChangePress?: () => void; // For the "Change" link
}

const GRAD_H = { x: 0, y: 0 };
const GRAD_H_END = { x: 1, y: 0 };
const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const IOS_FALLBACK_TOP = 44;

const BBPSHead: React.FC<Props> = ({ title, user, onBackPress, onHelpPress, onChangePress }) => {
  const navigation = useNavigation<any>();
  const bbpsTheme = useBbpsTheme();
  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;
  const operatorInitial = user?.operatorInitial?.trim()?.charAt(0)?.toUpperCase() || 'O';

  const handleHelpPress = useCallback(() => {
    onHelpPress?.();
    navigation.navigate('HelpForm');
  }, [onHelpPress, navigation]);

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: bbpsTheme.colors.surface,
          paddingTop: Math.max(12, safeTop + 8),
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.leftSection}>
          <TouchableOpacity onPress={onBackPress} style={styles.backButton} activeOpacity={0.7}>
            <MaterialIcons name="chevron-left" size={32} color={bbpsTheme.colors.text} />
          </TouchableOpacity>

          {/* Conditional Rendering: Profile vs Standard Title */}
          {user ? (
            <View style={styles.profileSection}>
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: bbpsTheme.colors.iconBg,
                    borderColor: bbpsTheme.colors.borderSoft,
                  },
                ]}
              >
                {user.operatorLogo ? (
                  <Image source={user.operatorLogo} style={styles.operatorLogo} resizeMode="contain" />
                ) : (
                  <LinearGradient
                    colors={bbpsTheme.gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.operatorInitialCircle}
                  >
                    <Text style={styles.operatorInitialText}>{operatorInitial}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userNameText, { color: bbpsTheme.colors.text }]} numberOfLines={1}>
                  {user.name} - {user.number}
                </Text>
                <View style={styles.typeRow}>
                  <Text style={[styles.typeText, { color: bbpsTheme.colors.muted }]}>{user.type} - </Text>
                  <TouchableOpacity onPress={onChangePress}>
                    <Text style={[styles.changeText, { color: bbpsTheme.colors.primary }]}>Change</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <Text style={[styles.headerTitleText, { color: bbpsTheme.colors.textStrong }]} numberOfLines={1}>
              {title}
            </Text>
          )}
        </View>

        {/* Right Section: Help Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleHelpPress}
          style={[
            styles.helpButtonWrap,
            {
              borderColor: bbpsTheme.colors.primary,
              backgroundColor: bbpsTheme.colors.surface,
            },
          ]}
        >
          <View style={styles.helpInnerContainer}>
            <MaterialIcons name="chat-bubble-outline" size={18} color={bbpsTheme.colors.primary} />
            <Text style={[styles.helpText, { color: bbpsTheme.colors.primary }]}>Help</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={[styles.divider, { backgroundColor: bbpsTheme.colors.divider }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  // ... your existing styles ...
  headerContainer: { backgroundColor: '#FFFFFF', paddingTop: 12 },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: 12 },
  backButton: { marginRight: 8, paddingVertical: 4 },
  headerTitleText: { fontSize: 18, fontWeight: '700', color: '#111827' },

  // Profile specific styles
  profileSection: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  logoContainer: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  operatorLogo: { width: 28, height: 28 },
  operatorInitialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorInitialText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  userInfo: { marginLeft: 12, flex: 1, minWidth: 0 },
  userNameText: { fontSize: 16, fontWeight: '700', color: '#374151', flexShrink: 1 },
  typeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  typeText: { fontSize: 14, color: '#6B7280' },
  changeText: { fontSize: 14, color: '#8665FF', fontWeight: '600' },

  // Help button styles
  helpButtonWrap: {
    flexShrink: 0,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  helpInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  divider: { height: 1, backgroundColor: '#F3F4F6' },
});

export default BBPSHead;
