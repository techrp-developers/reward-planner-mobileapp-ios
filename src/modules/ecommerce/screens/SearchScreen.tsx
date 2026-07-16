import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginHead from "../constants/heading/LoginHead";
import { fetchSearchSuggestions, getProductImageUrl, saveSearchHistory, getSearchHistory, clearSearchHistory } from "../api/ProductApi";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { HomeStackParamList } from "../navigation/types";
import SkeletonBox from "../../services/component/constant/SkeletonBox";

type SearchSuggestion = {
    id: number;
    title: string;
    image?: string;
    type?: "product" | "category" | string;
};

type SearchHistoryItem = string | { keyword?: string; title?: string; q?: string };

const BRAND_PURPLE = "#852BAF";
const BRAND_PURPLE_LIGHT = "#A654CD";

function SearchScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [history, setHistory] = useState<string[]>([]);
    const [loadingSuggest, setLoadingSuggest] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showSuggest, setShowSuggest] = useState(false);
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
                Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
            ])
        );

        animation.start();
        return () => animation.stop();
    }, [pulse]);

    const normalizeHistoryItem = useCallback((item: SearchHistoryItem): string => {
        if (typeof item === "string") return item.trim();
        return (item?.keyword || item?.title || item?.q || "").trim();
    }, []);

    const loadHistory = useCallback(async () => {
        try {
            setLoadingHistory(true);
            const res = await getSearchHistory();
            if (res?.success) {
                const normalized = (res.history || [])
                    .map((item: SearchHistoryItem) => normalizeHistoryItem(item))
                    .filter(Boolean);
                setHistory(Array.from(new Set(normalized)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingHistory(false);
        }
    }, [normalizeHistoryItem]);

    // Load History on Mount
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const handleSelectSuggestion = async (item: SearchSuggestion) => {
        setShowSuggest(false);
        setSearch(item.title);
        const normalizedType = String(item?.type || "product").trim().toLowerCase();

        if (normalizedType === "category") {
            navigation.navigate("Category", {
                categoryId: Number(item.id),
                title: item.title,
            });
        } else {
            navigation.navigate("ProductDescription", { productId: item.id });
        }

        try {
            await saveSearchHistory(item.title.trim());
            loadHistory();
        } catch (error) {
            console.error("Failed to save search history", error);
        }
    };

    const handleHistoryPress = (value: string) => {
        setSearch(value);
        if (value.trim().length >= 2) {
            setShowSuggest(true);
        }
    };

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (search.trim().length < 2) {
                setSuggestions([]);
                setShowSuggest(false);
                return;
            }
            try {
                setLoadingSuggest(true);
                const res = await fetchSearchSuggestions(search);
                if (res?.success) {
                    setSuggestions(res.suggestions || []);
                    setShowSuggest(true);
                } else {
                    setSuggestions([]);
                    setShowSuggest(true);
                }
            } catch (e) {
                console.error(e);
                setSuggestions([]);
                setShowSuggest(true);
            } finally {
                setLoadingSuggest(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [search]);

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <LoginHead
                showSearch
                search={search}
                onChangeSearch={setSearch}
                onFocusSearch={() => search.length >= 2 && setShowSuggest(true)}
            />

            {showSuggest ? (
                <View style={styles.suggestionWrapper}>
                    <ScrollView
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.suggestionScrollContent}
                    >
                        {loadingSuggest ? (
                            <View style={styles.loaderContainer}>
                                {Array.from({ length: 4 }).map((_, index) => (
                                    <View key={`suggest-skeleton-${index}`} style={styles.searchSkeletonItem}>
                                        <SkeletonBox pulse={pulse} width={46} height={46} borderRadius={14} />
                                        <View style={styles.searchSkeletonTextWrap}>
                                            <SkeletonBox pulse={pulse} width="82%" height={12} borderRadius={999} />
                                            <SkeletonBox pulse={pulse} width="42%" height={10} borderRadius={999} style={styles.searchSkeletonTag} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : suggestions.length === 0 ? (
                            <View style={styles.emptyStateWrap}>
                                <View style={styles.emptyIconCircle}>
                                    <MaterialCommunityIcons name="text-search" size={26} color={BRAND_PURPLE_LIGHT} />
                                </View>
                                <Text style={styles.noResultText}>No product found</Text>
                                <Text style={styles.emptySubText}>Try a different keyword</Text>
                            </View>
                        ) : (
                            suggestions.map((item) => {
                                const isCategory = String(item?.type || "product").trim().toLowerCase() === "category";
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        activeOpacity={0.75}
                                        style={styles.item}
                                        onPress={() => handleSelectSuggestion(item)}
                                    >
                                        <View style={styles.imageContainer}>
                                            <Image
                                                source={{ uri: getProductImageUrl(item.image) }}
                                                style={styles.img}
                                            />
                                        </View>
                                        <View style={styles.textContainer}>
                                            <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
                                            <View style={[styles.tagPill, isCategory ? styles.tagPillCategory : styles.tagPillProduct]}>
                                                <Text style={[styles.categoryTag, isCategory && styles.categoryTagCategory]}>
                                                    {isCategory ? "Category" : "Product"}
                                                </Text>
                                            </View>
                                        </View>
                                        <View style={styles.arrowCircle}>
                                            <MaterialCommunityIcons name="arrow-top-left" size={16} color={BRAND_PURPLE_LIGHT} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.historyTitle}>Past Searches</Text>
                        <View style={styles.historyActions}>
                          <TouchableOpacity onPress={loadHistory} style={styles.actionButton} activeOpacity={0.75}>
                            <MaterialCommunityIcons name="refresh" size={17} color={BRAND_PURPLE_LIGHT} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={async () => {
                              try {
                                const res = await clearSearchHistory();
                                if (res?.success) {
                                  await loadHistory();
                                  Alert.alert("Success", "Search history cleared.");
                                } else {
                                  throw new Error("Failed to clear history");
                                }
                              } catch (error) {
                                console.error("clearSearchHistory", error);
                                Alert.alert("Error", "Unable to clear search history. Please try again.");
                              }
                            }}
                            style={[styles.actionButton, styles.actionButtonDanger]}
                            activeOpacity={0.75}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={17} color="#EB5757" />
                          </TouchableOpacity>
                        </View>
                    </View>

                    {loadingHistory ? (
                        <View style={styles.historySkeletonWrap}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <SkeletonBox
                                    key={`history-skeleton-${index}`}
                                    pulse={pulse}
                                    width={index % 2 === 0 ? 110 : 150}
                                    height={36}
                                    borderRadius={20}
                                    style={styles.historySkeletonChip}
                                />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.chipWrap}>
                            {history.length > 0 ? history.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.chip}
                                    activeOpacity={0.75}
                                    onPress={() => handleHistoryPress(item)}
                                >
                                    <MaterialCommunityIcons name="magnify" size={14} color={BRAND_PURPLE_LIGHT} />
                                    <Text style={styles.chipText}>{item}</Text>
                                </TouchableOpacity>
                            )) : (
                                <View style={styles.emptyStateWrap}>
                                    <View style={styles.emptyIconCircle}>
                                        <MaterialCommunityIcons name="clock-outline" size={26} color={BRAND_PURPLE_LIGHT} />
                                    </View>
                                    <Text style={styles.emptyText}>No recent searches</Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7FB",
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 18,
    },
    suggestionWrapper: {
        flex: 1,
        backgroundColor: "#F8F7FB",
        paddingTop: 10,
    },
    suggestionScrollContent: {
        paddingHorizontal: 14,
        paddingBottom: 24,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: "#5B1E7A",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    imageContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "#F8F7FB",
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    img: {
        width: 30,
        height: 30,
        resizeMode: "contain",
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 15,
        color: "#1F1B24",
        fontWeight: "600",
    },
    tagPill: {
        alignSelf: "flex-start",
        marginTop: 5,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    tagPillProduct: {
        backgroundColor: "#F1F0F5",
    },
    tagPillCategory: {
        backgroundColor: "#F3E9FB",
    },
    categoryTag: {
        fontSize: 10.5,
        fontWeight: "700",
        color: "#8A8694",
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
    categoryTagCategory: {
        color: BRAND_PURPLE,
    },
    arrowCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "#F3E9FB",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
    },
    historyHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    historyTitle: {
        fontSize: 19,
        fontWeight: "800",
        color: "#1F1B24",
        letterSpacing: -0.4,
    },
    historyActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    actionButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3E9FB",
    },
    actionButtonDanger: {
        backgroundColor: "#FDEDED",
    },
    chipWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 22,
        marginRight: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#EEEAF4",
        shadowColor: "#5B1E7A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 1,
    },
    chipText: {
        marginLeft: 7,
        fontSize: 13,
        color: "#3F3A47",
        fontWeight: "600",
    },
    loaderContainer: {
        padding: 24,
        alignItems: 'stretch',
    },
    msg: {
        marginTop: 10,
        color: "#888",
    },
    historyLoader: {
        marginTop: 20,
    },
    searchSkeletonItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    searchSkeletonTextWrap: {
        flex: 1,
        marginLeft: 15,
    },
    searchSkeletonTag: {
        marginTop: 8,
    },
    historySkeletonWrap: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 8,
    },
    historySkeletonChip: {
        marginRight: 10,
        marginBottom: 10,
    },
    emptyStateWrap: {
        alignItems: "center",
        paddingVertical: 36,
        width: "100%",
    },
    emptyIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#F3E9FB",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    noResultText: {
        color: "#3F3A47",
        fontSize: 14,
        fontWeight: "700",
    },
    emptySubText: {
        marginTop: 4,
        color: "#A6A1AE",
        fontSize: 12,
    },
    emptyText: {
        color: "#A6A1AE",
        fontSize: 13,
        fontWeight: "500",
    }
});

export default SearchScreen;
