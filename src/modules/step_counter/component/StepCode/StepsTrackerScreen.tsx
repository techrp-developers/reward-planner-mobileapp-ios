import React, { useCallback, useEffect, useRef } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import {
  AppIconTile,
  GradientPrimaryButton,
  InstructionInfoCard,
  OnboardingIllustration,
  OnboardingSuccess,
  PlatformSelectionCard,
  SecondaryLink,
  StepOnboardingScreen,
  SvgAsset,
} from './onboarding/components';
import {
  AndroidLauncherMock,
  AndroidPermissionMock,
  HealthConnectGlyph,
  IosAppsMock,
  IosHealthAccessMock,
  IosSettingsMock,
} from './onboarding/mocks';
import { ONBOARDING_ASSETS, warnMissingOnboardingAssets } from './onboarding/assets';
import { CURRENT_PLATFORM, useOnboardingFlow } from './onboarding/useOnboardingFlow';
import { OB } from './onboarding/theme';

const A = ONBOARDING_ASSETS;

export default function StepsTrackerScreen() {
  const { t: tx } = useTranslation();
  const t = useCallback((key: string) => tx(`stepCounter:onboarding.${key}`), [tx]);
  const navigation = useNavigation<any>();
  const flow = useOnboardingFlow();
  const { step, tracker } = flow;
  const navigatingRef = useRef(false);

  useEffect(() => { warnMissingOnboardingAssets(); }, []);

  const leave = useCallback((action: () => void) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    action();
  }, []);

  // Returning users whose setup is already complete skip onboarding entirely
  // (same behaviour as before). Only while still on the first step, so a
  // fresh completion lands on the success screen instead.
  useEffect(() => {
    if (step === 'select' && flow.isSetupComplete && flow.ready) {
      leave(() => navigation.replace('Dashboard'));
    }
  }, [step, flow.isSetupComplete, flow.ready, leave, navigation]);

  const backRef = useRef(flow.back);
  backRef.current = flow.back;

  const handleBack = useCallback(() => {
    if (!backRef.current()) navigation.goBack();
  }, [navigation]);

  // Hardware back walks the onboarding steps before leaving the screen.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => backRef.current());
      return () => sub.remove();
    }, []),
  );

  // iOS swipe-back would skip the internal steps; allow it only on step 1.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === 'select' });
  }, [navigation, step]);

  const finish = useCallback(() => {
    if (flow.profileCompleted) leave(() => navigation.replace('Dashboard'));
    else leave(() => navigation.navigate('StepForm'));
  }, [flow.profileCompleted, leave, navigation]);

  const common = { progress: flow.progress, onBack: handleBack, backLabel: t('back') };

  switch (step) {
    // ── Shared: select device ────────────────────────────────────────────────
    case 'select': {
      const otherSelected = flow.selected !== CURRENT_PLATFORM;
      return (
        <StepOnboardingScreen
          {...common}
          title={t('select.title')}
          subtitle={t('select.subtitle')}
          footer={
            <GradientPrimaryButton
              label={t('continue')}
              onPress={flow.continueFromSelect}
              disabled={otherSelected}
              loading={!flow.statusResolved && !otherSelected}
            />
          }
        >
          <View accessibilityRole="radiogroup">
            <PlatformSelectionCard
              label={t('select.android')}
              hint={CURRENT_PLATFORM === 'android' ? t('select.thisPhone') : undefined}
              iconBg="#E9F8EE"
              icon={
                A.androidLogo
                  ? <SvgAsset asset={A.androidLogo} width={38} height={38} />
                  : <MaterialCommunityIcons name="android" size={38} color="#3DDC84" />
              }
              selected={flow.selected === 'android'}
              onPress={() => flow.setSelected('android')}
            />
            <PlatformSelectionCard
              label={t('select.iphone')}
              hint={CURRENT_PLATFORM === 'ios' ? t('select.thisPhone') : undefined}
              iconBg="#F1F2F5"
              icon={
                A.appleLogo
                  ? <SvgAsset asset={A.appleLogo} width={34} height={34} />
                  : <MaterialCommunityIcons name="apple" size={38} color="#111111" />
              }
              selected={flow.selected === 'ios'}
              onPress={() => flow.setSelected('ios')}
            />
          </View>
          {otherSelected && (
            <InstructionInfoCard
              title={t('select.otherTitle')}
              body={t(CURRENT_PLATFORM === 'ios' ? 'select.otherOnIos' : 'select.otherOnAndroid')}
            />
          )}
        </StepOnboardingScreen>
      );
    }

    // ── Android ──────────────────────────────────────────────────────────────
    case 'install': {
      const update = flow.hcNeedsUpdate;
      return (
        <StepOnboardingScreen
          {...common}
          title={t(update ? 'install.updateTitle' : 'install.title')}
          subtitle={t(update ? 'install.updateSubtitle' : 'install.subtitle')}
          footer={
            <>
              <GradientPrimaryButton
                label={t(update ? 'install.updateCta' : 'install.cta')}
                onPress={flow.openPlayStore}
                rightIcon="open-in-new"
                leftIcon={
                  A.googlePlayIcon
                    ? <SvgAsset asset={A.googlePlayIcon} width={22} height={22} />
                    : <MaterialCommunityIcons name="google-play" size={22} color={OB.white} />
                }
              />
              <SecondaryLink
                label={t('install.alreadyInstalled')}
                onPress={flow.recheckInstall}
                disabled={flow.busy}
              />
            </>
          }
        >
          <AppIconTile
            fill
            source={A.healthConnectIcon}
            fallback={<HealthConnectGlyph size={72} />}
            accessibilityLabel={t('install.appName')}
          />
          <Text style={s.appName}>{t('install.appName')}</Text>
          <Text style={s.publisher}>{t('install.publisher')}</Text>
          <View style={s.facts}>
            {[
              [t('install.factFree'), t('install.factFreeLabel')],
              [t('install.factOfficial'), t('install.factOfficialLabel')],
              [t('install.factPrivate'), t('install.factPrivateLabel')],
            ].map(([value, label], i) => (
              <View key={label} style={[s.fact, i > 0 && s.factDivider]}>
                <Text style={s.factValue}>{value}</Text>
                <Text style={s.factLabel} numberOfLines={1}>{label}</Text>
              </View>
            ))}
          </View>
          {flow.attempted && !flow.sdkAvailable && (
            <InstructionInfoCard tone="warning" title={t('install.notFoundTitle')} body={t('install.notFound')} />
          )}
        </StepOnboardingScreen>
      );
    }

    case 'open':
      return (
        <StepOnboardingScreen
          {...common}
          title={t('open.title')}
          subtitle={t('open.subtitle')}
          footer={
            flow.openedHc ? (
              <GradientPrimaryButton label={t('continue')} onPress={() => flow.go('permission')} />
            ) : (
              <>
                <GradientPrimaryButton label={t('open.cta')} onPress={flow.launchHealthConnect} loading={flow.busy} />
                <SecondaryLink label={t('open.skip')} onPress={() => flow.go('permission')} />
              </>
            )
          }
        >
          <OnboardingIllustration
            source={A.androidLauncher}
            fallback={<AndroidLauncherMock hcLabel={t('install.appName')} />}
            accessibilityLabel={t('open.illustration')}
          />
          <InstructionInfoCard title={t('open.tipTitle')} body={t('open.tip')} />
        </StepOnboardingScreen>
      );

    case 'permission': {
      // Derived from live tracker state, which the context refreshes when the
      // app returns from the system permission UI or Health Connect.
      let notice: React.ReactNode = <InstructionInfoCard title={t('permission.tipTitle')} body={t('permission.tip')} />;
      if (flow.attempted) {
        const openHc = { label: t('permission.openHealthConnect'), onPress: flow.launchHealthConnect };
        if (!flow.stepsGranted) {
          notice = <InstructionInfoCard tone="warning" title={t('permission.deniedTitle')} body={t('permission.denied')} action={openHc} />;
        } else if (tracker.stepDataState === 'no_source') {
          notice = <InstructionInfoCard tone="warning" title={t('permission.noSourceTitle')} body={t('permission.noSource')} action={openHc} />;
        } else {
          notice = <InstructionInfoCard tone="error" body={tracker.healthConnectError || t('genericError')} />;
        }
      }
      return (
        <StepOnboardingScreen
          {...common}
          title={t('permission.title')}
          subtitle={t('permission.subtitle')}
          footer={<GradientPrimaryButton label={t('permission.cta')} onPress={flow.requestAccess} loading={flow.busy} />}
        >
          <OnboardingIllustration
            source={A.androidPermission}
            fallback={<AndroidPermissionMock stepsLabel={t('permission.steps')} />}
            accessibilityLabel={t('permission.illustration')}
          />
          {notice}
        </StepOnboardingScreen>
      );
    }

    // ── iOS ──────────────────────────────────────────────────────────────────
    case 'apple': {
      const unavailable = flow.statusResolved && !flow.sdkAvailable;
      return (
        <StepOnboardingScreen
          {...common}
          title={t('apple.title')}
          subtitle={t('apple.subtitle')}
          footer={
            <>
              <GradientPrimaryButton
                label={t('apple.cta')}
                onPress={flow.requestAccess}
                loading={flow.busy}
                disabled={unavailable}
              />
              {!unavailable && <SecondaryLink label={t('apple.manage')} onPress={flow.startRecovery} />}
            </>
          }
        >
          <AppIconTile
            source={A.appleHealthIcon}
            fallback={<MaterialCommunityIcons name="heart" size={76} color="#FF375F" />}
            accessibilityLabel={t('apple.appName')}
          />
          <Text style={s.appName}>{t('apple.appName')}</Text>
          <View style={s.badge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={OB.success} />
            <Text style={s.badgeText}>{t('apple.badge')}</Text>
          </View>
          {unavailable ? (
            <InstructionInfoCard tone="error" title={t('apple.unavailableTitle')} body={t('apple.unavailable')} />
          ) : flow.attempted ? (
            <InstructionInfoCard
              tone="warning"
              title={t('apple.failedTitle')}
              body={tracker.healthConnectError || t('genericError')}
              action={{ label: t('apple.manage'), onPress: flow.startRecovery }}
            />
          ) : (
            <InstructionInfoCard body={t('apple.info')} />
          )}
        </StepOnboardingScreen>
      );
    }

    case 'settings':
      return (
        <StepOnboardingScreen
          {...common}
          title={t('settings.title')}
          subtitle={t('settings.subtitle')}
          footer={
            <>
              <GradientPrimaryButton label={t('next')} onPress={() => flow.go('find')} />
              <SecondaryLink label={t('allow.openSettings')} onPress={flow.openAppSettings} />
            </>
          }
        >
          <OnboardingIllustration
            frame="ios"
            source={A.iosSettings}
            fallback={<IosSettingsMock appsLabel={t('settings.apps')} />}
            accessibilityLabel={t('settings.illustration')}
          />
        </StepOnboardingScreen>
      );

    case 'find':
      return (
        <StepOnboardingScreen
          {...common}
          title={t('find.title')}
          subtitle={t('find.subtitle')}
          footer={<GradientPrimaryButton label={t('next')} onPress={() => flow.go('allow')} />}
        >
          <OnboardingIllustration
            frame="ios"
            source={A.iosApps}
            fallback={<IosAppsMock />}
            accessibilityLabel={t('find.illustration')}
          />
          <InstructionInfoCard title={t('find.tipTitle')} body={t('find.tip')} />
        </StepOnboardingScreen>
      );

    case 'allow':
      return (
        <StepOnboardingScreen
          {...common}
          title={t('allow.title')}
          subtitle={t('allow.subtitle')}
          footer={
            <>
              <GradientPrimaryButton label={t('allow.cta')} onPress={flow.requestAccess} loading={flow.busy} />
              <SecondaryLink label={t('allow.openSettings')} onPress={flow.openAppSettings} disabled={flow.busy} />
            </>
          }
        >
          <OnboardingIllustration
            frame="ios"
            source={A.iosHealthAccess}
            fallback={<IosHealthAccessMock stepsLabel={t('allow.steps')} body={t('allow.mockBody')} />}
            accessibilityLabel={t('allow.illustration')}
          />
          {flow.attempted ? (
            <InstructionInfoCard tone="warning" body={tracker.healthConnectError || t('genericError')} />
          ) : (
            <InstructionInfoCard body={t('allow.tip')} />
          )}
        </StepOnboardingScreen>
      );

    // ── Shared: success ──────────────────────────────────────────────────────
    case 'success':
      return (
        <StepOnboardingScreen
          {...common}
          footer={
            <GradientPrimaryButton
              label={t(flow.profileCompleted ? 'success.dashboard' : 'continue')}
              onPress={finish}
              loading={flow.profileCompleted === null}
            />
          }
        >
          <OnboardingSuccess
            hero={A.successCheck}
            title={t('success.title')}
            body={t('success.body')}
            rows={[
              { icon: 'trending-up', color: OB.success, bg: OB.successBg, label: t('success.sync') },
              { icon: 'star-circle', color: OB.coin, bg: OB.coinBg, label: t('success.coins') },
            ]}
          />
        </StepOnboardingScreen>
      );

    default:
      return null;
  }
}

const s = StyleSheet.create({
  appName: { fontSize: 22, fontWeight: '800', color: OB.text, textAlign: 'center', marginTop: 18 },
  publisher: { fontSize: 14, color: OB.muted, textAlign: 'center', marginTop: 4, marginBottom: 20 },
  facts: {
    flexDirection: 'row',
    paddingVertical: 4,
    marginBottom: 20,
  },
  fact: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  factDivider: { borderLeftWidth: 1, borderLeftColor: OB.border },
  factValue: { fontSize: 16, fontWeight: '800', color: OB.text },
  factLabel: { fontSize: 12, color: OB.muted, marginTop: 2 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: OB.successBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    marginBottom: 22,
  },
  badgeText: { fontSize: 13.5, fontWeight: '600', color: '#178A49' },
});
