/**
 * InsuranceApi.tsx — Barrel / compat re-export layer
 *
 * All implementations live in dedicated modules:
 *   - CRM lead flow  → InsuranceCrmApi.ts
 *   - PolicyPlanner premiums → PolicyPlannerApi.ts
 *   - Payload mappers → ../component/insurance/insurancePayloadMappers.ts
 *
 * This file keeps existing import paths working without any screen changes.
 */

// ─── CRM (RewardPlanners backend) ──────────────────────────────────────────
export {
  API,
  InsuranceType,
  startInsurance,
  saveStep,
  completeInsurance,
  getQuotes,
  selectPlan,
} from './InsuranceCrmApi';

// ─── PolicyPlanner direct premium APIs ─────────────────────────────────────
export {
  fetchPlans,
  getPremium,
  getAllPremiums,
  fetchSuperTopUpPlans,
  getSuperTopUpPremium,
  getAllSuperTopUpPremiums,
  fetchPAPlans,
  getPAPremium,
  getAllPAPremiums,
} from './PolicyPlannerApi';

// ─── Payload mappers ────────────────────────────────────────────────────────
export {
  mapMembersConfig,
  mapMembersAges,
  mapBasicDetails,
  mapHealthCoverage,
  mapSuperTopupCoverage,
  mapPaDetails,
  normalizeQuotesForUi,
} from '../component/insurance/insurancePayloadMappers';

// ─── PA risk classification reference data ──────────────────────────────────
export const riskTabs = ["Category 1", "Category 2", "Category 3"];

export const riskList: Record<number, string[]> = {
  1: [
    "Doctors", "Lawyers", "Accountants", "Architects/Consulting engineers", "Teachers",
    "Bankers", "Clerical/administrative functions", "BFSI professional",
    "Businessman not working on factory floors", "Homemaker", "Student",
  ],
  2: [
    "Builders/Contractors", "Engineers on site", "Veterinary Doctors", "Mechanics",
    "Manual labourers not working in mines, explosive industry, electrical intallations and such hazardous industries",
    "Business working on factory floors",
  ],
  3: [
    "Working in mines/explosives", "Electrical installations", "Racer",
    "Circus artist or engaged in such other occupation",
    "Engaged full time/ part time in any adventurous activities",
    "Professional sportsperson", "Professional adventurer/trekker/mountaineer",
    "Defense services", "Drivers",
  ],
};
