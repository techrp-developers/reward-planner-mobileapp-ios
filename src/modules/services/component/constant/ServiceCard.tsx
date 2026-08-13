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
      price: priceText,
    });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={handlePress}
    >
      <LinearGradient
        colors={['#EEF2FF', '#FAF5FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconWrap}
      >
        <Image
          source={image}
          style={styles.serviceImage}
          resizeMode="contain"
        />
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subTitle} numberOfLines={2}>
          {subTitle}
        </Text>
        {Boolean(priceText) && (
          <Text style={styles.price} numberOfLines={1}>
            {priceText}
          </Text>
        )}
        {Boolean(dueText) && (
          <Text style={styles.due} numberOfLines={1}>
            {dueText}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 268,
    minHeight: 90,
    maxHeight: 106,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E8ECF0',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
    flexShrink: 0,
  },

  serviceImage: {
    width: 30,
    height: 30,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },

  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.1,
  },

  subTitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 16,
  },

  price: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    marginTop: 1,
  },

  due: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 1,
  },
});
