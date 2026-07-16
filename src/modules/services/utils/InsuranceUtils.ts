import { CITY_ZONE_MAP } from "../constant/InsuranceConstants";

/**
 * Get zone from city name
 * @param cityName - City name (can be any case)
 * @returns Zone number as string ("1", "2", or "3")
 * Default: "3" if city not found
 */
export const getZoneFromCity = (cityName: string): string => {
  if (!cityName || typeof cityName !== "string") {
    return "3"; // Default zone
  }

  const normalizedCity = cityName.toLowerCase().trim();
  const zone = CITY_ZONE_MAP[normalizedCity];

  return zone || "3"; // Return matched zone or default "3"
};

/**
 * Format cover amount for display
 * @param value - Cover amount value
 * @returns Formatted string (e.g., "10,00,000")
 */
export const formatCoverAmount = (value: number): string => {
  if (!value) return "0";
  
  const valueStr = value.toString();
  const length = valueStr.length;

  if (length <= 3) return valueStr;
  if (length === 4) return `${valueStr.slice(0, 1)},${valueStr.slice(1)}`;
  if (length === 5) return `${valueStr.slice(0, 2)},${valueStr.slice(2)}`;
  if (length === 6) return `${valueStr.slice(0, 2)},${valueStr.slice(2, 5)},${valueStr.slice(5)}`;
  
  return `${valueStr.slice(0, length - 5)},${valueStr.slice(length - 5, length - 2)},${valueStr.slice(length - 2)}`;
};

/**
 * Validate city name
 * @param cityName - City name to validate
 * @returns true if city is in our database
 */
export const isValidCity = (cityName: string): boolean => {
  if (!cityName || typeof cityName !== "string") return false;
  return cityName.toLowerCase().trim() in CITY_ZONE_MAP;
};

/**
 * Filter cities by search term (case-insensitive)
 * @param searchTerm - Search term
 * @param cities - List of cities
 * @returns Filtered cities
 */
export const filterCities = (searchTerm: string, cities: string[]): string[] => {
  if (!searchTerm) return cities;

  const term = searchTerm.toLowerCase().trim();
  return cities.filter(city => city.toLowerCase().includes(term));
};
