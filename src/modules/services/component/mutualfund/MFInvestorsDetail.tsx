import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ScrollView,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import {
    getMutualFundCategories,
    type MFArticleSummary,
    type MFChildCategory,
} from '../../api/MutualFundAPI';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.42;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type Tab = 'beginners' | 'informed';

interface Props {
    navigation: NativeStackNavigationProp<HomeStackParamList, 'MFInvestorsDetail'>;
    route: RouteProp<HomeStackParamList, 'MFInvestorsDetail'>;
}

// ─────────────────────────────────────────────
// THEME per tab
// ─────────────────────────────────────────────

const THEME = {
    beginners: {
        accent: '#8665FF',
        accentLight: '#E8F5F1',
        borderBottom: '#E6F7F3',
        bgPage: '#F7FDFB',
        headerTitle: 'Mutual Fund for Beginners',
        headerSubtitle: 'Simple guides to start investing with confidence',
    },
    informed: {
        accent: '#8665FF',
        accentLight: '#EDE9FF',
        borderBottom: '#F0EEFF',
        bgPage: '#F8F7FF',
        headerTitle: 'For the Informed Investor',
        headerSubtitle: 'Explore fund types, goal planning & retirement strategies',
    },
} as const;

// ─────────────────────────────────────────────
// PILL TOGGLE
// ─────────────────────────────────────────────

const PillToggle: React.FC<{
    value: Tab;
    onChange: (v: Tab) => void;
}> = ({ value, onChange }) => (
    <View style={toggle.container}>
        {(['beginners', 'informed'] as Tab[]).map(tab => {
            const label = tab === 'beginners' ? 'New to Mutual Funds' : 'More about Mutual Funds';
            const isActive = value === tab;
            return isActive ? (
                <LinearGradient
                    key={tab}
                    colors={['#8665FF', '#5B47A3']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={toggle.activeBtn}
                >
                    <Text style={toggle.activeText}>{label}</Text>
                </LinearGradient>
            ) : (
                <TouchableOpacity
                    key={tab}
                    style={toggle.inactiveBtn}
                    onPress={() => onChange(tab)}
                    activeOpacity={0.7}
                >
                    <Text style={toggle.inactiveText}>{label}</Text>
                </TouchableOpacity>
            );
        })}
    </View>
);

// ─────────────────────────────────────────────
// ARTICLE CARD
// ─────────────────────────────────────────────

const ArticleCard: React.FC<{
    item: MFArticleSummary;
    accentLight: string;
    onPress: () => void;
}> = ({ item, accentLight, onPress }) => (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
        <View style={[styles.thumbContainer, { backgroundColor: accentLight }]}>
            <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
        </View>
        <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={3}>{item.title}</Text>
        </View>
    </TouchableOpacity>
);

const CardSeparator = () => <View style={styles.cardSeparator} />;

// ─────────────────────────────────────────────
// SECTION ROW
// ─────────────────────────────────────────────

const SectionRow: React.FC<{
    section: MFChildCategory;
    accent: string;
    accentLight: string;
    onArticlePress: (articleId: number, sectionId: number) => void;
    onViewAll: (sectionId: number, sectionTitle: string) => void;
}> = ({ section, accent, accentLight, onArticlePress, onViewAll }) => (
    <View style={styles.sectionRow}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionCount}>{section.article_count} articles</Text>
        </View>

        <FlatList
            data={section.articles}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardListContent}
            ItemSeparatorComponent={CardSeparator}
            renderItem={({ item }) => (
                <ArticleCard
                    item={item}
                    accentLight={accentLight}
                    onPress={() => onArticlePress(item.id, section.id)}
                />
            )}
        />

        <TouchableOpacity
            style={[styles.viewAllBtn, { backgroundColor: accent }]}
            onPress={() => onViewAll(section.id, section.title)}
            activeOpacity={0.8}
        >
            <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
    </View>
);

// ─────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────

const MFInvestorsDetail: React.FC<Props> = ({ navigation, route }) => {
    const { categoryId } = route.params;

    const [activeTab, setActiveTab] = useState<Tab>(categoryId === 6 ? 'informed' : 'beginners');
    const [beginnersSections, setBeginnersSections] = useState<MFChildCategory[]>([]);
    const [informedSections, setInformedSections] = useState<MFChildCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const theme = THEME[activeTab];
    const sections = activeTab === 'beginners' ? beginnersSections : informedSections;

    useEffect(() => {
        getMutualFundCategories()
            .then(cats => {
                setBeginnersSections(cats.find(c => c.id === 5)?.children ?? []);
                setInformedSections(cats.find(c => c.id === 6)?.children ?? []);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleArticlePress = (articleId: number, sectionId: number) => {
        navigation.navigate('ArticleDetails', { articleId, sectionId });
    };

    const handleViewAll = (sectionId: number, sectionTitle: string) => {
        navigation.navigate('MFSectionArticles', { sectionId, sectionTitle });
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bgPage }]} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.borderBottom }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={[styles.backIcon, { color: theme.accent }]}>‹</Text>
                </TouchableOpacity>
                <View style={styles.headerTextWrap}>
                    <Text style={styles.headerTitle}>{theme.headerTitle}</Text>
                    <Text style={styles.headerSubtitle}>{theme.headerSubtitle}</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={theme.accent} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Pill Toggle */}
                    <View style={styles.toggleWrap}>
                        <PillToggle value={activeTab} onChange={setActiveTab} />
                    </View>

                    {/* Sections */}
                    {sections.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyText}>No content available.</Text>
                        </View>
                    ) : (
                        sections.map(section => (
                            <SectionRow
                                key={section.id}
                                section={section}
                                accent={theme.accent}
                                accentLight={theme.accentLight}
                                onArticlePress={handleArticlePress}
                                onViewAll={handleViewAll}
                            />
                        ))
                    )}

                    <View style={styles.footer} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

export default MFInvestorsDetail;

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const toggle = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 50,
        padding: 4,
    },
    activeBtn: {
        flex: 1,

        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inactiveBtn: {
        flex: 1,

        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.1,
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    inactiveText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
});

const styles = StyleSheet.create({
    safeArea: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backBtn: { marginRight: 10, paddingRight: 4 },
    backIcon: { fontSize: 28, fontWeight: '600', lineHeight: 30 },
    headerTextWrap: { flex: 1 },
    headerTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.3,
    },
    headerSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    scrollContent: { paddingBottom: 20 },

    toggleWrap: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },

    emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 60 },
    emptyText: { fontSize: 14, color: '#9CA3AF' },

    sectionRow: { marginBottom: 28 },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '800',
        color: '#1F2937',
        letterSpacing: -0.2,
    },
    sectionCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
    },

    cardListContent: { paddingHorizontal: 16, paddingBottom: 4 },
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
        height: CARD_WIDTH * 0.7,
    },
    thumb: { width: '100%', height: '100%' },
    cardBody: { padding: 10 },
    cardTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 17,
    },

    viewAllBtn: {
        alignSelf: 'flex-start',
        marginTop: 14,
        marginHorizontal: 16,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 8,
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
    cardSeparator: { width: 12 },
    footer: { height: 40 },
});
