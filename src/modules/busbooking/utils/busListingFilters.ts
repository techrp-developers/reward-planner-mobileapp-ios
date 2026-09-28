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
  rating: string;
  features: string[];
  about: string;
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

export const createEmptyBusListingFilters = (): BusListingFilters => ({
  busTypes: [],
  seatTypes: [],
  departureTimeRanges: [],
  amenities: [],
  operators: [],
  boardingPoints: [],
  droppingPoints: [],
});

const normalizeText = (value: unknown) => String(value ?? "").trim().toLowerCase();

const normalizeFeatureTokens = (bus: BusListingBus) =>
  (Array.isArray(bus.features) ? bus.features : []).map((feature) => normalizeText(feature));

const includesAny = (value: string, keywords: string[]) =>
  keywords.some((keyword) => value.includes(keyword));

export const matchesQuickFilter = (bus: BusListingBus, filterId: string) => {
  const subtitle = normalizeText(bus.subtitle);

  switch (filterId) {
    case "ac":
      return subtitle.includes("ac") && !subtitle.includes("non ac") && !subtitle.includes("non-ac");
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
      return subtitle.includes("ac") && !subtitle.includes("non ac") && !subtitle.includes("non-ac");
    case "non-ac":
      return subtitle.includes("non ac") || subtitle.includes("non-ac");
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

export const matchesAmenityFilter = (bus: BusListingBus, filterId: string) => {
  const featureTokens = normalizeFeatureTokens(bus);
  const joinedFeatures = featureTokens.join(" ");

  switch (filterId) {
    case "wifi":
      return includesAny(joinedFeatures, ["wifi", "wi-fi"]);
    case "water":
      return includesAny(joinedFeatures, ["water", "bottle"]);
    case "charging":
      return includesAny(joinedFeatures, ["charging", "charger", "usb"]);
    case "blanket":
      return includesAny(joinedFeatures, ["blanket", "linen"]);
    default:
      return true;
  }
};

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

  const departureBucketId = getDepartureBucketId(bus.departure);
  const hasDepartureMatch =
    filters.departureTimeRanges.length === 0 ||
    filters.departureTimeRanges.includes(departureBucketId);

  const hasAmenityMatch =
    filters.amenities.length === 0 ||
    filters.amenities.some((filterId) => matchesAmenityFilter(bus, filterId));

  const operatorName = normalizeText(bus.operator);
  const hasOperatorMatch =
    filters.operators.length === 0 ||
    filters.operators.some((operator) => normalizeText(operator) === operatorName);

  const boardingPoint = normalizeText(bus.from);
  const hasBoardingMatch =
    filters.boardingPoints.length === 0 ||
    filters.boardingPoints.some((point) => normalizeText(point) === boardingPoint);

  const droppingPoint = normalizeText(bus.to);
  const hasDroppingMatch =
    filters.droppingPoints.length === 0 ||
    filters.droppingPoints.some((point) => normalizeText(point) === droppingPoint);

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
