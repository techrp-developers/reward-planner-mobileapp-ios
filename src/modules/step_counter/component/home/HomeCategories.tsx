import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';

const categories = [
  {
    id: '1',
    name: 'Food',
    image: require('../assets/homepage/Group.png'),
  },
  {
    id: '2',
    name: 'Shopping',
    image: require('../assets/homepage/food_pack.png'),
  },
  {
    id: '3',
    name: 'Entertainment',
    image: require('../assets/homepage/sparts.png'),
  },
  {
    id: '4',
    name: 'Travel',
    image: require('../assets/homepage/atm_gift.png'),
  },
];

export default function HomeCategories() {
  return (
    <View style={styles.container}>
      {/* Categories Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity key={category.id} style={styles.categoryItem}>
            <View style={styles.imageContainer}>
              <Image 
                source={category.image} 
                style={styles.categoryImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* All Categories Button */}
      <TouchableOpacity style={styles.allCategoriesButton}>
        <View style={styles.categoryRow}>
          <Image
            source={require('../assets/homepage/menu.png')}
            style={styles.homecategoriesImage}
          />
          <Text style={styles.categoryText}>All Categories</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FEF4FF', // Light pastel pink background
    padding: 20, // Padding on all sides
    margin: 18,
    borderRadius: 16, // Rounded corners
  },
  categoriesContainer: {
    paddingRight: 16,
    paddingBottom: 16, // Space between categories and button
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  imageContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#FEF4FF',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    
    // Shadow effects
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    
    // Border for better visibility
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  categoryImage: {
    width: 32,
    height: 32,
  },
  categoryName: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
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