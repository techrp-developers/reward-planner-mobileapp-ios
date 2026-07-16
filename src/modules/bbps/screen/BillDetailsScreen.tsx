import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery } from '@tanstack/react-query';
import BBPSHead from '../constatnt/BBPSHead';
import {
  bbpsOperatorDetailsQueryKey,
  fetchBill,
  fetchOperatorDetails,
  OperatorField,
} from '../api/BillsAPI';
import { useAlert } from '../../ecommerce/components/alerts';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { useAuth } from '../../common/auth/context/AuthContext';
import { useBbpsTheme } from '../utils/useBbpsTheme';

const BRAND_START = '#8665FF';
const BRAND_END = '#5B47A3';
const FIVE_MINUTES = 5 * 60 * 1000;
const FIELD_SKELETON_GROUPS = [0, 1];

type BillDetailsRouteParams = {
  operatorData?: {
    id?: string;
    name?: string;
  };
  operatorId?: string | number;
  operatorName?: string;
  categoryName?: string;
};

type BillDetailsScreenProps = {
  route?: {
    params?: BillDetailsRouteParams;
  };
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, any>) => void;
  };
};

type FormValues = Record<string, string>;

const isNumericField = (field: OperatorField) =>
  field.param_type?.toLowerCase() === 'numeric';

const sanitizeFieldValue = (value: string, field: OperatorField) => {
  if (isNumericField(field)) {
    return value.replace(/[^0-9]/g, '');
  }

  return value;
};

const isUserInputField = (field: OperatorField) =>
  Boolean(field?.param_name && field?.param_label) &&
  field.param_name !== 'recharge_plan_id';

const BillDetailsScreenComponent = ({ route, navigation }: BillDetailsScreenProps) => {
  const alert = useAlert();
  const alertRef = useRef(alert);
  const { user } = useAuth();
  const bbpsTheme = useBbpsTheme();
  const routeParams = route?.params || {};
  const pulse = useRef(new Animated.Value(0)).current;

  const operatorData = routeParams.operatorData || {
    id: String(routeParams.operatorId || ''),
    name: routeParams.operatorName || 'Biller',
  };
  const operatorId = Number(operatorData.id || routeParams.operatorId);
  const categoryName = routeParams?.categoryName || 'Electricity Bill';
  const hasValidOperatorId = Number.isFinite(operatorId) && operatorId > 0;

  const [formValues, setFormValues] = useState<FormValues>({});
  // const [selectedCategory, setSelectedCategory] = useState('Home');
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: operatorDetails = null,
    isLoading: detailsLoading,
  } = useQuery({
    queryKey: bbpsOperatorDetailsQueryKey(operatorId),
    queryFn: () => fetchOperatorDetails(operatorId),
    enabled: hasValidOperatorId,
    staleTime: FIVE_MINUTES,
  });

  // const categories = ['Home', 'Office', 'Other', 'Shop', 'Farm', 'Clinic'];
  const fields = useMemo(
    () => (operatorDetails?.data || []).filter(isUserInputField),
    [operatorDetails?.data]
  );
  const providerName =
    operatorDetails?.operator_name || operatorData?.name || routeParams.operatorName || 'Biller';
  const loggedInUserName = user?.name || 'Customer';
  const isBillFetchSupported = operatorDetails?.fetchBill === 1;
  const isContinueDisabled =
    detailsLoading ||
    isLoading ||
    fields.length === 0 ||
    fields.some((field) => !formValues[field.param_name]?.trim());

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
    if (!hasValidOperatorId) {
      alertRef.current.warning('Invalid Biller', 'Biller details are missing. Please select a biller again.');
      return;
    }

    if (!operatorDetails) {
      return;
    }

    const initialValues = (operatorDetails.data || []).filter(isUserInputField).reduce<FormValues>((values, field) => {
      if (field?.param_name) {
        values[field.param_name] = '';
      }
      return values;
    }, {});
    setFormValues(initialValues);
  }, [hasValidOperatorId, operatorDetails]);

  const updateFieldValue = useCallback((field: OperatorField, value: string) => {
    setFormValues((current) => ({
      ...current,
      [field.param_name]: sanitizeFieldValue(value, field),
    }));
  }, []);

  const validateInputs = useCallback(() => {
    if (fields.length === 0) {
      alert.warning('Details Missing', 'No biller fields are available. Please try again.');
      return false;
    }

    for (const field of fields) {
      const value = formValues[field.param_name]?.trim() || '';

      if (!value) {
        alert.warning('Invalid Input', field.error_message || `Please enter ${field.param_label}.`);
        return false;
      }

      try {
        const regex = new RegExp(field.regex);
        if (!regex.test(value)) {
          alert.warning('Invalid Input', field.error_message || `Please enter valid ${field.param_label}.`);
          return false;
        }
      } catch {
        console.warn('Invalid operator field regex:', field.regex);
      }
    }

    return true;
  }, [fields, formValues, alert]);

  const handleContinue = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        sender_name: loggedInUserName,
        operator_id: String(operatorId),
        ...formValues,
        ...(!formValues.confirmation_mobile_no && user?.phone
          ? { confirmation_mobile_no: user.phone }
          : {}),
      };

      if (!isBillFetchSupported) {
        navigation.navigate('RechargePlanScreen', {
          operatorId,
          operatorName: providerName,
          categoryName,
          formValues,
        });
        return;
      }

      const response = await fetchBill(payload);

      if (!response?.success) {
        alert.warning(
          'Bill Fetch Failed',
          response?.message || 'Unable to fetch bill details'
        );
        return;
      }

      navigation.navigate('PaymentConfirmationScreen', {
        operatorName: providerName,
        categoryName,
        formValues,
        fetchBillData: response,
      });
    } catch (error: any) {
      alert.error('Error', error?.message || 'Could not fetch bill details.');
    } finally {
      setIsLoading(false);
    }
  }, [
    validateInputs,
    formValues,
    loggedInUserName,
    operatorId,
    user?.phone,
    isBillFetchSupported,
    navigation,
    providerName,
    categoryName,
    alert,
  ]);

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bbpsTheme.colors.background }]}>
      <BBPSHead
        title="Enter Details"
        onBackPress={handleBackPress}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: bbpsTheme.colors.surface,
              shadowColor: bbpsTheme.colors.shadow,
            },
          ]}
        >
          <View style={styles.providerSection}>
            {detailsLoading ? (
              <>
                <SkeletonBox pulse={pulse} width={45} height={45} borderRadius={25} />
                <View style={styles.providerSkeletonText}>
                  <SkeletonBox pulse={pulse} width="85%" height={15} borderRadius={8} />
                </View>
              </>
            ) : (
              <>
                <LinearGradient
                  colors={bbpsTheme.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.logoCircle}
                >
                  <Icon name="flash" size={22} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.providerName, { color: bbpsTheme.colors.textStrong }]}>{providerName}</Text>
              </>
            )}
          </View>

          <View style={styles.inputWrapper}>
            {detailsLoading ? (
              <>
                {FIELD_SKELETON_GROUPS.map((item) => (
                  <View key={`field-skeleton-${item}`} style={item > 0 && styles.mobileLabel}>
                    <SkeletonBox pulse={pulse} width={120} height={13} borderRadius={8} />
                    <SkeletonBox pulse={pulse} width="100%" height={50} borderRadius={8} style={styles.skeletonInputGap} />
                    <SkeletonBox pulse={pulse} width="70%" height={11} borderRadius={8} style={styles.skeletonInputGap} />
                  </View>
                ))}
              </>
            ) : (
              fields.map((field, index) => (
                <View key={field.param_id || field.param_name} style={index > 0 && styles.mobileLabel}>
                  <Text style={[styles.label, { color: bbpsTheme.colors.muted }]}>{field.param_label}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: bbpsTheme.colors.surfaceAlt,
                        borderColor: bbpsTheme.colors.border,
                        color: bbpsTheme.colors.text,
                      },
                    ]}
                    placeholder={`Enter ${field.param_label}`}
                    placeholderTextColor={bbpsTheme.colors.subtle}
                    keyboardType={isNumericField(field) ? 'numeric' : 'default'}
                    value={formValues[field.param_name] || ''}
                    onChangeText={(value) => updateFieldValue(field, value)}
                  />
                  <Text style={[styles.helperText, { color: bbpsTheme.colors.subtle }]}>
                    {field.error_message || `Enter ${field.param_label}`}
                  </Text>
                </View>
              ))
            )}
          </View>

          {/* <View style={styles.nicknameWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollPadding}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chip,
                    selectedCategory === item && styles.selectedChip,
                  ]}
                  onPress={() => setSelectedCategory(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategory === item && styles.selectedChipText,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.addNicknameBtn}>
                <Icon name="plus" size={16} color="#5B47A3" />
                <Text style={styles.addNicknameText}>Add Nickname</Text>
              </TouchableOpacity>
            </ScrollView>
          </View> */}
        </View>

        <TouchableOpacity
          onPress={handleContinue}
          disabled={isContinueDisabled}
          activeOpacity={0.85}
          style={[styles.buttonShadowWrap, { backgroundColor: bbpsTheme.colors.primaryDark, shadowColor: bbpsTheme.colors.shadow }]}
        >
          <LinearGradient
            colors={bbpsTheme.gradients.primary}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.button, isContinueDisabled && styles.disabledBtn]}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F7FF' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    paddingVertical: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  providerName: { fontSize: 15, fontWeight: '700', color: '#1F2937', flex: 1 },
  providerSkeletonText: { flex: 1, marginLeft: 12 },
  inputWrapper: { paddingHorizontal: 20, marginBottom: 15 },
  label: { fontSize: 13, color: '#6B7280', marginBottom: 6, fontWeight: '500' },
  mobileLabel: { marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E0FA',
    backgroundColor: '#FAF9FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  helperText: { fontSize: 11, color: '#9CA3AF', marginTop: 5 },
  skeletonInputGap: { marginTop: 8 },
  nicknameWrapper: {
    backgroundColor: '#F3EFFF',
    paddingVertical: 15,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFF',
    elevation: 1,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  selectedChip: {
    borderColor: '#8665FF',
    backgroundColor: '#FFF',
  },
  chipText: { fontSize: 14, color: '#555' },
  selectedChipText: { color: '#8665FF', fontWeight: 'bold' },
  addNicknameBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
  },
  addNicknameText: { fontSize: 14, color: '#5B47A3', marginLeft: 4, fontWeight: '500' },
  buttonShadowWrap: {
    // Android's `elevation` needs an opaque background on this same view to
    // compute the shadow shape — without one it renders a visible light
    // rounded-rect halo on top of the gradient button underneath it.
    backgroundColor: BRAND_END,
    borderRadius: 16,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  button: {
    height: 55,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});

const BillDetailsScreen = React.memo(BillDetailsScreenComponent);
export default BillDetailsScreen;
