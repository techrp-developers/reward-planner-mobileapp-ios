import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Share from 'react-native-share';
import QRCode from 'react-native-qrcode-svg';
import { rs, fs } from '../../../utils/responsive';

type Props = {
  visible: boolean;
  onClose: () => void;
  name: string;
  role?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  imageUri?: string | null;
  phone?: string | null;
  email?: string | null;
};

const escapeVCard = (value: string) => value
  .replace(/\\/g, '\\\\')
  .replace(/\r?\n/g, '\\n')
  .replace(/;/g, '\\;')
  .replace(/,/g, '\\,');

const formatPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : phone;
};

export default function VisitingCardModal({
  visible,
  onClose,
  name,
  role,
  companyName,
  companyLogo,
  imageUri,
  phone,
  email,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const captureRef = useRef<ViewShotRef>(null);
  const [exporting, setExporting] = useState(false);

  const cardWidth = Math.min(width - rs(28), rs(420));
  const availableHeight = height - insets.top - insets.bottom - rs(122);
  const cardHeight = Math.min(cardWidth * 1.88, Math.max(rs(490), availableHeight));
  const compact = cardHeight < rs(620);
  const qrSize = compact ? rs(116) : rs(146);
  const avatarSize = compact ? rs(86) : rs(108);

  const contactVCard = useMemo(() => [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCard(name)}`,
    ...(companyName ? [`ORG:${escapeVCard(companyName)}`] : []),
    ...(role ? [`TITLE:${escapeVCard(role)}`] : []),
    ...(phone ? [`TEL;TYPE=CELL:${escapeVCard(phone)}`] : []),
    ...(email ? [`EMAIL:${escapeVCard(email)}`] : []),
    'END:VCARD',
  ].join('\n'), [name, companyName, role, phone, email]);

  const shareMessage = useMemo(() => [name, role, companyName, phone, email].filter(Boolean).join('\n'),
    [name, role, companyName, phone, email]);

  const captureCard = useCallback(async () => {
    if (!captureRef.current) throw new Error('The visiting card is not ready yet.');
    // Give remote avatar/logo and the QR view a frame to finish painting.
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return captureRef.current.capture();
  }, []);

  const saveCard = useCallback(async () => {
    try {
      setExporting(true);
      if (Platform.OS === 'android' && Number(Platform.Version) <= 28) {
        const permission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Save visiting card',
            message: 'Allow Reward Planners to save your visiting card to Photos.',
            buttonPositive: 'Allow',
            buttonNegative: 'Cancel',
          },
        );
        if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission required', 'Storage access is needed to save the card.');
          return;
        }
      }
      const uri = await captureCard();
      await CameraRoll.save(uri, { type: 'photo', album: Platform.OS === 'android' ? 'Reward Planners' : undefined });
      Alert.alert('Card saved', 'Your visiting card has been saved to Photos.');
    } catch (error: any) {
      Alert.alert('Could not save card', error?.message || 'Please try again.');
    } finally {
      setExporting(false);
    }
  }, [captureCard]);

  const shareCard = useCallback(async () => {
    try {
      setExporting(true);
      const uri = await captureCard();
      await Share.open({
        title: `${name}'s visiting card`,
        subject: `${name}'s visiting card`,
        message: shareMessage,
        url: uri,
        type: 'image/jpeg',
        failOnCancel: false,
      });
    } catch (error: any) {
      Alert.alert('Could not share card', error?.message || 'Please try again.');
    } finally {
      setExporting(false);
    }
  }, [captureCard, name, shareMessage]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => !exporting && onClose()}>
      <ScrollView
        style={styles.backdrop}
        contentContainerStyle={[styles.modalContent, { minHeight: height, paddingTop: insets.top + rs(10), paddingBottom: insets.bottom + rs(12) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardContainer, { width: cardWidth }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={exporting}
            accessibilityLabel="Close visiting card"
          >
            <MaterialCommunityIcons name="close" size={rs(23)} color="#FFFFFF" />
          </TouchableOpacity>

          <ViewShot
            ref={captureRef}
            options={{ format: 'jpg', quality: 0.95, result: 'tmpfile', fileName: 'reward-planners-visiting-card' }}
            style={styles.capture}
          >
            <LinearGradient
              colors={['#151515', '#1C1C20', '#2C2B66']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.45, y: 1 }}
              style={[styles.card, compact && styles.cardCompact, { height: cardHeight, paddingVertical: compact ? rs(20) : rs(26) }]}
              collapsable={false}
            >
              <View style={styles.logoArea}>
                {companyLogo ? (
                  <Image source={{ uri: companyLogo }} style={styles.companyLogo} resizeMode="contain" />
                ) : (
                  <Text style={styles.companyLogoFallback} numberOfLines={2}>{companyName || 'Reward Planners'}</Text>
                )}
              </View>

              <View style={[styles.identity, compact && styles.compactSection]}>
                <View style={[styles.avatarRing, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                  ) : (
                    <MaterialCommunityIcons name="account" size={avatarSize * 0.65} color="#FFFFFF" />
                  )}
                </View>
                <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>{name}</Text>
                {!!role && <Text style={styles.role} numberOfLines={1}>{role}</Text>}
                {!!companyName && <Text style={styles.companyName} numberOfLines={1}>{companyName}</Text>}
              </View>

              <View style={[styles.contactArea, compact && styles.compactSection]}>
                {!!phone && (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIcon}><MaterialCommunityIcons name="phone-outline" size={rs(20)} color="#FFFFFF" /></View>
                    <Text style={styles.contactText} numberOfLines={1}>{formatPhone(phone)}</Text>
                  </View>
                )}
                {!!email && (
                  <View style={styles.contactRow}>
                    <View style={styles.contactIcon}><MaterialCommunityIcons name="email-outline" size={rs(20)} color="#FFFFFF" /></View>
                    <Text style={styles.contactText} numberOfLines={1}>{email}</Text>
                  </View>
                )}
              </View>

              <View style={[styles.qrArea, compact && styles.compactSection]}>
                <View style={styles.qrFrame}>
                  <QRCode value={contactVCard} size={qrSize} color="#111111" backgroundColor="#FFFFFF" ecl="M" />
                </View>
                <Text style={styles.scanLabel}>SCAN TO CONNECT</Text>
              </View>
            </LinearGradient>
          </ViewShot>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.downloadButton} onPress={saveCard} disabled={exporting} accessibilityLabel="Save visiting card to Photos">
              {exporting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <MaterialCommunityIcons name="download-outline" size={rs(19)} color="#FFFFFF" />}
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareCard} disabled={exporting} accessibilityLabel="Share visiting card">
              <MaterialCommunityIcons name="share-variant-outline" size={rs(19)} color="#FFFFFF" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9,9,11,0.86)' },
  modalContent: { justifyContent: 'center', alignItems: 'center' },
  cardContainer: { alignItems: 'center' },
  closeButton: { alignSelf: 'flex-end', width: rs(38), height: rs(38), borderRadius: rs(19), alignItems: 'center', justifyContent: 'center', marginBottom: rs(8), backgroundColor: '#27272A' },
  capture: { width: '100%', borderRadius: rs(26), overflow: 'hidden', backgroundColor: '#151515' },
  card: { width: '100%', borderRadius: rs(26), overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(139,143,255,0.25)' },
  cardCompact: { justifyContent: 'space-between' },
  logoArea: { minHeight: rs(48), alignItems: 'center', justifyContent: 'center' },
  companyLogo: { width: rs(168), height: rs(52) },
  companyLogoFallback: { color: '#A5A7FF', fontSize: fs(20), fontWeight: '900', textAlign: 'center' },
  identity: { alignItems: 'center', marginTop: rs(18) },
  compactSection: { marginTop: 0 },
  avatarRing: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: rs(5), borderColor: '#858CFF', backgroundColor: '#F5A623' },
  avatarImage: { width: '100%', height: '100%' },
  name: { color: '#FFFFFF', fontSize: fs(28), fontWeight: '900', textAlign: 'center', marginTop: rs(12), letterSpacing: 0.2 },
  nameCompact: { fontSize: fs(24), marginTop: rs(8) },
  role: { color: '#C4C5FF', fontSize: fs(15), fontWeight: '700', marginTop: rs(8), textAlign: 'center' },
  companyName: { color: '#C4C5FF', fontSize: fs(14), fontWeight: '700', marginTop: rs(7), textAlign: 'center' },
  contactArea: { width: '100%', gap: rs(10), paddingHorizontal: rs(16), marginTop: rs(22) },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  contactIcon: { width: rs(34), height: rs(34), borderRadius: rs(17), alignItems: 'center', justifyContent: 'center', backgroundColor: '#4D48D9' },
  contactText: { color: '#F8FAFC', fontSize: fs(13), fontWeight: '600', flex: 1 },
  qrArea: { alignItems: 'center', marginBottom: rs(40) },
  qrFrame: { padding: rs(10), borderRadius: rs(20), backgroundColor: '#FFFFFF' },
  scanLabel: { color: '#C4C5FF', fontSize: fs(9), fontWeight: '800', letterSpacing: 1.6, marginTop: rs(12) },
  actions: { width: '100%', flexDirection: 'row', gap: rs(10), marginTop: rs(12) },
  downloadButton: { flex: 1, minHeight: rs(48), borderRadius: rs(14), backgroundColor: '#27272A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(7) },
  shareButton: { flex: 1, minHeight: rs(48), borderRadius: rs(14), backgroundColor: '#4F46E5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(7) },
  actionText: { color: '#FFFFFF', fontSize: fs(13), fontWeight: '800' },
});
