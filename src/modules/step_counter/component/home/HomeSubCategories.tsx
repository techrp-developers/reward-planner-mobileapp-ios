import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = screenWidth * 0.4;

export default function HomeSubCategories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const underlineAnim = useRef(new Animated.Value(0)).current;

  const categoryItems = [
    { id: 1, name: 'Electronics', image: require('../assets/homepage/subcategories(1).png') },
    { id: 2, name: 'Fashion', image: require('../assets/homepage/subcategories(2).png') },
    { id: 3, name: 'Home', image: require('../assets/homepage/subcategories(3).png') },
    { id: 4, name: 'Beauty', image: require('../assets/homepage/subcategories(4).png') },
  ];

  const productData = [
    {
      id: 1, discount: '-40%', brand: 'BOAT', name: 'HAVIT HV-G92 Gamepad',
      currentPrice: '₹1,20,000', originalPrice: '₹1,50,000', points: '120',
      image: require('../assets/homepage/features_product(4).png'),
    },
    {
      id: 2, discount: '-40%', brand: 'GUCCI', name: 'Duffle Bag',
      currentPrice: '₹1,20,000', originalPrice: '₹1,50,000', points: '120',
      image: require('../assets/homepage/features_product(2).png'),
    },
    {
      id: 3, discount: '-35%', brand: 'SONY', name: 'Wireless Headphones',
      currentPrice: '₹15,999', originalPrice: '₹24,999', points: '95',
      image: require('../assets/homepage/features_product(3).png'),
    },
    {
      id: 4, discount: '-25%', brand: 'NIKE', name: 'Running Shoes',
      currentPrice: '₹4,999', originalPrice: '₹6,999', points: '75',
      image: require('../assets/homepage/features_product(1).png'),
    },
  ];

  const itemWidth = screenWidth / categoryItems.length;

  const handlePress = (index) => {
    setActiveIndex(index);

    Animated.spring(underlineAnim, {
      toValue: itemWidth * index,
      useNativeDriver: true,
      tension: 120,
      friction: 12,
    }).start();
  };

  const renderProductCard = useCallback((item) => (
    <View key={item.id} style={styles.productCard}>
    <View style={styles.discountBadgeWrapper}>
          <LinearGradient
            colors={['#FEB014', '#FFE486', '#F5B924']} // Gold/Yellow gradient
            style={styles.discountGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.discountBadgeText}>{item.discount}</Text>
          </LinearGradient>
        </View>


      <View style={styles.imageWrapper}>
        <Image
          source={item.image}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.productDetails}>
        <Text style={styles.brandName}>{item.brand}</Text>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>{item.currentPrice}</Text>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
        </View>

        <LinearGradient
          colors={['#714DF3', '#4D34A6']}
          style={styles.pointsGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsPriceValue}>₹1,10,000 +</Text>
            <View style={styles.pointsBadgeText}>
              <Image
                source={require('../assets/homepage/Coin.png')}
                style={styles.pointsIcon}
                tintColor="#FFFFFF"
              />
              <Text style={styles.pointsText}>{item.points} pts</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </View>
  ), []);

  return (
    <View style={styles.mainContainer}>
      
      {/* CATEGORY ROW */}
      <View style={styles.categoryRow}>
        {categoryItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.categoryItem, { width: itemWidth }]}
            onPress={() => handlePress(index)}
            activeOpacity={0.8}
          >
            <Image
              source={item.image}
              style={[
                styles.icon,
                activeIndex === index && styles.activeIcon
              ]}
              resizeMode="contain"
            />

            <Text 
              style={[
                styles.label,
                activeIndex === index && styles.activeLabel
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ANIMATED UNDERLINE */}
      <View style={styles.underlineBackground}>
        <Animated.View
          style={[
            styles.underline,
            { width: itemWidth, transform: [{ translateX: underlineAnim }] }
          ]}
        />
      </View>

      {/* PRODUCT SCROLL VIEW */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalProductContainer}
        style={styles.productScroll}
      >
        {productData.map(renderProductCard)}
      </ScrollView>

      {/* PRODUCT SCROLL VIEW */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalProductContainer}
        style={styles.productScroll}
      >
        {productData.map(renderProductCard)}
      </ScrollView>

      {/* All Categories Button - UPDATED */}
      <TouchableOpacity style={styles.allCategoriesButton}>
        <View style={styles.allCategoriesContent}>
          <Image
            source={require('../assets/homepage/menu.png')}
            style={styles.homecategoriesImage}
          />
          <Text style={styles.categoryText}>See All Products</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 5,
  },
  productScroll: {
    paddingTop: 15,
  },
  horizontalProductContainer: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 20,
  },

  // --- CATEGORY BAR STYLES ---
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  categoryItem: {
    alignItems: 'center',
  },
  icon: {
    width: 32,
    height: 32,
    opacity: 0.6,
  },
  activeIcon: {
    opacity: 1,
    transform: [{ scale: 1.05 }],
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  activeLabel: {
    color: '#714DF3',
    fontWeight: '700',
  },
  underlineBackground: {
    height: 3,
    backgroundColor: '#EDEDED',
    marginTop: 8,
  },
  underline: {
    height: 3,
    backgroundColor: '#714DF3',
    borderRadius: 10,
  },

  // --- PRODUCT CARD STYLES ---
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: PRODUCT_CARD_WIDTH,
    position: 'relative',
    minHeight: 280,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F7FAFC',
  },
 // --- NEW/MODIFIED DISCOUNT BADGE STYLES ---
  discountBadgeWrapper: {
    // Positioning wrapper (replaces original discountBadge's positioning)
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    borderRadius: 14, // Needs to be here so gradient respects border
    overflow: 'hidden',
  },
  discountGradient: {
    // Gradient style (replaces original discountBadge's visual properties)
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    // Add back shadow/elevation for the badge itself
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  discountBadgeText: { 
    // Text style
    color: '#000', // Changed to black/dark for contrast against yellow/gold gradient
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  imageWrapper: {
    backgroundColor: '#FEF4FF',
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    paddingTop: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF4FF',
  },
  productImage: {
    width: 80,
    height: 80,
  },
  productDetails: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  brandName: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  productName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 8,
    lineHeight: 16,
    height: 32,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#48BB78',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 11,
    color: '#A0AEC0',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  pointsGradient: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 'auto',
  },
  pointsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsPriceValue: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  pointsBadgeText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  pointsIcon: {
    width: 10,
    height: 10,
    marginRight: 3,
  },
  pointsText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // --- UPDATED ALL CATEGORIES BUTTON STYLES ---
  allCategoriesButton: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20, // Added proper left and right padding
    marginHorizontal: 16, // Added margin to ensure proper spacing from screen edges
    marginTop: 8,
    alignSelf: 'stretch', // Ensures button takes full available width minus margins
    
    // Shadow for button
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  allCategoriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  homecategoriesImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5941b1ff',
  },
});