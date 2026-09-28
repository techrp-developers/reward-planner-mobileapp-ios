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
import Busoperatorimg1 from "../../assets/banners/busoperatorimg1.svg";
import Busoperatorimg2 from "../../assets/banners/busoperatorimg2.svg";
import Busoperatorimg3 from "../../assets/banners/busoperatorimg3.svg";
import Luxurybusimg from "../../assets/banners/Luxurybusimg.svg";

type FilterCategoryId =
  | "bus-type"
  | "departure-time"
  | "amenities"
  | "bus-operator"
  | "boarding-points"
  | "dropping-points";

type FilterCategory = {
  id: FilterCategoryId;
  label: string;
};

type FilterOption = {
  id: string;
  label: string;
  available: string;
  Icon: React.ComponentType<{ width?: number | string; height?: number | string }>;
};

type TimeOption = {
  id: string;
  title: string;
  subtitle: string;
  count: string;
  Icon: React.ComponentType<{ width?: number | string; height?: number | string }>;
};

type AmenityOption = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ width?: number | string; height?: number | string }>;
};

type OperatorOption = {
  id: string;
  title: string;
  buses: string;
  Image: React.ComponentType<{ width?: number | string; height?: number | string }>;
};

type PointOption = {
  id: string;
  title: string;
  subtitle: string;
  count: string;
};

const filterCategories: FilterCategory[] = [
  { id: "bus-type", label: "Bus Type" },
  { id: "departure-time", label: "Departure time" },
  { id: "amenities", label: "Amenities" },
  { id: "bus-operator", label: "Bus Operator" },
  { id: "boarding-points", label: "Boarding Points" },
  { id: "dropping-points", label: "Dropping Points" },
];

const busTypeOptions: FilterOption[] = [
  { id: "volvo", label: "Volvo buses", available: "37 Available", Icon: FilterIcon1 },
  { id: "ac", label: "AC", available: "30 Available", Icon: FilterIcon2 },
  { id: "non-ac", label: "NON AC", available: "8 Available", Icon: FilterIcon3 },
];

const seatTypeOptions: FilterOption[] = [
  { id: "seater", label: "SEATER", available: "5 Available", Icon: FilterIcon4 },
  { id: "sleeper", label: "SLEEPER", available: "37 Available", Icon: FilterIcon5 },
];

const departureOptions: TimeOption[] = [
  { id: "before-6", title: "Before 6 AM", subtitle: "Early morning", count: "12", Icon: TimeIcon1 },
  { id: "6-12", title: "6 AM -12\nPM", subtitle: "Morning", count: "24", Icon: TimeIcon1 },
  { id: "12-6", title: "12 PM - 6\nPM", subtitle: "Afternoon", count: "18", Icon: TimeIcon2 },
  { id: "after-6", title: "After 6 PM", subtitle: "Evening/night", count: "18", Icon: TimeIcon3 },
];

const amenitiesOptions: AmenityOption[] = [
  { id: "wifi", label: "WiFi", Icon: Amenities1 },
  { id: "water", label: "Water\nBottle", Icon: Amenities2 },
  { id: "charging", label: "Charging\nPt.", Icon: Amenities3 },
  { id: "blanket", label: "Blanket", Icon: Amenities4 },
];

const operatorOptions: OperatorOption[] = [
  { id: "greenline", title: "Greenline Express", buses: "24 buses available", Image: Busoperatorimg1 },
  { id: "blue-diamond", title: "Blue Diamond", buses: "12 buses available", Image: Busoperatorimg2 },
  { id: "royal-heritage", title: "Royal Heritage", buses: "8 buses available", Image: Busoperatorimg3 },
];

const boardingPopular: PointOption[] = [
  { id: "boarding-majestic", title: "Majestic", subtitle: "Opposite KSR Railway\nStation", count: "24" },
  { id: "boarding-indiranagar", title: "Indiranagar", subtitle: "Near CMH Hospital Road", count: "18" },
  { id: "boarding-electronic", title: "Electronic City", subtitle: "Toll Gate No 1", count: "15" },
  { id: "boarding-marathahalli", title: "Marathahalli", subtitle: "Near Bridge Service Road", count: "32" },
  { id: "boarding-hebbal", title: "Hebbal", subtitle: "Below Hebbal Flyover", count: "9" },
];

const boardingOther: PointOption[] = [
  { id: "boarding-silk-board", title: "Silk Board", subtitle: "", count: "12" },
  { id: "boarding-koramangala", title: "Koramangala", subtitle: "", count: "7" },
];

const droppingPopular: PointOption[] = [
  { id: "dropping-majestic", title: "Majestic", subtitle: "Opposite KSR Railway\nStation", count: "24" },
  { id: "dropping-indiranagar", title: "Indiranagar", subtitle: "Near CMH Hospital Road", count: "18" },
  { id: "dropping-electronic", title: "Electronic City", subtitle: "Toll Gate No 1", count: "15" },
  { id: "dropping-marathahalli", title: "Marathahalli", subtitle: "Near Bridge Service Road", count: "32" },
  { id: "dropping-hebbal", title: "Hebbal", subtitle: "Below Hebbal Flyover", count: "9" },
];

const droppingOther: PointOption[] = [
  { id: "dropping-silk-board", title: "Silk Board", subtitle: "", count: "12" },
  { id: "dropping-koramangala", title: "Koramangala", subtitle: "", count: "7" },
];

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
  item: FilterOption;
  selected: boolean;
  onPress: () => void;
}) {
  const Icon = item.Icon;

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.optionRow}>
      <View style={styles.optionInfoRow}>
        <View style={styles.optionIconWrap}>
          <Icon width={16} height={16} />
        </View>
        <View style={styles.optionTextWrap}>
          <Text style={styles.optionLabel}>{item.label}</Text>
          <Text style={styles.optionAvailability}>{item.available}</Text>
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
  const [selectedCategory, setSelectedCategory] = React.useState<FilterCategoryId>("bus-type");
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

  const filterPointOptions = React.useCallback((items: PointOption[], query: string) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) =>
      `${item.title} ${item.subtitle}`.toLowerCase().includes(normalizedQuery)
    );
  }, []);

  const renderDepartureTime = () => (
    <View>
      {departureOptions.map((item) => {
        const selected = selectedOptions.includes(item.id);
        const Icon = item.Icon;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={[styles.timeCard, selected ? styles.timeCardSelected : null]}
          >
            <View style={[styles.timeIconCircle, selected ? styles.timeIconCircleSelected : null]}>
              <Icon width={18} height={18} />
            </View>

            <View style={styles.timeTextWrap}>
              <Text style={styles.timeTitle}>{item.title}</Text>
              <Text style={styles.timeSubtitle}>{item.subtitle}</Text>
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
        {amenitiesOptions.map((item) => {
          const selected = selectedOptions.includes(item.id);
          const Icon = item.Icon;

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

              <Icon width={38} height={38} />

              <Text style={styles.amenityLabel}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderOperators = () => {
    const filteredOperators = operatorOptions.filter((item) =>
      item.title.toLowerCase().includes(operatorSearch.trim().toLowerCase())
    );

    return (
      <View>
      <View style={styles.operatorsHeader}>
        <Text style={styles.operatorsTitle}>Top Bus{"\n"}Operators</Text>

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
        const OperatorImage = item.Image;

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={styles.operatorRow}
          >
            <View style={styles.operatorLogoCard}>
              <OperatorImage width="100%" height="100%" />
            </View>

            <View style={styles.operatorTextWrap}>
              <Text style={styles.operatorTitle}>{item.title}</Text>
              <Text style={styles.operatorSubtitle}>{item.buses}</Text>
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
    popular: PointOption[],
    other: PointOption[],
    searchValue: string,
    onChangeSearch: (value: string) => void
  ) => {
    const filteredPopular = filterPointOptions(popular, searchValue);
    const filteredOther = filterPointOptions(other, searchValue);

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

      <Text style={styles.listSectionLabel}>Popular points</Text>
      {filteredPopular.map((item) => {
        const selected = selectedOptions.includes(item.id);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={[styles.locationRow, selected ? styles.locationRowSelected : null]}
          >
            <View style={styles.locationTextWrap}>
              <Text style={styles.locationTitle}>{item.title}</Text>
              {item.subtitle ? <Text style={styles.locationSubtitle}>{item.subtitle}</Text> : null}
            </View>

            <Text style={styles.locationCount}>{item.count}</Text>
            <FilterCheckbox selected={selected} />
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.listSectionLabel, styles.otherLocationsLabel]}>Other Locations</Text>
      {filteredOther.map((item) => {
        const selected = selectedOptions.includes(item.id);

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            onPress={() => handleOptionPress(item.id)}
            style={styles.otherLocationRow}
          >
            <Text style={styles.otherLocationTitle}>{item.title}</Text>
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
          <SectionHeader title="BUS TYPE" />
          {busTypeOptions.map((item) => (
            <FilterOptionRow
              key={item.id}
              item={item}
              selected={selectedOptions.includes(item.id)}
              onPress={() => handleOptionPress(item.id)}
            />
          ))}

          <Text style={[styles.sectionTitle, styles.sectionTitleWithGap]}>SEAT TYPE</Text>
          {seatTypeOptions.map((item) => (
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
        boardingPopular,
        boardingOther,
        boardingSearch,
        setBoardingSearch
      );
    }

    return renderLocationList(
      "Search dropping points...",
      droppingPopular,
      droppingOther,
      droppingSearch,
      setDroppingSearch
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
