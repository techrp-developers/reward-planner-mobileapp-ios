import React from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Switch,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import LinearGradient from "react-native-linear-gradient";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BusFrame1 from "../../assets/banners/busframe1.svg";
import BusFrame2 from "../../assets/banners/busframe2.svg";
import ExclusiveOfferBooking from "../../assets/banners/exclusiveofferbooking.svg";
import BusBookingStatusPopup, {
  useBusBookingPopup,
} from "../BusBookingStatusPopup";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";

import {
  searchCitiesApi,
  searchBusesApi,
  type City,
} from "../../services/busBookingApi";
import {
  loadRecentSearches,
  saveRecentSearch,
  type StoredRecentSearch,
} from "../../utils/busBookingStorage";

type DateChip = {
  id: string;
  day: string;
  date: string;
  active?: boolean;
  fullLabel?: string;
  isPlaceholder?: boolean;
  isDisabled?: boolean;
  isWeekend?: boolean;
};

type CalendarMonth = {
  key: string;
  title: string;
  chips: DateChip[];
};

type Journey = {
  route: string;
  time: string;
  ticket: string;
};

type PopularRoute = {
  id: string;
  illustration: "frame1" | "frame2";
};

const nextJourney: Journey = {
  route: "Mumbai to Pune",
  time: "22:45",
  ticket: "BG-99281",
};

const popularRoutes: PopularRoute[] = [
  {
    id: "goa",
    illustration: "frame1",
  },
  {
    id: "nashik",
    illustration: "frame2",
  },
  {
    id: "indore",
    illustration: "frame1",
  },
];

const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const buildCalendarMonths = (): CalendarMonth[] => {
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth();
  const todayId = `${baseYear}-${String(baseMonth + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  return Array.from({ length: 2 }, (_, offset) => {
    const currentMonthDate = new Date(baseYear, baseMonth + offset, 1);
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const monthTitle = currentMonthDate.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const jsWeekday = new Date(year, month, 1).getDay();
    const mondayFirstIndex = (jsWeekday + 6) % 7;

    const placeholders: DateChip[] = Array.from({ length: mondayFirstIndex }, (_, index) => ({
      id: `placeholder-${year}-${month}-${index}`,
      day: "",
      date: "",
      isPlaceholder: true,
    }));

    const monthDays: DateChip[] = Array.from({ length: daysInMonth }, (_, index) => {
      const dayNumber = index + 1;
      const currentDate = new Date(year, month, dayNumber);
      const dateId = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
      const dayOfWeek = currentDate.getDay();

      return {
        id: dateId,
        day: currentDate.toLocaleString("en-US", { weekday: "short" }),
        date: String(dayNumber),
        active: dateId === todayId,
        fullLabel: currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        isDisabled: offset === 0 && currentDate < new Date(baseYear, baseMonth, now.getDate()),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      };
    });

    return {
      key: `${year}-${month}`,
      title: monthTitle,
      chips: [...placeholders, ...monthDays],
    };
  });
};

const formatRecentSearchTime = (updatedAt: string) => {
  const timestamp = new Date(updatedAt).getTime();
  if (Number.isNaN(timestamp)) {
    return "Recently searched";
  }

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) {
    const minutes = Math.max(1, Math.floor(diffMs / minute));
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  if (diffMs < day) {
    const hours = Math.max(1, Math.floor(diffMs / hour));
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.max(1, Math.floor(diffMs / day));
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const formatJourneyDateLabel = (journeyDate: string) => {
  const parsed = new Date(journeyDate);

  if (Number.isNaN(parsed.getTime())) {
    return journeyDate;
  }

  return parsed.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function BookingHomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const routeCardWidth = Math.min(150, width * 0.41);
  const routeCardHeight = Math.round((routeCardWidth * 197) / 162);
  const { popup, showPopup, hidePopup } = useBusBookingPopup();
  const calendarMonths = React.useMemo(
    () => buildCalendarMonths(),
    []
  );
  const dateChips = React.useMemo(
    () => calendarMonths.flatMap((month) => month.chips),
    [calendarMonths]
  );

  const defaultSelectedDateId =
    dateChips.find((chip) => chip.active)?.id ??
    dateChips.find((chip) => !chip.isPlaceholder && !chip.isDisabled)?.id ??
    "";
  const [selectedDateId, setSelectedDateId] = React.useState(defaultSelectedDateId);

  // sakshi edits
const [fromCity, setFromCity] =
  React.useState<City | null>(null);

const [toCity, setToCity] =
  React.useState<City | null>(null);


/*
|--------------------------------------------------------------------------
| City Modal
|--------------------------------------------------------------------------
*/

const [cityModalVisible, setCityModalVisible] =
  React.useState(false);

const [cityPickerType, setCityPickerType] =
  React.useState<"from" | "to">("from");

const [citySearchText, setCitySearchText] =
  React.useState("");

const [cityResults, setCityResults] =
  React.useState<City[]>([]);

const [cityLoading, setCityLoading] =
  React.useState(false);


/*
|--------------------------------------------------------------------------
| Journey Time
|--------------------------------------------------------------------------
*/

const journeyTime = "18:00";

const [dateModalVisible, setDateModalVisible] =
  React.useState(false);


/*
|--------------------------------------------------------------------------
| Bus Search Loading
|--------------------------------------------------------------------------
*/

const [searchingBuses, setSearchingBuses] =
  React.useState(false);
const [isWomenBooking, setIsWomenBooking] =
  React.useState(false);
const [recentSearches, setRecentSearches] =
  React.useState<StoredRecentSearch[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;

      const hydrateRecentSearches = async () => {
        try {
          const searches = await loadRecentSearches();

          if (mounted) {
            setRecentSearches(searches);
          }
        } catch (error) {
          console.log("[BusBooking][Home] Failed to load recent searches", error);
        }
      };

      hydrateRecentSearches();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const selectedChip = React.useMemo(
    () =>
      dateChips.find((chip) => chip.id === selectedDateId) ??
      dateChips.find((chip) => !chip.isPlaceholder && !chip.isDisabled),
    [dateChips, selectedDateId]
  );

  const todayChip = React.useMemo(
    () => dateChips.find((chip) => chip.active),
    [dateChips]
  );

  const tomorrowChip = React.useMemo(() => {
    const todayIndex = dateChips.findIndex((chip) => chip.id === todayChip?.id);
    if (todayIndex < 0) {
      return dateChips.find((chip) => !chip.isPlaceholder && !chip.isDisabled && chip.id !== todayChip?.id);
    }
    return dateChips
      .slice(todayIndex + 1)
      .find((chip) => !chip.isPlaceholder && !chip.isDisabled);
  }, [dateChips, todayChip]);

  const journeyDateText = React.useMemo(() => {
    if (!selectedChip) {
      return "";
    }

    const selectedDate = new Date(selectedChip.id);
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  }, [selectedChip]);

  const renderRouteIllustration = (illustration: PopularRoute["illustration"]) => {
    const Illustration = illustration === "frame1" ? BusFrame1 : BusFrame2;
    return <Illustration width="100%" height="100%" />;
  };

const openCityPicker = (
  type: "from" | "to"
) => {
  console.log("[BusBooking][Home] Open city picker", {
    type,
  });

  setCityPickerType(type);

  setCitySearchText("");

  setCityResults([]);

  setCityModalVisible(true);
};

const handleCitySearch = async (
  text: string
) => {
  console.log("[BusBooking][Home] City search input", {
    cityPickerType,
    text,
  });

  setCitySearchText(text);

  if (text.trim().length < 2) {
    console.log("[BusBooking][Home] City search skipped", {
      reason: "less_than_2_characters",
      text,
    });

    setCityResults([]);

    return;
  }


  try {

    setCityLoading(true);

    const cities =
      await searchCitiesApi(
        text.trim()
      );

    console.log("[BusBooking][Home] City search success", {
      cityPickerType,
      query: text.trim(),
      resultCount: cities.length,
      cities,
    });

    setCityResults(cities);

  } catch (error: any) {
    console.log("[BusBooking][Home] City search failed", {
      cityPickerType,
      query: text.trim(),
      error: error?.message || error,
    });

    showPopup({
      title: "City Search",
      message: error.message || "Unable to search cities",
      variant: "error",
    });

  } finally {

    setCityLoading(false);
  }
};

const handleSelectCity = (city: City) => {

  if (
    city.city_type?.toUpperCase() !== "CITY"
  ) {

    showPopup({
      title: "Select City",
      message: "Please select a city, not a local area.",
      variant: "warning",
    });

    return;
  }


  if (cityPickerType === "from") {

    setFromCity(city);

  } else {

    setToCity(city);
  }


  setCityModalVisible(false);
};

const applyRecentSearch = React.useCallback(
  (item: StoredRecentSearch) => {
    setFromCity({
      id: item.fromCityCode,
      city_name: item.fromCityName,
      state_name: item.fromStateName,
      city_type: "CITY",
    });

    setToCity({
      id: item.toCityCode,
      city_name: item.toCityName,
      state_name: item.toStateName,
      city_type: "CITY",
    });

    const matchingChip = dateChips.find(
      (chip) =>
        chip.id === item.journeyDate &&
        !chip.isPlaceholder &&
        !chip.isDisabled
    );

    if (matchingChip) {
      setSelectedDateId(matchingChip.id);
    }
  },
  [dateChips]
);

const handleSearchBuses = async () => {
  const now = new Date();
  const todayId = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  let computedJourneyTime = "00:00";
  if (selectedDateId === todayId) {
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    computedJourneyTime = `${hours}:${minutes}`;
  }

  console.log("[BusBooking][Home] Search button pressed", {
    fromCity,
    toCity,
    selectedDateId,
    journeyTime: computedJourneyTime,
  });

  /*
  |--------------------------------------------------------------------------
  | Validation
  |--------------------------------------------------------------------------
  */

  if (!fromCity) {

    showPopup({
      title: "Select Source",
      message: "Please select From city.",
      variant: "warning",
    });

    return;
  }


  if (!toCity) {

    showPopup({
      title: "Select Destination",
      message: "Please select To city.",
      variant: "warning",
    });

    return;
  }


  if (
    String(fromCity.id) ===
    String(toCity.id)
  ) {

    showPopup({
      title: "Invalid Route",
      message: "From and To city cannot be same.",
      variant: "warning",
    });

    return;
  }


  if (!selectedDateId) {

    showPopup({
      title: "Select Date",
      message: "Please select journey date.",
      variant: "warning",
    });

    return;
  }


  if (!computedJourneyTime) {

    showPopup({
      title: "Select Time",
      message: "Please select journey time.",
      variant: "warning",
    });

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | DEBUG FRONTEND VALUES
  |--------------------------------------------------------------------------
  */

  console.log("==================================");
  console.log("BUS SEARCH FRONTEND PAYLOAD");
  console.log("From city object:", fromCity);
  console.log("To city object:", toCity);
  console.log("From code:", fromCity?.id);
  console.log("To code:", toCity?.id);
  console.log("Journey Date:", selectedDateId);
  console.log("Journey Time:", computedJourneyTime);
  console.log("==================================");
  try {

    setSearchingBuses(true);


    /*
    |--------------------------------------------------------------------------
    | Request Payload
    |--------------------------------------------------------------------------
    */

    const payload = {

      sourceCityCode:
        String(fromCity.id),

      destinationCityCode:
        String(toCity.id),

      journeyDate:
        selectedDateId,

      journeyTime:
        computedJourneyTime,
    };


    console.log(
      "[BusBooking][Home] Bus Search Payload",
      payload
    );


    /*
    |--------------------------------------------------------------------------
    | Call Backend
    |--------------------------------------------------------------------------
    */

    const response =
      await searchBusesApi(
        payload
      );

    const recentSearchPayload: StoredRecentSearch = {
      id: `${String(fromCity.id)}-${String(toCity.id)}`,
      fromCityCode: String(fromCity.id),
      fromCityName: fromCity.city_name,
      fromStateName: fromCity.state_name || "",
      toCityCode: String(toCity.id),
      toCityName: toCity.city_name,
      toStateName: toCity.state_name || "",
      journeyDate: selectedDateId,
      journeyTime: computedJourneyTime,
      updatedAt: new Date().toISOString(),
    };

    await saveRecentSearch(recentSearchPayload);
    setRecentSearches(await loadRecentSearches());


    console.log(
      "[BusBooking][Home] Bus Search Response",
      response
    );


    /*
    |--------------------------------------------------------------------------
    | No buses
    |--------------------------------------------------------------------------
    */

    if (
      !response.buses ||
      response.buses.length === 0
    ) {
      console.log("[BusBooking][Home] No buses found", {
        payload,
        response,
      });

      navigation.navigate(
        "BusListingScreen",
        {
          buses: [],
          emptyStateMessage:
            response.message ||
            "Buses not found for this route.",
          traceId:
            response.traceId,
          sourceCity:
            fromCity.city_name,
          destinationCity:
            toCity.city_name,
          sourceCityCode:
            String(fromCity.id),
          destinationCityCode:
            String(toCity.id),
          journeyDate:
            selectedDateId,
          journeyTime:
            computedJourneyTime,
          isWomenBooking:
            isWomenBooking,
        }
      );

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | Go to listing
    |--------------------------------------------------------------------------
    */

    navigation.navigate(
      "BusListingScreen",
      {

        buses:
          response.buses,

        traceId:
          response.traceId,

        sourceCity:
          fromCity.city_name,

        destinationCity:
          toCity.city_name,

        sourceCityCode:
          String(fromCity.id),

        destinationCityCode:
          String(toCity.id),

        journeyDate:
          selectedDateId,

        journeyTime:
          computedJourneyTime,

        isWomenBooking:
          isWomenBooking,
      }
    );

    console.log("[BusBooking][Home] Navigate to listing", {
      busCount: response.buses.length,
      traceId: response.traceId,
      sourceCity: fromCity.city_name,
      destinationCity: toCity.city_name,
      journeyDate: selectedDateId,
      journeyTime: computedJourneyTime,
    });


  } catch (error: any) {
    const errorMessage =
      String(
        error?.message || ""
      ).trim();

    const normalizedErrorMessage =
      errorMessage.toLowerCase();

    console.log(
      "[BusBooking][Home] Search Buses Error",
      {
        message: errorMessage,
        error,
      }
    );

    if (
      normalizedErrorMessage.includes("no data found for this route") ||
      normalizedErrorMessage.includes("no buses found")
    ) {
      navigation.navigate(
        "BusListingScreen",
        {
          buses: [],
          emptyStateMessage:
            errorMessage ||
            "Buses not found for this route.",
          traceId:
            null,
          sourceCity:
            fromCity?.city_name || "",
          destinationCity:
            toCity?.city_name || "",
          sourceCityCode:
            String(fromCity?.id || ""),
          destinationCityCode:
            String(toCity?.id || ""),
          journeyDate:
            selectedDateId,
          journeyTime:
            computedJourneyTime,
          isWomenBooking:
            isWomenBooking,
        }
      );

      return;
    }


    showPopup({
      title: "Search Failed",
      message: errorMessage || "Unable to search buses.",
      variant: "error",
    });


  } finally {

    setSearchingBuses(false);
  }
};

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, 16) + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchCard}>
        <View style={styles.inputStack}>
          <View style={styles.routeSection}>
<TouchableOpacity
  activeOpacity={0.85}
  style={styles.routeRow}
  onPress={() =>
    openCityPicker("from")
  }
>

  <MaterialCommunityIcons
    name="map-marker-radius-outline"
    size={20}
    color="#444444"
  />

  <View style={styles.routeTextWrap}>

    <Text style={styles.routeLabel}>
      From
    </Text>

    <Text
      style={[
        styles.routeValue,

        !fromCity &&
          styles.routeValuePlaceholder,
      ]}
    >
      {
        fromCity
          ? fromCity.city_name
          : "Select source city"
      }
    </Text>

    {fromCity?.state_name ? (
      <Text style={styles.routeState}>
        {fromCity.state_name}
      </Text>
    ) : null}

  </View>

</TouchableOpacity>

            <View
              pointerEvents="box-none"
              style={styles.swapButtonWrap}
            >
<TouchableOpacity
  activeOpacity={0.85}
  style={styles.swapButton}
  onPress={() => {

    const oldFrom =
      fromCity;

    setFromCity(toCity);

    setToCity(oldFrom);
  }}
>

  <MaterialCommunityIcons
    name="swap-vertical"
    size={20}
    color="#FFFFFF"
  />

</TouchableOpacity>
            </View>

            <View style={styles.routeDivider} />

<TouchableOpacity
  activeOpacity={0.85}
  style={styles.routeRow}
  onPress={() =>
    openCityPicker("to")
  }
>

  <MaterialCommunityIcons
    name="map-marker-check-outline"
    size={20}
    color="#444444"
  />

  <View style={styles.routeTextWrap}>

    <Text style={styles.routeLabel}>
      To
    </Text>

    <Text
      style={[
        styles.routeValue,

        !toCity &&
          styles.routeValuePlaceholder,
      ]}
    >
      {
        toCity
          ? toCity.city_name
          : "Select destination city"
      }
    </Text>

    {toCity?.state_name ? (
      <Text style={styles.routeState}>
        {toCity.state_name}
      </Text>
    ) : null}

  </View>

</TouchableOpacity>
          </View>

        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.dateJourneyRow}
          onPress={() => setDateModalVisible(true)}
        >
          <View style={styles.dateJourneyInfo}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={18}
              color="#444444"
            />
            <View style={styles.dateJourneyTextWrap}>
              <Text style={styles.dateJourneyLabel}>Date of Journey</Text>
              <Text style={styles.dateJourneyValue}>{journeyDateText}</Text>
              <Text style={styles.dateJourneyHint}>Tap to choose travel date</Text>
            </View>
          </View>

          <View style={styles.dateJourneyAction}>
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                {selectedDateId === todayChip?.id
                  ? "Today"
                  : selectedDateId === tomorrowChip?.id
                    ? "Tomorrow"
                    : selectedChip?.fullLabel?.split(",").slice(1).join(",").trim() || "Upcoming"}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color="#666666"
            />
          </View>
        </TouchableOpacity>
      </View>
      </View>

      <View style={styles.womenBookingRow}>
        <View style={styles.womenBookingLeft}>
          <MaterialCommunityIcons
            name="face-woman"
            size={24}
            color="#CE1538"
          />
          <View style={styles.womenBookingText}>
            <Text style={styles.womenBookingTitle}>Booking for Women</Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsWomenBooking(!isWomenBooking)}
          style={[
            styles.customSwitchTrack,
            isWomenBooking ? styles.customSwitchTrackActive : styles.customSwitchTrackInactive
          ]}
        >
          <View
            style={[
              styles.customSwitchThumb,
              isWomenBooking ? styles.customSwitchThumbActive : styles.customSwitchThumbInactive
            ]}
          />
        </TouchableOpacity>
      </View>

<TouchableOpacity
  activeOpacity={0.92}
  style={styles.searchButton}
  onPress={handleSearchBuses}
  disabled={searchingBuses}
>

  <LinearGradient
    colors={["#CE1538", "#9D0A1B"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.searchButtonGradient}
  >

    {
      searchingBuses ? (

        <ActivityIndicator
          size="small"
          color="#FFFFFF"
        />

      ) : (

        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color="#FFFFFF"
        />
      )
    }


    <Text style={styles.searchButtonText}>

      {
        searchingBuses
          ? "Searching..."
          : "Search buses"
      }

    </Text>

  </LinearGradient>

</TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Next Journey</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.journeyTopRow}>
          <View style={styles.tonightBadge}>
            <Text style={styles.tonightBadgeText}>TONIGHT</Text>
          </View>
          <View style={styles.departureWrap}>
            <Text style={styles.departureTime}>{nextJourney.time}</Text>
            <Text style={styles.departureLabel}>DEPARTURE</Text>
          </View>
        </View>

        <Text style={styles.journeyRoute}>{nextJourney.route}</Text>

        <View style={styles.journeyDivider} />

        <View style={styles.journeyBottomRow}>
          <View style={styles.ticketWrap}>
            <MaterialCommunityIcons
              name="ticket-confirmation-outline"
              size={14}
              color="#9CA3AF"
            />
            <Text style={styles.ticketText}>Ticket: {nextJourney.ticket}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85}>
            <Text style={styles.viewDetailsText}>VIEW DETAILS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
      </View>

      <View style={styles.historyList}>
        {recentSearches.length > 0 ? (
          recentSearches.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              style={styles.historyCard}
              onPress={() => applyRecentSearch(item)}
            >
              <View style={styles.historyIconBox}>
                <MaterialCommunityIcons name="history" size={20} color="#E11D48" />
              </View>
              <View style={styles.historyTextWrap}>
                <Text style={styles.historyRoute}>
                  {item.fromCityName} <Text style={styles.routeArrow}>{"->"}</Text> {item.toCityName}
                </Text>
                <Text style={styles.historyMeta}>
                  {formatRecentSearchTime(item.updatedAt)} • {formatJourneyDateLabel(item.journeyDate)}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#374151" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.historyEmptyCard}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#C8102E" />
            <Text style={styles.historyEmptyText}>
              Your recent bus searches will appear here after you search a route.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Exclusive Offers</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offerArtworkOnlyWrap}>
        <ExclusiveOfferBooking width="100%" height="100%" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        <TouchableOpacity activeOpacity={0.85}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.routesRow}
      >
        {popularRoutes.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            style={[styles.routeCard, { width: routeCardWidth }]}
          >
            <View style={[styles.routeArt, { height: routeCardHeight }]}>
              {renderRouteIllustration(item.illustration)}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      </ScrollView>
<Modal
  visible={cityModalVisible}
  animationType="slide"
  transparent
  onRequestClose={() =>
    setCityModalVisible(false)
  }
>

  <View style={styles.modalOverlay}>

    <View style={styles.cityModal}>

      <View style={styles.modalHeader}>

        <Text style={styles.modalTitle}>
          {
            cityPickerType === "from"
              ? "Select From City"
              : "Select To City"
          }
        </Text>

        <TouchableOpacity
          onPress={() =>
            setCityModalVisible(false)
          }
        >

          <MaterialCommunityIcons
            name="close"
            size={25}
            color="#333333"
          />

        </TouchableOpacity>

      </View>


      <View style={styles.citySearchBox}>

        <MaterialCommunityIcons
          name="magnify"
          size={21}
          color="#777777"
        />

        <TextInput
          value={citySearchText}
          onChangeText={
            handleCitySearch
          }
          placeholder="Search city"
          placeholderTextColor="#9CA3AF"
          style={styles.citySearchInput}
          autoFocus
        />

        {cityLoading && (
          <ActivityIndicator
            size="small"
            color="#C8102E"
          />
        )}

      </View>


      {
        citySearchText.length < 2 ? (

          <Text style={styles.cityHelpText}>
            Enter at least 2 characters
            to search a city.
          </Text>

        ) : null
      }


      <FlatList
        data={cityResults}
        keyExtractor={(item) =>
          String(item.id)
        }
        keyboardShouldPersistTaps="handled"

        renderItem={({ item }) => (

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.cityResultRow}
            onPress={() =>
              handleSelectCity(item)
            }
          >

            <MaterialCommunityIcons
              name="map-marker-outline"
              size={21}
              color="#C8102E"
            />

            <View style={styles.cityResultText}>

              <Text style={styles.cityResultName}>
                {item.city_name}
              </Text>

              {
                item.state_name ? (

                  <Text
                    style={
                      styles.cityResultState
                    }
                  >
                    {item.state_name}
                  </Text>

                ) : null
              }

            </View>

          </TouchableOpacity>

        )}

        ListEmptyComponent={
          citySearchText.length >= 2 &&
          !cityLoading
            ? (
              <Text
                style={
                  styles.cityEmptyText
                }
              >
                No cities found.
              </Text>
            )
            : null
        }
      />

    </View>

  </View>

</Modal>
<Modal
  visible={dateModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() =>
    setDateModalVisible(false)
  }
>

  <View style={styles.modalOverlay}>

    <View style={styles.dateModal}>

      <View style={styles.modalHeader}>

        <Text style={styles.modalTitle}>
          Select Date
        </Text>

        <TouchableOpacity
          onPress={() =>
            setDateModalVisible(false)
          }
        >

          <MaterialCommunityIcons
            name="close"
            size={25}
            color="#333333"
          />

        </TouchableOpacity>

      </View>


      <View style={styles.calendarHeaderRow}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.calendarTodayButton}
          onPress={() => {
            if (todayChip) {
              setSelectedDateId(todayChip.id);
            }
          }}
        >
          <Text style={styles.calendarTodayButtonText}>Today</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarWeekRow}>
        {CALENDAR_WEEKDAYS.map((weekday) => (
          <View key={weekday} style={styles.calendarWeekCell}>
            <Text style={styles.calendarWeekText}>{weekday}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        style={styles.calendarScroll}
        showsVerticalScrollIndicator={false}
      >
        {calendarMonths.map((month) => (
          <View key={month.key} style={styles.calendarMonthSection}>
            <Text style={styles.calendarMonthTitle}>{month.title}</Text>

            <View style={styles.calendarGrid}>
              {month.chips.map((item) => {
                const selected = selectedDateId === item.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    disabled={
                      item.isPlaceholder ||
                      item.isDisabled
                    }
                    style={[
                      styles.calendarDateChip,
                      item.isPlaceholder &&
                        styles.calendarDateChipPlaceholder,
                      selected &&
                        styles.calendarDateChipSelected,
                    ]}
                    onPress={() => {
                      setSelectedDateId(item.id);
                      setDateModalVisible(false);
                    }}
                  >
                    {item.isPlaceholder ? null : (
                      <Text
                        style={[
                          styles.calendarDateChipDate,
                          item.isDisabled &&
                            styles.calendarDateChipDateDisabled,
                          item.isWeekend &&
                            styles.calendarDateChipDateWeekend,
                          selected &&
                            styles.calendarDateChipDateSelected,
                        ]}
                      >
                        {item.date}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

    </View>

  </View>

</Modal>
<BusBookingStatusPopup
  visible={popup.visible}
  title={popup.title}
  message={popup.message}
  variant={popup.variant}
  buttonText={popup.buttonText}
  onClose={hidePopup}
/>
    </>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F5F1",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 0,
    borderWidth: 1.2,
    borderColor: "#D4D4D8",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginTop: 14,
  },
  inputStack: {
    position: "relative",
  },
  routeSection: {
    position: "relative",
    overflow: "visible",
  },
  routeRow: {
    minHeight: 74,
    paddingHorizontal: 18,
    paddingRight: 74,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  routePlaceholder: {
    marginLeft: 14,
    color: "#595959",
    fontSize: 18,
    fontWeight: "500",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#E4E4E7",
    marginLeft: 56,
    marginRight: 56,
  },
  swapButtonWrap: {
    position: "absolute",
    right: 16,
    top: 53,
    zIndex: 3,
  },
  swapButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#D61A33",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dateJourneyRow: {
    minHeight: 92,
    borderTopWidth: 1,
    borderTopColor: "#E4E4E7",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  womenBookingRow: {
    minHeight: 56,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: "#D4D4D8",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  customSwitchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  customSwitchTrackActive: {
    backgroundColor: "#CE1538",
  },
  customSwitchTrackInactive: {
    backgroundColor: "#E4E4E7",
  },
  customSwitchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1.5,
  },
  customSwitchThumbActive: {
    alignSelf: "flex-end",
  },
  customSwitchThumbInactive: {
    alignSelf: "flex-start",
  },
  womenBookingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  womenBookingText: {
    marginLeft: 12,
    flex: 1,
  },
  womenBookingTitle: {
    color: "#222222",
    fontSize: 17,
    fontWeight: "700",
  },
  womenBookingSub: {
    marginTop: 2,
    color: "#71717A",
    fontSize: 11,
    fontWeight: "500",
  },
  dateJourneyInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateJourneyTextWrap: {
    marginLeft: 12,
  },
  dateJourneyLabel: {
    color: "#222222",
    fontSize: 14,
    fontWeight: "500",
  },
  dateJourneyValue: {
    color: "#222222",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 3,
  },
  dateJourneyHint: {
    marginTop: 4,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  dateJourneyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateBadge: {
    minWidth: 96,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FCE7EA",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateBadgeText: {
    color: "#C8102E",
    fontSize: 12,
    fontWeight: "700",
  },
  datePillsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateActionPill: {
    minWidth: 82,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFCED1",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dateActionPillText: {
    color: "#444444",
    fontSize: 13,
    fontWeight: "600",
  },
  dateActionPillActive: {
    backgroundColor: "#C8102E",
  },
  dateActionPillTextActive: {
    color: "#FFFFFF",
  },
  searchButton: {
    marginTop: 18,
    marginHorizontal: 0,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  searchButtonGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderRadius: 22,
  },
  searchButtonText: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionAction: {
    color: "#C8102E",
    fontSize: 14,
    fontWeight: "700",
  },
  dateRow: {
    gap: 12,
    paddingRight: 6,
  },
  dateChip: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#E8E7E6",
    alignItems: "center",
    justifyContent: "center",
  },
  dateChipActive: {
    backgroundColor: "#C8102E",
  },
  dateChipDay: {
    fontSize: 9,
    color: "#7C7C7C",
    fontWeight: "700",
  },
  dateChipDayActive: {
    color: "rgba(255,255,255,0.78)",
  },
  dateChipDate: {
    marginTop: 4,
    fontSize: 24,
    color: "#3F3F46",
    fontWeight: "800",
    lineHeight: 26,
  },
  dateChipDateActive: {
    color: "#FFFFFF",
  },
  journeyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 14,
  },
  journeyTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tonightBadge: {
    backgroundColor: "#FEE2E2",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tonightBadgeText: {
    color: "#EF4444",
    fontSize: 9,
    fontWeight: "800",
  },
  departureWrap: {
    alignItems: "flex-end",
  },
  departureTime: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "700",
  },
  departureLabel: {
    color: "#A1A1AA",
    fontSize: 9,
    fontWeight: "700",
  },
  journeyRoute: {
    marginTop: 8,
    color: "#3F3F46",
    fontSize: 18,
    fontWeight: "800",
  },
  journeyDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  journeyBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  ticketText: {
    marginLeft: 6,
    color: "#71717A",
    fontSize: 12,
    fontWeight: "500",
  },
  viewDetailsText: {
    color: "#C8102E",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FCEBEC",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  historyIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FAD4D7",
    alignItems: "center",
    justifyContent: "center",
  },
  historyTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  historyRoute: {
    color: "#3F3F46",
    fontSize: 15,
    fontWeight: "700",
  },
  routeArrow: {
    color: "#EF4444",
  },
  historyMeta: {
    marginTop: 2,
    color: "#A1A1AA",
    fontSize: 10,
    fontWeight: "500",
  },
  historyEmptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3DADF",
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  historyEmptyText: {
    flex: 1,
    marginLeft: 10,
    color: "#8A8A8A",
    fontSize: 12,
    lineHeight: 18,
  },
  viewAllText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
  },
  offerArtworkOnlyWrap: {
    width: "auto",
    height: 130,
    marginLeft: -34,
    marginRight: -34,
  },
  routesRow: {
    gap: 12,
    paddingRight: 2,
    paddingBottom: 16,
  },
  routeCard: {
  },
  routeArt: {
    width: "100%",
  },
  routeTextWrap: {
  marginLeft: 14,
  flex: 1,
},

routeLabel: {
  fontSize: 12,
  color: "#8A8A8A",
  fontWeight: "500",
},

routeValue: {
  marginTop: 3,
  fontSize: 20,
  color: "#222222",
  fontWeight: "700",
},

routeValuePlaceholder: {
  color: "#595959",
  fontWeight: "500",
},

routeState: {
  marginTop: 3,
  fontSize: 12,
  color: "#8A8A8A",
},


/*
|--------------------------------------------------------------------------
| Journey Time
|--------------------------------------------------------------------------
*/

timeJourneyRow: {
  minHeight: 64,
  borderTopWidth: 1.5,
  borderTopColor: "#D4D4D8",
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

timeJourneyInfo: {
  flexDirection: "row",
  alignItems: "center",
},

timeJourneyTextWrap: {
  marginLeft: 12,
},

timeJourneyLabel: {
  color: "#555555",
  fontSize: 12,
  fontWeight: "500",
},

timeJourneyValue: {
  marginTop: 2,
  color: "#222222",
  fontSize: 17,
  fontWeight: "700",
},


/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.35)",
  justifyContent: "flex-end",
},

  cityModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    height: "72%",
  },

  dateModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 14,
    paddingBottom: 8,
    maxHeight: "86%",
  },

modalHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  paddingBottom: 18,
  paddingTop: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#ECECEC",
  marginBottom: 0,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F1F22",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  calendarMonthTitle: {
    color: "#1F1F22",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 18,
  },
  calendarMonthSubtitle: {
    marginTop: 4,
    color: "#8A8A8A",
    fontSize: 12,
    fontWeight: "500",
  },
  calendarTodayButton: {
    height: 32,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: "#FFF1F3",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarTodayButtonText: {
    color: "#C8102E",
    fontSize: 11,
    fontWeight: "700",
  },
  calendarWeekRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
  },
  calendarWeekCell: {
    width: "14.285%",
    alignItems: "center",
  },
  calendarWeekText: {
    color: "#7A7A80",
    fontSize: 12,
    fontWeight: "500",
  },
  calendarScroll: {
    flexGrow: 0,
  },
  calendarMonthSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingBottom: 0,
  },
  calendarDateChip: {
    width: "14.285%",
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 0,
  },
  calendarDateChipPlaceholder: {
    backgroundColor: "transparent",
  },
  calendarDateChipSelected: {
    backgroundColor: "#1F1F22",
  },
  calendarDateChipDate: {
    fontSize: 18,
    color: "#1F1F22",
    fontWeight: "500",
    lineHeight: 20,
  },
  calendarDateChipDateDisabled: {
    color: "#C6C6CC",
  },
  calendarDateChipDateWeekend: {
    color: "#D43C52",
  },
  calendarDateChipDateSelected: {
    color: "#FFFFFF",
  },

citySearchBox: {
  height: 48,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#D4D4D8",
  paddingHorizontal: 14,
  flexDirection: "row",
  alignItems: "center",
},

citySearchInput: {
  flex: 1,
  marginLeft: 8,
  fontSize: 16,
  color: "#222222",
},

cityHelpText: {
  textAlign: "center",
  marginTop: 30,
  color: "#9CA3AF",
},

cityResultRow: {
  minHeight: 60,
  flexDirection: "row",
  alignItems: "center",
  borderBottomWidth: 1,
  borderBottomColor: "#EEEEEE",
},

cityResultText: {
  marginLeft: 12,
},

cityResultName: {
  fontSize: 16,
  fontWeight: "700",
  color: "#222222",
},

cityResultState: {
  fontSize: 12,
  color: "#8A8A8A",
  marginTop: 2,
},

cityEmptyText: {
  textAlign: "center",
  marginTop: 40,
  color: "#8A8A8A",
},

timeGrid: {
  paddingBottom: 30,
},

timeChip: {
  flex: 1,
  margin: 5,
  minHeight: 44,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  alignItems: "center",
  justifyContent: "center",
},

timeChipSelected: {
  backgroundColor: "#C8102E",
  borderColor: "#C8102E",
},

timeChipText: {
  color: "#333333",
  fontSize: 13,
  fontWeight: "600",
},

timeChipTextSelected: {
  color: "#FFFFFF",
},
});
