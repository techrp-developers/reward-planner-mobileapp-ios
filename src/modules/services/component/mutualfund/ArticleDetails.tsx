import React, { useEffect, useState } from 'react';
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

const { width } = Dimensions.get('window');

type ArticleDetailsRouteProp = RouteProp<HomeStackParamList, 'ArticleDetails'>;

function ArticleDetails() {
    const route = useRoute<ArticleDetailsRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
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

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {article ? article.title : 'Article'}
                </Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#8665FF" />
                </View>
            ) : !article ? (
                <View style={styles.center}>
                    <Text style={styles.errorText}>Article not found.</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <Image
                        source={{ uri: article.banner_image }}
                        style={styles.banner}
                        resizeMode="cover"
                    />

                    <View style={styles.content}>
                        <Text style={styles.title}>{article.title}</Text>
                        <Text style={styles.shortDesc}>{article.short_description}</Text>
                        <View style={styles.divider} />

                        <RenderHtml
                            contentWidth={width - 32}
                            source={{ html: article.article_content }}
                            tagsStyles={htmlTagStyles}
                        />

                        {!!article.cta_text && (
                            <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
                                <Text style={styles.ctaText}>{article.cta_text}</Text>
                            </TouchableOpacity>
                        )}
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
        height: 220,
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
        backgroundColor: '#8665FF',
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
