import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, StyleSheet, Text, Alert, unstable_batchedUpdates } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import CartHead from '../constant/navbar/CartHead';
import ServiceDetailSkeleton from '../constant/ServiceDetailSkeleton';
import ServiceCart from '../constant/ServiceCart';
import ServiceFeaturesBullet from '../constant/ServiceFeaturesBullet';
import DynamicEnquiryForm from '../constant/DynamicEnquiryForm';
import FAQSection from '../constant/FAQSection';
import NeedHelpBanner from '../government/NeedHelpBanner';
import LimitedOffer from '../constant/LimitedOffer';
import YouMayNeedServicesCarousel from '../constant/YouMayNeedServicesCarousel';
import RecommendedServicesCarousel from '../constant/RecommendedServicesCarousel';
import { createServiceEnquiry } from '../../api/ServiceAPI';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { addServiceToCart, getBuyNowPreview } from '../../api/CartAPI';
import { useServiceDetails } from '../../hooks/useServiceDetails';
import { fetchUserInfo } from '../../../common/auth/api/AuthAPI';
import { HomeStackParamList } from '../../navigation/type';
import { SERVICE_CART_QUERY_KEY, SERVICE_CHECKOUT_QUERY_KEY } from '../../constant/queryKeys';
import {
    parseTrustStats,
    extractMiddleBlock,
    extractSafetyContent,
} from '../../utils/normalizeServiceData';
import type {
    NormalizedVariant,
    CartVariantItem,
} from '../../types/ServiceTypes';
type CartRouteProps = RouteProp<HomeStackParamList, 'ServiceDescription'>;

const NAME_FIELDS = ['name', 'user_name', 'full_name', 'username'];
const EMAIL_FIELDS = ['email', 'email_id', 'email_address'];
const CONTACT_FIELDS = ['mobile_number', 'phone', 'mobile', 'contact', 'phone_number'];
const CITY_FIELDS = ['city', 'town'];
const NOTES_FIELDS = ['additional_notes', 'notes', 'description', 'message', 'remarks'];

function findFieldValue(values: Record<string, string>, aliases: string[]): string {
    for (const alias of aliases) {
        const v = values[alias];
        if (v && v.trim()) return v.trim();
    }
    return '';
}

function getVariantDisplayName(v: Partial<NormalizedVariant> | null | undefined): {
    label: string;
    planTitle?: string;
} {
    const name = String(v?.variant_name || '').trim();
    const title = String(v?.title || '').trim();

    if (!name || name.toLowerCase() === 'default') {
        return { label: title || 'Plan' };
    }

    return { label: name, planTitle: title || undefined };
}

function shouldHideAddToCartForService(
    serviceId: number,
    serviceName?: string | null,
): boolean {
    const normalizedName = String(serviceName || '').toLowerCase();

    return (
        serviceId === 12 ||
        serviceId === 18 ||
        serviceId === 19 ||
        normalizedName.includes('health insurance') ||
        normalizedName.includes('super top-up') ||
        normalizedName.includes('super top up') ||
        normalizedName.includes('personal accident')
    );
}

function ServiceDescription() {
    const route = useRoute<CartRouteProps>();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const queryClient = useQueryClient();
    const serviceId = Number(route?.params?.serviceId ?? 0);
    const seededServiceData = route?.params?.serviceData;
    const scrollRef = useRef<ScrollView>(null);
    const enquiryFormY = useRef(0);
    const { data: serviceData, loading, error } = useServiceDetails(serviceId, seededServiceData);

    const [submitting, setSubmitting] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buyingNow, setBuyingNow] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<NormalizedVariant | null>(null);
    const [formValues, setFormValues] = useState<Record<string, string>>({});

    // Sync default variant when data first arrives (cache-hit or API)
    useEffect(() => {
        if (serviceData?.variants?.length) {
            unstable_batchedUpdates(() => {
                setSelectedVariant(serviceData.variants[0]);
                setFormValues({});
            });
        }
    }, [serviceData]);

    const activeVariant = selectedVariant ?? serviceData?.variants?.[0] ?? null;
    const hideAddToCart = shouldHideAddToCartForService(
        Number(serviceData?.service?.id || serviceId || 0),
        serviceData?.service?.name,
    );

    const handleFieldChange = useCallback((fieldName: string, value: string) => {
        setFormValues((prev) => ({ ...prev, [fieldName]: value }));
    }, []);

    // Pre-fill enquiry form fields with logged-in user profile data.
    // Runs once when enquiry_fields first become available.
    // User edits always win: existing form values override prefill.
    useEffect(() => {
        const fields = serviceData?.enquiry_fields;
        if (!fields?.length) return;

        fetchUserInfo().then((info) => {
            if (!info) return;

            const user = info.user ?? {};
            const fullName = String(info.name || user.name || user.full_name || '').trim();
            const email = String(user.email || '').trim();
            const phone = String(user.phone || '').trim();
            const city = String(user.city || '').trim();
            const state = String(user.state || '').trim();
            const pincode = String(user.pincode || '').trim();

            const prefill: Record<string, string> = {};

            for (const field of fields) {
                const fn = field.field_name;
                if (NAME_FIELDS.includes(fn) && fullName) { prefill[fn] = fullName; continue; }
                if (EMAIL_FIELDS.includes(fn) && email) { prefill[fn] = email; continue; }
                if (CONTACT_FIELDS.includes(fn) && phone) { prefill[fn] = phone; continue; }
                if (fn === 'city' && city) { prefill[fn] = city; continue; }
                if (fn === 'state' && state) { prefill[fn] = state; continue; }
                if (['pincode', 'zip', 'zipcode'].includes(fn) && pincode) { prefill[fn] = pincode; }
            }

            if (!Object.keys(prefill).length) return;

            // Merge: user edits (prev) override prefill so typed values are never lost.
            setFormValues((prev) => ({ ...prefill, ...prev }));
        }).catch(() => {
            // prefill is best-effort; silently ignore failures
        });
    }, [serviceData?.enquiry_fields]);

    const scrollToEnquiryForm = useCallback(() => {
        if (!scrollRef.current) return;

        if (enquiryFormY.current > 0) {
            scrollRef.current.scrollTo({
                y: Math.max(enquiryFormY.current - 12, 0),
                animated: true,
            });
            return;
        }

        scrollRef.current.scrollToEnd({ animated: true });
    }, []);

    const handlePrimaryPress = useCallback(async () => {
        const currentServiceId = Number(serviceData?.service?.id || serviceId || 0);
        const showEnquiry = Number(serviceData?.service?.show_enquiry) === 1;

        if (showEnquiry) {
            // Enquire Now — same as before: deep-link for insurance, scroll for others
            const serviceName = String(serviceData?.service?.name || '').toLowerCase();

            if (currentServiceId === 12 || serviceName.includes('health insurance')) {
                navigation.navigate('Health');
                return;
            }
            if (currentServiceId === 18 || serviceName.includes('super top-up') || serviceName.includes('super top up')) {
                navigation.navigate('SuperTopUp');
                return;
            }
            if (currentServiceId === 19 || serviceName.includes('personal accident')) {
                navigation.navigate('PersonalAccident');
                return;
            }

            scrollToEnquiryForm();
            return;
        }

        if (buyingNow) return;

        // Buy Now flow
        const resolvedVariantId = Number(activeVariant?.id || serviceData?.variants?.[0]?.id || 0);

        if (!currentServiceId || !resolvedVariantId) {
            Alert.alert('Unable to proceed', 'Service or variant details are missing.');
            return;
        }

        setBuyingNow(true);
        try {
            const previewData = await getBuyNowPreview({
                service_id: currentServiceId,
                variant_id: resolvedVariantId,
            });

            navigation.navigate('ServiceCheckoutScreen', {
                mode: 'buy_now',
                service_id: currentServiceId,
                variant_id: resolvedVariantId,
                previewData,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unable to proceed to checkout.';
            Alert.alert('Buy Now Failed', message);
        } finally {
            setBuyingNow(false);
        }
    }, [activeVariant?.id, buyingNow, navigation, scrollToEnquiryForm, serviceData, serviceId]);

    const handleAddToCart = useCallback(async () => {
        if (addingToCart) return;

        const resolvedServiceId = Number(serviceData?.service?.id || serviceId || 0);
        const resolvedVariantId = Number(activeVariant?.id || serviceData?.variants?.[0]?.id || 0);

        if (!resolvedServiceId || !resolvedVariantId) {
            Alert.alert('Unable to add item', 'Service or variant details are missing.');
            return;
        }

        setAddingToCart(true);
        try {
            const response = await addServiceToCart({
                service_id: resolvedServiceId,
                variant_id: resolvedVariantId,
            });

            if (!response?.success) {
                throw new Error(response?.message || 'Could not add this service to cart.');
            }

            // ✅ ONLY THIS IS NEEDED
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: SERVICE_CART_QUERY_KEY }),
                queryClient.invalidateQueries({ queryKey: SERVICE_CHECKOUT_QUERY_KEY }),
            ]);

            navigation.navigate('CartScreen');

        } catch (addErr) {
            const message = addErr instanceof Error
                ? addErr.message
                : 'Something went wrong while adding to cart.';
            Alert.alert('Add To Cart Failed', message);
        } finally {
            setAddingToCart(false);
        }
    }, [
        activeVariant?.id,
        addingToCart,
        navigation,
        queryClient,
        serviceData,
        serviceId
    ]);

    const submitEnquiry = useCallback(async () => {
        if (!serviceData) return;
        const name = findFieldValue(formValues, NAME_FIELDS) || 'User';
        const email = findFieldValue(formValues, EMAIL_FIELDS);
        const mobile = findFieldValue(formValues, CONTACT_FIELDS);
        const city = findFieldValue(formValues, CITY_FIELDS);

        if (!email || !mobile) {
            Alert.alert('Missing Info', 'Please fill in all required fields.');
            return;
        }

        const enquiryData: Record<string, unknown> = {};
        (serviceData.enquiry_fields || []).forEach((field) => {
            enquiryData[field.field_name] = formValues[field.field_name] ?? '';
        });

        const description =
            findFieldValue(formValues, NOTES_FIELDS) ||
            ('Service request for ' + serviceData.service.name);

        setSubmitting(true);
        try {
            const payload = {
                service_id: Number(serviceData.service.id || serviceId || 0),
                variant_id: Number(activeVariant?.id || serviceData.variants?.[0]?.id || 0),
                name,
                ...(city ? { city } : {}),
                mobile,
                email,
                enquiry_data: {
                    ...enquiryData,
                    description,
                },
            };

            const response = await createServiceEnquiry(payload);

            if (!response?.success) {
                throw new Error(response?.message || 'Unable to submit enquiry right now.');
            }

            setFormValues({});

            const enquiryRef = String(response?.data?.enquiry_ref || '').trim();
            navigation.navigate('SubmittedSuccessful', {
                statusText: 'Enquiry Confirmed',
                title: 'Enquiry Submitted Successfully',
                description: 'Our team will review the details and get back to you shortly.',
                enquiryId: enquiryRef || '#RP-ENQ-19472',
            });
        } catch (submitErr) {
            console.error('Enquiry submission failed', submitErr);
            const message = submitErr instanceof Error
                ? submitErr.message
                : 'Something went wrong. Please try again.';
            Alert.alert('Submission Failed', message);
        } finally {
            setSubmitting(false);
        }
    }, [activeVariant?.id, formValues, navigation, serviceData, serviceId]);

    // Variant cards for ServiceCart horizontal selector
    const serviceCartVariants = useMemo<CartVariantItem[]>(() => {
        if (!serviceData?.variants?.length) return [];
        return serviceData.variants.map((v, idx) => {
            const { label, planTitle } = getVariantDisplayName(v);
            return {
                id: String(v.id || idx + 1),
                title: label || ('Plan ' + (idx + 1)),
                planTitle,
                price: '\u20B9' + Number(v.price || 0).toLocaleString('en-IN'),
                oldPrice: v.mrp ? ('\u20B9' + Number(v.mrp).toLocaleString('en-IN')) : '\u20B90',
                subtitle: v.short_description,
                rawVariant: v,
            };
        });
    }, [serviceData]);

    const hasMultipleVariants = serviceCartVariants.length > 1;

    const ctaPrimaryText = useMemo(() => {
        const isEnquiry = Number(serviceData?.service?.show_enquiry) === 1;
        if (isEnquiry) return 'Enquire Now';

        const selectedPriceRaw = activeVariant?.price;
        const fallbackPriceRaw = serviceData?.variants?.[0]?.price;
        const resolvedPriceRaw = selectedPriceRaw ?? fallbackPriceRaw ?? '0';

        // Normalize values like "₹1,000", "1000.00", or empty strings.
        const numericPrice = Number(String(resolvedPriceRaw).replace(/[^0-9.]/g, ''));

        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return 'Get Started';
        }

        return '\u20B9' + numericPrice.toLocaleString('en-IN') + ' Buy Now';
    }, [serviceData?.service?.show_enquiry, activeVariant?.price, serviceData?.variants]);

    const headerImageUrl = useMemo(() => {
        const path = serviceData?.service?.service_image;
        return path ? getServiceImageUrl(path, 'large') : undefined;
    }, [serviceData]);

    // Merged features + details (deduped) computed in normalizer
    const featureList = useMemo(() => {
        if (!activeVariant) return [];
        return activeVariant.mergedFeatures.map((title) => ({ title, useCheck: true }));
    }, [activeVariant]);

    const { title: middleTitle, points: middlePoints } = useMemo(
        () => (activeVariant ? extractMiddleBlock(activeVariant) : { title: '', points: [] }),
        [activeVariant],
    );

    const stats = useMemo(
        () => parseTrustStats(activeVariant?.trust_stats ?? []),
        [activeVariant],
    );

    const safetyContent = useMemo(
        () => activeVariant
            ? extractSafetyContent(activeVariant)
            : { title: '100% Data Safety', text: '' },
        [activeVariant],
    );

    const requiredDocuments = useMemo(() => serviceData?.documents ?? [], [serviceData]);
    const faqData = useMemo(() => serviceData?.faqData ?? [], [serviceData]);
    const faqTitle = useMemo(
        () => serviceData?.faqTitle ?? 'Everything You Need to Know',
        [serviceData],
    );

    if (loading) {
        return <ServiceDetailSkeleton />;
    }

    if (error || !serviceData) {
        return (
            <View style={styles.root}>
                <CartHead />
                <View style={styles.errorWrap}>
                    <Text style={styles.errorText}>
                        {error ?? 'Unable to load service details.'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.root}>
            {/* Fixed navbar */}
            <CartHead />

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
            >
                {/* 1. Hero image + variant selector */}
                <ServiceCart
                    headerImageUrl={headerImageUrl}
                    mainTitle={serviceData?.service?.name}
                    subText={serviceData?.service?.description}
                    rating={Number(serviceData?.service?.rating ?? 0)}
                    variants={serviceCartVariants}
                    showVariantSelector={hasMultipleVariants}
                    onVariantChange={(v) => {
                        if (v?.rawVariant) setSelectedVariant(v.rawVariant as NormalizedVariant);
                    }}
                    primaryButtonText={ctaPrimaryText}
                    onPrimaryPress={handlePrimaryPress}
                    onAddToCart={handleAddToCart}
                    showAddToCart={!hideAddToCart}
                />

                {/* 2. Title & description */}
                {!!serviceData?.service?.name && (
                    <Text style={styles.serviceTitle}>{serviceData.service.name}</Text>
                )}
                {!!activeVariant?.short_description && (
                    <Text style={styles.serviceDescription}>
                        {activeVariant.short_description}
                    </Text>
                )}

                {/* 3. Features / journey / stats / safety */}
                <ServiceFeaturesBullet
                    features={featureList}
                    middleTitle={middleTitle}
                    middlePoints={middlePoints}
                    stats={stats}
                    showSafetyCard={true}
                    safetyTitle={safetyContent.title}
                    safetyText={safetyContent.text}
                />

                {/* 4. Required documents */}
                {requiredDocuments.length > 0 && (
                    <View style={styles.documentsCard}>
                        <Text style={styles.documentsTitle}>Required Documents</Text>
                        {requiredDocuments.map((doc) => (
                            <View key={String(doc.id) + doc.name} style={styles.documentRow}>
                                <View
                                    style={[
                                        styles.documentDot,
                                        doc.mandatory && styles.documentDotMandatory,
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.documentItem,
                                        doc.mandatory && styles.documentItemMandatory,
                                    ]}
                                >
                                    {doc.name}
                                </Text>
                                {doc.mandatory && (
                                    <View style={styles.mandatoryBadge}>
                                        <Text style={styles.mandatoryText}>Required</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* 5. Dynamic enquiry form */}
                {serviceData?.enquiry_fields && serviceData.enquiry_fields.length > 0 && (
                    <View
                        onLayout={(event) => {
                            enquiryFormY.current = event.nativeEvent.layout.y;
                        }}
                    >
                        <DynamicEnquiryForm
                            title="Interested in this Service?"
                            description="Fill in the details below and our team will reach out to you shortly."
                            fields={serviceData.enquiry_fields}
                            values={formValues}
                            onChange={handleFieldChange}
                            onSubmit={submitEnquiry}
                            isSubmitting={submitting}
                        />
                    </View>
                )}

                {/* 6. FAQ */}
                {faqData.length > 0 && (
                    <FAQSection title={faqTitle} data={faqData} />
                )}

                {/* 7. Supplementary */}
                <NeedHelpBanner />
                <YouMayNeedServicesCarousel />
                <LimitedOffer />
                <RecommendedServicesCarousel />
            </ScrollView>
        </View>
    );
}

export default ServiceDescription;

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    errorWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    serviceTitle: {
        marginHorizontal: 16,
        marginTop: 8,
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.2,
    },
    serviceDescription: {
        marginHorizontal: 16,
        marginTop: 4,
        marginBottom: 16,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    documentsCard: {
        marginHorizontal: 16,
        marginTop: 2,
        marginBottom: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        shadowColor: '#1F2937',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
    },
    documentsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 10,
    },
    documentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
    },
    documentDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#9CA3AF',
        marginRight: 10,
        flexShrink: 0,
    },
    documentDotMandatory: {
        backgroundColor: '#8665FF',
    },
    documentItem: {
        flex: 1,
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    documentItemMandatory: {
        color: '#111827',
        fontWeight: '500',
    },
    mandatoryBadge: {
        backgroundColor: '#EDE9FE',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
        marginLeft: 8,
        flexShrink: 0,
    },
    mandatoryText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#7C3AED',
    },
    scrollContent: {
        paddingBottom: 24,
    },
});

