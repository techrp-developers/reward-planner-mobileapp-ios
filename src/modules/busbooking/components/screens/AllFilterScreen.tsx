import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import LinearGradient from "react-native-linear-gradient";
import type { BusBookingStackParamList } from "../../navigation/BusBookingStack";
import type {
  BusListingFacetOption,
  BusListingFacets,
} from "../../utils/busListingFilters";
import FilterIcon1 from "../../assets/icons/filtericon1.svg";
import FilterIcon2 from "../../assets/icons/filtericon2.svg.svg";
import FilterIcon3 from "../../assets/icons/filtericon3.svg";
import FilterIcon4 from "../../assets/icons/filtericon4.svg";
import FilterIcon5 from "../../assets/icons/filtericon5.svg";
import TimeIcon1 from "../../assets/icons/timeicon1.svg";
import TimeIcon2 from "../../assets/icons/timeicon2.svg";
import TimeIcon3 from "../../assets/icons/timeicon3.svg";
import Amenities1 from "../../assets/icons/amenities1.svg";
import Amenities2 from "../../assets/icons/amenities2.svg";
import Amenities3 from "../../assets/icons/amenities3.svg";
import Amenities4 from "../../assets/icons/amenities4.svg";
import Luxurybusimg from "../../assets/banners/Luxurybusimg.svg";

type FilterCategoryId =
  | "bus-type"
  | "departure-time"
  | "amenities"
  | "bus-operator"
  | "boarding-points"
  | "dropping-points";

type SvgIcon = React.ComponentType<{ width?: number | string; height?: number | string }>;

// Artwork for each option. The options themselves, and how many buses match
// them, always come from the current search (route.params.facets).
const OPTION_ICONS: Record<string, SvgIcon> = {
  volvo: FilterIcon1,
  ac: FilterIcon2,
  "non-ac": FilterIcon3,
  seater: FilterIcon4,
  sleeper: FilterIcon5,
  "before-6": TimeIcon1,
  "6-12": TimeIcon1,
  "12-6": TimeIcon2,
  "after-6": TimeIcon3,
};

const DEPARTURE_SUBTITLES: Record<string, string> = {
  "before-6": "Early morning",
  "6-12": "Morning",
  "12-6": "Afternoon",
  "after-6": "Evening/night",
};

const getAmenityIcon = (label: string): SvgIcon | null => {
  const text = label.toLowerCase();

  if (/wi-?fi/.test(text)) return Amenities1;
  if (/water|bottle/.test(text)) return Amenities2;
  if (/charg|usb/.test(text)) return Amenities3;
  if (/blanket|linen/.test(text)) return Amenities4;

  return null;
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const formatBusCount = (count: number) =>
  `${count} ${count === 1 ? "bus" : "buses"} available`;

function FilterCheckbox({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
      {selected ? <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" /> : null}
    </View>
  );
}

function FilterOptionRow({
  item,
  selected,
  onPress,
}: {
  item: BusListingFacetOption;
  selected: boolean;
  onPress: () => void;
}) {
  const Icon = OPTION_ICONS[item.id];

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.optionRow}>
      <View style={styles.optionInfoRow}>
        <View style={styles.optionIconWrap}>
          {Icon ? <Icon width={16} height={16} /> : null}
        </View>
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionLabel}>{item.label}</Text>
          <Text style={styles.optionAvailability}>{item.count} Available</Text>
        </View>
      </View>
      <FilterCheckbox selected={selected} />
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export default function AllFilterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<BusBookingStackParamList>>();
  const route = useRoute<RouteProp<BusBookingStackParamList, "AllFilterScreen">>();
  const facets: BusListingFacets = route.params.facets;

  // A category is only listed when this search has something to filter by.
  const filterCategories = React.useMemo(
    () =>
      (
        [
          {
            id: "bus-type",
            label: "Bus Type",
            visible: facets.busTypes.length + facets.seatTypes.length > 0,
          },
          {
            id: "departure-time",
            label: "Departure time",
            visible: facets.departureTimes.length > 0,
          },
          { id: "amenities", label: "Amenities", visible: facets.amenities.length > 0 },
          { id: "bus-operator", label: "Bus Operator", visible: facets.operators.length > 0 },
          {
            id: "boarding-points",
            label: "Boarding Points",
            visible: facets.boardingPoints.length > 0,
          },
          {
            id: "dropping-points",
            label: "Dropping Points",
            visible: facets.droppingPoints.length > 0,
          },
        ] as Array<{ id: FilterCategoryId; label: string; visible: boolean }>
      ).filter((category) => category.visible),
    [facets]
  );

  const [selectedCategory, setSelectedCategory] = React.useState<FilterCategoryId | null>(
    () => filterCategories[0]?.id ?? null
  );
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>(
    () => route.params?.selectedOptions || []
  );
  const [operatorSearch, setOperatorSearch] = React.useState("");
  const [boardingSearch, setBoardingSearch] = React.useState("");
  const [droppingSearch, setDroppingSearch] = React.useState("");

  const handleOptionPress = React.useCallback((optionId: string) => {
    setSelectedOptions((current) =>
      current.includes(optionId)
        ? current.filter((item) => item !== optionId)
        : [...current, optionId]
    );
  }, []);

  const handleClearAll = React.useCallback(() => {
    setSelectedOptions([]);
    setOperatorSearch("");
    setBoardingSearch("");
    setDroppingSearch("");
  }, []);

  const handleApply = React.useCallback(() => {
    navigation.navigate("BusListingScreen", {
      selectedFilters: selectedOptions,
    } as any);
  }, [navigation, selectedOptions]);

  const filterByQuery = React.useCallback(
    (items: BusListingFacetOption[], query: string) => {
      const normalizedQuery = query.trim().toLowerCase();

      if (!normalizedQuery) {
        return items;
      }

      return items.filter((item) => item.label.toLowerCase().includes(normalizedQuery));
    },
    []
  );

  const renderDepartureTime = () => (
    <View>
      {facets.departureTimes.map((item) => {
        const selected = selectedOptions.includes(item.id);
        const Icon = OPTION_ICONS[item.id];

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={[styles.timeCard, selected ? styles.timeCardSelected : null]}
          >
            <View style={[styles.timeIconCircle, selected ? styles.timeIconCircleSelected : null]}>
              {Icon ? <Icon width={18} height={18} /> : null}
            </View>

            <View style={styles.timeTextWrap}>
              <Text style={styles.timeTitle}>{item.label}</Text>
              <Text style={styles.timeSubtitle}>{DEPARTURE_SUBTITLES[item.id]}</Text>
            </View>

            <Text style={styles.timeCount}>{item.count}</Text>
            <FilterCheckbox selected={selected} />
          </TouchableOpacity>
        );
      })}

      <View style={styles.departureImage}>
        <Luxurybusimg width="100%" height="100%" />
      </View>
    </View>
  );

  const renderAmenities = () => (
    <View>
      <View style={styles.amenitiesHeader}>
        <Text style={styles.amenitiesTitle}>Common{"\n"}Amenities</Text>
        <View style={styles.multiSelectPill}>
          <Text style={styles.multiSelectText}>Select multiple</Text>
        </View>
      </View>

      <View style={styles.amenitiesGrid}>
        {facets.amenities.map((item) => {
          const selected = selectedOptions.includes(item.id);
          const Icon = getAmenityIcon(item.label);

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.85}
              onPress={() => handleOptionPress(item.id)}
              style={[styles.amenityCard, selected ? styles.amenityCardSelected : null]}
            >
              <View style={styles.amenityCheckboxWrap}>
                <FilterCheckbox selected={selected} />
              </View>

              {Icon ? (
                <Icon width={38} height={38} />
              ) : (
                <MaterialCommunityIcons name="check-decagram-outline" size={34} color="#D7192D" />
              )}

              <Text style={styles.amenityLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderOperators = () => {
    const filteredOperators = filterByQuery(facets.operators, operatorSearch);

    return (
      <View>
      <View style={styles.operatorsHeader}>
        <Text style={styles.operatorsTitle}>Bus{"\n"}Operators</Text>

        <View style={styles.searchPill}>
          <MaterialCommunityIcons name="magnify" size={16} color="#8A848A" />
          <TextInput
            value={operatorSearch}
            onChangeText={setOperatorSearch}
            placeholder="Search"
            placeholderTextColor="#7F7D83"
            style={styles.searchPillInput}
          />
        </View>
      </View>

      {filteredOperators.map((item) => {
        const selected = selectedOptions.includes(item.id);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={styles.operatorRow}
          >
            <View style={[styles.operatorLogoCard, styles.operatorInitialsCard]}>
              <Text style={styles.operatorInitials}>{getInitials(item.label)}</Text>
            </View>

            <View style={styles.operatorTextWrap}>
              <Text style={styles.operatorTitle}>{item.label}</Text>
              <Text style={styles.operatorSubtitle}>{formatBusCount(item.count)}</Text>
            </View>

            <FilterCheckbox selected={selected} />
          </TouchableOpacity>
        );
      })}
      </View>
    );
  };

  const renderLocationList = (
    placeholder: string,
    points: BusListingFacetOption[],
    searchValue: string,
    onChangeSearch: (value: string) => void
  ) => {
    const filteredPoints = filterByQuery(points, searchValue);

    return (
      <View>
      <View style={styles.searchInputWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color="#8F797A" />
        <TextInput
          value={searchValue}
          onChangeText={onChangeSearch}
          placeholder={placeholder}
          placeholderTextColor="#C8B7BA"
          style={styles.searchInput}
        />
      </View>

      {filteredPoints.map((item) => {
        const selected = selectedOptions.includes(item.id);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={[styles.locationRow, selected ? styles.locationRowSelected : null]}
          >
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationTitle}>{item.label}</Text>
            </View>

            <Text style={styles.locationCount}>{item.count}</Text>
            <FilterCheckbox selected={selected} />
          </TouchableOpacity>
        );
      })}
      </View>
    );
  };

  const renderContent = () => {
    if (selectedCategory === "bus-type") {
      return (
        <View>
          {facets.busTypes.length > 0 ? <SectionHeader title="BUS TYPE" /> : null}
          {facets.busTypes.map((item) => (
            <FilterOptionRow
              key={item.id}
              item={item}
              selected={selectedOptions.includes(item.id)}
              onPress={() => handleOptionPress(item.id)}
            />
          ))}

          {facets.seatTypes.length > 0 ? (
            <Text
              style={[
                styles.sectionTitle,
                facets.busTypes.length > 0 ? styles.sectionTitleWithGap : null,
              ]}
            >
              SEAT TYPE
            </Text>
          ) : null}
          {facets.seatTypes.map((item) => (
            <FilterOptionRow
              key={item.id}
              item={item}
              selected={selectedOptions.includes(item.id)}
              onPress={() => handleOptionPress(item.id)}
            />
          ))}
        </View>
      );
    }

    if (selectedCategory === "departure-time") {
      return renderDepartureTime();
    }

    if (selectedCategory === "amenities") {
      return renderAmenities();
    }

    if (selectedCategory === "bus-operator") {
      return renderOperators();
    }

    if (selectedCategory === "boarding-points") {
      return renderLocationList(
        "Search boarding points...",
        facets.boardingPoints,
        boardingSearch,
        setBoardingSearch
      );
    }

    if (selectedCategory === "dropping-points") {
      return renderLocationList(
        "Search dropping points...",
        facets.droppingPoints,
        droppingSearch,
        setDroppingSearch
      );
    }

    return (
      <Text style={styles.optionAvailability}>
        There are no buses to filter for this search.
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#7A747D" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Filter buses</Text>

        <View style={styles.headerActions} />
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Sort by</Text>

          {filterCategories.map((category) => {
            const isSelected = selectedCategory === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(category.id)}
                style={[styles.sidebarItem, isSelected ? styles.sidebarItemSelected : null]}
              >
                {isSelected ? <View style={styles.sidebarIndicator} /> : null}
                <Text
                  style={[
                    styles.sidebarItemText,
                    isSelected ? styles.sidebarItemTextSelected : null,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          style={styles.contentPane}
          contentContainerStyle={styles.contentPaneInner}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </View>

      <View style={styles.bottomBar}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleClearAll} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear all</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} onPress={handleApply} style={styles.applyButtonWrap}>
          <LinearGradient
            colors={["#D7192D", "#B81525"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.applyButton}
          >
            <Text style={styles.applyButtonText}>View buses</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  headerTitle: {
    flex: 1,
    color: "#302B31",
    fontSize: 17,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#5F7280",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#E9E6E2",
  },
  body: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
  },
  sidebar: {
    width: 138,
    backgroundColor: "#F4F4F4",
    borderRightWidth: 1,
    borderRightColor: "#EEE9E4",
  },
  sidebarTitle: {
    color: "#1F1B21",
    fontSize: 15,
    fontWeight: "700",
    paddingLeft: 20,
    paddingRight: 10,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "#F1F1F1",
  },
  sidebarItem: {
    height: 80,
    justifyContent: "center",
    paddingLeft: 20,
    paddingRight: 10,
    borderTopWidth: 1,
    borderTopColor: "#E9E3DE",
    backgroundColor: "#F7F7F7",
  },
  sidebarItemSelected: {
    backgroundColor: "#FFFFFF",
  },
  sidebarIndicator: {
    position: "absolute",
    left: 4,
    top: 6,
    bottom: 6,
    width: 5,
    backgroundColor: "#D7192D",
  },
  sidebarItemText: {
    color: "#554C52",
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  sidebarItemTextSelected: {
    color: "#D7192D",
    fontSize: 14.5,
    fontWeight: "600",
    lineHeight: 19,
  },
  contentPane: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentPaneInner: {
    paddingLeft: 20,
    paddingRight: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: "#2A252B",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.9,
    marginBottom: 14,
  },
  sectionTitleWithGap: {
    marginTop: 10,
  },
  optionRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  optionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },
  optionIconWrap: {
    width: 22,
    alignItems: "center",
    marginRight: 14,
  },
  optionTextWrap: {
    flex: 1,
  },
  optionLabel: {
    color: "#171319",
    fontSize: 14.5,
    fontWeight: "600",
  },
  optionAvailability: {
    marginTop: 1,
    color: "#8D878E",
    fontSize: 14.5,
    fontWeight: "600",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#CDA5AA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxSelected: {
    backgroundColor: "#D7192D",
    borderColor: "#D7192D",
  },
  timeCard: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F3DED8",
    backgroundColor: "#FFFDFB",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  timeCardSelected: {
    backgroundColor: "#FFF7F7",
    borderColor: "#F0B0B6",
  },
  timeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F0EE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  timeIconCircleSelected: {
    backgroundColor: "#FDEBEC",
  },
  timeTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  timeTitle: {
    color: "#262128",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  timeSubtitle: {
    color: "#918488",
    fontSize: 11,
    marginTop: 2,
  },
  timeCount: {
    color: "#6E676A",
    fontSize: 12,
    marginRight: 10,
  },
  departureImage: {
    width: "100%",
    height: 124,
    borderRadius: 18,
    marginTop: 4,
  },
  amenitiesHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  amenitiesTitle: {
    color: "#262128",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
  },
  multiSelectPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 13,
    backgroundColor: "#F3EFEE",
  },
  multiSelectText: {
    color: "#81787E",
    fontSize: 12,
    fontWeight: "700",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  amenityCard: {
    width: "47.5%",
    minHeight: 115,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F1DDD8",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginBottom: 12,
    position: "relative",
  },
  amenityCardSelected: {
    backgroundColor: "#FFF7F7",
    borderColor: "#F0B0B6",
  },
  amenityCheckboxWrap: {
    position: "absolute",
    top: 9,
    right: 9,
  },
  amenityLabel: {
    color: "#231F25",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 10,
  },
  operatorsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 10,
  },
  operatorsTitle: {
    color: "#262128",
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 18,
  },
  searchPill: {
    height: 40,
    minWidth: 118,
    borderRadius: 15,
    backgroundColor: "#F3F3F5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  searchPillInput: {
    flex: 1,
    color: "#7F7D83",
    fontSize: 13,
    fontWeight: "500",
    paddingVertical: 0,
    marginLeft: 4,
  },
  operatorRow: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  operatorLogoCard: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E9E8EE",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  operatorInitialsCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDECEF",
  },
  operatorInitials: {
    color: "#B81525",
    fontSize: 16,
    fontWeight: "800",
  },
  operatorTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  operatorTitle: {
    color: "#221E24",
    fontSize: 15,
    fontWeight: "500",
  },
  operatorSubtitle: {
    color: "#8A7F83",
    fontSize: 13,
    marginTop: 2,
  },
  searchInputWrap: {
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F5F2F2",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: "#857A7E",
    fontSize: 15,
    paddingVertical: 0,
    marginLeft: 8,
  },
  listSectionLabel: {
    color: "#A48386",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },
  locationRow: {
    minHeight: 56,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 9,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  locationRowSelected: {
    backgroundColor: "#FDEDED",
  },
  locationTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  locationTitle: {
    color: "#231E23",
    fontSize: 15,
    fontWeight: "500",
  },
  locationSubtitle: {
    color: "#82777B",
    fontSize: 13,
    marginTop: 2,
    lineHeight: 14,
  },
  locationCount: {
    color: "#7E6D70",
    fontSize: 12,
    marginRight: 10,
  },
  otherLocationsLabel: {
    marginTop: 12,
  },
  otherLocationRow: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  otherLocationTitle: {
    flex: 1,
    color: "#231E23",
    fontSize: 15,
    fontWeight: "500",
  },
  bottomBar: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 29,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#ECE8E3",
  },
  clearButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.3,
    borderColor: "#1E1A20",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  clearButtonText: {
    color: "#1E1A20",
    fontSize: 15,
    fontWeight: "600",
  },
  applyButtonWrap: {
    flex: 1,
  },
  applyButton: {
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
