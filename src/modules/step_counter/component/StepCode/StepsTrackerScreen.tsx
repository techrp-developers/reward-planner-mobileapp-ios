import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import SendIntentAndroid from 'react-native-send-intent';
import { SdkAvailabilityStatus } from 'react-native-health-connect';

import { useStepTracker } from './useStepTracker';
import { BORDER_RADIUS, RESPONSIVE, SPACING } from '../../utils/theme';
import { useAlert } from '../../../../modules/ecommerce/components/alerts';

// ─── Violet Dusk palette ──────────────────────────────────────────────────────

const VD = {
  accent:      '#8EA2FF',
  accentDark:  '#B9C4FF',
  accentFaint: 'rgba(142,162,255,0.12)',
  accentDim:   'rgba(142,162,255,0.26)',
  cardBg:      'rgba(255,255,255,0.075)',
  cardBorder:  'rgba(174,188,255,0.16)',
  white:       '#FFFFFF',
  whiteMid:    '#CDD2EA',
  whiteLow:    '#979EBC',
  whiteGhost:  'rgba(255,255,255,0.10)',
  success:     '#9AAEFF',
  warning:     '#F8B84E',
  error:       '#F38C9A',
};

const BG = ['#070A16', '#111735', '#201A3F'];

// ─── Brand colours (on-dark) ──────────────────────────────────────────────────

const BRAND = {
  hc:      { icon: 'heart-pulse', bg: 'rgba(230,57,70,0.18)',  tint: '#FF6B7A' },
  samsung: { icon: 'cellphone',   bg: 'rgba(20,40,160,0.22)', tint: '#7B9FFF' },
  google:  { icon: 'google-fit',  bg: 'rgba(52,168,83,0.18)', tint: '#62D985' },
};

type OptionalProvider = 'Samsung Health' | 'Google Fit';

// ─── Permission guide (animated accordion) ────────────────────────────────────

type GuideStep = { icon: string; title: string; desc: string };

const STEPS: GuideStep[] = [
  { icon: 'numeric-1-circle-outline', title: 'Open Health Connect',  desc: 'Tap the Health Connect row above to open or install it.' },
  { icon: 'numeric-2-circle-outline', title: 'App Permissions',      desc: 'Inside Health Connect, tap "App permissions" from the home screen.' },
  { icon: 'numeric-3-circle-outline', title: 'Find this app',        desc: 'Scroll to Rewards Planners and tap it.' },
  { icon: 'numeric-4-circle-outline', title: 'Enable Steps',         desc: 'Turn on "Steps" under the Read permissions toggle.' },
  { icon: 'numeric-5-circle-outline', title: 'Come back here',       desc: 'Return to this screen — the status refreshes automatically.' },
];

// Alternate path for users who already have Health Connect / Google Fit installed
// and granted permission once, but the app's own system permission was revoked or
// never enabled — fixable via the OS app-info screen instead of Health Connect.
const STEPS_ALREADY_INSTALLED: GuideStep[] = [
  { icon: 'numeric-1-circle-outline', title: 'Open phone Settings',  desc: 'Go to your phone\'s Settings app.' },
  { icon: 'numeric-2-circle-outline', title: 'Go to Apps',           desc: 'Tap "Apps" (or "Apps & notifications").' },
  { icon: 'numeric-3-circle-outline', title: 'Find Reward Planners', desc: 'Search for and tap "Reward Planners" in the app list.' },
  { icon: 'numeric-4-circle-outline', title: 'Open Permissions',     desc: 'Tap "Permissions" on the app info screen.' },
  { icon: 'numeric-5-circle-outline', title: 'Allow the toggles',    desc: 'Turn on "Physical activity" and "Health Connect", then come back here.' },
];

const PermissionGuide = ({
  visible, steps, headerText,
}: { visible: boolean; steps: GuideStep[]; headerText: string }) => {
  const hRef  = useRef(new Animated.Value(0));
  const opRef = useRef(new Animated.Value(0));
  const h  = hRef.current;
  const op = opRef.current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(h,  { toValue: visible ? 1 : 0, duration: 300, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(op, { toValue: visible ? 1 : 0, duration: 250, useNativeDriver: false }),
    ]).start();
  }, [visible, h, op]);

  return (
    <Animated.View style={[ss.accordion, { opacity: op, maxHeight: h.interpolate({ inputRange: [0, 1], outputRange: [0, 440] }) }]}>
      <View style={ss.guide}>
        <View style={ss.guideHeader}>
          <MaterialCommunityIcons name="shield-key-outline" size={14} color={VD.warning} />
          <Text style={ss.guideHeaderText}>{headerText}</Text>
        </View>
        {steps.map((s, i) => (
          <View key={i} style={ss.guideStep}>
            <View style={ss.guideStepLeft}>
              <MaterialCommunityIcons name={s.icon} size={22} color={VD.accentDark} />
              {i < steps.length - 1 && <View style={ss.guideLine} />}
            </View>
            <View style={ss.guideStepRight}>
              <Text style={ss.guideStepTitle}>{s.title}</Text>
              <Text style={ss.guideStepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

// ─── Provider card ────────────────────────────────────────────────────────────

type ProviderCardProps = {
  title:     string;
  subtitle:  string;
  iconName:  string;
  iconBg:    string;
  iconTint:  string;
  installed: boolean;
  connected: boolean;
  mandatory: boolean;
  selected:  boolean;
  onPress:   () => void;
};

const ProviderCard = ({
  title, subtitle, iconName, iconBg, iconTint,
  installed, connected, mandatory, selected, onPress,
}: ProviderCardProps) => {
  const statusLabel = connected ? 'Connected' : installed ? 'Open' : 'Install';
  const statusColor = connected ? VD.success : installed ? VD.accentDark : VD.warning;

  return (
    <TouchableOpacity
      style={[ss.providerCard, selected && ss.providerCardSelected]}
      onPress={onPress}
      activeOpacity={0.78}
    >
      <View style={[ss.providerIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={iconName} size={26} color={iconTint} />
      </View>

      <View style={ss.providerText}>
        <View style={ss.providerTitleRow}>
          <Text style={ss.providerTitle}>{title}</Text>
          {mandatory && (
            <View style={ss.requiredBadge}>
              <Text style={ss.requiredText}>Required</Text>
            </View>
          )}
        </View>
        <Text style={ss.providerSubtitle}>{subtitle}</Text>
      </View>

      <View style={ss.providerAction}>
        {mandatory ? (
          <View style={[ss.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[ss.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        ) : (
          <View style={[ss.radio, selected && ss.radioSelected]}>
            {selected && <View style={ss.radioDot} />}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StepsTrackerScreen() {
  const {
    healthConnectStatus, grantedPermissions,
    healthConnectError, isSetupComplete,
    openHealthConnect, totalSteps, refreshStatus,
  } = useStepTracker();

  const navigation = useNavigation<any>();
  const alert      = useAlert();

  const [isGoogleFitInstalled,     setIsGoogleFitInstalled]     = useState(false);
  const [isSamsungHealthInstalled, setIsSamsungHealthInstalled] = useState(false);
  const [selectedOptional,         setSelectedOptional]         = useState<OptionalProvider | null>(null);
  const [guideOpen,                setGuideOpen]                = useState(false);
  const [altGuideOpen,             setAltGuideOpen]              = useState(false);

  const isHCInstalled = healthConnectStatus !== '0' && healthConnectStatus !== String(SdkAvailabilityStatus.SDK_UNAVAILABLE);
  const hasStepsPerm  = grantedPermissions.some(p => p.recordType === 'Steps' && p.accessType === 'read');
  const isHCReady     = healthConnectStatus === String(SdkAvailabilityStatus.SDK_AVAILABLE) && hasStepsPerm;
  const showGuide     = isHCInstalled && !hasStepsPerm;
  const canProceed    = isHCReady && selectedOptional !== null && totalSteps > 0;

  useEffect(() => { checkApps(); }, []);
  useEffect(() => { if (isSetupComplete && isHCReady) navigation.replace('Dashboard'); }, [isSetupComplete, isHCReady, navigation]);
  useEffect(() => { setGuideOpen(showGuide); }, [showGuide]);

  const checkApps = async () => {
    try {
      const fit     = await SendIntentAndroid.isAppInstalled('com.google.android.apps.fitness');
      const samsung = await SendIntentAndroid.isAppInstalled('com.sec.android.app.shealth');
      setIsGoogleFitInstalled(fit);
      setIsSamsungHealthInstalled(samsung);
    } catch {}
  };

  const installHC = async () => {
    try { await Linking.openURL('market://details?id=com.google.android.apps.healthdata'); }
    catch { await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata'); }
  };

  const handleHCPress = () => (isHCInstalled ? openHealthConnect() : installHC());

  const openAppSettings = () => Linking.openSettings();

  const handleOptional = async (provider: OptionalProvider) => {
    setSelectedOptional(provider);
    try {
      if (provider === 'Google Fit') {
        isGoogleFitInstalled
          ? await SendIntentAndroid.openApp('com.google.android.apps.fitness', {})
          : await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.fitness');
      } else {
        isSamsungHealthInstalled
          ? await SendIntentAndroid.openApp('com.sec.android.app.shealth', {})
          : await Linking.openURL('https://play.google.com/store/apps/details?id=com.sec.android.app.shealth');
      }
    } catch {}
  };

  const handleContinue = useCallback(() => {
    if (!isHCReady) {
      alert.warning(
        !isHCInstalled ? 'Health Connect Required' : 'Permission Missing',
        !isHCInstalled ? 'Please install Health Connect to continue.'
                       : 'Please grant Steps permission in Health Connect, then return here.',
      );
      if (isHCInstalled) setGuideOpen(true);
      return;
    }
    if (totalSteps <= 0) {
      alert.warning('No Steps Found', 'Open Google Fit or Samsung Health, allow Health Connect sync, walk a few steps, then return.');
      refreshStatus();
      return;
    }
    if (!selectedOptional) {
      alert.info('Select a Fitness App', 'Choose Samsung Health or Google Fit to continue.');
      return;
    }
    navigation.navigate('StepForm');
  }, [isHCReady, isHCInstalled, totalSteps, selectedOptional, navigation, alert, refreshStatus]);

  return (
    <SafeAreaView style={ss.safe} edges={['top', 'bottom']}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <LinearGradient colors={BG} style={ss.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <ScrollView
          contentContainerStyle={[ss.scroll, { paddingHorizontal: RESPONSIVE.horizontalPadding }]}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.78}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={VD.accentDark} />
          </TouchableOpacity>

          <View style={ss.headingGroup}>
            <Text style={ss.eyebrow}>RP Move</Text>
            <Text style={ss.title}>Connect Your Apps</Text>
            <Text style={ss.description}>
              Link your fitness apps so we can track your steps and reward you with coins.
            </Text>
          </View>

          {/* Required */}
          <Text style={ss.sectionLabel}>Required</Text>
          <ProviderCard
            title="Health Connect"
            subtitle="Google's unified health data platform"
            iconName={BRAND.hc.icon} iconBg={BRAND.hc.bg} iconTint={BRAND.hc.tint}
            installed={isHCInstalled} connected={isHCReady}
            mandatory selected={false} onPress={handleHCPress}
          />

          <TouchableOpacity style={ss.guideToggle} onPress={() => setGuideOpen(v => !v)} activeOpacity={0.7}>
            <MaterialCommunityIcons name={guideOpen ? 'chevron-up' : 'information-outline'} size={14} color={VD.warning} />
            <Text style={ss.guideToggleText}>
              {isHCReady ? 'View permission details' : 'How to grant Steps permission'}
            </Text>
          </TouchableOpacity>

          <PermissionGuide visible={guideOpen} steps={STEPS} headerText="How to grant Steps permission" />

          {(isHCInstalled || isGoogleFitInstalled) && !hasStepsPerm && (
            <>
              <TouchableOpacity style={ss.guideToggle} onPress={() => setAltGuideOpen(v => !v)} activeOpacity={0.7}>
                <MaterialCommunityIcons name={altGuideOpen ? 'chevron-up' : 'cog-outline'} size={14} color={VD.warning} />
                <Text style={ss.guideToggleText}>Already installed? Try this instead</Text>
              </TouchableOpacity>

              <PermissionGuide
                visible={altGuideOpen}
                steps={STEPS_ALREADY_INSTALLED}
                headerText="Fix permission from phone Settings"
              />

              {altGuideOpen && (
                <TouchableOpacity style={ss.settingsBtn} onPress={openAppSettings} activeOpacity={0.78}>
                  <MaterialCommunityIcons name="cog-outline" size={16} color={VD.accentDark} />
                  <Text style={ss.settingsBtnText}>Open App Settings</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Choose one */}
          <Text style={[ss.sectionLabel, ss.sectionLabelGap]}>Choose Your Fitness App</Text>
          <Text style={ss.sectionHint}>
            Select the app that syncs your step data to Health Connect.
          </Text>

          <ProviderCard
            title="Samsung Health"
            subtitle="Ideal for Samsung devices — syncs automatically"
            iconName={BRAND.samsung.icon} iconBg={BRAND.samsung.bg} iconTint={BRAND.samsung.tint}
            installed={isSamsungHealthInstalled} connected={false}
            mandatory={false} selected={selectedOptional === 'Samsung Health'}
            onPress={() => handleOptional('Samsung Health')}
          />
          <ProviderCard
            title="Google Fit"
            subtitle="Works on all Android phones — great for step tracking"
            iconName={BRAND.google.icon} iconBg={BRAND.google.bg} iconTint={BRAND.google.tint}
            installed={isGoogleFitInstalled} connected={false}
            mandatory={false} selected={selectedOptional === 'Google Fit'}
            onPress={() => handleOptional('Google Fit')}
          />

          <View style={ss.appTip}>
            <MaterialCommunityIcons name="lightbulb-outline" size={13} color={VD.accentDark} />
            <Text style={ss.appTipText}>
              After selecting, open the app → Settings → Manage connected apps → Enable Health Connect.
            </Text>
          </View>

          {!!healthConnectError && (
            <View style={ss.errorRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13} color={VD.error} />
              <Text style={ss.errorText}>{healthConnectError}</Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity activeOpacity={0.9} onPress={handleContinue} style={ss.ctaWrap}>
            <LinearGradient
              colors={canProceed ? ['#8EA2FF', '#B9C4FF'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.10)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={ss.cta}
            >
              <Text style={[ss.ctaText, !canProceed && ss.ctaTextDim]}>Continue</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={canProceed ? '#070A16' : VD.whiteLow} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={ss.bottomPad} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const ss = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#070A16' },
  gradient: { flex: 1 },
  scroll:   { alignItems: 'center', paddingTop: SPACING.xl },

  backBtn: {
    alignSelf: 'flex-start',
    width: 40, height: 40,
    borderRadius: BORDER_RADIUS.medium,
    backgroundColor: VD.whiteGhost,
    borderWidth: 1, borderColor: VD.cardBorder,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },

  headingGroup: { width: '100%', marginBottom: SPACING.xl },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase', color: VD.accentDark, marginBottom: 6 },
  title:   { fontSize: 24, fontWeight: '800', color: VD.white, letterSpacing: 0, lineHeight: 30, marginBottom: 8 },
  description: { fontSize: 14, color: VD.whiteMid, lineHeight: 21 },

  sectionLabel:    { width: '100%', fontSize: 11, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase', color: VD.whiteLow, marginBottom: SPACING.sm },
  sectionLabelGap: { marginTop: SPACING.lg },
  sectionHint:     { width: '100%', fontSize: 12, color: VD.whiteLow, lineHeight: 18, marginBottom: SPACING.sm, marginTop: -SPACING.xs },

  // Provider card
  providerCard: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: VD.cardBg, borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  providerCardSelected: { borderColor: VD.accent, backgroundColor: VD.accentFaint },
  providerIcon:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, flexShrink: 0 },
  providerText:    { flex: 1, marginRight: SPACING.sm },
  providerTitleRow:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  providerTitle:   { fontSize: 14, fontWeight: '700', color: VD.white },
  providerSubtitle:{ fontSize: 11, color: VD.whiteLow, lineHeight: 16 },
  providerAction:  { flexShrink: 0 },
  requiredBadge:   { backgroundColor: 'rgba(248,113,113,0.18)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  requiredText:    { fontSize: 10, fontWeight: '700', color: VD.error },
  statusPill:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:      { fontSize: 11, fontWeight: '700' },
  radio:           { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: VD.whiteLow, alignItems: 'center', justifyContent: 'center' },
  radioSelected:   { borderColor: VD.accentDark },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: VD.accentDark },

  // Guide toggle
  guideToggle: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: SPACING.xs, marginBottom: SPACING.xs },
  guideToggleText: { fontSize: 12, color: VD.warning, fontWeight: '600' },

  // Settings shortcut button
  settingsBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: VD.accentFaint, borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    paddingVertical: SPACING.sm, marginBottom: SPACING.md,
  },
  settingsBtnText: { fontSize: 13, fontWeight: '700', color: VD.accentDark },

  // Guide accordion
  accordion: { overflow: 'hidden', width: '100%' },
  guide: {
    backgroundColor: 'rgba(251,191,36,0.07)',
    borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.22)',
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  guideHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md },
  guideHeaderText: { fontSize: 12, fontWeight: '700', color: VD.warning, flex: 1 },
  guideStep:       { flexDirection: 'row', gap: SPACING.sm, paddingBottom: SPACING.md },
  guideStepLeft:   { alignItems: 'center', width: 22 },
  guideLine:       { flex: 1, width: 1.5, backgroundColor: VD.accentDim, marginTop: 6 },
  guideStepRight:  { flex: 1, paddingBottom: SPACING.xs },
  guideStepTitle:  { fontSize: 13, fontWeight: '700', color: VD.white, marginBottom: 2 },
  guideStepDesc:   { fontSize: 12, color: VD.whiteLow, lineHeight: 17 },

  // App tip
  appTip: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: VD.accentFaint, borderRadius: BORDER_RADIUS.large,
    borderWidth: 1, borderColor: VD.cardBorder,
    padding: SPACING.md, marginTop: SPACING.xs, marginBottom: SPACING.md,
  },
  appTipText: { flex: 1, fontSize: 12, color: VD.whiteLow, lineHeight: 18 },

  // Error
  errorRow:  { width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: SPACING.sm },
  errorText: { flex: 1, fontSize: 12, color: VD.error, fontWeight: '500' },

  // CTA
  ctaWrap: { width: '100%', marginTop: SPACING.md },
  cta: {
    height: 54, borderRadius: BORDER_RADIUS.large,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  ctaText:    { fontSize: 16, fontWeight: '800', color: '#070A16', letterSpacing: 0 },
  ctaTextDim: { color: VD.whiteLow },

  bottomPad: { height: SPACING.xxl },
});
