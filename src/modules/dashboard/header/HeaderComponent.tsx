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
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../../theme/ThemeContext';
import { useGlobalSearch } from './useGlobalSearch';
import type { SearchData } from '../api/GlobalSearchAPI';
import { normalizeLocalCmsImageUrl } from '../../../config/apiConfig';
import { rs } from '../../../utils/responsive';

const ANDROID_STATUS_BAR = StatusBar.currentHeight ?? 24;
const HEADER_ROW_HEIGHT  = rs(58);
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
  // CMS-driven text color for the header strip (greeting name, subtitle,
  // search placeholder/icon tints, bell icon) — used when a CMS
  // navbar_background image/color is active, since the theme-based
  // light/dark text tokens can't know if that background is readable
  // against them. Leave unset to keep the normal theme-aware colors
  // (e.g. the default no-CMS-content fallback background).
  textColor?:             string;
  dismissSignal?:         number;
  // Shows the expandable search button. Off on the dashboard (search lives in
  // the bottom tab); GlobalSearchScreen turns it on as its search input.
  showSearch?:            boolean;
  onNotificationPress?:   () => void;
  onProfilePress?:        () => void;
  onAIToggle?:            (value: boolean) => void;
  onSearchSubmit?:        (query: string) => void;
  onSearchActiveChange?:  (active: boolean) => void;
  onSearchDropdownChange?: (active: boolean) => void;
  onSearchOverlayChange?: (state: SearchOverlayState) => void;
  showRewardPoints?:      boolean;
  rewardPoints?:          number;
  statusContent?:         React.ReactNode;
  collapsed?:             boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

const HeaderComponent: React.FC<HeaderProps> = ({
  userName = 'User',
  companyLogoUri,
  statusContent,
  collapsed = false,
  surface = 'solid',
  textColor,
  dismissSignal = 0,
  showSearch = false,
  onNotificationPress,
  onProfilePress,
  onSearchSubmit,
  onSearchActiveChange,
  onSearchDropdownChange,
  onSearchOverlayChange,
}) => {
  const { isDark }   = useAppTheme();
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [headerHeight, setHeaderHeight] = useState(0);
  const [companyLogoFailed, setCompanyLogoFailed] = useState(false);
  const searchExpansion = useRef(new Animated.Value(0)).current;
  const headerCollapse = useRef(new Animated.Value(collapsed ? 1 : 0)).current;
  const lastDismissSignal = useRef(dismissSignal);
  const inputRef    = useRef<TextInput>(null);
  const { width: screenWidth } = useWindowDimensions();

  const insets  = useSafeAreaInsets();
  const safeTop = insets.top > 0
    ? insets.top
    : Platform.OS === 'android' ? ANDROID_STATUS_BAR : IOS_FALLBACK_TOP;
  const normalizedCompanyLogoUri = useMemo(
    () => normalizeLocalCmsImageUrl(companyLogoUri),
    [companyLogoUri],
  );
  const firstName = useMemo(() => userName.trim().split(/\s+/)[0] || 'User', [userName]);

  useEffect(() => {
    setCompanyLogoFailed(false);
  }, [normalizedCompanyLogoUri]);

  useEffect(() => {
    Animated.timing(headerCollapse, {
      toValue: collapsed ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [collapsed, headerCollapse]);

  // ── Global search hook ────────────────────────────────────────────────────

  const { results, loading, isEmpty, reset } = useGlobalSearch(searchQuery);
  const showDropdown = searchActive && searchQuery.trim().length > 0;

  // ── Theme tokens ──────────────────────────────────────────────────────────

  const tk = useMemo(() => ({
    headerBg:         surface === 'transparent' ? 'transparent' : isDark ? '#09090B' : '#FFFFFF',
    nameColor:        textColor ?? (isDark ? '#F8FAFC' : '#0F172A'),
    searchBg:         isDark ? 'rgba(15,23,42,0.88)' : '#F1F5F9',
    // Search pill keeps its own fixed light/dark background regardless of
    // the header's dynamic textColor, so its text must stay theme-based too
    // — following textColor here would make it unreadable (e.g. white text
    // on the pill's light gray background) whenever a CMS text_color is set.
    searchTextColor:  isDark ? '#F8FAFC' : '#0F172A',
    placeholderColor: isDark ? '#94A3B8' : '#64748B',
    buttonBorder:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)',
  }), [isDark, surface, textColor]);

  // Narrow iPhones (SE, mini) tighten the gaps first so the logo keeps its size.
  const compactRow = screenWidth < 375;
  const rowGap = compactRow ? rs(8) : rs(10);
  const logoWidth = compactRow ? rs(64) : rs(72);

  // ── Layout measurement — drives dropdown top position ─────────────────────

  const handleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    const nextHeight = e.nativeEvent.layout.height;
    setHeaderHeight((prev) => (Math.abs(prev - nextHeight) < 1 ? prev : nextHeight));
  }, []);

  // ── Search animation ──────────────────────────────────────────────────────

  const openSearch = useCallback(() => {
    if (searchActive) return;
    setSearchActive(true);
    onSearchActiveChange?.(true);
    searchExpansion.stopAnimation();
    searchExpansion.setValue(0);
    Animated.timing(searchExpansion, {
      toValue: 1,
      duration: 260,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) inputRef.current?.focus();
    });
  }, [searchActive, searchExpansion, onSearchActiveChange]);

  const closeSearch = useCallback(() => {
    if (!searchActive) return;
    inputRef.current?.blur();
    searchExpansion.stopAnimation();
    onSearchActiveChange?.(false);
    setSearchQuery('');
    reset();
    Animated.timing(searchExpansion, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setSearchActive(false));
  }, [searchActive, searchExpansion, reset, onSearchActiveChange]);

  useEffect(() => {
    if (!showSearch) return;
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
    showSearch,
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

  const searchWidth = searchExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [rs(42), Math.max(rs(180), screenWidth - rs(88))],
  });
  // Must match styles.topRow's height so the collapse animation is exact.
  const headerRowHeight = headerCollapse.interpolate({
    inputRange: [0, 1],
    outputRange: [HEADER_ROW_HEIGHT, 0],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer wrapper: creates a stacking context so the dropdown overlays
    // dashboard content below without affecting the layout flow.
    <View style={styles.wrapper}>

      <View
        style={[styles.headerSurface, { backgroundColor: tk.headerBg, paddingTop: safeTop + rs(4), paddingBottom: statusContent ? rs(12) : rs(8) }]}
        onLayout={handleHeaderLayout}
      >
        <Animated.View style={[styles.collapsibleRow, { height: headerRowHeight, opacity: headerCollapse.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]} pointerEvents={collapsed ? 'none' : 'auto'}>
          {!searchActive ? (
          <View style={[styles.topRow, { gap: rowGap }]}>
            <View style={styles.greetWrap}>
              <Text style={[styles.nameText, { color: tk.nameColor }]} numberOfLines={1} ellipsizeMode="tail">Hi, {firstName}</Text>
            </View>
            {normalizedCompanyLogoUri && !companyLogoFailed ? (
              <View style={[styles.logoPill, { width: logoWidth }]}>
                <Image source={{ uri: normalizedCompanyLogoUri }} style={styles.logoImage} resizeMode="contain" onError={() => setCompanyLogoFailed(true)} accessibilityLabel="Company logo" />
              </View>
            ) : (
              <View style={[styles.logoPill, { width: logoWidth }]}><MaterialCommunityIcons name="domain" size={rs(24)} color="#6A00FF" /></View>
            )}
            {onProfilePress && (
              <TouchableOpacity onPress={onProfilePress} style={[styles.actionButton, { backgroundColor: tk.searchBg, borderColor: tk.buttonBorder }]} accessibilityRole="button" accessibilityLabel="Open profile" activeOpacity={0.75}>
                <MaterialCommunityIcons name="account-circle-outline" size={rs(23)} color={tk.searchTextColor} />
              </TouchableOpacity>
            )}
            {showSearch && (
              <TouchableOpacity onPress={openSearch} style={[styles.actionButton, { backgroundColor: tk.searchBg, borderColor: tk.buttonBorder }]} accessibilityRole="button" accessibilityLabel="Search" activeOpacity={0.75}>
                <MaterialCommunityIcons name="magnify" size={rs(22)} color={tk.searchTextColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onNotificationPress} style={[styles.actionButton, { backgroundColor: tk.searchBg, borderColor: tk.buttonBorder }]} accessibilityRole="button" accessibilityLabel="Notifications" activeOpacity={0.75}>
              <MaterialCommunityIcons name="bell-outline" size={rs(23)} color={tk.searchTextColor} />
            </TouchableOpacity>
          </View>
          ) : (
          <View style={styles.expandedSearchRow}>
            <Animated.View style={[styles.expandedSearch, { width: searchWidth, backgroundColor: tk.searchBg }]}>
              <MaterialCommunityIcons name="magnify" size={rs(19)} color={tk.placeholderColor} />
              <TextInput ref={inputRef} placeholder="Search for rewards, services & more..." placeholderTextColor={tk.placeholderColor} value={searchQuery} onChangeText={handleQueryChange} onSubmitEditing={handleSubmit} style={[styles.searchInput, { color: tk.searchTextColor }]} returnKeyType="search" />
            </Animated.View>
            <TouchableOpacity onPress={closeSearch} style={styles.closeButton} accessibilityLabel="Close search"><MaterialCommunityIcons name="close" size={rs(24)} color={tk.nameColor} /></TouchableOpacity>
          </View>
          )}
        </Animated.View>
        {statusContent}
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
    paddingHorizontal: rs(16),
    paddingBottom: rs(10),
    overflow: 'hidden',
  },
  collapsibleRow: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  // ── Row 1 ──
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
    height: HEADER_ROW_HEIGHT,
  },
  greetWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameText: {
    fontSize: rs(20),
    fontWeight: '800',
    lineHeight: rs(26),
    letterSpacing: -0.5,
  },
  actionButton: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Company logo: wide 72×48 pill so landscape wordmarks (e.g. MPS Global)
  // render large; the width is set per screen size in render.
  logoPill: {
    width: rs(72),
    height: rs(48),
    borderRadius: rs(14),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(106, 0, 255, 0.10)',
    paddingHorizontal: rs(5),
    paddingVertical: rs(3),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  expandedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    minHeight: rs(44),
  },
  expandedSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    height: rs(44),
    borderRadius: rs(22),
    paddingHorizontal: rs(12),
    gap: rs(8),
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontSize: rs(14),
    fontWeight: '600',
    paddingVertical: 0,
    height: rs(44),
    minWidth: 0,
  },
  closeButton: {
    width: rs(40),
    height: rs(40),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Dropdown container — absolute, overlays content below header
});

export default HeaderComponent;
