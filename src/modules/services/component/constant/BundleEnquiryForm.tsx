import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import ScreenHeader from './navbar/ScreenHeaderColor';
import Banner from './Banner';
import { HomeStackParamList } from '../../navigation/type';
import { fetchUserInfo } from '../../../common/auth/api/AuthAPI';
import { useAlert } from '../../../ecommerce/components/alerts/useAlert';
import {
  getBundleDetail,
  type BundleEnquiryField,
} from '../../api/BundleAPI';
import {
  createServiceEnquiry,
  type CreateServiceEnquiryPayload,
} from '../../api/ServiceAPI';

const PackBanner = require('../../assete/service/PackBanner.png');
const FolderService = require('../../assete/service/FolderService.png');

type NavProp = NativeStackNavigationProp<HomeStackParamList>;
type RoutePropType = RouteProp<HomeStackParamList, 'PackEnquiryForm'>;

const NAME_FIELDS = ['name', 'user_name', 'full_name', 'username'];
const EMAIL_FIELDS = ['email', 'email_id', 'email_address'];
const CONTACT_FIELDS = ['mobile_number', 'phone', 'mobile', 'contact', 'phone_number'];
const CITY_FIELDS = ['city', 'town'];
const PINCODE_FIELDS = ['pincode', 'zip', 'zipcode'];
const NOTES_FIELDS = ['additional_notes', 'notes', 'description', 'message', 'remarks'];

const DEFAULT_FIELDS: BundleEnquiryField[] = [
  { label: 'Full Name', field_name: 'full_name', field_type: 'text', is_required: 1 },
  { label: 'Mobile Number', field_name: 'mobile_number', field_type: 'text', is_required: 1 },
  { label: 'Email ID', field_name: 'email_id', field_type: 'text', is_required: 1 },
  { label: 'City', field_name: 'city', field_type: 'text', is_required: 1 },
  { label: 'Pincode', field_name: 'pincode', field_type: 'number', is_required: 1 },
  { label: 'Additional Notes', field_name: 'additional_notes', field_type: 'textarea', is_required: 0 },
];

const DEFAULT_SAFETY_TEXT =
  'Your personal info is protected and used only for your service request.';

const hasAnyValue = (value: string | undefined) => Boolean(value && value.trim());

function BundleEnquiryForm() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const alert = useAlert();

  const initialBundleId = Number(route?.params?.bundleId || 0);
  const [bundleId] = useState(initialBundleId);
  const [bundleTitle, setBundleTitle] = useState(route?.params?.title || 'Bundle Enquiry');
  const [safetyTitle, setSafetyTitle] = useState(route?.params?.safetyTitle || '100% Data Safety');
  const [safetyText, setSafetyText] = useState(route?.params?.safetyText || DEFAULT_SAFETY_TEXT);
  const [enquiryFields, setEnquiryFields] = useState<BundleEnquiryField[]>(
    Array.isArray(route?.params?.enquiryFields) && route.params.enquiryFields.length
      ? route.params.enquiryFields
      : DEFAULT_FIELDS
  );
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isPrefilling, setIsPrefilling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadBundleData = async () => {
      if (bundleId <= 0) {
        return;
      }

      setIsLoadingFields(true);
      try {
        const response = await getBundleDetail(bundleId);
        if (!response?.bundle || !mounted) return;

        const fields = Array.isArray(response.enquiry_fields) ? response.enquiry_fields : [];
        const paragraph = Array.isArray(response.sections?.paragraphs)
          ? response.sections.paragraphs[0]
          : undefined;

        setBundleTitle((prev) => response.bundle.name || prev);
        setEnquiryFields(fields.length ? fields : DEFAULT_FIELDS);

        if (paragraph?.title) {
          setSafetyTitle(String(paragraph.title));
        }

        if (Array.isArray(paragraph?.content) && paragraph.content[0]) {
          setSafetyText(String(paragraph.content[0]));
        }
      } catch (error) {
        console.error('Failed to load bundle detail for enquiry form', error);
      } finally {
        if (mounted) setIsLoadingFields(false);
      }
    };

    loadBundleData();

    return () => {
      mounted = false;
    };
  }, [bundleId]);

  useEffect(() => {
    let mounted = true;

    const prefill = async () => {
      if (!enquiryFields.length) return;

      setIsPrefilling(true);
      try {
        const info = await fetchUserInfo();
        if (!info || !mounted) return;

        const user = info.user ?? {};
        const fullName = String(info.name || user.name || user.full_name || '').trim();
        const email = String(user.email || '').trim();
        const phone = String(user.phone || '').trim();
        const city = String(user.city || '').trim();
        const pincode = String(user.pincode || '').trim();

        const prefillData: Record<string, string> = {};

        for (const field of enquiryFields) {
          const fieldName = String(field.field_name || '').trim();
          if (!fieldName) continue;

          if (NAME_FIELDS.includes(fieldName) && fullName) {
            prefillData[fieldName] = fullName;
            continue;
          }
          if (EMAIL_FIELDS.includes(fieldName) && email) {
            prefillData[fieldName] = email;
            continue;
          }
          if (CONTACT_FIELDS.includes(fieldName) && phone) {
            prefillData[fieldName] = phone;
            continue;
          }
          if (CITY_FIELDS.includes(fieldName) && city) {
            prefillData[fieldName] = city;
            continue;
          }
          if (PINCODE_FIELDS.includes(fieldName) && pincode) {
            prefillData[fieldName] = pincode;
          }
        }

        if (Object.keys(prefillData).length) {
          setForm((prev) => ({ ...prefillData, ...prev }));
        }
      } catch {
        // Prefill is best-effort and should not block the form.
      } finally {
        if (mounted) setIsPrefilling(false);
      }
    };

    prefill();

    return () => {
      mounted = false;
    };
  }, [enquiryFields]);

  const onChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const requiredFields = useMemo(
    () => enquiryFields.filter((field) => Number(field?.is_required || 0) === 1),
    [enquiryFields]
  );

  const canSubmit = useMemo(() => {
    if (isSubmitting || isLoadingFields) return false;
    if (!requiredFields.length) return true;

    return requiredFields.every((field) => {
      const key = String(field.field_name || '').trim();
      if (!key) return true;
      return hasAnyValue(form[key]);
    });
  }, [form, isLoadingFields, isSubmitting, requiredFields]);

  const getIconName = (fieldName: string) => {
    if (NAME_FIELDS.includes(fieldName)) return 'person-outline';
    if (EMAIL_FIELDS.includes(fieldName)) return 'mail-outline';
    if (CONTACT_FIELDS.includes(fieldName)) return 'call';
    if (CITY_FIELDS.includes(fieldName)) return 'location-city';
    if (PINCODE_FIELDS.includes(fieldName)) return 'pin-drop';
    if (NOTES_FIELDS.includes(fieldName)) return 'description';
    return undefined;
  };

  const getKeyboardType = (field: BundleEnquiryField) => {
    const fieldName = String(field.field_name || '').toLowerCase();
    const fieldType = String(field.field_type || '').toLowerCase();

    if (EMAIL_FIELDS.includes(fieldName)) return 'email-address';
    if (fieldType === 'number') return 'number-pad';
    return 'default';
  };

  const validateForm = () => {
    const missing = requiredFields.filter((field) => {
      const key = String(field.field_name || '').trim();
      return key ? !hasAnyValue(form[key]) : false;
    });

    if (missing.length) {
      alert.error('Missing Info', 'Please fill all required fields.');
      return false;
    }

    const emailField = enquiryFields.find((f) => EMAIL_FIELDS.includes(String(f.field_name || '').toLowerCase()));
    if (emailField) {
      const key = String(emailField.field_name || '');
      const emailValue = String(form[key] || '').trim();
      if (emailValue && !/^\S+@\S+\.\S+$/.test(emailValue)) {
        alert.error('Invalid Email', 'Please enter a valid email address.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
  if (!validateForm()) return;

  setIsSubmitting(true);

  try {
    const formData = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, String(v || '').trim()])
    );

    const getValue = (keys: string[]) => {
      for (const key of keys) {
        if (formData[key]) return formData[key];
      }
      return '';
    };

    const name = getValue(['name', 'full_name']);
    const email = getValue(['email', 'email_id']);
    const mobile = getValue(['mobile_number', 'phone', 'contact']);
    const city = getValue(['city']);
    const pincode = getValue(['pincode', 'zip', 'zipcode']);
    const notes = getValue(['additional_notes', 'notes', 'description', 'message', 'remarks']);

    // ✅ Validation (important)
    if (!name || !email || !mobile) {
      alert.error('Error', 'Name, Email and Mobile are required');
      return;
    }

    // ✅ Clean enquiry_data
    const enquiry_data = Object.fromEntries(
      Object.entries(formData).filter(
        ([key, value]) =>
          ![
            'name',
            'full_name',
            'email',
            'email_id',
            'mobile_number',
            'phone',
            'contact',
            'city',
          ].includes(key) && value !== ''
      )
    );

    if (!bundleId) {
      alert.error('Error', 'Unable to identify bundle details for this enquiry. Please try again.');
      return;
    }

    const payload: CreateServiceEnquiryPayload = {
      bundle_id: bundleId,
      name,
      email,
      mobile,
      ...(city ? { city } : {}),
      ...(pincode ? { pincode } : {}),
      enquiry_data,
    };

    if (notes) {
      payload.enquiry_data = {
        ...payload.enquiry_data,
        description: notes,
      };
    }

    console.log('📦 FINAL ENQUIRY PAYLOAD:', payload);

    const response = await createServiceEnquiry(payload);

    if (!response?.success) {
      throw new Error(response?.message || 'Failed to submit enquiry');
    }

    const enquiryRef = String(response?.data?.enquiry_ref || response?.enquiry_ref || '').trim();

    alert.success('Success', response?.message || 'Enquiry submitted successfully');

    navigation.navigate('SubmittedSuccessful', {
      statusText: 'Enquiry Confirmed',
      title: 'Enquiry Submitted Successfully',
      description: 'Our team will contact you shortly.',
      enquiryId: enquiryRef || '#ENQ',
    });

  } catch (error: any) {
    console.log('❌ ENQUIRY ERROR:', error?.response?.data || error);

    alert.error(
      'Error',
      error?.response?.data?.message || error?.message || 'Failed to submit enquiry'
    );
  } finally {
    setIsSubmitting(false);
  }
};

  const renderField = (field: BundleEnquiryField, index: number) => {
    const key = String(field.field_name || '').trim() || `field_${index}`;
    const isRequired = Number(field?.is_required || 0) === 1;
    const fieldType = String(field.field_type || '').toLowerCase();
    const isTextArea = fieldType === 'textarea';
    const keyboardType = getKeyboardType(field);
    const icon = getIconName(String(field.field_name || '').toLowerCase());

    let maxLength: number | undefined;
    if (PINCODE_FIELDS.includes(key.toLowerCase())) {
      maxLength = 6;
    } else if (CONTACT_FIELDS.includes(key.toLowerCase())) {
      maxLength = 10;
    }

    return (
      <View key={key}>
        <Text style={isRequired ? styles.label : styles.labelOptional}>
          {field.label || key}
          {isRequired
            ? <Text style={styles.star}> *</Text>
            : <Text style={styles.optionalTag}> (optional)</Text>
          }
        </Text>

        <View style={[styles.inputWrap, isTextArea && styles.textAreaWrap]}>
          <TextInput
            placeholder={`Enter ${(field.label || key).toLowerCase()} here`}
            placeholderTextColor="#A3A3A3"
            value={form[key] || ''}
            onChangeText={(t) => {
              const sanitized = keyboardType === 'number-pad' ? t.replace(/[^0-9]/g, '') : t;
              onChange(key, sanitized);
            }}
            keyboardType={keyboardType}
            autoCapitalize={EMAIL_FIELDS.includes(key.toLowerCase()) ? 'none' : 'sentences'}
            maxLength={maxLength}
            multiline={isTextArea}
            style={[
              styles.input,
              icon ? styles.inputWithIcon : undefined,
              isTextArea ? styles.textArea : undefined,
            ]}
          />

          {icon && (
            <View style={styles.iconWrapInput}>
              <MaterialIcons name={icon} size={18} color="#8A8A8A" />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader
        title={bundleTitle}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Banner />

        <Image
          source={PackBanner}
          style={styles.packBannerContainer}
          resizeMode="contain"
        />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <MaterialIcons name="chat-bubble-outline" size={18} color="#5B47A3" />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.heading}>Enquire Now</Text>
              <Text style={styles.desc}>
                Fill out the form below and our team will get in touch with you shortly.
              </Text>
            </View>
          </View>

          {(isLoadingFields || isPrefilling) && (
            <ActivityIndicator
              size="small"
              color="#8665FF"
              style={styles.prefillLoader}
            />
          )}

          {enquiryFields.length > 0
            ? enquiryFields.map((field, i) => renderField(field, i))
            : (
              <Text style={styles.noFieldsText}>
                No form fields available. Please try again.
              </Text>
            )}

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!canSubmit}
            style={[styles.submitBtnShadow, !canSubmit && styles.disabled]}
            onPress={handleSubmit}
          >
            <LinearGradient
              colors={['#8665FF', '#5B47A3']}
              style={styles.submitBtn}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color="#FFFFFF" />
                : <Text style={styles.submitText}>Submit</Text>
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#F4FFF1', '#E8FFE0']}
          style={styles.safetyCard}
        >
          <View style={styles.safetyTextWrap}>
            <Text style={styles.safetyTitle}>{safetyTitle}</Text>
            <Text style={styles.safetyText}>{safetyText || DEFAULT_SAFETY_TEXT}</Text>
          </View>

          <View style={styles.safetyIconWrap}>
            <Image
              source={FolderService}
              style={styles.safetyIcon}
              resizeMode="contain"
            />
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

export default BundleEnquiryForm;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 28,
  },

  packBannerContainer: {
    height: 120,
    marginVertical: 10,
    marginHorizontal: 16,
  },

  card: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3EFFF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },

  headerTextCol: {
    flex: 1,
  },

  heading: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1F2937',
  },

  desc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 16,
  },

  prefillLoader: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },

  label: {
    marginTop: 14,
    fontSize: 13,
    color: '#111111',
    fontWeight: '500',
  },

  labelOptional: {
    marginTop: 14,
    fontSize: 13,
    color: '#606060',
    fontWeight: '500',
  },

  star: {
    color: '#E11D48',
  },

  optionalTag: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  inputWrap: {
    marginTop: 6,
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#ECE7FF',
    backgroundColor: '#FAF9FF',
    flexDirection: 'row',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#111111',
  },

  inputWithIcon: {
    paddingRight: 42,
  },

  iconWrapInput: {
    position: 'absolute',
    right: 12,
  },

  textAreaWrap: {
    alignItems: 'flex-start',
    minHeight: 88,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
  },

  noFieldsText: {
    marginTop: 16,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },

  submitBtnShadow: {
    marginTop: 18,
    borderRadius: 12,
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },

  submitBtn: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  disabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },

  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    shadowColor: '#1F2937',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },

  safetyTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  safetyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
  },

  safetyText: {
    fontSize: 12.5,
    color: '#4B5563',
    marginTop: 6,
    lineHeight: 17,
  },

  safetyIconWrap: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },

  safetyIcon: {
    width: 44,
    height: 44,
  },
});
