import React, { useEffect, useMemo, useState } from 'react';
import { Share, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SelectableServiceCard from '../government/SelectableServiceCard';
import { getServiceImageUrl } from '../../utils/serviceImage';
import { useServicesTheme } from '../../utils/useServicesTheme';

type VariantItem = {
    id: string;
    title: string;
    planTitle?: string;
    price: string;
    oldPrice: string;
    subtitle?: string;
    rawVariant?: any;
};

const DEFAULT_VARIANTS: VariantItem[] = [];
const ImageHeader = require('../../assete/service/FolderService.png');



type ServiceCartProps = {
    headerImageUrl?: string;
    mainTitle?: string;
    subText?: string;
    rating?: number;
    variants?: VariantItem[];
    onVariantChange?: (variant: VariantItem) => void;
    showVariantSelector?: boolean;
    primaryButtonText?: string;
    onPrimaryPress?: () => void;
    onAddToCart?: () => void;
    showAddToCart?: boolean;
};

export default function ServiceCart({
    headerImageUrl,
    mainTitle,
    subText,
    rating = 0,
    variants,
    onVariantChange,
    showVariantSelector = true,
    primaryButtonText: primaryButtonTextProp,
    onPrimaryPress,
    onAddToCart,
    showAddToCart = true,
}: ServiceCartProps) {
    const servicesTheme = useServicesTheme();
    const services = useMemo(() => {
        if (Array.isArray(variants)) {
            return variants;
        }
        return DEFAULT_VARIANTS;
    }, [variants]);

    const [selectedId, setSelectedId] = useState(services[0]?.id || '');

    useEffect(() => {
        if (services.length === 0 && selectedId !== '') {
            setSelectedId('');
            return;
        }
        if (services.length > 0 && !services.some((item) => item.id === selectedId)) {
            setSelectedId(services[0].id);
        }
    }, [services, selectedId]);

    const selectedService = services.find(
        item => item.id === selectedId
    ) || services[0];

    useEffect(() => {
        if (selectedService && onVariantChange) {
            onVariantChange(selectedService);
        }
    }, [selectedService, onVariantChange]);

    const headerImageSource = headerImageUrl
        ? { uri: getServiceImageUrl(headerImageUrl, 'large') }
        : ImageHeader;

    const parsedRating = Number(rating);
    const numericRating = Number.isFinite(parsedRating)
        ? Math.min(5, Math.max(0, parsedRating))
        : 0;

    const primaryButtonText = primaryButtonTextProp ?? (() => {
        const rawPrice = selectedService?.price;
        if (!rawPrice) return 'Get Started';

        // Extract digits to handle values like "₹0", "0", or " 0 " consistently.
        const numericPart = Number(String(rawPrice).replace(/[^0-9.]/g, ''));
        if (!Number.isFinite(numericPart) || numericPart <= 0) return 'Get Started';

        return `${rawPrice} + Get Start`;
    })();
    const isEnquiryService = primaryButtonText.trim().toLowerCase() === 'enquire now';
    const currentPrice = Number(String(selectedService?.price ?? '').replace(/[^0-9.]/g, '')) || 0;
    const originalPrice = Number(String(selectedService?.oldPrice ?? '').replace(/[^0-9.]/g, '')) || 0;
    const savings = Math.max(0, originalPrice - currentPrice);

    const handleShare = () => {
        Share.share({
            title: mainTitle || 'Service',
            message: [mainTitle, subText].filter(Boolean).join('\n'),
        }).catch(() => {});
    };

    return (
        <ScrollView style={[styles.mainContainer, { backgroundColor: servicesTheme.colors.background }]}>
            {/* 1. Main Image Section with Discount Badge */}
            <View style={styles.imageContainer}>
                <Image
                    source={headerImageSource}
                    style={styles.mainImg}
                    resizeMode="cover"
                />

                {/* <LinearGradient
                    colors={['#FDF4A3', '#FEDB7C']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={styles.discountBadge}
                >
                    <Text style={styles.discountText}>Upto 48% Off</Text>
                </LinearGradient> */}

                {/* <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <MaterialCommunityIcons name="share-variant-outline" size={24} color="#374151" />
                </TouchableOpacity> */}
            </View>

            <View style={[styles.contentPadding, { backgroundColor: servicesTheme.colors.background }]}>
                {/* 2. Horizontal Service Selector */}
                {showVariantSelector && services.length > 1 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.container}
                    >
                        {services.map(item => (
                            <SelectableServiceCard
                                key={item.id}
                                {...item}
                                selected={item.id === selectedId}
                                onPress={() => setSelectedId(item.id)}
                            />
                        ))}
                    </ScrollView>
                )}

                {/* 3. Description Section */}
                <View style={styles.descriptionHeader}>
                    <Text style={[styles.mainTitle, { color: servicesTheme.colors.textStrong }]}>
                        {mainTitle || selectedService?.title}
                    </Text>

                    {isEnquiryService && currentPrice > 0 ? (
                        <View style={styles.enquiryPricing}>
                            <View style={styles.enquiryPriceRow}>
                                <Text style={[styles.enquiryPrice, { color: servicesTheme.colors.textStrong }]}>
                                    {'\u20B9'}{currentPrice.toLocaleString('en-IN')}
                                </Text>
                                {originalPrice > currentPrice && (
                                    <Text style={[styles.enquiryMrp, { color: servicesTheme.colors.subtle }]}>
                                        {'\u20B9'}{originalPrice.toLocaleString('en-IN')}
                                    </Text>
                                )}
                            </View>
                            {savings > 0 && (
                                <Text style={[styles.enquirySavings, { color: servicesTheme.colors.muted }]}>
                                    Save <Text style={{ color: servicesTheme.colors.textStrong }}>{'\u20B9'}{savings.toLocaleString('en-IN')}</Text>
                                </Text>
                            )}
                        </View>
                    ) : (
                      <View style={styles.ratingRow}>
                        <Text style={[styles.ratingText, { color: servicesTheme.colors.textStrong }]}>{numericRating.toFixed(1)}</Text>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const iconName = numericRating >= star
                                ? 'star'
                                : numericRating >= star - 0.5
                                    ? 'star-half-full'
                                    : 'star-outline';

                            return (
                                <MaterialCommunityIcons
                                    key={star}
                                    name={iconName}
                                    size={16}
                                    color="#FBBF24"
                                />
                            );
                        })}
                      </View>
                    )}
                </View>

                <Text style={[styles.subText, { color: servicesTheme.colors.muted }]}>
                    {selectedService?.subtitle || subText || 'Complete assistance from application to delivery for your document needs.'}
                </Text>

                {/* 4. Renewal Offer Banner */}
                {/* <LinearGradient
                    colors={['#FEEEAC', '#FDD174']}
                    style={styles.offerBanner}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                >
                    <MaterialCommunityIcons name="gift" size={24} color="#B45309" />
                    <View style={styles.offerTextCol}>
                        <Text style={styles.offerTitle}>Upto 48% Off on renewal</Text>
                        <Text style={styles.offerSub}>Apply before the offer ends</Text>
                    </View>
                    <View style={styles.offerBadge}>
                        <Text style={styles.offerBadgeText}>Today Only</Text>
                    </View>
                </LinearGradient> */}

                {/* 5. Action Buttons */}
                {!isEnquiryService && (
                    <TouchableOpacity activeOpacity={0.9} onPress={onPrimaryPress} style={styles.primaryButtonShadow}>
                        <LinearGradient colors={servicesTheme.gradients.primary} style={styles.primaryButton}>
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                {showAddToCart && (
                    <TouchableOpacity
                        style={[styles.outlineButtonBorder, { backgroundColor: servicesTheme.colors.primary }]}
                        onPress={onAddToCart}
                        activeOpacity={0.9}
                    >
                        <View style={[styles.outlineButtonInner, { backgroundColor: servicesTheme.colors.surface }]}>
                            <Text style={[styles.outlineButtonText, { color: servicesTheme.colors.primary }]}>Add To Cart</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {isEnquiryService && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={onPrimaryPress}
                        style={[styles.primaryButtonShadow, styles.enquiryButtonSpacing]}
                    >
                        <LinearGradient colors={servicesTheme.gradients.primary} style={styles.primaryButton}>
                            <Text style={styles.buttonText}>{primaryButtonText}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};
const styles = StyleSheet.create({
    container: {
        // paddingHorizontal: 16,
        gap: 12,
    },
    mainContainer: { flex: 1, backgroundColor: '#FFF' },
    imageContainer: {
        height: 300,
        position: 'relative'
    },
    mainImg: { width: '100%', height: '100%' },
    discountBadge: {
        position: 'absolute', top: 16, left: 16,
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    },
    discountText: { fontWeight: 'bold', color: '#374151', fontSize: 12 },
    shareButton: {
        position: 'absolute', bottom: 20, right: 20,
        backgroundColor: '#FFF', width: 40, height: 40, borderRadius: 20,
        justifyContent: 'center', alignItems: 'center', elevation: 5,
    },
    contentPadding: { padding: 16 },
    serviceList: { marginBottom: 20,
     },
    borderGradient: { padding: 2, borderRadius: 12, marginRight: 12 },
    serviceCard: {
        backgroundColor: '#FFF', padding: 12, borderRadius: 10, width: 140,
    },
    selectedBg: { backgroundColor: '#FEF4FF' },
    serviceTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
    priceRow: { flexDirection: 'row', alignItems: 'center' },
    currentPrice: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginRight: 6 },
    oldPrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
    descriptionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, marginTop: 18 },
    mainTitle: { fontSize: 19, fontWeight: '800', color: '#111827', flex: 1, marginRight: 10, letterSpacing: -0.2 },
    enquiryPricing: { alignItems: 'flex-end', marginLeft: 12 },
    enquiryPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    enquiryPrice: { fontSize: 14, fontWeight: '800' },
    enquiryMrp: { fontSize: 12, textDecorationLine: 'line-through' },
    enquirySavings: { fontSize: 13, marginTop: 3 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    subText: { color: '#6B7280', lineHeight: 20, marginBottom: 22, fontSize: 13.5 },
    offerBanner: {
        flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 24,
        shadowColor: '#B45309', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2,
    },
    offerTextCol: { marginLeft: 12, flex: 1 },
    offerTitle: { fontWeight: '700', color: '#92400E', fontSize: 14 },
    offerSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
    primaryButtonShadow: {
        borderRadius: 14, marginBottom: 12,
        shadowColor: '#5B47A3', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
    },
    enquiryButtonSpacing: { marginTop: 10 },
    primaryButton: {
        height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    buttonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
    outlineButtonBorder: {
        height: 54, borderRadius: 14, padding: 1.5,
        backgroundColor: '#8665FF', // Fallback for the border gradient logic
    },
    outlineButtonInner: {
        flex: 1, backgroundColor: '#FFF', borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    },
    outlineButtonText: { color: '#8665FF', fontSize: 16, fontWeight: 'bold' },
    offerBadge: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#FCD34D',
    },

    offerBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
    },

    ratingText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginRight: 4,
    },

});
