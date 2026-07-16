import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

// ── Reused ecommerce common components ──────────────────────────────────────
import DeliveryDetailsCard from '../../../../modules/common/order/DeliveryDetailsCard';
import PriceDetailsCard from '../../../../modules/common/order/PriceDetailsCard';

// ── Service-specific components ──────────────────────────────────────────────
import ServiceOrderItemCard from './ServiceOrderItemCard';
import ServiceBundleCard from './ServiceBundleCard';

// ── API & types ──────────────────────────────────────────────────────────────
import {
  getServiceInvoiceDetails,
  getServiceOrderDetails,
  type ServiceOrderDetails,
  type ServiceItem,
} from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceOrderDetail'>;

// ── Status label map ─────────────────────────────────────────────────────────
const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Payment Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  pending_payment: '#D97706',
  in_progress: '#2563EB',
  completed: '#16A34A',
  cancelled: '#DC2626',
};
const PURPLE = '#7C3AED';

// ── Data transforms ──────────────────────────────────────────────────────────
function buildAddressLine(order: ServiceOrderDetails): string {
  const a = order.address;
  if (!a) return '';
  return [a.address1, a.address2, a.city, a.state, a.zipcode]
    .filter(Boolean)
    .join(', ');
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ServiceOrderDetail() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { parent_order_id } = route.params;

  const [order, setOrder] = useState<ServiceOrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [error, setError] = useState('');

  // ── API call ───────────────────────────────────────────────────────────────
  const fetchOrder = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await getServiceOrderDetails(parent_order_id);
      if (res?.success && res?.data) {
        setOrder(res.data as ServiceOrderDetails);
      } else {
        setError(res?.message || 'Order not found.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [parent_order_id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder(true);
  };

  // ── Item action handlers (parent owns all side-effects) ───────────────────
  const handleCancelItem = (item: ServiceItem) => {
    navigation.navigate('ServiceCancellationRequest', {
      service_order_id: item.id,
      parent_order_id: order?.parent_order_id || parent_order_id,
      order_ref: item.order_ref,
      service_name: item.service_name,
      variant_name: item.variant_name,
      image_url: item.image_url,
    });
  };

  const handleFeedbackItem = (item: ServiceItem) => {
    navigation.navigate('ServiceFeedback', {
      service_order_id: item.id,
      parent_order_id: order?.parent_order_id || parent_order_id,
      order_ref: item.order_ref,
      service_name: item.service_name,
      variant_name: item.variant_name,
      image_url: item.image_url,
    });
  };

  const handleDownloadInvoice = async () => {
    try {
      setInvoiceDownloading(true);
      const res = await getServiceInvoiceDetails(parent_order_id);
      const invoiceUrl = res?.data?.download_url;

      if (!res?.success || !invoiceUrl) {
        Alert.alert('Invoice unavailable', 'Unable to find invoice for this order.');
        return;
      }

      await Linking.openURL(invoiceUrl);
    } catch (err: any) {
      Alert.alert(
        'Download failed',
        err?.message || 'Unable to download invoice. Please try again.'
      );
    } finally {
      setInvoiceDownloading(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading order details…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle-outline" size={52} color="#DC2626" />
          <Text style={styles.errorText}>{error || 'Order not found.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrder()}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived data (transforms live in parent, not in components) ───────────
  const statusLabel = ORDER_STATUS_LABEL[order.status] || order.status;
  const statusColor = ORDER_STATUS_COLOR[order.status] || '#6B7280';
  const addressLine = buildAddressLine(order);
  const hasStandaloneItems = order.items.length > 0;
  const hasBundles = order.bundles.length > 0;
  const allServiceItems = [
    ...order.items,
    ...order.bundles.flatMap(bundle => bundle.items),
  ];
  const allDocuments = allServiceItems.flatMap(item => item.documents);
  const pendingDocumentCount = allDocuments.filter(document => !document.uploaded).length;
  const uploadedDocumentCount = allDocuments.length - pendingDocumentCount;
  const documentOrderId =
    allServiceItems.find(item => item.documents.some(document => !document.uploaded))?.id ||
    allServiceItems[0]?.id ||
    0;

  return (
    <SafeAreaView style={styles.safe}>
      <Header onBack={() => navigation.goBack()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7C3AED']}
            tintColor="#7C3AED"
          />
        }
      >
        {/* ── Order summary card ─────────────────────────────────────── */}
        <LinearGradient
          colors={['#30205F', '#6344BD', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.orderEyebrow}>SERVICE ORDER</Text>
              <Text style={styles.orderId}>
                #{parent_order_id.slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={25} color="#FFF" />
            </View>
          </View>

          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={styles.statusLabel}>{statusLabel}</Text>
          </View>

          {/* ── Quick stats ───────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {order.items.length + order.bundles.reduce((s, b) => s + b.items.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Services</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                ₹{order.total_amount.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.statLabel}>Total Paid</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{order.bundles.length || '—'}</Text>
              <Text style={styles.statLabel}>Bundles</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Standalone service items ───────────────────────────────── */}
        {hasStandaloneItems && (
          <SectionCard title={`Services (${order.items.length})`}>
            {order.items.map((item, idx) => (
              <View
                key={item.id}
                style={idx < order.items.length - 1 ? styles.itemDivider : undefined}
              >
                <ServiceOrderItemCard
                  item={item}
                  onCancelPress={handleCancelItem}
                  onFeedbackPress={handleFeedbackItem}
                />
              </View>
            ))}
          </SectionCard>
        )}

        {/* ── Bundle service items ───────────────────────────────────── */}
        {hasBundles && (
          <SectionCard title={`Bundles (${order.bundles.length})`}>
            {order.bundles.map((bundle, i) => (
              <ServiceBundleCard
                key={bundle.bundle_id}
                bundle={bundle}
                bundleIndex={i + 1}
                onCancelItem={handleCancelItem}
                onFeedbackItem={handleFeedbackItem}
              />
            ))}
          </SectionCard>
        )}

        {/* ── Order-level journey (reused ecommerce component) ──────── */}
        {allDocuments.length > 0 && (
          <OrderDocumentsCard
            total={allDocuments.length}
            uploaded={uploadedDocumentCount}
            pending={pendingDocumentCount}
            onUpload={() =>
              navigation.navigate('DocumentUpload', {
                order_id: documentOrderId,
                parent_order_id: order.parent_order_id,
              })
            }
          />
        )}


        {/* ── Address (reused ecommerce component) ──────────────────── */}
        {order.address ? (
          <SectionCard>
            <DeliveryDetailsCard
              addressType={order.address.address_type?.toUpperCase() || 'HOME'}
              address={addressLine}
              name={order.address.contact_name}
              phone={order.address.contact_phone}
            />
          </SectionCard>
        ) : null}

        {/* ── Price summary (reused ecommerce component) ────────────── */}
        <SectionCard title="Payment Summary">
          <PriceDetailsCard
            itemTotal={order.total_amount}
            deliveryFee={0}
            bagDiscount={0}
            rewardDiscount={0}
            orderTotal={order.total_amount}
            rewardEarned={0}
            rewardRedeemed={0}
            paymentMethod="Online"
          />
          <InvoiceDownloadRow
            downloading={invoiceDownloading}
            onDownload={handleDownloadInvoice}
          />
        </SectionCard>



        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Local layout helpers (not exported — presentational only) ─────────────────
function Header({ onBack }: { onBack: () => void }) {
  return (
    <LinearGradient
      colors={['#30205F', '#5B3CB4', '#7C3AED']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="arrow-left" size={21} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.headerCopy}>
        <Text style={styles.headerEyebrow}>SERVICE HUB</Text>
        <Text style={styles.headerTitle}>Order details</Text>
      </View>
    </LinearGradient>
  );
}

function SectionCard({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function OrderDocumentsCard({
  total,
  uploaded,
  pending,
  onUpload,
}: {
  total: number;
  uploaded: number;
  pending: number;
  onUpload: () => void;
}) {
  const complete = pending === 0;

  return (
    <View style={styles.documentsCard}>
      <View style={styles.documentsIcon}>
        <MaterialCommunityIcons
          name={complete ? 'file-check-outline' : 'file-upload-outline'}
          size={24}
          color={complete ? '#16A34A' : PURPLE}
        />
      </View>
      <View style={styles.documentsCopy}>
        <Text style={styles.documentsTitle}>Documents</Text>
        <Text style={styles.documentsText}>
          {complete
            ? `${uploaded} of ${total} documents uploaded`
            : `${pending} document${pending > 1 ? 's' : ''} still needed`}
        </Text>
      </View>
      {complete ? (
        <View style={styles.documentsDone}>
          <MaterialCommunityIcons name="check" size={14} color="#16A34A" />
          <Text style={styles.documentsDoneText}>Complete</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadDocumentsButton} onPress={onUpload}>
          <Text style={styles.uploadDocumentsText}>Upload</Text>
          <MaterialCommunityIcons name="arrow-right" size={15} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}



// ── Styles ────────────────────────────────────────────────────────────────────
function InvoiceDownloadRow({
  downloading,
  onDownload,
}: {
  downloading: boolean;
  onDownload: () => void;
}) {
  return (
    <View style={styles.invoiceRow}>
      <Text style={styles.invoiceText}>Save a copy of your order</Text>

      <TouchableOpacity
        style={[styles.invoiceButton, downloading && styles.invoiceButtonDisabled]}
        activeOpacity={0.82}
        onPress={onDownload}
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={PURPLE} />
        ) : (
          <Text style={styles.invoiceButtonText}>Download Invoice</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F5FB' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',

    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  headerCopy: { flex: 1, marginLeft: 12 },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.64)', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 20,
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: '#FFF', marginTop: 1, letterSpacing: -0.3, paddingHorizontal: 20,
    paddingBottom: 18,
  },

  scroll: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 8, gap: 14 },

  summaryCard: {
    borderRadius: 22,
    elevation: 5,
    shadowColor: '#33205E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    marginTop: 14,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, color: '#6B7280', marginTop: 8 },
  errorText: { fontSize: 14, color: '#DC2626', marginTop: 8, textAlign: 'center' },
  retryBtn: {
    marginTop: 12,
  },
  orderEyebrow: {
    color: 'rgba(255,255,255,0.62)', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginBottom: 4, paddingHorizontal: 18
  },
  orderId: { fontSize: 18, fontWeight: '800', color: '#FFF', letterSpacing: 0.2, paddingHorizontal: 18, },
  orderDate: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 3, fontWeight: '600', paddingHorizontal: 18 },
  summaryIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 18 },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 16,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 12, fontWeight: '800', color: '#FFF' },

  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
    paddingTop: 14,
    paddingBottom: 12,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.68)', marginTop: 3, fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: 8 },

  section: {
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    elevation: 2,
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#251B40',
    marginBottom: 10,
  },
  documentsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E9E3F8',
    borderRadius: 18,
    padding: 14,
    shadowColor: '#35245F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  documentsIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F0ECFF', alignItems: 'center', justifyContent: 'center' },
  documentsCopy: { flex: 1, marginLeft: 12, marginRight: 8 },
  documentsTitle: { fontSize: 14, fontWeight: '800', color: '#251B40' },
  documentsText: { fontSize: 12, color: '#817A91', fontWeight: '600', marginTop: 3 },
  documentsDone: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9 },
  documentsDoneText: { fontSize: 10, color: '#16A34A', fontWeight: '800' },
  uploadDocumentsButton: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: PURPLE, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 10 },
  uploadDocumentsText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E0F2',
    backgroundColor: '#FFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  invoiceText: {
    flex: 1,
    fontSize: 12,
    color: '#2F293D',
    fontWeight: '600',
  },
  invoiceButton: {
    paddingLeft: 12,
    minWidth: 118,
    alignItems: 'flex-end',
  },
  invoiceButtonDisabled: {
    opacity: 0.65,
  },
  invoiceButtonText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '900',
  },


  retryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  itemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 4,
  },

  bottomPad: { height: 32 },
});
