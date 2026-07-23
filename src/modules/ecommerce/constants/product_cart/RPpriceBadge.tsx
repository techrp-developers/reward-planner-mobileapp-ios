import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

type Props = {
  value: string | number;
  cardWidth?: number;
};

const RPpriceBadge: React.FC<Props> = ({ value }) => {
  if (!value) return null;

  const formattedValue = String(value).includes('₹') ||
    String(value).includes('Rs') ||
    String(value).includes('RS')
    ? String(value)
    : `₹${value}`;

  return (
    <View style={styles.shadowWrap}>
      <View style={styles.badge}>
        <Text style={styles.label} numberOfLines={1}>
          RP
        </Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formattedValue}
        </Text>
      </View>
    </View>
  );
};

export default React.memo(RPpriceBadge);

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#F6D58B',
    borderWidth: 1,
    borderColor: '#D69A33',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#5F341A',
    marginRight: 3,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  value: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
