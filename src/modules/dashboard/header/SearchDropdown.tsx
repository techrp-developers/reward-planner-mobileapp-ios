import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../theme/ThemeContext';
import { SearchData, SearchResultItem } from '../api/GlobalSearchAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchDropdownProps {
  query: string;
  results: SearchData | null;
  loading: boolean;
  isEmpty: boolean;
  onClose: () => void;
}

type Section = {
  title: string;
  data: SearchResultItem[];
};

// ─── Query highlight ──────────────────────────────────────────────────────────

const HighlightedText = memo(({
  text,
  query,
  titleColor,
  accentColor,
}: {
  text: string;
  query: string;
  titleColor: string;
  accentColor: string;
}) => {
  const trimmed = query.trim();

  const idx = trimmed ? text.toLowerCase().indexOf(trimmed.toLowerCase()) : -1;

  if (!trimmed || idx === -1) {
    return (
      <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>
        {text}
      </Text>
    );
  }

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + trimmed.length);
  const after = text.slice(idx + trimmed.length);

  return (
    <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>
      {before}
      <Text style={[styles.highlight, { color: accentColor }]}>{match}</Text>
      {after}
    </Text>
  );
});

// ─── Result item ──────────────────────────────────────────────────────────────

const ResultItem = memo(({
  item,
  query,
  onPress,
  isLast,
  thumbBg,
  itemBg,
  titleColor,
  separatorColor,
}: {
  item: SearchResultItem;
  query: string;
  onPress: (item: SearchResultItem) => void;
  isLast: boolean;
  thumbBg: string;
  itemBg: string;
  titleColor: string;
  separatorColor: string;
}) => {
  const isProduct = item.type === 'product';
  const badgeColor = isProduct ? '#7C5CFC' : '#0EA5E9';
  const badgeLabel = isProduct ? 'Product' : 'Service';
  const badgeIcon = isProduct ? 'shopping-outline' : 'briefcase-outline';

  return (
    <TouchableOpacity
      style={[
        styles.item,
        { backgroundColor: itemBg },
        !isLast && styles.itemBorder,
        !isLast && { borderBottomColor: separatorColor },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.thumb, { backgroundColor: thumbBg }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name={badgeIcon} size={20} color={badgeColor} />
        )}
      </View>

      <View style={styles.resultTextWrap}>
        <HighlightedText
          text={item.title}
          query={query}
          titleColor={titleColor}
          accentColor={badgeColor}
        />
        <View style={styles.resultMetaRow}>
          <MaterialCommunityIcons name={badgeIcon} size={12} color={badgeColor} />
          <Text style={[styles.resultMetaText, { color: badgeColor }]}>{badgeLabel}</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={badgeColor} />
    </TouchableOpacity>
  );
});

// ─── Section header (sticky) ──────────────────────────────────────────────────

const SectionHeader = memo(({
  title,
  sectionBg,
  sectionTextColor,
}: {
  title: string;
  sectionBg: string;
  sectionTextColor: string;
}) => (
  <View style={[styles.section, { backgroundColor: sectionBg }]}>
    <Text style={[styles.sectionText, { color: sectionTextColor }]}>{title}</Text>
  </View>
));

// ─── Dropdown ─────────────────────────────────────────────────────────────────

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  results,
  loading,
  isEmpty,
  onClose,
}) => {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { height: windowHeight } = useWindowDimensions();
  const dropdownHeight = Math.min(Math.max(windowHeight * 0.42, 320), 460);

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  const tk = useMemo(() => ({
    card: {
      backgroundColor: isDark ? '#1E1E32' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)'
    } as ViewStyle,
    spinnerHint: { color: isDark ? '#6A6A8E' : '#9B8FCC' } as TextStyle,
    minCharHint: { color: isDark ? '#5A5A7E' : '#B0A8D8' } as TextStyle,
    emptyTitle: { color: isDark ? '#C4BCFF' : '#1A1A2E' } as TextStyle,
    emptyHint: { color: isDark ? '#5A5A7E' : '#9B8FCC' } as TextStyle,
    sectionBg: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
    sectionText: isDark ? '#C4BCFF' : '#7C3AED',
    thumbBg: isDark ? '#2A2A3E' : '#EEF2FF',
    itemBg: isDark ? '#1E1E32' : '#FFFFFF',
    titleColor: isDark ? '#F8FAFC' : '#111827',
    separatorColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
    footerBorder: { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' } as ViewStyle,
    magnifyIcon: isDark ? '#3D3D5C' : '#D0CBFF',
  }), [isDark]);

  // ── Entry animation ───────────────────────────────────────────────────────────
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    Animated.spring(anim, {
      toValue: 1,
      tension: 100,
      friction: 12,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useMemo(() => ({
    transform: [{
      translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
    }],
  }), [anim]);

  // ── Navigation handler ────────────────────────────────────────────────────────
  const handlePress = useCallback((item: SearchResultItem) => {
    onClose();
    if (item.type === 'product') {
      navigation.navigate('ProductDetails', { productId: item.id });
    } else {
      navigation.navigate('ServiceStack');
    }
  }, [navigation, onClose]);

  // ── Section data ──────────────────────────────────────────────────────────────
  const sections: Section[] = useMemo(() => {
    if (!results) return [];
    const out: Section[] = [];
    if (results.products.length > 0) out.push({ title: 'PRODUCTS', data: results.products });
    if (results.services.length > 0) out.push({ title: 'SERVICES', data: results.services });
    return out;
  }, [results]);

  // ── "See all results" footer ──────────────────────────────────────────────────
  const listFooter = useMemo(() => (
    <TouchableOpacity
      style={[styles.viewAll, tk.footerBorder]}
      onPress={() => {
        onClose();
        navigation.navigate('Search', { query: query.trim() });
      }}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons name="magnify" size={14} color="#7C5CFC" />
      <Text style={styles.viewAllText}>See all results for "{query.trim()}"</Text>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#7C5CFC" />
    </TouchableOpacity>
  ), [tk.footerBorder, onClose, navigation, query]);

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <ActivityIndicator color="#7C5CFC" size="small" />
            <Text style={[styles.hint, tk.spinnerHint]}>Searching…</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Too few characters ────────────────────────────────────────────────────────
  if (query.trim().length < 2) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <MaterialCommunityIcons name="magnify" size={24} color={tk.magnifyIcon} />
            <Text style={[styles.hint, tk.minCharHint]}>Type at least 2 characters</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <View style={[styles.card, tk.card]}>
        <Animated.View style={animStyle}>
          <View style={styles.centered}>
            <MaterialCommunityIcons name="magnify-close" size={28} color={tk.magnifyIcon} />
            <Text style={[styles.emptyTitle, tk.emptyTitle]}>
              No results for "{query.trim()}"
            </Text>
            <Text style={[styles.hint, tk.emptyHint]}>Try a different keyword</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (!results || sections.length === 0) return null;

  // ── Results ───────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.card, tk.card]}>
      <Animated.View style={[styles.listWrap, { height: dropdownHeight, maxHeight: dropdownHeight }, animStyle]}>
        <SectionList
          style={[styles.list, { height: dropdownHeight, maxHeight: dropdownHeight }]}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
          persistentScrollbar
          scrollEnabled={true}
          nestedScrollEnabled={true}
          bounces={false}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <SectionHeader
              title={section.title}
              sectionBg={tk.sectionBg}
              sectionTextColor={tk.sectionText}
            />
          )}
          renderItem={({ item, section, index }) => (
            <ResultItem
              item={item}
              query={query}
              onPress={handlePress}
              isLast={index === section.data.length - 1}
              thumbBg={tk.thumbBg}
              itemBg={tk.itemBg}
              titleColor={tk.titleColor}
              separatorColor={tk.separatorColor}
            />
          )}
          ListFooterComponent={listFooter}
        />
      </Animated.View>
    </View>
  );
};

export default memo(SearchDropdown);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Outer card: shadow + border. NO overflow:'hidden' — that blocks Android scroll events.
  card: {
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 24,
  },

  // SectionList owns the scroll area — maxHeight lives here, not on the card.
  listWrap: {
    overflow: 'hidden',
    borderRadius: 20,
  },
  list: {
    borderRadius: 20,
  },
  listContent: {
    paddingBottom: 4,
  },

  // Section header
  section: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,
  },

  // Result row
  itemBorder: {
    borderBottomWidth: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12.5,
    gap: 13,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  resultTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14.5,
    fontWeight: '500',
    lineHeight: 19,
    letterSpacing: 0,
  },
  highlight: {
    fontWeight: '800',
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  resultMetaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // "See all results" footer
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  viewAllText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#7C5CFC',
  },

  // Loading / empty states
  centered: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
