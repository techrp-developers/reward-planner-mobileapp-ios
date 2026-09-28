import React from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import BusBookingStatusPopup, {
  useBusBookingPopup,
} from "../BusBookingStatusPopup";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import { getSeatLayoutApi,
} from "../../services/busBookingApi";
import {
  matchesQuickFilter,
  matchesBusListingFilters,
  createEmptyBusListingFilters,
} from "../../utils/busListingFilters";

type ListingRouteProp = RouteProp<
  BusBookingStackParamList,
  "BusListingScreen"
>;

type FilterChip = {
  id: string;
  label: string;
  opensScreen?: boolean;
};

export type BusCard = {
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

const pickFirstDefined = (source: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
};

const toTimeLabel = (value: unknown) => {
  if (value === undefined || value === null) {
    return "--:--";
  }

  const text = String(value).trim();
  if (!text) {
    return "--:--";
  }

  const match = text.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return text;
  }

  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const toPriceLabel = (value: unknown) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "Rs 0";
  }

  const amount = Number(String(value).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) {
    return `Rs ${String(value)}`;
  }

  return `Rs ${amount.toLocaleString("en-IN")}`;
};

const toSeatLabel = (value: unknown) => {
  const seats = Number(String(value ?? "").replace(/[^\d]/g, ""));
  if (!Number.isFinite(seats) || seats <= 0) {
    return "SEATS AVAILABLE";
  }

  return `${seats} SEATS LEFT`;
};

const toRatingLabel = (value: unknown) => {
  const rating = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(rating) || rating <= 0) {
    return "4.0";
  }

  return rating.toFixed(1);
};

const buildDurationLabel = (
  durationValue: unknown,
  departureValue: unknown,
  arrivalValue: unknown
) => {
  if (durationValue !== undefined && durationValue !== null && String(durationValue).trim()) {
    return String(durationValue).trim();
  }

  const departure = toTimeLabel(departureValue);
  const arrival = toTimeLabel(arrivalValue);
  const departureMatch = departure.match(/^(\d{2}):(\d{2})$/);
  const arrivalMatch = arrival.match(/^(\d{2}):(\d{2})$/);

  if (!departureMatch || !arrivalMatch) {
    return "--";
  }

  let departureMinutes =
    Number(departureMatch[1]) * 60 + Number(departureMatch[2]);
  let arrivalMinutes =
    Number(arrivalMatch[1]) * 60 + Number(arrivalMatch[2]);

  if (arrivalMinutes < departureMinutes) {
    arrivalMinutes += 24 * 60;
  }

  const diff = arrivalMinutes - departureMinutes;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const normalizeFeatures = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 3);
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[|,]/)
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 3);
  }

  return ["LIVE TRACKING", "SAFE TRAVEL"];
};

const normalizeBusCard = (
  bus: any,
  index: number,
  sourceCity: string,
  destinationCity: string
): BusCard => {
  const operator = String(
    pickFirstDefined(bus, [
      "operator",
      "operatorName",
      "travels",
      "travelsName",
      "TravelName",
      "TravelsName",
      "busOperatorName",
      "BusOperatorName",
    ]) ?? `Bus ${index + 1}`
  );

  const subtitle = String(
    pickFirstDefined(bus, [
      "subtitle",
      "busType",
      "BusType",
      "vehicleType",
      "VehicleType",
      "coachType",
      "CoachType",
    ]) ?? "Bus Service"
  );

  const departure = toTimeLabel(
    pickFirstDefined(bus, [
      "departure",
      "departureTime",
      "DepartureTime",
      "startTime",
      "StartTime",
    ])
  );

  const arrival = toTimeLabel(
    pickFirstDefined(bus, [
      "arrival",
      "arrivalTime",
      "ArrivalTime",
      "endTime",
      "EndTime",
    ])
  );

  const from = String(
    pickFirstDefined(bus, [
      "from",
      "sourceName",
      "SourceName",
      "boardingPointName",
      "BoardingPointName",
      "sourceCityName",
    ]) ?? sourceCity
  );

  const to = String(
    pickFirstDefined(bus, [
      "to",
      "destinationName",
      "DestinationName",
      "droppingPointName",
      "DroppingPointName",
      "destinationCityName",
    ]) ?? destinationCity
  );

  const duration = buildDurationLabel(
    pickFirstDefined(bus, ["duration", "Duration", "travelTime", "TravelTime"]),
    departure,
    arrival
  );

const price = toPriceLabel(
  pickFirstDefined(bus, [
    "DisplayFare",
    "displayFare",
    "price",
    "fare",
    "Fare",
    "amount",
    "Amount",
    "finalFare",
    "FinalFare",
  ])
);

  const seatsLeft = toSeatLabel(
    pickFirstDefined(bus, [
      "seatsLeft",
      "availableSeats",
      "AvailableSeats",
      "seatAvailable",
      "SeatAvailable",
      "availableSeatCount",
    ])
  );

  const rating = toRatingLabel(
    pickFirstDefined(bus, ["rating", "ratings", "Rating", "Ratings"])
  );

  const features = normalizeFeatures(
    pickFirstDefined(bus, ["features", "amenities", "Amenities"])
  );

  const about = String(
    pickFirstDefined(bus, ["about", "description", "Description"]) ??
      `About Bus: ${operator} - ${subtitle}.`
  );

  const id = String(
    pickFirstDefined(bus, [
      "id",
      "busId",
      "BusId",
      "serviceId",
      "ServiceId",
      "travelsId",
      "TravelsId",
    ]) ?? `${operator}-${departure}-${index}`
  );

  const normalizedCard = {
    id,
    operator,
    subtitle,
    departure,
    arrival,
    from,
    to,
    duration,
    price,
    seatsLeft,
    rating,
    features,
    about,
    topRated: Number(rating) >= 4.5,
    raw: bus,
  };

  console.log("[BusBooking][Listing] Normalized bus", {
    index,
    rawBus: bus,
    normalizedCard,
  });

  return normalizedCard;
};

const filterChips: FilterChip[] = [
  { id: "all", label: "All" },
  { id: "ac", label: "AC" },
  { id: "sleeper", label: "Sleeper" },
  { id: "seater", label: "Seater" },
];

const busCards: BusCard[] = [
  {
    id: "1",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["BEST PRICE GUARANTEED", "FREE WIFI", "LIVE TRACKING"],
    about: "About Bus: Clean sleeper coach with smooth ride and punctual service.",
    topRated: true,
  },
  {
    id: "2",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["CHARGING POINT", "BLANKET", "WATER BOTTLE"],
    about: "About Bus: Comfortable AC bus with neat seats and reliable night travel.",
  },
  {
    id: "3",
    operator: "Bharat Express",
    subtitle: "Volvo AC Sleeper (2+1)",
    departure: "22:00",
    arrival: "06:45",
    from: "Mumbai, Borivali",
    to: "Pune, Swargate",
    duration: "8h 45m",
    price: "Rs 1,250",
    seatsLeft: "2 SEATS LEFT",
    rating: "4.5",
    features: ["LIVE TRACKING", "USB CHARGER", "EMERGENCY SUPPORT"],
    about: "About Bus: Trusted operator bus with good seating and easy boarding.",
  },
  {
    id: "4",
    operator: "Orange Tours",
    subtitle: "Volvo Multi Axle Seater (2+2)",
    departure: "21:30",
    arrival: "05:50",
    from: "Mumbai, Andheri",
    to: "Pune, Wakad",
    duration: "8h 20m",
    price: "Rs 440",
    seatsLeft: "12 SEATS LEFT",
    rating: "4.3",
    features: ["FREE WIFI", "READING LIGHT", "FRESH LINEN"],
    about: "About Bus: Spacious seater bus suited for budget-friendly city travel.",
  },
  {
    id: "5",
    operator: "Sharma Travels",
    subtitle: "AC Seater 2+2",
    departure: "23:15",
    arrival: "06:55",
    from: "Mumbai, Dadar",
    to: "Pune, Shivaji Nagar",
    duration: "7h 40m",
    price: "Rs 440",
    seatsLeft: "10 SEATS LEFT",
    rating: "4.6",
    features: ["BEST PRICE GUARANTEED", "FEMALE FRIENDLY", "LIVE TRACKING"],
    about: "About Bus: Popular seater option with safe and comfortable seating.",
    topRated: true,
  },
  {
    id: "6",
    operator: "IntrCity SmartBus",
    subtitle: "Bharat Benz AC Sleeper",
    departure: "20:45",
    arrival: "05:15",
    from: "Mumbai, Sion",
    to: "Pune, Hinjewadi",
    duration: "8h 30m",
    price: "Rs 1,099",
    seatsLeft: "3 SEATS LEFT",
    rating: "4.4",
    features: ["SANITIZED BUS", "CHARGING POINT", "FREE WIFI"],
    about: "About Bus: Premium sleeper bus with well-maintained interior and comfort.",
  },
];

export default function BusListingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const { popup, showPopup, hidePopup } = useBusBookingPopup();
  const route = useRoute<ListingRouteProp>();
 const {
  buses,
  emptyStateMessage,
  traceId,
  sourceCity,
  destinationCity,
  sourceCityCode,
  destinationCityCode,
  journeyDate,
  journeyTime,
  isWomenBooking,
} = route.params;
console.log(
  "[BusBooking][Listing] Route Params",
  {
    traceId,
    sourceCity,
    destinationCity,
    sourceCityCode,
    destinationCityCode,
    journeyDate,
    journeyTime,
  }
);

  const [selectedFilter, setSelectedFilter] = React.useState<string>("all");
  const [selectedFiltersList, setSelectedFiltersList] = React.useState<string[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    if (route.params?.selectedFilters) {
      setSelectedFiltersList(route.params.selectedFilters);
      setSelectedFilter("all");
    }
  }, [route.params?.selectedFilters]);

  const [
    seatLayoutLoadingBusId,
    setSeatLayoutLoadingBusId,
  ] = React.useState<string | null>(null);

  const listingBuses = React.useMemo(() => {
    let filtered: BusCard[] = [];

    if (Array.isArray(buses) && buses.length > 0) {
      filtered = buses.map((bus, index) =>
        normalizeBusCard(bus, index, sourceCity, destinationCity)
      );
      console.log("[BusBooking][Listing] Normalized API buses", {
        count: filtered.length,
        sourceCity,
        destinationCity,
        journeyDate,
      });
    } else if (Array.isArray(buses) && buses.length === 0) {
      filtered = [];
    } else {
      // Never present demo inventory as bookable inventory in production.
      filtered = [];
    }

    // 1. Apply quick filter chips (AC, Sleeper, Seater)
    if (selectedFilter && selectedFilter !== "all") {
      filtered = filtered.filter((bus) => matchesQuickFilter(bus, selectedFilter));
    }

    // 2. Apply detailed filters from AllFilterScreen
    if (selectedFiltersList.length > 0) {
      const activeFilters = createEmptyBusListingFilters();

      selectedFiltersList.forEach((id) => {
        if (["volvo", "ac", "non-ac"].includes(id)) {
          activeFilters.busTypes.push(id);
        } else if (["seater", "sleeper"].includes(id)) {
          activeFilters.seatTypes.push(id);
        } else if (["before-6", "6-12", "12-6", "after-6"].includes(id)) {
          activeFilters.departureTimeRanges.push(id);
        } else if (["wifi", "water", "charging", "blanket"].includes(id)) {
          activeFilters.amenities.push(id);
        } else if (["greenline", "blue-diamond", "royal-heritage"].includes(id)) {
          const operatorMap: Record<string, string> = {
            greenline: "Greenline Express",
            "blue-diamond": "Blue Diamond",
            "royal-heritage": "Royal Heritage",
          };
          activeFilters.operators.push(operatorMap[id] || id);
        } else if (id.startsWith("boarding-")) {
          const boardingMap: Record<string, string> = {
            "boarding-majestic": "Majestic",
            "boarding-indiranagar": "Indiranagar",
            "boarding-electronic": "Electronic City",
            "boarding-marathahalli": "Marathahalli",
            "boarding-hebbal": "Hebbal",
            "boarding-silk-board": "Silk Board",
            "boarding-koramangala": "Koramangala",
          };
          activeFilters.boardingPoints.push(boardingMap[id] || id);
        } else if (id.startsWith("dropping-")) {
          const droppingMap: Record<string, string> = {
            "dropping-majestic": "Majestic",
            "dropping-indiranagar": "Indiranagar",
            "dropping-electronic": "Electronic City",
            "dropping-marathahalli": "Marathahalli",
            "dropping-hebbal": "Hebbal",
            "dropping-silk-board": "Silk Board",
            "dropping-koramangala": "Koramangala",
          };
          activeFilters.droppingPoints.push(droppingMap[id] || id);
        }
      });

      filtered = filtered.filter((bus) => matchesBusListingFilters(bus, activeFilters));
    }

    return filtered;
  }, [buses, destinationCity, journeyDate, sourceCity, selectedFilter, selectedFiltersList]);

  const routeTitle = `${sourceCity} -> ${destinationCity}`;

  const routeMeta = React.useMemo(() => {
    const date = journeyDate ? new Date(journeyDate) : null;
    const formattedDate =
      date && !Number.isNaN(date.getTime())
        ? date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
          }).toUpperCase()
        : journeyDate;

    return `${formattedDate} - ${listingBuses.length} BUSES`;
  }, [journeyDate, listingBuses.length]);

  const handleFilterPress = React.useCallback(
    (item: FilterChip) => {
      if (item.id === "all") {
        navigation.navigate("AllFilterScreen", {
          selectedOptions: selectedFiltersList,
        });
      } else {
        setSelectedFilter(item.id);
      }
    },
    [navigation, selectedFiltersList]
  );

const handleOpenSeatSelection =
  React.useCallback(
    async (bus: BusCard) => {

      /*
      |--------------------------------------------------------------------------
      | Original Search API Bus
      |--------------------------------------------------------------------------
      */

      const rawBus =
        bus.raw || {};


      const srdvIndex =
        rawBus?.SrdvIndex ??
        rawBus?.srdvIndex;


      const resultIndex =
        rawBus?.ResultIndex ??
        rawBus?.resultIndex;


      console.log(
        "===================================="
      );

      console.log(
        "[BusBooking][Listing] VIEW SEATS CLICKED"
      );

      console.log(
        "Bus:",
        bus.operator
      );

      console.log(
        "TraceId:",
        traceId
      );

      console.log(
        "SrdvIndex:",
        srdvIndex
      );

      console.log(
        "ResultIndex:",
        resultIndex
      );

      console.log(
        "===================================="
      );


      /*
      |--------------------------------------------------------------------------
      | Validation
      |--------------------------------------------------------------------------
      */

      if (!traceId) {

        showPopup({
          title: "Seat Layout Error",
          message: "TraceId is missing. Please search buses again.",
          variant: "error",
        });

        return;
      }


      if (
        srdvIndex === undefined ||
        srdvIndex === null ||
        String(srdvIndex).trim() === ""
      ) {

        showPopup({
          title: "Seat Layout Error",
          message: "SrdvIndex is missing for this bus.",
          variant: "error",
        });

        return;
      }


      if (
        resultIndex === undefined ||
        resultIndex === null ||
        String(resultIndex).trim() === ""
      ) {

        showPopup({
          title: "Seat Layout Error",
          message: "ResultIndex is missing for this bus.",
          variant: "error",
        });

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | Payload
      |--------------------------------------------------------------------------
      */

      const payload = {

        traceId:
          String(traceId),

        srdvIndex:
          String(srdvIndex),

        resultIndex:
          String(resultIndex),
      };


      console.log(
        "[BusBooking][Listing] Seat Layout Payload",
        payload
      );


      try {

        setSelectedBusId(
          bus.id
        );

        setSeatLayoutLoadingBusId(
          bus.id
        );


        /*
        |--------------------------------------------------------------------------
        | Call GetSeatLayout API
        |--------------------------------------------------------------------------
        */

        const response =
          await getSeatLayoutApi(
            payload
          );


        console.log(
          "[BusBooking][Listing] Seat Layout Success",
          {
            totalSeats:
              response.totalSeats,

            availableSeats:
              response.availableSeats,

            traceId:
              response.traceId,

            srdvIndex:
              response.srdvIndex,

            resultIndex:
              response.resultIndex,
          }
        );


        /*
        |--------------------------------------------------------------------------
        | Open Seat Selection
        |--------------------------------------------------------------------------
        */

        navigation.navigate(
          "SeatSelectionScreen",
          {
            bus,
            seatLayout:
              response,
            isWomenBooking,
          }
        );


      } catch (error: any) {

        console.log(
          "[BusBooking][Listing] Seat Layout Error",
          {
            message:
              error?.message,

            error,
          }
        );


        showPopup({
          title: "Unable to Load Seats",
          message: error?.message || "Unable to fetch seat layout.",
          variant: "error",
        });


      } finally {

        setSeatLayoutLoadingBusId(
          null
        );
      }
    },

    [
      navigation,
      traceId,
    ]
  );

  const handleOpenAboutBus = React.useCallback(
    (bus: BusCard) => {
      navigation.navigate("AboutBusScreen", { bus });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.headerIconButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={34} color="#6F6F75" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.routeTitle}>{routeTitle}</Text>
          <Text style={styles.routeMeta}>{routeMeta}</Text>
        </View>

        <View style={styles.headerActions} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>{listingBuses.length} Buses found</Text>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.sortText}>Sort by: Rating</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filterChips.map((item) => {
            const isSelected = selectedFilter === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                onPress={() => handleFilterPress(item)}
                style={[styles.filterChip, isSelected ? styles.filterChipActive : null]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected ? styles.filterChipTextActive : null,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.cardsList}>
          {listingBuses.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <View style={styles.emptyStateIconWrap}>
                <MaterialCommunityIcons
                  name="bus-alert"
                  size={28}
                  color="#D61A33"
                />
              </View>
              <Text style={styles.emptyStateTitle}>No buses found</Text>
              <Text style={styles.emptyStateMessage}>
                {emptyStateMessage || "Buses not found for this route."}
              </Text>
              <Text style={styles.emptyStateHint}>
                Try another date or choose a different route.
              </Text>
            </View>
          ) : null}

          {listingBuses.map((item) => {
            const isHighlighted = selectedBusId === item.id;

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.9}
                onPress={() => setSelectedBusId(item.id)}
                style={[styles.busCard, isHighlighted ? styles.busCardHighlighted : null]}
              >
                <View style={styles.busCardBody}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.cardTitleWrap}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.operatorText}>{item.operator}</Text>
                        {item.topRated ? (
                          <View style={styles.topRatedBadge}>
                            <Text style={styles.topRatedText}>TOP RATED</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.subtitleText}>{item.subtitle}</Text>
                    </View>

                    <View
                      style={[
                        styles.ratingPill,
                        isHighlighted ? styles.ratingPillHighlighted : null,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="star"
                        size={14}
                        color={isHighlighted ? "#FFC94A" : "#FFFFFF"}
                      />
                      <Text
                        style={[
                          styles.ratingText,
                          isHighlighted ? styles.ratingTextHighlighted : null,
                        ]}
                      >
                        {item.rating}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.timingRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.timeText}>{item.departure}</Text>
                      <Text style={styles.placeText}>{item.from}</Text>
                    </View>

                    <View style={styles.durationWrap}>
                      <Text style={styles.durationText}>{item.duration}</Text>
                      <View style={styles.durationLineRow}>
                        <View style={styles.durationDot} />
                        <View
                          style={[
                            styles.durationLine,
                            isHighlighted ? styles.durationLineHighlighted : null,
                          ]}
                        />
                        <View
                          style={[
                            styles.durationDot,
                            isHighlighted ? styles.durationDotHighlighted : null,
                          ]}
                        />
                      </View>
                    </View>

                    <View style={[styles.timeBlock, styles.timeBlockRight]}>
                      <Text style={styles.timeText}>{item.arrival}</Text>
                      <Text style={styles.placeText}>{item.to}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBottomRow}>
                    <View>
                      <Text style={styles.priceText}>{item.price}</Text>
                      <Text style={styles.seatsText}>{item.seatsLeft}</Text>
                    </View>

  <TouchableOpacity
  activeOpacity={0.9}

  disabled={
    seatLayoutLoadingBusId ===
    item.id
  }

  onPress={() =>
    handleOpenSeatSelection(
      item
    )
  }
                      style={[
                        styles.seatsButton,
                        isHighlighted ? styles.seatsButtonHighlighted : null,
                      ]}
                    >
{seatLayoutLoadingBusId ===
item.id ? (

  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    }}
  >

    <ActivityIndicator
      size="small"
      color={
        isHighlighted
          ? "#FFFFFF"
          : "#D61A33"
      }
    />

    <Text
      style={[
        styles.seatsButtonText,

        isHighlighted
          ? styles
              .seatsButtonTextHighlighted
          : null,
      ]}
    >
      Loading...
    </Text>

  </View>

) : (

  <Text
    style={[
      styles.seatsButtonText,

      isHighlighted
        ? styles
            .seatsButtonTextHighlighted
        : null,
    ]}
  >
    View Seats
  </Text>

)}
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  style={[
                    styles.highlightFooter,
                    isHighlighted ? styles.highlightFooterSelected : null,
                  ]}
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenAboutBus(item)}
                  >
                    <Text style={styles.aboutBusLink}>About Bus</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      <BusBookingStatusPopup
        visible={popup.visible}
        title={popup.title}
        message={popup.message}
        variant={popup.variant}
        buttonText={popup.buttonText}
        onClose={hidePopup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBF8F4",
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitleWrap: {
    flex: 1,
    paddingLeft: 6,
  },
  routeTitle: {
    color: "#3C3C43",
    fontSize: 21,
    fontWeight: "700",
  },
  routeMeta: {
    marginTop: 4,
    color: "#6D6D73",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  profileButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6E7F89",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
  },
  resultsRow: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  resultsText: {
    color: "#4B4B52",
    fontSize: 13,
    fontWeight: "700",
  },
  sortText: {
    color: "#446EF2",
    fontSize: 13,
    fontWeight: "600",
  },
  filtersRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
  },
  filterChip: {
    minWidth: 42,
    paddingHorizontal: 15,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFD8D8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F8BABA",
  },
  filterChipActive: {
    backgroundColor: "#CF1833",
    borderColor: "#CF1833",
  },
  filterChipText: {
    color: "#8E6D6D",
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  cardsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 14,
    marginBottom: 30,
  },
  emptyStateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F3D7DC",
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  emptyStateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FDECEF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyStateTitle: {
    color: "#2E2E33",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyStateMessage: {
    marginTop: 10,
    color: "#5C5C66",
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyStateHint: {
    marginTop: 10,
    color: "#8C8C94",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
  },
  busCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E8E2DA",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  busCardHighlighted: {
    borderColor: "#E41C36",
  },
  busCardBody: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardTitleWrap: {
    flex: 1,
    paddingRight: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  operatorText: {
    color: "#4A4A50",
    fontSize: 14,
    fontWeight: "700",
  },
  topRatedBadge: {
    marginLeft: 8,
    backgroundColor: "#97E4FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  topRatedText: {
    color: "#0078A6",
    fontSize: 8,
    fontWeight: "800",
  },
  subtitleText: {
    marginTop: 4,
    color: "#8F8F95",
    fontSize: 11,
    fontWeight: "500",
  },
  ratingPill: {
    minWidth: 52,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#6B6B70",
    borderWidth: 1,
    borderColor: "#6B6B70",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  ratingPillHighlighted: {
    backgroundColor: "#6B6B70",
    borderColor: "#6B6B70",
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  ratingTextHighlighted: {
    color: "#FFFFFF",
  },
  timingRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  timeBlock: {
    width: 82,
  },
  timeBlockRight: {
    alignItems: "flex-end",
  },
  timeText: {
    color: "#4A4A50",
    fontSize: 20,
    fontWeight: "800",
  },
  placeText: {
    marginTop: 2,
    color: "#5E5E63",
    fontSize: 11,
    fontWeight: "500",
  },
  durationWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  durationText: {
    color: "#8D8D92",
    fontSize: 9,
    fontWeight: "500",
  },
  durationLineRow: {
    marginTop: 5,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  durationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E0E0E0",
  },
  durationDotHighlighted: {
    backgroundColor: "#B90F28",
  },
  durationLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E5E8",
  },
  durationLineHighlighted: {
    backgroundColor: "#D31A33",
  },
  cardBottomRow: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  priceText: {
    color: "#424248",
    fontSize: 17,
    fontWeight: "800",
  },
  seatsText: {
    marginTop: 3,
    color: "#E0283B",
    fontSize: 10,
    fontWeight: "800",
  },
  seatsButton: {
    minWidth: 146,
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FF3550",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  seatsButtonHighlighted: {
    backgroundColor: "#D61A33",
    borderColor: "#D61A33",
  },
  seatsButtonText: {
    color: "#E11C35",
    fontSize: 22 / 1.5,
    fontWeight: "700",
  },
  seatsButtonTextHighlighted: {
    color: "#FFFFFF",
  },
  highlightFooter: {
    minHeight: 38,
    backgroundColor: "#FFF2F3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: "#F2D5D9",
  },
  highlightFooterSelected: {
    backgroundColor: "#FFF2F3",
    borderTopColor: "#F2D5D9",
  },
  aboutBusLink: {
    color: "#2D6BFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
