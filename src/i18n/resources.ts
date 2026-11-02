/**
 * Bundled translation resources, one JSON file per module ("namespace").
 * Bundling keeps every language available offline. To add a namespace:
 * create locales/<lang>/<ns>.json for each language and register it below.
 */
import enCommon from "./locales/en/common.json";
import enLanguage from "./locales/en/language.json";
import enProfile from "./locales/en/profile.json";
import enAuth from "./locales/en/auth.json";
import enProducts from "./locales/en/products.json";
import enStepCounter from "./locales/en/stepCounter.json";
import enBusBooking from "./locales/en/busBooking.json";
import enPayments from "./locales/en/payments.json";
import enServices from "./locales/en/services.json";
import enInsurance from "./locales/en/insurance.json";
import enGames from "./locales/en/games.json";
import enChat from "./locales/en/chat.json";
import enDashboard from "./locales/en/dashboard.json";

import hiCommon from "./locales/hi/common.json";
import hiLanguage from "./locales/hi/language.json";
import hiProfile from "./locales/hi/profile.json";
import hiAuth from "./locales/hi/auth.json";
import hiProducts from "./locales/hi/products.json";
import hiStepCounter from "./locales/hi/stepCounter.json";
import hiBusBooking from "./locales/hi/busBooking.json";
import hiPayments from "./locales/hi/payments.json";
import hiServices from "./locales/hi/services.json";
import hiInsurance from "./locales/hi/insurance.json";
import hiGames from "./locales/hi/games.json";
import hiChat from "./locales/hi/chat.json";
import hiDashboard from "./locales/hi/dashboard.json";

import mrCommon from "./locales/mr/common.json";
import mrLanguage from "./locales/mr/language.json";
import mrProfile from "./locales/mr/profile.json";
import mrAuth from "./locales/mr/auth.json";
import mrProducts from "./locales/mr/products.json";
import mrStepCounter from "./locales/mr/stepCounter.json";
import mrBusBooking from "./locales/mr/busBooking.json";
import mrPayments from "./locales/mr/payments.json";
import mrServices from "./locales/mr/services.json";
import mrInsurance from "./locales/mr/insurance.json";
import mrGames from "./locales/mr/games.json";
import mrChat from "./locales/mr/chat.json";
import mrDashboard from "./locales/mr/dashboard.json";

export const en = {
  common: enCommon,
  language: enLanguage,
  profile: enProfile,
  auth: enAuth,
  products: enProducts,
  stepCounter: enStepCounter,
  busBooking: enBusBooking,
  payments: enPayments,
  services: enServices,
  insurance: enInsurance,
  games: enGames,
  chat: enChat,
  dashboard: enDashboard,
};

export const resources = {
  en,
  hi: {
    common: hiCommon,
    language: hiLanguage,
    profile: hiProfile,
    auth: hiAuth,
    products: hiProducts,
    stepCounter: hiStepCounter,
    busBooking: hiBusBooking,
    payments: hiPayments,
    services: hiServices,
    insurance: hiInsurance,
    games: hiGames,
    chat: hiChat,
    dashboard: hiDashboard,
  },
  mr: {
    common: mrCommon,
    language: mrLanguage,
    profile: mrProfile,
    auth: mrAuth,
    products: mrProducts,
    stepCounter: mrStepCounter,
    busBooking: mrBusBooking,
    payments: mrPayments,
    services: mrServices,
    insurance: mrInsurance,
    games: mrGames,
    chat: mrChat,
    dashboard: mrDashboard,
  },
} as const;

export type AppNamespace = keyof typeof en;
export const NAMESPACES = Object.keys(en) as AppNamespace[];
