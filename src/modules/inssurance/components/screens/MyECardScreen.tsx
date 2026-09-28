import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Svg, Path } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import RNShare from 'react-native-share';
import { generatePDF } from 'react-native-html-to-pdf';
import { useAppTheme } from '../../../../theme/ThemeContext';
import { rs, fs } from '../../../../utils/responsive';
import { fetchGmcDetails, fetchClaimHistory, INSURANCE_BASE_URL } from '../../services/inssuranceApi';

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

  return (
    <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {lines}
    </Svg>
  );
};

const MyECardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useAppTheme();

  const [gmcDetails, setGmcDetails] = useState<any | null>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGmcAndClaims = async () => {
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
        console.error('Error fetching GMC details / claims in ECard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGmcAndClaims();
  }, []);

  const members: any[] = [];
  if (gmcDetails) {
    if (isValidMemberName(gmcDetails.name)) {
      members.push({ name: gmcDetails.name, relation: 'Self', clientId: gmcDetails.client_id || '—', dob: gmcDetails.dob || '—', avatar: gmcDetails.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#007ca5' });
    }
    if (isValidMemberName(gmcDetails.member_1_name)) {
      members.push({ name: gmcDetails.member_1_name, relation: gmcDetails.member_1_relation || 'Dependent', clientId: gmcDetails.member_1_client_id || '—', dob: gmcDetails.member_1_dob || '—', avatar: gmcDetails.member_1_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#EC4899' });
    }
    if (isValidMemberName(gmcDetails.member_2_name)) {
      members.push({ name: gmcDetails.member_2_name, relation: gmcDetails.member_2_relation || 'Dependent', clientId: gmcDetails.member_2_client_id || '—', dob: gmcDetails.member_2_dob || '—', avatar: gmcDetails.member_2_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#10B981' });
    }
    if (isValidMemberName(gmcDetails.member_3_name)) {
      members.push({ name: gmcDetails.member_3_name, relation: gmcDetails.member_3_relation || 'Dependent', clientId: gmcDetails.member_3_client_id || '—', dob: gmcDetails.member_3_dob || '—', avatar: gmcDetails.member_3_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#F59E0B' });
    }
    if (isValidMemberName(gmcDetails.member_4_name)) {
      members.push({ name: gmcDetails.member_4_name, relation: gmcDetails.member_4_relation || 'Dependent', clientId: gmcDetails.member_4_client_id || '—', dob: gmcDetails.member_4_dob || '—', avatar: gmcDetails.member_4_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#8B5CF6' });
    }
    if (isValidMemberName(gmcDetails.member_5_name)) {
      members.push({ name: gmcDetails.member_5_name, relation: gmcDetails.member_5_relation || 'Dependent', clientId: gmcDetails.member_5_client_id || '—', dob: gmcDetails.member_5_dob || '—', avatar: gmcDetails.member_5_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), color: '#3B82F6' });
    }
  }

  const isGroupCard = gmcDetails?.policy_type === 'Group Health Card';

  const handleShareCard = async () => {
    try {
      if (!gmcDetails) return;

      const isValid = (name: any) => {
        if (!name) return false;
        const n = name.trim().toLowerCase();
        return n !== '' && n !== 'n/a' && n !== '—' && n !== 'null' && n !== 'undefined';
      };

      const membersList: any[] = [];
      if (isValid(gmcDetails.name)) {
        membersList.push({ name: gmcDetails.name, clientId: gmcDetails.client_id || '—', dob: gmcDetails.dob || '—' });
      }
      if (isValid(gmcDetails.member_1_name)) {
        membersList.push({ name: gmcDetails.member_1_name, clientId: gmcDetails.member_1_client_id || '—', dob: gmcDetails.member_1_dob || '—' });
      }
      if (isValid(gmcDetails.member_2_name)) {
        membersList.push({ name: gmcDetails.member_2_name, clientId: gmcDetails.member_2_client_id || '—', dob: gmcDetails.member_2_dob || '—' });
      }
      if (isValid(gmcDetails.member_3_name)) {
        membersList.push({ name: gmcDetails.member_3_name, clientId: gmcDetails.member_3_client_id || '—', dob: gmcDetails.member_3_dob || '—' });
      }
      if (isValid(gmcDetails.member_4_name)) {
        membersList.push({ name: gmcDetails.member_4_name, clientId: gmcDetails.member_4_client_id || '—', dob: gmcDetails.member_4_dob || '—' });
      }
      if (isValid(gmcDetails.member_5_name)) {
        membersList.push({ name: gmcDetails.member_5_name, clientId: gmcDetails.member_5_client_id || '—', dob: gmcDetails.member_5_dob || '—' });
      }

      const membersHtml = membersList.map(m => `
        <tr>
          <td style="width: 50%; font-size: 10px; padding: 4px 0; color: #ffffff;">${m.name.toUpperCase()}</td>
          <td style="width: 27%; font-size: 10px; padding: 4px 0; color: #ffffff;">${m.clientId}</td>
          <td style="width: 23%; font-size: 10px; padding: 4px 0; color: #ffffff;">${m.dob}</td>
        </tr>
      `).join('');

      const isGroup = gmcDetails.policy_type === 'Group Health Card';

      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-color: #ffffff;
            color: #334155;
          }
          .page-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 25px;
            color: #0f172a;
            letter-spacing: 0.5px;
          }
          .cards-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
            align-items: center;
          }
          .ecard {
            width: 500px;
            min-height: 280px;
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%);
            border-radius: 14px;
            padding: 14px 18px;
            box-sizing: border-box;
            color: #ffffff;
            position: relative;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 0.8px solid rgba(255, 255, 255, 0.25);
            padding-bottom: 6px;
            margin-bottom: 6px;
          }
          .care-logo-container {
            display: flex;
            align-items: center;
          }
          .care-logo-box {
            background-color: #fbbf24;
            padding: 2px 7px;
            border-radius: 4px;
            margin-right: 5px;
          }
          .care-logo-text {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
          }
          .care-logo-sub-box {
            display: flex;
            flex-direction: column;
            line-height: 1;
          }
          .care-logo-sub-text {
            font-size: 9.5px;
            font-weight: 800;
            color: #fbbf24;
          }
          .care-logo-sub-text-min {
            font-size: 7.5px;
            font-weight: 800;
            color: #ffffff;
          }
          .header-right {
            text-align: right;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            line-height: 1.3;
          }
          .policy-info {
            margin-top: 6px;
          }
          .policy-type {
            font-size: 11px;
            font-weight: 800;
          }
          .company-name {
            font-size: 9.5px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.75);
            margin-top: 1px;
          }
          .members-table {
            width: 100%;
            margin-top: 8px;
            border-collapse: collapse;
          }
          .members-table th {
            border-bottom: 0.5px solid rgba(255, 255, 255, 0.2);
            padding-bottom: 3px;
            font-size: 8px;
            color: rgba(255, 255, 255, 0.55);
            font-weight: 800;
            text-transform: uppercase;
            text-align: left;
          }
          .back-header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 8px;
            font-size: 12px;
            font-weight: bold;
          }
          .back-middle-box {
            border: 0.8px solid rgba(255, 255, 255, 0.35);
            border-radius: 8px;
            overflow: hidden;
            margin-top: 8px;
          }
          .back-middle-cols {
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 8px 0;
          }
          .back-col {
            text-align: center;
            flex: 1;
          }
          .back-col-label {
            font-size: 8px;
            color: rgba(255, 255, 255, 0.8);
            margin-top: 2px;
          }
          .back-col-val {
            font-size: 9px;
            font-weight: bold;
            margin-top: 1px;
          }
          .back-divider {
            width: 0.8px;
            height: 30px;
            background-color: rgba(255, 255, 255, 0.25);
          }
          .self-help-label {
            font-size: 9px;
            font-weight: 900;
            color: #fbbf24;
          }
          .back-bottom-bar {
            background-color: #ffffff;
            padding: 5px 0;
            text-align: center;
            color: #005b7f;
            font-size: 9px;
            font-weight: 800;
          }
          .back-footer {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 7.5px;
            line-height: 1.25;
          }
          .disclaimer-title {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 8px;
          }
          .irda-box {
            text-align: right;
            align-self: flex-end;
            font-weight: bold;
          }
          .personal-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            margin-top: 15px;
            gap: 10px;
          }
          .personal-label {
            font-size: 8px;
            color: rgba(255, 255, 255, 0.6);
            font-weight: bold;
            text-transform: uppercase;
          }
          .personal-value {
            font-size: 11px;
            font-weight: 800;
            margin-top: 2px;
          }
          .personal-family-bar {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 6px 10px;
            margin-top: 20px;
            font-size: 9px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <div class="page-title">Health Insurance E-Card</div>
        <div class="cards-container">
          <!-- FRONT CARD -->
          <div class="ecard">
            <div class="card-header">
              <div class="care-logo-container">
                <div class="care-logo-box">
                  <span class="care-logo-text">care</span>
                </div>
                <div class="care-logo-sub-box">
                  <span class="care-logo-sub-text">HEALTH</span>
                  <span class="care-logo-sub-text-min">INSURANCE</span>
                </div>
              </div>
              <div class="header-right">
                <div>Policy Number : ${gmcDetails.policy_number || '—'}</div>
                <div>Member Id : ${gmcDetails.member_id || '—'}</div>
                <div>Valid Upto : ${gmcDetails.valid_till || '—'}</div>
              </div>
            </div>
            
            ${isGroup ? `
              <!-- GROUP CARD CONTENT -->
              <div class="policy-info">
                <div class="policy-type">Policy Type : ${gmcDetails.policy_type || 'Group Health Card'}</div>
                <div class="company-name">${gmcDetails.policy_company_name || gmcDetails.company_name || '—'}</div>
              </div>
              <table class="members-table">
                <thead>
                  <tr>
                    <th style="width: 50%;">Name</th>
                    <th style="width: 27%;">Client Id</th>
                    <th style="width: 23%;">Dob</th>
                  </tr>
                </thead>
                <tbody>
                  ${membersHtml}
                </tbody>
              </table>
            ` : `
              <!-- PERSONAL CARD CONTENT -->
              <div class="policy-info">
                <div class="policy-type">Policy Type : ${gmcDetails.policy_type || 'Personal Health Card'}</div>
                <div class="company-name">${gmcDetails.policy_company_name || 'Care Health Insurance'}</div>
              </div>
              <div class="personal-info-grid">
                <div>
                  <div class="personal-label">Member Name</div>
                  <div class="personal-value">${gmcDetails.name || '—'}</div>
                </div>
                <div>
                  <div class="personal-label">Employee ID</div>
                  <div class="personal-value">${gmcDetails.employee_id || '—'}</div>
                </div>
                <div>
                  <div class="personal-label">DOB</div>
                  <div class="personal-value">${gmcDetails.dob || '—'}</div>
                </div>
              </div>
              <div class="personal-family-bar">
                Covered Family Members : ${membersList.length} Members
              </div>
            `}
          </div>

          ${isGroup ? `
            <!-- BACK CARD (Only for Group policies) -->
            <div class="ecard">
              <div class="back-header">
                <span>🌐 www.careinsurance.com</span>
              </div>
              <div class="back-middle-box">
                <div class="back-middle-cols">
                  <div class="back-col">
                    <div class="back-col-label">Care Health</div>
                    <div class="back-col-val">Customer APP</div>
                  </div>
                  <div class="back-divider"></div>
                  <div class="back-col">
                    <div class="back-col-label">WhatsApp</div>
                    <div class="back-col-val">8860402452</div>
                  </div>
                  <div class="back-divider"></div>
                  <div class="back-col">
                    <div class="self-help-label">⚡ SELF HELP</div>
                  </div>
                </div>
                <div class="back-bottom-bar">
                  Submit Your Queries/Request: www.careinsurance.com/contact-us.html
                </div>
              </div>
              <div class="back-footer">
                <div style="width: 75%;">
                  <div class="disclaimer-title">Disclaimer</div>
                  <div>1. This Card is not transferable.</div>
                  <div>2. Use of this Card is governed by the Policy Terms and Conditions.</div>
                  <div>3. To avail cashless facility, this Card needs to be produced along with photo ID proof.</div>
                  <div>4. Valid upto Policy Period End Date or cancellation date, whichever is earlier.</div>
                </div>
                <div class="irda-box" style="width: 25%;">
                  IRDA Registration No. 148
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
      `;

      const options = {
        html: htmlContent,
        fileName: `care_ecard_${gmcDetails.policy_number}`,
      };

      const file = await generatePDF(options);
      const filePath = file && (file.filePath || (file as any).path || file);

      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Could not resolve temporary local path for E-Card PDF.');
      }

      const cleanPath = filePath.startsWith('file://') ? filePath : 'file://' + filePath;

      setTimeout(async () => {
        try {
          await RNShare.open({
            url: cleanPath,
            type: 'application/pdf',
            title: 'Care Health E-Card',
            subject: 'Care Health E-Card',
            failOnCancel: false,
          });
        } catch (shareError: any) {
          if (shareError && shareError.message && shareError.message.indexOf('User did not share') !== -1) {
            return;
          }
          // Fallback to text sharing if native file sharing fails
          try {
            const shareMessage = `Care Health Insurance Card Details:\n\n` +
              `Policy Number: ${gmcDetails.policy_number}\n` +
              `Member ID: ${gmcDetails.member_id}\n` +
              `Policy Type: ${gmcDetails.policy_type}\n` +
              `Corporate Employer: ${gmcDetails.company_name || 'MPS Global'}\n` +
              `Valid Till: ${gmcDetails.valid_till}`;
            await Share.share({
              message: shareMessage,
            });
          } catch (textShareError: any) {
            Alert.alert('Share Failed', textShareError.message || 'Unable to share E-Card details.');
          }
        }
      }, 150);
    } catch (error: any) {
      Alert.alert('Share Failed', error.message || 'Unable to generate E-Card PDF.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      if (!gmcDetails) return;
      const downloadUrl = `${INSURANCE_BASE_URL}/v1/gmc/download-pdf?userId=${gmcDetails.user_id || 37}`;
      await Linking.openURL(downloadUrl);
    } catch (err: any) {
      Alert.alert('Download Failed', 'Could not open the download link: ' + err.message);
    }
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
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>My E-Card</Text>
        </View>

        <TouchableOpacity style={styles.helpBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="help-circle-outline" size={14} color="#005b7f" style={{ marginRight: 3 }} />
          <Text style={styles.helpText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        
        {/* Visual E-Card display */}
        {loading ? (
          <View style={[styles.eCard, { justifyContent: 'center', alignItems: 'center', minHeight: rs(200) }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : gmcDetails ? (
          <View style={{ gap: rs(16) }}>
            {/* FRONT CARD */}
            {isGroupCard ? (
              <LinearGradient
                colors={['#0284c7', '#0369a1', '#075985']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.eCard, { paddingVertical: rs(10), paddingHorizontal: rs(12) }]}
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
                    
                    {members.map((m: any, idx) => (
                      <View key={idx} style={styles.groupTableRow}>
                        <Text style={[styles.groupColVal, { width: '50%' }]} numberOfLines={1}>{m.name.toUpperCase()}</Text>
                        <Text style={[styles.groupColVal, { width: '27%' }]} numberOfLines={1}>{m.clientId || '—'}</Text>
                        <Text style={[styles.groupColVal, { width: '23%' }]} numberOfLines={1}>{m.dob || '—'}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={isDark ? ['#007ca5', '#005b7f', '#002534'] : ['#4ec3e4', '#007ca5', '#005b7f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.eCard}
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

                <View style={styles.cardInfoGrid}>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardLabel}>Policy Type</Text>
                    <Text style={styles.cardValue} numberOfLines={1}>{gmcDetails.policy_type || 'Personal Health Card'}</Text>
                  </View>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardLabel}>Policy Number</Text>
                    <Text style={styles.cardValue}>{gmcDetails.policy_number || '—'}</Text>
                  </View>
                </View>

                <View style={[styles.cardInfoGrid, { marginTop: rs(10) }]}>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardLabel}>Member ID</Text>
                    <Text style={styles.cardValue}>{gmcDetails.member_id || '—'}</Text>
                  </View>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardLabel}>Valid Till</Text>
                    <View style={styles.dateRow}>
                      <MaterialCommunityIcons name="calendar" size={11} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
                      <Text style={styles.cardValue}>{gmcDetails.valid_till || '—'}</Text>
                    </View>
                  </View>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardLabel}>Employee ID</Text>
                    <Text style={styles.cardValue}>{gmcDetails.employee_id || '—'}</Text>
                  </View>
                </View>

                <View style={styles.cardFamilyBar}>
                  <MaterialCommunityIcons name="account-group" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.cardFamilyText}>Covered Family Members : {members.length} Members</Text>
                </View>
              </LinearGradient>
            )}

            {/* BACK CARD */}
            {isGroupCard && (
              <LinearGradient
                colors={['#0284c7', '#0369a1', '#075985']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.eCard, { paddingVertical: rs(10), paddingHorizontal: rs(12) }]}
              >
                <CardPattern />
                
                {/* Back Card Top Section */}
                <View style={styles.backCardHeader}>
                  <MaterialCommunityIcons name="web" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.backCardUrl}>www.careinsurance.com</Text>
                </View>

                {/* Back Card Bordered Middle Box */}
                <View style={styles.backMiddleBox}>
                  <View style={styles.backMiddleColsRow}>
                    {/* Col 1 */}
                    <View style={styles.backMiddleCol}>
                      <MaterialCommunityIcons name="cellphone" size={18} color="#FFFFFF" />
                      <Text style={styles.backMiddleColLabel}>Care Health</Text>
                      <Text style={styles.backMiddleColVal}>Customer APP</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.backMiddleDivider} />

                    {/* Col 2 */}
                    <View style={styles.backMiddleCol}>
                      <MaterialCommunityIcons name="whatsapp" size={18} color="#25D366" />
                      <Text style={styles.backMiddleColLabel}>WhatsApp</Text>
                      <Text style={styles.backMiddleColVal}>8860402452</Text>
                    </View>

                    {/* Divider */}
                    <View style={styles.backMiddleDivider} />

                    {/* Col 3 */}
                    <View style={styles.backMiddleCol}>
                      <MaterialCommunityIcons name="flash" size={18} color="#EAB308" />
                      <Text style={styles.backSelfHelpLabel}>SELF HELP</Text>
                    </View>
                  </View>

                  {/* Bottom queries line */}
                  <View style={styles.backMiddleBottomBar}>
                    <Text style={styles.backMiddleBottomText} numberOfLines={1}>
                      Submit Your Queries/Request: www.careinsurance.com/contact-us.html
                    </Text>
                  </View>
                </View>

                {/* Back Card Footer Disclaimer and IRDA */}
                <View style={styles.backFooterRow}>
                  <View style={{ flex: 1.8 }}>
                    <Text style={styles.backDisclaimerHeader}>Disclaimer</Text>
                    <Text style={styles.backDisclaimerText}>1. This Card is not transferable.</Text>
                    <Text style={styles.backDisclaimerText}>2. Use of this Card is governed by the Policy Terms and Conditions.</Text>
                    <Text style={styles.backDisclaimerText}>3. To avail cashless facility, this Card needs to be produced along with photo ID proof.</Text>
                    <Text style={styles.backDisclaimerText}>4. Valid upto Policy Period End Date or cancellation date, whichever is earlier.</Text>
                  </View>

                  <View style={styles.backIrdaCol}>
                    <Text style={styles.backIrdaText}>IRDA Registration No. 148</Text>
                  </View>
                </View>
              </LinearGradient>
            )}
          </View>
        ) : (
          <View style={[styles.eCard, { justifyContent: 'center', alignItems: 'center', minHeight: rs(140), backgroundColor: '#E2E8F0' }]}>
            <Text style={{ color: '#64748B' }}>No active health card available</Text>
          </View>
        )}

        {/* Action buttons row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.7}
            onPress={handleDownloadPdf}
          >
            <MaterialCommunityIcons name="download" size={16} color="#005b7f" />
            <Text style={[styles.actionBtnText, { color: isDark ? '#E4E4E7' : '#334155' }]}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]} 
            activeOpacity={0.7}
            onPress={handleShareCard}
          >
            <MaterialCommunityIcons name="share-variant" size={15} color="#005b7f" />
            <Text style={[styles.actionBtnText, { color: isDark ? '#E4E4E7' : '#334155' }]}>Share Card</Text>
          </TouchableOpacity>
        </View>

        {/* Covered Members List */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Covered Members</Text>
          </View>
 
          <View style={[styles.listContainer, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            {members.map((member, idx) => (
              <View 
                key={idx} 
                style={[
                  styles.listItemRow, 
                  idx > 0 && { borderTopWidth: 0.5, borderTopColor: isDark ? '#27272A' : '#E2E8F0' }
                ]}
              >
                <View style={[styles.listItemLeft, { flex: 1 }]}>
                  <View style={[styles.avatarBox, { backgroundColor: member.color + '15' }]}>
                    <Text style={[styles.avatarText, { color: member.color }]}>{member.avatar}</Text>
                  </View>
                  <View style={{ marginLeft: rs(10), flex: 1 }}>
                    <Text style={[styles.memberNameText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>{member.name}</Text>
                    <Text style={[styles.memberRelationText, { color: isDark ? '#A1A1AA' : '#64748B' }]} numberOfLines={2}>
                      {member.relation} • Client ID: {member.clientId} • DOB: {member.dob}
                    </Text>
                  </View>
                </View>
                <View style={styles.listItemRight}>
                  <MaterialCommunityIcons name="account-outline" size={16} color="#005b7f" />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Claim Status list */}
        <View style={[styles.sectionBlock, { marginTop: rs(16) }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Recent Claim Status</Text>
            {claims.length > 0 && (
              <TouchableOpacity activeOpacity={0.6}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.listContainer, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
            {claims.length === 0 ? (
              <View style={{ padding: rs(20), alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: isDark ? '#A1A1AA' : '#64748B', fontSize: fs(11) }}>No recent claims found</Text>
              </View>
            ) : (
              claims.map((claim, index) => {
                const isApproved = claim.status?.toLowerCase() === 'approved';
                const isRejected = claim.status?.toLowerCase() === 'rejected';
                const isReimbursement = claim.claim_type?.toLowerCase()?.includes('reimbursement');
                
                // Set color & status styles
                let statusBgColor = '#FEF3C7'; // Pending/Under Review
                let statusTextColor = '#D97706';
                if (isApproved) {
                  statusBgColor = '#ECFDF5';
                  statusTextColor = '#047857';
                } else if (isRejected) {
                  statusBgColor = '#FEE2E2';
                  statusTextColor = '#DC2626';
                }

                return (
                  <View 
                    key={claim.id || index} 
                    style={[
                      styles.listItemRow,
                      index > 0 && { borderTopWidth: 0.5, borderTopColor: isDark ? '#27272A' : '#E2E8F0' }
                    ]}
                  >
                    <View style={styles.listItemLeft}>
                      <View style={[
                        styles.cardIconCircle, 
                        { backgroundColor: isReimbursement ? '#F3E8FF' : '#ECFDF5' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={isReimbursement ? 'wallet-outline' : 'plus'} 
                          size={20} 
                          color={isReimbursement ? '#7C3AED' : '#10B981'} 
                        />
                      </View>
                      <View style={{ marginLeft: rs(10) }}>
                        <Text style={[styles.claimIdLabel, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                          {claim.claim_type || 'Claim'}
                        </Text>
                        <Text style={[styles.claimIdSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>
                          {isReimbursement ? `Amount Settled: ₹${claim.actual_cost || claim.estimated_cost || 0}` : `Claim ID: CLM${claim.id}`}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.listItemRight}>
                      <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                        <Text style={[styles.statusText, { color: statusTextColor }]}>
                          {claim.status || 'Under Review'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={isDark ? '#71717A' : '#94A3B8'} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Need Help link buttons */}
        <View style={[styles.needHelpBox, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
          <Text style={[styles.helpSectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Need Help?</Text>
          <View style={styles.helpButtonsGrid}>
            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <View style={[styles.helpIconCircle, { backgroundColor: '#e5f6fd' }]}>
                <MaterialCommunityIcons name="help-circle-outline" size={20} color="#005b7f" />
              </View>
              <Text style={[styles.helpBtnTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>FAQ</Text>
              <Text style={[styles.helpBtnSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>View answers</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <View style={[styles.helpIconCircle, { backgroundColor: '#d0f0fd' }]}>
                <MaterialCommunityIcons name="phone-outline" size={20} color="#007ca5" />
              </View>
              <Text style={[styles.helpBtnTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>Call Support</Text>
              <Text style={[styles.helpBtnSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>Talk to our team</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton} activeOpacity={0.7}>
              <View style={[styles.helpIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#10B981" />
              </View>
              <Text style={[styles.helpBtnTitle, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>WhatsApp</Text>
              <Text style={[styles.helpBtnSub, { color: isDark ? '#71717A' : '#94A3B8' }]}>Chat with us</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Benefits horizontal row */}
        <View style={[styles.sectionBlock, { marginTop: rs(16), marginBottom: rs(10) }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Benefits at a glance</Text>
          <View style={styles.benefitsContainer}>
            <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="shield-outline" size={22} color="#005b7f" style={styles.benefitIcon} />
              <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Sum Insured</Text>
              <Text style={[styles.benefitVal, { color: '#005b7f' }]}>₹10,00,000</Text>
            </View>
            <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="hospital-building" size={22} color="#10B981" style={styles.benefitIcon} />
              <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Network Hospitals</Text>
              <Text style={[styles.benefitVal, { color: '#10B981' }]}>6200+</Text>
            </View>
            <View style={[styles.benefitCard, { backgroundColor: isDark ? '#1E1E24' : '#FFFFFF' }]}>
              <MaterialCommunityIcons name="account-group-outline" size={22} color="#7C3AED" style={styles.benefitIcon} />
              <Text style={[styles.benefitLabel, { color: isDark ? '#A1A1AA' : '#64748B' }]}>Family Members</Text>
              <Text style={[styles.benefitVal, { color: '#7C3AED' }]}>4 Members</Text>
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
  eCard: {
    borderRadius: rs(18),
    padding: rs(14),
    marginTop: rs(12),
    width: '100%',
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
  cardFamilyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: rs(6),
    paddingHorizontal: rs(10),
    borderRadius: rs(10),
    marginTop: rs(12),
  },
  cardFamilyText: {
    fontSize: fs(9.5),
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(16),
    gap: rs(8),
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: rs(10),
    borderRadius: rs(10),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    gap: rs(4),
  },
  actionBtnText: {
    fontSize: fs(10),
    fontWeight: '700',
  },
  sectionBlock: {
    marginTop: rs(20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rs(10),
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
  },
  viewAllText: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#005b7f',
  },
  listContainer: {
    borderRadius: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    overflow: 'hidden',
  },
  listItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: rs(14),
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: rs(38),
    height: rs(38),
    borderRadius: rs(19),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fs(12),
    fontWeight: '700',
  },
  memberNameText: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  memberRelationText: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(1),
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconCircle: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimIdLabel: {
    fontSize: fs(13),
    fontWeight: '700',
  },
  claimIdSub: {
    fontSize: fs(11),
    fontWeight: '600',
    marginTop: rs(1),
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
  needHelpBox: {
    marginTop: rs(20),
    borderRadius: rs(16),
    padding: rs(14),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  helpSectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    marginBottom: rs(10),
  },
  helpButtonsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: rs(8),
  },
  helpButton: {
    flex: 1,
    alignItems: 'center',
  },
  helpIconCircle: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
  },
  helpBtnTitle: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  helpBtnSub: {
    fontSize: fs(9),
    fontWeight: '500',
    marginTop: rs(1),
  },
  benefitsContainer: {
    flexDirection: 'row',
    gap: rs(8),
    marginTop: rs(10),
  },
  benefitCard: {
    flex: 1,
    borderRadius: rs(10),
    padding: rs(12),
    borderWidth: 0.5,
    borderColor: 'rgba(15,23,42,0.06)',
  },
  benefitIcon: {
    marginBottom: rs(6),
  },
  benefitLabel: {
    fontSize: fs(9.5),
    fontWeight: '600',
  },
  benefitVal: {
    fontSize: fs(12),
    fontWeight: '700',
    marginTop: rs(2),
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
  // Back Card Specific Styles
  backCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(6),
  },
  backCardUrl: {
    fontSize: fs(11),
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  backMiddleBox: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: rs(8),
    overflow: 'hidden',
    marginTop: rs(4),
  },
  backMiddleColsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: rs(6),
  },
  backMiddleCol: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  backMiddleColLabel: {
    fontSize: fs(7),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
    marginTop: rs(2),
  },
  backMiddleColVal: {
    fontSize: fs(9.5),
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: rs(1),
  },
  backMiddleDivider: {
    width: 0.8,
    height: rs(24),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  backSelfHelpLabel: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#EAB308',
    marginTop: rs(2),
  },
  backMiddleBottomBar: {
    backgroundColor: '#FFFFFF',
    paddingVertical: rs(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backMiddleBottomText: {
    fontSize: fs(9.5),
    fontWeight: '700',
    color: '#005b7f',
  },
  backFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: rs(6),
  },
  backDisclaimerHeader: {
    fontSize: fs(8),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: rs(1),
  },
  backDisclaimerText: {
    fontSize: fs(5.8),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
    lineHeight: fs(7),
  },
  backIrdaCol: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backIrdaText: {
    fontSize: fs(6.8),
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MyECardScreen;
