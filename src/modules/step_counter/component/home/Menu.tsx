import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';

export default function Menu() {
  const [activeTab, setActiveTab] = useState('Home');
  const [cartItems, setCartItems] = useState(3);

  const menuItems = [
    { id: 2, name: 'Home', icon: require('../assets/Menu/Men(1).png') },
    {
      id: 3,
      name: 'Bill Payment',
      icon: require('../assets/Menu/Men(2).png'),
      badge: cartItems,
    },
    { id: 1, name: '', icon: require('../assets/Menu/menu_home.png'), isLogo: true },
    { id: 4, name: 'Dine Out', icon: require('../assets/Menu/Men(3).png') },
    { id: 5, name: 'Search', icon: require('../assets/Menu/Men(4).png') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Bottom Menu */}
      <View style={styles.bottomMenu}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              !item.isLogo && styles.regularMenuItem,
              item.isLogo && styles.logoMenuItem
            ]}
            onPress={() => setActiveTab(item.name || 'Logo')}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              item.isLogo && styles.logoContainer
            ]}>
              <Image
                source={item.icon}
                style={[
                  styles.menuIcon,
                  activeTab === item.name && styles.activeMenuIcon,
                  item.isLogo && styles.logoIcon,
                ]}
                onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
              />
              {item.badge > 0 && !item.isLogo && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
              
              {/* Debug overlay for logo */}
              {item.isLogo && (
                <View style={styles.debugOverlay}>
                  <Text style={styles.debugText}>Logo</Text>
                </View>
              )}
            </View>
            {!item.isLogo && (
              <Text
                style={[
                  styles.menuText,
                  activeTab === item.name && styles.activeMenuText,
                ]}
              >
                {item.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  bottomMenu: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 15,
    height: 75,
  },
  menuItem: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  regularMenuItem: {
    flex: 1,
  },
  logoMenuItem: {
    flex: 1.2,
    marginTop: -150,
    zIndex: 10,
    paddingVertical: 0,
    height: 0,
  },
  iconContainer: {
    position: 'relative',
  },
  logoContainer: {
    backgroundColor: '#714DF3',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    alignSelf: 'center',
    bottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  menuIcon: {
    width: 24,
    height: 24,
    tintColor: '#888',
    marginBottom: 4,
    resizeMode: 'contain',
  },
  logoIcon: {
    width: 38,
    height: 38,
    tintColor: '#FFFFFF',
    marginBottom: 0,
  },
  activeMenuIcon: {
    tintColor: '#714DF3',
  },
  menuText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  activeMenuText: {
    color: '#714DF3',
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Debug styles
 
});