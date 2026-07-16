import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SvgProps } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';

import PaymentTop from '../../../navbar/assete/Payment_BG.png';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { BillCategory, fetchBillsCategories } from '../api/BillsAPI';
import { useBbpsTheme } from '../utils/useBbpsTheme';
import Recharge from '../assets/BBPS_Service/Recharge.svg';
import DTH from '../assets/BBPS_Service/DTH.svg';
import Subscriptions from '../assets/BBPS_Service/Subscriptions.svg';
import FASTagRecharge from '../assets/BBPS_Service/FASTagRecharge.svg';
import Electricity from '../assets/BBPS_Service/Electricity.svg';
import Water from '../assets/BBPS_Service/Water.svg';
import PipedGas from '../assets/BBPS_Service/solid.svg';
import LPGCylender from '../assets/BBPS_Service/LPG.svg';
import Landline from '../assets/BBPS_Service/LandLine.svg';
import Broadband from '../assets/BBPS_Service/Broadband.svg';
import Credit from '../assets/BBPS_Service/Creadit.svg';
import Loan from '../assets/BBPS_Service/Loan_Emi.svg';
import Insurance from '../assets/BBPS_Service/Insurance.svg';
import Tax from '../assets/BBPS_Service/Tax.svg';
import Housing from '../assets/BBPS_Service/Housing_Socity.svg';
import Municipal from '../assets/BBPS_Service/Munsiple_taxes.svg';
import Education from '../assets/BBPS_Service/Education.svg';
import Hospital from '../assets/BBPS_Service/Hospital_bill.svg';

const MIN_SEARCH_LENGTH = 2;

type SvgIconComponent = React.FC<SvgProps>;
type VectorIconAsset = {
  type: 'vector';
  name: string;
};
type IconAsset = SvgIconComponent | VectorIconAsset;

const isVectorIcon = (icon: IconAsset): icon is VectorIconAsset =>
  typeof icon === 'object' && icon !== null && 'type' in icon && icon.type === 'vector';

const ICON_MAP: Record<string, IconAsset> = {
  'Mobile Prepaid': Recharge,
  DTH,
  Subscription: Subscriptions,
  Subscriptions,
  FASTag: FASTagRecharge,
  'Cable TV': Subscriptions,
  Electricity,
  Water,
  Gas: PipedGas,
  'LPG Cylinder': LPGCylender,
  'Broadband Postpaid': Broadband,
  'Landline Postpaid': Landline,
  'Mobile Postpaid': Recharge,
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

const getCategoryInitial = (name?: string) =>
  String(name || 'B').trim().charAt(0).toUpperCase();

const SearchResultIcon = ({ categoryName }: { categoryName: string }) => {
  const icon = ICON_MAP[categoryName];

  if (!icon) {
    return <Text style={styles.resultIconInitial}>{getCategoryInitial(categoryName)}</Text>;
  }

  if (isVectorIcon(icon)) {
    return <MaterialCommunityIcons name={icon.name} size={25} color="#FFFFFF" />;
  }

  const SvgIcon = icon;
  return <SvgIcon width={26} height={26} />;
};

function Search({ navigation }: any) {
  const bbpsTheme = useBbpsTheme();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<BillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  useEffect(() => {
    let active = true;

    fetchBillsCategories()
      .then((data) => {
        if (!active) return;
        setCategories(data.filter((item) => String(item.status) === '1'));
        setFailed(false);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const isSearchActive = query.length >= MIN_SEARCH_LENGTH;
  const results = useMemo(() => {
    if (!isSearchActive) return [];

    return categories.filter((item) =>
      [item.operator_category_name, item.operator_category_group]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [categories, isSearchActive, query]);

  const headerHeight = Math.round(width * 0.4);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bbpsTheme.colors.background }]} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { height: headerHeight }]}>
        <Image source={PaymentTop} style={styles.headerImage} resizeMode="cover" />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: bbpsTheme.colors.surface,
              borderColor: bbpsTheme.colors.border,
              shadowColor: bbpsTheme.colors.shadow,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={bbpsTheme.colors.primary} />
          <TextInput
            autoFocus
            value={search}
            onChangeText={setSearch}
            placeholder='Search "Electricity, DTH, FASTag…"'
            placeholderTextColor={bbpsTheme.colors.muted}
            returnKeyType="search"
            style={[styles.searchInput, { color: bbpsTheme.colors.text }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={bbpsTheme.colors.subtle} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isSearchActive && (
          <Text style={[styles.hint, { color: bbpsTheme.colors.subtle }]}>Type at least 2 characters to search bill payments</Text>
        )}

        {isSearchActive && loading && (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, index) => (
              <View key={index} style={styles.skeletonRow}>
                <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={10} />
                <View style={styles.skeletonText}>
                  <SkeletonBox pulse={pulse} width="72%" height={13} borderRadius={999} />
                  <SkeletonBox
                    pulse={pulse}
                    width="44%"
                    height={10}
                    borderRadius={999}
                    style={styles.skeletonGap}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {isSearchActive && !loading && failed && (
          <Text style={[styles.message, { color: bbpsTheme.colors.muted }]}>Unable to load bill-payment services right now.</Text>
        )}

        {isSearchActive && !loading && !failed && results.length === 0 && (
          <Text style={[styles.message, { color: bbpsTheme.colors.muted }]}>No bill-payment services found for “{search.trim()}”</Text>
        )}

        {isSearchActive && !loading && !failed && results.map((item) => (
          <TouchableOpacity
            key={item.operator_category_id}
            activeOpacity={0.8}
            style={[styles.resultRow, { borderBottomColor: bbpsTheme.colors.divider }]}
            onPress={() =>
              navigation.navigate('BillerSelectScreen', {
                categoryId: item.operator_category_id,
                categoryName: item.operator_category_name,
              })
            }
          >
            <LinearGradient
              colors={bbpsTheme.gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.resultIcon}
            >
              <SearchResultIcon categoryName={item.operator_category_name} />
            </LinearGradient>
            <View style={styles.resultText}>
              <Text style={[styles.resultTitle, { color: bbpsTheme.colors.text }]} numberOfLines={1}>
                {item.operator_category_name}
              </Text>
              <Text style={[styles.resultType, { color: bbpsTheme.colors.subtle }]} numberOfLines={1}>
                {item.operator_category_group || 'Payments & bills'}
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-top-left" size={20} color={bbpsTheme.colors.subtle} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  headerImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    left: 18,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    color: '#111827',
    fontSize: 14,
    textAlignVertical: 'center',
  },
  list: {
    flex: 1,
    marginTop: 4,
  },
  hint: {
    paddingHorizontal: 20,
    paddingTop: 28,
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
  },
  message: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    color: '#7A7A7A',
    fontSize: 14,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  resultIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconInitial: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  resultText: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitle: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  resultType: {
    marginTop: 2,
    color: '#999999',
    fontSize: 11,
    textTransform: 'capitalize',
  },
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonGap: {
    marginTop: 8,
  },
});

export default Search;
