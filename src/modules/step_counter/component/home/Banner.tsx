import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

export default function Banner() {
  return (
    <View>
      {/* Banner Image */}
      <ImageBackground
        source={require('../assets/homepage/home_banner.png')}
        style={styles.bannerImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
      </ImageBackground>

      {/* Search Bar - Reduced Width */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={22} color="#999" />

          <TextInput
            style={styles.searchInput}
            placeholder="Pay by name or phone"
            placeholderTextColor="#999"
          />

          <TouchableOpacity style={styles.filterButton}>
            <MaterialCommunityIcons
              name="tune-vertical"
              size={22}
              color="#007AFF"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Card with Gradient */}
      <LinearGradient
          colors={['#714DF3', '#4D34A6']}
        style={styles.balanceCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Image
          source={require('../assets/homepage/Coin.png')}
          style={styles.balanceImage}
        />

        <View style={styles.balanceTextBox}>
          <Text style={styles.balanceTitle}>My Balance</Text>
          <Text style={styles.balanceValue}>1500 Coins</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  bannerImage: {
    width: '100%',
    height: width * 0.95,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    opacity: 0.1,
  },
  searchWrapper: {
    marginTop: -28,
    paddingHorizontal: 16,
    alignItems: 'center', // Center the search bar
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 6,
    width: '80%', // Reduced width to 90% of parent
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  filterButton: {
    padding: 6,
  },

  /* ⭐ Balance Card Styling with Gradient */
  balanceCard: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    elevation: 5,
    marginTop: 16,
    shadowColor: '#5B47A3',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    margin: 18,
    // borderRadius: 16
  },

  balanceImage: {
    width: 48,
    height: 48,
  },

  balanceTextBox: {
    marginLeft: 12,
  },

  balanceTitle: {
    fontSize: 14,
    color: '#FDFFB3', // Light text
  },

  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
});