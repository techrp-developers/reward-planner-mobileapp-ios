import React from 'react';
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useServicesTheme } from '../../utils/useServicesTheme';

const topNavImage = require('../../../../assets/homepage/service_top_nav.png');

type ServiceHeaderProps = {
  search: string;
  onChangeSearch: (text: string) => void;
  onFocusSearch?: () => void;
  autoFocus?: boolean;
};

export default function ServiceHeader({
  search,
  onChangeSearch,
  onFocusSearch,
  autoFocus = false,
}: ServiceHeaderProps) {
  const servicesTheme = useServicesTheme();

  return (
    <View style={[styles.root, { backgroundColor: servicesTheme.colors.background }]}>
      <Image source={topNavImage} style={styles.topNav} resizeMode="cover" />

      <View
        style={[
          styles.searchCard,
          {
            backgroundColor: servicesTheme.colors.surface,
            shadowColor: servicesTheme.colors.shadow,
          },
        ]}
      >
        <MaterialCommunityIcons name="magnify" size={20} color={servicesTheme.colors.primary} />

        <TextInput
          style={[styles.input, { color: servicesTheme.colors.text }]}
          placeholder="Search services..."
          placeholderTextColor={servicesTheme.colors.subtle}
          value={search}
          onChangeText={onChangeSearch}
          onFocus={onFocusSearch}
          returnKeyType="search"
          autoFocus={autoFocus}
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={servicesTheme.colors.subtle} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
  },
  topNav: {
    width: '100%',
    height: 190,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
  },
});
