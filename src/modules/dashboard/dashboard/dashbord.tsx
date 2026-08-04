import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
import ServicesModule, { type ExploreServiceTab } from '../explore/ServicesModule';
import RewardsOverview from '../reward/Rewardsoverview';
// import BottomTabs, { TAB_BAR_HEIGHT } from '../../ecommerce/navigation/BottomTabs';
import { useCart } from '../../ecommerce/context/CartContext';
import type { TabKey } from '../../../bottombar/BottomTabs';
import { useAppTheme } from '../../../theme/ThemeContext';
import BottomTabs, { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import BirthdayCarousel from '../birthday/BirthdayCarousel';
import type { BirthdayEmployee } from '../birthday/types';

const MODULE_ROUTE: Record<ExploreServiceTab, string> = {
  Product: 'ProductModule',
  Services: 'ServicesModule',
  Payments: 'PaymentsModule',
  DineOut: 'DineOutModule',
};

const MODULE_LAUNCH_COLOR: Record<ExploreServiceTab, string> = {
  Product: '#5F341A',
  Services: '#4F6BFF',
  Payments: '#7C3AED',
  DineOut: '#DC2626',
};

type DashboardHeaderCache = {
  userName: string;
  userImage: string | null;
  companyLogo: string | null;
  thought: string;
  stepGoal: number;
  birthdays: BirthdayEmployee[];
  fetchedAt: number;
};

const DASHBOARD_HEADER_CACHE_TTL_MS = 10 * 60 * 1000;
let dashboardHeaderCache: DashboardHeaderCache | null = null;

const MemoHomeChart = memo(Home_Chart);
const MemoServicesModule = memo(ServicesModule);
const MemoModuleBanner = memo(ModuleBanner);
const MemoRewardsOverview = memo(RewardsOverview);
const MemoBirthdayCarousel = memo(BirthdayCarousel);

function Dashbord() {
  const { isDark } = useAppTheme();
  const iconSize = rs(26);
  const navigation = useNavigation<any>();
  const { totalQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [headerUserName, setHeaderUserName] = useState<string>(
    () => dashboardHeaderCache?.userName ?? user?.name ?? 'User',
  );
  const [headerUserImage, setHeaderUserImage] = useState<string | null>(
    () => dashboardHeaderCache?.userImage ?? null,
  );
  const [headerCompanyLogo, setHeaderCompanyLogo] = useState<string | null>(
    () => dashboardHeaderCache?.companyLogo ?? null,
  );
  const [thought, setThought] = useState<string>(() => dashboardHeaderCache?.thought ?? '');
  const [stepGoal, setStepGoal] = useState<number>(() => {
    if (dashboardHeaderCache?.stepGoal) return dashboardHeaderCache.stepGoal;
    const initialGoal = Number((user as any)?.steps?.goal_steps);
    return Number.isFinite(initialGoal) && initialGoal > 0 ? initialGoal : 5000;
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchOverlay, setSearchOverlay] = useState<SearchOverlayState | null>(null);
  const [searchDismissSignal, setSearchDismissSignal] = useState(0);
  const [birthdays, setBirthdays] = useState<BirthdayEmployee[]>(
    () => dashboardHeaderCache?.birthdays ?? [],
  );
  const [openingModule, setOpeningModule] = useState<ExploreServiceTab | null>(null);
  const hasBirthdays = birthdays.length > 0;

  const loadHeaderInfo = useCallback(async () => {
    if (!isAuthenticated) return;

    if (
      dashboardHeaderCache &&
      Date.now() - dashboardHeaderCache.fetchedAt < DASHBOARD_HEADER_CACHE_TTL_MS
    ) {
      setHeaderUserName(dashboardHeaderCache.userName);
      setHeaderUserImage(dashboardHeaderCache.userImage);
      setHeaderCompanyLogo(dashboardHeaderCache.companyLogo);
      setThought(dashboardHeaderCache.thought);
      setStepGoal(dashboardHeaderCache.stepGoal);
      setBirthdays(dashboardHeaderCache.birthdays);
      return;
    }

    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const userRes = await axios.get<{ success: boolean; data: any }>(
        'https://rewardplanners.com/api/crm/v1/auth/user-info',
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        if (d.name) setHeaderUserName((prev) => (prev === d.name ? prev : d.name));
        if (d.userImage) setHeaderUserImage((prev) => (prev === d.userImage ? prev : d.userImage));
        if (d.company?.logo) setHeaderCompanyLogo((prev) => (prev === d.company.logo ? prev : d.company.logo));
        if (d.thought) setThought((prev) => (prev === d.thought ? prev : d.thought));

        const apiStepGoal = Number(d.steps?.goal_steps);
        if (Number.isFinite(apiStepGoal) && apiStepGoal > 0) {
          setStepGoal((prev) => (prev === apiStepGoal ? prev : apiStepGoal));
        }

        const raw: any[] = Array.isArray(d.birthday_employees) ? d.birthday_employees : [];
        const mappedBirthdays = raw.map((b) => ({
          id: b.employeeId,
          name: b.name,
          designation: b.role,
          department: b.department,
          photo: b.image ?? null,
        }));
        setBirthdays((prev) => (
          JSON.stringify(prev) === JSON.stringify(mappedBirthdays) ? prev : mappedBirthdays
        ));

        dashboardHeaderCache = {
          userName: d.name || headerUserName,
          userImage: d.userImage ?? headerUserImage,
          companyLogo: d.company?.logo ?? headerCompanyLogo,
          thought: d.thought ?? thought,
          stepGoal:
            Number.isFinite(Number(d.steps?.goal_steps)) && Number(d.steps?.goal_steps) > 0
              ? Number(d.steps.goal_steps)
              : stepGoal,
          birthdays: mappedBirthdays,
          fetchedAt: Date.now(),
        };
      }
    } catch { }
  }, [headerCompanyLogo, headerUserImage, headerUserName, isAuthenticated, stepGoal, thought]);

  // Warm the ecommerce route shortly after the first dashboard paint. A timer
  // is intentional here: InteractionManager may never become idle while the
  // dashboard has looping animations, leaving the first Product tap cold.
  useEffect(() => {
    const ecommerceWarmupTimer = setTimeout(() => {
      require('../../ecommerce/navigation/HomeStack');
      require('../../ecommerce/screens/homescreen');

      const { prefetchCategoriesSection } = require('../../ecommerce/components/home/categories_section');
      const { prefetchBestSellerSection } = require('../../ecommerce/components/Promotion/BestSeller');
      const { prefetchTopRatedSection } = require('../../ecommerce/components/Promotion/TopRated');

      Promise.allSettled([
        prefetchCategoriesSection(),
        prefetchBestSellerSection(),
        prefetchTopRatedSection(),
      ]).catch(() => {
        // Navigation must remain available even if background warmup fails.
      });
    }, 350);

    const remainingModulesWarmupTimer = setTimeout(() => {
      require('../../services/navigation/ServiceHomeStack');
      require('../../services/component/screens/HomeScreen');
      require('../../bbps/navigation/BBPSHomeStack');
      require('../../bbps/screen/HomePage');
      require('../../step_counter/navigation/RewardHomeStack');
      require('../../step_counter/component/fitness/StepWelcome');
      require('../../ecommerce/constants/ComingSoon');
    }, 900);

    return () => {
      clearTimeout(ecommerceWarmupTimer);
      clearTimeout(remainingModulesWarmupTimer);
    };
  }, []);

  useFocusEffect(useCallback(() => {
    setOpeningModule(null);
    loadHeaderInfo();
  }, [loadHeaderInfo]));

  const handleExploreModulePress = useCallback((tab: ExploreServiceTab) => {
    setOpeningModule(tab);

    // Let the lightweight module shell paint before mounting the destination.
    requestAnimationFrame(() => {
      setTimeout(() => {
        navigation.navigate('Home', {
          screen: MODULE_ROUTE[tab],
          params: { moduleName: tab },
          moduleName: tab,
        });
      }, 0);
    });
  }, [navigation]);

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
          navigation.navigate('Profile', { context: 'dashboard' });
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
    card: {},
    cardWrap: { shadowColor: isDark ? '#000000' : '#312E81', backgroundColor: isDark ? '#18181B' : '#4338CA' },
  }), [isDark]);

  return (
    <LinearGradient
      colors={rootGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: rs(32) + TAB_BAR_HEIGHT }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isSearchOpen}
        onScrollBeginDrag={dismissSearch}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        bounces
      >
        <View style={styles.topSectionWrap}>
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
            onNotificationPress={() => navigation.navigate('Notification')}
          />

          {/* Motivational Quote Banner */}
          <Pressable onPress={dismissSearch}>
            <View style={[styles.bannerOuter, { paddingHorizontal: rs(16), paddingTop: rs(2) }]}>
              <View style={[styles.cardWrap, t.cardWrap]}>
              <LinearGradient
                colors={quoteBannerGradient}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={[styles.card, t.card]}
              >
                <LinearGradient
                  colors={[
                    'rgba(255,255,255,0)',
                    'rgba(255,255,255,0.035)',
                    'rgba(255,255,255,0.10)',
                  ]}
                  locations={[0, 0.58, 1]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.quoteHighlight}
                  pointerEvents="none"
                />

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
            </View>
          </Pressable>
        </LinearGradient>
        </View>
        {hasBirthdays && (
          <Pressable onPress={dismissSearch}>
            <MemoBirthdayCarousel birthdays={birthdays} />
          </Pressable>
        )}
        <Pressable onPress={dismissSearch}>
          <MemoHomeChart goalSteps={stepGoal} />
          <MemoServicesModule onModulePress={handleExploreModulePress} />
          <MemoModuleBanner />
          <MemoRewardsOverview />
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
      {openingModule && (
        <View
          style={[
            styles.moduleLaunchOverlay,
            { backgroundColor: MODULE_LAUNCH_COLOR[openingModule] },
          ]}
        >
          <Text style={styles.moduleLaunchTitle}>{openingModule}</Text>
          <View
            style={[
              styles.moduleLaunchContent,
              { backgroundColor: isDark ? '#09090B' : '#F8FAFC' },
            ]}
          >
            <View
              style={[
                styles.moduleLaunchLineWide,
                { backgroundColor: isDark ? '#27272A' : '#E2E8F0' },
              ]}
            />
            <View
              style={[
                styles.moduleLaunchLine,
                { backgroundColor: isDark ? '#27272A' : '#E2E8F0' },
              ]}
            />
            <View
              style={[
                styles.moduleLaunchCard,
                { backgroundColor: isDark ? '#18181B' : '#E2E8F0' },
              ]}
            />
          </View>
        </View>
      )}
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

  topSectionWrap: {
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    zIndex: 20,
    backgroundColor: '#312E81',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: rs(12) },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.22,
    shadowRadius: rs(18),
    elevation: 8,
  },
  topSection: {
    paddingBottom: rs(16),
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    zIndex: 20,
  },

  bannerOuter: {
    // paddingHorizontal and paddingTop set inline
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  cardWrap: {
    borderRadius: rs(20),
    marginBottom: 20,
    // shadowColor via t.cardWrap
    shadowOffset: { width: 0, height: rs(10) },
    shadowOpacity: Platform.OS === 'ios' ? 0.18 : 0.24,
    shadowRadius: rs(18),
    elevation: 8,
  },
  card: {
    borderRadius: rs(20),
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
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

  moduleLaunchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 300,
    elevation: 40,
    justifyContent: 'flex-start',
    paddingTop: rs(80),
    paddingHorizontal: rs(20),
  },
  moduleLaunchTitle: {
    color: '#fff',
    fontSize: fs(22),
    fontWeight: '800',
    marginBottom: rs(20),
  },
  moduleLaunchContent: {
    borderRadius: rs(16),
    padding: rs(16),
    gap: rs(12),
  },
  moduleLaunchLineWide: {
    height: rs(14),
    borderRadius: rs(7),
    width: '80%',
  },
  moduleLaunchLine: {
    height: rs(14),
    borderRadius: rs(7),
    width: '55%',
  },
  moduleLaunchCard: {
    height: rs(120),
    borderRadius: rs(16),
    marginTop: rs(8),
  },
});