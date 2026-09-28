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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';

const FindHospitalScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);

  const hospitals = [
    {
      id: 'manipal',
      name: 'Manipal Hospital',
      address: 'Old Airport Road, HAL 2nd Stage, Bengaluru, Karnataka 560008',
      distance: '1.2 km away',
      cashless: true,
      logo: 'hospital-building',
    },
    {
      id: 'sakra',
      name: 'Sakra World Hospital',
      address: '52/2 & 52/3, Devarabisanahalli, Outer Ring Road, Bengaluru, 560103',
      distance: '4.5 km away',
      cashless: true,
      logo: 'hospital-building',
    },
    {
      id: 'columbia',
      name: 'Columbia Asia Hospital',
      address: 'No. 22, 2nd Main, Yeshwanthpur, Bengaluru, Karnataka 560022',
      distance: '6.2 km away',
      cashless: true,
      logo: 'hospital-building',
    },
  ];

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
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Cashless Claim</Text>
        </View>

        <TouchableOpacity style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} activeOpacity={0.7}>
          <MaterialCommunityIcons name="bell-outline" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
        </TouchableOpacity>
      </View>

      {/* Step Stepper Indicator */}
      <View style={[styles.stepperContainer, { borderBottomColor: isDark ? '#27272A' : '#E2E8F0' }]}>
        <View style={styles.stepItem}>
          <View style={[styles.stepCircleDone, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Member</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: '#10B981' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircleActive, { borderColor: '#005b7f', backgroundColor: '#005b7f' }]}>
            <Text style={styles.stepCircleActiveText}>2</Text>
          </View>
          <Text style={[styles.stepLabel, { color: '#005b7f', fontWeight: '700' }]}>Hospital</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCirclePending, { borderColor: isDark ? '#52525B' : '#CBD5E1' }]}>
            <Text style={[styles.stepCirclePendingText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>3</Text>
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Documents</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCirclePending, { borderColor: isDark ? '#52525B' : '#CBD5E1' }]}>
            <Text style={[styles.stepCirclePendingText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>4</Text>
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Review</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Find Network Hospital Section */}
        <View style={styles.searchBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Find Network Hospital</Text>
          <View style={styles.inputsRow}>
            {/* Search Input */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <MaterialCommunityIcons name="magnify" size={18} color={isDark ? '#71717A' : '#94A3B8'} style={{ marginRight: 6 }} />
              <TextInput 
                placeholder="Search hospital name, city or locality" 
                placeholderTextColor={isDark ? '#52525B' : '#94A3B8'}
                style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#0F172A' }]}
              />
            </View>
            {/* Location selector */}
            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]} activeOpacity={0.7}>
              <MaterialCommunityIcons name="map-marker-outline" size={16} color="#005b7f" style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Bengaluru, KA</Text>
              <MaterialCommunityIcons name="chevron-down" size={14} color={isDark ? '#71717A' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {/* Filter chips */}
          <View style={styles.chipsRow}>
            <TouchableOpacity style={styles.chipActive}>
              <MaterialCommunityIcons name="compass-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.chipActiveText}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <Text style={[styles.chipText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Specialty</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <Text style={[styles.chipText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>24x7</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <Text style={[styles.chipText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Network</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.chip, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' }]}>
              <Text style={[styles.chipText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Cashless</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hospitals List */}
        <View style={styles.hospitalsList}>
          {hospitals.map((hospital) => {
            const isSelected = selectedHospital === hospital.id;
            return (
              <View 
                key={hospital.id} 
                style={[
                  styles.hospitalCard, 
                  { 
                    backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', 
                    borderColor: isSelected ? '#005b7f' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)' 
                  }
                ]}
              >
                <View style={styles.hospDetailsRow}>
                  <View style={[styles.hospIconCircle, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                    <MaterialCommunityIcons name={hospital.logo} size={20} color="#EA580C" />
                  </View>
                  <View style={styles.hospTextCol}>
                    <Text style={[styles.hospName, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>{hospital.name}</Text>
                    <Text style={[styles.hospAddress, { color: isDark ? '#A1A1AA' : '#64748B' }]}>{hospital.address}</Text>
                    <View style={styles.hospMetaRow}>
                      <MaterialCommunityIcons name="navigation-variant" size={11} color="#EA580C" style={{ marginRight: 3 }} />
                      <Text style={[styles.hospDistance, { color: '#EA580C' }]}>{hospital.distance}</Text>
                    </View>
                  </View>
                  <View style={styles.hospActionCol}>
                    <View style={styles.hospBadge}>
                      <MaterialCommunityIcons name="shield-check" size={10} color="#10B981" style={{ marginRight: 2 }} />
                      <Text style={styles.hospBadgeText}>Cashless Eligible</Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.selectBtn, 
                        { backgroundColor: isSelected ? '#10B981' : '#005b7f' }
                      ]} 
                      activeOpacity={0.8}
                      onPress={() => setSelectedHospital(hospital.id)}
                    >
                      <Text style={styles.selectBtnText}>{isSelected ? 'Selected' : 'Select'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* How Cashless Works Timeline */}
        <View style={styles.howWorksBlock}>
          <Text style={[styles.howWorksTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>How Cashless Claim Works</Text>
          <View style={[styles.howWorksCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <View style={styles.worksGrid}>
              <View style={styles.worksCol}>
                <View style={[styles.worksIconBox, { backgroundColor: '#e5f6fd' }]}>
                  <MaterialCommunityIcons name="hospital-building" size={20} color="#005b7f" />
                </View>
                <Text style={[styles.worksLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>1. Select Hospital</Text>
                <Text style={[styles.worksSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Choose network hospital</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={14} color="#CBD5E1" style={{ alignSelf: 'center' }} />
              
              <View style={styles.worksCol}>
                <View style={[styles.worksIconBox, { backgroundColor: '#F3E8FF' }]}>
                  <MaterialCommunityIcons name="file-document-edit" size={20} color="#7C3AED" />
                </View>
                <Text style={[styles.worksLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>2. Raise Pre-auth</Text>
                <Text style={[styles.worksSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Submit requests & details</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={14} color="#CBD5E1" style={{ alignSelf: 'center' }} />

              <View style={styles.worksCol}>
                <View style={[styles.worksIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#10B981" />
                </View>
                <Text style={[styles.worksLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>3. Approval</Text>
                <Text style={[styles.worksSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Insurer reviews request</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={14} color="#CBD5E1" style={{ alignSelf: 'center' }} />

              <View style={styles.worksCol}>
                <View style={[styles.worksIconBox, { backgroundColor: '#d0f0fd' }]}>
                  <MaterialCommunityIcons name="account-heart" size={20} color="#007ca5" />
                </View>
                <Text style={[styles.worksLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>4. Treatment</Text>
                <Text style={[styles.worksSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Get cashless treatment</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Required Documents Bar */}
        <View style={[styles.reqDocsBlock, { backgroundColor: isDark ? '#1E1E24' : '#e5f6fd' }]}>
          <Text style={[styles.reqDocsTitle, { color: '#005b7f' }]}>Required Documents</Text>
          <View style={styles.reqDocsRow}>
            <View style={styles.reqDocItem}>
              <MaterialCommunityIcons name="card-bulleted" size={18} color="#005b7f" />
              <Text style={[styles.reqDocText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Health E-Card</Text>
            </View>
            <View style={styles.reqDocItem}>
              <MaterialCommunityIcons name="account-box" size={18} color="#10B981" />
              <Text style={[styles.reqDocText, { color: isDark ? '#A1A1AA' : '#475569' }]}>ID Proof</Text>
            </View>
            <View style={styles.reqDocItem}>
              <MaterialCommunityIcons name="file-document-outline" size={18} color="#EA580C" />
              <Text style={[styles.reqDocText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Prescription</Text>
            </View>
            <View style={styles.reqDocItem}>
              <MaterialCommunityIcons name="hospital-marker" size={18} color="#7C3AED" />
              <Text style={[styles.reqDocText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Admission Advice</Text>
            </View>
          </View>
        </View>

        {/* Continue trigger */}
        <TouchableOpacity 
          style={[styles.continueBtn, { backgroundColor: selectedHospital ? '#005b7f' : '#94A3B8' }]}
          disabled={!selectedHospital}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CashlessReviewScreen')}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>

      </ScrollView>
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(22),
    paddingVertical: rs(12),
    borderBottomWidth: 1,
  },
  stepItem: {
    alignItems: 'center',
    gap: rs(4),
  },
  stepCircleDone: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleActiveText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepCirclePending: {
    width: rs(26),
    height: rs(26),
    borderRadius: rs(13),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepCirclePendingText: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: fs(9.5),
  },
  stepLine: {
    height: 1.5,
    flex: 1,
    marginBottom: rs(14),
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(32),
  },
  searchBlock: {
    marginTop: rs(12),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  inputsRow: {
    flexDirection: 'row',
    marginTop: rs(10),
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
    fontSize: fs(12),
    paddingVertical: rs(8),
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(10),
    borderRadius: rs(10),
    borderWidth: 1,
    minWidth: rs(120),
  },
  locationText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: rs(10),
    gap: rs(6),
  },
  chipActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#005b7f',
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(16),
  },
  chipActiveText: {
    fontSize: fs(11),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(6),
    borderRadius: rs(16),
    borderWidth: 1,
  },
  chipText: {
    fontSize: fs(11),
    fontWeight: '600',
  },
  hospitalsList: {
    marginTop: rs(16),
    gap: rs(10),
  },
  hospitalCard: {
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 1.5,
  },
  hospDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(10),
  },
  hospIconCircle: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    alignItems: 'center',
    justifyContent: 'center',
  },
  hospTextCol: {
    flex: 1.8,
  },
  hospName: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  hospAddress: {
    fontSize: fs(10),
    lineHeight: fs(12.5),
    fontWeight: '500',
    marginTop: rs(2),
  },
  hospMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: rs(3),
  },
  hospDistance: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  hospActionCol: {
    flex: 1.1,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: rs(54),
  },
  hospBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: rs(5),
    paddingVertical: rs(2),
    borderRadius: rs(4),
  },
  hospBadgeText: {
    fontSize: fs(9),
    color: '#047857',
    fontWeight: '700',
  },
  selectBtn: {
    paddingHorizontal: rs(16),
    paddingVertical: rs(7),
    borderRadius: rs(6),
  },
  selectBtnText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '700',
  },
  howWorksBlock: {
    marginTop: rs(20),
  },
  howWorksTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    marginBottom: rs(10),
  },
  howWorksCard: {
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  worksGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  worksCol: {
    flex: 1,
    alignItems: 'center',
  },
  worksIconBox: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
  },
  worksLabel: {
    fontSize: fs(9.5),
    fontWeight: '700',
    textAlign: 'center',
  },
  worksSub: {
    fontSize: fs(8),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: rs(1.5),
    lineHeight: fs(8.5),
  },
  reqDocsBlock: {
    borderRadius: rs(12),
    padding: rs(12),
    marginTop: rs(20),
  },
  reqDocsTitle: {
    fontSize: fs(12),
    fontWeight: '700',
    marginBottom: rs(6),
  },
  reqDocsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reqDocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
  },
  reqDocText: {
    fontSize: fs(9.5),
    fontWeight: '600',
  },
  continueBtn: {
    paddingVertical: rs(12),
    borderRadius: rs(10),
    alignItems: 'center',
    marginTop: rs(20),
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: fs(13),
    fontWeight: '700',
  },
});

export default FindHospitalScreen;
