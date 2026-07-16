import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FASTagRecharge from '../../assets/BBPS_Service/FASTagRecharge.svg';
import Electricity from '../../assets/BBPS_Service/Electricity.svg';
import Water from '../../assets/BBPS_Service/Water.svg';
import Landline from '../../assets/BBPS_Service/LandLine.svg';
import Broadband from '../../assets/BBPS_Service/Broadband.svg';
import DTH from '../../assets/BBPS_Service/DTH.svg';
import Credit from '../../assets/BBPS_Service/Creadit.svg';
import { useBbpsTheme } from '../../utils/useBbpsTheme';

type Service = {
  id: string;
  label: string;
  icon?: any;
  iconName?: string;
  onPress?: () => void;
};

type ServiceItemProps = {
  icon?: any;
  iconName?: string;
  label: string;
  onPress?: () => void;
  bbpsTheme: ReturnType<typeof useBbpsTheme>;
};

const SERVICES: Service[] = [
  { id: 'electricity', label: 'Electricity', icon: Electricity },
  { id: 'water', label: 'Water', icon: Water },
  { id: 'credit-card', label: 'Credit Card Payment', icon: Credit },
  { id: 'dth', label: 'DTH', icon: DTH },
  { id: 'landline', label: 'Landline Postpaid', icon: Landline },
  { id: 'broadband', label: 'Broadband Postpaid', icon: Broadband },
  { id: 'fastag', label: 'FASTag Recharge', icon: FASTagRecharge },
  { id: 'view-more', label: 'View More', iconName: 'add' },
];

const ServiceItem = ({ icon, iconName, label, onPress, bbpsTheme }: ServiceItemProps) => (
  <TouchableOpacity style={styles.itemContainer} activeOpacity={0.75} onPress={onPress}>
    <LinearGradient
      colors={bbpsTheme.gradients.primary}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={styles.iconCircle}
    >
      {icon ? (
        <Image source={icon} style={styles.iconImage} resizeMode="contain" />
      ) : (
        <MaterialIcons name={iconName || 'add'} size={30} color="#FFFFFF" />
      )}
    </LinearGradient>
    <Text style={[styles.itemLabel, { color: bbpsTheme.colors.text }]}>{label}</Text>
  </TouchableOpacity>
);

function RecommendedServices() {
  const bbpsTheme = useBbpsTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bbpsTheme.colors.surface,
          borderColor: bbpsTheme.colors.border,
        },
      ]}
    >
      <Text style={[styles.mainTitle, { color: bbpsTheme.colors.textStrong }]}>Recommended Services</Text>
      <View style={styles.grid}>
        {SERVICES.map((service) => (
          <ServiceItem
            key={service.id}
            icon={service.icon}
            iconName={service.iconName}
            label={service.label}
            onPress={service.onPress}
            bbpsTheme={bbpsTheme}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: '#D7D9DF',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#32353A',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
    tintColor: '#FFFFFF',
  },
  itemLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    color: '#3D4046',
    fontWeight: '500',
    lineHeight: 19,
  },
});

export default RecommendedServices;
