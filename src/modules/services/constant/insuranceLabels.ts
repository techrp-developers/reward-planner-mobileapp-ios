import i18n from "../../../i18n";

/**
 * Insurance dropdown options keep their English labels as stored form values
 * (they are matched and sent to the insurer API). These helpers only change
 * how a label is displayed in the current language.
 */
const OPTION_KEYS: Record<string, string> = {
  "Salaried": "services:options.salaried",
  "Self Employed/Business": "services:options.selfEmployedBusiness",
  "Income from other sources": "services:options.incomeFromOtherSources",
  "₹41 Lakh and Above": "services:options.41LakhAndAbove",
  "Doctors": "services:options.doctors",
  "Lawyers": "services:options.lawyers",
  "Accountants": "services:options.accountants",
  "Architects/Consulting engineers": "services:options.architectsConsultingEngineers",
  "Teachers": "services:options.teachers",
  "Bankers": "services:options.bankers",
  "Clerical/administrative functions": "services:options.clericalAdministrativeFunctions",
  "BFSI professional": "services:options.bfsiProfessional",
  "Businessman not working on factory floors": "services:options.businessmanNotWorkingOnFactory",
  "Homemaker": "services:options.homemaker",
  "Student": "services:options.student",
  "Builders/Contractors": "services:options.buildersContractors",
  "Engineers on site": "services:options.engineersOnSite",
  "Veterinary Doctors": "services:options.veterinaryDoctors",
  "Mechanics": "services:options.mechanics",
  "Manual labourers not working in mines, explosive industry, electrical intallations and such hazardous industries": "services:options.manualLabourersNotWorkingIn",
  "Business working on factory floors": "services:options.businessWorkingOnFactoryFloors",
  "Working in mines/explosives": "services:options.workingInMinesExplosives",
  "Electrical installations": "services:options.electricalInstallations",
  "Racer": "services:options.racer",
  "Circus artist or engaged in such other occupation": "services:options.circusArtistOrEngagedIn",
  "Engaged full time/ part time in any adventurous activities": "services:options.engagedFullTimePartTime",
  "Professional sportsperson": "services:options.professionalSportsperson",
  "Professional adventurer/trekker/mountaineer": "services:options.professionalAdventurerTrekkerMountaineer",
  "Defense services": "services:options.defenseServices",
  "Drivers": "services:options.drivers"
};

export function insuranceOptionLabel(label?: string | null): string {
  if (!label) return "";
  const key = OPTION_KEYS[label];
  if (key) return i18n.t(key);
  const lakhRange = /^₹(\d+) Lakh – ₹(\d+) Lakh$/.exec(label);
  if (lakhRange) return i18n.t("services:amount.lakhRange", { from: lakhRange[1], to: lakhRange[2] });
  const amount = /^(\d+) (Lakh|Crores?)$/.exec(label);
  if (amount) {
    const count = Number(amount[1]);
    return i18n.t(amount[2] === "Lakh" ? "services:amount.lakh" : "services:amount.crore", { count });
  }
  return label;
}
