import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';

const NetworkHospitalsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const specialties = [
    { id: 'All', label: 'All Specialties' },
    { id: 'Cardiology', label: 'Cardiology' },
    { id: 'Orthopedics', label: 'Orthopedics' },
    { id: 'Pediatrics', label: 'Pediatrics' },
    { id: 'Oncology', label: 'Oncology' },
    { id: 'Neurology', label: 'Neurology' },
    { id: 'Surgery', label: 'General Surgery' },
  ];

  const hospitalsList = [
    {
      id: 'manipal',
      name: 'Manipal Hospital',
      address: 'Old Airport Road, HAL 2nd Stage, Bengaluru, Karnataka 560008',
      distance: '1.2 km away',
      rating: '4.8',
      reviews: '1.2k reviews',
      cashlessType: '100% Cashless Available',
      phone: '+918025024444',
      mapUrl: 'https://maps.google.com/?q=Manipal+Hospital+Old+Airport+Road+Bengaluru',
    },
    {
      id: 'sakra',
      name: 'Sakra World Hospital',
      address: '52/2 & 52/3, Devarabisanahalli, Outer Ring Road, Bengaluru, 560103',
      distance: '4.5 km away',
      rating: '4.7',
      reviews: '950 reviews',
      cashlessType: 'Cashless Treatment',
      phone: '+918049694969',
      mapUrl: 'https://maps.google.com/?q=Sakra+World+Hospital+Bengaluru',
    },
    {
      id: 'columbia',
      name: 'Columbia Asia Hospital',
      address: 'No. 22, 2nd Main, Yeshwanthpur, Bengaluru, Karnataka 560022',
      distance: '6.2 km away',
      rating: '4.6',
      reviews: '800 reviews',
      cashlessType: 'Cashless Treatment',
      phone: '+918039898960',
      mapUrl: 'https://maps.google.com/?q=Columbia+Asia+Hospital+Yeshwanthpur+Bengaluru',
    },
    {
      id: 'fortis',
      name: 'Fortis Hospital',
      address: '154/9, Bannerghatta Road, Opposite IIM-B, Bengaluru, 560076',
      distance: '8.1 km away',
      rating: '4.8',
      reviews: '1.5k reviews',
      cashlessType: '100% Cashless Available',
      phone: '+918066222222',
      mapUrl: 'https://maps.google.com/?q=Fortis+Hospital+Bannerghatta+Road+Bengaluru',
    },
  ];

  const handleDirections = (mapUrl: string) => {
    Linking.openURL(mapUrl).catch(() => {
      Alert.alert('Error', 'Unable to open maps application.');
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Calling is not supported on this device.');
    });
  };

  const handleBookAdmission = (hospitalName: string) => {
    Alert.alert(
      'Admission Intimation',
      `Would you like to start a cashless pre-authorization request at ${hospitalName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Proceed', 
          onPress: () => navigation.navigate('StartClaimScreen') 
        },
      ]
    );
  };

  // Filter list based on search query
  const filteredHospitals = hospitalsList.filter(h => 
    h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Network Hospitals</Text>
        </View>

        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} activeOpacity={0.7}>
          <MaterialCommunityIcons name="filter-variant" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Search and Location Blocks */}
        <View style={styles.searchBlock}>
          <View style={styles.inputsRow}>
            {/* Search Box */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={isDark ? '#71717A' : '#94A3B8'} style={{ marginRight: 6 }} />
              <TextInput 
                placeholder="Search hospital, specialty or doctor" 
                placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              />
            </View>
            {/* Location Selector */}
            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]} activeOpacity={0.7}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#005b7f" style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Bengaluru</Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={isDark ? '#71717A' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Specialties quick filter scroll */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.specialtiesScroll}
            contentContainerStyle={styles.specialtiesContent}
          >
            {specialties.map((spec) => {
              const isSelected = selectedSpecialty === spec.id;
              return (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specChip,
                    { 
                      backgroundColor: isSelected ? '#005b7f' : isDark ? '#1E1E24' : '#FFFFFF',
                      borderColor: isSelected ? '#005b7f' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
                    }
                  ]}
                  onPress={() => setSelectedSpecialty(spec.id)}
                  activeOpacity={0.8}
                >
                  <Text 
                    style={[
                      styles.specChipText, 
                      { 
                        color: isSelected ? '#FFFFFF' : isDark ? '#D4D4D8' : '#475569',
                        fontWeight: isSelected ? '800' : '600'
                      }
                    ]}
                  >
                    {spec.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Network Hospital Count Banner */}
        <View style={[styles.infoBanner, { backgroundColor: isDark ? '#1E293B' : '#e5f6fd' }]}>
          <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Text style={[styles.infoBannerTitle, { color: isDark ? '#FFFFFF' : '#003950' }]}>
              6,200+ Network Hospitals
            </Text>
            <Text style={[styles.infoBannerText, { color: isDark ? '#A1A1AA' : '#003950' }]}>
              Enjoy 100% cashless claims at all network partner hospitals.
            </Text>
          </View>
        </View>

        {/* Hospitals Card List */}
        <View style={styles.hospitalsList}>
          {filteredHospitals.map((hospital) => (
            <View 
              key={hospital.id} 
              style={[styles.hospitalCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
            >
              {/* Card Main Info */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.hospIconBox, { backgroundColor: isDark ? '#27272A' : '#F8FAFC' }]}>
                  <MaterialCommunityIcons name="hospital-building" size={24} color="#EA580C" />
                </View>
                <View style={styles.hospTextCol}>
                  <View style={styles.hospNameRow}>
                    <Text style={[styles.hospName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{hospital.name}</Text>
                    <View style={styles.ratingBox}>
                      <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
                      <Text style={styles.ratingText}>{hospital.rating}</Text>
                    </View>
                  </View>
                  <Text style={[styles.hospAddress, { color: isDark ? '#A1A1AA' : '#64748B' }]} numberOfLines={2}>
                    {hospital.address}
                  </Text>
                </View>
              </View>

              {/* Distance and Cashless Status info bar */}
              <View style={[styles.metaBar, { borderBottomColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                <View style={styles.metaCol}>
                  <MaterialCommunityIcons name="navigation-variant" size={12} color="#EA580C" />
                  <Text style={[styles.metaText, { color: '#EA580C' }]}>{hospital.distance}</Text>
                  <Text style={[styles.metaSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>({hospital.reviews})</Text>
                </View>

                <View style={[styles.cashlessBadge, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="shield-check" size={10} color="#10B981" style={{ marginRight: 2 }} />
                  <Text style={styles.cashlessText}>{hospital.cashlessType}</Text>
                </View>
              </View>

              {/* Action buttons row */}
              <View style={styles.cardActionRow}>
                <TouchableOpacity 
                  style={[styles.actionSubBtn, { borderColor: isDark ? '#52525B' : '#CBD5E1' }]} 
                  activeOpacity={0.7}
                  onPress={() => handleDirections(hospital.mapUrl)}
                >
                  <MaterialCommunityIcons name="directions" size={14} color={isDark ? '#A1A1AA' : '#475569'} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionSubBtnText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionSubBtn, { borderColor: isDark ? '#52525B' : '#CBD5E1' }]} 
                  activeOpacity={0.7}
                  onPress={() => handleCall(hospital.phone)}
                >
                  <MaterialCommunityIcons name="phone" size={14} color={isDark ? '#A1A1AA' : '#475569'} style={{ marginRight: 4 }} />
                  <Text style={[styles.actionSubBtnText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.bookBtn} 
                  activeOpacity={0.8}
                  onPress={() => handleBookAdmission(hospital.name)}
                >
                  <Text style={styles.bookBtnText}>Book Admission</Text>
                </TouchableOpacity>
              </View>

            </View>
          ))}
        </View>

      </ScrollView>

      {/* Custom Bottom Tab Bar (Highlighting Hospitals tab) */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderTopColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6} onPress={() => navigation.navigate('HealthDashboard')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6} onPress={() => navigation.navigate('HealthClaimsScreen')}>
          <MaterialCommunityIcons name="file-document-outline" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Claims</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6}>
          <MaterialCommunityIcons name="hospital-building" size={24} color="#005b7f" />
          <Text style={[styles.tabLabel, { color: '#005b7f', fontWeight: '700' }]}>Hospitals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6}>
          <MaterialCommunityIcons name="headphones" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6} onPress={() => navigation.navigate('Profile')}>
          <MaterialCommunityIcons name="account-outline" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
    marginTop: rs(24),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  backBtn: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitle: {
    fontSize: fs(17),
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(96), // Space for bottom tab bar
  },
  searchBlock: {
    marginTop: rs(12),
  },
  inputsRow: {
    flexDirection: 'row',
    gap: rs(8),
  },
  searchBox: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(10),
    borderRadius: rs(10),
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(11),
    paddingVertical: rs(6),
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(10),
    borderRadius: rs(10),
    borderWidth: 1,
    minWidth: rs(105),
  },
  locationText: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  specialtiesScroll: {
    marginTop: rs(12),
    maxHeight: rs(38),
  },
  specialtiesContent: {
    alignItems: 'center',
    paddingRight: rs(16),
    gap: rs(6),
  },
  specChip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(5),
    borderRadius: rs(14),
    borderWidth: 1,
  },
  specChipText: {
    fontSize: fs(10),
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: rs(12),
    borderRadius: rs(12),
    marginTop: rs(16),
  },
  infoBannerTitle: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  infoBannerText: {
    fontSize: fs(9),
    lineHeight: fs(12),
    fontWeight: '600',
    marginTop: rs(2),
  },
  hospitalsList: {
    marginTop: rs(16),
    gap: rs(12),
  },
  hospitalCard: {
    borderRadius: rs(14),
    padding: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  hospIconBox: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospTextCol: {
    flex: 1,
  },
  hospNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hospName: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
    borderWidth: 0.5,
    borderColor: '#FEF3C7',
  },
  ratingText: {
    fontSize: fs(9),
    fontWeight: '700',
    color: '#D97706',
    marginLeft: rs(2),
  },
  hospAddress: {
    fontSize: fs(9.5),
    lineHeight: fs(12.5),
    fontWeight: '500',
    marginTop: rs(3),
  },
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(10),
    paddingBottom: rs(10),
    borderBottomWidth: 0.5,
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
  },
  metaText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  metaSub: {
    fontSize: fs(9),
    fontWeight: '500',
  },
  cashlessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2.5),
    borderRadius: rs(4),
  },
  cashlessText: {
    fontSize: fs(8),
    color: '#047857',
    fontWeight: '700',
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(10),
    gap: rs(8),
  },
  actionSubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(7),
    paddingHorizontal: rs(10),
    borderRadius: rs(8),
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionSubBtnText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  bookBtn: {
    flex: 1.5,
    backgroundColor: '#005b7f',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(7),
    borderRadius: rs(8),
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: fs(10),
    fontWeight: '700',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: rs(68),
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 4,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabLabel: {
    fontSize: fs(11),
    marginTop: rs(2),
    fontWeight: '600',
  },
});

export default NetworkHospitalsScreen;
