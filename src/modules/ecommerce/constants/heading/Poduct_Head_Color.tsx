import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import AppIconButton from '../icons/AppIconButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../../navigation/types';
import { handleNavigateWithPrefetch } from '../../navigation/navigationPerformance';

const { width } = Dimensions.get('window');

const HEADER_HEIGHT = width * 0.24;
const ICON_SIZE = width * 0.09;
const BACK_ICON = width * 0.08;
type Nav = NativeStackNavigationProp<HomeStackParamList>;

function ProductHeadColor({
  title = "",
  onBackPress,
  onSearchPress,
  showSearch = true,
}: {
  title?: string;
  onBackPress?: () => void;
  onSearchPress?: () => void;
  showSearch?: boolean;
}) {
  const navigation = useNavigation<Nav>();

  const handleBack = () => {
    handleNavigateWithPrefetch({
      navigate: onBackPress ?? (() => navigation.goBack()),
    });
  };

  const handleSearch = () => {
    handleNavigateWithPrefetch({
      navigate: onSearchPress ?? (() => navigation.navigate('SearchScreen')),
    });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <AppIconButton
          type="back"
          variant="ghost"
          onPress={handleBack} style={styles.backIcon}
        />

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
               
        <View style={styles.rightIcons}>
          {showSearch ? (
            <AppIconButton
              type="search"
              variant="solid"
              style={styles.circleIcon}
              onPress={handleSearch}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default ProductHeadColor;

const styles = StyleSheet.create({
  safe: {
    paddingTop:
      Platform.OS === 'android'
        ? StatusBar.currentHeight
        : width * 0.12,
    backgroundColor: '#fff',
  },

  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },

  title: {
    flex: 1,
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#111',
    marginLeft: width * 0.02,
  },

  rightIcons: {
    flexDirection: 'row',
    gap: width * 0.025,
  },

  circleIcon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#fff',
  },

  backIcon: {
    width: BACK_ICON,
    height: BACK_ICON,
  },
});
