import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
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
import RenderHtml from 'react-native-render-html';
import { getSectionContent, type MFArticleDetails } from '../../api/MutualFundAPI';
import type { HomeStackParamList } from '../../navigation/type';
import { useServicesTheme } from '../../utils/useServicesTheme';

const { width } = Dimensions.get('window');

type ArticleDetailsRouteProp = RouteProp<HomeStackParamList, 'ArticleDetails'>;

function ArticleDetails() {
    const route = useRoute<ArticleDetailsRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const servicesTheme = useServicesTheme();
    const { articleId, sectionId } = route.params;

    const [article, setArticle] = useState<MFArticleDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getSectionContent(sectionId)
            .then(content => {
                const found = content.articles.find(a => a.id === articleId);
                setArticle(found ?? null);
            })
            .catch(() => setArticle(null))
            .finally(() => setLoading(false));
    }, [articleId, sectionId]);

    const themedHtmlStyles = useMemo(() => ({
        h2: { ...htmlTagStyles.h2, color: servicesTheme.colors.textStrong },
        h3: { ...htmlTagStyles.h3, color: servicesTheme.colors.text },
        p: { ...htmlTagStyles.p, color: servicesTheme.colors.muted },
        li: { ...htmlTagStyles.li, color: servicesTheme.colors.muted },
        strong: { ...htmlTagStyles.strong, color: servicesTheme.colors.textStrong },
        em: { ...htmlTagStyles.em, color: servicesTheme.colors.subtle },
    }), [servicesTheme.colors.muted, servicesTheme.colors.subtle, servicesTheme.colors.text, servicesTheme.colors.textStrong]);

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: servicesTheme.colors.background }]} edges={['top']}>
            <StatusBar barStyle={servicesTheme.isDark ? "light-content" : "dark-content"} backgroundColor={servicesTheme.colors.surface} />

            <View style={[styles.header, { backgroundColor: servicesTheme.colors.surface, borderBottomColor: servicesTheme.colors.divider, shadowColor: servicesTheme.colors.shadow }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: servicesTheme.colors.surfaceAlt }]}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={[styles.backIcon, { color: servicesTheme.colors.text }]}>‹</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: servicesTheme.colors.textStrong }]} numberOfLines={1}>
                    {article ? article.title : 'Article'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={servicesTheme.colors.primary} />
                </View>
            ) : !article ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: servicesTheme.colors.muted }]}>Article not found.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={{ uri: article.banner_image }}
                        style={styles.banner}
                        resizeMode="contain"
                    />

                    <View style={styles.content}>
                        <Text style={[styles.title, { color: servicesTheme.colors.textStrong }]}>{article.title}</Text>
                        <Text style={[styles.shortDesc, { color: servicesTheme.colors.muted }]}>{article.short_description}</Text>
                        <View style={[styles.divider, { backgroundColor: servicesTheme.colors.divider }]} />

                        <RenderHtml
                            contentWidth={width - 32}
                            source={{ html: article.article_content }}
                            tagsStyles={themedHtmlStyles}
                            renderersProps={{
                                img: { enableExperimentalPercentWidth: true },
                            }}
                        />

                        {!!article.cta_text && <Text style={styles.ctaText}>{article.cta_text}</Text>}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

export default ArticleDetails;

const htmlTagStyles = {
    h2: {
        fontSize: 16,
        fontWeight: '700' as const,
        color: '#1F2937',
        marginTop: 20,
        marginBottom: 8,
    },
    h3: {
        fontSize: 14,
        fontWeight: '700' as const,
        color: '#374151',
        marginTop: 14,
        marginBottom: 6,
    },
    p: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 10,
    },
    li: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 22,
    },
    strong: {
        fontWeight: '700' as const,
        color: '#1F2937',
    },
    em: {
        fontSize: 12,
        color: '#9CA3AF',
    },
};

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
        borderBottomColor: '#F0F0F0',
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
        color: '#1F2937',
        lineHeight: 30,
        marginTop: -2,
    },
    headerTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#6B7280',
    },
    scroll: {
        paddingBottom: 48,
    },
    banner: {
        width: '100%',
        height: 240,
        backgroundColor: '#E5E7EB',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        lineHeight: 28,
        marginBottom: 10,
    },
    shortDesc: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 21,
        marginBottom: 14,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 16,
    },
    ctaBtn: {
        marginTop: 28,
        backgroundColor: '#3545A3',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    ctaText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.2,
    },
});
