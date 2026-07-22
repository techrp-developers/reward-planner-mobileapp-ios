import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useServicesTheme } from '../../utils/useServicesTheme';

export interface CalculatorItem {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  screen: string;
}

interface Props {
  item: CalculatorItem;
  onPress: () => void;
}

const CalculatorCard: React.FC<Props> = ({ item, onPress }) => {
  const servicesTheme = useServicesTheme();

  return (
  <TouchableOpacity
    activeOpacity={0.85}
    style={[styles.card, { borderColor: servicesTheme.colors.border, shadowColor: servicesTheme.colors.shadow }]}
    onPress={onPress}
  >
    <LinearGradient
      colors={servicesTheme.isDark ? ['#18181B', '#111113'] : ['#FFFFFF', '#F7F3FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardInner}
    >
      <View style={styles.topRow}>
        <View style={[styles.imageHalo, { backgroundColor: servicesTheme.colors.surfaceAlt, borderColor: servicesTheme.colors.border }]}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>
        <View style={[styles.quickBadge, { backgroundColor: servicesTheme.isDark ? '#18112A' : '#F0E9FF' }]}>
          <MaterialCommunityIcons name="flash" size={10} color="#3545A3" />
          <Text style={styles.quickBadgeText}>Tool</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: servicesTheme.colors.textStrong }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.description, { color: servicesTheme.colors.muted }]} numberOfLines={3}>
        {item.subtitle}
      </Text>

      <View style={[styles.calcRow, { borderTopColor: servicesTheme.colors.divider }]}>
        <Text style={styles.calcText}>Calculate Now</Text>
        <View style={styles.arrowCircle}>
          <MaterialCommunityIcons name="arrow-right" size={14} color="#FFFFFF" />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
  );
};

export default CalculatorCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 22,
    minHeight: 170,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.10)',
    ...Platform.select({
      ios: {
        shadowColor: '#080B26',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  cardInner: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  imageHalo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.10)',
  },
  title: {
    fontSize: 14,
    fontWeight: '900',
    color: '#241C3B',
    lineHeight: 18,
    marginBottom: 7,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 11,
    color: '#746B86',
    lineHeight: 16,
    flexShrink: 1,
  },
  image: {
    width: 46,
    height: 46,
    flexShrink: 0,
  },
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0E9FF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickBadgeText: {
    color: '#3545A3',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(124,58,237,0.10)',
  },
  calcText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3545A3',
  },
  arrowCircle: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#3545A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
