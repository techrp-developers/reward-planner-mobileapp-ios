import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ViewToken,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/type';
import {
    getMutualFundCategories,
    type MFArticleSummary,
} from '../../api/MutualFundAPI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_GAP = 12;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

const INFORMED_CATEGORY_ID = 6;

type SliderArticle = MFArticleSummary & { sectionId: number; sectionTitle: string };

interface Props {
    navigation: NativeStackNavigationProp<HomeStackParamList, 'MutualFundCalculators'>;
}

const ArticleSeparator = () => <View style={styles.separator} />;

const MFInformedInvestors: React.FC<Props> = ({ navigation }) => {
    const [articles, setArticles] = useState<SliderArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [_activeIndex, setActiveIndex] = useState(0);
    const flatRef = useRef<FlatList<SliderArticle>>(null);

    useEffect(() => {
        getMutualFundCategories()
            .then(cats => {
                const target = cats.find(c => c.id === INFORMED_CATEGORY_ID);
                if (!target) return;
                const flat: SliderArticle[] = [];
                for (const child of target.children) {
                    for (const article of child.articles) {
                        flat.push({ ...article, sectionId: child.id, sectionTitle: child.title });
                    }
                }
                setArticles(flat);
            })
            .catch(err => {
                console.error('[MFInformedInvestors] fetch error:', err);
                setArticles([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setActiveIndex(viewableItems[0].index);
            }
        },
        [],
    );

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    // const goTo = (index: number) => {
    //     flatRef.current?.scrollToIndex({ index, animated: true });
    //     setActiveIndex(index);
    // };

    const renderItem = ({ item }: { item: SliderArticle }) => (
        <View style={styles.card}>
            <View style={styles.thumbContainer}>
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
                <View style={styles.thumbOverlay} />
                <View style={styles.tagRow}>
                    <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>INFORMED INVESTING</Text>
                        <Text style={styles.tagSep}> · </Text>
                        <Text style={styles.tagSection} numberOfLines={1}>{item.sectionTitle}</Text>
                    </View>
                </View>
            </View>
            <View style={styles.body}>
                <Text style={styles.title} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.excerpt} numberOfLines={2}>{item.short_description}</Text>
                <TouchableOpacity
                    style={styles.readMoreRow}
                    onPress={() => navigation.navigate('ArticleDetails', {
                        articleId: item.id,
                        sectionId: item.sectionId,
                    })}
                >
                    <Text style={styles.readMore}>Read More</Text>
                    <Text style={styles.readMoreArrow}> ›</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={PURPLE} />
            </View>
        );
    }

    if (articles.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>For the Informed Investor</Text>
                <Text style={styles.sectionSubtitle}>
                    Explore fund types, goal planning, and retirement strategies to
                    make smarter investment decisions.
                </Text>
            </View>

            <FlatList
                ref={flatRef}
                data={articles}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP_INTERVAL}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={ArticleSeparator}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* <View style={styles.dots}>
                {articles.map((_, i) => (
                    <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.8}>
                        <View style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]} />
                    </TouchableOpacity>
                ))}
            </View> */}

            <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => navigation.navigate('MFInvestorsDetail', { categoryId: INFORMED_CATEGORY_ID })}
                activeOpacity={0.8}
            >
                <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
        </View>
    );
};

export default MFInformedInvestors;

const PURPLE = '#8665FF';

const styles = StyleSheet.create({
    loaderContainer: { height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    section: { marginBottom: 28 },
    separator: { width: CARD_GAP },
    header: { paddingHorizontal: 4, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontWeight: '900', color: '#241C3B', letterSpacing: -0.4, marginBottom: 6 },
    sectionSubtitle: { fontSize: 13, color: '#746B86', lineHeight: 20 },
    listContent: { paddingLeft: 0, paddingRight: 8 },
    card: {
        width: CARD_WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(134,101,255,0.12)',
        shadowColor: '#4C2F91',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
        elevation: 5,
    },
    thumbContainer: { height: 190, backgroundColor: '#EDE9FF', position: 'relative' },
    thumb: { width: '100%', height: '100%' },
    thumbOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(36,23,78,0.24)' },
    tagRow: { position: 'absolute', top: 12, left: 12, right: 12 },
    tagBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        maxWidth: '100%',
    },
    tagText: { fontSize: 9, fontWeight: '800', color: PURPLE, letterSpacing: 0.4 },
    tagSep: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
    tagSection: { fontSize: 9, fontWeight: '600', color: '#374151', flexShrink: 1 },
    body: { padding: 16 },
    title: { fontSize: 16, fontWeight: '900', color: '#241C3B', lineHeight: 22, marginBottom: 8 },
    excerpt: { fontSize: 12, color: '#746B86', lineHeight: 18, marginBottom: 14 },
    readMoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#F1EBFF',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    readMore: { fontSize: 13, fontWeight: '900', color: PURPLE },
    readMoreArrow: { fontSize: 15, color: PURPLE, fontWeight: '900' },
    dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 14, gap: 6 },
    dot: { borderRadius: 4, height: 6 },
    dotActive: { width: 20, backgroundColor: PURPLE },
    dotInactive: { width: 6, backgroundColor: '#D1D5DB' },
    viewAllBtn: {
        alignSelf: 'flex-start',
        marginTop: 16,
        backgroundColor: PURPLE,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 999,
    },
    viewAllText: { fontSize: 13, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.2 },
});
