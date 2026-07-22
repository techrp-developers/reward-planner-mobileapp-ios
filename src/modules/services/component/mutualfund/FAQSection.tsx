import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import { getMutualFundCategories, type MFCategory } from '../../api/MutualFundAPI';
import { useServicesTheme } from '../../utils/useServicesTheme';

interface Props {
    navigation: NativeStackNavigationProp<HomeStackParamList>;
}

const FAQSection: React.FC<Props> = ({ navigation }) => {
    const servicesTheme = useServicesTheme();
    const [categories, setCategories] = useState<MFCategory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMutualFundCategories()
            .then(cats => {
                const faqCats = cats.filter(c => !c.has_children);
                setCategories(faqCats);
            })
            .catch(err => {
                console.error('[FAQSection] fetch error:', err);
                setCategories([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const renderCard = ({ item }: { item: MFCategory }) => (
        <TouchableOpacity
            style={[styles.card, { borderColor: servicesTheme.colors.border, shadowColor: servicesTheme.colors.shadow }]}
            activeOpacity={0.82}
            onPress={() =>
                navigation.navigate('FAQListing', {
                    categoryId: item.id.toString(),
                    categoryTitle: item.title,
                })
            }
        >
            <LinearGradient
                colors={servicesTheme.isDark ? ['#18181B', '#111113'] : ['#FFFFFF', '#FBF8FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
            >
                <View style={styles.cardContent}>
                    <Text style={[styles.cardText, { color: servicesTheme.colors.text }]}>
                        {item.title}
                    </Text>
                    <View style={[styles.chevronContainer, { backgroundColor: servicesTheme.isDark ? '#18112A' : 'rgba(134,101,255,0.08)' }]}>
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#3545A3" />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headingRow}>
                <View>
                    <Text style={[styles.eyebrow, { color: servicesTheme.colors.primary }]}>QUICK CLARITY</Text>
                    <Text style={[styles.heading, { color: servicesTheme.colors.textStrong }]}>Commonly Asked Questions</Text>
                </View>
                <View style={[styles.headingIcon, { backgroundColor: servicesTheme.colors.surface, borderColor: servicesTheme.colors.border }]}>
                    <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#3545A3" />
                </View>
            </View>

            {loading ? (
                <ActivityIndicator
                    size="small"
                    color="#3545A3"
                    style={styles.loader}
                />
            ) : (
                <FlatList
                    data={categories}
                    renderItem={renderCard}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    scrollEnabled={false}
                />
            )}
        </View>
    );
};

export default FAQSection;

const styles = StyleSheet.create({
    container: {
        paddingBottom: 24,
    },

    headingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },

    eyebrow: {
        fontSize: 10,
        fontWeight: '900',
        color: '#3545A3',
        letterSpacing: 1.1,
        marginBottom: 3,
    },

    heading: {
        fontSize: 18,
        fontWeight: '900',
        color: '#241C3B',
        letterSpacing: -0.4,
    },

    headingIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(134,101,255,0.14)',
    },

    loader: {
        marginTop: 16,
    },

    row: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    card: {
        flex: 0.485,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(134,101,255,0.12)',
        overflow: 'hidden',
        shadowColor: '#080B26',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },

    cardGradient: {
        paddingHorizontal: 13,
        paddingVertical: 14,
        minHeight: 88,
        justifyContent: 'center',
    },

    cardContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        minHeight: 52,
        gap: 8,
    },

    cardText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '800',
        color: '#342B45',
        lineHeight: 18,
        paddingTop: 1,
    },

    chevronContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(134,101,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2,
    },
});
