import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';

import OrderItemCard from '../../../../modules/common/order/OrderItemCard';
import DeliveryDetailsCard from '../../../../modules/common/order/DeliveryDetailsCard';
import PriceDetailsCard from '../../../../modules/common/order/PriceDetailsCard';
import {
  getServiceCancellationDetails,
  getServiceInvoiceDetails,
  type ServiceCancellationDetails as CancellationDetails,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';
import type { ServiceItem as HomeServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import YouMayNeedServicesCarousel from '../constant/YouMayNeedServicesCarousel';
import RecommendedServicesCarousel from '../constant/RecommendedServicesCarousel';
import { useServicesTheme } from '../../utils/useServicesTheme';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceCancellationDetails'>;

const PURPLE = '#8665FF';
const PROMO_BANNER = require('../../assete/home/banner1.png');

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatStatus = (value?: string | null) => {
  if (!value) return 'Pending';
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const formatCurrency = (value?: number | null) =>
  `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;

const buildAddressLine = (address: CancellationDetails['address']) => {
  if (!address) return '';

  return [
    address.address1,
    address.address2,
    address.landmark,
    address.city,
    address.state,
    address.zipcode,
  ]
    .filter(Boolean)
    .join(', ');
};

const normalizeName = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ');

export default function ServiceCancellationDetails() {
  const navigation = useNavigation<Nav>();
  const servicesTheme = useServicesTheme();
  const route = useRoute<RouteT>();
  const { service_order_id, parent_order_id, service_id } = route.params;

  const [details, setDetails] = useState<CancellationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [error, setError] = useState('');
  const { data: homeData } = useServiceHome();

  const homeServices = useMemo((): HomeServiceItem[] => {
    if (!Array.isArray(homeData?.data)) return [];

    const quickServices = homeData.data.find(
      section => section.section_key === 'quick_services'
    )?.items as HomeServiceItem[] | undefined;

    const allServices = homeData.data.flatMap(section =>
      Array.isArray(section.items) ? section.items : []
    ) as HomeServiceItem[];

    return [...(quickServices || []), ...allServices];
  }, [homeData]);

  const fetchDetails = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');

      const res = await getServiceCancellationDetails(service_order_id);
      if (!res.success || !res.data) {
        setError(res.message || 'Unable to load cancellation details.');
        return;
      }

      setDetails(res.data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load cancellation details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [service_order_id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails(true);
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceDownloading(true);
      const res = await getServiceInvoiceDetails(parent_order_id);

      if (res.success === false) {
        Alert.alert('Invoice unavailable', res.message || 'Unable to find invoice for this order.');
        return;
      }

      await Share.open({
        title: 'Download Invoice',
        url: `data:application/pdf;base64,${res.base64}`,
        type: 'application/pdf',
        filename: res.fileName.replace(/\.pdf$/i, ''),
        failOnCancel: false,
        saveToFiles: Platform.OS === 'ios',
        ...(Platform.OS === 'android' ? ({ useInternalStorage: true } as Record<string, unknown>) : {}),
      });
    } catch (err: any) {
      Alert.alert(
        'Download failed',
        err?.message || 'Unable to download invoice. Please try again.'
      );
    } finally {
      setInvoiceDownloading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
        <Header
          title="Order Details"
          onBack={() => navigation.goBack()}
          onHelp={() => navigation.navigate('HelpForm')}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={servicesTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: servicesTheme.colors.muted }]}>Loading cancellation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !details) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
        <Header
          title="Order Details"
          onBack={() => navigation.goBack()}
          onHelp={() => navigation.navigate('HelpForm')}
        />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={46} color="#DC2626" />
          <Text style={[styles.errorText, { color: servicesTheme.colors.muted }]}>{error || 'Cancellation details not found.'}</Text>
          <TouchableOpacity style={[styles.retryBtn, { backgroundColor: servicesTheme.colors.primary }]} onPress={() => fetchDetails()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const service = details.service;
  const matchedHomeService = homeServices.find(item => {
    const orderName = normalizeName(service.service_name);
    const orderTitle = normalizeName(service.title);
    const itemName = normalizeName(item.name);
    const itemTitle = normalizeName(item.title);

    return (
      (!!orderName && (itemName === orderName || itemTitle === orderName)) ||
      (!!orderTitle && (itemName === orderTitle || itemTitle === orderTitle))
    );
  });
  const reorderServiceId = Number(
    service_id || service.service_id || matchedHomeService?.service_id || 0
  );
  const cancellation = details.cancellation;
  const timeline = details.timeline.length
    ? details.timeline
    : [
        {
          label: 'Cancellation Requested',
          event: 'cancellation_requested',
          date: cancellation?.created_at,
        },
      ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]}>
      <Header
        title="Order Details"
        onBack={() => navigation.goBack()}
        onHelp={() => navigation.navigate('HelpForm')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[servicesTheme.colors.primary]}
            tintColor={servicesTheme.colors.primary}
          />
        }
      >
        <OrderItemCard
          image={
            service.image_url ? (
              <Image source={{ uri: service.image_url }} style={styles.productImage} />
            ) : (
              <MaterialCommunityIcons name="file-document-outline" size={34} color={PURPLE} />
            )
          }
          title={service.service_name || 'Service'}
          weight={service.variant_name || service.title || 'Service cancellation'}
          orderId={details.order_ref || parent_order_id}
        />

        <TouchableOpacity
          style={[styles.reorderButton, { borderColor: servicesTheme.colors.primary }]}
          activeOpacity={0.82}
          onPress={() => {
            if (Number.isFinite(reorderServiceId) && reorderServiceId > 0) {
              navigation.navigate('ServiceDescription', {
                serviceId: reorderServiceId,
                title: matchedHomeService?.name || service.service_name,
              });
              return;
            }

            Alert.alert(
              'Service unavailable',
              'Unable to find the original service for this order.'
            );
          }}
        >
          <Text style={[styles.reorderText, { color: servicesTheme.colors.primary }]}>Reorder</Text>
        </TouchableOpacity>

        <View style={[styles.cancellationCard, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
          <Text style={styles.cancelledTitle}>Order Cancelled</Text>

          {timeline.map((step, index) => (
            <View key={`${step.event}-${index}`} style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#22C55E" />
              </View>
              <Text style={[styles.timelineLabel, { color: servicesTheme.colors.text }]}>{step.label}</Text>
              <Text style={[styles.timelineDate, { color: servicesTheme.colors.muted }]}>{formatDate(step.date) || 'Update pending'}</Text>
            </View>
          ))}

          <Text style={[styles.totalRefund, { color: servicesTheme.colors.textStrong }]}>
            Total Refund- {formatCurrency(details.refund.total || cancellation?.refund_amount)}
          </Text>

          <RefundStatusRow
            icon="bank-outline"
            amount={formatCurrency(details.refund.money_refund)}
            label="Refund to Card"
            status={formatStatus(cancellation?.refund_status || 'pending')}
          />
          <RefundStatusRow
            icon="star-four-points-outline"
            amount={details.refund.coin_refund.toLocaleString('en-IN')}
            label="Reward Coins Reversed"
            status={details.refund.coin_refund > 0 ? 'Completed' : 'Pending'}
          />
        </View>

        {details.address ? (
          <DeliveryDetailsCard
            addressType={details.address.address_type?.toUpperCase() || 'HOME'}
            address={buildAddressLine(details.address)}
            name={details.address.contact_name || ''}
            phone={details.address.contact_phone || ''}
          />
        ) : null}

        <PriceDetailsCard
          itemTotal={details.summary.service_total}
          deliveryFee={0}
          bagDiscount={0}
          rewardDiscount={details.rewards.used}
          orderTotal={details.summary.order_total}
          rewardEarned={0}
          rewardRedeemed={details.rewards.used}
          paymentMethod="Online"
        />

        <InvoiceDownloadRow
          downloading={invoiceDownloading}
          onDownload={handleDownloadInvoice}
        />

        <View style={styles.bannerWrap}>
          <Image source={PROMO_BANNER} style={styles.bannerImage} resizeMode="cover" />
        </View>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <YouMayNeedServicesCarousel />
        <RecommendedServicesCarousel
          title="Top Picks for You"
          subtitle="Popular services customers choose next"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  title,
  onBack,
  onHelp,
}: {
  title: string;
  onBack: () => void;
  onHelp: () => void;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.header, { backgroundColor: servicesTheme.colors.surface, borderBottomColor: servicesTheme.colors.divider }]}>
      <TouchableOpacity
        style={styles.headerBack}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={30} color={servicesTheme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: servicesTheme.colors.textStrong }]}>{title}</Text>
      <TouchableOpacity activeOpacity={0.85} onPress={onHelp} style={[styles.helpBtn, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}>
        <MaterialCommunityIcons
          name="chat-outline"
          size={16}
          color="#EC4899"
          style={styles.helpIcon}
        />
        <Text style={styles.helpText}>Help</Text>
      </TouchableOpacity>
    </View>
  );
}

function RefundStatusRow({
  icon,
  amount,
  label,
  status,
}: {
  icon: string;
  amount: string;
  label: string;
  status: string;
}) {
  const servicesTheme = useServicesTheme();
  const completed = status.toLowerCase() === 'completed';

  return (
    <View style={[styles.refundRow, { backgroundColor: servicesTheme.colors.surfaceAlt }]}>
      <View style={styles.refundIcon}>
        <MaterialCommunityIcons name={icon} size={16} color={servicesTheme.colors.muted} />
      </View>
      <Text style={[styles.refundAmount, { color: servicesTheme.colors.text }]}>{amount}</Text>
      <Text style={[styles.refundLabel, { color: servicesTheme.colors.muted }]}>{label}</Text>
      <View style={[
        styles.refundStatusChip,
        { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border },
        completed && styles.refundStatusComplete,
      ]}>
        <Text style={[styles.refundStatusText, { color: servicesTheme.colors.muted }, completed && styles.refundStatusCompleteText]}>
          {status}
        </Text>
      </View>
    </View>
  );
}

function InvoiceDownloadRow({
  downloading,
  onDownload,
}: {
  downloading: boolean;
  onDownload: () => void;
}) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.invoiceRow, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
      <Text style={[styles.invoiceText, { color: servicesTheme.colors.text }]}>Save a copy of your order</Text>
      <TouchableOpacity
        style={styles.invoiceAction}
        activeOpacity={0.75}
        onPress={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={servicesTheme.colors.primary} />
        ) : (
          <Text style={[styles.invoiceActionText, { color: servicesTheme.colors.primary }]}>Download Invoice</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E4E4',
    backgroundColor: '#FFFFFF',
  },
  headerBack: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  helpIcon: {
    marginRight: 4,
  },
  helpText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EC4899',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  reorderButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  reorderText: {
    fontSize: 14,
    fontWeight: '700',
    color: PURPLE,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: PURPLE,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  cancellationCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 16,
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 12,
  },
  timelineRow: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineRail: {
    width: 24,
  },
  timelineLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  timelineDate: {
    marginLeft: 8,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalRefund: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#374151',
  },
  refundRow: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F7F5FF',
    paddingHorizontal: 10,
    marginTop: 8,
  },
  refundIcon: {
    width: 22,
  },
  refundAmount: {
    minWidth: 48,
    fontSize: 12,
    fontWeight: '800',
    color: '#4B5563',
  },
  refundLabel: {
    flex: 1,
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  refundStatusChip: {
    minWidth: 78,
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refundStatusComplete: {
    borderColor: '#86EFAC',
    backgroundColor: '#DCFCE7',
  },
  refundStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  refundStatusCompleteText: {
    color: '#16A34A',
  },
  invoiceRow: {
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  invoiceText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  invoiceAction: {
    minWidth: 112,
    alignItems: 'flex-end',
  },
  invoiceActionText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '700',
  },
  bannerWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
  },
  bannerImage: {
    width: '100%',
    height: 104,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#111827',
  },
});
