import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 3; 

export type CategoryItem = {
  id: number;
  label: string;
  catimage?: React.FC<any>;
};

export type ProductItem = {
  id: number;
  title: string;
  image: React.FC<any>;
  discount: string;
  price: string;
  originalPrice: string;
  rating: number;
  reviews: string;
  pointsPrice: string;
  points: number;
};

interface Props {
  categories: CategoryItem[];
  products: ProductItem[];
}

const ProductCarousel: React.FC<Props> = ({ categories, products }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const itemWidth = width / categories.length;

  const onCategoryPress = (index: number) => {
    setActiveIndex(index);
    Animated.spring(underlineAnim, {
      toValue: itemWidth * index,
      useNativeDriver: true,
    }).start();
  };

  /* -------------------- PRODUCT CARD -------------------- */
  const renderProduct = useCallback((item: ProductItem) => {
    const ProductSvg = item.image;

    return (
      <View key={item.id} style={styles.card}>
        {/* Discount */}
        <View style={styles.discountWrap}>
          <LinearGradient
            colors={['#FEB014', '#FFE486', '#F5B924']}
            style={styles.discount}
          >
            <Text style={styles.discountText}>{item.discount}</Text>
          </LinearGradient>
        </View>

        {/* Image */}
        <View style={styles.imageWrap}>
          <ProductSvg width={70} height={70} />
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>

          <View style={styles.ratingRow}>
            <Text style={styles.rating}>⭐ {item.rating}</Text>
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.original}>{item.originalPrice}</Text>
          </View>

          <LinearGradient colors={['#714DF3', '#4D34A6']} style={styles.points}>
            <Text style={styles.pointsText}>
              {item.pointsPrice} + {item.points}
            </Text>
          </LinearGradient>
        </View>
      </View>
    );
  }, []);

  return (
    <View>
      {/* -------- CATEGORIES -------- */}
      <View style={styles.categoryRow}>
        {categories.map((cat, index) => {
          const CatSvg = cat.catimage;
          return (
            <TouchableOpacity
              key={cat.id}
              style={{ width: itemWidth }} 
              onPress={() => onCategoryPress(index)}
            >
              {CatSvg && (
                <CatSvg
                  width={28}
                  height={28}
                  opacity={activeIndex === index ? 1 : 0.5}
                />
              )}

              <Text
                style={[
                  styles.catLabel,
                  activeIndex === index && styles.catActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Underline */}
      <View style={styles.underlineBg}>
        <Animated.View
          style={[
            styles.underline,
            { width: itemWidth, transform: [{ translateX: underlineAnim }] },
          ]}
        />
      </View>

      {/* -------- PRODUCTS GRID -------- */}
      <View style={styles.productRow}>
        {products.map(renderProduct)}
      </View>
    </View>
  );
};

export default ProductCarousel;

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: '#FFF',
  },
  catLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
    fontWeight: '600',
  },
  catActive: {
    color: '#714DF3',
  },
  underlineBg: {
    height: 3,
    backgroundColor: '#EEE',
    marginTop: 6,
  },
  underline: {
    height: 3,
    backgroundColor: '#714DF3',
    borderRadius: 6,
  },

  productRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    marginBottom: 16, // spacing between rows
  },

  discountWrap: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  discount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 10,
    fontWeight: '800',
  },

  imageWrap: {
    height: 120,
    backgroundColor: '#FEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    // paddingTop:40

  },

  details: {
    padding: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222',
  },
  ratingRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  rating: {
    fontSize: 11,
    fontWeight: '700',
  },
  reviews: {
    fontSize: 10,
    color: '#888',
    marginLeft: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: '#48BB78',
    marginRight: 6,
  },
  original: {
    fontSize: 10,
    textDecorationLine: 'line-through',
    color: '#AAA',
  },
  points: {
    marginTop: 8,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '700',
  },
});
