import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
  ImageBackground,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import HeaderComponent, { type SearchOverlayState } from '../header/HeaderComponent';
import SearchDropdown from '../header/SearchDropdown';
import { useAuth } from '../../common/auth/context/AuthContext';
import { getAuthHeaders } from '../../common/auth/api/AuthAPI';
import axios from 'axios';
import Home_Chart from '../stepcount/Home_Chart';
import ModuleBanner from '../explore/ModuleBanner';
import { rs } from '../../../utils/responsive';
import ServicesModule, { type ExploreServiceTab } from '../explore/ServicesModule';
import RewardsOverview from '../reward/Rewardsoverview';
// import BottomTabs, { TAB_BAR_HEIGHT } from '../../ecommerce/navigation/BottomTabs';
import { useCart } from '../../ecommerce/context/CartContext';
import type { TabKey } from '../../../bottombar/BottomTabs';
import { useAppTheme } from '../../../theme/ThemeContext';
import BottomTabs, { TAB_BAR_HEIGHT } from '../../../bottombar/BottomTabs';
import BirthdayCarousel from '../birthday/BirthdayCarousel';
import type { BirthdayEmployee } from '../birthday/types';
import { useQuery } from '@tanstack/react-query';
import { fetchWalletBalance } from '../../ecommerce/api/WalleteAPI';
import { useDashboardLayout } from '../../common/cms/useDashboardLayout';
import type { MainDashboardSectionKey } from '../../common/cms/dashboardLayout';
import { fetchResolvedZones } from '../../common/cms/cmsContentApi';
import { moduleContentQueryKey } from '../../common/cms/useModuleContent';
import { API_V1_URL, normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import OffersBanner from '../../ecommerce/components/home/OffersBanner';
import InvestmentInsuranceOverview from './InvestmentInsuranceOverview';

const MAIN_DASHBOARD_SECTION_KEYS: readonly MainDashboardSectionKey[] = [
  'header', 'birthdays', 'stepProgress', 'investmentInsurance', 'exploreModules', 'moduleBanner', 'rewardsOverview',
];

// The CMS only stores one solid color per navbar_background entry — turn it
// into a two-stop gradient client-side (rather than needing a second
// gradient-end field added to the backend) by blending it toward black.
const darkenHexColor = (hex: string, amount: number): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;

  const channel = (start: number) =>
    Math.max(0, Math.min(255, Math.round(parseInt(normalized.slice(start, start + 2), 16) * (1 - amount))))
      .toString(16)
      .padStart(2, '0');

  return `#${channel(0)}${channel(2)}${channel(4)}`;
};

const MODULE_ROUTE: Record<ExploreServiceTab, string> = {
  Product: 'ProductModule',
  Services: 'ServicesModule',
  Payments: 'PaymentsModule',
  DineOut: 'DineOutModule',
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
const MemoOffersBanner = memo(OffersBanner);
const MemoInvestmentInsuranceOverview = memo(InvestmentInsuranceOverview);

function Dashbord() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { totalQuantity } = useCart();
  const { isAuthenticated, user } = useAuth();
  const dashboardLayout = useDashboardLayout('main', MAIN_DASHBOARD_SECTION_KEYS);

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
  const { data: walletBalanceResponse } = useQuery({
    queryKey: ['dashboard', 'header-wallet-balance'],
    queryFn: fetchWalletBalance,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const { data: mobileDashboardContent } = useQuery({
    queryKey: moduleContentQueryKey('mobile_dashboard'),
    queryFn: () => fetchResolvedZones('mobile_dashboard'),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  const rewardPoints = Number(walletBalanceResponse?.data?.balance ?? 0);
  const mobileDashboardBackground = mobileDashboardContent?.navbar_background ?? null;
  const mobileDashboardImageUrl =
    mobileDashboardBackground?.content_type === 'image'
      ? mobileDashboardBackground.image_url
      : null;
  const mobileDashboardColor =
    mobileDashboardBackground?.content_type === 'color'
      ? mobileDashboardBackground.color_value
      : null;
  const mobileDashboardTextColor = mobileDashboardBackground?.text_color ?? null;
  const hasMobileDashboardOffers =
    mobileDashboardContent?.offers_banner?.content_type === 'image' &&
    Array.isArray(mobileDashboardContent.offers_banner.images) &&
    mobileDashboardContent.offers_banner.images.some((image) => image.is_active === 1 && image.image_url);

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
        `${API_V1_URL}/auth/user-info`,
        { headers },
      );

      if (userRes.data?.success) {
        const d = userRes.data.data;
        const nextUserImage = normalizeLocalCmsImageUrl(d.userImage);
        const nextCompanyLogo = normalizeLocalCmsImageUrl(d.company?.logo);
        if (d.name)          setHeaderUserName((prev) => (prev === d.name ? prev : d.name));
        if (nextUserImage)   setHeaderUserImage((prev) => (prev === nextUserImage ? prev : nextUserImage));
        if (nextCompanyLogo) setHeaderCompanyLogo((prev) => (prev === nextCompanyLogo ? prev : nextCompanyLogo));
        if (d.thought)       setThought((prev) => (prev === d.thought ? prev : d.thought));

        const apiStepGoal = Number(d.steps?.goal_steps);
        if (Number.isFinite(apiStepGoal) && apiStepGoal > 0) {
          setStepGoal((prev) => (prev === apiStepGoal ? prev : apiStepGoal));
        }

        const raw: any[] = Array.isArray(d.birthday_employees) ? d.birthday_employees : [];
        const mappedBirthdays = raw.map((b) => ({
          id:          b.employeeId,
          name:        b.name,
          designation: b.role,
          department:  b.department,
          photo:       normalizeLocalCmsImageUrl(b.image) ?? null,
        }));
        setBirthdays((prev) => (
          JSON.stringify(prev) === JSON.stringify(mappedBirthdays) ? prev : mappedBirthdays
        ));

        dashboardHeaderCache = {
          userName: d.name || headerUserName,
          userImage: nextUserImage ?? headerUserImage,
          companyLogo: nextCompanyLogo ?? headerCompanyLogo,
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

  // Default (no CMS navbar_background configured for this module) header
  // background — matches the light, near-white reference design. Only used
  // as a fallback: renderHeaderSection still swaps in the CMS-provided
  // image/color first when one is published, so this never overrides
  // dynamic content — it just fixes what shows before any is set.
  const topSectionGradient: string[] = useMemo(
    () => (isDark ? ['#09090B', '#111827', '#18181B'] : ['#F8FAFC', '#FFFFFF', '#F1F5F9']),
    [isDark],
  );

  const rootGradient = isDark
    ? ['#09090B', '#111827', '#151526']
    : ['#F8FAFC', '#FFFFFF', '#F8FAFC'];

  const renderHeaderSection = useCallback((key: string) => {
    // Only override the theme-aware text colors when a CMS background
    // (image or color) is actually active — the default fallback gradient
    // below keeps HeaderComponent's own light/dark text, matching the
    // reference design when no CMS content has been published yet.
    const hasDynamicHeaderBackground = !!(mobileDashboardImageUrl || mobileDashboardColor);
    const headerTextColor = hasDynamicHeaderBackground
      ? mobileDashboardTextColor ?? '#FFFFFF'
      : undefined;

    const headerContent = (
      <>
        <HeaderComponent
          userName={headerUserName}
          userImageUri={headerUserImage ?? undefined}
          companyLogoUri={headerCompanyLogo ?? undefined}
          surface="transparent"
          textColor={headerTextColor}
          dismissSignal={searchDismissSignal}
          onSearchActiveChange={setIsSearchOpen}
          onSearchOverlayChange={setSearchOverlay}
          onSearchSubmit={() => navigation.navigate('GlobalSearchScreen')}
          onNotificationPress={() => navigation.navigate('Notification')}
          showRewardPoints
          rewardPoints={rewardPoints}
        />
      </>
    );

    if (mobileDashboardImageUrl) {
      return (
        <ImageBackground
          key={key}
          source={{ uri: mobileDashboardImageUrl }}
          resizeMode="cover"
          style={styles.topSection}
          imageStyle={styles.topSectionImage}
        >
          <LinearGradient
            colors={isDark ? ['rgba(9,9,11,0.70)', 'rgba(17,24,39,0.54)'] : ['rgba(17,24,39,0.56)', 'rgba(49,46,129,0.36)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {headerContent}
        </ImageBackground>
      );
    }

    if (mobileDashboardColor) {
      return (
        <LinearGradient
          key={key}
          colors={[mobileDashboardColor, darkenHexColor(mobileDashboardColor, 0.28)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.topSection}
        >
          {headerContent}
        </LinearGradient>
      );
    }

    return (
      <LinearGradient key={key} colors={topSectionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topSection}>
        {headerContent}
      </LinearGradient>
    );
  }, [
    headerCompanyLogo,
    headerUserImage,
    headerUserName,
    isDark,
    mobileDashboardColor,
    mobileDashboardImageUrl,
    mobileDashboardTextColor,
    navigation,
    rewardPoints,
    searchDismissSignal,
    topSectionGradient,
  ]);

  return (
    <LinearGradient
      colors={rootGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      {/* Fixed — stays pinned above the scrollable sections below, rather
          than scrolling away with the rest of the dashboard content. */}
      {renderHeaderSection('header')}

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
        {dashboardLayout.sections.map(({ key }) => {
          switch (key as MainDashboardSectionKey) {
            case 'header':
              // Rendered fixed above the ScrollView instead — skip here.
              return null;
            case 'birthdays':
              return hasBirthdays ? <Pressable key={key} onPress={dismissSearch}><MemoBirthdayCarousel birthdays={birthdays} /></Pressable> : null;
            case 'stepProgress':
              return <Pressable key={key} onPress={dismissSearch}><MemoHomeChart goalSteps={stepGoal} /></Pressable>;
            case 'investmentInsurance':
              return <Pressable key={key} onPress={dismissSearch}><MemoInvestmentInsuranceOverview /></Pressable>;
            case 'exploreModules':
              return <Pressable key={key} onPress={dismissSearch}><MemoServicesModule onModulePress={handleExploreModulePress} /></Pressable>;
            case 'moduleBanner':
              return hasMobileDashboardOffers ? (
                <MemoOffersBanner
                  key={key}
                  module="mobile_dashboard"
                  moduleContent={mobileDashboardContent}
                  aspectRatio={2.55}
                  resizeMode="cover"
                  wrapperStyle={styles.dashboardOffers}
                />
              ) : (
                <MemoModuleBanner key={key} />
              );
            case 'rewardsOverview':
              return <Pressable key={key} onPress={dismissSearch}><MemoRewardsOverview /></Pressable>;
            default:
              return null;
          }
        })}
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


  topSection: {
    paddingBottom: rs(16),
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
    overflow: 'hidden',
    zIndex: 20,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: rs(12) },
    shadowOpacity: Platform.OS === 'ios' ? 0.16 : 0.22,
    shadowRadius: rs(18),
    elevation: 8,
  },
  topSectionImage: {
    borderBottomLeftRadius: rs(30),
    borderBottomRightRadius: rs(30),
  },

  dashboardOffers: {
    paddingTop: rs(12),
    paddingBottom: rs(8),
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

  moduleLaunchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 500,
    elevation: 50,
    padding: rs(18),
    paddingTop: rs(90),
  },
  moduleLaunchLineWide: {
    width: '58%',
    height: rs(18),
    borderRadius: rs(9),
    marginBottom: rs(12),
  },
  moduleLaunchLine: {
    width: '34%',
    height: rs(12),
    borderRadius: rs(6),
    marginBottom: rs(22),
  },
  moduleLaunchCard: {
    width: '100%',
    height: rs(210),
    borderRadius: rs(18),
  },
});
