import type { TopTab } from "./navbarConstants";

export type NavbarThemeKey = TopTab | "Bus";

export type NavbarTheme = {
  accent: string;
  lightGradient: [string, string, string];
  darkGradient: [string, string, string];
  primaryGlow: string;
  secondaryGlow: string;
};

export const MODULE_NAVBAR_THEME: Record<NavbarThemeKey, NavbarTheme> = {
  Product: {
    accent: "#C58A16",
    lightGradient: ["#FFFFFF", "#FFFCF1", "#FFF8E5"],
    darkGradient: ["#17130A", "#211A08", "#2A210D"],
    primaryGlow: "#D4A72C",
    secondaryGlow: "#FF8A00",
  },
  Services: {
    accent: "#2563EB",
    lightGradient: ["#FFFFFF", "#F8FBFF", "#EFF6FF"],
    darkGradient: ["#081321", "#0B1C35", "#102A4A"],
    primaryGlow: "#2563EB",
    secondaryGlow: "#38BDF8",
  },
  Payments: {
    accent: "#9333EA",
    lightGradient: ["#FFFFFF", "#FBF8FF", "#F5EEFF"],
    darkGradient: ["#130B1F", "#1B0D2B", "#26113D"],
    primaryGlow: "#9333EA",
    secondaryGlow: "#6A00FF",
  },
  Bus: {
    accent: "#DC2626",
    lightGradient: ["#FFFFFF", "#FFF9F9", "#FFF1F2"],
    darkGradient: ["#1D0A0A", "#2A0D0D", "#3A1111"],
    primaryGlow: "#DC2626",
    secondaryGlow: "#FF8A00",
  },
  DineOut: {
    accent: "#E91E63",
    lightGradient: ["#FFFFFF", "#FFF9FC", "#FFF1F7"],
    darkGradient: ["#1F0A13", "#2B0D1B", "#3A1023"],
    primaryGlow: "#E91E63",
    secondaryGlow: "#FF2D7A",
  },
};

export const BRAND_NAVBAR_COLORS = {
  royalPurple: "#4B0082",
  violet: "#6A00FF",
  pink: "#FF2D7A",
  gold: "#FFC83D",
  orange: "#FF8A00",
  deepPurple: "#12002B",
};

export const getNavbarThemeKey = (
  activeTab: TopTab,
  activeModuleKey?: string | null,
  activeModuleLabel?: string | null
): NavbarThemeKey => {
  const moduleText = `${activeModuleKey || ""} ${activeModuleLabel || ""}`.toLowerCase();

  if (moduleText.includes("bus") || moduleText.includes("transport")) {
    return "Bus";
  }

  if (moduleText.includes("service")) {
    return "Services";
  }

  if (moduleText.includes("payment")) {
    return "Payments";
  }

  if (moduleText.includes("dine")) {
    return "DineOut";
  }

  if (moduleText.includes("product") || moduleText.includes("ecommerce")) {
    return "Product";
  }

  return activeTab;
};

export const getNavbarTheme = (
  activeTab: TopTab,
  activeModuleKey?: string | null,
  activeModuleLabel?: string | null
) => MODULE_NAVBAR_THEME[getNavbarThemeKey(activeTab, activeModuleKey, activeModuleLabel)];
