import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../../../modules/ecommerce/navigation/types';
import { fetchNewArrivals } from '../../ecommerce/api/PromotionalApi';
import SkeletonBox from '../../services/component/constant/SkeletonBox';
import { useBbpsTheme } from '../utils/useBbpsTheme';

const CARD_WIDTH = 160; // Increased width for aesthetic spacing

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type BbpsTheme = ReturnType<typeof useBbpsTheme>;

// Aesthetic Gradient Text Component
const GradientText = ({ text, bbpsTheme }: { text: string; bbpsTheme: BbpsTheme }) => (
  <MaskedView
    maskElement={<Text style={styles.viewMoreText}>{text}</Text>}
  >
    <LinearGradient
      colors={bbpsTheme.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[styles.viewMoreText, { opacity: 0 }]}>{text}</Text>
    </LinearGradient>
  </MaskedView>
);

function RewardProductCard() {
  const navigation = useNavigation<Nav>();
  const bbpsTheme = useBbpsTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);



  const fetchProducts = useCallback(async () => {

    setLoading(true);

    try {

      const res = await fetchNewArrivals();

      const rawList =

        (Array.isArray(res?.products) && res.products) ||

        (Array.isArray(res?.data?.products) && res.data.products) ||

        (Array.isArray(res?.data) && res.data) ||

        [];



      const transformed = rawList.map((item: any, index: number) => ({

        ...item,

        id: item?.product_id ?? item?.id ?? `reward-${index}`,

        title: item?.product_name ?? item?.title ?? 'Product',

        brand: item?.brand_name ?? item?.brand ?? '',

        image: item?.image,

        oldPrice: item?.old_price ?? item?.original_price,

      }));



      setProducts(transformed);

    } catch (error: any) {

      console.error('Rewards Fetch Error:', error?.message || error);

      setProducts([]);

    } finally {

      setLoading(false);

    }

  }, []);



  useFocusEffect(

    useCallback(() => {

      fetchProducts();

    }, [fetchProducts])

  );



  return (
    <View style={[styles.container, { backgroundColor: bbpsTheme.colors.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: bbpsTheme.colors.textStrong }]}>Rewards</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductScreen')}>
          <GradientText text="View More" bbpsTheme={bbpsTheme} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <View
                key={`skeleton-${i}`}
                style={[
                  styles.cardContainer,
                  {
                    backgroundColor: bbpsTheme.colors.surface,
                    borderColor: bbpsTheme.colors.border,
                    shadowColor: bbpsTheme.colors.shadow,
                  },
                ]}
              >
                <View style={[styles.imageSection, { backgroundColor: bbpsTheme.colors.iconBg }]}>
                  <SkeletonBox pulse={pulse} width="100%" height={120} borderRadius={0} />
                </View>
                <View style={styles.detailsSection}>
                  <SkeletonBox pulse={pulse} width="80%" height={16} borderRadius={8} />
                  <SkeletonBox pulse={pulse} width="60%" height={12} borderRadius={8} style={{ marginTop: 8 }} />
                </View>
              </View>
            ))
          : products.map((item) => (
          <View
            key={item.id}
            style={[
              styles.cardContainer,
              {
                backgroundColor: bbpsTheme.colors.surface,
                borderColor: bbpsTheme.colors.border,
                shadowColor: bbpsTheme.colors.shadow,
              },
            ]}
          >
            {/* Top Image Section */}
            <View style={[styles.imageSection, { backgroundColor: bbpsTheme.colors.iconBg }]}>
               <Image source={{ uri: item.image }} style={styles.productImg} />
               <View style={[styles.brandBadge, { backgroundColor: bbpsTheme.isDark ? 'rgba(17,17,19,0.92)' : 'rgba(255,255,255,0.9)' }]}>
                  <Text style={[styles.brandBadgeText, { color: bbpsTheme.colors.text }]}>{item.brandLogo}</Text>
               </View>
            </View>
            
            {/* Bottom Text Section */}
            <View style={styles.detailsSection}>
              <Text style={[styles.cardTitle, { color: bbpsTheme.colors.textStrong }]}>{item.title}</Text>
              <Text style={[styles.cardSubTitle, { color: bbpsTheme.colors.muted }]} numberOfLines={2}>
                {item.sub}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FBFBFF', // Slightly off-white for aesthetic contrast
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 20, // High rounding for aesthetic look
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  imageSection: {
    height: 120,
    backgroundColor: '#E8E8E8',
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#333',
  },
  detailsSection: {
    padding: 12,
    height: 80,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  cardSubTitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    lineHeight: 16,
  },
});

export default RewardProductCard;
