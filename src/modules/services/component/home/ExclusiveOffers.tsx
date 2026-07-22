import { useMemo } from 'react';
import {
    View,
    FlatList,
    Image,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import Card from '../constant/Card';
import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';

const exclusiveOffer = require('../../assete/ServiceData/exclusive.png');

export default function ExclusiveOffers() {
    const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
    const { data, isLoading, error } = useServiceHome();

    const services = useMemo((): ServiceItem[] => {
        if (!data?.data) return [];
        const section = data.data.find(s => s.section_key === 'exclusive_offers');
        return (section?.items as ServiceItem[]) ?? [];
    }, [data]);

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
            <View style={styles.row}>
                {/* Left promo banner */}
                <Image
                    source={exclusiveOffer}
                    style={styles.banner}
                    resizeMode="contain"
                />

                {/* Right scrollable Card components */}
                <FlatList
                    horizontal
                    data={services}
                    keyExtractor={item => `${item.service_id}-${item.variant_id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    nestedScrollEnabled
                    renderItem={({ item }) => {
                        const imageUri = item.variant_image || item.service_image || item.image;
                        const imageSource = imageUri ? { uri: imageUri } : null;
                        const discount =
                            item.discount_percent && item.discount_percent > 0
                                ? `${item.discount_percent}%`
                                : '50%';
                        const coinsText = item.coins ? String(item.coins) : '';

                        return (
                            <Card
                                title={item.name}
                                image={imageSource}
                                price={item.price > 0 ? `₹${item.price}` : 'Get Quote'}
                                oldPrice={
                                    item.mrp && item.mrp > item.price
                                        ? `₹${item.mrp}`
                                        : undefined
                                }
                                rating={item.rating}
                                users={String(item.total_orders ?? 0)}
                                coins={coinsText}
                                discount={discount}
                                onPress={() =>
                                    navigation.navigate('ServiceDescription', {
                                        serviceId: item.service_id,
                                        title: item.name,
                                    })
                                }
                            />
                        );
                    }}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 20,
        overflow: 'hidden',
    },
    loadingBox: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,

    },
    banner: {
        width: 130,
        height: 210,
        marginLeft: 12,
        marginRight: 8,
        flexShrink: 0,
    },
    listContent: {
        paddingRight: 12,
    },
});
