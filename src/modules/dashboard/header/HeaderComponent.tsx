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
  onNotificationPress?:   () => void;
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
  onNotificationPress,
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
  }), [isDark, surface, textColor]);

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

  const searchWidth = searchExpansion.interpolate({
    inputRange: [0, 1],
    outputRange: [rs(42), Math.max(rs(180), screenWidth - rs(88))],
  });
  const headerRowHeight = headerCollapse.interpolate({
    inputRange: [0, 1],
    outputRange: [rs(60), 0],
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    // Outer wrapper: creates a stacking context so the dropdown overlays
    // dashboard content below without affecting the layout flow.
    <View style={styles.wrapper}>

      <View
        style={[styles.headerSurface, { backgroundColor: tk.headerBg, paddingTop: safeTop + 10, paddingBottom: statusContent ? rs(4) : rs(10) }]}
        onLayout={handleHeaderLayout}
      >
        <Animated.View style={[styles.collapsibleRow, { height: headerRowHeight, opacity: headerCollapse.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]} pointerEvents={collapsed ? 'none' : 'auto'}>
          {!searchActive ? (
          <View style={styles.topRow}>
            <View style={styles.greetWrap}>
              <Text style={[styles.nameText, { color: tk.nameColor }]} numberOfLines={1}>Hi, {firstName}</Text>
            </View>
            {normalizedCompanyLogoUri && !companyLogoFailed ? (
              <View style={styles.logoPill}>
                <Image source={{ uri: normalizedCompanyLogoUri }} style={styles.logoImage} resizeMode="contain" onError={() => setCompanyLogoFailed(true)} />
              </View>
            ) : (
              <View style={styles.logoPill}><MaterialCommunityIcons name="domain" size={rs(23)} color="#6A00FF" /></View>
            )}
            <TouchableOpacity onPress={openSearch} style={[styles.actionButton, { backgroundColor: tk.searchBg }]} accessibilityLabel="Search" activeOpacity={0.75}>
              <MaterialCommunityIcons name="magnify" size={rs(21)} color={tk.searchTextColor} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onNotificationPress} style={[styles.actionButton, { backgroundColor: tk.searchBg }]} accessibilityLabel="Notifications" activeOpacity={0.75}>
              <MaterialCommunityIcons name="bell-outline" size={rs(21)} color={tk.searchTextColor} />
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
    gap: rs(8),
    minHeight: rs(44),
  },
  greetWrap: {
    flex: 1,
    minWidth: 0,
  },
  nameText: {
    fontSize: rs(15),
    fontWeight: '800',
    lineHeight: rs(20),
    letterSpacing: 0,
  },
  actionButton: {
    width: rs(40),
    height: rs(40),
    borderRadius: rs(20),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoPill: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(12),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoImage: {
    width: rs(38),
    height: rs(38),
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
