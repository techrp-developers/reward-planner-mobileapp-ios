import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';

const StartClaimScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const [selectedMember, setSelectedMember] = useState('self');

  const members = [
    { id: 'self', relation: 'Self', name: 'Ravi Kumar', info: 'Primary Insured', icon: 'account', color: '#007ca5' },
    { id: 'spouse', relation: 'Spouse', name: 'Pooja Kumar', info: 'DOB: 12-Jun-1986', icon: 'account-outline', color: '#EC4899' },
    { id: 'child1', relation: 'Child 1', name: 'Aarav Kumar', info: 'DOB: 04-Apr-2015', icon: 'account-outline', color: '#10B981' },
    { id: 'child2', relation: 'Child 2', name: 'Anaya Kumar', info: 'DOB: 21-Sep-2018', icon: 'account-outline', color: '#10B981' },
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
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Start a Claim</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="help-circle-outline" size={14} color="#005b7f" style={{ marginRight: 3 }} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Select Member section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Select Member</Text>
          <Text style={[styles.sectionSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
            Choose the member for whom you want to raise a claim
          </Text>

          <View style={styles.membersGrid}>
            {members.map((member) => {
              const isSelected = selectedMember === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberCard,
                    { 
                      backgroundColor: isDark ? '#1E1E24' : '#FFFFFF',
                      borderColor: isSelected ? '#005b7f' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)',
                    }
                  ]}
                  onPress={() => setSelectedMember(member.id)}
                  activeOpacity={0.8}
                >
                  {isSelected && (
                    <View style={styles.checkBadge}>
                      <MaterialCommunityIcons name="check" size={8} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={[styles.memberIconBox, { backgroundColor: isSelected ? '#e5f6fd' : isDark ? '#27272A' : '#F1F5F9' }]}>
                    <MaterialCommunityIcons name={member.icon} size={26} color={isSelected ? '#005b7f' : member.color} />
                  </View>
                  <Text style={[styles.memberRelation, { color: isSelected ? '#005b7f' : isDark ? '#E4E4E7' : '#1E293B' }]}>
                    {member.relation}
                  </Text>
                  <Text style={[styles.memberName, { color: isDark ? '#D4D4D8' : '#475569' }]} numberOfLines={1}>
                    {member.name}
                  </Text>
                  <Text style={[styles.memberInfo, { color: isDark ? '#71717A' : '#94A3B8' }]} numberOfLines={1}>
                    {member.info}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Choose Claim Type section */}
        <View style={[styles.sectionBlock, { marginTop: rs(20) }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Choose Claim Type</Text>
          <Text style={[styles.sectionSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
            Select how you want to settle your medical expenses
          </Text>

          <View style={styles.claimTypesRow}>
            {/* Cashless Claim Card */}
            <View style={[styles.typeCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <View style={[styles.typeIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="plus" size={20} color="#10B981" />
              </View>
              <Text style={[styles.typeTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Cashless Claim</Text>
              <Text style={[styles.typeDesc, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Get treated at a network hospital without paying eligible amount from your pocket.
              </Text>
              
              <View style={styles.bulletsList}>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>Treatment at network hospitals</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>No upfront payment for eligible bills</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#10B981" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>Ideal for planned or emergency hosp.</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.actionBtnSolid} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('FindHospitalScreen')}
              >
                <Text style={styles.actionBtnTextSolid}>Start Cashless Claim</Text>
              </TouchableOpacity>
            </View>

            {/* Reimbursement Claim Card */}
            <View style={[styles.typeCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <View style={[styles.typeIconBox, { backgroundColor: '#F5F3FF' }]}>
                <MaterialCommunityIcons name="currency-inr" size={20} color="#7C3AED" />
              </View>
              <Text style={[styles.typeTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Reimbursement Claim</Text>
              <Text style={[styles.typeDesc, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Pay first from your pocket and upload bills & documents to get reimbursed as per policy.
              </Text>

              <View style={styles.bulletsList}>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>Any hospital is eligible</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>Upload bills & documents</Text>
                </View>
                <View style={styles.bulletRow}>
                  <MaterialCommunityIcons name="check-circle" size={15} color="#7C3AED" style={{ marginRight: 4 }} />
                  <Text style={[styles.bulletText, { color: isDark ? '#D4D4D8' : '#334155' }]}>Amount credited to your bank account</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.actionBtnBorder, { borderColor: '#7C3AED' }]} 
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ReimbursementDetailsScreen')}
              >
                <Text style={[styles.actionBtnTextBorder, { color: '#7C3AED' }]}>Start Reimbursement Claim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Claim Types Comparison Row info */}
        <View style={[styles.comparisonBox, { backgroundColor: isDark ? '#1E1E24' : '#F1F5F9' }]}>
          <MaterialCommunityIcons name="information" size={20} color="#007ca5" />
          <View style={styles.comparisonCol}>
            <Text style={[styles.comparisonLabel, { color: '#007ca5' }]}>Cashless Claim</Text>
            <Text style={[styles.comparisonText, { color: isDark ? '#A1A1AA' : '#475569' }]}>
              Treatment at network hospital without paying eligible amount from your pocket.
            </Text>
          </View>
          <View style={styles.comparisonCol}>
            <Text style={[styles.comparisonLabel, { color: '#7C3AED' }]}>Reimbursement Claim</Text>
            <Text style={[styles.comparisonText, { color: isDark ? '#A1A1AA' : '#475569' }]}>
              You pay first and later upload bills & documents for reimbursement.
            </Text>
          </View>
          <MaterialCommunityIcons name="clipboard-check-outline" size={28} color={isDark ? '#A1A1AA' : '#64748B'} />
        </View>

        {/* What you'll need section */}
        <View style={[styles.sectionBlock, { marginTop: rs(20) }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>What you'll need</Text>
          <View style={styles.requirementsGrid}>
            <View style={[styles.reqCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="card-bulleted-outline" size={26} color="#005b7f" />
              <Text style={[styles.reqTitle, { color: isDark ? '#E4E4E7' : '#1E293B' }]}>E-Card</Text>
              <Text style={[styles.reqSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>Policy details</Text>
            </View>
            <View style={[styles.reqCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="badge-account-outline" size={26} color="#10B981" />
              <Text style={[styles.reqTitle, { color: isDark ? '#E4E4E7' : '#1E293B' }]}>ID Proof</Text>
              <Text style={[styles.reqSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>PAN / Aadhaar</Text>
            </View>
            <View style={[styles.reqCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={26} color="#F59E0B" />
              <Text style={[styles.reqTitle, { color: isDark ? '#E4E4E7' : '#1E293B' }]}>Medical Documents</Text>
              <Text style={[styles.reqSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>Reports, Bills</Text>
            </View>
            <View style={[styles.reqCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="bank-outline" size={26} color="#7C3AED" />
              <Text style={[styles.reqTitle, { color: isDark ? '#E4E4E7' : '#1E293B' }]}>Bank Details</Text>
              <Text style={[styles.reqSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>For settlement</Text>
            </View>
          </View>
        </View>

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
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rs(16),
  },
  helpText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#005b7f',
  },
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(32),
  },
  sectionBlock: {
    marginTop: rs(10),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(2),
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
    marginTop: rs(14),
  },
  memberCard: {
    width: '48.5%',
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    top: rs(6),
    right: rs(6),
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: '#005b7f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberIconBox: {
    width: rs(42),
    height: rs(42),
    borderRadius: rs(21),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
  },
  memberRelation: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  memberName: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(2),
  },
  memberInfo: {
    fontSize: fs(9.5),
    fontWeight: '500',
    marginTop: rs(1),
  },
  claimTypesRow: {
    flexDirection: 'row',
    gap: rs(10),
    marginTop: rs(14),
  },
  typeCard: {
    flex: 1,
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
  },
  typeIconBox: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(8),
  },
  typeTitle: {
    fontSize: fs(13),
    fontWeight: '700',
    marginBottom: rs(4),
  },
  typeDesc: {
    fontSize: fs(10),
    lineHeight: fs(13),
    fontWeight: '500',
    marginBottom: rs(8),
  },
  bulletsList: {
    gap: rs(4),
    marginBottom: rs(12),
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    fontSize: fs(9),
    fontWeight: '600',
    flex: 1,
  },
  actionBtnSolid: {
    backgroundColor: '#005b7f',
    paddingVertical: rs(10),
    borderRadius: rs(8),
    alignItems: 'center',
  },
  actionBtnTextSolid: {
    color: '#FFFFFF',
    fontSize: fs(12),
    fontWeight: '700',
  },
  actionBtnBorder: {
    borderWidth: 1,
    paddingVertical: rs(10),
    borderRadius: rs(8),
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  actionBtnTextBorder: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  comparisonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(12),
    borderRadius: rs(12),
    marginTop: rs(18),
    gap: rs(8),
  },
  comparisonCol: {
    flex: 1,
  },
  comparisonLabel: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  comparisonText: {
    fontSize: fs(9),
    lineHeight: fs(11.5),
    fontWeight: '600',
    marginTop: rs(2),
  },
  requirementsGrid: {
    flexDirection: 'row',
    gap: rs(6),
    marginTop: rs(12),
  },
  reqCard: {
    flex: 1,
    borderRadius: rs(10),
    padding: rs(10),
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  reqTitle: {
    fontSize: fs(10),
    fontWeight: '700',
    marginTop: rs(4),
    textAlign: 'center',
  },
  reqSub: {
    fontSize: fs(10),
    fontWeight: '500',
    marginTop: rs(1),
    textAlign: 'center',
  },
});

export default StartClaimScreen;
