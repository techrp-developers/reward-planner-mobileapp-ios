import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../../navigation/types';
import Tribal from './tribal';
import QuickPill from '../../../constants/product_cart/QuickPill';
import Product_Card from '../product_section/Categories_Product';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function TribalScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#000" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tribal</Text>

        <TouchableOpacity style={styles.iconBtn}>
          <MaterialIcons name="favorite-border" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Tribal />
        <LinearGradient
          colors={['#F6E6D0', '#FFFFFF']}
          style={styles.gradientSection}
        >
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.filterIcon}>
              <MaterialIcons name="tune" size={18} color="#000" />
            </TouchableOpacity>

            <QuickPill label="4+ Stars ⭐" />
            <QuickPill label="Best Offers" />
            <QuickPill label="New Arrivals" />
            <QuickPill label="Under ₹999" />
          </View>

          <View style={styles.productsSection}>
            <Product_Card/>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
  );
}

export default TribalScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  /* GRADIENT */
  gradientSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },

  /* QUICK ACTION BAR */
  quickActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 12,
  },

  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  pill: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },

  pillText: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* PRODUCTS */
  productsSection: {
    paddingHorizontal: 12,
    marginTop: 8,
  },
});
