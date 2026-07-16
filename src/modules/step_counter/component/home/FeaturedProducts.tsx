import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, FlatList } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function FeaturedProductsGrid() {
  const data = [
    {
      id: 1,
      discount: '-40%',
      brand: 'BOAT',
      name: 'HAVIT HV-G92 Gamepad',
      currentPrice: '₹1,20,000',
      originalPrice: '₹1,50,000',
      points: '120',
      image: require('../assets/homepage/features_product(4).png'),
    },
    {
      id: 2,
      discount: '-40%',
      brand: 'GUCCI',
      name: 'Duffle Bag',
      currentPrice: '₹1,20,000',
      originalPrice: '₹1,50,000',
      points: '120',
      image: require('../assets/homepage/features_product(2).png'),
    },
    // Add more items to test 2-column layout
    {
      id: 3,
      discount: '-35%',
      brand: 'SONY',
      name: 'Wireless Headphones',
      currentPrice: '₹15,999',
      originalPrice: '₹24,999',
      points: '95',
      image: require('../assets/homepage/features_product(3).png'),
    },
    {
      id: 4,
      discount: '-25%',
      brand: 'NIKE',
      name: 'Running Shoes',
      currentPrice: '₹4,999',
      originalPrice: '₹6,999',
      points: '75',
      image: require('../assets/homepage/features_product(1).png'),
    },
  ];

  const renderProductItem = useCallback(
    ({ item }) => (
      <View style={styles.productCard}>
        <View style={styles.discountBadgeWrapper}>
                   {' '}
          <LinearGradient
            colors={['#FEB014', '#FFE486', '#F5B924']} // Gold/Yellow gradient
            style={styles.discountGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
                       {' '}
            <Text style={styles.discountBadgeText}>{item.discount}</Text>       
             {' '}
          </LinearGradient>
                 {' '}
        </View>

        {/* Product Image with Shadow */}
        <View style={styles.imageWrapper}>
          <Image
            source={item.image}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.productDetails}>
          <Text style={styles.brandName}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Price Section */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{item.currentPrice}</Text>
            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          </View>

          {/* Points Section with Gradient */}
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
                />
                <Text style={styles.pointsText}>{item.points} pts</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      {/* Section Header with Trapezoid Design */}
      <View style={styles.sectionTitleContainer}>
        <Image
          source={require('../assets/homepage/Vector.png')}
          style={styles.vectorIcon}
        />
        <Text style={styles.sectionTitleText}>Featured This Week</Text>
        <Image
          source={require('../assets/homepage/Vector.png')}
          style={[styles.vectorIcon]}
        />
      </View>

      {/* Products Grid */}
      <FlatList
        data={data}
        renderItem={renderProductItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#714df320',

  },
  // Section Header Styles
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  sectionTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D3748',
    marginHorizontal: 12,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vectorIcon: {
    width: 35,
    height: 25,
    resizeMode: 'contain',
    tintColor: '#714DF3', // Match your theme color
  },
  vectorIconRight: {
    transform: [{ rotate: '180deg' }],
  },
  // FlatList Styles
  flatListContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  // Product Card Styles
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '48%',
    position: 'relative',
    minHeight: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    borderRadius: 14, // Add back shadow/elevation for the badge itself
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
    height: 150,
    justifyContent: 'center',
    paddingTop: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF4FF',
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productDetails: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    paddingTop: 12,
  },
  brandName: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 10,
    lineHeight: 18,
    flexShrink: 1,
    height: 36, // Fixed height for 2 lines
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#48BB78', // Green for current price
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#A0AEC0',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  pointsGradient: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 'auto',
  },
  pointsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsPriceValue: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  pointsBadgeText: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pointsIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: '#FFFFFF',
  },
  pointsText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  trapezoidTitleWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    transform: [{ perspective: 1000 }],
  },
  trapezoidBackground: {
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
