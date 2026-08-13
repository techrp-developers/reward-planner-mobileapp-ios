import { useMemo } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import Card from '../constant/Card';
import { getServiceImageSource, getDiscount } from '../../utils/serviceUtils';
import exclusiveOffer from '../../assete/ServiceData/exclusive.png';

export default function ExclusiveOffers() {
    const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
    const { data, isLoading, error } = useServiceHome();

    const services = useMemo((): ServiceItem[] => {
        if (!data?.data) return [];
        const section = data.data.find(s => s.section_key === 'exclusive_offers');
        return (section?.items as ServiceItem[]) ?? [];
    }, [data]);

    const handleServicePress = (service: ServiceItem) => {
        (navigation as any).navigate('ServiceDescription', {
            serviceId: service.service_id,
            title: service.name,
        });
    };

    if (isLoading) {
        return (
            <LinearGradient
                colors={['#EEF2FF', '#C7D2FE', '#818CF8']}
                style={[styles.container, styles.loadingBox]}
            >
                <ActivityIndicator size="large" color="#FFFFFF" />
            </LinearGradient>
        );
    }

    if (error || services.length === 0) return null;

    return (
        <LinearGradient
            colors={['#7B8FFF', '#B8C9FF', '#E8F0FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Exclusive Offers</Text>
                    <Text style={styles.subtitle}>Best deals just for you</Text>
                </View>
                <Image
                    source={exclusiveOffer}
                    style={styles.headerBanner}
                    resizeMode="contain"
                />
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slider}
            >
                {services.map((service, index) => (
                    <Card
                        key={`${service.service_id}-${index}`}
                        title={service.title || service.name}
                        image={getServiceImageSource(service)}
                        price={service.price > 0 ? `₹${service.price}` : 'Get Quote'}
                        oldPrice={service.mrp && service.mrp > service.price ? `₹${service.mrp}` : undefined}
                        rating={service.rating}
                        users={String(service.review_count ?? 0)}
                        coins={service.coins ? String(service.coins) : ''}
                        discount={getDiscount(service, '50%')}
                        onPress={() => handleServicePress(service)}
                    />
                ))}
            </ScrollView>

            <View style={styles.bottomPad} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        paddingTop: 20,
        overflow: 'hidden',
    },
    loadingBox: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    headerText: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E1B4B',
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 12.5,
        color: 'rgba(30,27,75,0.65)',
        marginTop: 4,
        fontWeight: '500',
    },
    headerBanner: {
        width: 72,
        height: 72,
        flexShrink: 0,
    },
    slider: {
        paddingHorizontal: 16,
        paddingBottom: 8,
        gap: 12,
    },
    bottomPad: {
        height: 20,
    },
});
