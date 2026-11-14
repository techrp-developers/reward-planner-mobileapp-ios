import type { FC } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { SvgProps } from 'react-native-svg';

import AndroidLogo from '../../../assets/StepCount/android_logo.svg';
import AppleLogo from '../../../assets/StepCount/apple_logo.svg';
import HealthConnectIcon from '../../../assets/StepCount/health_connect_icon.svg';
import GooglePlayIcon from '../../../assets/StepCount/google_play_icon.svg';
import GoogleFitIcon from '../../../assets/StepCount/google_fit_icon.svg';
import LauncherHealthConnect from '../../../assets/StepCount/launcher_health_connect.svg';
import PermissionSteps from '../../../assets/StepCount/permission_steps.svg';
import AppleHealthIcon from '../../../assets/StepCount/apple_health_icon.svg';
import IosApps from '../../../assets/StepCount/iosApps.svg';
import HealthAccess from '../../../assets/StepCount/health_access.svg';
import SuccessCheck from '../../../assets/StepCount/success_check.svg';

/** An SVG component plus its viewBox aspect ratio (width / height). */
export type OnboardingSvg = { Component: FC<SvgProps>; aspect: number };

const svg = (Component: FC<SvgProps>, width: number, height: number): OnboardingSvg => ({
  Component,
  aspect: width / height,
});

/**
 * Supplied onboarding artwork (src/modules/step_counter/assets/StepCount/).
 * Sizes are each file's viewBox. A `null` entry renders a native placeholder
 * and is listed by the dev warning below.
 */
export const ONBOARDING_ASSETS: Record<OnboardingAssetKey, OnboardingSvg | null> = {
  androidLogo: svg(AndroidLogo, 636, 748),
  appleLogo: svg(AppleLogo, 942, 1122),

  // Android / Health Connect
  healthConnectIcon: svg(HealthConnectIcon, 199, 192),
  googlePlayIcon: svg(GooglePlayIcon, 620, 676),
  androidLauncher: svg(LauncherHealthConnect, 197, 192),
  androidPermission: svg(PermissionSteps, 144, 192),

  // iPhone / Apple Health
  appleHealthIcon: svg(AppleHealthIcon, 736, 640),
  iosSettings: null, // settings_apps.svg not supplied yet
  iosApps: svg(IosApps, 140, 192),
  iosHealthAccess: svg(HealthAccess, 188, 192),

  // Additional
  googleFitIcon: svg(GoogleFitIcon, 716, 604),
  successCheck: svg(SuccessCheck, 260, 174),
};

export type OnboardingAssetKey =
  | 'androidLogo'
  | 'appleLogo'
  | 'healthConnectIcon'
  | 'googlePlayIcon'
  | 'androidLauncher'
  | 'androidPermission'
  | 'appleHealthIcon'
  | 'iosSettings'
  | 'iosApps'
  | 'iosHealthAccess'
  | 'googleFitIcon'
  | 'successCheck';

export const REWARD_PLANNERS_ICON: ImageSourcePropType = require('../../../../../assets/menu/logo.png');

let warned = false;
export function warnMissingOnboardingAssets() {
  if (!__DEV__ || warned) return;
  warned = true;
  const missing = Object.entries(ONBOARDING_ASSETS)
    .filter(([, source]) => source == null)
    .map(([key]) => key);
  if (missing.length) {
    console.warn(`[StepOnboarding] Using placeholders for missing assets: ${missing.join(', ')}`);
  }
}
