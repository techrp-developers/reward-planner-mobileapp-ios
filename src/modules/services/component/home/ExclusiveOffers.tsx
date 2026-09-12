import { useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { HomeStackParamList, type ServiceItem } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
import ServiceGridCard from '../constant/ServiceGridCard';

const exclusiveOffer = require('../../assete/ServiceData/exclusive.png');
const CARD_AREA_PADDING = 16;
const GRID_COLUMNS = 3;
const GRID_GAP = 12;

const CardSeparator = () => <View style={styles.cardGap} />;

export default function ExclusiveOffers() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();
  const { data, isLoading, error } = useServiceHome();
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor(
    (width - CARD_AREA_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS,
  );

  const services = useMemo((): ServiceItem[] => {
    if (!data?.data) return [];
    const section = data.data.find(s => s.section_key === 'exclusive_offers');
    return (section?.items as ServiceItem[]) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#EEF2FF', '#C7D2FE', '#818CF8']}
        style={[styles.container, styles.loadingBox]}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
      </LinearGradient>
    );
  }

  if (error || services.length === 0) return null;

  return (
    <LinearGradient
      colors={['#7B8FFF', '#B8C9FF', '#E8F0FF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.row}>
        <Image
          source={exclusiveOffer}
          style={styles.banner}
          resizeMode="contain"
        />

        <FlatList
          horizontal
          data={services}
          keyExtractor={item => `${item.service_id}-${item.variant_id}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={CardSeparator}
          nestedScrollEnabled
          renderItem={({ item }) => {
            const imageUri = item.variant_image || item.service_image || item.image;
            const imageSource = imageUri ? { uri: imageUri } : null;

            return (
              <ServiceGridCard
                item={item}
                image={imageSource}
                cardWidth={cardWidth}
                onPress={() =>
                  navigation.navigate('ServiceDescription', {
                    serviceId: item.service_id,
                    title: item.name,
                  })
                }
              />
            );
          }}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  loadingBox: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  banner: {
    width: 130,
    height: 210,
    marginLeft: 12,
    marginRight: 8,
    flexShrink: 0,
  },
  listContent: {
    paddingRight: 12,
  },
  cardGap: {
    width: GRID_GAP,
  },
});
