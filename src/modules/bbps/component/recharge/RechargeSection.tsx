import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import BBPSHead from '../../constatnt/BBPSHead';
import SkeletonBox from '../../../services/component/constant/SkeletonBox';
import { useAuth } from '../../../common/auth/context/AuthContext';
import {
  BillLocation,
  fetchBillLocations,
  fetchRechargePlans,
  RechargePlan,
  RechargePlanGroup,
} from '../../api/BillsAPI';
import { useAlert } from '../../../ecommerce/components/alerts';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

const getPlanId = (plan: RechargePlan) =>
  String(plan.planId || plan.plan_id || plan.id || plan.recharge_plan_id || '');

const getPlanAmount = (plan: RechargePlan) =>
  String(plan.amount || plan.price || plan.rs || plan.recharge_amount || '');

const getPlanValidity = (plan: RechargePlan) =>
  String(plan.validity || plan.validityDescription || plan.validity_desc || '-');

const getPlanData = (plan: RechargePlan) =>
  String(plan.data || plan.dataBenefit || plan.benefits || '-');

const getPlanDescription = (plan: RechargePlan) =>
  String(plan.description || plan.desc || plan.planDescription || plan.short_desc || '');

const TEN_MINUTES = 10 * 60 * 1000;

let cachedBillLocations: { data: BillLocation[]; timestamp: number } | null = null;
const rechargePlansCache = new Map<
  string,
  { data: { plans: RechargePlan[]; groups: RechargePlanGroup[] }; timestamp: number }
>();

const isFresh = (timestamp: number) => Date.now() - timestamp < TEN_MINUTES;

function RechargeSection({ navigation, route }: any) {
  const bbpsTheme = useBbpsTheme();
  const { user } = useAuth();
  const alert = useAlert();
  const alertRef = useRef(alert);

  // route.params is undefined when this screen is navigated to without any
  // params (e.g. the bare BillsCard "Recharge" entry) — fall back to {} so
  // every read below is safe.
  const params = route?.params ?? {};
  const operatorId = params.operatorId;
  const formValues = params.formValues || {};
  const primaryValue =
    formValues.utility_acc_no ||
    Object.values(formValues).find((value: any) => String(value || '').trim()) ||
    params.mobileNumber ||
    user?.phone ||
    '';
  const operatorName = params.operatorName || 'Operator';
  // Circle is chosen up-front on ReachargeHomeScreen's modal picker — when it
  // arrives via params we skip showing a second (confusing) chip selector here.
  const hasPreselectedCircle = Boolean(params.selectedLocation);

  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<BillLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<BillLocation | null>(
    () => params.selectedLocation ?? null
  );
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [planGroups, setPlanGroups] = useState<RechargePlanGroup[]>([]);
  const [activeGroupLabel, setActiveGroupLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [plansLoading, setPlansLoading] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;

  const filteredLocations = useMemo(() => {
    const query = locationSearch.trim().toLowerCase();

    if (!query) {
      return locations;
    }

    return locations.filter(
      (item) =>
        item.operator_location_name.toLowerCase().includes(query) ||
        item.abbreviation?.toLowerCase().includes(query)
    );
  }, [locations, locationSearch]);

  const activeGroupPlans = useMemo(() => {
    if (planGroups.length === 0) {
      return plans;
    }

    return (
      planGroups.find((group) => group.label === activeGroupLabel)?.plans ||
      planGroups[0]?.plans ||
      []
    );
  }, [activeGroupLabel, planGroups, plans]);

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return activeGroupPlans;
    }

    return activeGroupPlans.filter((plan) => {
      const searchable = [
        getPlanAmount(plan),
        getPlanValidity(plan),
        getPlanData(plan),
        getPlanDescription(plan),
      ]
        .join(' ')
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [activeGroupPlans, searchQuery]);

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

  useEffect(() => {
    alertRef.current = alert;
  }, [alert]);

  useEffect(() => {
    let mounted = true;

    const loadLocations = async () => {
      try {
        const cachedList = cachedBillLocations && isFresh(cachedBillLocations.timestamp)
          ? cachedBillLocations.data
          : null;

        if (!cachedList) {
          setLoading(true);
        }

        const list = cachedList || (await fetchBillLocations());
        if (!cachedList) {
          cachedBillLocations = { data: list, timestamp: Date.now() };
        }

        if (!mounted) {
          return;
        }

        setLocations(list);

        const matchedByCircleId = params.circleId
          ? list.find((item) => String(item.operator_location_id) === String(params.circleId))
          : undefined;

        if (matchedByCircleId) {
          setSelectedLocation(matchedByCircleId);
        } else if (!hasPreselectedCircle) {
          // No circle was passed in via params (the bare BillsCard entry) —
          // default to Maharashtra so plans load immediately; the dropdown
          // still lets the user switch to any other circle.
          const defaultMaharashtra = list.find(
            (item) => String(item.operator_location_id) === '27'
          );
          if (defaultMaharashtra) {
            setSelectedLocation(defaultMaharashtra);
          }
        }
      } catch (error: any) {
        alertRef.current.error('Error', error?.message || 'Could not load circles.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadLocations();

    return () => {
      mounted = false;
    };
  }, [params.circleId, hasPreselectedCircle]);

  useEffect(() => {
    let mounted = true;

    const loadPlans = async () => {
      if (!selectedLocation || !primaryValue || !operatorId) {
        setPlans([]);
        setPlanGroups([]);
        setActiveGroupLabel('');
        return;
      }

      try {
        const cacheKey = [
          String(primaryValue),
          String(operatorId),
          String(selectedLocation.operator_location_id),
        ].join(':');
        const cached = rechargePlansCache.get(cacheKey);

        if (cached && isFresh(cached.timestamp)) {
          setPlans(cached.data.plans);
          setPlanGroups(cached.data.groups);
          setActiveGroupLabel(cached.data.groups[0]?.label || '');
          setPlansLoading(false);
          return;
        }

        setPlansLoading(true);
        const response = await fetchRechargePlans(
          String(primaryValue),
          operatorId,
          selectedLocation.operator_location_id
        );

        if (!mounted) {
          return;
        }

        const responsePlans = response?.data?.plans || [];
        const responseGroups = Array.isArray(response?.data?.groups)
          ? response.data.groups.filter(
              (group) => group?.label && Array.isArray(group.plans) && group.plans.length > 0
            )
          : [];
        const groups =
          responseGroups.length > 0
            ? responseGroups
            : responsePlans.length > 0
            ? [{ label: 'Recommended Packs', plans: responsePlans }]
            : [];

        setPlans(responsePlans);
        setPlanGroups(groups);
        setActiveGroupLabel(groups[0]?.label || '');
        rechargePlansCache.set(cacheKey, {
          data: { plans: responsePlans, groups },
          timestamp: Date.now(),
        });
      } catch (error: any) {
        setPlans([]);
        setPlanGroups([]);
        setActiveGroupLabel('');
        alertRef.current.error('Error', error?.message || 'Could not load recharge plans.');
      } finally {
        if (mounted) {
          setPlansLoading(false);
        }
      }
    };

    loadPlans();

    return () => {
      mounted = false;
    };
  }, [operatorId, primaryValue, selectedLocation]);

  const handlePlanPress = (plan: RechargePlan, startPaymentImmediately = false) => {
    if (!selectedLocation) {
      alert.warning('Select Circle', 'Please select a circle first.');
      return;
    }

    navigation.navigate('RechargeConfirmationScreen', {
      operatorId,
      operatorName,
      operatorLogoUrl: params.operatorLogoUrl,
      operatorLogoAlt: params.operatorLogoAlt,
      formValues,
      circleId: selectedLocation.operator_location_id,
      circleName: selectedLocation.operator_location_name,
      planGroupLabel: activeGroupLabel || 'Plan details',
      startPaymentImmediately,
      plan,
    });
  };

  return (
    <>
    <ScrollView style={[styles.mainContainer, { backgroundColor: bbpsTheme.colors.background }]} stickyHeaderIndices={[0]}>
      <BBPSHead
        user={{
          name: user?.name || 'User',
          number: String(primaryValue),
          operatorLogo: params.operatorLogoUrl ? { uri: params.operatorLogoUrl } : undefined,
          operatorInitial: operatorName,
          type: operatorName,
        }}
        onBackPress={() => navigation.goBack()}
        onChangePress={() => navigation.goBack()}
      />

      <View style={[styles.outerContainer, { backgroundColor: bbpsTheme.colors.background }]}>
        {loading ? (
          <View>
            <View style={styles.headerRow}>
              <SkeletonBox pulse={pulse} width={170} height={20} borderRadius={8} />
              <SkeletonBox pulse={pulse} width={64} height={16} borderRadius={8} />
            </View>

            {[0, 1, 2].map((item) => (
              <View key={`recharge-card-skeleton-${item}`} style={styles.cardWrapper}>
                <View style={styles.cardContainer}>
                  <View style={styles.leftContent}>
                    <SkeletonBox pulse={pulse} width="80%" height={16} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="62%" height={12} borderRadius={8} style={styles.skeletonGapSm} />
                  </View>
                  <SkeletonBox pulse={pulse} width={110} height={44} borderRadius={10} />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View>
            {hasPreselectedCircle && selectedLocation ? (
              <View style={[styles.circleSummaryRow, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}>
                <View style={styles.circleSummaryLeft}>
                  <View style={styles.circleBadge}>
                    <Text style={styles.circleBadgeText}>
                      {selectedLocation.abbreviation?.substring(0, 2).toUpperCase() || '??'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.circleSummaryLabel}>Circle</Text>
                    <Text style={styles.circleSummaryName}>
                      {selectedLocation.operator_location_name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeCircleBtn}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.changeCircleText, { color: bbpsTheme.colors.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Select Circle</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.circleDropdown,
                    {
                      backgroundColor: bbpsTheme.colors.surfaceAlt,
                      borderColor: bbpsTheme.colors.border,
                    },
                    selectedLocation && styles.circleDropdownSelected,
                  ]}
                  onPress={() => setLocationModalVisible(true)}
                  activeOpacity={0.8}
                >
                  {selectedLocation ? (
                    <View style={styles.circleSummaryLeft}>
                      <View style={styles.circleBadge}>
                        <Text style={styles.circleBadgeText}>
                          {selectedLocation.abbreviation?.substring(0, 2).toUpperCase() || '??'}
                        </Text>
                      </View>
                      <Text style={styles.circleDropdownText}>
                        {selectedLocation.operator_location_name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.circleDropdownPlaceholder}>
                      {loading ? 'Loading circles…' : 'Choose your telecom circle'}
                    </Text>
                  )}
                  <Icon
                    name="chevron-down"
                    size={22}
                    color={selectedLocation ? '#8665FF' : '#C4B8F5'}
                  />
                </TouchableOpacity>

                {!selectedLocation && (
                  <Text style={styles.circleHintText}>
                    Select a circle first to see matching recharge plans
                  </Text>
                )}
              </>
            )}

            <View style={[styles.plansSection, { backgroundColor: bbpsTheme.colors.surface }]}>
              <View style={[styles.searchSection, { backgroundColor: bbpsTheme.colors.surface }]}>
                <View style={[styles.searchBar, { backgroundColor: bbpsTheme.colors.surfaceAlt, borderColor: bbpsTheme.colors.border }]}>
                  <MaterialIcons name="search" size={24} color={bbpsTheme.colors.muted} />
                  <TextInput
                    placeholder="Search a Plan, e.g. 299 or 28 days"
                    style={[styles.searchInput, { color: bbpsTheme.colors.text }]}
                    placeholderTextColor={bbpsTheme.colors.subtle}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              <View style={[styles.tabContainer, { backgroundColor: bbpsTheme.colors.surface, borderBottomColor: bbpsTheme.colors.divider }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.groupTabsContent}
                >
                  {(planGroups.length > 0
                    ? planGroups
                    : [{ label: 'Recommended Packs', plans }]
                  ).map((group) => {
                    const selectedLabel = activeGroupLabel || planGroups[0]?.label || group.label;
                    const active = group.label === selectedLabel;

                    return (
                      <TouchableOpacity
                        key={group.label}
                        style={[styles.groupTab, active && styles.activeGroupTab]}
                        activeOpacity={0.8}
                        onPress={() => setActiveGroupLabel(group.label)}
                      >
                        <Text style={[styles.groupTabText, active && styles.activeGroupTabText]}>
                          {group.label}
                        </Text>
                        {active && <View style={styles.activeTabUnderline} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {!selectedLocation ? (
                <View style={styles.emptyState}>
                  <Icon name="map-marker-radius-outline" size={40} color="#D8CFFB" />
                  <Text style={styles.emptyText}>Select a circle to view plans</Text>
                </View>
              ) : plansLoading ? (
                <View style={styles.loadingPlans}>
                  <ActivityIndicator color="#8665FF" />
                  <Text style={styles.loadingText}>Loading plans...</Text>
                </View>
              ) : filteredPlans.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="package-variant" size={40} color="#D8CFFB" />
                  <Text style={styles.emptyText}>No recharge plans found</Text>
                </View>
              ) : (
                filteredPlans.map((plan, index) => (
                  <TouchableOpacity
                    key={`${getPlanId(plan) || getPlanAmount(plan)}-${index}`}
                    activeOpacity={0.9}
                    style={[styles.planCard, { backgroundColor: bbpsTheme.colors.surface, borderColor: bbpsTheme.colors.border }]}
                    onPress={() => handlePlanPress(plan)}
                  >
                    <View style={styles.planCardTop}>
                      <View style={styles.planPriceBlock}>
                        <Text style={styles.planCurrency}>₹</Text>
                        <Text style={styles.planPriceText}>{getPlanAmount(plan)}</Text>
                      </View>

                      <View style={styles.planFacts}>
                        {getPlanData(plan) !== '-' && (
                          <View style={styles.planFactRow}>
                            <Text style={[styles.planFactLabel, { color: bbpsTheme.colors.text }]}>Data</Text>
                            <Text style={[styles.planFactValue, { color: bbpsTheme.colors.text }]}>{getPlanData(plan)}</Text>
                          </View>
                        )}
                        <View style={styles.planFactRow}>
                          <Text style={[styles.planFactLabel, { color: bbpsTheme.colors.text }]}>Validity</Text>
                          <Text style={[styles.planFactValue, { color: bbpsTheme.colors.text }]}>{getPlanValidity(plan)}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.planArrowButton, { backgroundColor: bbpsTheme.colors.iconBg }]}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel={`Recharge with ₹${getPlanAmount(plan)} plan`}
                        onPress={(event) => {
                          event.stopPropagation();
                          handlePlanPress(plan, true);
                        }}
                      >
                        <MaterialIcons name="chevron-right" size={24} color={bbpsTheme.colors.primary} />
                      </TouchableOpacity>
                    </View>
                    {getPlanDescription(plan) ? (
                      <View style={[styles.planDescriptionRow, { backgroundColor: bbpsTheme.colors.surfaceAlt, borderTopColor: bbpsTheme.colors.divider }]}>
                        <Text style={[styles.planDescription, { color: bbpsTheme.colors.muted }]} numberOfLines={2}>
                          {getPlanDescription(plan)}
                        </Text>
                        <MaterialIcons name="chevron-right" size={20} color={bbpsTheme.colors.muted} />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>

    <Modal
      visible={locationModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setLocationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Circle</Text>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
              <Icon name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalSearchContainer}>
            <Icon name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search circle..."
              placeholderTextColor="#9CA3AF"
              value={locationSearch}
              onChangeText={setLocationSearch}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#8665FF" style={styles.modalLoader} />
          ) : (
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.operator_location_id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected =
                  selectedLocation?.operator_location_id === item.operator_location_id;

                return (
                  <TouchableOpacity
                    style={[styles.locationItem, selected && styles.locationItemSelected]}
                    onPress={() => {
                      setSelectedLocation(item);
                      setLocationModalVisible(false);
                      setLocationSearch('');
                    }}
                  >
                    <View style={styles.locationItemLeft}>
                      <View style={styles.locationAbbrevBadge}>
                        <Text style={styles.locationAbbrevText}>
                          {item.abbreviation?.substring(0, 2).toUpperCase() || '??'}
                        </Text>
                      </View>
                      <Text style={styles.locationName}>{item.operator_location_name}</Text>
                    </View>
                    {selected && <Icon name="check-circle" size={20} color="#8665FF" />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.emptyText}>No circles found</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  outerContainer: { paddingVertical: 16, backgroundColor: '#F8F7FF' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { paddingHorizontal: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  cardWrapper: { paddingHorizontal: 16, marginBottom: 16 },
  cardContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#EDEDED', elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8,
  },
  leftContent: { flex: 1 },
  plansSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  circleSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECE7FF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  circleSummaryLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 },
  circleBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#8665FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  circleSummaryLabel: { fontSize: 11, color: '#9CA3AF' },
  circleSummaryName: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginTop: 1 },
  changeCircleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3EFFF',
  },
  changeCircleText: { color: '#5B47A3', fontWeight: '700', fontSize: 13 },
  circleDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    backgroundColor: '#FAF9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E0FA',
    paddingHorizontal: 16,
    height: 64,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  circleDropdownSelected: {
    borderColor: '#8665FF',
    backgroundColor: '#F5F0FF',
  },
  circleDropdownText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#1F2937' },
  circleDropdownPlaceholder: { flex: 1, fontSize: 15, color: '#C4B8F5' },
  circleHintText: { fontSize: 12, color: '#B0A8D4', marginTop: 8, marginHorizontal: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 16,
    maxHeight: '75%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F7FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E0FA',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  modalSearchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  modalLoader: { marginTop: 32 },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1FC',
  },
  locationItemSelected: { backgroundColor: '#F5F0FF', borderRadius: 10, paddingHorizontal: 8 },
  locationItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  locationAbbrevBadge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EDE9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationAbbrevText: { fontSize: 12, fontWeight: '800', color: '#8665FF' },
  locationName: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  searchSection: { paddingHorizontal: 16, marginTop: 8, backgroundColor: '#FFFFFF', paddingTop: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAF9FF', borderRadius: 14,
    borderWidth: 1, borderColor: '#ECE7FF', paddingHorizontal: 16, height: 52,
    shadowColor: '#5B47A3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#111827' },
  tabContainer: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginTop: 16, backgroundColor: '#FFFFFF' },
  groupTabsContent: { paddingHorizontal: 16 },
  groupTab: { marginRight: 16, paddingBottom: 8, minHeight: 32, justifyContent: 'center' },
  activeGroupTab: {},
  groupTabText: { fontSize: 15, fontWeight: '700', color: '#9CA3AF' },
  activeGroupTabText: { color: '#374151' },
  activeTab: { marginRight: 16, paddingBottom: 8 },
  activeTabText: { fontSize: 15, fontWeight: '700', color: '#374151' },
  activeTabUnderline: { height: 3, borderRadius: 2, backgroundColor: '#8665FF', position: 'absolute', bottom: 0, left: 0, right: 0 },
  planCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0EDFB',
    overflow: 'hidden',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },
  planCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  planPriceBlock: { flexDirection: 'row', alignItems: 'flex-start', width: '30%' },
  planCurrency: { fontSize: 16, fontWeight: '700', color: '#5B47A3', marginTop: 2, marginRight: 2 },
  planPriceText: { fontSize: 26, fontWeight: '800', color: '#5B47A3' },
  planFacts: { flex: 1, gap: 8 },
  planFactRow: { flexDirection: 'row', alignItems: 'center' },
  planFactLabel: { width: 72, fontSize: 14, fontWeight: '700' },
  planFactValue: { flex: 1, fontSize: 14, fontWeight: '500' },
  planArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  planTagsRow: { flexDirection: 'row', gap: 8 },
  planTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3EFFF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  planTagText: { fontSize: 12, fontWeight: '700', color: '#5B47A3' },
  planDescriptionRow: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planDescription: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyState: { padding: 32, alignItems: 'center', gap: 8 },
  emptyText: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
  loadingPlans: { padding: 24, alignItems: 'center' },
  loadingText: { color: '#6B7280', marginTop: 8 },
  skeletonGapSm: { marginTop: 8 },
});

export default RechargeSection;
