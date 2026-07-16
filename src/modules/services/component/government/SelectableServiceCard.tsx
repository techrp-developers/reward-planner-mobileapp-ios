import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type Props = {
  title: string;
  planTitle?: string;
  price: string;
  oldPrice: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function SelectableServiceCard({
  title,
  planTitle,
  price,
  oldPrice,
  selected,
  onPress,
}: Props) {
  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {/* GRADIENT BORDER */}
        <LinearGradient
          colors={['#A654CD', '#FC8BAD']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradientBorder}
        >
          <View style={styles.selectedCard}>
            <CardContent title={title} planTitle={planTitle} price={price} oldPrice={oldPrice} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // NOT SELECTED
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={styles.unselectedCard}
    >
      <CardContent title={title} planTitle={planTitle} price={price} oldPrice={oldPrice} />
    </TouchableOpacity>
  );
}
function CardContent({
  title,
  planTitle,
  price,
  oldPrice,
}: {
  title: string;
  planTitle?: string;
  price: string;
  oldPrice: string;
}) {
  return (
    <>
      <Text style={styles.title}>{title}</Text>
      {!!planTitle && (
        <Text style={styles.planTitle} numberOfLines={2}>{planTitle}</Text>
      )}
      <View style={styles.priceRow}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.oldPrice}>{oldPrice}</Text>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  gradientBorder: {
    borderRadius: 12,
    padding: 2, // 👈 border thickness (2px)
  },

  selectedCard: {
    backgroundColor: '#FEF4FF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 150,
    maxWidth: 190,
  },

  unselectedCard: {
    borderWidth: 1,
    borderColor: '#D3D3D3',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 150,
    maxWidth: 190,
  },

  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },

  planTitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },

  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  oldPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
});
