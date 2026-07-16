import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ActivityIndicator,
    Dimensions,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getSectionContent, type MFArticleDetails } from '../../api/MutualFundAPI';
import type { HomeStackParamList } from '../../navigation/type';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_GAP = 12;
const H_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - H_PADDING * 2 - COLUMN_GAP) / 2;
const THUMB_HEIGHT = CARD_WIDTH * 0.7;

type SectionArticlesRoute = RouteProp<HomeStackParamList, 'MFSectionArticles'>;

// Teal for sections 10-14 (Beginners, cat5), purple for 15-17 (Informed, cat6)
function getAccent(sectionId: number) {
    return sectionId <= 14
        ? { accent: '#1DB890', accentLight: '#E8F5F1' }
        : { accent: '#8665FF', accentLight: '#EDE9FF' };
}

function MFSectionArticles() {
    const route = useRoute<SectionArticlesRoute>();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const { sectionId, sectionTitle } = route.params;
    const { accent, accentLight } = getAccent(sectionId);

    const [articles, setArticles] = useState<MFArticleDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSectionContent(sectionId)
            .then(content => setArticles(content.articles))
            .catch(() => setArticles([]))
            .finally(() => setLoading(false));
    }, [sectionId]);

    const renderItem = ({ item }: { item: MFArticleDetails }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('ArticleDetails', { articleId: item.id, sectionId })}
        >
            <View style={[styles.thumbContainer, { backgroundColor: accentLight }]}>
                <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.thumb}
                    resizeMode="cover"
                />
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.cardExcerpt} numberOfLines={2}>{item.short_description}</Text>
                <View style={[styles.readMoreRow]}>
                    <Text style={[styles.readMore, { color: accent }]}>Read More</Text>
                    <Text style={[styles.readMoreArrow, { color: accent }]}> ›</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={[styles.header, { borderBottomColor: accent + '22' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={[styles.backIcon, { color: accent }]}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={2}>{sectionTitle}</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={accent} />
                </View>
            ) : articles.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No articles found.</Text>
                </View>
            ) : (
                <FlatList
                    data={articles}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

export default MFSectionArticles;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 4,
            },
            android: { elevation: 2 },
        }),
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    backIcon: {
        fontSize: 26,
        lineHeight: 30,
        marginTop: -2,
        fontWeight: '600',
    },
    headerTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.2,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
    },
    listContent: {
        padding: H_PADDING,
        paddingBottom: 40,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: COLUMN_GAP,
    },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EFEFEF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    thumbContainer: {
        width: '100%',
        height: THUMB_HEIGHT,
    },
    thumb: {
        width: '100%',
        height: '100%',
    },
    cardBody: {
        padding: 10,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 17,
        marginBottom: 6,
    },
    cardExcerpt: {
        fontSize: 11,
        color: '#6B7280',
        lineHeight: 15,
        marginBottom: 8,
    },
    readMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    readMore: {
        fontSize: 11,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
    readMoreArrow: {
        fontSize: 13,
        fontWeight: '700',
    },
});
