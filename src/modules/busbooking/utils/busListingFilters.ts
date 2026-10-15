export type BusListingBus = {
  id: string;
  operator: string;
  subtitle: string;
  departure: string;
  arrival: string;
  from: string;
  to: string;
  duration: string;
  price: string;
  seatsLeft: string;
  // Empty when the provider sends no rating for the bus.
  rating: string;
  features: string[];
  about: string;
  boardingPoints: string[];
  droppingPoints: string[];
  topRated?: boolean;
  raw?: any;
};

export type BusListingFilters = {
  busTypes: string[];
  seatTypes: string[];
  departureTimeRanges: string[];
  amenities: string[];
  operators: string[];
  boardingPoints: string[];
  droppingPoints: string[];
};

export type BusListingFacetOption = {
  id: string;
  label: string;
  count: number;
};

// Every option the filter screen offers, with how many buses of the current
// search match it.
export type BusListingFacets = {
  busTypes: BusListingFacetOption[];
  seatTypes: BusListingFacetOption[];
  departureTimes: BusListingFacetOption[];
  amenities: BusListingFacetOption[];
  operators: BusListingFacetOption[];
  boardingPoints: BusListingFacetOption[];
  droppingPoints: BusListingFacetOption[];
};

export const createEmptyBusListingFilters = (): BusListingFilters => ({
  busTypes: [],
  seatTypes: [],
  departureTimeRanges: [],
  amenities: [],
  operators: [],
  boardingPoints: [],
  droppingPoints: [],
});

const BUS_TYPE_IDS = ["volvo", "ac", "non-ac"];
const SEAT_TYPE_IDS = ["seater", "sleeper"];
const DEPARTURE_BUCKET_IDS = ["before-6", "6-12", "12-6", "after-6"];

const OPERATOR_PREFIX = "operator:";
const BOARDING_PREFIX = "boarding:";
const DROPPING_PREFIX = "dropping:";
const AMENITY_PREFIX = "amenity:";

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const isAcBus = (subtitle: string) =>
  /\bac\b|a\/c/.test(subtitle) && !isNonAcBus(subtitle);

const isNonAcBus = (subtitle: string) => /non[\s-]*a\/?c/.test(subtitle);

export const matchesQuickFilter = (bus: BusListingBus, filterId: string) => {
  const subtitle = normalizeText(bus.subtitle);

  switch (filterId) {
    case "ac":
      return isAcBus(subtitle);
    case "sleeper":
      return subtitle.includes("sleeper");
    case "seater":
      return subtitle.includes("seater");
    case "all":
    default:
      return true;
  }
};

export const matchesBusTypeFilter = (bus: BusListingBus, filterId: string) => {
  const subtitle = normalizeText(bus.subtitle);

  switch (filterId) {
    case "volvo":
      return subtitle.includes("volvo");
    case "ac":
      return isAcBus(subtitle);
    case "non-ac":
      return isNonAcBus(subtitle);
    default:
      return true;
  }
};

export const matchesSeatTypeFilter = (bus: BusListingBus, filterId: string) => {
  const subtitle = normalizeText(bus.subtitle);

  switch (filterId) {
    case "sleeper":
      return subtitle.includes("sleeper");
    case "seater":
      return subtitle.includes("seater");
    default:
      return true;
  }
};

export const getDepartureBucketId = (departure: string) => {
  const match = String(departure).match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return "";
  }

  const totalMinutes = Number(match[1]) * 60 + Number(match[2]);

  if (totalMinutes < 360) {
    return "before-6";
  }

  if (totalMinutes < 720) {
    return "6-12";
  }

  if (totalMinutes < 1080) {
    return "12-6";
  }

  return "after-6";
};

const includesName = (names: string[] | undefined, wanted: string) =>
  (Array.isArray(names) ? names : []).some(
    (name) => normalizeText(name) === normalizeText(wanted)
  );

export const matchesBusListingFilters = (
  bus: BusListingBus,
  filters: BusListingFilters
) => {
  const hasBusTypeMatch =
    filters.busTypes.length === 0 ||
    filters.busTypes.some((filterId) => matchesBusTypeFilter(bus, filterId));

  const hasSeatTypeMatch =
    filters.seatTypes.length === 0 ||
    filters.seatTypes.some((filterId) => matchesSeatTypeFilter(bus, filterId));

  const hasDepartureMatch =
    filters.departureTimeRanges.length === 0 ||
    filters.departureTimeRanges.includes(getDepartureBucketId(bus.departure));

  // A bus must offer every amenity the user asked for.
  const hasAmenityMatch = filters.amenities.every((amenity) =>
    includesName(bus.features, amenity)
  );

  const hasOperatorMatch =
    filters.operators.length === 0 ||
    filters.operators.some(
      (operator) => normalizeText(operator) === normalizeText(bus.operator)
    );

  const hasBoardingMatch =
    filters.boardingPoints.length === 0 ||
    filters.boardingPoints.some((point) => includesName(bus.boardingPoints, point));

  const hasDroppingMatch =
    filters.droppingPoints.length === 0 ||
    filters.droppingPoints.some((point) => includesName(bus.droppingPoints, point));

  return (
    hasBusTypeMatch &&
    hasSeatTypeMatch &&
    hasDepartureMatch &&
    hasAmenityMatch &&
    hasOperatorMatch &&
    hasBoardingMatch &&
    hasDroppingMatch
  );
};

// Turns the option ids picked on the filter screen back into filters.
export const parseSelectedBusFilters = (selectedIds: string[]): BusListingFilters => {
  const filters = createEmptyBusListingFilters();

  selectedIds.forEach((id) => {
    if (BUS_TYPE_IDS.includes(id)) {
      filters.busTypes.push(id);
    } else if (SEAT_TYPE_IDS.includes(id)) {
      filters.seatTypes.push(id);
    } else if (DEPARTURE_BUCKET_IDS.includes(id)) {
      filters.departureTimeRanges.push(id);
    } else if (id.startsWith(AMENITY_PREFIX)) {
      filters.amenities.push(id.slice(AMENITY_PREFIX.length));
    } else if (id.startsWith(OPERATOR_PREFIX)) {
      filters.operators.push(id.slice(OPERATOR_PREFIX.length));
    } else if (id.startsWith(BOARDING_PREFIX)) {
      filters.boardingPoints.push(id.slice(BOARDING_PREFIX.length));
    } else if (id.startsWith(DROPPING_PREFIX)) {
      filters.droppingPoints.push(id.slice(DROPPING_PREFIX.length));
    }
  });

  return filters;
};

// Counts each distinct name once per bus, most common first.
const countNames = (
  buses: BusListingBus[],
  prefix: string,
  getNames: (bus: BusListingBus) => string[]
): BusListingFacetOption[] => {
  const counts = new Map<string, BusListingFacetOption>();

  buses.forEach((bus) => {
    const seen = new Set<string>();

    getNames(bus).forEach((name) => {
      const label = String(name ?? "").trim();
      const key = normalizeText(label);

      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);

      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { id: `${prefix}${label}`, label, count: 1 });
      }
    });
  });

  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
};

const countMatching = (
  buses: BusListingBus[],
  options: Array<{ id: string; label: string }>,
  matches: (bus: BusListingBus, id: string) => boolean
): BusListingFacetOption[] =>
  options
    .map((option) => ({
      ...option,
      count: buses.filter((bus) => matches(bus, option.id)).length,
    }))
    .filter((option) => option.count > 0);

export const buildBusListingFacets = (buses: BusListingBus[]): BusListingFacets => ({
  busTypes: countMatching(
    buses,
    [
      { id: "volvo", label: "Volvo buses" },
      { id: "ac", label: "AC" },
      { id: "non-ac", label: "NON AC" },
    ],
    matchesBusTypeFilter
  ),
  seatTypes: countMatching(
    buses,
    [
      { id: "seater", label: "SEATER" },
      { id: "sleeper", label: "SLEEPER" },
    ],
    matchesSeatTypeFilter
  ),
  departureTimes: countMatching(
    buses,
    [
      { id: "before-6", label: "Before 6 AM" },
      { id: "6-12", label: "6 AM - 12 PM" },
      { id: "12-6", label: "12 PM - 6 PM" },
      { id: "after-6", label: "After 6 PM" },
    ],
    (bus, id) => getDepartureBucketId(bus.departure) === id
  ),
  amenities: countNames(buses, AMENITY_PREFIX, (bus) => bus.features || []),
  operators: countNames(buses, OPERATOR_PREFIX, (bus) => [bus.operator]),
  boardingPoints: countNames(buses, BOARDING_PREFIX, (bus) => bus.boardingPoints || []),
  droppingPoints: countNames(buses, DROPPING_PREFIX, (bus) => bus.droppingPoints || []),
});

export type BusSortId = "departure" | "price" | "rating";

const toPriceNumber = (price: string) =>
  Number(String(price).replace(/[^\d.]/g, "")) || 0;

export const sortBusListing = <T extends BusListingBus>(
  buses: T[],
  sortId: BusSortId
): T[] => {
  const sorted = [...buses];

  switch (sortId) {
    case "price":
      return sorted.sort((a, b) => toPriceNumber(a.price) - toPriceNumber(b.price));
    case "rating":
      return sorted.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    case "departure":
    default:
      // The provider timestamp carries the date, so overnight buses sort
      // after same-day ones; the HH:mm label is the fallback.
      return sorted.sort((a, b) =>
        String(a.raw?.DepartureTime || a.departure).localeCompare(
          String(b.raw?.DepartureTime || b.departure)
        )
      );
  }
};
