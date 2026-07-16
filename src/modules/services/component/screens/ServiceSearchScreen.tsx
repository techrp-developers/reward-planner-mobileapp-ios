import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { HomeStackParamList } from '../../navigation/type';
import SkeletonBox from '../constant/SkeletonBox';
import ServiceHead from '../header/ServiceHead';
import {
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  type SearchSuggestion,
} from '../../api/SearchAPI';

type Props = NativeStackScreenProps<HomeStackParamList, 'ServiceSearch'>;

export default function ServiceSearchScreen({ navigation }: Props) {
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [suggestions, setSuggestions]     = useState<SearchSuggestion[]>([]);
  const [history, setHistory]             = useState<string[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pulse = useRef(new Animated.Value(0)).current;

  // ── skeleton pulse ─────────────────────────────────────────────────────────
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: false }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // ── load history on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setHistoryLoading(true);
      const data = await getSearchHistory();
      setHistory(data);
      setHistoryLoading(false);
    };
    load();
  }, []);

  // ── debounced suggestions — 300 ms ────────────────────────────────────────
  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const data = await getSearchSuggestions(search.trim());
      setSuggestions(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── tap suggestion → save + navigate ──────────────────────────────────────
  const handleSuggestionPress = useCallback(
    async (item: SearchSuggestion) => {
      await saveSearchHistory(item.title);
      setHistory((prev) =>
        [item.title, ...prev.filter((h) => h !== item.title)].slice(0, 10),
      );
      navigation.navigate('ServiceDescription', {
        serviceId: item.id,
        title: item.title,
      });
    },
    [navigation],
  );

  // ── tap history chip → prefill search ─────────────────────────────────────
  const handleHistoryPress = useCallback((keyword: string) => {
    setSearch(keyword);
  }, []);

  // ── clear all history ──────────────────────────────────────────────────────
  const handleClearHistory = useCallback(async () => {
    setHistory([]);
    await clearSearchHistory();
  }, []);

  const isSearchActive = search.trim().length >= 2;

  return (
    <SafeAreaView style={styles.root} edges={[ 'left', 'right', 'bottom']}>

      <ServiceHead
        showSearch
        search={search}
        onChangeSearch={setSearch}
        onBackPress={() => navigation.goBack()}
        autoFocus
      />

      <ScrollView
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── History (idle state) ── */}
        {!isSearchActive && (
          <>
            {historyLoading && (
              <View style={styles.chipsRow}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonBox key={i} pulse={pulse} width={100} height={34} borderRadius={20} />
                ))}
              </View>
            )}

            {!historyLoading && history.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Recent searches</Text>
                  <TouchableOpacity onPress={handleClearHistory}>
                    <Text style={styles.clearText}>Clear all</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.chipsRow}>
                  {history.map((keyword, idx) => (
                    <TouchableOpacity
                      key={`${keyword}-${idx}`}
                      style={styles.chip}
                      activeOpacity={0.7}
                      onPress={() => handleHistoryPress(keyword)}
                    >
                      <MaterialCommunityIcons name="history" size={13} color="#7C3AED" style={styles.chipIcon} />
                      <Text style={styles.chipText} numberOfLines={1}>{keyword}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {!historyLoading && history.length === 0 && (
              <Text style={styles.hint}>Type at least 2 characters to search services</Text>
            )}
          </>
        )}

        {/* ── Suggestion loading skeleton ── */}
        {isSearchActive && loading && (
          <View style={styles.skeletonWrap}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <SkeletonBox pulse={pulse} width={50} height={50} borderRadius={10} />
                <View style={styles.skeletonText}>
                  <SkeletonBox pulse={pulse} width="72%" height={13} borderRadius={999} />
                  <SkeletonBox pulse={pulse} width="44%" height={10} borderRadius={999} style={styles.skeletonGap} />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── No results ── */}
        {isSearchActive && !loading && suggestions.length === 0 && (
          <Text style={styles.noResult}>No services found for "{search}"</Text>
        )}

        {/* ── Results ── */}
        {isSearchActive && !loading && suggestions.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.row}
            onPress={() => handleSuggestionPress(item)}
          >
            <View style={styles.imgWrap}>
              <Image source={{ uri: item.image }} style={styles.img} resizeMode="contain" />
            </View>
            <View style={styles.mid}>
              <Text style={styles.rowName} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.rowType}>{item.type}</Text>
            </View>
            <MaterialCommunityIcons name="arrow-top-left" size={20} color="#bbb" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ── compact header ────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F0FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },

  list: {
    flex: 1,
    marginTop: 4,
  },

  hint: {
    paddingHorizontal: 20,
    paddingTop: 28,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  noResult: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 14,
    color: '#7A7A7A',
  },

  // ── history ───────────────────────────────────────────────────────────────
  historySection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  clearText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  chipIcon: {
    marginRight: 5,
  },
  chipText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
    maxWidth: 130,
  },

  // ── result row ────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F0F0F0',
  },
  imgWrap: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  img: {
    width: 38,
    height: 38,
  },
  mid: {
    flex: 1,
    marginLeft: 14,
  },
  rowName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  rowType: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // ── skeleton ──────────────────────────────────────────────────────────────
  skeletonWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  skeletonText: {
    flex: 1,
    marginLeft: 14,
  },
  skeletonGap: {
    marginTop: 8,
  },
});
