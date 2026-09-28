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

const CashlessReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const handleSubmission = () => {
    Alert.alert(
      'Claim Submitted',
      'Your cashless pre-authorization request CLM12345678 has been submitted successfully.',
      [
        {
          text: 'Ok',
          onPress: () => navigation.navigate('HealthClaimsScreen'),
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
          <View style={[styles.stepCircleDone, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Hospital</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: '#10B981' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircleDone, { backgroundColor: '#10B981' }]}>
            <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
          </View>
          <Text style={[styles.stepLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Documents</Text>
        </View>

        <View style={[styles.stepLine, { backgroundColor: '#10B981' }]} />

        <View style={styles.stepItem}>
          <View style={[styles.stepCircleActive, { borderColor: '#005b7f', backgroundColor: '#005b7f' }]}>
            <Text style={styles.stepCircleActiveText}>4</Text>
          </View>
          <Text style={[styles.stepLabel, { color: '#005b7f', fontWeight: '700' }]}>Review</Text>
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
            <MaterialCommunityIcons name="clipboard-text-outline" size={16} color="#005b7f" />
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Treatment Details</Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailsRow}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Selected Member</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Ravi Sharma - Self</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Selected Hospital</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Manipal Hospital</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: rs(8) }]}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Admission Type</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Planned</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Admission Date</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>22 Aug 2026</Text>
              </View>
            </View>

            <View style={[styles.detailsRow, { marginTop: rs(8) }]}>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Diagnosis</Text>
                <Text style={[styles.detailsVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>General Surgery</Text>
              </View>
              <View style={styles.detailsCol}>
                <Text style={[styles.detailsLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Estimated Amount</Text>
                <Text style={[styles.detailsVal, { color: '#10B981', fontWeight: '700' }]}>₹75,000</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Documents Checklist section */}
        <View style={[styles.cardSection, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', marginTop: rs(14) }]}>
          <View style={styles.sectionHeaderCompact}>
            <MaterialCommunityIcons name="folder-outline" size={16} color="#005b7f" />
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Documents Checklist</Text>
          </View>

          <View style={styles.docsRow}>
            <View style={styles.docCheckItem}>
              <View style={[styles.docIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={styles.checkBadgeMini} />
                <MaterialCommunityIcons name="card-bulleted-outline" size={20} color="#10B981" />
              </View>
              <Text style={[styles.docCheckLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Health E-Card</Text>
              <Text style={[styles.docCheckSub, { color: '#10B981' }]}>Uploaded</Text>
            </View>

            <View style={styles.docCheckItem}>
              <View style={[styles.docIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={styles.checkBadgeMini} />
                <MaterialCommunityIcons name="badge-account-outline" size={20} color="#10B981" />
              </View>
              <Text style={[styles.docCheckLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>ID Proof</Text>
              <Text style={[styles.docCheckSub, { color: '#10B981' }]}>Uploaded</Text>
            </View>

            <View style={styles.docCheckItem}>
              <View style={[styles.docIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={styles.checkBadgeMini} />
                <MaterialCommunityIcons name="file-document-outline" size={20} color="#10B981" />
              </View>
              <Text style={[styles.docCheckLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Prescription</Text>
              <Text style={[styles.docCheckSub, { color: '#10B981' }]}>Uploaded</Text>
            </View>

            <View style={styles.docCheckItem}>
              <View style={[styles.docIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={styles.checkBadgeMini} />
                <MaterialCommunityIcons name="hospital-marker" size={20} color="#10B981" />
              </View>
              <Text style={[styles.docCheckLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Admission Advice</Text>
              <Text style={[styles.docCheckSub, { color: '#10B981' }]}>Uploaded</Text>
            </View>

            <View style={styles.docCheckItem}>
              <View style={[styles.docIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={styles.checkBadgeMini} />
                <MaterialCommunityIcons name="file-chart-outline" size={20} color="#10B981" />
              </View>
              <Text style={[styles.docCheckLabel, { color: isDark ? '#A1A1AA' : '#475569' }]}>Estimated Bill</Text>
              <Text style={[styles.docCheckSub, { color: '#10B981' }]}>Uploaded</Text>
            </View>
          </View>
        </View>

        {/* Review Request summary card */}
        <View style={[styles.cardSection, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', marginTop: rs(14) }]}>
          <View style={styles.sectionHeaderCompact}>
            <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#005b7f" />
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Review Cashless Request</Text>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Claim Type</Text>
              <Text style={[styles.summaryVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Cashless</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Patient</Text>
              <Text style={[styles.summaryVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Ravi Sharma</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Hospital</Text>
              <Text style={[styles.summaryVal, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Manipal Hospital</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Documents Uploaded</Text>
              <Text style={[styles.summaryVal, { color: '#10B981', fontWeight: '700' }]}>5 / 5</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Pre-auth Status</Text>
              <View style={styles.readyBadge}>
                <Text style={styles.readyBadgeText}>Ready to submit</Text>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={{ marginLeft: 3 }} />
              </View>
            </View>
          </View>
        </View>

        {/* Notice Info banner */}
        <View style={[styles.noticeBanner, { backgroundColor: isDark ? '#1E293B' : '#e5f6fd' }]}>
          <MaterialCommunityIcons name="information" size={16} color="#005b7f" />
          <Text style={[styles.noticeText, { color: isDark ? '#D4D4D8' : '#003950' }]}>
            Pre-authorization is usually reviewed within 2–4 hours.
          </Text>
        </View>

        {/* Action Triggers */}
        <TouchableOpacity style={styles.submitBtn} activeOpacity={0.85} onPress={handleSubmission}>
          <Text style={styles.submitBtnText}>Submit Cashless Request</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.draftBtn, { borderColor: isDark ? '#52525B' : '#D1D5DB' }]} activeOpacity={0.8}>
          <Text style={[styles.draftBtnText, { color: isDark ? '#FFFFFF' : '#475569' }]}>Save Draft</Text>
        </TouchableOpacity>

        {/* Helpdesk Call Row */}
        <View style={[styles.helpdeskRow, { borderTopColor: isDark ? '#27272A' : '#E2E8F0' }]}>
          <View style={styles.helpdeskLeft}>
            <View style={[styles.helpIconCircle, { backgroundColor: isDark ? '#27272A' : '#F1F5F9' }]}>
              <MaterialCommunityIcons name="headphones" size={16} color="#005b7f" />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.helpLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Call Helpdesk 24x7</Text>
              <Text style={[styles.helpSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>We're here to help you anytime.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callLink} activeOpacity={0.7}>
            <MaterialCommunityIcons name="phone" size={14} color="#005b7f" style={{ marginRight: 4 }} />
            <Text style={styles.callLinkText}>8860402452</Text>
            <MaterialCommunityIcons name="chevron-right" size={14} color="#005b7f" />
          </TouchableOpacity>
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
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  stepCircleActiveText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepCirclePending: {
    width: rs(22),
    height: rs(22),
    borderRadius: rs(11),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepCirclePendingText: {
    fontSize: fs(11),
    fontWeight: '600',
  },
  stepLabel: {
    fontSize: fs(10),
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
    padding: rs(12),
    marginTop: rs(12),
  },
  briefHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  briefLogoText: {
    fontSize: fs(14),
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
    fontSize: fs(10),
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
    fontSize: fs(8),
    color: 'rgba(255, 255, 255, 0.65)',
    fontWeight: '600',
  },
  briefVal: {
    fontSize: fs(9.5),
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
  docsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(4),
  },
  docCheckItem: {
    flex: 1,
    alignItems: 'center',
  },
  docIconBox: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  checkBadgeMini: {
    position: 'absolute',
    top: -2,
    right: -2,
    zIndex: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
  },
  docCheckLabel: {
    fontSize: fs(10),
    textAlign: 'center',
    marginTop: rs(6),
    fontWeight: '700',
    lineHeight: fs(10.5),
  },
  docCheckSub: {
    fontSize: fs(10),
    fontWeight: '700',
    marginTop: rs(2),
  },
  summaryGrid: {
    gap: rs(6),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: fs(12),
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
  },
  readyBadgeText: {
    fontSize: fs(10),
    color: '#10B981',
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
  submitBtn: {
    backgroundColor: '#005b7f',
    paddingVertical: rs(12),
    borderRadius: rs(10),
    alignItems: 'center',
    marginTop: rs(18),
  },
  submitBtnText: {
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
  helpdeskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(20),
    paddingTop: rs(12),
    borderTopWidth: 0.5,
  },
  helpdeskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpIconCircle: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpLabel: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  helpSub: {
    fontSize: fs(10),
    fontWeight: '500',
    marginTop: rs(1),
  },
  callLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callLinkText: {
    fontSize: fs(12),
    fontWeight: '700',
    color: '#005b7f',
  },
});

export default CashlessReviewScreen;
