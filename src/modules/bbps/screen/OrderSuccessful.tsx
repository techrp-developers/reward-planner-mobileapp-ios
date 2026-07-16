import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import RecommendedServices from '../component/order/RecommendedServices';
import RechargeSuccessCard from '../component/order/RechargeSuccessCard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useBbpsTheme } from '../utils/useBbpsTheme';

function OrderSuccessfulComponent() {
  const navigation = useNavigation<any>();
  const bbpsTheme = useBbpsTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: bbpsTheme.colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Success Card Component */}
      <View style={styles.sectionMargin}>
        <RechargeSuccessCard onPayAnother={() => navigation.navigate('Home')} />
      </View>

      {/* 24/7 Help & Support Section */}
      <TouchableOpacity
        style={[
          styles.helpContainer,
          {
            backgroundColor: bbpsTheme.colors.surface,
            shadowColor: bbpsTheme.colors.shadow,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('HelpForm')}
      >
        <View style={styles.helpContent}>
          <MaterialIcons name="headset-mic" size={20} color={bbpsTheme.colors.primary} />
          <Text style={[styles.helpText, { color: bbpsTheme.colors.text }]}>24/7 Help & Support</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={bbpsTheme.colors.subtle} />
      </TouchableOpacity>

      {/* Recommended Services Component */}
      <View style={styles.sectionMargin}>
        <RecommendedServices />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F3FF', // Specific background color
  },
  sectionMargin: {
    marginVertical: 10,
  },
  helpContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Subtle shadow
    shadowColor: '#5B47A3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  helpContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
});

const OrderSuccessful = React.memo(OrderSuccessfulComponent);
export default OrderSuccessful;
