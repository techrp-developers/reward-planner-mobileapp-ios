import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import HeaderComponent, { type SearchOverlayState } from '../header/HeaderComponent';
import SearchDropdown from '../header/SearchDropdown';
import { useAuth } from '../../common/auth/context/AuthContext';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import axios from 'axios';
import Home_Chart from '../stepcount/Home_Chart';
import ModuleBanner from '../explore/ModuleBanner';
import { rs, fs } from '../../../utils/responsive';
import ServicesModule from '../explore/ServicesModule';
import RewardsOverview from '../reward/Rewardsoverview';
// import BottomTabs, { TAB_BAR_HEIGHT } from '../../ecommerce/navigation/BottomTabs';
import { useCart } from '../../ecommerce/context/CartContext';
import type { TabKey } from '../../../bottombar/BottomTabs';
import { useAppTheme } from '../../../theme/ThemeContext';
import BottomTabs, { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import BirthdayCarousel from '../birthday/BirthdayCarousel';
import type { BirthdayEmployee } from '../birthday/types';


function Dashbord() {
  const { isDark } = useAppTheme();
  const iconSize = rs(26);
  const navigation = useNavigation<any>();
  const { totalQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [headerUserName, setHeaderUserName] = useState<string>(user?.name ?? 'User');
  const [headerUserImage, setHeaderUserImage] = useState<string | null>(null);
  const [headerCompanyLogo, setHeaderCompanyLogo] = useState<string | null>(null);
  const [thought, setThought] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayState | null>(null);
  const [searchDismissSignal, setSearchDismissSignal] = useState(0);
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>([]);
  const hasBirthdays = birthdays.length > 0;

  const loadHeaderInfo = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const userRes = await axios.get<{ success: boolean; data: any }>(
        'https://rewardplanners.com/api/crm/v1/auth/user-info',
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        if (d.name) setHeaderUserName(d.name);
        if (d.userImage) setHeaderUserImage(d.userImage);
        if (d.company?.logo) setHeaderCompanyLogo(d.company.logo);
        if (d.thought) setThought(d.thought);

        const raw: any[] = Array.isArray(d.birthday_employees) ? d.birthday_employees : [];
        setBirthdays(raw.map((b) => ({
          id: b.employeeId,
          name: b.name,
          designation: b.role,
          department: b.department,
          photo: b.image ?? null,
        })));
      }
    } catch { }
  }, [isAuthenticated]);

  useEffect(() => { loadHeaderInfo(); }, [loadHeaderInfo]);

  useFocusEffect(useCallback(() => { loadHeaderInfo(); }, [loadHeaderInfo]));

  const handleTabPress = useCallback(
    (tab: TabKey) => {
      switch (tab) {
        case 'Notes':
          navigation.navigate('TodoList');
          break;
        case 'Cart':
          navigation.navigate('Cart');
          break;
        case 'Search':
          navigation.navigate('GlobalSearchScreen');
          break;
        case 'Profile':
          navigation.navigate('Profile');
          break;
        // 'Home' is Dashboard itself — already here, no-op
      }
    },
    [navigation],
  );

  const handleCenterPress = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  const dismissSearch = useCallback(() => {
    if (!isSearchOpen) return;
    setSearchDismissSignal((value) => value + 1);
  }, [isSearchOpen]);

  const quoteBannerGradient: string[] = isDark
    ? ['#18181B', '#27233A', '#4338CA']
    : ['#111827', '#312E81', '#4F46E5'];

  const topSectionGradient: string[] = isDark
    ? ['#09090B', '#111827', '#18181B']
    : ['#111827', '#1E1B4B', '#312E81'];

  const rootGradient = isDark
    ? ['#09090B', '#111827', '#151526']
    : ['#F8FAFC', '#EEF2FF', '#FFFFFF'];

  const t = useMemo(() => StyleSheet.create({
    iconContainer: { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.16)' },
    card: { shadowColor: isDark ? '#000000' : '#312E81' },
  }), [isDark]);

  return (
    <LinearGradient
      colors={rootGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      {/* Fixed sticky top section */}
      <LinearGradient
        colors={topSectionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topSection}
      >
        <HeaderComponent
          userName={headerUserName}
          userImageUri={headerUserImage ?? undefined}
          companyLogoUri={headerCompanyLogo ?? undefined}
          surface="transparent"
          dismissSignal={searchDismissSignal}
          onSearchActiveChange={setIsSearchOpen}
          onSearchOverlayChange={setSearchOverlay}
          onSearchSubmit={() => navigation.navigate('GlobalSearchScreen')}
        />

        {/* Motivational Quote Banner */}
        <Pressable onPress={dismissSearch}>
          <View style={[styles.bannerOuter, { paddingHorizontal: rs(16), paddingTop: rs(2) }]}>
            <LinearGradient
              colors={quoteBannerGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.card, t.card]}
            >
              <View style={styles.quoteHighlight} />

              <View style={[styles.iconContainer, t.iconContainer]}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={iconSize}
                  color={isDark ? '#FFFFFF' : '#9B3DD8'}
                />
              </View>

              <Text style={styles.quote}>
                {thought
                  ? `"${thought}"`
                  : '"Success is the sum of small efforts,\nrepeated day in and day out."'}
              </Text>
            </LinearGradient>
          </View>
        </Pressable>
      </LinearGradient>

      {/* Scrollable content below */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(32) + TAB_BAR_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSearchOpen}
        onScrollBeginDrag={dismissSearch}
        keyboardShouldPersistTaps="handled"
        bounces
      >
        {hasBirthdays && (
          <Pressable onPress={dismissSearch}>
            <BirthdayCarousel birthdays={birthdays} />
          </Pressable>
        )}
        <Pressable onPress={dismissSearch}>
          <Home_Chart />
          <ServicesModule />
          <ModuleBanner />
          <RewardsOverview />
        </Pressable>
      </ScrollView>

      {searchOverlay?.visible && (
        <View style={styles.searchOverlay} pointerEvents="box-none">
          <Pressable
            style={[styles.searchDismissLayer, { top: searchOverlay.top }]}
            onPress={searchOverlay.onClose}
          />
          <View style={[styles.searchDropdownOverlay, { top: searchOverlay.top }]}>
            <SearchDropdown
              query={searchOverlay.query}
              results={searchOverlay.results}
              loading={searchOverlay.loading}
              isEmpty={searchOverlay.isEmpty}
              onClose={searchOverlay.onClose}
            />
          </View>
        </View>
      )}

      <BottomTabs
        isDashboard
        activeTabKey="Home"
        cartCount={totalQuantity}
        onTabPress={handleTabPress}
        onCenterPress={handleCenterPress}
      />
      {/* <FloatingBottomBar/> */}
    </LinearGradient>
  );
}

export default Dashbord;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // backgroundColor via t.root
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    // paddingBottom set inline so it scales with rs() and TAB_BAR_HEIGHT
  },

  topSection: {
    paddingBottom: rs(16),
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    zIndex: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: rs(12) },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.22,
    shadowRadius: rs(18),
    elevation: 8,
  },

  bannerOuter: {
    // paddingHorizontal and paddingTop set inline
  },
  searchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 250,
    elevation: 30,
  },
  searchDismissLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  searchDropdownOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 260,
    elevation: 32,
  },

  card: {
    borderRadius: rs(20),

    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    // shadowColor via t.card
    shadowOffset: { width: 0, height: rs(10) },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.24,
    shadowRadius: rs(18),
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  quoteHighlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: rs(92),
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  iconContainer: {
    width: rs(48),
    height: rs(48),
    borderRadius: rs(14),
    // backgroundColor via t.iconContainer
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: rs(13),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    margin: 4,
  },

  quote: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: fs(13.5),
    lineHeight: rs(20),
    fontStyle: 'italic',
    fontWeight: '600',
    letterSpacing: 0,
    paddingVertical: rs(13),
    paddingHorizontal: rs(14),
  },
});
