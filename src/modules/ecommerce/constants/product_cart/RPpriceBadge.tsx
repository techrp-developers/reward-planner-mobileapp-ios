import React from 'react';
import { Text, StyleSheet, View, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
      <LinearGradient
        colors={['#FEB014', '#FFE486', '#F5B924']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <Text style={styles.label} numberOfLines={1}>
          RP
        </Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {formattedValue}
        </Text>
      </LinearGradient>
    </View>
  );
};

export default RPpriceBadge;

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 8,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#92660A',
        shadowOpacity: 0.35,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C4A03',
    marginRight: 3,
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  value: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1F2937',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
});