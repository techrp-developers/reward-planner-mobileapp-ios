import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchImageLibrary } from 'react-native-image-picker';

import {
  createSupportTicket,
  fetchSupportCategories,
  SupportCategory,
} from '../../api/SupportApi';
import { fetchHistory } from '../../api/OrderApi';
import { getProductImageUrl } from '../../api/ProductApi';
import {
  getMyServiceOrders,
  type ServiceOrder,
} from '../../../services/api/OrderAPI';

import { useAlert } from '../../components/alerts';
import type { AppStackParamList } from '../../../../navigation/RootNavigator';
import { useAppTheme } from '../../../../theme/ThemeContext';

type HelpFormProps = NativeStackScreenProps<AppStackParamList, 'HelpForm'>;
type SupportContext = 'general' | 'ecommerce' | 'services' | 'bbps' | 'step_counter';
type SupportOrder = {
  id: string;
  reference: string;
  title: string;
  status: string;
  date: string;
  amount?: number;
  image?: string;
};
type TicketAttachment = {
  uri: string;
  name: string;
  type: string;
  size?: number;
};

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

const formatFileSize = (size?: number) => {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getDocumentMimeType = (name: string, reportedType: string | null) => {
  if (reportedType) return reportedType;
  const extension = name.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
  };
  return mimeTypes[extension || ''] || 'application/pdf';
};

const formatOrderDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? ''
    : parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
};

export default function HelpForm({ navigation, route }: HelpFormProps) {
  const alert = useAlert();
  const { isDark, theme } = useAppTheme();

  const [categories, setCategories] = useState<SupportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<SupportCategory | null>(null);
  const [isSuccessVisible, setIsSuccessVisible] = useState(false);

  const successOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(60)).current;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showDropdown, setShowDropdown] = useState(false);

  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<TicketAttachment | null>(null);
  const initialContext = route.params?.context;
  const supportContext: SupportContext =
    initialContext && initialContext !== 'dashboard' ? initialContext : 'general';
  const [recentOrders, setRecentOrders] = useState<SupportOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SupportOrder | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(false);


  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  const handleHistoryPress = useCallback(() => {
    navigation.navigate('MyTickets');
  }, [navigation]);

  // ============================ LOAD CATEGORIES ============================

  const loadCategories = useCallback(async () => {
    try {
      setCategoryLoading(true);

      const res = await fetchSupportCategories();

      if (res.success) {
        setCategories(res.data || []);
      }
    } catch (error) {
      __DEV__ && console.log('Category load failed', error);
    } finally {
      setCategoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    let mounted = true;

    const loadRecentOrders = async () => {
      setSelectedOrder(null);

      if (supportContext !== 'ecommerce' && supportContext !== 'services') {
        setRecentOrders([]);
        return;
      }

      try {
        setOrdersLoading(true);

        if (supportContext === 'ecommerce') {
          const response = await fetchHistory(1);
          const orders = Array.isArray(response?.orders) ? response.orders : [];
          if (mounted) {
            setRecentOrders(
              orders.slice(0, 4).map((order: any) => ({
                id: String(order.order_id),
                reference: String(order.order_ref || order.order_id),
                title: String(order.title || 'Shopping order'),
                status: String(order.status || 'placed'),
                date: String(order.created_at || ''),
                amount: Number(order.price || order.total_amount || 0),
                image: getProductImageUrl(order.image),
              })),
            );
          }
          return;
        }

        const response = await getMyServiceOrders({ page: 1, limit: 4 });
        if (mounted) {
          setRecentOrders(
            (response?.orders || []).slice(0, 4).map((order: ServiceOrder) => ({
              id: String(order.parent_order_id),
              reference: String(order.parent_order_id),
              title: String(order.preview?.[0]?.name || 'Service order'),
              status: String(order.status || 'placed'),
              date: String(order.created_at || ''),
              amount: Number(order.total_amount || 0),
              image: getProductImageUrl(
                order.items?.[0]?.image_url ||
                order.bundles?.[0]?.items?.[0]?.image_url,
              ),
            })),
          );
        }
      } catch {
        if (mounted) setRecentOrders([]);
      } finally {
        if (mounted) setOrdersLoading(false);
      }
    };

    loadRecentOrders();
    return () => {
      mounted = false;
    };
  }, [supportContext]);

  const hideSuccessCard = useCallback(() => {
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 60,
        duration: 240,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsSuccessVisible(false);
      navigation.goBack();
    });
  }, [navigation, successOpacity, successTranslateY]);

  const showSuccessCard = useCallback(() => {
    setIsSuccessVisible(true);
    successOpacity.setValue(0);
    successTranslateY.setValue(60);

    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(successTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
      successTimerRef.current = setTimeout(() => {
        hideSuccessCard();
      }, 2600);
    });
  }, [hideSuccessCard, successOpacity, successTranslateY]);

  // ============================ SUBMIT ============================

  const setValidatedAttachment = useCallback((file: TicketAttachment) => {
    if (file.size && file.size > MAX_ATTACHMENT_SIZE) {
      alert.error('File too large', 'Please select a file smaller than 25 MB.');
      return;
    }
    setAttachment(file);
  }, [alert]);

  const handlePickMedia = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      quality: 0.8,
    });
    if (result.didCancel) return;
    if (result.errorCode) {
      alert.error('Attachment Error', result.errorMessage || 'Unable to select this file.');
      return;
    }
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setValidatedAttachment({
      uri: asset.uri,
      name: asset.fileName || `attachment-${Date.now()}`,
      type: asset.type || (asset.duration ? 'video/mp4' : 'image/jpeg'),
      size: asset.fileSize,
    });
  }, [alert, setValidatedAttachment]);

  const handlePickDocument = useCallback(async () => {
    try {
      const {
        errorCodes,
        isErrorWithCode,
        pick,
        types,
      } = require('@react-native-documents/picker');
      const result = await pick({
        type: [types.pdf, types.doc, types.docx, types.xls, types.xlsx, types.plainText],
        allowMultiSelection: false,
        mode: 'import',
      });
      const file = result[0];
      if (!file) return;
      const fileName = file.name || `document-${Date.now()}.pdf`;
      setValidatedAttachment({
        uri: file.uri,
        name: fileName,
        type: getDocumentMimeType(fileName, file.type),
        size: file.size || undefined,
      });
    } catch (error: any) {
      if (error?.code === 'OPERATION_CANCELED') return;
      alert.error('Attachment Error', 'Unable to select this document.');
    }
  }, [alert, setValidatedAttachment]);

  const handleCreateTicket = useCallback(async () => {
    try {
      if (!selectedCategory?.category_id) {
        alert.error('Validation Error', 'Please select category');
        return;
      }

      if (description.trim().length < 10) {
        alert.error(
          'Validation Error',
          'Description must be minimum 10 characters',
        );
        return;
      }

      setLoading(true);

      const res = await createSupportTicket({
        description: description.trim(),
        category_id: selectedCategory.category_id,
        support_module: supportContext,
        reference_type: selectedOrder ? 'order' : undefined,
        reference_id: selectedOrder?.id,
        reference_label: selectedOrder?.reference,
        attachment: attachment
          ? { uri: attachment.uri, name: attachment.name, type: attachment.type }
          : undefined,
      });

      if (res.success) {
        alert.success(
          'Ticket Created',
          res.message || 'Support ticket created successfully',
        );

        setDescription('');
        setSelectedCategory(null);
        setAttachment(null);

        showSuccessCard();
        return;
      }

      alert.error('Ticket Error', res.message);
    } catch (error: any) {
      alert.error(
        'Ticket Error',
        error?.message || 'Failed to create support ticket',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, description, alert, showSuccessCard, supportContext, selectedOrder, attachment]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView
      style={[styles.screen, isDark && darkStyles.screen]}
      edges={['top']}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#09090B' : '#F5F0FF'}
      />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.headerWrap}>
            <View style={styles.headerRow}>
              <Text
                style={[styles.headerTitle, isDark && darkStyles.primaryText]}
              >
                Support Ticket
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.historyBtn, isDark && darkStyles.historyBtn]}
                onPress={handleHistoryPress}
              >
                <Text
                  style={[
                    styles.historyBtnText,
                    isDark && darkStyles.historyBtnText,
                  ]}
                >
                  History
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.headerSub, isDark && darkStyles.mutedText]}>
              Tell us what happened.We'll attach the right account context so our team can help faster
            </Text>
          </View>

          {/* CARD */}

          <View style={[styles.card, isDark && darkStyles.card]}>

            {supportContext === 'ecommerce' || supportContext === 'services' ? (
              <View style={styles.orderSection}>
                <View style={styles.orderSectionHeader}>
                  <View>
                    <Text style={[styles.label, styles.orderSectionTitle, isDark && darkStyles.primaryText]}>
                      Recent {supportContext === 'services' ? 'service' : 'shopping'} orders
                    </Text>
                    <Text style={[styles.orderHint, isDark && darkStyles.mutedText]}>
                      Select an order if your issue is related to one.
                    </Text>
                  </View>
                  {ordersLoading ? <ActivityIndicator size="small" color={theme.primary} /> : null}
                </View>

                {!ordersLoading && recentOrders.length === 0 ? (
                  <View style={[styles.contextNotice, isDark && darkStyles.contextNotice]}>
                    <MaterialCommunityIcons name="package-variant" size={20} color={theme.primary} />
                    <Text style={[styles.contextNoticeText, isDark && darkStyles.mutedText]}>
                      No recent orders found. You can still create a general ticket.
                    </Text>
                  </View>
                ) : null}

                {recentOrders.map(order => {
                  const active = selectedOrder?.id === order.id;
                  return (
                    <TouchableOpacity
                      key={order.id}
                      activeOpacity={0.82}
                      style={[
                        styles.orderCard,
                        isDark && darkStyles.orderCard,
                        active && styles.orderCardActive,
                      ]}
                      onPress={() => setSelectedOrder(active ? null : order)}
                    >
                      <View style={[styles.orderIcon, active && styles.orderIconActive]}>
                        {order.image ? (
                          <Image
                            source={{ uri: order.image }}
                            style={styles.orderImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialCommunityIcons
                            name={supportContext === 'services' ? 'briefcase-check-outline' : 'package-variant-closed'}
                            size={22}
                            color={active ? '#FFFFFF' : theme.primary}
                          />
                        )}
                      </View>
                      <View style={styles.orderCopy}>
                        <Text numberOfLines={1} style={[styles.orderTitle, isDark && darkStyles.primaryText]}>
                          {order.title}
                        </Text>
                        <Text style={[styles.orderMeta, isDark && darkStyles.mutedText]}>
                          #{order.reference} · {formatOrderDate(order.date)}
                        </Text>
                        <Text style={styles.orderStatus}>{order.status.replace(/_/g, ' ')}</Text>
                      </View>
                      {order.amount ? (
                        <Text style={[styles.orderAmount, isDark && darkStyles.primaryText]}>
                          ₹{order.amount.toLocaleString('en-IN')}
                        </Text>
                      ) : null}
                      <MaterialCommunityIcons
                        name={active ? 'check-circle' : 'circle-outline'}
                        size={22}
                        color={active ? theme.primary : isDark ? '#52525B' : '#CBD5E1'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.contextNotice, styles.standaloneNotice, isDark && darkStyles.contextNotice]}>
                <MaterialCommunityIcons
                  name={supportContext === 'bbps' ? 'receipt-text-check-outline' : supportContext === 'step_counter' ? 'shoe-print' : 'account-heart-outline'}
                  size={22}
                  color={theme.primary}
                />
                <Text style={[styles.contextNoticeText, isDark && darkStyles.mutedText]}>
                  {supportContext === 'bbps'
                    ? 'Include the biller, transaction reference and payment date in your description.'
                    : supportContext === 'step_counter'
                      ? 'Include your device model, step date and Health Connect status.'
                      : 'Choose a category and describe the issue. We’ll route it to the right team.'}
                </Text>
              </View>
            )}
            {/* CATEGORY */}

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Category
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={[styles.inputWrap, isDark && darkStyles.inputWrap]}
              onPress={() => setShowDropdown(prev => !prev)}
            >
              <MaterialCommunityIcons
                name="shape-outline"
                size={18}
                color={isDark ? '#A1A1AA' : '#999'}
                style={styles.inputIcon}
              />

              <Text
                style={[
                  styles.dropdownText,
                  isDark && darkStyles.inputText,
                  !selectedCategory && styles.placeholderText,
                  !selectedCategory && isDark && darkStyles.placeholderText,
                ]}
              >
                {selectedCategory?.name || 'Select Category'}
              </Text>

              <MaterialCommunityIcons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.primary}
              />
            </TouchableOpacity>

            {showDropdown && (
              <View style={[styles.dropdown, isDark && darkStyles.dropdown]}>
                {categoryLoading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  categories.map(item => (
                    <TouchableOpacity
                      key={item.category_id}
                      style={[
                        styles.dropdownItem,
                        isDark && darkStyles.dropdownItem,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedCategory(item);
                        setShowDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDark && darkStyles.inputText,
                        ]}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}

            {/* DESCRIPTION */}

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Description
            </Text>

            <View style={[styles.textAreaWrap, isDark && darkStyles.inputWrap]}>
              <TextInput
                placeholder="Describe your issue..."
                placeholderTextColor={isDark ? '#71717A' : '#999'}
                selectionColor={theme.primary}
                multiline
                textAlignVertical="top"
                style={[styles.textArea, isDark && darkStyles.inputText]}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <Text style={[styles.label, isDark && darkStyles.primaryText]}>
              Attachment <Text style={styles.optionalLabel}>(optional)</Text>
            </Text>
            <Text style={[styles.attachmentHint, isDark && darkStyles.mutedText]}>
              Add an image, video, PDF, Word, Excel or text file. Maximum 25 MB.
            </Text>

            <View style={styles.attachmentActions}>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.attachmentButton, isDark && darkStyles.attachmentButton]}
                onPress={handlePickMedia}
              >
                <MaterialCommunityIcons name="image-multiple-outline" size={20} color={theme.primary} />
                <Text style={[styles.attachmentButtonText, isDark && darkStyles.primaryText]}>Photo / Video</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.attachmentButton, isDark && darkStyles.attachmentButton]}
                onPress={handlePickDocument}
              >
                <MaterialCommunityIcons name="file-document-outline" size={20} color={theme.primary} />
                <Text style={[styles.attachmentButtonText, isDark && darkStyles.primaryText]}>Document</Text>
              </TouchableOpacity>
            </View>

            {attachment ? (
              <View style={[styles.selectedAttachment, isDark && darkStyles.selectedAttachment]}>
                {attachment.type.startsWith('image/') ? (
                  <Image source={{ uri: attachment.uri }} style={styles.attachmentPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.attachmentFileIcon}>
                    <MaterialCommunityIcons
                      name={attachment.type.startsWith('video/') ? 'play-circle-outline' : 'file-check-outline'}
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                )}
                <View style={styles.attachmentCopy}>
                  <Text numberOfLines={1} style={[styles.attachmentName, isDark && darkStyles.primaryText]}>
                    {attachment.name}
                  </Text>
                  <Text style={[styles.attachmentSize, isDark && darkStyles.mutedText]}>
                    {formatFileSize(attachment.size) || 'Ready to upload'}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Remove attachment"
                  style={styles.removeAttachment}
                  onPress={() => setAttachment(null)}
                >
                  <MaterialCommunityIcons name="close" size={20} color={isDark ? '#D4D4D8' : '#64748B'} />
                </TouchableOpacity>
              </View>
            ) : null}

            {/* BUTTON */}

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateTicket}
              disabled={loading}
            >
              <LinearGradient
                colors={['#FC8BAD', '#A654CD']}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 0 }}
                style={styles.submitBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitText}>Create Ticket</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isSuccessVisible ? (
          <View style={styles.successWrapper} pointerEvents="none">
            <Animated.View
              style={[
                styles.successCard,
                isDark && darkStyles.successCard,
                {
                  opacity: successOpacity,
                  transform: [{ translateY: successTranslateY }],
                },
              ]}
            >
              <View style={styles.successIconWrap}>
                <LinearGradient
                  colors={['#FC8BAD', '#A654CD']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.successIconBackground}
                >
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>
              <Text
                style={[styles.successTitle, isDark && darkStyles.successTitle]}
              >
                Thank You{' '}
              </Text>
              <Text
                style={[
                  styles.successDescription,
                  isDark && darkStyles.mutedText,
                ]}
              >
                Our support team received your request and will get back to you
                shortly.
              </Text>
            </Animated.View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F0FF',
  },

  keyboardWrap: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  headerWrap: {
    paddingHorizontal: 24,
    paddingTop: 30,
    marginBottom: 20,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#852BAF',
    flex: 1,
  },

  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D9B7EA',
    backgroundColor: '#FFFFFF',
  },

  historyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#852BAF',
  },

  headerSub: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  card: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    minHeight: '100%',
  },

  orderSection: { marginBottom: 24 },

  orderSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  orderSectionTitle: { marginBottom: 3 },
  orderHint: { color: '#64748B', fontSize: 12, lineHeight: 18 },

  orderCard: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  orderCardActive: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F5F3FF',
  },

  orderIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  orderIconActive: { backgroundColor: '#8B5CF6' },
  orderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  orderCopy: { flex: 1, minWidth: 0 },
  orderTitle: { color: '#1E293B', fontSize: 14, fontWeight: '800' },
  orderMeta: { color: '#64748B', fontSize: 11, marginTop: 3 },
  orderStatus: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  orderAmount: { color: '#1E293B', fontSize: 12, fontWeight: '800' },

  contextNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 14,
    backgroundColor: '#F8F7FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  standaloneNotice: { marginBottom: 24 },
  contextNoticeText: { flex: 1, color: '#64748B', fontSize: 12, lineHeight: 18 },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#852BAF',
    marginBottom: 10,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 18,
    height: 52,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },

  placeholderText: {
    color: '#999',
  },

  dropdown: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginTop: -10,
    marginBottom: 18,
    overflow: 'hidden',
  },

  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },

  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },

  textAreaWrap: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    marginBottom: 24,
    minHeight: 140,
  },

  textArea: {
    fontSize: 14,
    color: '#333',
    minHeight: 120,
  },

  optionalLabel: { color: '#94A3B8', fontWeight: '500' },
  attachmentHint: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: -5, marginBottom: 12 },
  attachmentActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  attachmentButton: {
    flex: 1,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    backgroundColor: '#FAF7FF',
  },
  attachmentButtonText: { color: '#5B21B6', fontSize: 12, fontWeight: '700' },
  selectedAttachment: {
    flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10,
    borderRadius: 13, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF', marginBottom: 18,
  },
  attachmentPreview: { width: 46, height: 46, borderRadius: 10 },
  attachmentFileIcon: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center' },
  attachmentCopy: { flex: 1, minWidth: 0 },
  attachmentName: { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  attachmentSize: { color: '#64748B', fontSize: 11, marginTop: 4 },
  removeAttachment: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },

  submitBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  successWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },

  successCard: {
    width: '92%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 18,
  },

  successIconWrap: {
    marginBottom: 18,
  },

  successIconBackground: {
    width: 90,
    height: 90,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F1F35',
    textAlign: 'center',
    marginBottom: 10,
  },

  successDescription: {
    fontSize: 15,
    color: '#4B5268',
    textAlign: 'center',
    lineHeight: 22,
  },
});

const darkStyles = StyleSheet.create({
  screen: { backgroundColor: '#09090B' },
  card: { backgroundColor: '#18181B' },
  primaryText: { color: '#C4B5FD' },
  mutedText: { color: '#A1A1AA' },
  inputWrap: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  inputText: { color: '#F4F4F5' },
  placeholderText: { color: '#71717A' },
  dropdown: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  dropdownItem: { borderBottomColor: 'rgba(255,255,255,0.12)' },
  historyBtn: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  historyBtnText: { color: '#C4B5FD' },
  successCard: {
    backgroundColor: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
  },
  successTitle: { color: '#FFFFFF' },

  orderCard: {
    backgroundColor: '#202023',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  contextNotice: {
    backgroundColor: '#27272A',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  attachmentButton: { backgroundColor: '#27272A', borderColor: 'rgba(255,255,255,0.14)' },
  selectedAttachment: { backgroundColor: '#202023', borderColor: 'rgba(255,255,255,0.12)' },
});
