import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  TextInput,
  SectionList,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import BBPSHead from '../constatnt/BBPSHead';
import { useBbpsTheme } from '../utils/useBbpsTheme';
import { Biller, StateBillerSection } from './type';
import {
  bbpsOperatorDetailsQueryKey,
  bbpsOperatorsQueryKey,
  fetchOperatorDetails,
  fetchOperators,
  Operator,
} from '../api/BillsAPI';
import SkeletonBox from '../../services/component/constant/SkeletonBox';

const FIVE_MINUTES = 5 * 60 * 1000;
const SKELETON_GROUPS = [0, 1];
const SKELETON_ROWS = [0, 1, 2];

const OperatorLogo = React.memo(({
  name,
  logoUrl,
  logoAlt,
  isDark,
}: {
  name: string;
  logoUrl?: string;
  logoAlt?: string;
  isDark: boolean;
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [logoUrl]);

  const showImage = Boolean(logoUrl) && !imageFailed;

  return (
    <View style={styles.logoPlaceholder}>
      {showImage ? (
        <Image
          source={{ uri: logoUrl }}
          style={styles.operatorLogo}
          resizeMode="contain"
          accessibilityLabel={logoAlt || `${name} logo`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={[styles.logoInitial, { color: isDark ? '#F1DEFF' : '#704096' }]}>
          {name.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
});

const mapFlatOperatorsToSection = (operators: Operator[]): StateBillerSection[] => {
  if (!Array.isArray(operators) || operators.length === 0) {
    return [];
  }

  const billers = operators
    .map((item): Biller | null => {
      const operatorId = Number(item?.operator_id);
      const name = String(item?.name || '').trim();

      if (!Number.isFinite(operatorId) || operatorId <= 0 || !name) {
        return null;
      }

      return {
        id: operatorId.toString(),
        name,
        operator_id: operatorId,
        logoUrl: String(item?.logo_url || '').trim() || undefined,
        logoAlt: String(item?.logo_alt || '').trim() || undefined,
      };
    })
    .filter((item): item is Biller => Boolean(item));

  if (billers.length === 0) {
    return [];
  }

  return [
    {
      title: 'Available operators',
      data: billers,
    },
  ];
};

const filterSections = (
  allData: StateBillerSection[],
  query: string
): StateBillerSection[] => {
  const lowercaseText = query.toLowerCase().trim();

  if (!lowercaseText) {
    return allData;
  }

  return allData.reduce((result, section) => {
    // 1. Filter billers within the section by name
    const matchingBillers = section.data.filter((biller) =>
      biller.name.toLowerCase().includes(lowercaseText)
    );

    // 2. Or check if the State name (title) matches
    const stateMatches = section.title.toLowerCase().includes(lowercaseText);

    // 3. If either matches, add to result
    if (matchingBillers.length > 0 || stateMatches) {
      // If state name matched but no biller did, show all billers in that state
      const billersToShow = matchingBillers.length > 0 ? matchingBillers : section.data;

      result.push({
        ...section,
        data: billersToShow,
      });
    }
    return result;
  }, [] as StateBillerSection[]);
};

const BillerSelectScreenComponent = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient();
  const bbpsTheme = useBbpsTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  // Extract categoryId and categoryName from route params
  const categoryId = Number(route.params?.categoryId);
  const categoryName = route.params?.categoryName || 'Billers';
  const hasValidCategoryId = Number.isFinite(categoryId) && categoryId > 0;

  const {
    data: allData = [],
    isLoading: loading,
    error: queryError,
    refetch: loadOperators,
  } = useQuery({
    queryKey: bbpsOperatorsQueryKey(categoryId),
    queryFn: async () => {
      const operators = await fetchOperators(categoryId);
      return mapFlatOperatorsToSection(operators);
    },
    enabled: hasValidCategoryId,
    staleTime: FIVE_MINUTES,
  });

  const error = !hasValidCategoryId
    ? 'Category ID not provided'
    : queryError
    ? 'Failed to load billers. Please try again.'
    : null;

  const filteredData = useMemo(
    () => filterSections(allData, searchQuery),
    [allData, searchQuery]
  );

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
    };
  }, [pulse]);

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  const handleRetry = useCallback(() => {
    loadOperators();
  }, [loadOperators]);

  const handleBillerPress = useCallback(
    (item: Biller) => {
      // Prefetch the selected biller's details in the background so
      // BillDetailsScreen reads straight from cache instead of waiting.
      queryClient.prefetchQuery({
        queryKey: bbpsOperatorDetailsQueryKey(item.operator_id),
        queryFn: () => fetchOperatorDetails(item.operator_id),
        staleTime: FIVE_MINUTES,
      });

      navigation.navigate('BillDetailsScreen', {
        operatorId: item.operator_id,
        operatorName: item.name,
        operatorLogoUrl: item.logoUrl,
        operatorLogoAlt: item.logoAlt,
        categoryId: categoryId,
        categoryName: categoryName,
      });
    },
    [navigation, queryClient, categoryId, categoryName]
  );

  // Render individual Biller Item
  const renderBillerItem = useCallback(
    ({ item }: { item: Biller }) => (
      <TouchableOpacity
        activeOpacity={0.78}
        style={[
          styles.billerItemRow,
        ]}
        onPress={() => handleBillerPress(item)}
      >
        <OperatorLogo
          name={item.name}
          logoUrl={item.logoUrl}
          logoAlt={item.logoAlt}
          isDark={bbpsTheme.isDark}
        />
        <View style={styles.billerTextBlock}>
          <Text style={[styles.billerNameText, { color: bbpsTheme.colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [handleBillerPress, bbpsTheme]
  );

  // Render State Header (Section)
  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: StateBillerSection }) => (
      <View
        style={[
          styles.stateHeaderContainer,
          { backgroundColor: bbpsTheme.colors.surface },
        ]}
      >
        <View>
          <Text style={[styles.stateHeaderText, { color: bbpsTheme.colors.textStrong }]}>{title}</Text>
          <Text style={[styles.stateHeaderSubtext, { color: bbpsTheme.colors.muted }]}>Choose your service provider</Text>
        </View>
      </View>
    ),
    [bbpsTheme]
  );

  const keyExtractor = useCallback((item: Biller) => item.id, []);

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
        <BBPSHead
          title={`Pay ${categoryName}`}
          onBackPress={handleBackPress}
        />
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: bbpsTheme.colors.primary, shadowColor: bbpsTheme.colors.shadow }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
      <BBPSHead
        title={`Pay ${categoryName}`}
        onBackPress={handleBackPress}
      />

      {/* Search Input Area */}
      <View style={[styles.searchContainer, { backgroundColor: bbpsTheme.colors.background }]}>
        {loading ? (
          <SkeletonBox pulse={pulse} width="100%" height={52} borderRadius={12} />
        ) : (
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: bbpsTheme.colors.elevated,
                borderColor: bbpsTheme.colors.border,
                shadowColor: bbpsTheme.colors.shadow,
              },
            ]}
          >
            <MaterialIcons name="search" size={24} color={bbpsTheme.colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: bbpsTheme.colors.text }]}
              placeholder="Search operators"
              placeholderTextColor={bbpsTheme.colors.subtle}
              value={searchQuery}
              onChangeText={handleSearch}
              clearButtonMode="while-editing"
            />
          </View>
        )}
      </View>

      {/* Grouped SectionList */}
      {loading ? (
        <View style={styles.listContent}>
          {SKELETON_GROUPS.map((group) => (
            <View key={`group-${group}`}>
              <SkeletonBox pulse={pulse} width="100%" height={42} borderRadius={10} style={styles.skeletonHeaderGap} />
              {SKELETON_ROWS.map((item) => (
                <View
                  key={`row-${group}-${item}`}
                  style={[
                    styles.skeletonRow,
                    {
                      backgroundColor: bbpsTheme.colors.surface,
                      borderColor: bbpsTheme.colors.borderSoft,
                    },
                  ]}
                >
                  <SkeletonBox pulse={pulse} width={44} height={44} borderRadius={22} />
                  <SkeletonBox pulse={pulse} width="72%" height={16} borderRadius={8} style={styles.skeletonTextOffset} />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="search-off" size={48} color={bbpsTheme.colors.subtle} />
          <Text style={[styles.emptyText, { color: bbpsTheme.colors.muted }]}>No billers found</Text>
          {searchQuery && (
            <Text style={[styles.emptySubtext, { color: bbpsTheme.colors.subtle }]}>Try searching with a different biller name or state</Text>
          )}
        </View>
      ) : (
        <SectionList
          style={[
            styles.operatorListCard,
            {
              backgroundColor: bbpsTheme.colors.surface,
              borderColor: bbpsTheme.colors.border,
              shadowColor: bbpsTheme.colors.shadow,
            },
          ]}
          sections={filteredData}
          keyExtractor={keyExtractor}
          renderItem={renderBillerItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.operatorListContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#ECE7FF',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    shadowColor: '#5B47A3',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  operatorListCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderRadius: 20,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 2,
  },
  operatorListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skeletonRow: {
    backgroundColor: '#FFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderGap: {
    marginTop: 12,
  },
  skeletonTextOffset: {
    marginLeft: 14,
  },
  stateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingTop: 16,
    paddingBottom: 16,
  },
  stateHeaderText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  stateHeaderSubtext: { fontSize: 11.5, fontWeight: '500', marginTop: 3 },
  billerItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 8,
    gap: 16,
    marginBottom: 16,
  },
  logoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  logoInitial: {
    fontSize: 19,
    fontWeight: '800',
  },
  operatorLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  billerTextBlock: { flex: 1, minWidth: 0 },
  billerNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 19,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: '#8665FF',
    borderRadius: 12,
    shadowColor: '#5B47A3',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

const BillerSelectScreen = React.memo(BillerSelectScreenComponent);
export default BillerSelectScreen;
