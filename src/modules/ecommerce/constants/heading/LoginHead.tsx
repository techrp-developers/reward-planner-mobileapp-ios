import React from "react";
import {
  View,
  useWindowDimensions,
  StatusBar,
  TextInput,
  StyleSheet,
  Image,
} from "react-native";
import BackgroundImage from "../../../../assets/homepage/navbar_bg.jpg";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  showSearch?: boolean;
  search?: string;
  onChangeSearch?: (v: string) => void;
  onFocusSearch?: () => void;
};

function LoginHead({ showSearch, search, onChangeSearch, onFocusSearch }: Props) {
  const { width } = useWindowDimensions();
  const HEADER_HEIGHT = Math.round(width * 0.4);

  return (
    <View style={[styles.container, { height: HEADER_HEIGHT }]}>
      <StatusBar translucent backgroundColor="transparent" />

      <Image
        source={BackgroundImage}
        style={styles.absoluteFill}
        resizeMode="cover"
      />

      {showSearch && (
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#111827" />
          <TextInput
            placeholder="Search products"
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            value={search}
            onChangeText={onChangeSearch}
            onFocus={onFocusSearch}
          />
        </View>
      )}
    </View>
  );
}

export default LoginHead;

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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
    textAlignVertical: "center",
  },
});