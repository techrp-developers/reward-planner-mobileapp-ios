// TypeScript Interfaces
export interface CityZoneMap {
  [city: string]: string;
}

export interface CoverAmount {
  label: string;
  value: number;
}

export interface SelectionOption {
  label: string;
  value: string;
  category?: number;
}

// City to Zone Mapping
export const CITY_ZONE_MAP: CityZoneMap = {
  // Zone 1 - Metro Cities
  "mumbai": "1",
  "delhi": "1",
  "bangalore": "1",
  "hyderabad": "1",
  "pune": "1",
  "ahmedabad": "1",
  "kolkata": "1",
  "chennai": "1",
  
  // Zone 2 - Tier-2 Cities
  "agra": "2",
  "ajmer": "2",
  "amritsar": "2",
  "bhopal": "2",
  "bhubaneswar": "2",
  "chandigarh": "2",
  "faridabad": "2",
  "ghaziabad": "2",
  "jaipur": "2",
  "jamshedpur": "2",
  "kanpur": "2",
  "kochi": "2",
  "lucknow": "2",
  "mysore": "2",
  "nagpur": "2",
  "patna": "2",
  "srinagar": "2",
  "surat": "2",
  "visakhapatnam": "2",
  
  // Zone 3 - Tier-3 & Other Cities
  "bikaner": "3",
  "cuttack": "3",
  "etawah": "3",
  "gandhinagar": "3",
  "hajipur": "3",
  "jhansi": "3",
  "junagadh": "3",
  "madurai": "3",
  "mathura": "3",
  "meerut": "3",
  "nashik": "3",
  "rohtak": "3",
  "salem": "3",
  "udaipur": "3",
  "vijayawada": "3",
};

// Cover Amount Options
export const COVER_AMOUNTS: CoverAmount[] = [
  { label: "5 Lakh", value: 500000 },
  { label: "7 Lakh", value: 700000 },
  { label: "10 Lakh", value: 1000000 },
  { label: "15 Lakh", value: 1500000 },
  { label: "20 Lakh", value: 2000000 },
  { label: "25 Lakh", value: 2500000 },
  { label: "30 Lakh", value: 3000000 },
  { label: "35 Lakh", value: 3500000 },
  { label: "40 Lakh", value: 4000000 },
  { label: "45 Lakh", value: 4500000 },
  { label: "50 Lakh", value: 5000000 },
  { label: "75 Lakh", value: 7500000 },
  { label: "1 Crore", value: 10000000 },
  { label: "2 Crores", value: 20000000 },
  { label: "3 Crores", value: 30000000 },
  { label: "4 Crores", value: 40000000 },
  { label: "5 Crores", value: 50000000 },
];

// City list for dropdown
export const CITIES = Object.keys(CITY_ZONE_MAP).map(city => city.charAt(0).toUpperCase() + city.slice(1));

// Zone labels
export const ZONES = ["1", "2", "3"];

export const SUPER_COVER_AMOUNTS: CoverAmount[] = [
  { label: "5 Lakh", value: 500000 },
  { label: "10 Lakh", value: 1000000 },
  { label: "15 Lakh", value: 1500000 },
  { label: "20 Lakh", value: 2000000 },
  { label: "25 Lakh", value: 2500000 },
  { label: "50 Lakh", value: 5000000 },
  { label: "1 Crore", value: 10000000 },
  { label: "3 Crores", value: 30000000 },
];

export const OCCUPATIONS: SelectionOption[] = [
  { label: "Salaried", value: "salaried" },
  { label: "Self Employed/Business", value: "self_employed" },
  { label: "Income from other sources", value: "other_income" },
];

export const INCOME_RANGES: SelectionOption[] = [
  { label: "₹3 Lakh – ₹5 Lakh", value: "3-5" },
  { label: "₹6 Lakh – ₹8 Lakh", value: "6-8" },
  { label: "₹9 Lakh – ₹12 Lakh", value: "9-12" },
  { label: "₹13 Lakh – ₹18 Lakh", value: "13-18" },
  { label: "₹19 Lakh – ₹25 Lakh", value: "19-25" },
  { label: "₹26 Lakh – ₹40 Lakh", value: "26-40" },
  { label: "₹41 Lakh and Above", value: "41+" },
];


export const PA_COVER_AMOUNTS: CoverAmount[] = [
  { label: "10 Lakh", value: 1000000 },
  { label: "15 Lakh", value: 1500000 },
  { label: "20 Lakh", value: 2000000 },
  { label: "25 Lakh", value: 2500000 },
  { label: "30 Lakh", value: 3000000 },
  { label: "35 Lakh", value: 3500000 },
  { label: "50 Lakh", value: 5000000 },
  { label: "75 Lakh", value: 7500000 },
  { label: "1 Crore", value: 10000000 },
  { label: "2 Crore", value: 20000000 },
  { label: "3 Crore", value: 30000000 },
  { label: "4 Crore", value: 40000000 },
  { label: "5 Crore", value: 50000000 },
];


export const NATURE_OF_WORK: Record<number, SelectionOption[]> = {
  1: [
    { label: "Doctors", value: "Doctors", category: 1 },
    { label: "Lawyers", value: "Lawyers", category: 1 },
    { label: "Accountants", value: "Accountants", category: 1 },
    {
      label: "Architects/Consulting engineers",
      value: "Architects/Consulting engineers",
      category: 1,
    },
    { label: "Teachers", value: "Teachers", category: 1 },
    { label: "Bankers", value: "Bankers", category: 1 },
    {
      label: "Clerical/administrative functions",
      value: "Clerical/administrative functions",
      category: 1,
    },
    { label: "BFSI professional", value: "BFSI professional", category: 1 },
    {
      label: "Businessman not working on factory floors",
      value: "Businessman not working on factory floors",
      category: 1,
    },
    { label: "Homemaker", value: "Homemaker", category: 1 },
    { label: "Student", value: "Student", category: 1 },
  ],

  2: [
    { label: "Builders/Contractors", value: "Builders/Contractors", category: 2 },
    { label: "Engineers on site", value: "Engineers on site", category: 2 },
    { label: "Veterinary Doctors", value: "Veterinary Doctors", category: 2 },
    { label: "Mechanics", value: "Mechanics", category: 2 },
    {
      label: "Manual labourers not working in mines, explosive industry, electrical intallations and such hazardous industries",
      value: "Manual labourers not working in mines, explosive industry, electrical intallations and such hazardous industries",
      category: 2,
    },
    {
      label: "Business working on factory floors",
      value: "Business working on factory floors",
      category: 2,
    },
  ],

  3: [
    { label: "Working in mines/explosives", value: "Working in mines/explosives", category: 3 },
    { label: "Electrical installations", value: "Electrical installations", category: 3 },
    { label: "Racer", value: "Racer", category: 3 },
    {
      label: "Circus artist or engaged in such other occupation",
      value: "Circus artist or engaged in such other occupation",
      category: 3,
    },
    {
      label: "Engaged full time/ part time in any adventurous activities",
      value: "Engaged full time/ part time in any adventurous activities",
      category: 3,
    },
    { label: "Professional sportsperson", value: "Professional sportsperson", category: 3 },
    {
      label: "Professional adventurer/trekker/mountaineer",
      value: "Professional adventurer/trekker/mountaineer",
      category: 3,
    },
    { label: "Defense services", value: "Defense services", category: 3 },
    { label: "Drivers", value: "Drivers", category: 3 },
  ],
};

export const PA_NATURE_OF_WORK_OPTIONS: SelectionOption[] = Object.values(
  NATURE_OF_WORK
).flat();