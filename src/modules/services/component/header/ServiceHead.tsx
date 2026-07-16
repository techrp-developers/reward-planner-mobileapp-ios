import React from "react";
import {
  View,
  useWindowDimensions,
  StatusBar,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import ServiceTop from "../../../../assets/homepage/service_top_nav.png";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  showSearch?: boolean;
  search?: string;
  onChangeSearch?: (v: string) => void;
  onFocusSearch?: () => void;
  onBackPress?: () => void;
  autoFocus?: boolean;
};

function ServiceHead({ showSearch, search, onChangeSearch, onFocusSearch, onBackPress, autoFocus }: Props) {
  const { width } = useWindowDimensions();
  const HEADER_HEIGHT = Math.round(width * 0.4);

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT }]}>
      <StatusBar translucent backgroundColor="transparent" />
      <Image source={ServiceTop} style={styles.absoluteFill} resizeMode="cover" />

      {onBackPress && (
        <TouchableOpacity
          onPress={onBackPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {showSearch && (
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#A654CD" />
          <TextInput
            placeholder='Search "PAN Card, ITR Filing…"'
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
            onFocus={onFocusSearch}
            returnKeyType="search"
            autoFocus={autoFocus}
          />
          {search && search.length > 0 && (
            <TouchableOpacity onPress={() => onChangeSearch?.("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default ServiceHead;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  searchWrap: {
    position: "absolute",
    bottom: 18,
    left: 18,
    right: 18,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
});
