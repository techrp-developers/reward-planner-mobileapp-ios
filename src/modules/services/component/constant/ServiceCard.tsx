import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';

export type ServiceCardProps = {
  title: string;
  subTitle: string;
  priceText?: string;
  dueText?: string;
  image: any;
};

export default function ServiceCard({
  title,
  subTitle,
  priceText,
  dueText,
  image,
}: ServiceCardProps) {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();

  const handlePress = () => {
    navigation.navigate('PackEnquiryForm', {
      title,
      description: subTitle,
      price: priceText  ,
    });
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      {/* ICON ON THE LEFT - Reduced Size */}
      <LinearGradient
        colors={['#FFE4E6', '#EDE9FE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.imageWrap}
      >
        <Image
          source={image}
          style={styles.serviceImage}
          resizeMode="contain"
        />
      </LinearGradient>

      {/* CENTER CONTENT */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {Boolean(priceText) && <Text style={styles.price}>{priceText}</Text>}
        </View>
        
        <Text style={styles.subTitle} numberOfLines={1}>{subTitle}</Text>

        {Boolean(dueText) && (
          <Text style={styles.due}>{dueText}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 320,
    backgroundColor: '#FFFFFF', // Required background
    borderRadius: 18,
    paddingVertical: 12, // Reduced vertical padding to make it shorter
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6', // Required border
  },

  imageWrap: {
    width: 64, // Reduced from 80
    height: 64, // Reduced from 80
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  serviceImage: {
    width: 45,
    height: 35,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    fontSize: 15, // Slightly smaller for compact hieght
    fontWeight: '700',
    color: '#374151',
    flexShrink: 1,
  },

  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#374151',
    marginLeft: 8,
  },

  subTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '400',
  },

  due: {
    fontSize: 13,
    color: '#EF4444',
    marginTop: 4,
    fontWeight: '500',
  },
});
