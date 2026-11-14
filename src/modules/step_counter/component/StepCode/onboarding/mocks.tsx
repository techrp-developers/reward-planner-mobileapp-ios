/**
 * Static, non-interactive placeholder illustrations drawn natively. They are
 * only rendered inside OnboardingIllustration while the matching screenshot in
 * ONBOARDING_ASSETS is missing. They never handle input — the real permission
 * request always goes through the system UI.
 */
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { OB } from './theme';
import { ONBOARDING_ASSETS, REWARD_PLANNERS_ICON } from './assets';

const RpIcon = ({ size }: { size: number }) => (
  <Image source={REWARD_PLANNERS_ICON} style={{ width: size, height: size }} resizeMode="contain" />
);

const Toggle = ({ color }: { color: string }) => (
  <View style={[m.toggle, { backgroundColor: color }]}>
    <View style={m.knob} />
  </View>
);

export const HealthConnectGlyph = ({ size }: { size: number }) =>
  ONBOARDING_ASSETS.healthConnectIcon ? (
    <ONBOARDING_ASSETS.healthConnectIcon.Component width={size} height={size} />
  ) : (
    <MaterialCommunityIcons name="heart-plus-outline" size={size} color="#3367D6" />
  );

// ─── Android ──────────────────────────────────────────────────────────────────

const LAUNCHER_APPS = [
  { icon: 'clock-outline', color: '#4A80F0', label: 'Clock' },
  { icon: 'account-circle', color: '#3B82F6', label: 'Contacts' },
  { icon: 'calendar-blank', color: '#2F9E62', label: 'Calendar' },
  { icon: 'folder', color: '#4F7DF3', label: 'Files' },
  { icon: 'camera', color: '#7B8394', label: 'Camera' },
  { icon: 'message-text', color: '#3B82F6', label: 'Messages' },
  { icon: 'cog', color: '#7B8394', label: 'Settings' },
] as const;

export const AndroidLauncherMock = ({ hcLabel }: { hcLabel: string }) => (
  <View style={m.pad}>
    <View style={m.search}>
      <MaterialCommunityIcons name="magnify" size={16} color={OB.subtle} />
      <Text style={m.searchText}>Search apps</Text>
    </View>
    <View style={m.grid}>
      {LAUNCHER_APPS.map(app => (
        <View key={app.label} style={m.app}>
          <View style={m.appIcon}>
            <MaterialCommunityIcons name={app.icon} size={24} color={app.color} />
          </View>
          <Text style={m.appLabel} numberOfLines={1}>{app.label}</Text>
        </View>
      ))}
      <View style={[m.app, m.highlight]}>
        <View style={m.appIcon}>
          <HealthConnectGlyph size={26} />
        </View>
        <Text style={m.appLabel} numberOfLines={2}>{hcLabel}</Text>
      </View>
    </View>
  </View>
);

export const AndroidPermissionMock = ({ stepsLabel }: { stepsLabel: string }) => (
  <View style={m.pad}>
    <MaterialCommunityIcons name="arrow-left" size={18} color={OB.subtle} />
    <Text style={m.androidTitle}>App permissions</Text>
    <View style={m.centerCol}>
      <RpIcon size={40} />
      <Text style={m.appName}>Reward Planners</Text>
    </View>
    <Text style={m.sectionLabel}>Allowed</Text>
    <View style={[m.row, m.highlightRow]}>
      <MaterialCommunityIcons name="walk" size={20} color="#E2475B" />
      <Text style={m.rowText}>{stepsLabel}</Text>
      <Toggle color={OB.selected} />
    </View>
  </View>
);

// ─── iOS ──────────────────────────────────────────────────────────────────────

const SETTINGS_ROWS = [
  { icon: 'cog', bg: '#8E8E93', label: 'General' },
  { icon: 'toggle-switch-outline', bg: '#8E8E93', label: 'Control Centre' },
  { icon: 'brightness-6', bg: '#2F7CF6', label: 'Display & Brightness' },
  { icon: 'view-grid-outline', bg: '#4B5BDB', label: 'Home Screen & App Library' },
  { icon: 'human', bg: '#2F7CF6', label: 'Accessibility' },
  { icon: 'image-outline', bg: '#34AADC', label: 'Wallpaper' },
] as const;

const IosRow = ({
  icon, bg, label, highlight, custom,
}: { icon?: string; bg?: string; label: string; highlight?: boolean; custom?: React.ReactNode }) => (
  <View style={[m.iosRow, highlight && m.highlightRow]}>
    {custom ?? (
      <View style={[m.iosIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon!} size={15} color={OB.white} />
      </View>
    )}
    <Text style={m.rowText} numberOfLines={1}>{label}</Text>
    <MaterialCommunityIcons name="chevron-right" size={18} color="#C4C4C8" />
  </View>
);

export const IosSettingsMock = ({ appsLabel }: { appsLabel: string }) => (
  <View style={m.pad}>
    <Text style={m.iosTitle}>Settings</Text>
    <View style={m.iosGroup}>
      {SETTINGS_ROWS.map(r => <IosRow key={r.label} {...r} />)}
      <IosRow icon="apps" bg="#5856D6" label={appsLabel} highlight />
    </View>
  </View>
);

export const IosAppsMock = () => (
  <View style={m.pad}>
    <View style={m.iosNav}>
      <Text style={m.iosBack}>‹ Settings</Text>
      <Text style={m.iosNavTitle}>Apps</Text>
    </View>
    <View style={m.search}>
      <MaterialCommunityIcons name="magnify" size={16} color={OB.subtle} />
      <Text style={m.searchText}>Search Apps</Text>
    </View>
    <View style={m.iosGroup}>
      <IosRow icon="format-list-bulleted" bg="#FF9500" label="Reminders" />
      <IosRow label="Reward Planners" highlight custom={<RpIcon size={26} />} />
      <IosRow icon="compass-outline" bg="#007AFF" label="Safari" />
      <IosRow icon="layers-outline" bg="#5E5CE6" label="Shortcuts" />
      <IosRow icon="weather-partly-cloudy" bg="#34AADC" label="Weather" />
    </View>
  </View>
);

export const IosHealthAccessMock = ({ stepsLabel, body }: { stepsLabel: string; body: string }) => (
  <View style={m.pad}>
    <Text style={[m.iosNavTitle, m.selfCenter]}>Health Access</Text>
    <View style={[m.centerCol, m.gapTop]}>
      <RpIcon size={44} />
      <Text style={m.healthBody}>{body}</Text>
    </View>
    <View style={[m.iosGroup, m.gapTop]}>
      <View style={[m.iosRow, m.highlightRow]}>
        <MaterialCommunityIcons name="fire" size={22} color="#FF453A" />
        <Text style={m.rowText}>{stepsLabel}</Text>
        <Toggle color="#34C759" />
      </View>
    </View>
  </View>
);

const m = StyleSheet.create({
  pad: { flex: 1, padding: 14 },
  centerCol: { alignItems: 'center' },
  selfCenter: { alignSelf: 'center' },
  gapTop: { marginTop: 14 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E9EBF1',
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 34,
    marginBottom: 14,
  },
  searchText: { fontSize: 12.5, color: OB.subtle },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10 },
  app: { width: '25%', alignItems: 'center', paddingVertical: 6, borderRadius: 14 },
  appIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: OB.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  appLabel: { fontSize: 10.5, color: OB.text, textAlign: 'center' },
  highlight: { borderWidth: 2, borderColor: OB.selected, backgroundColor: OB.selectedBg },
  highlightRow: {
    borderWidth: 2,
    borderColor: OB.selected,
    borderRadius: 14,
    backgroundColor: OB.white,
  },
  androidTitle: { fontSize: 22, color: OB.text, marginTop: 10, marginBottom: 12 },
  appName: { fontSize: 13, color: OB.text, marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: OB.muted, marginTop: 14, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 48 },
  rowText: { flex: 1, fontSize: 13.5, color: OB.text, fontWeight: '500' },
  toggle: { width: 40, height: 24, borderRadius: 12, padding: 2, alignItems: 'flex-end' },
  knob: { width: 20, height: 20, borderRadius: 10, backgroundColor: OB.white },
  iosTitle: { fontSize: 17, fontWeight: '700', color: OB.text, alignSelf: 'center', marginBottom: 12 },
  iosNav: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iosBack: { fontSize: 14, color: '#007AFF', position: 'absolute', left: 0 },
  iosNavTitle: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: OB.text },
  iosGroup: { backgroundColor: OB.white, borderRadius: 14, paddingHorizontal: 4, paddingVertical: 2 },
  iosRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, height: 40 },
  iosIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  healthBody: { fontSize: 12.5, lineHeight: 17, color: OB.muted, textAlign: 'center', marginTop: 8 },
});
