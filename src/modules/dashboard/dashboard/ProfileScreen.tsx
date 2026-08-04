// ProfileScreen.tsx
// Route:  Profile (HomeStackParamList)
// API:    GET /v1/auth/user-info  (via getAuthHeaders)
// Deps:   useAuth, useAppTheme, LogoutConfirmationModal, rs, fs

import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Alert, Platform, Linking, Switch,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../ecommerce/navigation/types';
import type { RootStackParamList } from '../../../navigation/RootNavigator';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useAppTheme } from '../../../theme/ThemeContext';
import { getStoredUserName, deleteCustomer, getAuthHeaders, updateProfile } from '../../common/auth/api/AuthAPI';
import { LogoutConfirmationModal } from '../../common/auth/screens/LogoutConfirmationModal';
import { rs, fs } from '../../../utils/responsive';
import axios from 'axios';
import Reward from '../../../assets/product/rewards.svg';

const API_BASE_URL = 'https://rewardplanners.com/api/crm';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

export type ProfileContext = 'dashboard' | 'ecommerce' | 'services' | 'bbps';

const findRootNavigation = (navigation: any): NativeStackNavigationProp<RootStackParamList> => {
  let current = navigation;
  let parent = current?.getParent?.();

  while (parent) {
    current = parent;
    parent = current.getParent?.();
  }

  return current;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Company {
  name: string;
  logo: string;
}

interface EmployeeInfo {
  dateOfJoining: string;   // shown — formatted
  role: string;            // shown — present in response
  date_of_birth: string;   // HIDDEN — personal/sensitive
  department: string;      // shown
}

interface Address {
  addressId: number; type: string; line1: string; line2: string;
  city: string; state: string; country: string; zipcode: string; landmark: string;
}

interface StepsData {
  steps: number; goal_steps: number; progress_percent: number;
}

interface UserInfo {
  userId: number;
  name: string;
  email: string;
  phone: string;
  rewardPoints: number;
  company: Company;
  employeeInfo: EmployeeInfo;
  defaultAddress: Address;
  steps: StepsData;
  thought: string;         // HIDDEN — not rendered
  userImage: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  return phone;
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
};

// ── Component ─────────────────────────────────────────────────────────────────
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const rootNavigation = findRootNavigation(navigation);
  const { isDark: appIsDark, theme: appTheme, toggleTheme } = useAppTheme();
  const profileContext: ProfileContext = route.params?.context ?? 'dashboard';
  const isDashboardProfile = profileContext === 'dashboard';
  const isDark = appIsDark;
  const theme = appTheme;
  const { isAuthenticated, user: authUser, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [displayName, setDisplayName] = useState('User');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const topPadding =
    (insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 50) + 8;

  // ── Fetch user info ──────────────────────────────────────────────────────
  const loadUser = useCallback(async () => {
    if (!isAuthenticated) { setDisplayName('Guest'); setLoading(false); return; }
    try {
      // Seed name from cache while API loads
      if (authUser?.name) setDisplayName(String(authUser.name));
      else {
        const stored = await getStoredUserName();
        if (stored) setDisplayName(stored);
      }

      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const res = await axios.get<{ success: boolean; data: UserInfo }>(
        `${API_BASE_URL}/v1/auth/user-info`,
        { headers }
      );

      if (res.data?.success) {
        setUserInfo(res.data.data);
        setDisplayName(res.data.data.name);
      }
    } catch {
      const fallback = await getStoredUserName();
      setDisplayName(fallback || 'User');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authUser]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useFocusEffect(useCallback(() => { loadUser(); }, [loadUser]));

  // ── Fetch orders ─────────────────────────────────────────────────────────
  // ── Image picker + upload ────────────────────────────────────────────────
  const handlePickImage = useCallback(() => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, async res => {
      const asset = res.assets?.[0];
      if (!asset?.uri) return;

      setAvatarUri(asset.uri);           // optimistic preview
      setImageUploading(true);
      try {
        const formData = new FormData();
        formData.append('user_image', {
          uri: asset.uri,
          type: asset.type ?? 'image/jpeg',
          name: asset.fileName ?? 'profile.jpg',
        } as any);

        const result = await updateProfile(formData);
        if (result?.data?.user_image) {
          setUserInfo(prev =>
            prev ? { ...prev, userImage: result.data.user_image } : prev
          );
        }
      } catch {
        setAvatarUri(null);
        Alert.alert('Upload Failed', 'Could not update profile photo. Please try again.');
      } finally {
        setImageUploading(false);
      }
    });
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  const handleLogoutConfirm = useCallback(async () => {
    try {
      setLogoutLoading(true);
      await logout();
    } finally {
      setLogoutModalVisible(false);
      rootNavigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
    }
  }, [logout, rootNavigation]);

  // ── Delete account ───────────────────────────────────────────────────────
  const handleDeleteAccount = useCallback(() => {
    setDeleteModalVisible(true);
  }, []);

  const handleDeleteAccountConfirm = useCallback(async () => {
    try {
      setDeleteLoading(true);
      const res = await deleteCustomer();
      if (res?.success || res?.status === 'ok' || res?.data) {
        await logout();
        setDeleteModalVisible(false);
        rootNavigation?.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else {
        Alert.alert('Failed', 'Could not delete account. Please try again.');
      }
    } catch {
      Alert.alert('Failed', 'Could not delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  }, [logout, rootNavigation]);

  // ── Rate us ───────────────────────────────────────────────────────────────
  const handleRateUs = useCallback(async () => {
    try {
      await Linking.openURL('market://details?id=com.rewardsplanners');
    } catch {
      await Linking.openURL(
        'https://play.google.com/store/apps/details?id=com.rewardsplanners'
      );
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const emp = userInfo?.employeeInfo;

  // Fields we show from employeeInfo — date_of_birth and role (if null/empty)
  // are explicitly excluded below with conditional rendering
  const showRole = !!emp?.role && emp.role.trim().length > 0;
  const showDepartment = !!emp?.department && emp.department.trim().length > 0;
  const showJoining = !!emp?.dateOfJoining;

  return (
    <LinearGradient
      colors={isDark ? ['#09090B', '#111827', '#151526'] : ['#F8FAFC', '#EEF2FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: rs(56) }}
        bounces
      >
        {/* ════════════════════════════════════
            HERO
        ════════════════════════════════════ */}
        <LinearGradient
          colors={isDark ? ['#09090B', '#111827', '#151526'] : ['#F8FAFC', '#EEF2FF', '#FFFFFF']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: topPadding }]}
        >
          {/* Top bar */}
          <View style={styles.heroBar}>
            <TouchableOpacity style={styles.heroBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </TouchableOpacity>
            <Text style={[styles.heroTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>My Profile</Text>
            <View style={styles.heroBtnGhost} />
          </View>

          <View style={styles.profilePanelWrap}>
          <LinearGradient
            colors={isDark ? ['#18181B', '#27233A', '#312E81'] : ['#111827', '#312E81', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profilePanel}
          >
            <View style={styles.avatarWrap}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} disabled={imageUploading}>
                <View style={styles.avatarRing}>
                  <View style={[styles.avatarInner, { backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]}>
                    {(avatarUri || userInfo?.userImage)
                      ? <Image
                        source={{ uri: (avatarUri || userInfo?.userImage)! }}
                        style={styles.avatarImg}
                      />
                      : <MaterialCommunityIcons name="account-circle" size={76} color="#6366F1" />}

                    {imageUploading && (
                      <View style={styles.avatarUploadOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.camBadge}>
                  <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>
                {displayName}
              </Text>
              {showRole && (
                <Text style={styles.heroRole} numberOfLines={1}>
                  {emp!.role}
                </Text>
              )}

              <View style={styles.heroMetrics}>
                <View style={styles.heroMetricCard}>
                  <View style={styles.heroMetricIcon}>
                    <Reward width={18} height={18} />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={styles.heroMetricValue} numberOfLines={1}>
                      {userInfo?.rewardPoints?.toLocaleString() ?? '0'}
                    </Text>
                    <Text style={styles.heroMetricLabel}>Points</Text>
                  </View>
                </View>

                <View style={styles.heroMetricCard}>
                  {userInfo?.company?.logo ? (
                    <Image source={{ uri: userInfo.company.logo }} style={styles.heroCompanyLogo} resizeMode="contain" />
                  ) : (
                    <View style={styles.heroMetricIcon}>
                      <MaterialCommunityIcons name="office-building-outline" size={16} color="#4F46E5" />
                    </View>
                  )}
                  <View style={styles.flex1}>
                    <Text style={styles.heroMetricValue} numberOfLines={1}>
                      {userInfo?.company?.name ?? 'Company'}
                    </Text>
                    <Text style={styles.heroMetricLabel}>Company</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
          </View>
        </LinearGradient>

        {/* ════════════════════════════════════
            STATS ROW — Reward pts (big) + company logo
        ════════════════════════════════════ */}
        <View style={styles.body}>

          {/* ════════════════════════════════════
              CONTACT INFO
          ════════════════════════════════════ */}
          {isDashboardProfile && (
            <>
              <SectionHead title="User Info" isDark={isDark} />
              <View style={[styles.userInfoCard, cardColor(isDark, theme)]}>
                <InfoGroupTitle title="Contact Info" isDark={isDark} />
                <InfoTableRow
                  icon="phone-outline"
                  label="Mobile"
                  value={formatPhone(userInfo?.phone ?? '')}
                  isDark={isDark}
                  theme={theme}
                />
                <InfoTableRow
                  icon="email-outline"
                  label="Email"
                  value={userInfo?.email ?? ''}
                  isDark={isDark}
                  theme={theme}
                />
                <InfoTableRow
                  icon="identifier"
                  label="User ID"
                  value={`#RP-${String(userInfo?.userId ?? 0).padStart(5, '0')}`}
                  isDark={isDark}
                  theme={theme}
                  badge="Active"
                  last={!showRole && !showDepartment && !showJoining}
                />
                {(showRole || showDepartment || showJoining) && (
                  <InfoGroupTitle title="Work Info" isDark={isDark} />
                )}
                {showRole && (
                  <InfoTableRow
                    icon="briefcase-outline"
                    label="Role"
                    value={emp!.role}
                    isDark={isDark}
                    theme={theme}
                    last={!showDepartment && !showJoining}
                  />
                )}
                {showDepartment && (
                  <InfoTableRow
                    icon="domain"
                    label="Department"
                    value={emp!.department}
                    isDark={isDark}
                    theme={theme}
                    last={!showJoining}
                  />
                )}
                {showJoining && (
                  <InfoTableRow
                    icon="calendar-check-outline"
                    label="Joined"
                    value={formatDate(emp!.dateOfJoining)}
                    isDark={isDark}
                    theme={theme}
                    last
                  />
                )}
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              EMPLOYEE INFO
              — date_of_birth: always hidden
              — role: only if non-empty from API
              — department + dateOfJoining: shown
          ════════════════════════════════════ */}
          {/* ════════════════════════════════════
              DEFAULT ADDRESS
          ════════════════════════════════════ */}
          {(profileContext === 'ecommerce' || profileContext === 'services' || profileContext === 'bbps') && (
            <>
              <SectionHead title={profileContext === 'services' ? 'Services' : 'Shop'} isDark={isDark} />
              <View style={[styles.card, cardColor(isDark, theme)]}>
                {/* My Orders — expandable dropdown */}
                <TouchableOpacity
                  style={[styles.mrow, {
                    borderBottomWidth: profileContext === 'ecommerce' ? 0.5 : 0,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
                  }]}
                  onPress={() => navigation.navigate(
                    (profileContext === 'bbps' ? 'OrderHistory' : 'MyOrder') as any
                  )}
                  activeOpacity={0.7}
                >
                  <View style={[styles.micon, { backgroundColor: isDark ? 'rgba(129,140,248,0.12)' : '#EEF2FF' }]}>
                    <MaterialCommunityIcons name={profileContext === 'services' ? 'briefcase-check-outline' : 'shopping-outline'} size={17} color="#4F46E5" />
                  </View>
                  <View style={styles.flex1}>
                    <Text style={[styles.rowVal, { color: theme.text }]}>My Orders</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
                </TouchableOpacity>

                {profileContext === 'ecommerce' && <AccountRow icon="heart-outline" label="Wishlist" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('WishList' as any)} />}
              </View>
            </>
          )}

          <SectionHead title="Address" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <AccountRow icon="map-marker-outline" label="Saved Addresses" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('AddressSelect', { manageOnly: true } as any)} />
          </View>

          {isDashboardProfile && (
            <>
              <SectionHead title="All Orders" isDark={isDark} />
              <View style={[styles.card, cardColor(isDark, theme)]}>
                <AccountRow
                  icon="clipboard-list-outline"
                  label="All Orders"
                  sub="Products, services, BBPS, and more"
                  isDark={isDark}
                  theme={theme}
                  last
                  onPress={() => rootNavigation.navigate('App', {
                    screen: 'TrackOrders',
                  } as any)}
                />
              </View>
            </>
          )}

          {/* ════════════════════════════════════
              OTHERS / ACCOUNT
          ════════════════════════════════════ */}
          <SectionHead title="Others" isDark={isDark} />
          <View style={[styles.card, cardColor(isDark, theme)]}>
            <DarkModeRow isDark={isDark} theme={theme} onToggle={toggleTheme} />
            <AccountRow icon="file-document-outline" label="Terms & Conditions" isDark={isDark} theme={theme} onPress={() => navigation.navigate('TermsAndConditions' as any)} />
            <AccountRow icon="shield-lock-outline" label="Privacy Policy" isDark={isDark} theme={theme} onPress={() => navigation.navigate('PrivacyPolicy' as any)} />
            <AccountRow icon="star-outline" label="Rate Us" isDark={isDark} theme={theme} onPress={handleRateUs} />
            <AccountRow icon="help-circle-outline" label="Help & Support" isDark={isDark} theme={theme} onPress={() => navigation.navigate('HelpForm' as any)} />
            <AccountRow icon="lock-reset" label="Change Password" isDark={isDark} theme={theme} last onPress={() => navigation.navigate('ChangePassword')} />
          </View>

          <View style={[styles.dangerCard, cardColor(isDark, theme)]}>
            <AccountRow icon="logout" label="Log Out" isDark={isDark} theme={theme} danger onPress={() => setLogoutModalVisible(true)} />
            <AccountRow icon="delete-outline" label="Delete Account" sub="This action cannot be undone" isDark={isDark} theme={theme} danger last onPress={handleDeleteAccount} />
          </View>

          {/* ════════════════════════════════════
              FOOTER — copyright + member since
          ════════════════════════════════════ */}
          <View style={styles.footer}>

            {userInfo?.created_at ? (
              <Text style={[styles.footerMember, { color: theme.secondaryText }]}>
                Member since {formatDate(userInfo.created_at)}
              </Text>
            ) : null}
          </View>

        </View>
      </ScrollView>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        isLoading={logoutLoading}
        isDark={isDark}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutModalVisible(false)}
      />
      <LogoutConfirmationModal
        visible={deleteModalVisible}
        isLoading={deleteLoading}
        isDark={isDark}
        danger
        icon="delete-outline"
        title="Delete Account"
        description="Are you sure you want to permanently delete your account?"
        subText="This action cannot be undone."
        confirmText="Delete Account"
        loadingText="Deleting..."
        onConfirm={handleDeleteAccountConfirm}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </LinearGradient>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionHead = ({ title, isDark, action, onAction }: {
  title: string; isDark: boolean; action?: string; onAction?: () => void;
}) => (
  <View style={styles.secHead}>
    <Text style={[styles.secTitle, { color: isDark ? '#A1A1AA' : '#475569' }]}>
      {title.toUpperCase()}
    </Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.secAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const InfoGroupTitle: React.FC<{ title: string; isDark: boolean }> = ({ title, isDark }) => (
  <View style={[styles.infoGroupTitleWrap, { backgroundColor: isDark ? 'rgba(129,140,248,0.08)' : '#EEF2FF' }]}>
    <Text style={[styles.infoGroupTitle, { color: isDark ? '#C4B5FD' : '#4F46E5' }]}>
      {title}
    </Text>
  </View>
);

interface InfoTableRowProps {
  icon: string;
  label: string;
  value: string;
  isDark: boolean;
  theme: any;
  badge?: string;
  last?: boolean;
}
const InfoTableRow: React.FC<InfoTableRowProps> = ({
  icon, label, value, isDark, theme, badge, last,
}) => (
  <View style={[styles.infoTableRow, !last && {
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
  }]}>
    <View style={styles.infoTableLabelCol}>
      <View style={[styles.infoTableIcon, { backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : '#EEF2FF' }]}>
        <MaterialCommunityIcons name={icon} size={15} color="#6366F1" />
      </View>
      <Text style={[styles.infoTableLabel, { color: theme.secondaryText }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
    <View style={styles.infoTableValueCol}>
      <Text style={[styles.infoTableValue, { color: theme.text }]} numberOfLines={2}>
        {value || '-'}
      </Text>
      {badge ? (
        <View style={styles.badgePurple}>
          <Text style={styles.badgePurpleText}>{badge}</Text>
        </View>
      ) : null}
    </View>
  </View>
);

interface AccountRowProps {
  icon: string; label: string; sub?: string;
  isDark: boolean; theme: any;
  danger?: boolean; last?: boolean; onPress?: () => void;
}
const AccountRow: React.FC<AccountRowProps> = ({
  icon, label, sub, isDark, theme, danger, last, onPress,
}) => (
  <TouchableOpacity
    style={[styles.mrow, !last && {
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
    }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.micon, {
      backgroundColor: danger
        ? (isDark ? 'rgba(239,68,68,0.12)' : '#FFF0F0')
        : (isDark ? 'rgba(129,140,248,0.12)' : '#EEF2FF'),
    }]}>
      <MaterialCommunityIcons name={icon} size={16} color={danger ? '#EF4444' : '#6366F1'} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowVal, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
      {sub ? <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>{sub}</Text> : null}
    </View>
    {!danger && (
      <MaterialCommunityIcons name="chevron-right" size={18} color={isDark ? '#52525B' : '#CBD5E1'} />
    )}
  </TouchableOpacity>
);

const DarkModeRow: React.FC<{ isDark: boolean; theme: any; onToggle: () => void }> = ({
  isDark, theme, onToggle,
}) => (
  <View style={[styles.mrow, {
    borderBottomWidth: 0.5,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.07)',
  }]}>
    <View style={[styles.micon, { backgroundColor: isDark ? 'rgba(129,140,248,0.14)' : '#EEF2FF' }]}>
      <MaterialCommunityIcons
        name={isDark ? 'weather-night' : 'white-balance-sunny'}
        size={18}
        color="#6366F1"
      />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowVal, { color: theme.text }]}>Dark Mode</Text>
      <Text style={[styles.rowLbl, { color: theme.secondaryText }]}>
        {isDark ? 'Dark theme active' : 'Light theme active'}
      </Text>
    </View>
    <Switch
      value={isDark}
      onValueChange={onToggle}
      thumbColor="#FFFFFF"
      trackColor={{ false: '#CBD5E1', true: '#4F46E5' }}
      ios_backgroundColor="#CBD5E1"
    />
  </View>
);

// ── Style helpers ─────────────────────────────────────────────────────────────
const cardColor = (isDark: boolean, _theme: any) => ({
  backgroundColor: isDark ? '#111113' : 'rgba(255,255,255,0.82)',
  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.05)',
  shadowColor: isDark ? '#000' : '#94A3B8',
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Hero ──
  hero: {
    overflow: 'hidden',
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.16)',
  },
  heroBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, elevation: 10 },
  heroTitle: {
    fontSize: fs(16), fontWeight: '800', letterSpacing: 0, paddingHorizontal: rs(20), marginBottom: rs(16),
  },
  heroBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.20)',
    top: -80,
    zIndex: 10,
  },
  heroBtnGhost: {
    width: 38,
    height: 38,
  },

  profilePanelWrap: {
    borderRadius: rs(24),
    backgroundColor: '#4F46E5',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: rs(12) },
    shadowOpacity: 0.22,
    shadowRadius: rs(18),
    elevation: 8,
  },
  profilePanel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(16),
    zIndex: 2,
    borderRadius: rs(24),
    paddingHorizontal: rs(14),
    paddingVertical: rs(16),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  avatarWrap: { alignItems: 'center', zIndex: 2 },
  avatarRing: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#FFFFFF',
    padding: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarInner: { width: '100%', height: '100%', borderRadius: 56, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarUploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 56, alignItems: 'center', justifyContent: 'center' },
  camBadge: { position: 'absolute', bottom: 5, right: 5, width: 28, height: 28, borderRadius: 14, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  heroName: { fontSize: fs(20), fontWeight: '800', letterSpacing: 0, color: '#FFFFFF' },
  heroRole: { fontSize: fs(12), marginTop: 4, fontWeight: '600', color: 'rgba(255,255,255,0.72)' },
  heroMetrics: {
    marginTop: rs(12),
    gap: rs(8),
    marginBottom: 30

  },
  heroMetricCard: {
    minHeight: rs(42),
    borderRadius: rs(14),
    paddingHorizontal: rs(10),
    paddingVertical: rs(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  heroMetricIcon: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(9),
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMetricValue: {
    fontSize: fs(13),
    fontWeight: '800',
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontSize: fs(10),
    marginTop: 1,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  heroCompanyLogo: {
    width: rs(36),
    height: rs(24),
    borderRadius: rs(6),
    backgroundColor: '#FFFFFF',
  },
  // Company bar inside hero

  // ── Stats row — reward pts + company ──

  // ── Body ──
  body: { paddingHorizontal: rs(16), marginTop: rs(16) },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(22), marginBottom: rs(9), marginLeft: rs(10), marginRight: rs(8) },
  secTitle: { fontSize: fs(10), fontWeight: '800', letterSpacing: 0.6 },
  secAction: { fontSize: fs(12), color: '#4F46E5', fontWeight: '800' },

  card: {
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  userInfoCard: {
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.035,
    shadowRadius: 16,
    elevation: 1,
  },
  infoGroupTitleWrap: {
    paddingHorizontal: rs(14),
    paddingVertical: rs(9),
  },
  infoGroupTitle: {
    fontSize: fs(10),
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: rs(58),
    paddingHorizontal: rs(14),
    paddingVertical: rs(10),
    gap: rs(12),
  },
  infoTableLabelCol: {
    width: '38%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
  },
  infoTableIcon: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(9),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoTableLabel: {
    flex: 1,
    fontSize: fs(10),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  infoTableValueCol: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: rs(8),
  },
  infoTableValue: {
    flexShrink: 1,
    fontSize: fs(13),
    lineHeight: fs(18),
    fontWeight: '900',
    letterSpacing: 0,
    textAlign: 'right',
  },
  dangerCard: {
    marginTop: rs(14),
    borderRadius: rs(18),
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.025,
    shadowRadius: 14,
    elevation: 1,
  },
  mrow: { flexDirection: 'row', alignItems: 'center', minHeight: rs(58), paddingHorizontal: rs(14), paddingVertical: rs(10), gap: rs(12) },
  micon: { width: rs(30), height: rs(30), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowLbl: { fontSize: fs(10), marginBottom: 2, fontWeight: '600' },
  rowVal: { fontSize: fs(13), fontWeight: '800', letterSpacing: 0 },

  // Badges
  badgePurple: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgePurpleText: { fontSize: fs(10), fontWeight: '800', color: '#4338CA' },
  badgeGreen: { backgroundColor: '#ECFDF5', borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
  badgeGreenText: { fontSize: fs(10), fontWeight: '800', color: '#047857' },

  flex1: { flex: 1 },
  subRow: { paddingLeft: rs(10) },

  // Footer
  footer: { alignItems: 'center', paddingVertical: rs(28), gap: rs(5) },
  footerCopy: { fontSize: fs(11), fontWeight: '400', textAlign: 'center' },
  footerMember: { fontSize: fs(11), fontWeight: '500', textAlign: 'center' },
});

export default ProfileScreen;
