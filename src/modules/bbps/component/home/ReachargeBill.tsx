import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { SvgProps } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

// Asset Imports
import Recharge from '../../assets/BBPS_Service/Recharge.svg';
import DTH from '../../assets/BBPS_Service/DTH.svg';
import Subscriptions from '../../assets/BBPS_Service/Subscriptions.svg';
import FASTagRecharge from '../../assets/BBPS_Service/FASTagRecharge.svg';
import Electricity from '../../assets/BBPS_Service/Electricity.svg';
import water from '../../assets/BBPS_Service/Water.svg';
import PipedGas from '../../assets/BBPS_Service/solid.svg';
import LPGCylender from '../../assets/BBPS_Service/LPG.svg';
import Landline from '../../assets/BBPS_Service/LandLine.svg';
import Broadband from '../../assets/BBPS_Service/Broadband.svg';
import MobilePostpaid from '../../assets/BBPS_Service/Recharge.svg';
import Credit from '../../assets/BBPS_Service/Creadit.svg';
import Loan from '../../assets/BBPS_Service/Loan_Emi.svg';
import Insurance from '../../assets/BBPS_Service/Insurance.svg';
import Tax from '../../assets/BBPS_Service/Tax.svg';
import Housing from '../../assets/BBPS_Service/Housing_Socity.svg';
import Municipal from '../../assets/BBPS_Service/Munsiple_taxes.svg';
import Education from '../../assets/BBPS_Service/Education.svg';
import Hospital from '../../assets/BBPS_Service/Hospital_bill.svg';
import { BillCategory, fetchBillsCategories } from '../../api/BillsAPI';

type RasterIcon = number;
type SvgIconComponent = React.FC<SvgProps>;
type VectorIconAsset = {
  type: 'vector';
  name: string;
};
type IconAsset = RasterIcon | SvgIconComponent | VectorIconAsset;
const isImageIcon = (icon: IconAsset): icon is RasterIcon => typeof icon === 'number';
const isVectorIcon = (icon: IconAsset): icon is VectorIconAsset =>
  typeof icon === 'object' && icon !== null && 'type' in icon && icon.type === 'vector';
const isSvgIcon = (icon: IconAsset): icon is SvgIconComponent =>
  typeof icon === 'function' && !isVectorIcon(icon);

type BbpsTheme = ReturnType<typeof useBbpsTheme>;

const ServiceItem = ({
  icon,
  label,
  onPress,
  bbpsTheme,
}: {
  icon: IconAsset;
  label: string;
  onPress?: () => void;
  bbpsTheme: BbpsTheme;
}) => {
  const SvgIcon = isSvgIcon(icon) ? icon : null;

  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.75} onPress={onPress}>
      <LinearGradient
        colors={bbpsTheme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconCircle}
      >
        {SvgIcon ? (
          <SvgIcon width={30} height={30} />
        ) : isVectorIcon(icon) ? (
          <MaterialCommunityIcons name={icon.name} size={27} color="#FFFFFF" />
        ) : isImageIcon(icon) ? (
          <Image source={icon} style={styles.iconImage} resizeMode="contain" />
        ) : null}
      </LinearGradient>
      <Text numberOfLines={2} style={[styles.itemLabel, { color: bbpsTheme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
};

const SECTION_ORDER = [
  'RECHARGES',
  'UTILITIES',
  'FINANCIAL SERVICES',
  'HOUSING, EDUCATION & HEALTH',
  'OTHER SERVICES',
] as const;

type SectionName = (typeof SECTION_ORDER)[number];

const CATEGORY_DISPLAY_ORDER: Record<SectionName, string[]> = {
  RECHARGES: ['Mobile Prepaid', 'DTH', 'Subscription', 'FASTag'],
  UTILITIES: [
    'Electricity',
    'Water',
    'Gas',
    'LPG Cylinder',
    'Landline Postpaid',
    'Broadband Postpaid',
    'Mobile Postpaid',
  ],
  'FINANCIAL SERVICES': ['Credit Card', 'Loan', 'Insurance', 'Tax'],
  'HOUSING, EDUCATION & HEALTH': ['Housing Society', 'Municipal Taxes', 'Education', 'Hospital'],
  'OTHER SERVICES': [
    'Clubs and Associations',
    'Cable TV',
    'Municipal Services',
    'Rental Payment',
    'eChallan',
    'Agent Collection',
    'Fleet Card Recharge',
    'EV Recharge',
  ],
};

const CATEGORY_GROUPS: Record<string, SectionName> = Object.entries(CATEGORY_DISPLAY_ORDER).reduce(
  (acc, [section, names]) => {
    names.forEach((name) => {
      acc[name] = section as SectionName;
    });
    return acc;
  },
  {} as Record<string, SectionName>,
);

const ICON_MAP: Record<string, IconAsset> = {
  'Mobile Prepaid': Recharge,
  DTH,
  Subscription: Subscriptions,
  Subscriptions,
  FASTag: FASTagRecharge,
  'Cable TV': Subscriptions,

  Electricity,
  Water: water,
  Gas: PipedGas,
  'LPG Cylinder': LPGCylender,
  'Broadband Postpaid': Broadband,
  'Landline Postpaid': Landline,
  'Mobile Postpaid': MobilePostpaid,

  'Credit Card': Credit,
  Loan,
  Insurance,
  Tax,


  'Housing Society': Housing,
  Education,
  Hospital,
  'Municipal Taxes': Municipal,
  'Municipal Services': Municipal,
  'Rental Payment': Housing,
  eChallan: { type: 'vector', name: 'file-document-outline' },
  'Agent Collection': { type: 'vector', name: 'account-cash-outline' },
  'Fleet Card Recharge': { type: 'vector', name: 'card-account-details-outline' },
  'EV Recharge': { type: 'vector', name: 'ev-station' },
  'Clubs and Associations': Subscriptions,
};

const FALLBACK_ICON: IconAsset = Recharge;
const BILL_CATEGORIES_QUERY_KEY = ['bbps', 'bill-categories'] as const;
const BILL_CATEGORIES_STALE_TIME = 10 * 60 * 1000;

const normalizeCategoryName = (name?: string) => String(name || '').trim();

const getCategorySection = (name: string): SectionName => {
  const knownSection = CATEGORY_GROUPS[name];
  if (knownSection) {
    return knownSection;
  }

  const lower = name.toLowerCase();

  if (
    lower.includes('mobile') ||
    lower.includes('dth') ||
    lower.includes('fastag') ||
    lower.includes('recharge') ||
    lower.includes('cable') ||
    lower.includes('subscription')
  ) {
    return 'RECHARGES';
  }

  if (
    lower.includes('electric') ||
    lower.includes('water') ||
    lower.includes('gas') ||
    lower.includes('landline') ||
    lower.includes('broadband') ||
    lower.includes('lpg')
  ) {
    return 'UTILITIES';
  }

  if (
    lower.includes('credit') ||
    lower.includes('loan') ||
    lower.includes('insurance') ||
    lower.includes('tax') ||
    lower.includes('challan')
  ) {
    return 'FINANCIAL SERVICES';
  }

  if (
    lower.includes('housing') ||
    lower.includes('municipal') ||
    lower.includes('education') ||
    lower.includes('hospital') ||
    lower.includes('rental')
  ) {
    return 'HOUSING, EDUCATION & HEALTH';
  }

  return 'OTHER SERVICES';
};

const categoryRank = (section: SectionName, name: string) => {
  const index = CATEGORY_DISPLAY_ORDER[section].indexOf(name);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
};

const RechargeBillSkeleton = ({ bbpsTheme }: { bbpsTheme: BbpsTheme }) => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [shimmerAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.skeletonTitle, { backgroundColor: bbpsTheme.colors.skeleton, opacity: shimmerAnim }]} />
      <Animated.View style={[styles.skeletonSearch, { backgroundColor: bbpsTheme.colors.skeleton, opacity: shimmerAnim }]} />

      {[0, 1].map((section) => (
        <View
          key={section}
          style={[
            styles.sectionContainer,
            {
              backgroundColor: bbpsTheme.colors.surface,
              borderColor: bbpsTheme.colors.border,
              shadowColor: bbpsTheme.colors.shadow,
            },
          ]}
        >
          <Animated.View style={[styles.skeletonSectionHeader, { backgroundColor: bbpsTheme.colors.skeleton, opacity: shimmerAnim }]} />
          <View style={styles.grid}>
            {[0, 1, 2, 3].map((item) => (
              <View style={styles.itemContainer} key={item}>
                <Animated.View style={[styles.skeletonCircle, { backgroundColor: bbpsTheme.colors.skeleton, opacity: shimmerAnim }]} />
                <Animated.View style={[styles.skeletonLabel, { backgroundColor: bbpsTheme.colors.skeleton, opacity: shimmerAnim }]} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

function RechargeBill() {
  const navigation = useNavigation<any>();
  const bbpsTheme = useBbpsTheme();
  const ui = bbpsTheme.isDark
    ? {
      card: '#0B0A0D', nested: '#151219', border: '#29242F',
      divider: '#25212B', text: '#FFFFFF', muted: '#918A9B', subtle: '#77717E',
      feature: ['#18131E', '#0C0B0E'] as [string, string],
      featureAlt: ['#151219', '#0B0A0D'] as [string, string],
      rowIcon: '#17151A', rowIconBorder: '#2B2730', arrow: '#A49CAB',
      hero: ['#120A20', '#352052', '#684096', '#1C1029'] as [string, string, string, string],
      heroText: '#FFFFFF', heroMuted: 'rgba(246,239,255,0.82)', heroAccent: '#E4C7FF',
      heroBorder: 'rgba(220,195,239,0.18)',
    }
    : {
      card: '#FFFFFF', nested: '#F8F6FC', border: '#E7E1F0',
      divider: '#ECE7F2', text: '#17131D', muted: '#716A7A', subtle: '#948D9D',
      feature: ['#FFFFFF', '#F5F0FC'] as [string, string],
      featureAlt: ['#FFFFFF', '#F7F3FC'] as [string, string],
      rowIcon: '#F4F0F8', rowIconBorder: '#E5DDED', arrow: '#817989',
      hero: ['#7953B5', '#68439F', '#9868C2', '#70479E'] as [string, string, string, string],
      heroText: '#FFFFFF', heroMuted: 'rgba(255,255,255,0.82)', heroAccent: '#F0DFFF',
      heroBorder: '#A985CC',
    };
  const { data: categories = [], isLoading: loading } = useQuery({
    queryKey: BILL_CATEGORIES_QUERY_KEY,
    queryFn: fetchBillsCategories,
    staleTime: BILL_CATEGORIES_STALE_TIME,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const groupedData = useMemo(() => {
    const baseGroups: Record<SectionName, BillCategory[]> = {
      RECHARGES: [],
      UTILITIES: [],
      'FINANCIAL SERVICES': [],
      'HOUSING, EDUCATION & HEALTH': [],
      'OTHER SERVICES': [],
    };

    categories.forEach((item) => {
      if (String(item?.status) !== '1') {
        return;
      }

      const categoryName = normalizeCategoryName(item.operator_category_name);
      if (!categoryName) {
        return;
      }

      const section = getCategorySection(categoryName);
      baseGroups[section].push({
        ...item,
        operator_category_name: categoryName,
      });
    });

    SECTION_ORDER.forEach((section) => {
      baseGroups[section].sort((a, b) => {
        const rankDiff =
          categoryRank(section, a.operator_category_name) -
          categoryRank(section, b.operator_category_name);

        if (rankDiff !== 0) {
          return rankDiff;
        }

        return a.operator_category_id - b.operator_category_id;
      });
    });

    return baseGroups;
  }, [categories]);

  const allCategories = SECTION_ORDER.flatMap((section) => groupedData[section]);
  const featuredCategories = [
    allCategories.find((item) => item.operator_category_name === 'Credit Card'),
    allCategories.find((item) => item.operator_category_name === 'Mobile Prepaid'),
    allCategories.find((item) => item.operator_category_name === 'Mobile Postpaid'),
  ].filter((item): item is BillCategory => Boolean(item));

  const openCategory = (item: BillCategory) =>
    navigation.navigate('BillerSelectScreen', {
      categoryId: item.operator_category_id,
      categoryName: item.operator_category_name,
    });

  if (loading) {
    return <RechargeBillSkeleton bbpsTheme={bbpsTheme} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={ui.hero}
        locations={[0, 0.3, 0.64, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[
          styles.heroContainer,
          {
            borderColor: ui.heroBorder,
            shadowColor: bbpsTheme.isDark ? '#000000' : '#76539B',
          },
        ]}
      >
        <View style={styles.heroContent}>
          <Text style={[styles.mainTitle, { color: ui.heroText, textShadowColor: bbpsTheme.isDark ? 'rgba(0,0,0,0.24)' : 'rgba(59,29,84,0.28)' }]}>Everything due,</Text>
          <Text style={[styles.heroScript, { color: ui.heroText }]}>all in one place.</Text>
          <View style={[styles.heroReceipt, { backgroundColor: bbpsTheme.isDark ? 'rgba(255,255,255,0.12)' : '#E8D8F4' }]}>
            <LinearGradient colors={bbpsTheme.isDark ? ['#C49BE8', '#704096'] : ['#DCC3EF', '#704096']} style={styles.heroReceiptInner}>
              <MaterialCommunityIcons name="wallet-outline" size={36} color="#FFFFFF" />
            </LinearGradient>
          </View>
        </View>
        <View style={[styles.heroAccentLine, { backgroundColor: bbpsTheme.isDark ? '#C49BE8' : '#704096' }]} />
      </LinearGradient>

      {featuredCategories.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.quickHeader}>
            <View style={styles.headingWithAccent}>
              <View style={[styles.headingAccent, { backgroundColor: bbpsTheme.colors.primary }]} />
              <Text style={[styles.sectionDisplayTitle, { color: ui.text, marginBottom: 0 }]}>Quick pay</Text>
            </View>
          </View>
          <View style={styles.featuredGrid}>
            {featuredCategories.map((item, index) => {
              const Icon = ICON_MAP[item.operator_category_name] || FALLBACK_ICON;
              const SvgIcon = isSvgIcon(Icon) ? Icon : Recharge;
              return (
                <TouchableOpacity key={item.operator_category_id} activeOpacity={0.82} style={[styles.quickCard, { borderColor: ui.border }]} onPress={() => openCategory(item)}>
                  <LinearGradient colors={index === 1 ? ui.featureAlt : ui.feature} style={styles.quickCardFill}>
                    <LinearGradient
                      colors={index === 0 ? ['#8D5ED1', '#704096'] : index === 1 ? ['#A884E1', '#7950B6'] : ['#DB83B2', '#AA477D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.quickIcon}
                    >
                      <SvgIcon width={27} height={27} />
                    </LinearGradient>
                    <Text numberOfLines={2} style={[styles.quickCardTitle, { color: ui.text }]}>{item.operator_category_name}</Text>
                    <View style={[styles.quickCardAccent, { backgroundColor: index === 0 ? '#704096' : index === 1 ? '#8D5ED1' : '#C05A91' }]} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View
        style={[
          styles.directoryCard,
          {
            backgroundColor: ui.card,
            borderColor: ui.border,
            shadowColor: bbpsTheme.colors.shadow,
          },
        ]}
      >
        <View style={styles.directoryHeading}>
          <View style={styles.headingWithAccent}>
            <View style={[styles.headingAccent, { backgroundColor: bbpsTheme.colors.primary }]} />
            <View>
              <Text style={[styles.directoryTitle, { color: ui.text }]}>All bill payments</Text>
              <Text style={[styles.directorySubtitle, { color: ui.muted }]}>Choose a category to continue</Text>
            </View>
          </View>
        </View>

        <View style={[styles.allServicesGrid, { borderTopColor: ui.divider }]}>
          <View style={styles.grid}>
            {allCategories.map((item) => (
              <ServiceItem
                key={item.operator_category_id}
                icon={ICON_MAP[item.operator_category_name] || FALLBACK_ICON}
                label={item.operator_category_name}
                bbpsTheme={bbpsTheme}
                onPress={() => openCategory(item)}
              />
            ))}
          </View>
        </View>

        {allCategories.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify-close" size={32} color={ui.subtle} />
            <Text style={[styles.emptyTitle, { color: ui.text }]}>No service found</Text>
            <Text style={[styles.emptyText, { color: ui.muted }]}>Try a different category or service name.</Text>
          </View>
        )}
      </View>

      <View style={styles.benefitsSection}>
        <View style={[styles.headingWithAccent, { marginBottom: 14 }]}>
          <View style={[styles.headingAccent, { backgroundColor: bbpsTheme.colors.primary }]} />
          <Text style={[styles.sectionDisplayTitle, { color: ui.text, marginBottom: 0 }]}>Payment benefits</Text>
        </View>
        <LinearGradient
          colors={bbpsTheme.isDark ? ['#241630', '#3D2452'] : ['#F3E9FA', '#E8D8F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.benefitCard, { borderColor: bbpsTheme.isDark ? '#513568' : '#D5BCE5' }]}
        >
          <View style={styles.benefitRow}>
            <View style={styles.benefitIconWrap}>
              <LinearGradient colors={bbpsTheme.gradients.primary} style={styles.benefitIconGradient}>
                <MaterialCommunityIcons name="gift-outline" size={27} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitTitle, { color: bbpsTheme.isDark ? '#FFFFFF' : '#33213F' }]}>Earn reward points</Text>
              <Text style={[styles.benefitDescription, { color: bbpsTheme.isDark ? '#CDBED5' : '#725E7D' }]}>Points are credited after every successful transaction.</Text>
            </View>
          </View>
          <View style={[styles.benefitDivider, { backgroundColor: bbpsTheme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(112,64,150,0.12)' }]} />
          <View style={styles.benefitRow}>
            <View style={styles.benefitIconWrap}>
              <LinearGradient colors={bbpsTheme.gradients.primary} style={styles.benefitIconGradient}>
                <MaterialCommunityIcons name="cash-check" size={27} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.benefitContent}>
              <Text style={[styles.benefitTitle, { color: bbpsTheme.isDark ? '#FFFFFF' : '#33213F' }]}>No extra charges</Text>
              <Text style={[styles.benefitDescription, { color: bbpsTheme.isDark ? '#CDBED5' : '#725E7D' }]}>Pay only the bill amount with no additional fee.</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.othersSection}>
        <View style={[styles.headingWithAccent, { marginBottom: 12 }]}>
          <View style={[styles.headingAccent, { backgroundColor: bbpsTheme.colors.primary }]} />
          <Text style={[styles.sectionDisplayTitle, { color: ui.text, marginBottom: 0 }]}>Others</Text>
        </View>
        <TouchableOpacity style={[styles.otherRow, { borderBottomColor: ui.divider }]} onPress={() => navigation.navigate('OrderHistory')}>
          <View style={[styles.otherIcon, { backgroundColor: ui.rowIcon, borderColor: ui.rowIconBorder }]}><MaterialCommunityIcons name="receipt-text-outline" size={20} color={ui.text} /></View>
          <Text style={[styles.otherLabel, { color: ui.text }]}>Recharges & bill payment history</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={ui.arrow} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.otherRow, { borderBottomColor: ui.divider }]} onPress={() => navigation.navigate('HelpForm')}>
          <View style={[styles.otherIcon, { backgroundColor: ui.rowIcon, borderColor: ui.rowIconBorder }]}><MaterialCommunityIcons name="headset" size={20} color={ui.text} /></View>
          <Text style={[styles.otherLabel, { color: ui.text }]}>Help and support</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={ui.arrow} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 4,
  },
  heroContainer: {
    minHeight: 205,
    marginHorizontal: -16,
    marginTop: -12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 20,
    marginBottom: 0,
    overflow: 'hidden',
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '500',
    color: '#FFFFFF',
    letterSpacing: -1,
    textAlign: 'left',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroContent: { alignItems: 'flex-start', flex: 1, marginTop: 12, paddingRight: 82, justifyContent: 'center' },
  heroScript: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: -2 },
  heroReceipt: { position: 'absolute', right: -2, bottom: 18, width: 74, height: 84, borderRadius: 19, padding: 6, backgroundColor: 'rgba(255,255,255,0.12)', transform: [{ rotate: '5deg' }], shadowColor: '#3B1D54', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.24, shadowRadius: 10, elevation: 5 },
  heroReceiptInner: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroAccentLine: { position: 'absolute', width: 38, height: 4, borderRadius: 2, left: 20, bottom: 20, opacity: 0.85 },
  featuredSection: { marginTop: 30 },
  quickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headingWithAccent: { flexDirection: 'row', alignItems: 'center' },
  headingAccent: { width: 4, height: 24, borderRadius: 2, marginRight: 10 },
  quickSubtitle: { fontSize: 11.5, fontWeight: '500', marginTop: 3 },
  sectionDisplayTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
  featuredGrid: { flexDirection: 'row', gap: 9 },
  quickCard: { flex: 1, height: 128, borderRadius: 20, overflow: 'hidden', borderWidth: 1, shadowColor: '#5B47A3', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  quickCardFill: { flex: 1, padding: 12 },
  quickIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  quickCardTitle: { fontSize: 12, fontWeight: '700', lineHeight: 16, minHeight: 32 },
  quickCardAccent: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2, opacity: 0.75 },
  featuredLarge: { flex: 1.05, borderRadius: 21, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2630' },
  featuredSide: { flex: 0.95, gap: 10 },
  featuredSmall: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#2A2630' },
  featuredFill: { flex: 1, padding: 16, overflow: 'hidden' },
  featuredTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 24, maxWidth: 110 },
  featuredSmallTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 19, maxWidth: 90 },
  featuredArtLarge: { position: 'absolute', left: 25, bottom: 36, width: 100, height: 100, borderRadius: 26, backgroundColor: '#0C633D', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-9deg' }] },
  featuredArtSmall: { position: 'absolute', right: 18, bottom: 18, width: 55, height: 55, borderRadius: 17, backgroundColor: '#5B16B7', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '6deg' }] },
  featuredArrow: { position: 'absolute', right: 12, top: 12 },
  directoryCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingTop: 18,
    paddingHorizontal: 14,
    paddingBottom: 4,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
    marginTop: 28,
  },
  directoryHeading: { paddingHorizontal: 2, marginBottom: 16 },
  directoryTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  directorySubtitle: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  sectionContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 14,
  },
  allServicesGrid: { borderTopWidth: 1, paddingTop: 20, marginTop: 16 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  itemContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 3,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  iconImage: {
    width: 30,
    height: 30,
    tintColor: '#FFFFFF',
  },
  itemLabel: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 7,
    color: '#374151',
    fontWeight: '600',
    lineHeight: 14,
    minHeight: 28,
  },
  emptyState: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 14, fontWeight: '700', marginTop: 10 },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  benefitsSection: { marginTop: 30 },
  benefitCard: { borderRadius: 22, borderWidth: 1, padding: 16, overflow: 'hidden' },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitIconWrap: { width: 58, height: 58, borderRadius: 19, padding: 4, backgroundColor: 'rgba(255,255,255,0.22)', marginRight: 13 },
  benefitIconGradient: { flex: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  benefitContent: { flex: 1, paddingRight: 6 },
  benefitTitle: { fontSize: 15, fontWeight: '800', marginBottom: 5 },
  benefitDescription: { fontSize: 11.5, lineHeight: 17, fontWeight: '500' },
  benefitDivider: { height: 1, marginVertical: 14, marginLeft: 71 },
  othersSection: { marginTop: 30, marginBottom: 20 },
  otherRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#29262D' },
  otherIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#17151A', borderWidth: 1, borderColor: '#2B2730', alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  otherLabel: { flex: 1, color: '#F5F2F7', fontSize: 14, fontWeight: '600' },
  skeletonTitle: {
    height: 22,
    width: 180,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  skeletonSearch: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
  },
  skeletonSectionHeader: {
    height: 12,
    width: 130,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginBottom: 14,
  },
  skeletonCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E5E7EB',
  },
  skeletonLabel: {
    width: 54,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginTop: 9,
  },
});

export default RechargeBill;