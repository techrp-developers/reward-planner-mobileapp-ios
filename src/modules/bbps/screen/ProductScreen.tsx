import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BBPSHead from '../constatnt/BBPSHead';
import { useBbpsTheme } from '../utils/useBbpsTheme';

type RewardItem = { id: string; title: string; sub: string; image: string; brand: string };

const REWARDS: RewardItem[] = [
  { id: '1', title: 'Minimalist', sub: 'Free Vitamin B5 Moisturizer worth 199', image: 'https://via.placeholder.com/150', brand: 'Minimalist' },
  { id: '2', title: 'PUMA', sub: 'Flat 40% Off + Extra 10% Off', image: 'https://via.placeholder.com/150', brand: 'PUMA' },
  { id: '3', title: 'The Man Company', sub: 'Get 60 Days Fragrant Kit at Just', image: 'https://via.placeholder.com/150', brand: 'The Man Company' },
  { id: '4', title: 'Hyphen', sub: 'Flat 200 Off + Extra 5% Off', image: 'https://via.placeholder.com/150', brand: 'Hyphen' },
  { id: '5', title: 'Hammer', sub: 'Flat 7000 Off', image: 'https://via.placeholder.com/150', brand: 'Skullcandy' },
  { id: '6', title: 'Foxtale', sub: 'Buy 1 Get 1 Free + Upto 5% Foxcoins', image: 'https://via.placeholder.com/150', brand: 'Foxtale' },
];

const ProductScreenComponent = () => {
  const navigation = useNavigation();
  const bbpsTheme = useBbpsTheme();

  const renderItem = useCallback(({ item: reward }: { item: RewardItem }) => {
    return (
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: bbpsTheme.colors.surface,
            borderColor: bbpsTheme.colors.border,
            shadowColor: bbpsTheme.colors.shadow,
          },
        ]}
      >
        {/* Top Image Section with Brand Badge */}
        <View style={[styles.imageSection, { backgroundColor: bbpsTheme.colors.iconBg }]}>
          <Image source={{ uri: reward.image }} style={styles.productImg} />
          <View style={[styles.brandBadge, { backgroundColor: bbpsTheme.isDark ? 'rgba(17,17,19,0.92)' : 'rgba(255,255,255,0.95)' }]}>
            <Text style={[styles.brandBadgeText, { color: bbpsTheme.colors.text }]}>{reward.brand}</Text>
          </View>
        </View>

        {/* Bottom Text Content */}
        <View style={styles.detailsSection}>
          <Text style={[styles.cardTitle, { color: bbpsTheme.colors.textStrong }]}>{reward.title}</Text>
          <Text style={[styles.cardSubTitle, { color: bbpsTheme.colors.muted }]} numberOfLines={2}>
            {reward.sub}
          </Text>
        </View>
      </View>
    );
  }, [bbpsTheme]);

  const keyExtractor = useCallback(
    (item: RewardItem) => item.id,
    []
  );

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bbpsTheme.colors.background }]}>
      {/* Strict use of custom ScreenHeader */}
      <BBPSHead
        title="Rewards"
        onBackPress={handleBackPress}
      />

      <FlatList
        data={REWARDS}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={8}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FE', // Light aesthetic background
  },
  listContent: {
    padding: 8,
    paddingBottom: 20,
  },
  skeletonLineGap: {
    marginTop: 8,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    margin: 8,
    borderRadius: 20, // Aesthetic rounded corners
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    // iOS Shadow
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    // Android Shadow
    elevation: 2,
  },
  imageSection: {
    height: 130,
    backgroundColor: '#F3F3F3',
    position: 'relative',
  },
  productImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  brandBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
    textTransform: 'uppercase',
  },
  detailsSection: {
    padding: 12,
    justifyContent: 'center',
    minHeight: 85,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardSubTitle: {
    fontSize: 11,
    color: '#6B7280', // Aesthetic gray
    marginTop: 4,
    lineHeight: 16,
  },
});

const ProductScreen = React.memo(ProductScreenComponent);
export default ProductScreen;
