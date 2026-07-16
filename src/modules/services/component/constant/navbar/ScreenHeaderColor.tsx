import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface Props {
  title: string;
  onBackPress: () => void;
}

const ScreenHeader: React.FC<Props> = ({ title, onBackPress }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={32} color="#4B5563" />
        </TouchableOpacity>

        <Text style={styles.headerTitleText} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.divider} />
    </View>
  );
};

export default ScreenHeader;
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 18,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },

  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  headerTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
});
