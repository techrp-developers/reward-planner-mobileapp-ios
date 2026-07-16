import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import BannerImage from '../../../../assets/homepage/banner_gift.svg';

const { width } = Dimensions.get('window');

const BANNER_HEIGHT = width * 0.35;
const IMAGE_SIZE = width * 0.45;

function HomeBanner() {
  return (
    <View>
      <LinearGradient
        colors={['#A95ACD', '#FC8BAD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.bannerBox}
      >
        <View style={styles.textBlock}>
          <Text style={styles.bannerTitle}>Big Savings. Bigger Smiles.</Text>

          <Text style={styles.bannerSubtitle}>
            Up to <Text style={styles.discount}>60% OFF</Text> across top categories
          </Text>

          <Text style={styles.terms}>*Terms & Conditions apply</Text>
        </View>

        <BannerImage style={styles.bannerImage} />
      </LinearGradient>
    </View>
  );
}

export default HomeBanner;

const styles = StyleSheet.create({

  bannerBox: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },

  },

  textBlock: {
    flex: 1,
    paddingRight: IMAGE_SIZE * 0.4,
    paddingHorizontal: 16,
  },

  bannerTitle: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#fff',
    lineHeight: width * 0.065,

  },

  bannerSubtitle: {
    fontSize: width * 0.04,
    color: '#fff',
    marginTop: 4,
  },

  discount: {
    color: '#FFFF33',
    fontWeight: '900',
  },

  terms: {
    fontSize: width * 0.032,
    marginTop: 6,
    opacity: 0.8,
    color: '#fff',
  },

  bannerImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    position: 'absolute',
    right: -IMAGE_SIZE * 0.12,
    bottom: -IMAGE_SIZE * 0.15,
  },
});