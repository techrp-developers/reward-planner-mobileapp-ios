import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';

const ReimbursementDetailsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const handleContinue = () => {
    Alert.alert(
      'Expenses Saved',
      'Your claim expenses summary has been recorded. Let\'s proceed to upload bills & documents.',
      [
        {
          text: 'Proceed',
          onPress: () => navigation.navigate('HealthClaimsScreen'), // Mock step completion
        },
      ]
    );
  };

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
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Reimbursement Claim</Text>
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
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Treatment</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: '#10B981' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircleActive, { borderColor: '#005b7f', backgroundColor: '#005b7f' }]}>
            <Text style={styles.stepCircleActiveText}>2</Text>
          </View>
          <Text style={[styles.stepLabel, { color: '#005b7f', fontWeight: '700' }]}>Expenses</Text>
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
        
        {/* Care Card Brief details */}
        <View style={[styles.briefCard, { backgroundColor: isDark ? '#0f172a' : '#005b7f' }]}>
          <View style={styles.briefHeader}>
            <Text style={styles.briefLogoText}>care</Text>
            <View style={styles.briefStatusBadge}>
              <Text style={styles.briefStatusText}>Active</Text>
            </View>
          </View>
          <View style={styles.briefInfoGrid}>
            <View style={styles.briefInfoCol}>
              <Text style={styles.briefLabel}>Policy Number</Text>
              <Text style={styles.briefVal}>B7812841</Text>
            </View>
            <View style={styles.briefInfoCol}>
              <Text style={styles.briefLabel}>Employee ID</Text>
              <Text style={styles.briefVal}>EMP124567</Text>
            </View>
            <View style={styles.briefInfoCol}>
              <Text style={styles.briefLabel}>Covered Members</Text>
              <Text style={styles.briefVal}>4 Members</Text>
            </View>
          </View>
          <View style={[styles.briefInfoGrid, { marginTop: rs(6) }]}>
            <View style={styles.briefInfoCol}>
              <Text style={styles.briefLabel}>Valid Till</Text>
              <Text style={styles.briefVal}>28 Jun 2027</Text>
            </View>
            <View style={styles.briefInfoCol}>
              <Text style={styles.briefLabel}>Member ID</Text>
              <Text style={styles.briefVal}>00SWITRN10</Text>
            </View>
            <View style={styles.briefInfoCol} />
          </View>
        </View>

        {/* Treatment Details section */}
        <View style={[styles.cardSection, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
          <View style={styles.sectionHeaderCompact}>
            <MaterialCommunityIcons name="hospital-building" size={20} color="#005b7f" />
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Treatment Details</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailsRow}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Member</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Ravi Sharma - Self</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Hospital</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Apollo Hospital Bengaluru</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: rs(8) }]}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Admission Date</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>18 Aug 2026</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Discharge Date</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>20 Aug 2026</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: rs(8) }]}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Claim Type</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Hospitalization</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Diagnosis</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Dengue Treatment</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense Summary section */}
        <View style={[styles.cardSection, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', marginTop: rs(14) }]}>
          <View style={styles.sectionHeaderCompact}>
            <MaterialCommunityIcons name="calculator" size={20} color="#005b7f" />
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Expense Summary</Text>
          </View>

          <View style={styles.expensesGrid}>
            <View style={styles.expenseRow}>
              <View style={styles.expenseBox}>
                <View style={[styles.expenseIconBox, { backgroundColor: '#e5f6fd' }]}>
                  <MaterialCommunityIcons name="hospital-building" size={20} color="#005b7f" />
                </View>
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.expenseLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Hospital Charges</Text>
                  <Text style={[styles.expenseValText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>₹42,500</Text>
                </View>
              </View>

              <View style={styles.expenseBox}>
                <View style={[styles.expenseIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialCommunityIcons name="pill" size={20} color="#10B981" />
                </View>
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.expenseLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Pharmacy</Text>
                  <Text style={[styles.expenseValText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>₹6,250</Text>
                </View>
              </View>
            </View>

            <View style={[styles.expenseRow, { marginTop: rs(10) }]}>
              <View style={styles.expenseBox}>
                <View style={[styles.expenseIconBox, { backgroundColor: '#F5F3FF' }]}>
                  <MaterialCommunityIcons name="test-tube" size={20} color="#7C3AED" />
                </View>
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.expenseLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Diagnostics</Text>
                  <Text style={[styles.expenseValText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>₹4,750</Text>
                </View>
              </View>

              <View style={styles.expenseBox}>
                <View style={[styles.expenseIconBox, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
                  <MaterialCommunityIcons name="plus" size={20} color={isDark ? '#A1A1AA' : '#64748B'} />
                </View>
                <View style={{ marginLeft: 6 }}>
                  <Text style={[styles.expenseLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Other</Text>
                  <Text style={[styles.expenseValText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>₹0</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Divider and Total Claimed Amount */}
          <View style={[styles.divider, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]} />
          
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Total Claimed Amount</Text>
            <Text style={[styles.totalAmtVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>₹53,500</Text>
          </View>

          <TouchableOpacity style={[styles.editBtn, { borderColor: isDark ? '#52525B' : '#D1D5DB' }]} activeOpacity={0.7}>
            <MaterialCommunityIcons name="pencil-outline" size={13} color={isDark ? '#A1A1AA' : '#475569'} style={{ marginRight: 4 }} />
            <Text style={[styles.editBtnText, { color: isDark ? '#A1A1AA' : '#475569' }]}>Edit Amounts</Text>
          </TouchableOpacity>
        </View>

        {/* Notice Info banner */}
        <View style={[styles.noticeBanner, { backgroundColor: isDark ? '#1E293B' : '#e5f6fd' }]}>
          <MaterialCommunityIcons name="information" size={20} color="#005b7f" />
          <Text style={[styles.noticeText, { color: isDark ? '#D4D4D8' : '#003950' }]}>
            Reimbursement means you pay first and then claim the eligible amount back after document verification.
          </Text>
        </View>

        {/* Action Triggers */}
        <TouchableOpacity style={styles.continueClaimBtn} activeOpacity={0.85} onPress={handleContinue}>
          <Text style={styles.continueClaimBtnText}>Continue to Documents</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.draftBtn, { borderColor: isDark ? '#52525B' : '#D1D5DB' }]} activeOpacity={0.8}>
          <Text style={[styles.draftBtnText, { color: isDark ? '#FFFFFF' : '#475569' }]}>Save Draft</Text>
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
  briefCard: {
    borderRadius: rs(14),
    padding: rs(14),
    marginTop: rs(12),
  },
  briefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  briefLogoText: {
    fontSize: fs(14.5),
    fontWeight: '700',
    color: '#FBBF24',
  },
  briefStatusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
  },
  briefStatusText: {
    fontSize: fs(9.5),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  briefInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  briefInfoCol: {
    flex: 1,
  },
  briefLabel: {
    fontSize: fs(9),
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  briefVal: {
    fontSize: fs(11),
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: rs(1),
  },
  cardSection: {
    borderRadius: rs(14),
    padding: rs(14),
    marginTop: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: rs(6),
    marginBottom: rs(10),
  },
  sectionTitleCompact: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  detailsGrid: {
    gap: rs(8),
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsCol: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: fs(11),
    fontWeight: '600',
  },
  detailsVal: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: rs(2),
  },
  expensesGrid: {
    gap: rs(10),
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(10),
  },
  expenseBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIconBox: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseLabel: {
    fontSize: fs(9.5),
    fontWeight: '600',
  },
  expenseValText: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: rs(1),
  },
  divider: {
    height: 0.5,
    marginVertical: rs(12),
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  totalAmtVal: {
    fontSize: fs(16),
    fontWeight: '700',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(8),
    borderWidth: 1,
    borderRadius: rs(6),
    marginTop: rs(12),
    backgroundColor: 'transparent',
  },
  editBtnText: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: rs(10),
    borderRadius: rs(10),
    marginTop: rs(14),
    gap: rs(6),
  },
  noticeText: {
    fontSize: fs(10),
    fontWeight: '700',
    flex: 1,
  },
  continueClaimBtn: {
    backgroundColor: '#005b7f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(12),
    borderRadius: rs(10),
    marginTop: rs(18),
  },
  continueClaimBtnText: {
    color: '#FFFFFF',
    fontSize: fs(13),
    fontWeight: '700',
  },
  draftBtn: {
    borderWidth: 1,
    paddingVertical: rs(12),
    borderRadius: rs(10),
    alignItems: 'center',
    marginTop: rs(10),
    backgroundColor: 'transparent',
  },
  draftBtnText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
});

export default ReimbursementDetailsScreen;
