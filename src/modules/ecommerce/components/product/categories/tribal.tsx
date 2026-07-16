import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TribalBg from '../../../../../assets/product/tribal_bg.svg';
import TribalProduct from '../../../../../assets/product/tribal_product.svg';

function Tribal() {
  return (
    <View style={styles.container}>
      {/* Background */}
      <TribalBg
        width="100%"
        height="100%"
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        {/* Left Text */}
        <View style={styles.textWrapper}>
          <Text style={styles.title}>
            Pure, traditional & handcrafted
          </Text>

          <Text style={styles.subtitle}>
            Straight from India’s tribal artisans
          </Text>

          <Text style={styles.offer}>
            Up to <Text style={styles.offerBold}>70% OFF</Text>
          </Text>

          <Text style={styles.cta}>
            Shop Your Favorites Before They're Gone!
          </Text>
        </View>
         <View style={styles.productImage}>
        <TribalProduct width={150} height={250} />
      </View>
      </View>
    </View>
  );
}

export default Tribal;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 12,
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  textWrapper: {
    flex: 1,
    // paddingRight: 10,
  },

  title: {
  fontSize: 14,
  color: '#755400',
  fontWeight: '800',
  marginBottom: 2,

},


  subtitle: {
    fontSize: 12,
    color: '#755400',
    marginBottom: 6,
  },

  offer: {
    fontSize: 14,
    color: '#755400',
    marginBottom: 2,
  },

  offerBold: {
    fontWeight: '800',
    fontSize: 16,
  },

  cta: {
    fontSize: 11,
    color: '#755400',
  },

  productImage: {
  alignSelf: 'flex-end',

  }
});
