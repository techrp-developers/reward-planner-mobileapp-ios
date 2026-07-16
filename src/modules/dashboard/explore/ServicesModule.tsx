import { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { rs, fs } from '../../../utils/responsive';
import { useAppTheme } from '../../../theme/ThemeContext';

type TopTab = 'Product' | 'Services' | 'Payments' | 'DineOut';

const Categories1 = require('../../../assets/sampleImages/Categories(1).png');
const Categories2 = require('../../../assets/sampleImages/Categories(2).png');
const Categories3 = require('../../../assets/sampleImages/Categories(3).png');
const Categories4 = require('../../../assets/sampleImages/Categories(4).png');
const Categories5 = require('../../../assets/sampleImages/Categories(5).png');
const Categories6 = require('../../../assets/sampleImages/Categories(6).png');
const Categories7 = require('../../../assets/sampleImages/Categories(7).png');

type CategoryItem = {
  image: ReturnType<typeof require>;
  tab: TopTab;
};

const categoriesData: CategoryItem[] = [
  { image: Categories1, tab: 'Product' },
  { image: Categories2, tab: 'Services' },
  { image: Categories3, tab: 'Payments' },
  { image: Categories4, tab: 'Product' },
  { image: Categories5, tab: 'Product' },
  { image: Categories6, tab: 'Product' },
  { image: Categories7, tab: 'DineOut' },
];

const TAB_TO_MODULE: Record<TopTab, { screen: string; moduleName: TopTab }> = {
  Product:  { screen: 'ProductModule',  moduleName: 'Product'  },
  Services: { screen: 'ServicesModule', moduleName: 'Services' },
  Payments: { screen: 'PaymentsModule', moduleName: 'Payments' },
  DineOut:  { screen: 'DineOutModule',  moduleName: 'DineOut'  },
};

export default function ServicesModule() {
  const { isDark } = useAppTheme();
  const navigation = useNavigation<any>();
  const { width } = useWindowDimensions();

  const CARD_WIDTH  = (width - rs(52)) / 3.3;
  const CARD_HEIGHT = CARD_WIDTH * 1.08;

  const t = useMemo(() => ({
    wrapper:     { backgroundColor: 'transparent' } as ViewStyle,
    headerTitle: { color: isDark ? '#FFFFFF' : '#0F172A' } as TextStyle,
  }), [isDark]);

  const handleCategoryPress = useCallback(
    (tab: TopTab) => {
      const target = TAB_TO_MODULE[tab];
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Home',
          params: {
            screen: target.screen,
            params: { moduleName: target.moduleName },
            moduleName: target.moduleName,
          },
        })
      );
    },
    [navigation],
  );

  const handleViewAll = useCallback(() => {
    navigation.navigate('ExploreModule');
  }, [navigation]);

  return (
    <View style={[styles.wrapper, t.wrapper]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, t.headerTitle]}>Explore Services</Text>
        <TouchableOpacity
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={handleViewAll}
        >
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
      >
        {categoriesData.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.88}
            onPress={() => handleCategoryPress(item.tab)}
          >
            <Image
              source={item.image}
              style={[styles.cardImage, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // backgroundColor via t.wrapper
    paddingTop: rs(16),
    paddingBottom: rs(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: rs(16),
    marginBottom: rs(12),
  },
  headerTitle: {
    fontSize: fs(18),
    fontWeight: '700',
    // color via t.headerTitle
    letterSpacing: 0.2,
  },
  viewAll: {
    fontSize: fs(14),
    fontWeight: '600',
    color: '#4A6CF7',
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    gap: rs(10),
  },
  cardImage: {
    borderRadius: rs(16),
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.16)',
  },
});
