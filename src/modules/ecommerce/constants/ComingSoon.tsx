import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import type { RouteProp } from '@react-navigation/native';
import { useRoute } from '@react-navigation/native';
import coming_soon from "../../../assets/product/coming_soon.png";

const { width } = Dimensions.get('window');

type ComingSoonRouteParams = {
  ComingSoon: { moduleName?: string } | undefined;
};

const ComingSoonScreen = () => {
  const route = useRoute<RouteProp<ComingSoonRouteParams, 'ComingSoon'>>();
  const moduleName = route?.params?.moduleName || 'Dashboard';
  const [imageError, setImageError] = React.useState(false);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        // Soft Blue -> Pale Purple -> Soft Pink transition
        colors={['#BCC5FF', '#F9E1FF', '#FFB6D9']} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }}  
        style={styles.gradientSection}
      >
        <SafeAreaView style={styles.safeArea}>
          
          {/* Header Section: Module Name */}
          <View style={styles.header}>
            <Text style={styles.moduleText}>{moduleName}</Text>
            <View style={styles.accentBar} />
          </View>

          {/* Main Content Area */}
          <View style={styles.centerContent}>
            <View style={styles.imageContainer}>
              {!imageError ? (
                <Image 
                  source={coming_soon} 
                  style={styles.mainImage}
                  resizeMode="contain"
                  onError={() => {
                    console.log('Image failed to load');
                    setImageError(true);
                  }}
                  onLoad={() => console.log('✅ Coming Soon image loaded')}
                />
              ) : (
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderText}>🚀</Text>
                  <Text style={styles.placeholderLabel}>Coming Soon</Text>
                </View>
              )}
            </View>

            {/* Modern Typography Group */}
            <View style={styles.textGroup}>
              <Text style={styles.headline}>Feature Under Development</Text>
              <Text style={styles.description}>
                We're polishing the <Text style={styles.boldText}>{moduleName}</Text> module to give you the best experience. 
                Stay tuned for the update!
              </Text>
            </View>
          </View>

          {/* Bottom Minimal Footer */}
          <View style={styles.footer}>
            <View style={styles.statusPill}>
              <View style={styles.dot} />
              <Text style={styles.statusText}>v2.0 Progressing</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientSection: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 25,
    alignItems: 'flex-end',
  },
  moduleText: {
    color: '#3E4A89', // Deep blue for better contrast on light background
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  accentBar: {
    height: 4,
    width: 24,
    backgroundColor: '#3E4A89',
    marginTop: 6,
    borderRadius: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageContainer: {
    width: width,
    height: width * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 20,
  },
  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  textGroup: {
    marginTop: 20,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  headline: {
    color: '#1A1A1A', // Sharp dark text
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    color: '#555555', // Softer grey for subtext
    fontSize: 15,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Frosted glass effect
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D23061', // Use your old brand color for the "active" dot
    marginRight: 8,
  },
  statusText: {
    color: '#3E4A89',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholderBox: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  placeholderText: {
    fontSize: 80,
    marginBottom: 10,
  },
  placeholderLabel: {
    color: '#3E4A89',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ComingSoonScreen;