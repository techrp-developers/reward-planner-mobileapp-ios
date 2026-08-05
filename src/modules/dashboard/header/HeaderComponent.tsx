import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  Animated,
  type ImageStyle,
  type LayoutChangeEvent,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import Logo from '../../../assets/menu/logo.png';
import { useGlobalSearch } from './useGlobalSearch';
import type { SearchData } from '../api/GlobalSearchAPI';

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const IOS_FALLBACK_TOP   = 50;

export type SearchOverlayState = {
  visible: boolean;
  top: number;
  query: string;
  results: SearchData | null;
  loading: boolean;
  isEmpty: boolean;
  onClose: () => void;
};

// ── Types ────────────────────────────────────────────────────────────────────

interface HeaderProps {
  userName?:              string;
  userImageUri?:          string;
  companyLogoUri?:        string;
  surface?:               'solid' | 'transparent';
  dismissSignal?:         number;
  notificationBadge?:     number;
  onNotificationPress?:   () => void;
  onAIToggle?:            (value: boolean) => void;
  onSearchSubmit?:        (query: string) => void;
  onSearchActiveChange?:  (active: boolean) => void;
  onSearchDropdownChange?: (active: boolean) => void;
  onSearchOverlayChange?: (state: SearchOverlayState) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

const HeaderComponent: React.FC<HeaderProps> = ({
  userName = 'User',
  userImageUri,
  companyLogoUri,
  surface = 'solid',
  dismissSignal = 0,
  notificationBadge = 0,
  onNotificationPress,
  onSearchSubmit,
  onSearchActiveChange,
  onSearchDropdownChange,
  onSearchOverlayChange,
}) => {
  const { isDark }   = useAppTheme();
  const navigation   = useNavigation<any>();
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);

  // All animations use native driver (opacity + transform only)
  const dateFade    = useRef(new Animated.Value(1)).current;
  const searchFade  = useRef(new Animated.Value(0)).current;
  const searchSlide = useRef(new Animated.Value(28)).current;
  const searchScale = useRef(new Animated.Value(0.94)).current;
  const searchSweep = useRef(new Animated.Value(0)).current;
  const lastDismissSignal = useRef(dismissSignal);
  const inputRef    = useRef<TextInput>(null);

  const insets  = useSafeAreaInsets();
  const safeTop = insets.top > 0
    ? insets.top
    : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;

  // ── Global search hook ────────────────────────────────────────────────────

  const { results, loading, isEmpty, reset } = useGlobalSearch(searchQuery);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const tk = useMemo(() => ({
    headerBg:         surface === 'transparent' ? 'transparent' : '#111827',
    helloColor:       isDark ? '#A1A1AA' : '#C7D2FE',
    nameColor:        '#FFFFFF',
    logoPillBg:       'rgba(255,255,255,0.92)',
    avatarRingBg:     isDark ? 'rgba(79,70,229,0.22)'  : 'rgba(255,255,255,0.18)',
    dateColor:        isDark ? '#C7D2FE'  : '#E0E7FF',
    iconBg:           isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.16)',
    iconTint:         '#FFFFFF',
    searchBg:         '#09090B',
    searchBorder:     isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.22)',
    searchTextColor:  '#FFFFFF',
    placeholderColor: isDark ? '#A1A1AA'  : '#C7D2FE',
  }), [isDark, surface]);

  const formattedDate = useMemo(() => {
    const n = new Date();
    const D = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${D[n.getDay()]}, ${n.getDate()} ${M[n.getMonth()]}`;
  }, []);

  // ── Layout measurement — drives dropdown top position ─────────────────────

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const nextHeight = e.nativeEvent.layout.height;
    setHeaderHeight((prev) => (Math.abs(prev - nextHeight) < 1 ? prev : nextHeight));
  }, []);

  // ── Search animation ──────────────────────────────────────────────────────

  const openSearch = useCallback(() => {
    setSearchActive(true);
    onSearchActiveChange?.(true);
    searchSweep.stopAnimation();
    searchSweep.setValue(0);
    Animated.timing(searchSweep, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start();
    Animated.parallel([
      Animated.timing(dateFade,    { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(searchFade,  { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(searchSlide, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.spring(searchScale, { toValue: 1, useNativeDriver: true, tension: 90, friction: 10 }),
    ]).start(() => inputRef.current?.focus());
  }, [dateFade, searchFade, searchSlide, searchScale, searchSweep, onSearchActiveChange]);

  const closeSearch = useCallback(() => {
    if (!searchActive) return;
    inputRef.current?.blur();
    searchSweep.stopAnimation();
    onSearchActiveChange?.(false);
    Animated.parallel([
      Animated.timing(dateFade,    { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(searchFade,  { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(searchSlide, { toValue: 28, duration: 200, useNativeDriver: true }),
      Animated.timing(searchScale, { toValue: 0.94, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setSearchActive(false);
      setSearchQuery('');
      reset();
    });
  }, [dateFade, searchActive, searchFade, searchSlide, searchScale, searchSweep, reset, onSearchActiveChange]);

  useEffect(() => {
    onSearchDropdownChange?.(showDropdown);
    onSearchOverlayChange?.({
      visible: showDropdown && headerHeight > 0,
      top: headerHeight,
      query: searchQuery,
      results,
      loading,
      isEmpty,
      onClose: closeSearch,
    });
  }, [
    closeSearch,
    headerHeight,
    isEmpty,
    loading,
    onSearchDropdownChange,
    onSearchOverlayChange,
    results,
    searchQuery,
    showDropdown,
  ]);

  useEffect(() => {
    if (dismissSignal !== lastDismissSignal.current) {
      lastDismissSignal.current = dismissSignal;
      closeSearch();
    }
  }, [dismissSignal, closeSearch]);

  const handleQueryChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSubmit = useCallback(() => {
    const q = searchQuery.trim();
    if (!q) return;
    closeSearch();
    // Navigation on submit is the caller's decision (GlobalSearchScreen keeps
    // results inline; Dashboard navigates to GlobalSearchScreen) — don't
    // force a route here, or it fights with onSearchSubmit's own behavior.
    onSearchSubmit?.(q);
  }, [searchQuery, closeSearch, onSearchSubmit]);

  const sweepTranslateX = searchSweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-90, 360],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer wrapper: creates a stacking context so the dropdown overlays
    // dashboard content below without affecting the layout flow.
    <View style={styles.wrapper}>

      <View
        style={[styles.headerSurface, { backgroundColor: tk.headerBg, paddingTop: safeTop + 10 }]}
        onLayout={handleHeaderLayout}
      >
        {/* ── Row 1 : Avatar | Greeting | Logo ── */}
        <View style={styles.topRow}>

          <TouchableOpacity
            onPress={() => navigation.navigate('Profile', { context: 'dashboard' })}
            activeOpacity={0.8}
          >
            <View style={[styles.avatarRing, { backgroundColor: tk.avatarRingBg }]}>
              {userImageUri ? (
                <Image
                  source={{ uri: userImageUri }}
                  style={styles.avatarImg as ImageStyle}
                  resizeMode="cover"
                />
              ) : (
                <MaterialCommunityIcons name="account-circle" size={32} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.greetWrap}>
            <Text style={[styles.helloText, { color: tk.helloColor }]}>Hello,</Text>
            <Text style={[styles.nameText, { color: tk.nameColor }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>

          <View style={[styles.logoPill, { backgroundColor: tk.logoPillBg }]}>
            <View style={styles.logoImageWrap}>
              <Image
                source={companyLogoUri ? { uri: companyLogoUri } : Logo}
                style={styles.logoImage as ImageStyle}
                resizeMode="contain"
              />
            </View>
          </View>

        </View>

        {/* ── Row 2 : Date ←→ Search | Actions ── */}
        <View style={styles.bottomRow}>

          {/*
           * flexZone: two absolutely-stacked children
           *   1. Date label — fades out when search opens
           *   2. Search pill — slides in from the right
           */}
          <View style={styles.flexZone}>

            {/* Date */}
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.dateCentered, { opacity: dateFade }]}
              pointerEvents={searchActive ? 'none' : 'auto'}
            >
              <MaterialCommunityIcons
                name="calendar-month-outline"
                size={13}
                color={tk.dateColor}
                style={styles.calIcon}
              />
              <Text style={[styles.dateText, { color: tk.dateColor }]} numberOfLines={1}>
                {formattedDate}
              </Text>
            </Animated.View>

            {/* Search pill */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.searchPill,
                {
                  backgroundColor: tk.searchBg,
                  borderColor:     tk.searchBorder,
                  opacity:         searchFade,
                  transform: [{ translateX: searchSlide }, { scale: searchScale }],
                },
              ]}
              pointerEvents={searchActive ? 'auto' : 'none'}
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.searchSweep,
                  {
                    transform: [
                      { translateX: sweepTranslateX },
                      { rotate: '16deg' },
                    ],
                  },
                ]}
              />
              <MaterialCommunityIcons
                name="magnify"
                size={16}
                color={tk.placeholderColor}
                style={styles.searchIcon}
              />
              <TextInput
                ref={inputRef}
                placeholder="Search products, services…"
                placeholderTextColor={tk.placeholderColor}
                value={searchQuery}
                onChangeText={handleQueryChange}
                onSubmitEditing={handleSubmit}
                style={[styles.searchInput, { color: tk.searchTextColor }]}
                editable={searchActive}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => { setSearchQuery(''); reset(); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="close-circle" size={16} color={tk.placeholderColor} />
                </TouchableOpacity>
              )}
            </Animated.View>

          </View>

          {/* Icon buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={searchActive ? closeSearch : openSearch}
              style={[styles.iconBtn, { backgroundColor: tk.iconBg }]}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={searchActive ? 'close' : 'magnify'}
                size={19}
                color={tk.iconTint}
              />
            </TouchableOpacity>

            {!searchActive && (
              <TouchableOpacity
                onPress={onNotificationPress}
                style={[styles.iconBtn, { backgroundColor: tk.iconBg }]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name="bell-outline" size={19} color={tk.iconTint} />
                {notificationBadge > 0 && <View style={styles.badgeDot} />}
              </TouchableOpacity>
            )}
          </View>

        </View>
      </View>

      {/* ── Search Dropdown ─────────────────────────────────────────────────
       *  Absolutely positioned below the gradient so it overlays page content
       *  without affecting the layout flow of the dashboard.
       */}
    </View>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer wrapper creates a stacking context
  wrapper: {
    zIndex: 100,
  },

  headerSurface: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  // ── Row 1 ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 16,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  greetWrap: {
    flex: 1,
  },
  helloText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
    letterSpacing: 0.2,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: 0,
  },
  logoPill: {
    borderRadius: 18,
    paddingHorizontal: 7,
    paddingVertical: 5,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  logoImageWrap: {
    width: 106,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 30,
  },

  // ── Row 2 ──
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
  },
  flexZone: {
    flex: 1,
    position: 'relative',
    height: 50,
  },

  // Date
  dateCentered: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calIcon: {
    marginRight: 5,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    flexShrink: 1,
  },

  // Search pill
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 15,
    height: 50,
    gap: 9,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  searchSweep: {
    position: 'absolute',
    top: -18,
    bottom: -18,
    left: 0,
    width: 58,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  searchIcon: {},
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
    height: 50,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#111827',
  },

  // Dropdown container — absolute, overlays content below header
});

export default HeaderComponent;
