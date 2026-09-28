import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';
import { fetchClaimHistory } from '../../services/inssuranceApi';

const { width } = Dimensions.get('window');

// ── Types & Helpers ───────────────────────────────────────────────────────────
interface StepData {
  label: string;
  sub: string;
  status: 'done' | 'active' | 'pending';
}

const HealthClaimsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useAppTheme();

  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchClaimHistory();
      if (res.success) {
        setEnquiries(res.data || []);
      }
    } catch (err) {
      console.error('[HealthClaimsScreen] Load history error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  // Helper timeline tracker component
  const TimelineTracker = ({ steps }: { steps: StepData[] }) => {
    return (
      <View style={styles.timelineContainer}>
        {/* Connecting line behind dots */}
        <View style={[styles.timelineLine, { backgroundColor: isDark ? '#3F3F46' : '#E2E8F0' }]} />
        
        {steps.map((step, idx) => (
          <View key={idx} style={styles.timelineStep}>
            {/* Step Node Icon */}
            {step.status === 'done' && (
              <View style={styles.nodeDone}>
                <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
              </View>
            )}
            {step.status === 'active' && (
              <View style={[styles.nodeActive, { borderColor: '#005b7f', backgroundColor: '#FFFFFF' }]}>
                <View style={[styles.nodeActiveInner, { backgroundColor: '#005b7f' }]} />
              </View>
            )}
            {step.status === 'pending' && (
              <View style={[styles.nodePending, { borderColor: isDark ? '#52525B' : '#CBD5E1', backgroundColor: isDark ? '#18181B' : '#FFFFFF' }]} />
            )}

            {/* Labels */}
            <Text 
              style={[
                styles.stepLabel, 
                { 
                  color: step.status === 'active' ? '#005b7f' : isDark ? '#D4D4D8' : '#334155',
                  fontWeight: step.status === 'active' ? '800' : '600',
                }
              ]}
              numberOfLines={2}
            >
              {step.label}
            </Text>
            <Text style={[styles.stepSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
              {step.sub}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header bar fixed at the top */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>My Claims</Text>
        </View>
      </View>

      {/* Scrollable contents */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Claim Buttons (50/50 split in one row) */}
        <View style={styles.quickClaimButtonsRow}>
          {/* Button 1: Cashless Claim */}
          <TouchableOpacity 
            style={[styles.quickClaimBtnCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClaimEnquiryFormScreen', { claimType: 'cashless' })}
          >
            <View style={[styles.quickClaimIconBox, { backgroundColor: '#e5f6fd' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#005b7f" />
            </View>
            <Text style={[styles.quickClaimBtnTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Cashless Claim</Text>
            <Text style={[styles.quickClaimBtnSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>At network hospital</Text>
          </TouchableOpacity>

          {/* Button 2: Reimbursement Claim */}
          <TouchableOpacity 
            style={[styles.quickClaimBtnCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClaimEnquiryFormScreen', { claimType: 'reimbursement' })}
          >
            <View style={[styles.quickClaimIconBox, { backgroundColor: '#FDF2F8' }]}>
              <MaterialCommunityIcons name="credit-card-outline" size={24} color="#DB2777" />
            </View>
            <Text style={[styles.quickClaimBtnTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Reimbursement Claim</Text>
            <Text style={[styles.quickClaimBtnSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Submit bills post treatment</Text>
          </TouchableOpacity>
        </View>

        {/* How Claim Works Header */}
        <View style={{ marginTop: rs(24) }}>
          <Text style={[styles.headerTitle, { fontSize: fs(14), color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: rs(6) }]}>
            How Claim Works
          </Text>
        </View>

        <TimelineTracker 
          steps={[
            { label: 'Raise Claim', sub: 'Submit enquiry details', status: 'active' },
            { label: 'Review', sub: 'We verify documents', status: 'pending' },
            { label: 'Settlement', sub: 'Claim amount settled', status: 'pending' },
          ]}
        />

        {/* Enquiry History Header */}
        <View style={{ marginTop: rs(24), marginBottom: rs(6) }}>
          <Text style={[styles.headerTitle, { fontSize: fs(14), color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Enquiry History
          </Text>
        </View>

        {/* ────── CLAIMS LIST ────── */}
        <View style={styles.claimsList}>
          {loading ? (
            <ActivityIndicator size="large" color="#005b7f" style={{ marginVertical: rs(20) }} />
          ) : enquiries.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: rs(40) }}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={isDark ? '#3F3F46' : '#CBD5E1'} />
              <Text style={{ marginTop: rs(12), color: isDark ? '#A1A1AA' : '#64748B', fontSize: fs(12), fontWeight: '600' }}>
                No claim enquiries found
              </Text>
            </View>
          ) : (
            enquiries.map((item) => {
              const isItemCashless = item.claim_type === 'cashless';
              const displayAmt = isItemCashless ? item.estimated_cost : item.actual_cost;
              
              // Status badges colors
              let statusBg = '#FEF3C7';
              let statusText = '#D97706';
              if (item.status === 'Approved') {
                statusBg = '#ECFDF5';
                statusText = '#047857';
              } else if (item.status === 'Rejected') {
                statusBg = '#FEE2E2';
                statusText = '#EF4444';
              } else if (item.status === 'Submitted') {
                statusBg = '#E0F2FE';
                statusText = '#0284C7';
              }

              // Build timeline steps based on status
              const timelineSteps: StepData[] = [
                { label: 'Submitted', sub: item.admission_date || '', status: 'done' },
                { 
                  label: 'Document Verification', 
                  sub: item.status === 'Submitted' ? 'Pending' : 'Completed', 
                  status: item.status === 'Submitted' ? 'active' : 'done' 
                },
                { 
                  label: 'Pre-Authorization', 
                  sub: item.status === 'Submitted' || item.status === 'Under Review' ? 'Pending' : 'Completed', 
                  status: item.status === 'Under Review' ? 'active' : item.status === 'Submitted' ? 'pending' : 'done' 
                },
                { 
                  label: 'Approval', 
                  sub: item.status, 
                  status: item.status === 'Approved' ? 'done' : item.status === 'Rejected' ? 'pending' : 'pending' 
                },
              ];

              return (
                <View key={item.id} style={[styles.claimItemCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
                  <View style={styles.cardHeaderRow}>
                    {/* Type pill */}
                    <View style={[styles.typeBadge, { backgroundColor: isItemCashless ? '#ECFDF5' : '#F3E8FF' }]}>
                      <Text style={[styles.typeText, { color: isItemCashless ? '#047857' : '#6D28D9' }]}>
                        {isItemCashless ? 'Cashless Claim' : 'Reimbursement Claim'}
                      </Text>
                    </View>
                    {/* Status pill + chevron */}
                    <View style={styles.statusCol}>
                      <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                        <Text style={[styles.statusText, { color: statusText }]}>{item.status}</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={isDark ? '#71717A' : '#94A3B8'} style={{ marginLeft: 4 }} />
                    </View>
                  </View>

                  {/* Info details */}
                  <View style={styles.cardDetailsRow}>
                    <View style={styles.cardDetailsLeft}>
                      {/* Green hospital icon */}
                      <View style={[styles.cardIconBox, { backgroundColor: isItemCashless ? '#d0f0fd' : '#F3E8FF' }]}>
                        <MaterialCommunityIcons 
                          name={isItemCashless ? "hospital-building" : "wallet-outline"} 
                          size={22} 
                          color={isItemCashless ? "#007ca5" : "#7C3AED"} 
                        />
                      </View>
                      <View style={styles.cardTextInfo}>
                        <Text style={[styles.claimIdText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                          CLM{String(item.id).padStart(8, '0')}
                        </Text>
                        <Text style={[styles.claimantText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                          {isItemCashless ? (item.doctor_name || 'Assigned Assessor') : 'Self Reimbursement'}
                        </Text>
                        <Text style={[styles.hospitalText, { color: isDark ? '#71717A' : '#64748B' }]} numberOfLines={1}>
                          {item.hospital_name} ({item.diagnosis})
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardDetailsRight}>
                      <Text style={[styles.amtLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Amount</Text>
                      <Text style={[styles.amtVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                        ₹{displayAmt ? Number(displayAmt).toLocaleString('en-IN') : '—'}
                      </Text>
                    </View>
                  </View>

                  {/* Stepper Timeline tracker */}
                  <TimelineTracker steps={timelineSteps} />
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* Custom Bottom Tab Bar (Highlighting Claims tab) */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderTopColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6} onPress={() => navigation.navigate('HealthDashboard')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6}>
          <MaterialCommunityIcons name="file-document" size={24} color="#005b7f" />
          <Text style={[styles.tabLabel, { color: '#005b7f', fontWeight: '700' }]}>Claims</Text>
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
  chipsScroll: {
    marginTop: rs(10),
    maxHeight: rs(42),
  },
  chipsContent: {
    alignItems: 'center',
    paddingRight: rs(16),
    gap: rs(8),
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(14),
    paddingVertical: rs(7),
    borderRadius: rs(18),
    borderWidth: 1,
  },
  chipText: {
    fontSize: fs(12),
  },
  subTabsContainer: {
    flexDirection: 'row',
    marginTop: rs(18),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: rs(11),
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#005b7f',
  },
  subTabText: {
    fontSize: fs(13),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(16),
    gap: rs(8),
  },
  statsCard: {
    flex: 1,
    borderRadius: rs(14),
    padding: rs(12),
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statsIconBox: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
  },
  statsLabel: {
    fontSize: fs(10),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: rs(2),
  },
  statsCount: {
    fontSize: fs(18),
    fontWeight: '700',
  },
  statsAmt: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#10B981',
    marginTop: rs(2),
  },
  statsAmtMuted: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#EA580C',
    marginTop: rs(2),
  },
  newClaimBtn: {
    backgroundColor: '#005b7f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(12),
    borderRadius: rs(10),
    marginTop: rs(18),
    shadowColor: '#005b7f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  newClaimBtnText: {
    color: '#FFFFFF',
    fontSize: fs(13),
    fontWeight: '700',
  },
  claimsList: {
    marginTop: rs(16),
    gap: rs(12),
  },
  claimItemCard: {
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    paddingHorizontal: rs(9),
    paddingVertical: rs(3.5),
    borderRadius: rs(6),
  },
  typeText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  statusCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: rs(9),
    paddingVertical: rs(3.5),
    borderRadius: rs(6),
  },
  statusText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  cardDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(10),
  },
  cardDetailsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
  },
  cardIconBox: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTextInfo: {
    marginLeft: rs(10),
    flex: 1,
  },
  claimIdText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  claimantText: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(1),
  },
  hospitalText: {
    fontSize: fs(11),
    fontWeight: '500',
    marginTop: rs(1.5),
  },
  cardDetailsRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  amtLabel: {
    fontSize: fs(10),
    fontWeight: '600',
  },
  amtVal: {
    fontSize: fs(14.5),
    fontWeight: '700',
    marginTop: rs(1),
  },

  // Timeline Stepper Styles
  timelineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: rs(18),
    position: 'relative',
    paddingHorizontal: rs(4),
  },
  timelineLine: {
    position: 'absolute',
    height: 1.5,
    top: rs(8),
    left: '12%',
    right: '12%',
    zIndex: 1,
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  nodeDone: {
    width: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActive: {
    width: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeActiveInner: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
  },
  nodePending: {
    width: rs(16),
    height: rs(16),
    borderRadius: rs(8),
    borderWidth: 1.5,
  },
  stepLabel: {
    fontSize: fs(9),
    textAlign: 'center',
    marginTop: rs(6),
    lineHeight: fs(11),
  },
  stepSub: {
    fontSize: fs(10),
    textAlign: 'center',
    marginTop: rs(2),
    fontWeight: '600',
  },

  // Settled Box layout styles
  settledBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(12),
    gap: rs(10),
  },
  settledInfoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: rs(12),
    paddingVertical: rs(10),
    borderRadius: rs(10),
  },
  settledLabel: {
    fontSize: fs(9),
    fontWeight: '600',
  },
  settledVal: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: rs(1),
  },

  // bottom tab bar style
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
  quickClaimButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(8),
    marginTop: rs(12),
  },
  quickClaimBtnCard: {
    flex: 1,
    borderRadius: rs(14),
    padding: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.05)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    minHeight: rs(125),
  },
  quickClaimIconBox: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(8),
  },
  quickClaimBtnTitle: {
    fontSize: fs(12),
    fontWeight: '700',
    marginBottom: rs(2),
  },
  quickClaimBtnSub: {
    fontSize: fs(9.5),
    fontWeight: '500',
    lineHeight: fs(12),
  },
});

export default HealthClaimsScreen;
