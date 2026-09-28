import React, { useState } from 'react';
import { Svg, Path } from 'react-native-svg';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';

const { width } = Dimensions.get('window');

import { useFocusEffect } from '@react-navigation/native';
import { fetchGmcDetails, fetchClaimHistory } from '../../services/inssuranceApi';

const isValidMemberName = (name: any) => {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return n !== '' && n !== 'n/a' && n !== '—' && n !== 'null' && n !== 'undefined';
};

const CardPattern: React.FC = () => {
  const lines: React.ReactNode[] = [];
  const spacing = 28;
  const height = 280;
  const strokeColor = "rgba(255, 255, 255, 0.16)";
  const strokeWidth = 0.6;

  // Diagonal 1: Down and right
  for (let i = -15; i < 25; i++) {
    lines.push(
      <Path
        key={`d1-${i}`}
        d={`M ${i * spacing} -20 L ${(i * spacing) + height} ${height}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Diagonal 2: Up and right
  for (let i = -15; i < 25; i++) {
    lines.push(
      <Path
        key={`d2-${i}`}
        d={`M ${i * spacing} ${height} L ${(i * spacing) + height} -20`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  // Vertical lines
  for (let i = -5; i < 30; i++) {
    lines.push(
      <Path
        key={`v-${i}`}
        d={`M ${i * (spacing / 2)} -20 L ${i * (spacing / 2)} ${height}`}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    );
  }

  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines}
    </Svg>
  );
};

const HealthDashboard: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, theme } = useAppTheme();

  const [gmcDetails, setGmcDetails] = useState<any | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGmc = React.useCallback(async () => {
    try {
      const [gmcRes, claimsRes] = await Promise.all([
        fetchGmcDetails(),
        fetchClaimHistory()
      ]);
      if (gmcRes.success) {
        setGmcDetails(gmcRes.data);
      }
      if (claimsRes.success && Array.isArray(claimsRes.data)) {
        setClaims(claimsRes.data);
      }
    } catch (err) {
      console.error('Error loading GMC details / claims on Dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGmc();
  }, [loadGmc]);

  useFocusEffect(
    React.useCallback(() => {
      loadGmc();
    }, [loadGmc])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#F8FAFC' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Top Header Row (Back Button + Greeting on Left, Profile Icon on Right) */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </TouchableOpacity>
          <View style={styles.userText}>
            <Text style={[styles.helloText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Hello, {gmcDetails?.name ? gmcDetails.name.split(' ')[0] : 'User'} 👋
            </Text>
            <Text style={[styles.greetingText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
              Good morning!
            </Text>
          </View>
        </View>

        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80' }}
          style={styles.avatar as any}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Health Insurance
          </Text>
          <Text style={[styles.subTitleText, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
            Your health. Our priority.
          </Text>
        </View>

        {/* Care Health Insurance Card */}
        {loading ? (
          <View style={[styles.careCard, { justifyContent: 'center', alignItems: 'center', minHeight: rs(200) }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : gmcDetails ? (
          gmcDetails.policy_type === 'Group Health Card' ? (
            /* GROUP HEALTH CARD LAYOUT (Matches attached image) */
            <LinearGradient
              colors={['#0284c7', '#0369a1', '#075985']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.careCard, { paddingVertical: rs(10), paddingHorizontal: rs(12) }]}
            >
              <CardPattern />
              
              {/* Header row */}
              <View style={styles.groupCardHeader}>
                <View style={styles.careLogoContainer}>
                  <View style={styles.careLogoBox}>
                    <Text style={styles.careLogoText}>care</Text>
                  </View>
                  <View style={styles.careLogoSubBox}>
                    <Text style={styles.careLogoSubText}>HEALTH</Text>
                    <Text style={styles.careLogoSubTextMin}>INSURANCE</Text>
                  </View>
                </View>
                
                <View style={styles.groupHeaderRight}>
                  <Text style={styles.groupHeaderRightText}>Policy Number : {gmcDetails.policy_number || '—'}</Text>
                  <Text style={styles.groupHeaderRightText}>Member Id : {gmcDetails.member_id || '—'}</Text>
                  <Text style={styles.groupHeaderRightText}>Valid Upto : {gmcDetails.valid_till || '—'}</Text>
                </View>
              </View>

              {/* Policy type & company row */}
              <View style={{ marginTop: rs(6) }}>
                <Text style={styles.groupPolicyText}>Policy Type : {gmcDetails.policy_type || 'Group Health Insurance'}</Text>
                <Text style={styles.groupCompanyText}>{gmcDetails.policy_company_name || gmcDetails.company_name || '—'}</Text>

                {/* Members Table - Spanning 100% full width */}
                <View style={styles.groupTableContainer}>
                  <View style={styles.groupTableHeader}>
                    <Text style={[styles.groupColHeader, { width: '50%' }]}>Name</Text>
                    <Text style={[styles.groupColHeader, { width: '27%' }]}>Client Id</Text>
                    <Text style={[styles.groupColHeader, { width: '23%' }]}>Dob</Text>
                  </View>
                  
                  {[
                    isValidMemberName(gmcDetails.name) && { name: gmcDetails.name, clientId: gmcDetails.client_id || '—', dob: gmcDetails.dob || '—' },
                    isValidMemberName(gmcDetails.member_1_name) && { name: gmcDetails.member_1_name, clientId: gmcDetails.member_1_client_id || '—', dob: gmcDetails.member_1_dob || '—' },
                    isValidMemberName(gmcDetails.member_2_name) && { name: gmcDetails.member_2_name, clientId: gmcDetails.member_2_client_id || '—', dob: gmcDetails.member_2_dob || '—' },
                    isValidMemberName(gmcDetails.member_3_name) && { name: gmcDetails.member_3_name, clientId: gmcDetails.member_3_client_id || '—', dob: gmcDetails.member_3_dob || '—' },
                    isValidMemberName(gmcDetails.member_4_name) && { name: gmcDetails.member_4_name, clientId: gmcDetails.member_4_client_id || '—', dob: gmcDetails.member_4_dob || '—' },
                    isValidMemberName(gmcDetails.member_5_name) && { name: gmcDetails.member_5_name, clientId: gmcDetails.member_5_client_id || '—', dob: gmcDetails.member_5_dob || '—' }
                  ].filter(Boolean).map((m: any, idx) => (
                    <View key={idx} style={styles.groupTableRow}>
                      <Text style={[styles.groupColVal, { width: '50%' }]} numberOfLines={1}>{m.name.toUpperCase()}</Text>
                      <Text style={[styles.groupColVal, { width: '27%' }]} numberOfLines={1}>{m.clientId}</Text>
                      <Text style={[styles.groupColVal, { width: '23%' }]} numberOfLines={1}>{m.dob}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* View E-Card Button (Centered at bottom) */}
              <View style={{ alignItems: 'center', marginTop: rs(10) }}>
                <TouchableOpacity 
                  style={[styles.eCardBtn, { backgroundColor: '#FFFFFF', alignSelf: 'center', paddingHorizontal: rs(16) }]} 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MyECardScreen')}
                >
                  <MaterialCommunityIcons name="card-bulleted-outline" size={12} color="#007ca5" style={{ marginRight: 4 }} />
                  <Text style={[styles.eCardBtnText, { color: '#007ca5' }]}>View E-Card</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            /* PERSONAL HEALTH CARD LAYOUT */
            <LinearGradient
              colors={isDark ? ['#007ca5', '#005b7f', '#002534'] : ['#4ec3e4', '#007ca5', '#005b7f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.careCard}
            >
              <CardPattern />
              
              <View style={styles.cardHeader}>
                <View style={styles.careLogoContainer}>
                  <View style={styles.careLogoBox}>
                    <Text style={styles.careLogoText}>care</Text>
                  </View>
                  <View style={styles.careLogoSubBox}>
                    <Text style={styles.careLogoSubText}>HEALTH</Text>
                    <Text style={styles.careLogoSubTextMin}>INSURANCE</Text>
                  </View>
                </View>

                <View style={styles.activeBadge}>
                  <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" style={{ marginRight: 2 }} />
                  <Text style={styles.activeText}>Active</Text>
                </View>
              </View>

              <View style={styles.carePolicyRowDashboard}>
                <Text style={styles.cardLabel}>Policy Type</Text>
                <Text style={styles.cardValue}>{gmcDetails.policy_type || 'Personal Health Card'}</Text>
              </View>

              <View style={[styles.cardInfoGrid, { marginTop: rs(10) }]}>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardLabel}>Policy Number</Text>
                  <Text style={styles.cardValue}>{gmcDetails.policy_number || '—'}</Text>
                </View>
                <View style={[styles.cardInfoCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.cardLabel}>Member ID</Text>
                  <Text style={styles.cardValue}>{gmcDetails.member_id || '—'}</Text>
                </View>
              </View>

              <View style={[styles.cardInfoGrid, { marginTop: rs(12) }]}>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardLabel}>Employee ID</Text>
                  <Text style={styles.cardValue}>{gmcDetails.employee_id || '—'}</Text>
                </View>
                <View style={styles.cardInfoCol}>
                  <Text style={styles.cardLabel}>Valid Till</Text>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="calendar" size={11} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
                    <Text style={styles.cardValue}>{gmcDetails.valid_till || '—'}</Text>
                  </View>
                </View>
                <View style={[styles.cardInfoCol, { alignItems: 'flex-end' }]}>
                  <Text style={styles.cardLabel}>Family Covered</Text>
                  <View style={styles.dateRow}>
                    <MaterialCommunityIcons name="account-group" size={12} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
                    <Text style={styles.cardValue}>
                      {[
                        gmcDetails.member_1_name,
                        gmcDetails.member_2_name,
                        gmcDetails.member_3_name,
                        gmcDetails.member_4_name,
                        gmcDetails.member_5_name
                      ].filter(Boolean).length + 1}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <TouchableOpacity 
                  style={styles.eCardBtn} 
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('MyECardScreen')}
                >
                  <MaterialCommunityIcons name="card-bulleted-outline" size={13} color={isDark ? '#0F172A' : '#007ca5'} style={{ marginRight: 4 }} />
                  <Text style={[styles.eCardBtnText, { color: isDark ? '#0F172A' : '#007ca5' }]}>View E-Card</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          )
        ) : (
          /* NO GMC CARD FALLBACK */
          <View style={[styles.careCard, { justifyContent: 'center', alignItems: 'center', minHeight: rs(140), backgroundColor: isDark ? '#1E1E24' : '#F1F5F9' }]}>
            <MaterialCommunityIcons name="shield-alert-outline" size={32} color={isDark ? '#52525B' : '#94A3B8'} />
            <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontSize: fs(11), fontWeight: '700', marginTop: rs(6) }}>No active health card available</Text>
          </View>
        )}

        {/* Health Tip of the Day - Full Width */}
        <LinearGradient
          colors={['#005b7f', '#003950']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fullWidthTipCard}
        >
          <View style={styles.tipContentRow}>
            <View style={{ flex: 1, paddingRight: rs(12) }}>
              <View style={styles.tipCheckedRow}>
                <MaterialCommunityIcons name="check-circle" size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.tipCheckText}>HEALTH TIP OF THE DAY</Text>
              </View>
              <Text style={styles.fullWidthTipTitle}>Drink enough water</Text>
              <Text style={styles.fullWidthTipSub}>Stay hydrated, boost energy and keep your body in balance.</Text>
            </View>
            <MaterialCommunityIcons name="water-outline" size={44} color="rgba(255,255,255,0.75)" style={{ alignSelf: 'center' }} />
          </View>
        </LinearGradient>

        {/* Quick Actions Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Quick Actions
          </Text>
        </View>

        {/* Quick Actions (50/50 split in one row) */}
        <View style={styles.actionsGrid}>
          {/* Button 1: Cashless Claim */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClaimEnquiryFormScreen', { claimType: 'cashless' })}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#e5f6fd' }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color="#005b7f" />
            </View>
            <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Cashless Claim</Text>
            <Text style={[styles.actionSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Get treatment at network hospital</Text>
          </TouchableOpacity>

          {/* Button 2: Reimbursement Claim */}
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClaimEnquiryFormScreen', { claimType: 'reimbursement' })}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F8' }]}>
              <MaterialCommunityIcons name="credit-card-outline" size={24} color="#DB2777" />
            </View>
            <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Reimbursement Claim</Text>
            <Text style={[styles.actionSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Submit bills and refund expenses</Text>
          </TouchableOpacity>
        </View>

        {/* Benefits at a glance Header */}
        <View style={[styles.sectionHeader, { marginTop: rs(24) }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Benefits at a glance
          </Text>
        </View>

        {/* Benefits horizontal block */}
        <View style={styles.benefitsContainer}>
          {/* Benefit 1 */}
          <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="shield-outline" size={22} color="#005b7f" style={styles.benefitIcon} />
            <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Sum Insured</Text>
            <Text style={[styles.benefitVal, { color: '#005b7f' }]}>₹10,00,000</Text>
          </View>

          {/* Benefit 2 */}
          <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="hospital-building" size={22} color="#10B981" style={styles.benefitIcon} />
            <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Cashless Hospitals</Text>
            <Text style={[styles.benefitVal, { color: '#10B981' }]}>6200+</Text>
          </View>

          {/* Benefit 3 */}
          <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#7C3AED" style={styles.benefitIcon} />
            <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Members Covered</Text>
            <Text style={[styles.benefitVal, { color: '#7C3AED' }]}>4</Text>
          </View>

          {/* Benefit 4 */}
          <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            <MaterialCommunityIcons name="heart-flash" size={22} color="#DB2777" style={styles.benefitIcon} />
            <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Wellness Benefits</Text>
            <Text style={[styles.benefitVal, { color: '#DB2777' }]}>Included</Text>
          </View>
        </View>

        {/* How claims work Header */}
        <View style={[styles.sectionHeader, { marginTop: rs(24) }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            How claims work
          </Text>
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => navigation.navigate('GmcProcessVideosScreen')}
            style={styles.watchVideosHeaderBtn}
          >
            <MaterialCommunityIcons name="youtube" size={16} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.viewAllText}>Watch Videos</Text>
          </TouchableOpacity>
        </View>

        {/* Process Flow timeline horizontal */}
        <View style={[styles.processContainer, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
          <View style={styles.processItem}>
            <View style={styles.processStepCircle}>
              <Text style={styles.processStepText}>1</Text>
            </View>
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color="#005b7f" />
            <Text style={[styles.processTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Raise Claim</Text>
            <Text style={[styles.processSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Intimate your claim in steps</Text>
          </View>

          <View style={styles.processDivider} />

          <View style={styles.processItem}>
            <View style={styles.processStepCircle}>
              <Text style={styles.processStepText}>2</Text>
            </View>
            <MaterialCommunityIcons name="shield-search" size={20} color="#EA580C" />
            <Text style={[styles.processTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Review</Text>
            <Text style={[styles.processSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>We review your documents</Text>
          </View>

          <View style={styles.processDivider} />

          <View style={styles.processItem}>
            <View style={styles.processStepCircle}>
              <Text style={styles.processStepText}>3</Text>
            </View>
            <MaterialCommunityIcons name="hand-coin-outline" size={20} color="#10B981" />
            <Text style={[styles.processTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Settlement</Text>
            <Text style={[styles.processSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Amount settled to you</Text>
          </View>
        </View>

        {/* Watch GMC Videos Quick Banner */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('GmcProcessVideosScreen')}
          style={[
            styles.videoQuickBanner,
            { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', borderColor: isDark ? '#27272A' : '#E2E8F0' },
          ]}
        >
          <View style={styles.videoBannerLeft}>
            <View style={styles.videoRedPlayIcon}>
              <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" style={{ marginLeft: 1 }} />
            </View>
            <View style={{ marginLeft: rs(10), flex: 1 }}>
              <Text style={[styles.videoBannerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                GMC Process Video Guides
              </Text>
              <Text style={[styles.videoBannerSub, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                Watch 4 short guides on Cashless, PED coverage & claims
              </Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={isDark ? '#71717A' : '#94A3B8'} />
        </TouchableOpacity>

        {/* Bottom Recent Claims Row */}
        <View style={{ marginTop: rs(24), marginBottom: rs(12) }}>
          <View style={styles.sectionHeaderCompact}>
            <Text style={[styles.sectionTitleCompact, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
              Recent Claims
            </Text>
            {claims.length > 0 && (
              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => navigation.navigate('HealthClaimsScreen')}
              >
                <Text style={styles.viewAllTextCompact}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {claims.length === 0 ? (
            <View style={[styles.recentClaimCardFull, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingVertical: rs(24) }]}>
              <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontSize: fs(12), fontWeight: '600' }}>
                No recent claims found
              </Text>
            </View>
          ) : (
            <View style={{ gap: rs(10) }}>
              {claims.slice(0, 3).map((claim, index) => {
                const isApproved = claim.status?.toLowerCase() === 'approved';
                const isRejected = claim.status?.toLowerCase() === 'rejected';
                
                // Badging styles
                let badgeBg = '#FEF3C7';
                let badgeText = '#D97706';
                let badgeIcon = 'clock-outline';
                if (isApproved) {
                  badgeBg = '#ECFDF5';
                  badgeText = '#16A34A';
                  badgeIcon = 'check';
                } else if (isRejected) {
                  badgeBg = '#FEE2E2';
                  badgeText = '#DC2626';
                  badgeIcon = 'close';
                }

                return (
                  <View 
                    key={claim.id || index} 
                    style={[styles.recentClaimCardFull, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF', marginBottom: 0 }]}
                  >
                    <View style={styles.claimHeaderRow}>
                      <View style={[styles.claimTag, { backgroundColor: claim.claim_type?.toLowerCase()?.includes('reimbursement') ? '#F3E8FF' : '#E5F6FD' }]}>
                        <Text style={[styles.claimTagText, { color: claim.claim_type?.toLowerCase()?.includes('reimbursement') ? '#7C3AED' : '#005b7f' }]}>
                          {(claim.claim_type || 'CLAIM').toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.claimDate, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                        {claim.admission_date || '—'}
                      </Text>
                    </View>

                    <Text style={[styles.claimHospital, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                      {claim.hospital_name || '—'}
                    </Text>
                    <Text style={[styles.claimSubject, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                      Diagnosis: {claim.diagnosis || '—'}
                    </Text>

                    <View style={styles.claimFooterRow}>
                      <Text style={[styles.claimId, { color: isDark ? '#A1A1AA' : '#64748B' }]}>
                        CLM{claim.id}
                      </Text>
                      <View style={[styles.approvedBadge, { backgroundColor: badgeBg }]}>
                        <MaterialCommunityIcons name={badgeIcon as any} size={10} color={badgeText} style={{ marginRight: 2 }} />
                        <Text style={[styles.approvedText, { color: badgeText }]}>{claim.status || 'Under Review'}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Custom Bottom Tab Bar (Fixed height matching typical TabBar layout) */}
      <View style={[styles.tabBar, { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderTopColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.6}>
          <MaterialCommunityIcons name="home" size={24} color="#005b7f" />
          <Text style={[styles.tabLabel, { color: '#005b7f', fontWeight: '700' }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.tabItem} 
          activeOpacity={0.6}
          onPress={() => navigation.navigate('HealthClaimsScreen')}
        >
          <MaterialCommunityIcons name="file-document-outline" size={24} color={isDark ? '#A1A1AA' : '#64748B'} />
          <Text style={[styles.tabLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Claims</Text>
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
  scrollContainer: {
    paddingHorizontal: rs(16),
    paddingBottom: rs(96), // Space for bottom tab bar
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(16),
  },
  userLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
  },
  userText: {
    marginLeft: rs(10),
  },
  helloText: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  greetingText: {
    fontSize: fs(10),
    fontWeight: '500',
    marginTop: rs(1),
  },
  titleBlock: {
    marginTop: rs(8),
  },
  titleText: {
    fontSize: fs(22),
    fontWeight: '700',
  },
  subTitleText: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(2),
  },
  careCard: {
    borderRadius: rs(18),
    padding: rs(14),
    marginTop: rs(16),
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  careLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  careLogoBox: {
    backgroundColor: '#FBBF24',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
    marginRight: rs(4),
  },
  careLogoText: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#0F172A',
  },
  careLogoSubBox: {
    justifyContent: 'center',
  },
  careLogoSubText: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#FBBF24',
    lineHeight: fs(9.5),
  },
  careLogoSubTextMin: {
    fontSize: fs(6.5),
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: fs(8),
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(12),
  },
  activeText: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  carePolicyRowDashboard: {
    marginTop: rs(6),
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfoCol: {
    flex: 1,
  },
  cardLabel: {
    fontSize: fs(10),
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: fs(11),
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: rs(1),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardFooter: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: rs(10),
    marginTop: rs(12),
    alignItems: 'flex-end',
  },
  eCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rs(6),
  },
  eCardBtnText: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(20),
    marginBottom: rs(8),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  viewAllText: {
    fontSize: fs(10),
    color: '#005b7f',
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  actionCard: {
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
  actionIconBox: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(8),
  },
  actionTitle: {
    fontSize: fs(12),
    fontWeight: '700',
    marginBottom: rs(2),
  },
  actionSub: {
    fontSize: fs(9.5),
    fontWeight: '500',
    lineHeight: fs(12),
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  benefitCard: {
    flex: 1,
    borderRadius: rs(12),
    padding: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.05)',
    alignItems: 'flex-start',
    minHeight: rs(85),
  },
  benefitIcon: {
    marginBottom: rs(6),
  },
  benefitLabel: {
    fontSize: fs(10),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  benefitVal: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: rs(2),
  },
  processContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: rs(14),
    padding: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.05)',
  },
  processItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    paddingVertical: rs(6),
  },
  processStepCircle: {
    position: 'absolute',
    top: 0,
    left: rs(12),
    width: rs(12),
    height: rs(12),
    borderRadius: rs(6),
    backgroundColor: '#007ca5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  processStepText: {
    fontSize: fs(7),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processTitle: {
    fontSize: fs(9.5),
    fontWeight: '700',
    marginTop: rs(6),
    marginBottom: rs(1),
  },
  processSub: {
    fontSize: fs(9.5),
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: fs(10),
    paddingHorizontal: rs(4),
  },
  processDivider: {
    width: rs(16),
    height: 1,
    borderWidth: 0.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    marginBottom: rs(12),
  },
  watchVideosHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rs(2),
  },
  videoQuickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: rs(12),
    borderRadius: rs(12),
    borderWidth: 0.5,
    marginTop: rs(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  videoBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  videoRedPlayIcon: {
    width: rs(30),
    height: rs(30),
    borderRadius: rs(15),
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBannerTitle: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  videoBannerSub: {
    fontSize: fs(10),
    fontWeight: '500',
    marginTop: rs(1),
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(24),
  },
  bottomCol: {
    flex: 1,
  },
  sectionHeaderCompact: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(8),
  },
  sectionTitleCompact: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  viewAllTextCompact: {
    fontSize: fs(10),
    color: '#005b7f',
    fontWeight: '700',
  },
  recentClaimCard: {
    borderRadius: rs(14),
    padding: rs(10),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.05)',
    minHeight: rs(115),
    justifyContent: 'space-between',
  },
  claimHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  claimTag: {
    backgroundColor: '#e5f6fd',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(4),
    borderWidth: 0.5,
    borderColor: 'rgba(37,99,235,0.2)',
  },
  claimTagText: {
    fontSize: fs(9.5),
    fontWeight: '700',
    color: '#005b7f',
  },
  claimHospital: {
    fontSize: fs(11),
    fontWeight: '700',
    marginTop: rs(6),
  },
  claimSubject: {
    fontSize: fs(9),
    fontWeight: '500',
    marginTop: rs(2),
  },
  claimDate: {
    fontSize: fs(8),
    fontWeight: '500',
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: rs(8),
  },
  claimId: {
    fontSize: fs(8),
    fontWeight: '700',
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(10),
  },
  approvedText: {
    fontSize: fs(9.5),
    fontWeight: '700',
    color: '#16A34A',
  },
  fullWidthTipCard: {
    borderRadius: rs(16),
    padding: rs(14),
    marginTop: rs(16),
  },
  tipContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fullWidthTipTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: rs(6),
  },
  fullWidthTipSub: {
    fontSize: fs(10),
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    lineHeight: fs(13),
    marginTop: rs(3),
  },
  tipCheckedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
    borderRadius: rs(10),
    alignSelf: 'flex-start',
  },
  tipCheckText: {
    fontSize: fs(9.5),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  recentClaimCardFull: {
    borderRadius: rs(14),
    padding: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.05)',
    marginTop: rs(10),
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
  // Group Card Styles
  groupCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(6),
  },
  groupHeaderRight: {
    alignItems: 'flex-end',
  },
  groupHeaderRightText: {
    fontSize: fs(9.5),
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  groupPolicyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(4),
  },
  groupPolicyText: {
    fontSize: fs(9),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  groupCompanyText: {
    fontSize: fs(8),
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: rs(1),
  },
  groupTableContainer: {
    marginTop: rs(6),
    width: '100%',
  },
  groupTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    paddingBottom: rs(1.5),
  },
  groupColHeader: {
    fontSize: fs(9.5),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  groupTableRow: {
    flexDirection: 'row',
    paddingVertical: rs(1.5),
  },
  groupColVal: {
    fontSize: fs(8),
    color: '#FFFFFF',
    fontWeight: '700',
  },
  groupValidCol: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingTop: rs(12),
  },
  groupValidLabel: {
    fontSize: fs(9.5),
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  groupValidValue: {
    fontSize: fs(9),
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: rs(2),
  },
});

export default HealthDashboard;
